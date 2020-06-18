const { users, current_viewers } = require("../models");
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
      return res.send({
        error: true,
        type: "error",
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
      })
      .then((user) => {
        if (user) {
          return res.send({
            error: true,
            type: "error",
            message: "User already exsists",
          });
        } else {
          req.body.password = bcrypt.hashSync(req.body.password, salt);
          users.create(req.body).then((response) => {
            let token = signUser(response);
            let user = {
              id: response.id,
              email: response.email,
              username: response.username,
              token: token,
            };
            //welcomeEmail(response.email)
            return res.status(200).send(user);
          });
        }
      })
      .catch((err) => {
        console.log(err);
        return res.send({
          error: true,
          type: "error",
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
      })
      .then((response) => {
        if (!response) {
          return res.send({
            error: true,
            type: "error",
            message: "Username or Password is incorrect",
          });
        } else {
          let passwordMatch = bcrypt.compareSync(password, response.password);
          if (passwordMatch) {
            let user = {
              id: response.id,
              email: response.email,
              username: response.username,
            };
            let token = signUser(user);
            return res.status(200).send({ token });
          } else {
            return res.send({
              error: true,
              type: "error",
              message: "Username or Password is incorrect",
            });
          }
        }
      });
  },
  getUser(req, res) {
    let token = getToken(req);
    if (token) {
      decoded = jwt.verify(token, jwtSecret).user;
      return res.status(200).send({ user: decoded });
    } else {
      return res.status(401).send({
        type: "error",
        message: "Username or Password is incorrect",
      });
    }
  },
  requestPasswordChange(req, res) {
    if (!req.body.username) {
      return res.send({
        error: true,
        message: "Please fill out all fields",
        type: "error",
      });
    }
    let token = jwt.sign(
      {
        username: req.body.username,
      },
      jwtSecret,
      {
        expiresIn: "30m",
      }
    );
    users
      .update(
        {
          reset_token: token,
        },
        {
          where: {
            [Op.or]: [
              { email_lowercase: req.body.username.toLowerCase() },
              { username_lowercase: req.body.username.toLowerCase() },
            ],
          },
        }
      )
      .then((user) => {
        //If no user found. Return generic message
        if (!user[0]) {
          return res.send({
            error: false,
            type: "success",
            message: "Thank you a password reset has to been sent",
          });
        } else {
          users
            .findOne({
              where: {
                reset_token: token,
              },
            })
            .then((result) => {
              passwordResetEmail(
                result.email,
                result.username,
                result.reset_token
              );
              return res.send({
                error: false,
                type: "success",
                message: "Thank you a password reset has to been sent",
              });
            })
            .catch((error) => {
              console.error(error);
            });
        }
      })
      .catch((error) => {
        return res.send({
          error: true,
          type: "error",
          message: error,
        });
      });
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
      return res.send({
        error: true,
        type: "error",
        message: "Please try again",
      });
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.send({
        error: true,
        type: "error",
        message: "Passwords do not match",
      });
    }
    //Decode token to get email
    jwt.verify(req.body.token, jwtSecret, function (err, decoded) {
      if (!decoded) {
        return res.send({
          error: true,
          type: "error",
          message: "Token has expired. Please resend password reset.",
        });
      } else {
        let newPassword = bcrypt.hashSync(req.body.password, salt);
        users
          .update(
            {
              password: newPassword,
            },
            {
              where: {
                [Op.or]: [
                  {
                    username_lowercase: decoded.username.toLowerCase(),
                  },
                  {
                    email_lowercase: decoded.username.toLowerCase(),
                  },
                ],
                reset_token: req.body.token,
              },
            }
          )
          .then((result) => {
            //if no user found, return error
            if (!result[0]) {
              return res.send({
                error: true,
                type: "error",
                message: "Error updating password. Please try to reset again.",
              });
            } else {
              return res.send({
                error: false,
                type: "success",
                message: "Password reset. Please login again",
              });
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }
    });
  },
};
