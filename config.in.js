const path = require('path');

module.exports = {
    bot_name: 'Bitoption_bot',
    bot_token: '369455114:AAEFzwcJY7pkpc2y-0LU2RACz0MrtPhv5lw',

    defaults: {
        locale: 'ru',
        precision: {
            RUB:  0,
            USD:  2,
            BTC:  8,
            rate: 3,
        },
        min_balance: {
            RUB: 50,
            USD: 1,
            BTC: 0.0001,
        }
    },

    polling: {
        timeout: 30,
        limit:   100,
    },

    db_options: {
        host: 'localhost',
        user: 'apicall',
        password: '4O4x3H4n8M5f0V9b',
        database: 'apicall'
    },

    i18n: {
        directory: path.resolve(__dirname, 'locale'),
        defaultLanguage: 'ru-ru',
        sessionName: 'session',
        // allowMissing: true,
    },

    open_exchange_rates: {
        app_id: '926aca5c4dc345d7b16501b30f3d8ab8'
    },

    bitcoind: {
        host: 'localhost',
        port: 8332,
        user: 'bitcoinrpc',
        pass: '5293fb14f4534e1f06e980d9778faf0e',
        timeout: 30000
    },

    qiwi: {
        account: '+79268804143',
        password: 'Tovuva52',
    },

    game_factory: {
        famount: 3,              // Величина роста курса в USD
        f1: 65,                  // Регулятор частоты трансформации курса в %
        f2: 50,                  // Регулятор частоты роста против падения курса в %
        f3: 20,                  // Регулятор частоты обрыва курса в %
        f4: 35,                  // Регулятор частоты необходимости смены f2 в %
        win_chanses: {
            virt: 80,            // Шансы на выигрыш на виртуальном счете в %
            real: 40,            // Шансы на выигрыш на реальном счете в %
        }
    },

    UPDATE_RATES_INTERVAL:        1, // 1 секунда
    CURRENCY_WATCHER_INTERVAL: 3600, // 1 час
    QIWI_WATCHER_INTERVAL:     3600, // 20 секунд
};
