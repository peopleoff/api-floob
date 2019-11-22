var mongoObjectId = function () {
  var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
};

module.exports = function(sequelize, DataTypes) {
  const rooms = sequelize.define(
    "rooms",
    {
      roomID: {
        type: DataTypes.UUID,
        defaultValue: mongoObjectId,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING(250),
        allowNull: false
      },
      vanityName: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      description: {
        type: DataTypes.STRING(3000),
        allowNull: true
      },
      nsfw: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        allowNull: true
      },
      user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        }
      },
      type: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 2,
        references: {
          model: "room_types",
          key: "id"
        }
      }
    },
    {
      tableName: "rooms",
      paranoid: true,
      timestamps: true,
    }
  );

  return rooms;
};
