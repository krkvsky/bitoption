const config = require( '../config' );

const RatesWatcher = require('./watchers/rates');
const BitcoinWatcher = require('./watchers/bitcoin');
const QiwiWatcher = require('./watchers/qiwi');

module.exports = (bot, pool) => {
    this.rates_watcher = new RatesWatcher(bot, pool, config.UPDATE_RATES_INTERVAL);
    this.bitcoins_watcher = new BitcoinWatcher(bot);
    this.qiwi_watcher = new QiwiWatcher(bot, pool, config.QIWI_WATCHER_INTERVAL);

    console.log('Watchers started');
    return this;
}
