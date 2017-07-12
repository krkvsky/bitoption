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
        balance: $.util.to_user_currencyF($, $.user.balance || 0),
        balance_bitcoin: $.util.to_btcF($, $.user.balance_bitcoin || 0),
        balance_virtual: $.util.to_virtualF($, $.user.balance_virtual || 0),
        balance_up: $.util.to_user_currencyF($, $.user.balance_up || 0),
        balance_up_bitcoin: $.util.to_btcF($, $.user.balance_up_bitcoin || 0),
        balance_up_virtual: $.util.to_virtualF($, $.user.balance_up_virtual || 0),
        deposit_sum: $.util.to_user_currencyF($, $.user.deposit_sum || 0),
        deposit_sum_bitcoin: $.util.to_btcF($, $.user.deposit_sum_bitcoin || 0),
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
            balance: $.util.to_user_currencyF($, $.user.balance || 0),
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
