const request = require('request-promise');
const Watcher = require('./watcher');

const config = require( '../../config' );

class CurrencyWatcher extends Watcher {
    constructor(bot, interval) {
        super(bot, interval);

        this.start();
    }

    async start() {
        this.update_rates();
        super.start();
    }

    async update_rates() {
        console.log('Currency rates update');

        try {
            const response = {
                timestamp: 1499767199,
                rates: { RUB: 60.765517 }
            };
            // const response = await request({
            //     method: 'GET',
            //     qs: {
            //         app_id: config.open_exchange_rates.app_id,
            //         base: 'USD',
            //         symbols: 'RUB'
            //     },
            //     json: true,
            //     uri: 'https://openexchangerates.org/api/latest.json',
            // });
            // console.log(response);

            this.bot.context.currency_rates = {
                timestamp: response.timestamp,
                USD: response.rates.RUB
            };
        }
        catch (e) {
            console.log(e);
        }
    }
}

module.exports = CurrencyWatcher;
