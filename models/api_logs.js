module.exports = function(sequelize, DataTypes) {
  const api_logs = sequelize.define(
    'api_logs',
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
        allowNull: true,
        references: {
          model: 'rooms',
          key: 'id'
        }
      },
      service: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      params: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      request: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'api_logs',
      paranoid: true,
      timestamps: true
    }
  )

  return api_logs
}
