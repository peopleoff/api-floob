module.exports = function(sequelize, DataTypes) {
  const messages = sequelize.define(
    'messages',
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
      },
      message: {
        type: DataTypes.STRING(500),
        allowNull: false
      }
    },
    {
      tableName: 'messages',
      paranoid: true,
      timestamps: true
    }
  )

  return messages
}
