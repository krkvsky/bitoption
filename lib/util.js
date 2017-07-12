const { Extra, Markup } = require('telegraf');

const config = require( '../config' );

module.exports = (bot) => {
    bot.context.util = {
        generate_nickname: (user) => {
            let nickname = user.first_name;

            if ( user.last_name !== undefined )
                nickname += ` ${user.last_name}`;

            return nickname;
        },

        startup_keyboard: ($) => {
            return Extra.HTML().markup((m) => m.keyboard([
                [ $.i18n.t('button.play'), $.i18n.t('button.about') ],
                [ $.i18n.t('button.balance'), $.i18n.t('button.settings') ],
            ]).oneTime().resize());
        },

        option_keyboard: ($) => {
            return Extra.HTML().markup((m) => m.inlineKeyboard([
                [
                    m.callbackButton(`${$.user.placed_money} ${$.util.user_currency($)}`, 'new_option'),
                    m.callbackButton(`${$.user.placed_time} ${$.i18n.t('common.seconds')}`, 'new_option')
                ],[
                    m.callbackButton('➕', 'update_money:incr'), m.callbackButton('➖', 'update_money:decr'),
                    m.callbackButton('➕', 'update_time:incr') , m.callbackButton('➖', 'update_time:decr' )
                ],[
                    m.callbackButton($.i18n.t('play.button.game_incr'), 'game_start:incr'),
                    m.callbackButton($.i18n.t('play.button.game_decr'), 'game_start:decr')
                ],
                // [ m.callbackButton($.i18n.t('button.next'), 'game_type')],
            ]));
        },

        win_percent_by_time: (placed_time) => {
            let win_percent;

            if ( placed_time < 15 ) {
                win_percent = 80;
            }
            // if ( placed_time >= 15 ) {
            //     win_percent = 80;
            // }
            if ( placed_time >= 30 ) {
                win_percent = 80;
            }
            else if ( placed_time >= 60 ) {
                win_percent = 75;
            }
            else if ( placed_time >= 600 ) {
                win_percent = 65;
            }
            else if ( placed_time >= 1800 ) {
                win_percent = 60;
            }
            else if ( placed_time >= 3600 ) {
                win_percent = 50;
            }
            else if ( placed_time >= 3600 * 3 ) {
                win_percent = 40;
            }
            else if ( placed_time >= 3600 * 9 ) {
                win_percent = 35;
            }
            else if ( placed_time >= 3600 * 24 ) {
                win_percent = 30;
            }

            return win_percent;
        },

        send_wake_message: ($, is_win, seconds) => {
            let wake_message = $.i18n.t(is_win ? 'play.wake_message_win' : 'play.wake_message_lose');
            return setTimeout(() => {
                $.reply(wake_message);
                //
            }, seconds * 1000);
        },

        user_precision: ($) => {
            return config.defaults.precision[$.user.currency];
        },

        rate_precision: () => {
            return config.defaults.precision.rate;
        },

        user_currency: ($) => {
            let currency = $.user.balance_type == 0 ? 'VIR' : $.user.currency;
            return $.i18n.t(`common.currency.${currency}`);
        },

        usd_currency: ($) => {
            return $.i18n.t('common.currency.USD');
        },

        btc_currency: ($) => {
            return $.i18n.t('common.currency.BTC');
        },

        virt_currency: ($) => {
            return $.i18n.t('common.currency.VIR');
        },

        to_usd: ($, amount) => {
            return $.user.currency === 'USD'
                ? parseFloat(amount).toFixed(config.defaults.precision.USD)
                : parseFloat(( amount / $.currency_rates.USD).toFixed(config.defaults.precision.USD));
        },

        to_rub: ($, amount) => {
            return $.user.currency === 'USD'
                ? parseFloat(amount * $.currency_rates.USD).toFixed(config.defaults.precision.RUB)
                : parseFloat(amount).toFixed(config.defaults.precision.RUB);
        },

        to_btc: ($, amount) => {
            return parseFloat(amount).toFixed(config.defaults.precision.BTC)
        },

        to_virtual: ($, amount) => {
            return parseFloat(amount).toFixed(0)
        },

        to_user_currency: ($, amount) => {
            return $.user.currency === 'USD' ? $.util.to_usd($, amount) : $.util.to_rub($, amount)
        },

        min_balance: ($) => {
            return $.util.to_user_currency($, $.user.balance_type == 0 ? config.defaults.min_balance.RUB : config.defaults.min_balance[$.user.currency]);
        },

        parseRate: ($, rate) => {
            return parseFloat(rate).toFixed(config.defaults.precision.rate);
        },

        rub_to_user_currency: ($, amount) => {
            return $.user.currency === 'USD' ? $.util.to_usd($, amount) : amount
        },

        rateF: ($, rate) => { return `${$.util.parseRate($, rate)} ${$.util.usd_currency($)}` },
        min_balanceF: ($) => { return `${$.util.min_balance($)} ${$.util.user_currency($)}` },
        to_btcF: ($, amount) => { return `${$.util.to_btc($, amount)} ${$.util.btc_currency($)}` },
        to_virtualF: ($, amount) => { return `${$.util.to_virtual($, amount)} ${$.util.virt_currency($)}` },
        to_user_currencyF: ($, amount) => { return `${$.util.to_user_currency($, amount)} ${$.util.user_currency($)}` },
        rub_to_user_currencyF: ($, amount) => { return `${$.util.rub_to_user_currency($, amount)} ${$.util.user_currency($)}` }
    };

    bot.i18ncmd = (command) => {
        return [ bot.i18n.t('ru', command), bot.i18n.t('en', command) ];
    };
};

