const { Extra, Markup } = require('telegraf');
const { WizardScene, Scene, enter } = require('telegraf-flow');

const config = require('../../config');

const main = async ($, next, enter = true) => {
    const cid = $.chat.id;

    // const opts = Extra.HTML().markup((m) => m.keyboard([
    //     [ $.i18n.t('button.cancel') ]
    // ]));
    const text = $.i18n.t('balance.deposit_yandex', {
        currency: $.util.user_currency($),
    });

    return (enter ? $.reply : $.editMessageText)(text, Extra.HTML()).then(next);
};

module.exports = (bot) => {
    const scene = new Scene('deposit_yandex');

    scene.enter( async ($, next) => main($, next));
    scene.action('begin', async ($, next) => main($, next, false));

    let message_id, deposit_id;

    scene.hears(/^\d+/, async ($, next) => {
        const cid = $.chat.id;
        let msg = $.message;

        if (deposit_id) {
            $.reply($.i18n.t('balance.deposit_started'), Extra.HTML());
            return next();
        }

        try {
            let amount = parseInt(msg.text);
            // console.log(amount);

            if (amount) {
                const [result] = await $.db.query( 'INSERT INTO deposits SET ?', {
                    user_id: $.user.id,
                    type: 'qiwi',
                    amount: amount,
                    currency: $.user.currency,
                });

                if (result.affectedRows == 0) {
                    throw new new Error('Can`t insert deposits');
                }

                // console.log(result);
                deposit_id = result.insertId;
                let qiwi_url = `https://qiwi.com/transfer/form.action?extra['account']=${config.qiwi.account}&amountInteger=${amount}&extra['comment']=${deposit_id}`;
                // console.log(qiwi_url);

                let opts = Extra.HTML().markup((m) => m.inlineKeyboard([
                    [ m.urlButton($.i18n.t('balance.button.deposit_yandex'), qiwi_url) ],
                    [ m.callbackButton($.i18n.t('button.cancel'), 'cancel') ]
                ]));

                const message = await $.reply($.i18n.t('balance.deposit_yandex_end', {
                    qiwi_account: config.qiwi.account,
                    deposit_id: deposit_id,
                    amount: $.util.to_user_currencyF($, amount),
                }), opts);

                message_id = message.message_id;
            }
        }
        catch (e) {
            console.log(e);
        }

        return next();
    });

    scene.action('cancel', async ($, next) => {
        const cid = $.chat.id;

        if (deposit_id) {
            const [[deposit]] = await $.db.execute( 'SELECT * FROM deposits WHERE id = ?', [ deposit_id ]);
            if (deposit.data) {
                $.reply($.i18n.t('balance.deposit_confirmed'), Extra.HTML());
                return next();
            }

            const [result] = await $.db.query( 'DELETE FROM deposits WHERE id = ?', [ deposit_id ]);
            deposit_id = null;
        }

        if (message_id) {
            await bot.telegram.deleteMessage(cid, message_id);
            message_id = null;
        }

        $.reply($.i18n.t('messages.canceled'), $.util.startup_keyboard($));

        $.flow.leave();

        return next();
    });

    return scene;
};