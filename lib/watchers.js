const RatesWatcher    = require('./watchers/rates');
const CurrencyWatcher = require('./watchers/currency');
const BitcoinWatcher  = require('./watchers/bitcoin');
const QiwiWatcher     = require('./watchers/qiwi');

const config = require( '../config' );

module.exports = (bot) => {
    console.log('Watchers startup');

    bot.watchers = this;
    bot.context.watchers = this;

    this.rates_watcher    = new RatesWatcher(bot, config.UPDATE_RATES_INTERVAL);
    this.currency_watcher = new CurrencyWatcher(bot, config.CURRENCY_WATCHER_INTERVAL);
    // this.bitcoins_watcher = new BitcoinWatcher(bot);
    // this.qiwi_watcher     = new QiwiWatcher(bot, config.QIWI_WATCHER_INTERVAL);
}
