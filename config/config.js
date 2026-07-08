require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "mysql",
  },
  test: {
    username: "",
    password: null,
    database: "",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "",
    password: null,
    database: "",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
