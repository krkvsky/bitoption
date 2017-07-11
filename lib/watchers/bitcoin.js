const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;

const fs = require('fs');
const net = require('net');
const Bitcoin = require('bitcoin-promise');
const assert = require('assert');

// const localdb = require('node-localdb');
// const moment = require('moment');
// const isEmpty = require('is-empty');
// const { sprintf } = require('sprintf-js');
// const { get_random } = require('./helper');

// const Watcher = require('./watcher');

// const exchange = require('blockchain.info/exchange');
// const Gdax = require('gdax');
// const gdax = new Gdax.PublicClient();

const config = require( '../../config' );

class BitcoinWatcher {
    constructor(bot) {
        this._bot = bot;
        this._socket_file = 'botsocket';
        this._bc = new Bitcoin.Client(config.bitcoind);

        this.start();
    }

    get bot() { return this._bot }
    get socket_file() { return this._socket_file }
    get bc() { return this._bot }

    async start() {
        let server;

        try {

            await fs.unlink(this.socket_file, (e) => {});

            server = await net.createServer( async (socket) => {
                console.log('connected'); // клиент присоединился

                socket.on('data', async (data) => {
                    const txid = data.toString();
                    console.log(txid);

                    const txinfo = await this.bc.getTransaction(txid);
                    console.log(txinfo);

                    if (txinfo.details.account) {
                        this.bot.events.emitNewQiwiDeposits([txinfo]);
                    }
                });

                socket.end(); // отвечаем и закрываем соединение
            });

            server.listen(this.socket_file); // слушаем сокет

        }
        catch (e) {
            console.log(e);
            server.listen(this.socket_file) // слушаем сокет
        }
    }
}

module.exports = BitcoinWatcher;