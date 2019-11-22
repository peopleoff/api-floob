module.exports = function(sequelize, DataTypes) {
    return sequelize.define('room_types', {
        name: {
            type: DataTypes.STRING(250),
            allowNull: true
        },
        description: {
            type: DataTypes.STRING(250),
            allowNull: true
        }
    }, {
        tableName: 'room_types',
        paranoid: true,
        timestamps: true,
    });
};