module.exports = function(sequelize, DataTypes) {
    const api_logs = sequelize.define(
      'api_logs',
      {
        user: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id"
          }
        },
        user: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "rooms",
            key: "id"
          }
        },
        response: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        response: {
          type: DataTypes.TEXT,
          allowNull: true
        },
      },
      {
        tableName: 'api_logs',
        paranoid: true,
        timestamps: true
      }
    )
  
    return api_logs
  }
  