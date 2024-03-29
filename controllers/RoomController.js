const {
  rooms,
  users_rooms,
  users,
  current_viewers,
  videos,
} = require("../models");
const fs = require("fs");
const { errorHandler } = require("../functions");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

users_rooms.belongsTo(users, { as: "roomUser", foreignKey: "user" });
users_rooms.belongsTo(rooms, { as: "roomInfo", foreignKey: "room" });

rooms.hasMany(current_viewers, { foreignKey: "room" });
current_viewers.belongsTo(rooms, { as: "viewerInfos", foreignKey: "room" });

rooms.hasMany(videos, { foreignKey: "room" });
videos.belongsTo(rooms, { as: "videoInfo", foreignKey: "room" });

fs.readFile("./roomNames/animeNames.json", handleFile);
let animeNames;
// Write the callback function
function handleFile(err, data) {
  if (err) throw err;
  animeNames = JSON.parse(data);
}
function randomName() {
  let random = Math.floor(Math.random() * animeNames.length);
  let random2 = Math.floor(Math.random() * animeNames.length);
  return animeNames[random] + " " + animeNames[random2];
}
module.exports = {
  getAll(req, res) {
    let publicRooms = [];
    let sponsoredRooms = [];
    let recommendedRooms = [];
    //First find all public rooms
    rooms
      .findAll({
        include: [
          {
            model: videos,
          },
        ],
      })
      .then((result) => {
        publicRooms = result.filter((room) => {
          return room.type === 2;
        });
        sponsoredRooms = result.filter((room) => {
          return room.type === 3;
        });
        recommendedRooms = result.filter((room) => {
          return room.type === 5;
        });
        return res.send({
          publicRooms: publicRooms,
          sponsoredRooms: sponsoredRooms,
          recommendedRooms: recommendedRooms,
        });
      })
      .catch((error) => {
        errorHandler(error);
        return res.send({
          error: true,
          type: "error",
          message: error,
        });
      });
  },
  getInfo(req, res) {
    rooms
      .findOne({
        where: {
          room_uuid: req.body.id,
        },
        raw: true,
      })
      .then((room) => {
        return res.status(200).send(room);
      })
      .catch((error) => {
        errorHandler(error);
        return res.status(401).send({
          type: "error",
          message: error.message,
        });
      });
  },
  getCurrentViewers(payload, socketID) {
    return new Promise((resolve, reject) => {
      current_viewers
        .findAndCountAll({
          where: {
            room: payload.room_id,
          },
        })
        .then((result) => {
          resolve(result.count);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  addToRoom(payload, socketID) {
    let userID = null;
    if (payload.user) {
      userID = payload.user.id;
    }

    let newUser = {
      user: userID,
      room: payload.room_id,
      socketID: socketID,
    };
    current_viewers
      .create(newUser)
      .then((result) => {
        console.log("User Added");
      })
      .catch((error) => {
        errorHandler(error);
      });
  },
  removeFromRoom(payload, socketID) {
    let room_id;
    if (!payload) {
      room_id = "";
    } else {
      room_id = payload.room_id;
    }
    current_viewers.destroy({
      where: {
        [Op.or]: [
          {
            socketID: socketID,
            room: room_id,
          },
          {
            socketID: socketID,
          },
        ],
      },
    });
  },
  updateRoom(req, res) {
    if (!req.body) {
      return res.send({
        error: true,
        type: "error",
        message: "Error",
      });
    }
    if (req.body.room.keepRoom == true) {
      req.body.room.type = 4;
    }
    rooms
      .update(req.body.room, {
        where: {
          id: req.body.room.id,
        },
      })
      .then((result) => {
        if (result) {
          return res.send({
            error: false,
            type: "success",
            message: "Room Updated!",
          });
        }
      })
      .catch((error) => {
        errorHandler(error);
        return res.send({
          error: true,
          type: "error",
          message: error,
        });
      });
  },
  register(req, res) {
    rooms
      .create({
        name: randomName(),
        user: req.body.user,
      })
      .then((result) => {
        return res.send({
          room: result.room_uuid,
        });
      })
      .catch((error) => {
        errorHandler(error);
        return res.status(500).send({
          message: error,
        });
      });
  },
  toggleRoom(req, res) {
    if (!req.body) {
      return res.send({
        error: true,
        type: "error",
        message: "Error",
      });
    }
    users_rooms
      .findOne({
        where: {
          user: req.body.user,
          room: req.body.room,
        },
      })
      .then((response) => {
        //If room found, delete record
        if (response) {
          users_rooms
            .destroy({
              where: {
                user: req.body.user,
                room: req.body.room,
              },
            })
            .then((deletedResponse) => {
              if (deletedResponse) {
                return res.send({
                  error: false,
                  type: "success",
                  message: "Room Removed!",
                });
              }
            })
            .catch((deletedError) => {
              errorHandler(deletedError);
            });
        } else {
          users_rooms
            .create(req.body)
            .then((createdResponse) => {
              if (createdResponse) {
                return res.send({
                  error: false,
                  type: "success",
                  message: "Room Added!",
                });
              }
            })
            .catch((createdError) => {
              errorHandler(createdError);
            });
        }
      })
      .catch((error) => {
        errorHandler(error);
      });
  },
};
