const { Extra, Markup } = require('telegraf');
const { WizardScene, Scene, enter } = require('telegraf-flow');

const config = require( '../../config' );

const buttons = ($, m) => [
    [ m.callbackButton($.i18n.t('about.button.parthership'), 'parthership') ],
    [ m.callbackButton($.i18n.t('about.button.groups'), 'groups'),
      m.callbackButton($.i18n.t('about.button.top_players'), 'top_players') ],
    [ m.callbackButton($.i18n.t('about.button.rules'), 'rules'),
      m.callbackButton($.i18n.t('about.button.faq'), 'faq') ],
    [ m.callbackButton($.i18n.t('about.button.support'), 'support'),
      m.urlButton($.i18n.t('about.button.friends'), 'https://vk.com/feedback') ]
];

const main = ($, next, enter = true) => {
    const opts = Extra.HTML().markup((m) => m.inlineKeyboard(buttons($,m)));

    return enter
        ? $.reply($.i18n.t('about.greeting'), opts).then(next)
        : $.editMessageText($.i18n.t('about.greeting'), opts).then(next);
};

module.exports = (bot) => {
    let cmds = bot.i18ncmd('button.about');
    bot.hears(cmds, ($) => $.flow.enter('about'));

    const scene = new Scene('about');

    scene.enter(($, next) => main($, next));
    scene.action('about', ($, next) => main($, next, false));

    scene.action('parthership', async ($, next) => {
        const cid = $.chat.id;

        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [
                m.callbackButton($.i18n.t('button.back'), 'about'),
                m.callbackButton($.i18n.t('about.button.statistic'), 'statistic'),
            ]
        ]));

        const [[user]] = await $.db.execute( 'SELECT * FROM users WHERE telegram_id = ?', [ cid ]);

        let addtext = '';
        if ( user.referer ) {
            addtext = $.i18n.t('about.referer', { referer: user.referer });
        }

        return $.editMessageText($.i18n.t('about.parthership', {
            cid: cid,
            bot_name: config.bot_name,
            addtext: addtext,
        }), opts).then(next);
    });

    scene.action('statistic', async ($, next) => {
        const cid = $.chat.id;

        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            m.callbackButton($.i18n.t('button.back'), 'parthership')
        ]));

        const [[stat]] = await $.db.execute( `
            SELECT
                SUM( balance_up ) AS bup_sum,
                SUM( deposit_summ ) AS dep_sum,
                SUM( deposit_summ_bitcoin ) AS dep_sum_btc,
                COUNT(*) AS cnt
            FROM users WHERE referer = ?`
            , [ cid ]
        );
        // console.log(stat);

        let team_bal_sum = stat.bup_sum ? stat.bup_sum : '0';
        let team_dep_sum = stat.dep_sum ? stat.dep_sum : '0';
        let team_dep_sum_btc = stat.dep_sum_btc ? stat.dep_sum_btc : '0';

        return $.editMessageText($.i18n.t('about.statistic', {
            team_count: stat.cnt,
            team_bal_sum: team_bal_sum,
            team_dep_sum: team_dep_sum,
            team_dep_sum_btc: team_dep_sum_btc,
            currency: $.util.user_currency($),
        }), opts).then(next);
    });

    scene.action('groups', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.urlButton($.i18n.t('about.button.group1'), `https://vk.com/support`) ],
            [ m.urlButton($.i18n.t('about.button.group2'), `https://vk.com/support`) ],
            [ m.urlButton($.i18n.t('about.button.group3'), `https://vk.com/support`) ],
            [ m.callbackButton($.i18n.t('button.back'), 'about') ],
        ]));

        return $.editMessageText($.i18n.t('about.groups'), opts).then(next);
    });

    scene.action('top_players', async ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.back'), 'about') ]
        ]));

        const [rows] = await $.db.execute( 'SELECT nickname, balance_up FROM users WHERE is_player = 1 ORDER BY balance_up ASC LIMIT 5' );

        let table = [ $.i18n.t('about.top_players.greeting') ];
        rows.forEach( function( user ) {
            table.push( $.i18n.t('about.top_players.text1', {
                nickname: user.nickname,
                balance_up: user.balance_up,
                currency: $.util.user_currency($),
            }));
        });

        let text = table.join( '\n' );

        return $.editMessageText(text, opts).then(next);
    });

    scene.action('rules', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.back'), 'about') ]
        ]));

        return $.editMessageText($.i18n.t('about.rules'), opts).then(next);
    });

    scene.action('faq', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('about.button.faq_common'), 'faq_common'),
              m.callbackButton($.i18n.t('about.button.faq_account'), 'faq_account') ],
            [ m.callbackButton($.i18n.t('about.button.faq_finance'), 'faq_finance'),
              m.callbackButton($.i18n.t('about.button.faq_trade'), 'faq_trade') ],
            [ m.callbackButton($.i18n.t('button.back'), 'about') ]
        ]));

        return $.editMessageText($.i18n.t('about.faq.greeting'), opts).then(next);
    });

    scene.action(['faq_common', 'faq_account', 'faq_finance', 'faq_trade'], ($, next) => {
        const cid = $.chat.id;
        let action = $.callbackQuery.data;

        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.back'), 'faq') ]
        ]));

        return $.editMessageText($.i18n.t(`about.faq.${action}`), opts).then(next);
    });

    scene.action('support', ($, next) => {
        const opts = Extra.HTML().markup((m) => m.inlineKeyboard([
            [ m.callbackButton($.i18n.t('button.back'), 'about') ]
        ]));

        return $.editMessageText($.i18n.t('about.support'), opts).then(next);
    });

    return scene;
};
