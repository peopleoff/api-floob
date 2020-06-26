const { users, current_viewers, rooms } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { signUser } = require("../config/auth");
const {
  passwordResetEmail,
  welcomeEmail,
} = require("../controllers/MailController");
const jwtSecret = require("../config/config").authentication.jwtSecret;
const salt = require("../config/config").authentication.salt;
const sgMail = require("@sendgrid/mail");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
sgMail.setApiKey(process.env.API_FLOOB_SENDGRIDAPI);

users.hasMany(current_viewers, {
  foreignKey: "room",
  as: "1",
  sourceKey: "id",
});
current_viewers.belongsTo(users, {
  foreignKey: "room",
  as: "2",
  sourceKey: "id",
});

users.hasOne(rooms, {
  foreignKey: "user",
  as: "userRoom",
});

function getToken(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    // Authorization: Bearer g1jipjgi1ifjioj
    // Handle token presented as a Bearer token in the Authorization header
    return req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    // Handle token presented as URI param
    return req.query.token;
  } else if (req.body && req.body.token) {
    // Handle token presented as a cookie parameter
    return req.body.token;
  } else if (req.cookies && req.cookies.token) {
    // Handle token presented as a cookie parameter
    return req.cookies.token;
  }
  // If we return null, we couldn't find a token.
  // In this case, the JWT middleware will return a 401 (unauthorized) to the client for this request
  return null;
}

module.exports = {
  register(req, res) {
    if (!req.body) {
      return res.status(401).send({
        message: "No Information submitted",
      });
    }
    users
      .findOne({
        where: {
          [Op.or]: [
            {
              username_lowercase: req.body.username.toLowerCase(),
            },
            {
              email_lowercase: req.body.email.toLowerCase(),
            },
          ],
        },
        raw: true,
      })
      .then((user) => {
        if (user) {
          return res.status(401).send({
            message: "User already exsists",
          });
        } else {
          req.body.password = bcrypt.hashSync(req.body.password, salt);
          users.create(req.body).then((response) => {
            let user = {
              id: response.id,
              email: response.email,
              username: response.username,
            };
            let token = signUser(user);
            if (process.env.ENV !== "DEVELOPMENT") {
              welcomeEmail(response.email);
            }
            return res.status(200).send({ token });
          });
        }
      })
      .catch((err) => {
        return res.send({
          message: err,
        });
      });
  },
  login(req, res) {
    let username = req.body.username.toLowerCase();
    let password = req.body.password;
    users
      .findOne({
        where: {
          [Op.or]: [
            { email_lowercase: username },
            { username_lowercase: username },
          ],
        },
        include: [{ model: rooms, as: "userRoom" }],
      })
      .then((response) => {
        if (!response) {
          return res.send({
            message: "Username or Password is incorrect",
          });
        } else {
          let passwordMatch = bcrypt.compareSync(password, response.password);
          if (passwordMatch) {
            let user = {
              id: response.id,
              email: response.email,
              username: response.username,
              color: response.color,
              room: response.userRoom.roomUUID,
            };
            let token = signUser(user);
            return res.status(200).send({ token });
          } else {
            return res.status(401).send({
              error: true,
              message: "Username or Password is incorrect",
            });
          }
        }
      });
  },
  getUser(req, res) {
    let token = getToken(req);
    if (token) {
      try {
        decoded = jwt.verify(token, jwtSecret).user;
        return res.status(200).send({ user: decoded });
      } catch (error) {
        return res.status(401).send({
          message:
            "Reset time has expired, please request a new password reset",
        });
      }
    } else {
      console.log("here?");
      return res.status(401).send({
        message: "Username or Password is incorrect",
      });
    }
  },
  async requestPasswordChange(req, res) {
    //Return error if no username is entered
    if (!req.body.username) {
      return res.status(401).send({
        message: "Please fill out all fields",
      });
    }
    try {
      //Look for either username or email provided
      let user = await users.findOne({
        where: {
          [Op.or]: [
            { email_lowercase: req.body.username.toLowerCase() },
            { username_lowercase: req.body.username.toLowerCase() },
          ],
        },
      });

      //If user exsists update record with token and send reset email
      if (user) {
        let resetToken = {
          id: user.id,
          username: user.email,
        };
        let token = jwt.sign(
          {
            user: resetToken,
          },
          jwtSecret,
          {
            expiresIn: "30m",
          }
        );
        let tokenUpdate = await user.update({
          reset_token: token,
        });
        passwordResetEmail(
          tokenUpdate.email,
          tokenUpdate.username,
          tokenUpdate.reset_token
        );
      }

      //Return success message to user
      return res.status(200).send({
        message: "Thank you a password reset has to been sent",
      });
    } catch (error) {
      return res.status(401).send({
        message: "Please fill out all fields",
      });
    }
  },
  getUsers(req, res) {
    users
      .findAll({
        include: [
          {
            model: current_viewers,
            as: "1",
          },
        ],
      })
      .then((result) => {
        return res.send(result);
      })
      .catch((error) => {
        console.error(error);
      });
  },
  changePassword(req, res) {
    if (!req.body) {
      return res.statsu(401).send({
        message: "Please try again",
      });
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.statsu(401).send({
        message: "Passwords do not match",
      });
    }
    try {
      decoded = jwt.verify(req.body.token, jwtSecret).user;
      let newPassword = bcrypt.hashSync(req.body.password, salt);
      users
        .update(
          {
            password: newPassword,
          },
          {
            where: {
              id: decoded.id,
              reset_token: req.body.token,
            },
          }
        )
        .then((result) => {
          //if no user found, return error
          if (!result[0]) {
            return res.status(401).send({
              message: "Error updating password. Please try to reset again.",
            });
          } else {
            return res.status(200).send({
              message: "Password reset. Please login again",
            });
          }
        })
        .catch((error) => {
          return res.status(401).send({
            message: "Error updating password. Please try to reset again.",
          });
        });
    } catch (error) {
      return res.status(401).send({
        message: "Reset time has expired, please request a new password reset",
      });
    }
  },
};
