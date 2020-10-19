const VideoController = require("./controllers/VideoController");
const MessageController = require("./controllers/MessageController");
const Autolinker = require("autolinker");
//Classes
const { Users } = require("./classes/users");
const { Rooms } = require("./classes/rooms");

let users = new Users();
let rooms = new Rooms();

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
   * @param {number} payload.room_id - The ID of the room
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
    io.sockets.in(payload.room_id).emit("newMessage", newMessage);
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
      console.log(user);
      io.to(user.socketID).emit("getCurrentVideoPercent");
    });
  }
  function sendHeartbeat() {
    //Send request for all users to update current timestamp
    let allRooms = rooms.getAllRooms();
    allRooms.forEach((room) => {
      io.to(room.room_id).emit("getCurrentVideoPercent");
      io.to(room.room_id).emit("heartbeat", room);
    });
  }
  /**
   * Registers the user to a specific room
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {Object} payload.room - The ID of the room
   * @param {Object} payload.user - The user entering the room
   * @param {socket} socket - Socket.io socket object
   */
  function enterRoom(payload, socket) {
    //Join user to socket room based on room ID
    let { room, user } = payload;

    console.log(socket.id);

    socket.join(room.id);

    //If user is not logged in, generate random temp user
    if (!user) {
      user = users.createTempUser(room.id);
    }

    //Remove user from any old rooms
    //TO-DO Remove user from all rooms
    // rooms.removeUser(payload.user)

    //Find if room is already created
    let findRoom = rooms.getRoom(room.id);

    //Add socketID to user object
    user.socketID = socket.id;

    //If room is not created yet, create room then add user
    //Else just add user to room
    if (!findRoom) {
      rooms.addRoom(room.id, room.room_uuid);
      rooms.addUser(room.id, user);
    } else {
      rooms.addUser(room.id, user);
    }

    //Emit to everyone but user who entertred that someone has joined
    socket.to(room.id).emit("userJoined", {
      username: user.username,
    });
  }
  /**
   * Unregisters the user from a room when they leave
   * @param {socket} socket - Socket.io socket object
   */
  function leaveRoom(socket) {
    let user = rooms.removeUser(socket.id);
    if (user) {
      let room = rooms.getRoom(user.room);
      io.to(user.room).emit("updateUserList", room);
      io.to(user.room).emit("userDisconnect", {
        username: user.name,
      });
    }
  }
  /**
   * Sends a socket event to sync everyone in a room
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.player_id - The HTML ID of the users video player
   * @param {number} payload.room_id - The ID of the room
   * @param {number} payload.seconds - The current timestamp in seconds of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function syncVideo(payload, socket) {
    socket.to(payload.room_id).emit("syncVideo", {
      seconds: payload.seconds,
      player_id: payload.player_id,
    });
  }

  function getTimeToSync(payload, socket) {
    // const latestVideoTime = rooms.getAllRooms(payload.room_id);
    const videoInfo = rooms.getCurrentVideoInfo(payload.room_id);
    const room = rooms.getRoom(payload.room_id);
    socket.emit("sendTimeToSync", {
      seconds: videoInfo,
    });
    io.to(room.room_id).emit("heartbeat", room);
  }
  /**
   * Sends a socket event to play(unpause) the video
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.player_id - The HTML ID of the users video player
   * @param {number} payload.room_id - The ID of the room
   * @param {number} payload.seconds - The current timestamp in seconds of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function playVideo(payload, socket) {
    socket.to(payload.room_id).emit("playVideo", {
      player_id: payload.player_id,
    });
  }
  /**
   * Sends a socket event to pause the video
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.player_id - The HTML ID of the users video player
   * @param {number} payload.room_id - The ID of the room
   * @param {number} payload.seconds - The current timestamp in seconds of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function pauseVideo(payload, socket) {
    socket.to(payload.room_id).emit("pauseVideo", {
      player_id: payload.player_id,
    });
  }
  /**
   * Sends a socket event to get current percent of playing video per user.
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.player_id - The HTML ID of the users video player
   * @param {number} payload.room_id - The ID of the room
   * @param {number} payload.currentTime - The current percent of the users video
   * @param {number} payload.duration - The current percent of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function updateVideo(payload, socket) {
    console.log(payload);
    rooms.updateUserVideoInfo(socket.id, payload);
    // users.updateUserVideoTimestamp(payload, socket.id);
  }
  /**
   * Sends a socket event to set player speed
   * @param {Object} payload - The employee who is responsible for the project.
   * @param {number} payload.player_id - The HTML ID of the users video player
   * @param {number} payload.room_id - The ID of the room
   * @param {number} payload.speed - The current speed of the users video
   * @param {socket} socket - Socket.io socket object
   */
  function playSpeed(payload, socket) {
    socket.to(payload.room_id).emit("playSpeed", payload);
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

    socket.on("getTimeToSync", (payload) => {
      getTimeToSync(payload, socket);
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
