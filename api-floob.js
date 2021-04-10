require("dotenv").config();
//Packages
const express = require("express");
const Sentry = require("@sentry/node");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");

//Models
const { sequelize } = require("./models");

app.use(Sentry.Handlers.requestHandler());
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(cors());

require("./routes")(app);

if (process.env.ENV == "PRODUCTION") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });
  app.use(Sentry.Handlers.errorHandler());
}

const server = app.listen(process.env.PORT, function () {
  console.log(`server running on port ${process.env.PORT}`);
});

sequelize.sync().then(() => {
  console.log("sequelize synced");
});

const io = require("socket.io")(server, {
  origins: "https://floob.gg:* https://www.floob.gg:* http://localhost:*",
  secure: true,
});

app.set("io", io);

require("./socket")(io);
