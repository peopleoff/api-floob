const expect = require("expect");

const { Rooms } = require("../classes/rooms");

let rooms;
//Temp rooms
let room1 = {
  room_id: 1,
  room_uuid: "fAabeafd",
  users: [
    {
      id: 1,
      email: "admin@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "fAabeafd",
      socketID: "96d10124a791ececd4be182abafb5d9d",
    },
    {
      id: 2,
      email: "ruslan@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "fAabeafd",
      socketID: "1a96da9be03985271b4567647e3bf6c0",
    },
    {
      id: 3,
      email: "koala@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "fAabeafd",
      socketID: "bf245e6dc98f9fd85485852651436518",
    },
  ],
};
let room2 = {
  room_id: 12,
  room_uuid: "tsdgf33",
  users: [
    {
      id: 12,
      email: "admin2@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "tsdgf33",
      socketID: "168e3c818a9e1569cd2857fbe2dbd871",
    },
    {
      id: 22,
      email: "ruslan2@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "tsdgf33",
      socketID: "bb381ae02e76ceab673f8a543b0d3c82",
    },
    {
      id: 32,
      email: "koala2@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "tsdgf33",
      socketID: "fd1f93d9239076017904f642010d04fd",
    },
  ],
};
let room3 = {
  room_id: 13,
  room_uuid: "gjk6756dfg",
  users: [
    {
      id: 13,
      email: "admin3@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "gjk6756dfg",
      socketID: "SIqbI7xGOSN57MGrAAAB",
    },
    {
      id: 22,
      email: "ruslan3@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "gjk6756dfg",
      socketID: "8-1_IBNRejuR77QaAAAC",
    },
    {
      id: 33,
      email: "koala3@admin.com",
      username: "admin",
      color: "#00CCC2",
      room: "gjk6756dfg",
      socketID: "2OR-D1Nla0zNPBFfAAAB",
    },
  ],
};

beforeEach(() => {
  rooms = new Rooms();
  rooms.rooms.push(room1);
  rooms.rooms.push(room2);
  rooms.rooms.push(room3);
});

test("Should create a new room", () => {
  let newRoom = {
    room_id: 44,
    room_uuid: "420xxxGamerxxx420",
    users: [],
  };

  let returnRoom = rooms.addRoom(newRoom.room_id, newRoom.room_uuid);

  expect(returnRoom).toEqual(newRoom);
});

test("Should attempt to create room but instead return already created room", () => {
  let newRoom = {
    room_id: 1,
    room_uuid: "420xxxGamerxxx420",
    users: [],
  };

  let returnRoom = rooms.addRoom(newRoom.room_id, newRoom.room_uuid);

  expect(returnRoom).toEqual(room1);
});

test("Should return room for room_id = 1", () => {
  let returnRoom = rooms.getRoom(1);
  expect(returnRoom).toEqual(room1);
});

test("Should return all rooms", () => {
  let returnRoom = rooms.getAllRooms();
  expect(returnRoom).toHaveLength(3);
});

test("Should return 3 users for room_id 1", () => {
  let returnRoom = rooms.getUsers(1);
  expect(returnRoom).toHaveLength(3);
});

test("Should add a user for room_id 1", () => {
  let newUser = {
    color: "#00CCC2",
    email: "NewUser@admin.com",
    id: 69,
    room: "fAabeafd",
    username: "NewUser",
    socketID: "f2937da9ce4193535f2e40909af17948",
  };
  let returnRoom = rooms.addUser(1, newUser);
  expect(returnRoom).toEqual(room1);
});

test("Should return user from socketID", () => {
  let socketID = "SIqbI7xGOSN57MGrAAAB";
  let returnUser = rooms.getUser(socketID);
  expect(returnUser).toEqual(room3.users[0]);
});

test("Should remove a user for room_id 1", () => {
  let socketID = "SIqbI7xGOSN57MGrAAAB";
  let returnRoom = rooms.removeUser(socketID);
  expect(returnRoom).toEqual({
    id: 13,
    email: "admin3@admin.com",
    username: "admin",
    color: "#00CCC2",
    room: "gjk6756dfg",
    socketID: "SIqbI7xGOSN57MGrAAAB",
  });
});

test("Should return a room from a socketID", () => {
  let socketID = "SIqbI7xGOSN57MGrAAAB";
  let returnRoom = rooms.getRoomFromSocketID(socketID);
  expect(returnRoom).toEqual(room3);
});

test("Should return null when adding a user for room_id 1", () => {
  let newUser = {
    color: "#00CCC2",
    email: "NewUser@admin.com",
    id: 69,
    room: "fAabeafd",
    username: "NewUser",
    socketID: "1db79173e7e5c93f6ea5b8dc70d9f38b",
  };
  let returnRoom = rooms.addUser(55, newUser);
  expect(returnRoom).toBeNull();
});
