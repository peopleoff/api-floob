require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const allowedOrigins =
  'https://floob.gg:* https://www.floob.gg:* http://localhost:*'
const { sequelize } = require('./models')
const { catchError, videoSearch, guid } = require('./functions')
const VideoController = require('./controllers/VideoController')
const RoomController = require('./controllers/RoomController')
const MessageController = require('./controllers/MessageController')

app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

require('./routes')(app)

const server = app.listen(3000, function() {
  console.log('server running on port 3000')
})

sequelize.sync({ force: false }).then(() => {
  console.log('SQL Connected')
})

const io = require('socket.io')(server, {
  origins: allowedOrigins,
  secure: true
})

app.set('io', io);

// <----------------------------Socket Functions----------------------------> //
function addMessage(payload, socket) {
  let newMessage = {
    id: guid(),
    username: payload.user.username,
    message: payload.message
  }
  io.sockets.in(payload.roomID).emit('newMessage', newMessage)
  MessageController.addMessage(payload)
}

function searchVideos(payload, socket) {
  videoSearch(payload.search).then(results => {
    if (results) {
      socket.emit('searchResult', results.data.items)
    }
  })
}

function newUser(payload, socket) {
  const { roomID } = payload
  VideoController.getAll(roomID)
    .then(result => {
      socket.emit('getVideos', result)
    })
    .catch(error => {
      catchError(error)
    })
  RoomController.addToRoom(payload, socket.id)
  RoomController.getCurrentViewers(payload).then(result => {
    io.sockets.in(payload.roomID).emit('userCount', result)
  })
}

function getCurrentViewers(payload, socket) {
  const { room } = payload
  RoomController.getCurrentViewers(room)
    .then(result => {
      io.sockets.in(payload.roomID).emit('getCurrentViewers', videoResult)
    })
    .catch(error => {
      catchError(error)
    })
}

function removeFromRoom(payload, socket) {
  RoomController.removeFromRoom(payload, socket.id)
  RoomController.getCurrentViewers(payload).then(result => {
    io.sockets.in(payload.roomID).emit('userCount', result)
  })
}

function syncVideo(payload, socket) {
  io.sockets.in(payload.roomID).emit('syncVideo', payload.seconds)
}

function addVideo(payload, socket) {
  VideoController.addVideo(payload)
    .then(result => {
      VideoController.getAll(payload.roomID)
        .then(videoResult => {
          io.sockets.in(payload.roomID).emit('getVideos', videoResult)
          io.to(socket.id).emit('updateSnackbar', {
            error: false,
            type: 'success',
            message: 'Video Added'
          })
        })
        .catch(error => {
          catchError(error)
        })
    })
    .catch(error => {
      catchError(error)
    })
}

function removeVideo(payload, socket) {
  VideoController.removeVideo(payload.id)
    .then(result => {
      if (result) {
        VideoController.getAll(payload.roomID)
          .then(videoResult => {
            io.sockets.in(payload.roomID).emit('getVideos', videoResult)
          })
          .catch(error => {
            catchError(error)
          })
      }
    })
    .catch(error => {
      catchError(error)
    })
}

function voteToSkip(payload, socket) {
  let user = payload.user
  let room = parseInt(payload.roomID)
  let video = parseInt(payload.video.id)
  let skipObject = {
    user: user,
    room: room,
    video: video
  }
  let roomCount = io.nsps['/'].adapter.rooms[payload.roomID]
  let votesNeeded = roomCount.length / 2
  VideoController.voteToSkip(skipObject, votesNeeded)
    .then(result => {
      //If vote passed, skip video
      if (result.alreadyVoted) {
        socket.emit('updateSnackbar', {
          error: true,
          type: 'error',
          message: "You've Already Voted!"
        })
      }
      if (result.skipVideo) {
        VideoController.removeVideo(video)
          .then(result => {
            //After delete, get all videos for room
            VideoController.getAll(room)
              .then(videoResult => {
                io.sockets.in(room).emit('getVideos', videoResult)
              })
              .catch(error => {
                console.error(error)
              })
          })
          .catch(error => {
            console.error(error)
          })
      } else {
        io.sockets.in(room).emit('skipCounter', result.currentVotes)
      }
    })
    .catch(error => {
      console.log(error)
      io.to(socket.id).emit('updateSnackbar', error)
    })
}
// <----------------------------Socket Functions----------------------------> //

// <----------------------------Socket.io Listeners----------------------------> //
io.on('connection', socket => {
  socket.on('newRoom', payload => {
    socket.join(payload.roomID)
    newUser(payload, socket)
  })

  socket.on('addVideo', payload => {
    addVideo(payload, socket)
  })
  socket.on('getCurrentViewers', payload => {
    getCurrentViewers(payload, socket)
  })
  socket.on('addMessage', payload => {
    addMessage(payload, socket)
  })
  socket.on('voteToSkip', payload => {
    voteToSkip(payload, socket)
  })
  socket.on('removeFromRoom', payload => {
    removeFromRoom(payload, socket)
  })
  socket.on('removeVideo', payload => {
    removeVideo(payload, socket)
  })
  socket.on('searchVideos', payload => {
    searchVideos(payload, socket)
  })
  socket.on('seekVideo', payload => {
    syncVideo(payload, socket)
  })
  socket.on('leaveRoom', socketID => {
    // RoomController.removeFromRoom(socketID);
  })
  socket.on('disconnect', () => {
    RoomController.removeFromRoom(null, socket.id)
  })
})
// <----------------------------Socket.io Listeners----------------------------> //
