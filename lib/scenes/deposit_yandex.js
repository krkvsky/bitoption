const { Extra, Markup } = require('telegraf');
const { WizardScene, Scene, enter } = require('telegraf-flow');

const config = require('../../config');

const main = async ($, next, enter = true) => {
    const cid = $.chat.id;

    // let btc_account = cid.toString();
    // let btc_address = $.user.btc_address;

    try {
    //     if (!btc_address) {
    //         btc_address = await bc.getNewAddress(btc_account);

    //         const [result] = await $.db.query(
    //             'UPDATE users SET ? WHERE ?',
    //             [ { btc_address: btc_address }, { telegram_id: cid } ]
    //         );
    //         $.user.btc_address = btc_address;
    //     }

    //     if (btc_address) {
    //         // const balance = await bc.getBalance(btc_account);

    //         // console.log(balance);
    //         // client.cmd('listtransactions', acc, function (err, transactions) {
    //         // if (err) {
    //         // console.log(err);
    //         // return res.reidrect('/');
    //         // } else {
    //         // for (var i = 0; i < transactions.length; i++) {
    //         //   transactions[i].time = new Date(transactions[i].time * 1000);
    //         // }
    //         // res.render('wallet', { title : 'Ваш кошелек', wallet : wallet, balance : balance, transactions : transactions });
    //         // }
    //         // });

    //         // const opts = Extra.HTML().markup((m) => m.keyboard([
    //         //     [ $.i18n.t('button.cancel') ]
    //         // ]));
            const text = $.i18n.t('balance.deposit_yandex', {
                btc_address: btc_address
            });

            (enter ? $.reply : $.editMessageText)(text, Extra.HTML());
        // }
    }
    catch (e) {
        console.log(e);
    }

    return next();
};

module.exports = (bot) => {
    const scene = new Scene('deposit_yandex');

    scene.enter( async ($, next) => main($, next));
    // scene.action('begin', async ($, next) => main($, next, false));

    // scene.action('cancel', async ($, next) => {
    //     const cid = $.chat.id;

    //     if (deposit_id) {
    //         const [[deposit]] = await $.db.execute( 'SELECT * FROM deposits WHERE id = ?', [ deposit_id ]);
    //         if (deposit.data) {
    //             $.reply($.i18n.t('balance.deposit_confirmed'), Extra.HTML());
    //             return next();
    //         }

    //         const [result] = await $.db.query( 'DELETE FROM deposits WHERE id = ?', [ deposit_id ]);
    //         deposit_id = null;
    //     }

    //     if (message_id) {
    //         await bot.telegram.deleteMessage(cid, message_id);
    //         message_id = null;
    //     }

    //     $.reply($.i18n.t('messages.canceled'), $.util.startup_keyboard($));

    //     $.flow.leave();

    //     return next();
    // });

    return scene;
};
