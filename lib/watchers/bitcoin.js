const fs = require('fs');
const net = require('net');
const Bitcoin = require('bitcoin-promise');

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
    get bc() { return this._bc }

    start() {
        this.listen();
    }

    async listen() {
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
                        this.bot.events.emitNewBtcDeposits([txinfo]);
                    }
                });

                socket.end(); // отвечаем и закрываем соединение
            });

            server.listen(this.socket_file); // слушаем сокет
        }
        catch (e) {
            console.log(e);
        }
    }
}

module.exports = BitcoinWatcher;
