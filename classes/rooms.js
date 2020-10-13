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
        video: {
          currentTime: 0,
          duration: 0,
          state: null
        }
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
    return this.rooms.filter((room) => room.room_id === room_id)[0];
  }

  getVideoInfo(room_id){
    return this.rooms.filter((room) => room.room_id === room_id)[0].video;
  }

  removeRoom(room_id) {
    let room = this.getRoom(room_id);

    if (room) {
      this.room = this.room.filter((room) => room.room_id !== room_id);
    }

    return room;
  }

  addUser(room_id, user){
    let room = this.getRoom(room_id);
    if(room){
      room.users.push(user)
    }else{

    }
  }

  getUsers(room_id){
    let room = this.rooms.filter((room) => room.room_id === room_id)[0];
    return room.users;
  }


}

module.exports = { Rooms };
