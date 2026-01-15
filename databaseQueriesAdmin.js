const mysql = require("mysql2/promise");
const { getConnection } = require("./dbConfig");
let connection;

async function checkIfLoggedInAsAdmin(username, password) {
  let conn;
  try {
    conn = await getConnection();

    const selectQuery = `
      SELECT * FROM admins
      WHERE admin_username = ? AND admin_password = ?
    `;

    const [rows] = await conn.execute(selectQuery, [username, password]);

    console.log("number of rows returned:", rows.length);
    return rows; // returns an array of matching users (likely 0 or 1)
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

module.exports = { checkIfLoggedInAsAdmin };