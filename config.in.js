const path = require('path');

module.exports = {
    bot_name: 'Bitoption_bot',
    bot_token: '369455114:AAEFzwcJY7pkpc2y-0LU2RACz0MrtPhv5lw',

    defaults: {
        locale: 'ru',
        precision: {
            ru: 0,
            en: 2,
            rate: 3,
        },
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

    // coinigy_credentials: {
    //     apiKey: "5071551af2ee3294cebf085369a245de",
    //     apiSecret: "ecde1706342741df56fc478c9391f600"
    // },

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

    // root: path.resolve(__dirname, ''),

    UPDATE_RATES_INTERVAL:    1,  // 1 секунда
    BITCOIN_WATCHER_INTERVAL: 60, // 10 секунд
    QIWI_WATCHER_INTERVAL:    60, // 20 секунд
};
