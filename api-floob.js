require("dotenv").config();
const express = require("express");
const Sentry = require("@sentry/node");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const Autolinker = require("autolinker");
const allowedOrigins =
  "https://floob.gg:* https://www.floob.gg:* http://localhost:*";
const { sequelize } = require("./models");
const { catchError, videoSearch, guid } = require("./functions");
const VideoController = require("./controllers/VideoController");
const RoomController = require("./controllers/RoomController");
const MessageController = require("./controllers/MessageController");

if (process.env.ENABLE_LOGGING == "true") {
  Sentry.init({
    dsn:
      "https://7580653f7aa84fd1ad0d27fb2569c691@o330708.ingest.sentry.io/5260940",
  });
}

app.use(Sentry.Handlers.requestHandler());
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(cors());

require("./routes")(app);

if (process.env.ENABLE_LOGGING == "true") {
  app.use(Sentry.Handlers.errorHandler());
}

const server = app.listen(process.env.PORT, function () {
  console.log(`server running on port ${process.env.PORT}`);
});

sequelize.sync({ force: false }).then(() => {
  const sequelize_fixtures = require("sequelize-fixtures");

  //a map of [model name] : model
  //see offical example on how to load models
  //https://github.com/sequelize/express-example/blob/master/models/index.js
  const models = require("./models");

  //from array
  var fixtures = [
    {
      model: "user_types",
      data: {
        name: "admin",
        description: "admin",
      },
    },
    {
      model: "user_types",
      data: {
        name: "user",
        description: "user",
      },
    },
    {
      model: "users",
      data: {
        username: "admin",
        username_lowercase: "admin",
        email: "admin@admin.com",
        email_lowercase: "admin@admin.com",
        password:
          "$2a$10$Q/AH0MPPKyMVNzshASojgOBeEsf15NhOQhTYstnVOhn8e/MR11qvi",
        date_of_birth: "11/11/1111",
        type: 1,
      },
    },
    {
      model: "room_types",
      data: {
        name: "public",
        description: "public",
      },
    },
    {
      model: "room_types",
      data: {
        name: "private",
        description: "private",
      },
    },
    {
      model: "rooms",
      data: {
        name: "Psycho-Pass Seraph",
        nsfw: 0,
        user: 1,
        type: 2,
      },
    },
  ];
  sequelize_fixtures.loadFixtures(fixtures, models).then(function () {
    console.log("Sample Data Loaded");
  });
});

const io = require("socket.io")(server, {
  origins: allowedOrigins,
  secure: true,
});

app.set("io", io);

// <----------------------------Socket Functions----------------------------> //
function sendMessage(payload) {
  payload.message = Autolinker.link(payload.message);
  if (!payload.user) {
    payload.user = {
      username: "someone",
      color: "#fff",
    };
  }
  let newMessage = {
    id: guid(),
    eventMessage: payload.eventMessage,
    username: payload.user.username,
    color: payload.user.color,
    message: payload.message,
    timestamp: new Date(),
  };
  io.sockets.in(payload.roomID).emit("newMessage", newMessage);
  if (!payload.eventMessage) {
    MessageController.saveMessage(payload);
  }
}

function searchVideos(payload, socket) {
  videoSearch(payload).then((results) => {
    if (results) {
      socket.emit("searchResult", results.data.items);
    }
  });
}

function enterRoom(payload, socket) {
  socket.join(payload.id);
  socket.username = payload.user.username;
  console.log(socket.rooms);
  console.log(payload);
  // io.sockets.in(payload.id).emit("userJoined", {
  //   username: socket.username,
  //   numUsers: numUsers,
  // });
}

// function getCurrentViewers(payload, socket) {
//   const { room } = payload
//   RoomController.getCurrentViewers(room)
//     .then(result => {
//       io.sockets.in(payload.roomID).emit('getCurrentViewers', videoResult)
//     })
//     .catch(error => {
//       catchError(error)
//     })
// }

function removeFromRoom(payload, socket) {
  RoomController.removeFromRoom(payload, socket.id);
  // RoomController.getCurrentViewers(payload).then(result => {
  //   io.sockets.in(payload.roomID).emit('userCount', result)
  // })
}

function syncVideo(payload) {
  io.sockets.in(payload.roomID).emit("syncVideo", {
    seconds: payload.seconds,
    playerID: payload.playerID,
  });
}

function playVideo(payload) {
  io.sockets.in(payload.roomID).emit("playVideo", {
    playerID: payload.playerID,
  });
}

function pauseVideo(payload) {
  io.sockets.in(payload.roomID).emit("pauseVideo", {
    playerID: payload.playerID,
  });
}

function playSpeed(payload) {
  io.sockets.in(payload.roomID).emit("playSpeed", payload);
}

// function addVideo(payload, socket) {
//   VideoController.addVideo(payload)
//     .then((result) => {
//       VideoController.getAll(payload.roomID)
//         .then((videoResult) => {
//           io.sockets.in(payload.roomID).emit("getVideos", videoResult);
//           io.to(socket.id).emit("updateSnackbar", {
//             error: false,
//             type: "success",
//             message: "Video Added",
//           });
//         })
//         .catch((error) => {
//           catchError(error);
//         });
//     })
//     .catch((error) => {
//       catchError(error);
//     });
// }

function removeVideo(payload, socket) {
  VideoController.removeVideo(payload.id)
    .then((result) => {
      if (result) {
        VideoController.getAll(payload.room)
          .then((videoResult) => {
            io.sockets.in(payload.room).emit("getVideos", videoResult);
          })
          .catch((error) => {
            catchError(error);
          });
      }
    })
    .catch((error) => {
      catchError(error);
    });
}

function voteToSkip(payload, socket) {
  let user = payload.user;
  let room = parseInt(payload.roomID);
  let video = parseInt(payload.video.id);
  let skipObject = {
    user: user,
    room: room,
    video: video,
  };

  let roomCount = io.nsps["/"].adapter.rooms[payload.roomID];
  let votesNeeded = roomCount.length / 2;

  VideoController.voteToSkip(skipObject, votesNeeded)
    .then((result) => {
      //If vote passed, skip video
      if (result.alreadyVoted) {
        socket.emit("updateSnackbar", {
          error: true,
          type: "error",
          message: "You've Already Voted!",
        });
      }
      if (result.skipVideo) {
        VideoController.removeVideo(video)
          .then((result) => {
            //After delete, get all videos for room
            VideoController.getAll(room)
              .then((videoResult) => {
                io.sockets.in(room).emit("getVideos", videoResult);
              })
              .catch((error) => {
                console.error(error);
              });
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        io.sockets.in(room).emit("skipCounter", result.currentVotes);
      }
    })
    .catch((error) => {
      console.log(error);
      io.to(socket.id).emit("updateSnackbar", error);
    });
}
// <----------------------------Socket Functions----------------------------> //

// <----------------------------Socket.io Listeners----------------------------> //
io.on("connection", (socket) => {
  socket.on("enterRoom", (payload) => {
    enterRoom(payload, socket);
  });

  // socket.on("addVideo", (payload) => {
  //   addVideo(payload, socket);
  // });
  // socket.on('getCurrentViewers', payload => {
  //   getCurrentViewers(payload, socket)
  // })
  socket.on("sendMessage", (payload) => {
    sendMessage(payload, socket);
  });

  socket.on("voteToSkip", (payload) => {
    voteToSkip(payload, socket);
  });

  socket.on("removeFromRoom", (payload) => {
    removeFromRoom(payload, socket);
  });

  socket.on("removeVideo", (payload) => {
    removeVideo(payload, socket);
  });

  socket.on("searchVideos", (payload) => {
    searchVideos(payload, socket);
  });

  socket.on("syncVideo", (payload) => {
    syncVideo(payload, socket);
  });

  socket.on("playSpeed", (payload) => {
    playSpeed(payload, socket);
  });

  socket.on("playVideo", (payload) => {
    playVideo(payload);
  });

  socket.on("pauseVideo", (payload) => {
    pauseVideo(payload);
  });

  socket.on("leaveRoom", (socketID) => {
    // RoomController.removeFromRoom(socketID);
  });

  socket.on("disconnect", () => {
    RoomController.removeFromRoom(null, socket.id);
  });
});
// <----------------------------Socket.io Listeners----------------------------> //
