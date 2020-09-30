const VideoController = require("./controllers/VideoController");
const MessageController = require("./controllers/MessageController");
const Autolinker = require("autolinker");
//Classes
const { Users } = require("./classes/users");

let users = new Users();

//Functions
const { guid } = require("./functions");

exports = module.exports = function (io) {
  // <----------------------------Functions----------------------------> //
  /**
   * Runs on a 2500ms internal to run any heartbeat functions.
   * @return {void}
   */
  function heartbeat() {
    sendHeartbeat();
  }

  // <----------------------------Functions----------------------------> //

  // <----------------------------Socket Functions----------------------------> //
  /**
   * Sends a chat message
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {string} payload.message - The chat message.
   * @param {number} payload.roomID - The ID of the room
   * @param {number} payload.user - The ID of the user sending the message
   */
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
  /**
   * Checks all connected sockets for current video percentage
   * @return {void}
   */
  function getUserVideoPercent() {
    users.users.forEach((user) => {
      io.to(user.socketID).emit("getCurrentVideoPercent");
    });
  }
  function sendHeartbeat() {
    //Send request for all users to update current timestamp
    getUserVideoPercent();
    let rooms = users.getRooms();
    rooms.forEach((room) => {
      let highestCurrentTime = users.getHighestCurrentTime(room);
      io.to(room).emit("syncToHighestCurrentTime", highestCurrentTime);
    });
  }
  /**
   * Registers the user to a specific room
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.id - The ID of the room
   * @param {Object} payload.user - The user entering the room
   * @param {socket} socket - Socket.io socket object
   */
  function enterRoom(payload, socket) {
    //Join user to socket room based on room ID
    socket.join(payload.id);

    //If user is not logged in, generate random temp user
    if (!payload.user) {
      payload.user = users.createTempUser(payload.id);
    }

    //Remove users from all rooms they might already be in
    users.removeUser(payload.id);
    //Add user to current room they are entering
    users.addUser(socket.id, payload.id, payload.user);
    //Send updated user list to room
    io.sockets
      .in(payload.id)
      .emit("updateUserList", users.getUserList(payload.id));

    //Emit to everyone but user who entertred that someone has joined
    socket.to(payload.id).emit("userJoined", {
      username: payload.user.username,
    });
  }
  /**
   * Unregisters the user from a room when they leave
   * @param {socket} socket - Socket.io socket object
   */
  function leaveRoom(socket) {
    let user = users.removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("updateUserList", users.getUserList(user.room));
      io.to(user.room).emit("userDisconnect", {
        username: user.name,
      });
    }
  }
  /**
   * Sends a socket event to sync everyone in a room
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.playerID - The HTML ID of the users video player
   * @param {number} payload.roomID - The ID of the room
   * @param {number} payload.seconds - The current timestamp in seconds of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function syncVideo(payload, socket) {
    socket.to(payload.roomID).emit("syncVideo", {
      seconds: payload.seconds,
      playerID: payload.playerID,
    });
  }
  /**
   * Sends a socket event to play(unpause) the video
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.playerID - The HTML ID of the users video player
   * @param {number} payload.roomID - The ID of the room
   * @param {number} payload.seconds - The current timestamp in seconds of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function playVideo(payload, socket) {
    socket.to(payload.roomID).emit("playVideo", {
      playerID: payload.playerID,
    });
  }
  /**
   * Sends a socket event to pause the video
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.playerID - The HTML ID of the users video player
   * @param {number} payload.roomID - The ID of the room
   * @param {number} payload.seconds - The current timestamp in seconds of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function pauseVideo(payload, socket) {
    socket.to(payload.roomID).emit("pauseVideo", {
      playerID: payload.playerID,
    });
  }
  /**
   * Sends a socket event to get current percent of playing video per user.
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.playerID - The HTML ID of the users video player
   * @param {number} payload.roomID - The ID of the room
   * @param {number} payload.currentTime - The current percent of the users video
   * @param {number} payload.duration - The current percent of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function updateVideo(payload, socket) {
    users.updateUserVideoTimestamp(payload, socket.id);
    io.to(payload.roomID).emit(
      "updateUserList",
      users.getUserList(payload.roomID)
    );
  }
  /**
   * Sends a socket event to set player speed
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.playerID - The HTML ID of the users video player
   * @param {number} payload.roomID - The ID of the room
   * @param {number} payload.speed - The current speed of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function playSpeed(payload, socket) {
    socket.to(payload.roomID).emit("playSpeed", payload);
  }
  /**
   * Needs more documentation
   */
  function removeVideo(payload, socket) {
    VideoController.removeVideo(payload.id)
      .then((result) => {
        if (result) {
          VideoController.getAll(payload.room)
            .then((videoResult) => {
              io.sockets.in(payload.room).emit("getVideos", videoResult);
            })
            .catch((error) => {
              console.error(error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
  // <----------------------------Socket Functions----------------------------> //

  // <----------------------------Socket.io Listeners----------------------------> //
  io.on("connection", (socket) => {
    socket.on("enterRoom", (payload) => {
      enterRoom(payload, socket);
    });

    socket.on("sendMessage", (payload) => {
      sendMessage(payload, socket);
    });

    socket.on("updateVideo", (payload) => {
      updateVideo(payload, socket);
    });

    socket.on("removeVideo", (payload) => {
      removeVideo(payload, socket);
    });

    socket.on("syncVideo", (payload) => {
      syncVideo(payload, socket);
    });

    socket.on("playSpeed", (payload) => {
      playSpeed(payload, socket);
    });

    socket.on("playVideo", (payload) => {
      playVideo(payload, socket);
    });

    socket.on("pauseVideo", (payload) => {
      pauseVideo(payload, socket);
    });

    socket.on("leaveRoom", () => {
      leaveRoom(socket);
    });

    socket.on("disconnect", () => {
      leaveRoom(socket);
    });
  });
  // <----------------------------Socket.io Listeners----------------------------> //

  //Heartbeat Check
  setInterval(heartbeat, 2500);
};
