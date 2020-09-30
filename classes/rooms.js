class Rooms {
  constructor() {
    this.rooms = [];
  }

  addRoom(room) {
    let room = this.getRoom(room.roomUUID);

    if (!room) {
      let newRoom = {
        roomID,
        roomUUID,
        users: [],
        currentTime: 0,
      };
      this.room.push(newRoom);
      return newRoom;
    } else {
      return room;
    }
  }

  addUser(user, room) {
    let room = getRoom(room.roomUUID);

    if (room) {
      room.users.push(user);
    }

    return room;
  }

  getRoomList(roomUUID) {
    let rooms = this.rooms.filter((room) => room.roomUUID === roomUUID);
    return rooms;
  }

  getRoom(roomUUID) {
    return this.rooms.filter((room) => room.roomUUID === roomUUID)[0];
  }

  removeRoom(roomUUID) {
    let room = this.getRoom(roomUUID);

    if (room) {
      this.room = this.room.filter((room) => room.roomUUID !== roomUUID);
    }

    return room;
  }
}

module.exports = { Rooms };
