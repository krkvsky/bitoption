class Watcher {
    constructor(bot, interval) {
        this._bot = bot;
        this._interval = interval;
        this._timer = null;
    }

    get bot() { return this._bot }

    start() {
        try {
            this._timer = setTimeout(this.start.bind(this), this._interval * 1000);
        }
        catch (e) {
            console.log(e);
        }
    }
}

module.exports = Watcher;
