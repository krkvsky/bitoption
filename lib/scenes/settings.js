const { Extra, Markup } = require('telegraf');
const { WizardScene, Scene, enter } = require('telegraf-flow');

const generator = require( 'generate-password' );

const buttons = ($, m) => [
    [ m.callbackButton($.i18n.t('settings.button.account'), 'account'),
      m.callbackButton($.i18n.t('settings.button.hints'), 'hints') ],
    [ m.callbackButton($.i18n.t('settings.button.locale'), 'locale'),
      m.callbackButton($.i18n.t('settings.button.currency'), 'currency') ],
    // [ m.callbackButton($.i18n.t('settings.button.admin_panel'), 'admin_panel') ]
];

const main = ($, next, enter = true) => {
    const opts = Extra.HTML().markup((m) => m.inlineKeyboard(buttons($,m)));

    return enter
        ? $.reply($.i18n.t('settings.greeting'), opts).then(next)
        : $.editMessageText($.i18n.t('settings.greeting'), opts).then(next);
};

module.exports = (bot) => {
    let cmds = bot.i18ncmd('button.settings');
    bot.hears(cmds, ($) => $.flow.enter('settings'));

    const scene = new Scene('settings');

    scene.enter(($, next) => main($, next));
    scene.action('settings', ($, next) => main($, next, false));

    scene.action('account', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('settings.button.real_account'), 'real_account'),
              m.callbackButton($.i18n.t('settings.button.virt_account'), 'virt_account') ],
            [ m.callbackButton($.i18n.t('button.back'), 'settings') ]
        ]));

        return $.editMessageText($.i18n.t('settings.account'), opts).then(next);
    });

    scene.action(['real_account', 'virt_account'], async ($, next) => {
        const cid = $.chat.id;
        const action = $.callbackQuery.data;

        let balance_type = action === 'real_account' ? 1 : 0;

        try {
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { balance_type: balance_type }, { telegram_id: cid } ]
            );
        }
        catch(e) {
            console.log(e);
        }

        $.flow.leave();

        return $.editMessageText($.i18n.t(`settings.answer.${action}`), Extra.HTML()).then(next);
    });

    scene.action('locale', async ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.ru'), 'locale_ru'),
              m.callbackButton($.i18n.t('button.en'), 'locale_en') ],
            [ m.callbackButton($.i18n.t('button.back'), 'settings') ]
        ]));

        return $.editMessageText($.i18n.t('settings.locale'), opts).then(next);
    });

    scene.action(['locale_ru', 'locale_en'], async ($, next) => {
        const cid = $.chat.id;
        const action = $.callbackQuery.data;

        let lang = action === 'locale_ru' ? 'ru' : 'en';

        try {
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { lang: lang }, { telegram_id: cid } ]
            );

            $.i18n.locale(lang);
        }
        catch(e) {
            console.log(e);
        }

        $.flow.leave();

        return $.reply($.i18n.t(`settings.answer.${action}`), $.util.startup_keyboard($)).then(next);
    });

    scene.action('currency', async ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('settings.button.rub'), 'currency_rub'),
              m.callbackButton($.i18n.t('settings.button.usd'), 'currency_usd') ],
            [ m.callbackButton($.i18n.t('button.back'), 'settings') ]
        ]));

        return $.editMessageText($.i18n.t('settings.currency'), opts).then(next);
    });

    scene.action(['currency_rub', 'currency_usd'], async ($, next) => {
        const cid = $.chat.id;
        const action = $.callbackQuery.data;

        let currency = action === 'currency_rub' ? 'RUB' : 'USD';

        try {
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { currency: currency }, { telegram_id: cid } ]
            );
        }
        catch(e) {
            console.log(e);
        }

        $.flow.leave();

        return $.editMessageText($.i18n.t(`settings.answer.${action}`), Extra.HTML()).then(next);
    });

    scene.action('hints', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.bon'), 'hints_on'),
              m.callbackButton($.i18n.t('button.boff'), 'hints_off') ],
            [ m.callbackButton($.i18n.t('button.back'), 'settings') ]
        ]));

        return $.editMessageText($.i18n.t('settings.hints'), opts).then(next);
    });

    scene.action(['hints_on', 'hints_off'], async ($, next) => {
        const cid = $.chat.id;
        const action = $.callbackQuery.data;

        let hints = action === 'hints_on' ? 1 : 0;

        try {
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { hints: hints }, { telegram_id: cid } ]
            );
        }
        catch(e) {
            console.log(e);
        }

        $.flow.leave();

        return $.editMessageText($.i18n.t(`settings.answer.${action}`), Extra.HTML()).then(next);
    });

    scene.action('admin_panel', async ($, next) => {
        const cid = $.chat.id;
        // const action = $.callbackQuery.data;

        let genpasswd;

        try {
            genpasswd = generator.generate( { length: 10, numbers: true } );
            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { sitepasswd: genpasswd }, { telegram_id: cid } ]
            );
        }
        catch(e) {
            console.log(e);
        }

        $.flow.leave();

        return $.editMessageText($.i18n.t('settings.answer.admin_panel', {
            cid: cid,
            passwd: genpasswd,
        }), Extra.HTML()).then(next);
    });

    // scene.action(/.+/, ($) => {
    //   return $.answerCallbackQuery(`Oh, ${$.match[0]}! Great choise`);
    // });

    return scene;
};
