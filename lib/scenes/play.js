const { Extra, Markup } = require('telegraf');
const { Scene } = require('telegraf-flow');

const { get_random } = require('../helper');

const config = require( '../../config' );

var chats = {};
var wake_timer;

// class BinaryOptionGame {
//     constructor () {

//     }
// }

function render_game_text($, texts, hints = null) {
    let atext = [],
        ahints = [];

    if ( $.user.hints == 1 ) {
        ahints.push( $.i18n.t('play.account_type_hint') );

        if ( hints ) {
            ahints = ahints.concat( hints );
        }
    }

    atext.push( $.i18n.t($.user.balance_type == 0 ? 'play.virt_account' : 'play.real_account'));
    atext.push( ahints.join( '' ) );
    atext = atext.concat( texts );

    return atext.join( '\n' );
}

function generate_rates_text($) {
    const up_icon = '📈'; // ⬆📈
    const dn_icon = '📉'; // ⬇📉

    let hint_prev = '';
    let hint_aftr = '';

    if ( $.user.hints == 1 ) {
        hint_prev = $.i18n.t('play.rates_hint_prev');
        hint_aftr = $.i18n.t('play.rates_hint_aftr');
    }

    let RW = $.watchers.rates_watcher;
    let table = [];

    table.push(hint_prev);

    if (RW.rates_6.length == 6) {
        for ( let i = 1; i < 6; i++ ) {
            let curr_time = RW.rates_6[i].time;
            let curr_rate = parseFloat(RW.rates_6[i].price);
            let prev_rate = parseFloat(RW.rates_6[i - 1].price);

            let icon = curr_rate > prev_rate ? up_icon : curr_rate < prev_rate ? dn_icon : '';

            table.push( i == 5 ? '<pre>🔸' : '<pre>◽️' );
            table.push( `${curr_time}・${curr_rate.toFixed($.util.rate_precision())}${$.util.usd_currency($)} ${icon}` );
            table.push( i == 5 ? '</pre>' : '</pre>\n' );
        }
    }

    table.push(hint_aftr);

    return table.join('');
}

function reset_game(cid, full = true) {
    console.log('Game reset');

    if (chats[cid]) {
        if (wake_timer) {
            clearTimeout(wake_timer);
            wake_timer = null;
            console.log('Reset wake_timer');
        }

        if (chats[cid].game.timer) {
            clearInterval(chats[cid].game.timer);
            chats[cid].game.timer = null;
            console.log('Reset timer');
        }

        if (full) {
            chats[cid] = undefined;
            return;
        }
    }

    chats[cid] = {
        // wake_timer: null,
        game: {
            timer: null,
            options: [],
            game_rate: 0,
            game_started: false,
            message_id: null,
        }
    };

    console.log(chats);
}

function get_win_chances (user) {
    return user.balance_type == 0 ? config.game_factory.win_chanses.virt : config.game_factory.win_chanses.real;
}

async function resolve_game(bot, $) {
    const cid = $.chat.id;

    const timestamp = Math.ceil( new Date().getTime() / 1000 ); // Seconds

    try {
        let update_columns, balance_total, balance_total_up;

        let RW = $.watchers.rates_watcher;

        // let is_win = RW.rates_6[5].price > chats[cid].game.game_rate;
        let is_win = get_random(100) >= get_win_chances($.user) ? false : true;

        let curr_rate = parseFloat(RW.rates_6[5].price);
        let game_rate = parseFloat(chats[cid].game.game_rate);

        let resolve_text;

        if (chats[cid].game.game_type === 'incr') {
            let delta = (game_rate - curr_rate) * 2;
            if (curr_rate < game_rate) {
                // Игра на повышение проиграна, но
                if (is_win) {
                    curr_rate += delta;
                }
            }
            else if (curr_rate > game_rate) {
                // Игра на повышение выиграна, но
                if (!is_win) {
                    curr_rate += delta;
                }
            }
            else {
                delta = get_random();
                curr_rate += is_win ? delta : -delta;
            }

            resolve_text = $.i18n.t(is_win ? 'play.game_incr_win' : 'play.game_incr_lose', {
                rate: $.util.rateF($, game_rate),
            });
        }
        else if (chats[cid].game.game_type === 'decr') {
            let delta = (game_rate - curr_rate) * 2;
            if (curr_rate > game_rate) {
                // Игра на понижение проиграна, но
                if (is_win) {
                    curr_rate += delta;
                }
            }
            else if (curr_rate < game_rate) {
                // Игра на понижение выиграна, но
                if (!is_win) {
                    curr_rate += delta;
                }
            }
            else {
                delta = get_random();
                curr_rate += is_win ? -delta : delta;
            }

            resolve_text = $.i18n.t(is_win ? 'play.game_decr_win' : 'play.game_decr_lose', {
                rate: $.util.rateF($, game_rate),
            });
        }

        game_rate = game_rate.toFixed($.util.rate_precision());
        curr_rate = curr_rate.toFixed($.util.rate_precision());
        RW.rates_6[5].price = curr_rate;

        if (chats[cid].game.message_id) {
            await bot.telegram.editMessageText(cid, chats[cid].game.message_id, null, generate_rates_text($), Extra.HTML()).catch(function (e) {
                console.log(e);
            });
        }

        let placed_money = parseInt($.user.placed_money);
        let win_percent = $.util.win_percent_by_time($.user.placed_time);
        let game_bank = parseInt( placed_money / 100 * win_percent );

        let _bank = game_bank;
        if (!is_win) {
            _bank = -_bank;
        }

        if ( $.user.balance_type == 0 ) {
            balance_total = parseInt( $.user.balance_virtual ) + _bank;
            balance_total_up = parseInt( $.user.balance_up_virtual ) + _bank;
            update_columns = {
                balance_virtual: balance_total,
                balance_up_virtual: balance_total_up
            };
        }
        else {
            balance_total = parseInt( $.user.balance ) + _bank;
            balance_total_up = parseInt( $.user.balance_up ) + _bank;
            update_columns = {
                balance_rub: $.util.to_rub($, balance_total),
                balance_up_rub: $.util.to_rub($, balance_total_up)
            };
        }

        const [result] = await $.db.query( 'UPDATE users SET ? WHERE ?', [ update_columns, { telegram_id: cid } ]);

        let table = [];

        table.push(render_game_text($, resolve_text));
        table.push($.i18n.t('play.game_end_descr', {
            curr_rate: $.util.rateF($, curr_rate),
            placed_money: $.util.to_user_currencyF($, placed_money),
            game_bank: $.util.to_user_currencyF($, _bank),
            balance_total: $.util.to_user_currencyF($, balance_total)
        }));

        let text = table.join('\n');

        await $.editMessageText( text, Extra.HTML());

        reset_game( cid );

        wake_timer = $.util.send_wake_message($, is_win, 10); // 10 секунд
    }
    catch (e) {
        console.log(e);
    }
}

module.exports = (bot) => {
    let cmds = bot.i18ncmd('button.play');
    bot.hears(cmds, ($) => $.flow.enter('play'));

    const scene = new Scene('play');

    scene.enter( async ($, next) => {
        const cid = $.chat.id;

        console.log(chats);

        if (chats[cid] == undefined) {
            reset_game( cid );
        }
        else {
            if ( chats[cid].game.timer ) {
                $.reply('Вы уже начали игру' );
            }

            return next();
        }

        reset_game( cid, false );

        let balance = $.user.balance_type == 1 ? $.user.balance : $.user.balance_virtual;
        let min_balance = $.util.min_balance($);

        if ( $.user.balance_type == 1 && $.user.balance < min_balance) {
            let text = render_game_text($, $.i18n.t('play.balance_less_then', {
                then: $.util.min_balanceF($),
            }));

            $.reply(text, Extra.HTML());
        }
        else {
            try {
                const message = await $.reply($.i18n.t('play.prepare_game'));

                chats[cid].game.message_id = message.message_id;

                let start = async () => {
                    const timestamp = Math.ceil( new Date().getTime() / 1000 ); // Seconds

                    let kb = [];

                    if ( !chats[cid].game.game_started ) {
                        kb.push(Markup.callbackButton($.i18n.t('button.cancel'), 'cancel'));
                    }

                    if ( !chats[cid].game.options.length ) {
                        kb.unshift(Markup.callbackButton($.i18n.t('play.button.new_option'), 'new_option'));
                    }

                    let text = generate_rates_text($);
                    let opts = Extra.HTML().markup(Markup.inlineKeyboard(kb));
                    bot.telegram.editMessageText(cid, message.message_id, null, text, opts ).catch((error) => {
                        console.log(error);
                    });
                }

                start();
                // chats[cid].game.timer = setTimeout( start, 500 );
                chats[cid].game.timer = setInterval( start, 1000 );
            }
            catch (e) {
                console.log(e);
            }
        }

        return next();
    });

    scene.action(/^game_start/, async ($, next) => {
        const cid = $.chat.id;

        if ( !chats[cid].game.options.length ) {
            return next();
        }

        try {
            await bot.telegram.editMessageText(cid, chats[cid].game.message_id, null, generate_rates_text($), Extra.HTML());

            let RW = $.watchers.rates_watcher;

            chats[cid].game.game_type = $.callbackQuery.data.replace('game_start:', '');
            chats[cid].game.game_started = true;
            chats[cid].game.game_rate = parseFloat(RW.rates_6[5].price);

            let comment = $.i18n.t(chats[cid].game.game_type === 'incr' ? 'play.bid.game_incr' : 'play.bid.game_decr', {
                game_rate: $.util.rateF($, chats[cid].game.game_rate),
            });

            let countdown = parseInt($.user.placed_time);
            let timer;

            let start = async () => {
                if ( countdown > 0 ) {
                    countdown--;

                    const text = render_game_text($, [
                        comment,
                        $.i18n.t('play.bid.game_data', {
                            user: $.user,
                            currency: $.util.user_currency($)
                        }),
                        $.i18n.t('play.game_timer', { timer: countdown }),
                    ]);

                    $.editMessageText(text, Extra.HTML());
                }
                else {
                    if (timer) clearInterval(timer);

                    resolve_game(bot, $);
                }
            }

            timer = setInterval( start, 1000 );
        }
        catch (e) {
            console.log(e);
        }

        return next();
    });

    scene.action('new_option', async ($, next) => {
        const cid = $.chat.id;

        if ( chats[cid].game.options.length ) {
            return;
        }

        let message;

        try {
            let balance = $.user.balance_type == 1 ? $.user.balance : $.user.balance_virtual;
            let min_balance = $.util.min_balance($);

            if ( balance < min_balance ) {
                let text = render_game_text($, $.i18n.t('play.balance_less_then', {
                    then: $.util.min_balanceF($)
                }));

                message = await $.reply(text, Extra.HTML());
            }
            else {
                let placed_money = $.user.placed_money;

                if (!placed_money || placed_money > balance) {
                    placed_money = balance;

                    const [result] = await $.db.query(
                        'UPDATE users SET ? WHERE ?',
                        [ { placed_money: placed_money }, { telegram_id: cid } ]
                    );

                    $.user.placed_money = placed_money;
                }

                let text = generate_rates_text($);
                let opts = Extra.HTML().markup(Markup.inlineKeyboard([
                    [Markup.callbackButton($.i18n.t('button.cancel'), 'cancel')]
                ]));
                bot.telegram.editMessageText(cid, chats[cid].game.message_id, null, text, opts ).catch((error) => {
                    console.log(error);
                });

                let win_percent = $.util.win_percent_by_time($.user.placed_time);
                let game_bank = $.util.to_user_currencyF($, parseFloat(placed_money * win_percent / 100));
                text = render_game_text( $, [
                    $.i18n.t('play.bid.greeting'),
                    $.i18n.t('play.bid.win_percent', {
                        win_percent: win_percent,
                        game_bank: game_bank,
                    } ),
                ]);
                console.log($.user);
                opts = $.util.option_keyboard($);
                message = await $.reply(text, opts);
            }
        }
        catch (e) {
            console.log(e);
        }
        finally {
            chats[cid].game.options.push( { message_id: message.message_id } );
        }

        return next();
    });

    scene.action('cancel', async ($, next) => {
        const cid = $.chat.id;

        await chats[cid].game.options.forEach( (bid) => {
            bot.telegram.deleteMessage(cid, bid.message_id);
        });

        reset_game( cid );

        $.editMessageText($.i18n.t('play.canceled'), Extra.HTML());

        return next();
    });

    scene.action(/^update_money/, async ($, next) => {
        const cid = $.chat.id;

        if ( !chats[cid].game.options.length ) {
            return next();
        }

        try {
            let action = $.callbackQuery.data.replace('update_money:', '');
            // console.log(action);
            let placed_money = parseInt($.user.placed_money || $.util.min_balance($));
            let balance = parseInt( $.user.balance_type == 0 ? $.user.balance_virtual : $.user.balance );

            let text;

            if (action === 'incr') {
                placed_money = placed_money * 2;
                placed_money = placed_money > balance ? balance : placed_money;

                console.log(placed_money, $.user.placed_money, balance);

                if ( placed_money != $.user.placed_money ) {
                //     text = render_game_text($, $.i18n.t('play.bid.not_enough_balance', {
                //         balance: balance.toFixed($.util.user_precision($)),
                //     }));
                // }
                // else {

                    const [result] = await $.db.query(
                        'UPDATE users SET ? WHERE ?',
                        [ { placed_money: placed_money }, { telegram_id: cid } ]
                    );
                    $.user.placed_money = placed_money;

                    let win_percent = $.util.win_percent_by_time( $.user.placed_time );
                    let game_bank = $.util.to_user_currencyF($, parseFloat(placed_money * win_percent / 100));
                    text = render_game_text( $, [
                        $.i18n.t('play.bid.money.increased', {
                            placed_money: $.util.to_user_currencyF($, placed_money || 0),
                        }),
                        $.i18n.t('play.bid.win_percent', {
                            win_percent: win_percent,
                            game_bank: game_bank,
                        } ),
                    ]);
                }
            }
            else if (action === 'decr') {
                placed_money = Math.ceil(placed_money / 2);
                placed_money = placed_money < 50 ? balance > 50 ? 50 : balance : placed_money;

                console.log(placed_money, $.user.placed_money, balance);

                // if ( placed_money < 50 ) {
                //     text = render_game_text($, $.i18n.t('play.bid.less_then', {
                //         balance: balance.toFixed($.util.user_precision($)),
                //         then: 50,
                //     }));
                // }
                // else
                if ($.user.placed_money != placed_money) {
                    const [result] = await $.db.query(
                        'UPDATE users SET ? WHERE ?',
                        [ { placed_money: placed_money }, { telegram_id: cid } ]
                    );
                    $.user.placed_money = placed_money;

                    let win_percent = $.util.win_percent_by_time( $.user.placed_time );
                    let game_bank = $.util.to_user_currencyF($, parseFloat(placed_money * win_percent / 100));
                    text = render_game_text($, [
                        $.i18n.t('play.bid.money.decreased', {
                            placed_money: $.util.to_user_currencyF($, placed_money || 0),
                        }),
                        $.i18n.t('play.bid.win_percent', {
                            win_percent: win_percent,
                            game_bank: game_bank,
                        } ),
                    ]);
                }
            }

            if (text) {
                let opts = $.util.option_keyboard($);
                $.editMessageText(text, opts);
            }
        }
        catch(e) {
            console.log(e);
        }

        return next();
    });

    scene.action(/^update_time/, async ($, next) => {
        const cid = $.chat.id;

        if ( !chats[cid].game.options.length ) {
            return next();
        }

        try {
            let action = $.callbackQuery.data.replace('update_time:', '');
            let placed_time = parseInt($.user.placed_time);

            let text;

            if (action === 'incr') {
                placed_time = placed_time * 2;

                if (placed_time <= 600) {
                    const [result] = await $.db.query(
                        'UPDATE users SET ? WHERE ?',
                        [ { placed_time: placed_time }, { telegram_id: cid } ]
                    );
                    $.user.placed_time = placed_time;

                    let win_percent = $.util.win_percent_by_time( $.user.placed_time );
                    let game_bank = $.util.to_user_currencyF($, parseFloat($.user.placed_money * win_percent / 100));
                    text = render_game_text($, [
                        $.i18n.t('play.bid.time.increased', { placed_time: placed_time }),
                        $.i18n.t('play.bid.win_percent', {
                            win_percent: win_percent,
                            game_bank: game_bank,
                        } ),
                    ]);
                }
            }
            else if (action === 'decr') {
                placed_time = Math.ceil(placed_time / 2);
                // console.log(placed_time);

                if (placed_time >= 30) {
                    const [result] = await $.db.query(
                        'UPDATE users SET ? WHERE ?',
                        [ { placed_time: placed_time }, { telegram_id: cid } ]
                    );
                    $.user.placed_time = placed_time;

                    let win_percent = $.util.win_percent_by_time( $.user.placed_time );
                    let game_bank = $.util.to_user_currencyF($, parseFloat($.user.placed_money * win_percent / 100));
                    text = render_game_text($, [
                        $.i18n.t('play.bid.time.decreased', { placed_time: placed_time }),
                        $.i18n.t('play.bid.win_percent', {
                            win_percent: win_percent,
                            game_bank: game_bank,
                        } ),
                    ]);
                }
            }

            if (text) {
                let opts = $.util.option_keyboard($)
                $.editMessageText(text, opts);
            }
        }
        catch (e) {
            console.log(e);
        }

        return next();
    });

    return scene;
};
