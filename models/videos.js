module.exports = function(sequelize, DataTypes) {
  const videos = sequelize.define(
    "videos",
    {
      src: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      provider: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      room: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "rooms",
          key: "id"
        }
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      channel: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      image: {
        type: DataTypes.STRING(500),
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
      skipCounter: {
        type: DataTypes.INTEGER(11),
        defaultValue: 0
      }
    },
    {
      tableName: "videos",
      paranoid: true,
      timestamps: true,
    }
  );

  return videos;
};
