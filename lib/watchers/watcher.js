class Watcher {
    constructor(bot, pool, interval) {
        this._bot = bot;
        this._pool = pool;
        this._interval = interval;
        this._timer = null;
    }

    get bot() {
        return this._bot;
    }

    get pool() {
        return this._pool;
    }

    async start() {
        try {
            this._timer = setTimeout(this.start.bind(this), this._interval * 1000);
        }
        catch (e) {
            console.log(e);
        }
    }
}

module.exports = Watcher;
