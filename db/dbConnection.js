const mysql = require("mysql2");
const dbConfig = require("./dbConfig.js");

var connection = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
});

connection.config.namedPlaceholders = true;

module.exports = connection;
