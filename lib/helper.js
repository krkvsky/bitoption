const config = require( '../config' );

function get_random(max = 1) {
    return Math.random() * max;
}

module.exports = {
    get_random
};

