module.exports = function(sequelize, DataTypes) {
    const vote_to_skip = sequelize.define(
      'vote_to_skip',
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
        video: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'videos',
            key: 'id'
          }
        },
      },
      {
        tableName: 'vote_to_skip',
        paranoid: true,
        timestamps: true
      }
    )
  
    return vote_to_skip
  }
  