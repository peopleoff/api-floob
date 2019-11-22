const { messages } = require('../models')

module.exports = {
  addMessage(payload) {
    let newMessage = {
      user: payload.user.id,
      room: payload.roomID,
      message: payload.message
    }
    messages
      .create(newMessage)
      .then(result => {})
      .catch(error => {
        throw error
      })
  }
}
