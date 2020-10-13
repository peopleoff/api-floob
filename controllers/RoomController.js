const {
  rooms,
  users_rooms,
  users,
  current_viewers,
  videos,
} = require("../models");
const fs = require("fs");
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
        //Set result to global var
        // publicRooms = result.sort((one, other) => {
        //   //a - b is
        //   //   0 when elements are the same
        //   //  >0 when a > b
        //   //  <0 when a < b
        //   return other.videos.length - one.videos.length
        // });
        publicRooms = result.filter((room) => {
          return room.type === 2;
        });
        sponsoredRooms = result.filter((room) => {
          return room.type === 3;
        });
        recommendedRooms = result.filter((room) => {
          return room.type === 5;
        });
        // publicRooms = publicRooms.sort((one, other) => {
        //   //a - b is
        //   //   0 when elements are the same
        //   //  >0 when a > b
        //   //  <0 when a < b
        //   return other.videos.length - one.videos.length
        // });
        // sponsoredRooms = sponsoredRooms.sort((one, other) => {
        //   //a - b is
        //   //   0 when elements are the same
        //   //  >0 when a > b
        //   //  <0 when a < b
        //   return other.videos.length - one.videos.length
        // });
        // recommendedRooms = recommendedRooms.sort((one, other) => {
        //   //a - b is
        //   //   0 when elements are the same
        //   //  >0 when a > b
        //   //  <0 when a < b
        //   return other.videos.length - one.videos.length
        // });
        return res.send({
          publicRooms: publicRooms,
          sponsoredRooms: sponsoredRooms,
          recommendedRooms: recommendedRooms,
        });
        // if (!req.body.user) {
        // }
        //Next find all rooms for user if logged in.
        // users_rooms
        //   .findAll({
        //     where: {
        //       user: req.body.user
        //     },
        //     include: [
        //       {
        //         model: users,
        //         as: 'roomUser'
        //       },
        //       {
        //         model: rooms,
        //         as: 'roomInfo'
        //       }
        //     ]
        //   })
        //   .then(response => {
        //     //Set result to global var
        //     favoriteRooms = response
        //     //Send global vars
        //     return res.send({
        //       publicRooms: publicRooms,
        //       favoriteRooms: favoriteRooms
        //     })
        //   })
      })
      .catch((error) => {
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
        console.error(error);
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
        return res.send({
          error: true,
          type: "error",
          message: error,
        });
      });
  },
  async register(req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
      return res.status(400).send({
        error: true,
        type: "error",
        message: "Error",
      });
    }
    
    try {
      let [room] = await rooms.findOrCreate({
        where: {
          user: req.body.user,
        },
        defaults: {
          name: randomName(),
          user: req.body.user,
        },
      });
      return res.status(200).send({
        room: room.room_uuid,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        type: "error",
        message: "Error Creating room, Please try again or Contact Support",
      });
    }
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
              console.error(deletedError);
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
              console.error(createdError);
            });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  },
};
