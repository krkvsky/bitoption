const { Extra, Markup } = require('telegraf');
const { WizardScene, Scene, enter } = require('telegraf-flow');
const bitcoin = require('bitcoin-promise');

const config = require('../../config');

const buttons = ($, m) => [
    [
        m.callbackButton($.i18n.t('balance.button.withdraw'), 'withdraw'),
        m.callbackButton($.i18n.t('balance.button.deposit'), 'deposit')
    ],
    [ m.callbackButton($.i18n.t('balance.button.history'), 'history') ],
];

const bc = new bitcoin.Client(config.bitcoind);

// function makeid() {§
//     var text = "";
//     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//     for( var i=0; i < 5; i++ )
//         text += possible.charAt(Math.floor(Math.random() * possible.length));

//     return text;
// }

const main = async ($, next, enter = true) => {
    const cid = $.chat.id;

    const opts = Extra.HTML().markup((m) => m.inlineKeyboard(buttons($,m)));
    const text = $.i18n.t('balance.greeting', {
        user: $.user,
        currency: $.util.user_currency($),
    });

    return (enter ? $.reply : $.editMessageText)(text, opts).then(next);
};

module.exports = (bot) => {
    let cmds = bot.i18ncmd('button.balance');
    bot.hears(cmds, ($) => $.flow.enter('balance'));

    const scene = new Scene('balance');

    scene.enter( async ($, next) => main($, next));
    scene.action('balance', async ($, next) => main($, next, false));

    scene.action('withdraw', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.back'), 'balance') ]
        ]));

        return $.editMessageText($.i18n.t('balance.withdraw'), opts).then(next);
    });

    scene.action('deposit', ($, next) => {
        const cid = $.chat.id;

        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [
                m.callbackButton($.i18n.t('balance.button.btc'), 'deposit_btc'),
                m.callbackButton($.i18n.t('balance.button.qiwi'), 'deposit_qiwi'),
                m.callbackButton($.i18n.t('balance.button.yandex'), 'deposit_yandex'),
            ],
            [ m.callbackButton($.i18n.t('button.back'), 'balance') ]
        ]));

        $.editMessageText($.i18n.t('balance.deposit', {
            user: $.user,
            currency: $.util.user_currency($),
        }), opts);

        return next();
    });

    scene.action(['deposit_btc', 'deposit_qiwi', 'deposit_yandex'], async ($, next) => {
        const cid = $.chat.id;
        const action = $.callbackQuery.data;
        const message_id = $.callbackQuery.message.message_id;

        bot.telegram.deleteMessage(cid, message_id);

        $.flow.leave();
        $.flow.enter(action);

        return next();
    });

    scene.action('history', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.back'), 'balance') ]
        ]));

        return $.editMessageText($.i18n.t('balance.history'), opts).then(next);
    });

    return scene;
};
