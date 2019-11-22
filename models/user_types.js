module.exports = function(sequelize, DataTypes) {
    return sequelize.define('user_types', {
        name: {
            type: DataTypes.STRING(250),
            allowNull: true
        },
        description: {
            type: DataTypes.STRING(250),
            allowNull: true
        }
    }, {
        tableName: 'user_types',
        paranoid: true,
        timestamps: true,
    });
};