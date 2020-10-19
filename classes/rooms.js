class Rooms {
  constructor() {
    this.rooms = [];
  }

  addRoom(room_id, room_uuid) {
    let room = this.getRoom(room_id);

    if (!room) {
      let newRoom = {
        room_id,
        room_uuid,
        users: [],
      };
      this.rooms.push(newRoom);
      return newRoom;
    } else {
      return room;
    }
  }

  getAllRooms() {
    return this.rooms;
  }

  getRoom(room_id) {
    if (parseInt(room_id)) {
      return this.rooms.filter((room) => room.room_id === room_id)[0];
    } else {
      return this.rooms.filter((room) => room.room_uuid === room_id)[0];
    }
  }

  getVideoInfo(room_id) {
    return this.rooms.filter((room) => room.room_id === room_id)[0].video;
  }

  addUser(room_id, user) {
    let room = this.getRoom(room_id);
    if (room) {
      room.users.push(user);
    } else {
      room = null;
    }
    return room;
  }

  getUsers(room_id) {
    let room = this.rooms.filter((room) => room.room_id === room_id)[0];
    return room.users;
  }

  getUser(socketID) {
    let rooms = this.getAllRooms();
    let foundUser;

    rooms.forEach((room) => {
      room.users.forEach((user) => {
        if (user.socketID == socketID) {
          foundUser = user;
        }
      });
    });
    return foundUser;
  }

  getRoomFromSocketID(socketID) {
    let rooms = this.getAllRooms();
    let foundRoom;

    rooms.forEach((room) => {
      room.users.forEach((user) => {
        if (user.socketID == socketID) {
          foundRoom = room;
        }
      });
    });
    return foundRoom;
  }

  updateUserVideoInfo(socketID, videoInfo) {
    const user = this.getUser(socketID);
    if (user) {
      user.videoInfo = videoInfo;
    }
    return user;
  }

  getCurrentVideoInfo(room_id){
    const users = this.getUsers(room_id);
    let videoInfo;
    if(users){
      videoInfo = Math.max.apply(Math, users.map(function(user) { return user.videoInfo.currentTime; }))
    }
    return videoInfo
  }

  removeUser(socketID) {
    let user = this.getUser(socketID);
    if (user) {
      this.rooms.forEach((room) => {
        room.users = room.users.filter((s) => s.socketID != socketID);
      });
    }
    return user;
  }
}

module.exports = { Rooms };
