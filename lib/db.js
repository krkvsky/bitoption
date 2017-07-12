const mysql = require('mysql2/promise');

const config = require( './config' );

class Db {
    constructor() {
        this._pool = mysql.createPool(config.db_options);
    }

    get pool() { return this._pool }
}

module.exports = Db;
