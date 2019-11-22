module.exports = function(sequelize, DataTypes) {
  const users_rooms = sequelize.define(
    'users_rooms',
    {
      user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      room: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'id'
        }
      }
    },
    {
      tableName: 'users_rooms',
      paranoid: true,
      timestamps: true
    }
  )

  return users_rooms
}
