function pickRandomColor() {
  let colors = [
    "#2f64EB",
    "#634FD6",
    "#00CCC2",
    "#BB67F5",
    "#161663"
  ];
  var color = colors[Math.floor(Math.random() * colors.length)];
  return color
}


module.exports = function(sequelize, DataTypes) {
  const users = sequelize.define(
    "users",
    {
      username: {
        type: DataTypes.STRING(250),
        allowNull: false
      },
      username_lowercase: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(250),
        allowNull: false
      },
      email_lowercase: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      password: {
        type: DataTypes.STRING(250),
        allowNull: false
      },
      date_of_birth: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      color: {
        type: DataTypes.STRING(250),
        defaultValue: pickRandomColor,
        allowNull: true
      },
      type: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: 2,
        references: {
          model: "user_types",
          key: "id"
        }
      },
      token: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      socketID: {
        type: DataTypes.STRING(250),
        allowNull: true
      },
      reset_token: {
        type: DataTypes.STRING(250),
        allowNull: true
      }
    },
    {
      tableName: "users",
      paranoid: true,
      timestamps: true,
    }
  );

  users.beforeCreate(function(user, options) {
    user.username_lowercase = user.username.toLowerCase();
    user.email_lowercase = user.email.toLowerCase();
    return user;
  });

  return users;
};
