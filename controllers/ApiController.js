const { api_logs } = require('../models')

module.exports = {
    logRequest(payload){
        api_logs.create(payload);
    }
}
