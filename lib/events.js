const EventEmitter = require('events');

class BotEmitter extends EventEmitter {
    constructor(bot) {
        super();

        this._bot = bot;
        bot.events = this;
    }

    get bot() { return this._bot }

    emitNewBtcDeposits(deposits) { return this.emit('NewBtcDeposits', deposits) }
    emitNewQiwiDeposits(deposits) { return this.emit('NewQiwiDeposits', deposits) }
}

module.exports = BotEmitter;
