module.exports = function(sequelize, DataTypes) {
    const current_viewers = sequelize.define(
      'current_viewers',
      {
        user: {
          type: DataTypes.INTEGER,
          allowNull: true,
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
        socketID: {
            type: DataTypes.STRING(500),
            allowNull: true
          }
      },
      {
        tableName: 'current_viewers',
        paranoid: true,
        timestamps: true
      }
    )
  
    return current_viewers
  }
  