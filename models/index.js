const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const db = {};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    logging: console.log,
    dialect: "mysql",
    host: process.env.DB_HOST
  }
);

fs.readdirSync(__dirname)
  .filter(file => file !== "index.js")
  .forEach(file => {
    const model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

db.sequelize = sequelize;
db.Sequelize = sequelize;

module.exports = db;
