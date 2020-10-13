// import { v5 as uuidv5 } from 'uuid'; // For version 5
const { v1: uuidv1 } = require("uuid");

function generateRoomID() {
  let uuid = uuidv1().replace(/[0-9, -]/g, "");
  let shortUUID = uuid.slice(0, 8);
  let randomUUID = shortUUID
    .split("")
    .map((v) => (Math.round(Math.random()) ? v.toUpperCase() : v.toLowerCase()))
    .join("");
  return randomUUID;
}

module.exports = function (sequelize, DataTypes) {
  const rooms = sequelize.define(
    "rooms",
    {
      room_uuid: {
        type: DataTypes.UUID,
        defaultValue: generateRoomID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      vanityName: {
        type: DataTypes.STRING(250),
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(3000),
        allowNull: true,
      },
      nsfw: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        allowNull: true,
      },
      user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      type: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 2,
        references: {
          model: "room_types",
          key: "id",
        },
      },
    },
    {
      tableName: "rooms",
      paranoid: true,
      timestamps: true,
    }
  );

  return rooms;
};
