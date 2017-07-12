const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;

const localdb = require('node-localdb');
const moment = require('moment');
const isEmpty = require('is-empty');
const { sprintf } = require('sprintf-js');

const { get_random } = require('../helper');
const Watcher = require('./watcher');

// const exchange = require('blockchain.info/exchange');
const Gdax = require('gdax');

const config = require( '../../config' );

const rates_db = localdb('./lib/watchers/db/rates.json');

class RatesWatcher extends Watcher {
    constructor(bot, interval) {
        super(bot, interval);

        this.rates_6 = [];
        this.last_rate = null;
        this._trans = {
            delt1: 0.000,
            delt2: 0.000,
            fact1: false,
            fact2: false,
            fact3: false,
            fact4: false,
        };

        this._gdax = new Gdax.PublicClient();

        this.start();
    }

    get gdax() { return this._gdax }

    transform_rate(rate) {
        let _rate = rate;

        this._trans.fact1 = this._trans.fact3 || !this._trans.fact1 ? get_random() < config.game_factory.f1 / 100 : this._trans.fact1;

        if (this.last_rate && this.last_rate === rate && this._trans.fact1) {
            this._trans.rate = rate;
            this._trans._rate = rate;

            this._trans.delt1 = get_random(config.game_factory.famount / 2);
            this._trans.delt2 = get_random(config.game_factory.famount / 4);

            this._trans.fact4 = get_random() < config.game_factory.f4 / 100; // Факт необходимости смены Рост / Падение
            this._trans.fact2 = this._trans.fact4 ? get_random() < config.game_factory.f2 / 100 : this._trans.fact2; // Рост / Падение
            this._trans.fact3 = get_random() < config.game_factory.f3 / 100; // Обрыв

            let delta = this._trans.delt1;
            if (this._trans.fact3) {
                delta *= this._trans.fact2 ? -this._trans.delt2 : this._trans.delt2;
                this._trans._rate = rate;
            }

            _rate = this._trans.fact2 ? this._trans._rate + delta : this._trans._rate - delta;
            this._trans._rate = _rate;

            // console.log(sprintf('Trans: %j', this._trans));
        }
        else {
            this.last_rate = rate;
        }

        return _rate;
    }

    async start() {
        this.update_rates();
        super.start();
    }

    async update_rates() {
        let timestamp = Math.ceil( new Date().getTime() / 1000 ); // Seconds

        this.gdax.getProductTicker(async (error, response, data) => {
            try {
                if (error) throw error;

                if (!data) {
                    console.log(response);
                    throw error;
                }
                // console.log(data.price);
                let rate_price = this.transform_rate(parseFloat(data.price));

                let rate = await rates_db.findOne({ timestamp: timestamp });

                if (rate) {
                    // console.log( "Rate found: " + JSON.stringify( rate ) );
                    timestamp += 1;
                    // console.log( 'Timestamp increased to %i', timestamp );
                }

                rate = rates_db.insert({ timestamp: timestamp, price: rate_price });
                // console.log(`New rate inserted: ${JSON.stringify(rate)}`);

                // Slice db
                let rates_count = await rates_db.count( {} );
                let rates = await rates_db.find({}, { limit: 6, skip: rates_count - 6 });

                if (Array.isArray( rates ) && !isEmpty(rates)) {
                    rates.sort( function( a, b ) {
                        return a.timestamp - b.timestamp;
                    } );

                    let rates_map = rates.map((rate) => {
                        let _timestamp = rate.timestamp * 1000; // Seconds
                        let _time = moment(_timestamp).format('HH:MM:ss');

                        return {
                            time: _time,
                            price: rate.price
                        };
                    } );

                    this.rates_6 = rates_map;
                }

                if ( rates_count > 200 ) {
                    let _db = rates_db._fetch().slice( -100 );
                    rates_db._flush( _db );
                    console.log( 'Rates db sliced to', _db.length );
                }
            }
            catch (e) {
                console.log('ERR update_rates');
                console.log(e);
                console.log('');
            }
        });
    }
}

module.exports = RatesWatcher;
