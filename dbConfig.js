// dbConfig.js
const mysql = require("mysql2/promise");

async function getConnection() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "HY359_2025",
  });
  return connection;
}

module.exports = { getConnection };