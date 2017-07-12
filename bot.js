const Telegraf = require('telegraf');
const Flow = require('telegraf-flow');
const I18n = require('telegraf-i18n');
const mysql = require('mysql2/promise');
const { assert } = require('chai');
const BotEmitter = require('./lib/events');

const { Extra, Markup } = Telegraf;
const { Scene, enter } = Flow;

const config = require('./config');

const bot  = new Telegraf(config.bot_token);
const flow = new Flow();
const i18n = new I18n(config.i18n);
const events = new BotEmitter(bot);

const pool = mysql.createPool(config.db_options);

bot.i18n = i18n;
bot.pool = pool;

bot.use(Telegraf.memorySession());
bot.use(Telegraf.log());
bot.use(i18n.middleware());

bot.use(async ($, next) => {
    const cid = $.chat.id;

    try {
        $.db = await pool.getConnection();
        console.log('DB Connection created');

        let [[user]] = await $.db.execute( 'SELECT * FROM users WHERE telegram_id = ?', [ cid ]);

        if (user) {
            $.user = user;

            $.user.lang = ['ru','en'].indexOf($.user.lang) < 0 ? config.defaults.locale : $.user.lang;
            $.i18n.locale($.user.lang);

            $.user.balance = $.util.rub_to_user_currency($, $.user.balance_rub);
            $.user.balance_up = $.util.rub_to_user_currency($, $.user.balance_up_rub);
            $.user.deposit_sum = $.util.rub_to_user_currency($, $.user.deposit_sum_rub);
        }
    }
    catch (e) {
        console.log(e);
    }

    return next().then(function () {
        $.db.release();
        console.log('DB Connection released');
    });
});

require('./lib/watchers')(bot);
require('./lib/util')(bot);

bot.use(flow.middleware());

flow.register(require('./lib/scenes/settings')(bot));
flow.register(require('./lib/scenes/balance')(bot));
flow.register(require('./lib/scenes/deposit_btc')(bot));
flow.register(require('./lib/scenes/deposit_qiwi')(bot));
flow.register(require('./lib/scenes/deposit_yandex')(bot));
flow.register(require('./lib/scenes/about')(bot));
flow.register(require('./lib/scenes/play')(bot));

bot.events.on('NewBtcDeposits', async (deposits) => {
    console.log('NewBtcDeposits Emitted', deposits);

    const db = await pool.getConnection();

    for (const txinfo of deposits) {
        let cid = txinfo.details.account;

        let [[user]] = await db.execute( 'SELECT * FROM users WHERE telegram_id = ?', [ cid ]);
        assert.isObject(user);

        let amount = txinfo.details.amount * 100000000; // to Satoshi
        let data_json = JSON.stringify({ txid: txinfo.txid, addr: txinfo.details.address, account: cid });

        const [result] = await db.query( 'INSERT INTO deposits SET ?', {
            user_id: user.id,
            type: 'btc',
            amount: amount,
            currency: 'SAT',
            status: 1,
            data: data_json,
        });

        if (result.affectedRows > 0) {
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { deposit_sum_bitcoin: deposit_sum_bitcoin }, { telegram_id: user.telegram_id } ]
            );

            let text = i18n.t(user.lang, 'btc_balance_added', {
                btc_address: txinfo.details.address,
                amount: txinfo.details.amount,
            });
            await bot.telegram.sendMessage(cid, text, Extra.HTML() ).catch(function (e) {
                console.log(e);
            });
        }
    }
});

bot.events.on('NewQiwiDeposits', async (deposits) => {
    console.log('NewQiwiDeposits Emitted', deposits);

    const db = await pool.getConnection();

    for (const trans of deposits) {
        const [[user]] = await db.execute(`
            SELECT
                u.*
            FROM deposits d
                INNER JOIN users u ON user_id = u.id
            WHERE
                d.id = ?
            `,
            [ trans.deposit_id ]
        );

        let data_json = JSON.stringify(trans);
        let [result] = await db.query(`
            UPDATE
                deposits
            SET
                status = ?,
                data = ?
            WHERE
                status = ? AND
                id = ?
            `,
            [ 1, data_json, 0, trans.deposit_id ]
        );

        // console.log(result);

        if (result.affectedRows > 0) {
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { deposit_sum_rub: deposit_sum_rub }, { telegram_id: user.telegram_id } ]
            );

            let text = i18n.t(user.lang, 'messages.qiwi_balance_added', {
                amount: trans.amount,
            });

            console.log(text, user.telegram_id);

            await bot.telegram.sendMessage(user.telegram_id, text, Extra.HTML() ).catch(function (e) {
                // console.log(e);
            });
        }
    }
});

bot.command('start', async ($) => {
    let cid = $.chat.id;
    let msg = $.message;

    try {
        let nickname = $.util.generate_nickname( msg.from );

        if ( !$.user ) {
            let referer;
            if ( msg.text != '/start' ) {
                referer = parseInt( msg.text.replace('/start ', '') );

                if (referer) {
                    const [[user]] = await $.db.execute( 'SELECT * FROM users WHERE telegram_id = ?', [ referer ]);

                    if (user) {
                        let username = msg.from.username || nickname;

                        let text = i18n.t(user.lang, 'messages.partner_added', {
                            user_name: username
                        });

                        await bot.telegram.sendMessage(referer, text, Extra.HTML() ).catch(function (e) {
                            // console.log(e);
                        });
                    }
                }
            }

            let lang = 'ru';
            if (msg.from.language_code) {
                lang = msg.from.language_code.replace(/-.+/, '');
            }

            const [result] = await $.db.query( 'INSERT INTO users SET ?', {
                telegram_id: cid,
                referer: referer,
                nickname: nickname,
                lang: lang
            });
            // console.log(result);

            const [[user]] = await $.db.execute( 'SELECT * FROM users WHERE telegram_id = ?', [ cid ]);
            // console.log(user);

            $.user = user;
        }

        return $.reply($.i18n.t('greeting', { nickname: nickname }), $.util.startup_keyboard($));
    }
    catch(e) {
        console.log(e);
    }
});

bot.startPolling(config.polling.timeout, config.polling.limit);

module.exports = {
    bot: bot,
    pool: pool
}


