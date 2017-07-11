const { Extra, Markup } = require('telegraf');

const config = require( '../config' );

module.exports = (bot, watchers) => {
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

        user_precision: ($) => {
            return config.defaults.precision[$.user.lang];
        },

        rate_precision: () => {
            return config.defaults.precision.rate;
        },

        user_currency: ($) => {
            return $.i18n.t(`common.currency.${$.user.currency}`);
        },

        usd_currency: ($) => {
            return $.i18n.t('common.currency.USD');
        },

        virt_currency: ($) => {
            return $.i18n.t('common.currency.VIR');
        }
    };

    bot.context.watchers = watchers;

    bot.i18ncmd = (command) => {
        return [ bot.i18n.t('ru', command), bot.i18n.t('en', command) ];
    };
};

