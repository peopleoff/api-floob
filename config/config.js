require("dotenv").config();
const fs = require('fs');

module.exports = {
  port: 8081,
  db: {
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    options: {
      logging: console.log,
      port: 25060,
      dialect: "mysql",
      host: process.env.DB_HOST
    }
  },
  authentication: {
    jwtSecret: "N8WEkWuC_@f4C,Sy(:&Z",
    salt: "$2a$10$Q/AH0MPPKyMVNzshASojgO"
  }
};
