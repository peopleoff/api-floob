const firstNames = ["Naruto", "Soul", "Kagyua", "Sauske", "Kakashi", "Yuugi"];
const lastNames = ["Uchiha", "Anime", "Names", "Hatake", "Muto", "Uzumaki"];

class Users {
  constructor() {
    this.users = [];
    
  }

  addUser(socketID, room_id, user) {
    let newUser = {
      socketID,
      room_id,
      user,
      currentTime: 0,
      duration: 0,
    };
    this.users.push(newUser);
    return newUser;
  }

  getUserList(room_id) {
    let users = this.users.filter((user) => user.room_id === room_id);
    return users;
  }

  createTempUser(){
    let tempFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    let tempLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    let tempUser = {
      id: Math.floor(Math.random() * Math.floor(10000)),
      username: `${tempFirstName} ${tempLastName}`,
      color: "#fff"
    }
    return tempUser;
  }

  getRooms() {
    let rooms = [...new Set(this.users.map((user) => user.room_id))];
    return rooms;
  }

  getHighestCurrentTime(room_id) {
    let users = this.getUserList(room_id);
    let highestCurrentTime = Math.max.apply(
      Math,
      users.map(function (user) {
        return user.currentTime;
      })
    );
    return highestCurrentTime;
  }

  getUser(socketID) {
    return this.users.filter((user) => user.socketID === socketID)[0];
  }

  removeUser(socketID) {
    let user = this.getUser(socketID);

    if (user) {
      this.users = this.users.filter((user) => user.socketID !== socketID);
    }

    return user;
  }

  updateUserVideoTimestamp(payload, socketID) {
    let user = this.getUser(socketID);
    user.currentTime = payload.currentTime;
    user.duration = payload.duration;
    return user;
  }
}

module.exports = { Users };
