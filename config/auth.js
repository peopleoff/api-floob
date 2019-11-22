const jwt = require('jsonwebtoken');
const ONE_WEEK = 60 * 60 * 24 * 7;

//jwt config
const jwtSecret = require('./config').authentication.jwtSecret;

module.exports = {
    signUser(user) {
        return jwt.sign({
            user: user
        }, jwtSecret, {
            expiresIn: ONE_WEEK
        })
    }
}