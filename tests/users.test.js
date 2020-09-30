const expect = require("expect");

const { Users } = require("../classes/users");

let users;

beforeEach(() => {
  users = new Users();
  users.users = [
    {
      socketID: 100,
      username: "Legendary Soviet",
      roomID: "8dj28d",
      currentTime: 0,
      duration: 0,
    },
    {
      socketID: 200,
      username: "Anthony Kings",
      roomID: "8dj28d",
      currentTime: 0,
      duration: 0,
    },
    {
      socketID: 300,
      username: "Koala Wully",
      roomID: "8dj28d2",
      currentTime: 0,
      duration: 0,
    },
  ];
});

test("Should add a new user", () => {
  let users = new Users();
  let user = {
    socketID: 200,
    username: "Test User",
    roomID: "8dj28d",
    currentTime: 0,
    duration: 0,
  };

  let returnUsers = users.addUser(user.socketID, user.username, user.roomID);

  expect(users.users).toEqual([user]);
});

test("Should return names for roomID 8dj28d", () => {
  let userList = users.getUserList("8dj28d");

  expect(userList).toEqual([
    {
      socketID: 100,
      username: "Legendary Soviet",
      roomID: "8dj28d",
      currentTime: 0,
      duration: 0,
    },
    {
      socketID: 200,
      username: "Anthony Kings",
      roomID: "8dj28d",
      currentTime: 0,
      duration: 0,
    },
  ]);
});

test("Should return user 100", () => {
  let userID = 100;
  let user = users.getUser(userID);

  expect(user.socketID).toEqual(100);
});

test("Should not return a user", () => {
  let userID = 1000;
  let user = users.getUser(userID);

  expect(user).toBeUndefined();
});

test("Should remove user 200", () => {
  let userID = 200;
  user = users.removeUser(userID);

  expect(user.socketID).toBe(userID);
  expect(users.users.length).toBe(2);
});

test("Should not remove a user", () => {
  let userID = 2000;
  user = users.removeUser(userID);

  expect(user).toBeUndefined;
  expect(users.users.length).toBe(3);
});

test("Should change update video current time and duration", () => {
  let socketID = 200;
  let payload = {
    currentTime: 50,
    duration: 100,
  };
  let updatedUser = users.updateVideo(payload, socketID);

  expect(updatedUser.duration).toEqual(100);
});
