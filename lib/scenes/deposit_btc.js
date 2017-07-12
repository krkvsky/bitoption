const { Extra, Markup } = require('telegraf');
const { WizardScene, Scene, enter } = require('telegraf-flow');
const Bitcoin = require('bitcoin-promise');

const config = require('../../config');

const main = async ($, next, enter = true) => {
    const cid = $.chat.id;

    let btc_account = cid.toString();
    let btc_address = $.user.btc_address;

    try {
        let bc = new Bitcoin.Client(config.bitcoind);

        if (!btc_address) {
            btc_address = await bc.getNewAddress(btc_account);

            const [result] = await $.db.query(
                'UPDATE users SET ? WHERE ?',
                [ { btc_address: btc_address }, { telegram_id: cid } ]
            );
            $.user.btc_address = btc_address;
        }

        if (btc_address) {
            const text = $.i18n.t('balance.deposit_btc', {
                btc_address: btc_address
            });

            (enter ? $.reply : $.editMessageText)(text, Extra.HTML());
        }
    }
    catch (e) {
        console.log(e);
    }

    return next();
};

module.exports = (bot) => {
    const scene = new Scene('deposit_btc');

    scene.enter( async ($, next) => main($, next));

    return scene;
};
