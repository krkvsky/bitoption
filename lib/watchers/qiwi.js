const Request = require('request-promise');
// const Tough = require('tough-cookie');
const FileCookieStore = require('tough-cookie-filestore');
const cheerio = require('cheerio');
const moment = require('moment');
const { assert } = require('chai');

// require('request-debug')(Request);

const config = require( '../../config' );

const Watcher = require('./watcher');

class QiwiWatcher extends Watcher {
    constructor(bot, pool, interval) {
        super(bot, pool, interval);

        let cookiejar = Request.jar(new FileCookieStore('./lib/watchers/db/cookies.json', { lockfile : true }));

        this.auth_request = Request.defaults({
            method: 'POST',
            jar : cookiejar,
            resolveWithFullResponse: true,
            followAllRedirects: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:39.0) Gecko/20100101 Firefox/39.0',
                'Accept': 'application/vnd.qiwi.sso-v1+json',
                'Accept-Language': 'ru;q=0.8,en-US;q=0.6,en;q=0.4',
                'Accept-Encoding': 'gzip, deflate, br',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json; charset=UTF-8',
            },
        });

        this.request = Request.defaults({
            jar : cookiejar,
            resolveWithFullResponse: true,
            followAllRedirects: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:39.0) Gecko/20100101 Firefox/39.0',
                'Accept': 'text/html, */*; q=0.01',
                'Accept-Language': 'ru;q=0.8,en-US;q=0.6,en;q=0.4',
                // 'Accept-Encoding': 'gzip, deflate, br',
                // 'X-Requested-With': 'XMLHttpRequest',
            },
        });

        this.start();
    }

    async start() {
        this.check_payments();
        super.start();
    }

    async is_authorized() {
        let response = await this.request({
            method: 'POST',
            uri: 'https://qiwi.com/person/state.action',
            headers: {
                'Referer': 'https://qiwi.com/main.action',
            },
        });

        if (!response.body.data) {
            await this.auth();
        }
    }

    async auth() {
        console.log('Qiwi authorization');

        response = await this.auth_request({
            uri: 'https://auth.qiwi.com/cas/tgts',
            json: {
                login: config.qiwi.account,
                password: config.qiwi.password,
            },
            headers: {
                'Referer': 'https://qiwi.com/main.action',
            },
        });

        let data = response.body;

        response = await this.auth_request({
            uri: 'https://auth.qiwi.com/cas/sts',
            json: {
                ticket: data.entity.ticket,
                service: 'https://qiwi.com/j_spring_cas_security_check',
            },
            headers: {
                'Referer': 'https://auth.qiwi.com/app/proxy?v=1',
            },
        });

        let data2 = response.body;

        response = await this.request({
            method: 'GET',
            uri: `https://qiwi.com/j_spring_cas_security_check?ticket=${data2.entity.ticket}`,
            headers: {
                'Referer': 'https://qiwi.com/main.action',
            },
        });

        console.log('Qiwi authorized');
    }

    async logout() {
        console.log('Qiwi logout');

        response = await this.request({
            method: 'POST',
            json: {},
            uri: 'https://qiwi.com/auth/logout.action',
            headers: {
                'Referer': 'https://qiwi.com/main.action',
            },
        });

        if (response.body.data) {
            await this.request({
                method: 'POST',
                uri: 'https://qiwi.com/auth/logout.action',
                form: {
                    token: response.body.data.token
                },
                headers: {
                    'Referer': 'https://qiwi.com/main.action',
                },
            });

            console.log('Qiwi logged out');
        }
    }

    async get_transactions(opts) {
        assert.isObject(opts);

        console.log('Qiwi get transactions');

        let post_form = {
            'conditions.directions': 'in',
            'conditions.status': 'SUCCESS',
            paymentModeValue: opts.usd ? 'qiwi_USD' : 'qiwi_RUB',
        };

        if (opts.start) {
            post_form = Object.assign(post_form, {
                daterange: true,
                start: opts.start,
                finish: opts.finish
            });
        }
        else {
            post_form.type = 1; // Сегодня
        }

        // type=[0,1,2,3] Все,Сегодня,Вчера,Неделя
        // daterange=true&start=xxx&finish=xxx
        // conditions.status=[SUCCESS,PROCESSED,ERROR] Оплаченные,Неоплаченные,Отмененные
        // paymentModeType=[QIWI,PHONE]
        // paymentModeValue=[qiwi_RUB,qiwi_USD]
        // conditions.directions=[in,out] Ввод,Вывод
        let body = await this.request({
            method: 'POST',
            uri: 'https://qiwi.com/user/report/list.action',
            form: post_form,
            headers: {
                'Referer': 'https://qiwi.com/main.action',
                'X-Requested-With': 'XMLHttpRequest',
            },
            resolveWithFullResponse: false,
        });

        // console.log(body);
        let dom = cheerio.load(body);

        let trans = [];

        dom('div.reports .status_SUCCESS').each(() => {
            let amount = parseFloat(dom('.IncomeWithExpend.income .cash',this).text().replace(/[\s]/g, ''));
            let deposit_id = parseInt(dom('.ProvWithComment .comment',this).text().replace(/[\s]/g, ''));
            let transaction = parseInt(dom('.DateWithTransaction .transaction', this).text().replace(/[\s]/g, ''));
            let date = dom('.DateWithTransaction .date', this).text().replace(/[\s]/g, '');
            let time = dom('.DateWithTransaction .time', this).text().replace(/[\s]/g, '');

            if (isNaN(amount) || !Number.isInteger(deposit_id)) {
                // console.log(`Skip: amount: ${amount} or deposit_id: ${deposit_id}.`);
                return;
            }

            trans.push({
                deposit_id: deposit_id,
                transaction: transaction,
                date: date,
                time: time,
                amount: amount,
            });
        });

        return trans;
    }

    async check_payments() {
        try {
            if (!this.is_authorized()) {
                await this.auth();
            }

            const now = moment();
            const today = now.format('dd.mm.YYYY');
            const yesterday = now.subtract(1, 'days').format('dd.mm.YYYY');

            let trans = this.get_transactions({
                usd: false,
                start: yesterday,
                finish: today,
            });

            this.logout();

            if (trans.length) {
                this.bot.events.emitNewQiwiDeposits(trans);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}

module.exports = QiwiWatcher;
