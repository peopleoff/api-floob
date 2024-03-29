const { messages } = require('../models')
const { errorHandler } = require("../functions");

module.exports = {
  saveMessage(payload) {
    let newMessage = {
      user: payload.user.id,
      room: payload.room_id,
      message: payload.message
    }
    messages
      .create(newMessage)
      .then(result => {})
      .catch(error => {
        errorHandler(error);
      })
  }
}
