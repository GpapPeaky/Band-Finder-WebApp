const mysql = require("mysql2/promise");
const { getConnection } = require("./dbConfig");
let connection;

// New function to retrieve all users
async function getAllUsers() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM users");
    return rows;
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function getUserByCredentials(username, password) {
  let conn;
  try {
    conn = await getConnection();

    const selectQuery = `
      SELECT * FROM users
      WHERE username = ? AND password = ?
    `;

    const [rows] = await conn.execute(selectQuery, [username, password]);

    return rows; // returns an array of matching users (likely 0 or 1)
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function getUserIdByName(username) {
  let conn;
  try {
    conn = await getConnection();

    const selectQuery = `
      SELECT user_id FROM users
      WHERE username = ?
    `;

    const [user_id] = await conn.execute(selectQuery, [user_id]);

    return user_id;
  } catch(err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if(conn) {
      await conn.end();
    }
  }
}

async function updateUser(
  username,
  password,
  firstname,
  lastname,
  birthdate,
  gender,
  country,
  city,
  address,
  telephone,
  lon,
  lat
) {
  let conn;
  try {
    conn = await getConnection();

    const updateQuery = `
      UPDATE users 
      SET 
        password = ?,
        firstname = ?,
        lastname = ?,
        birthdate = ?,
        gender = ?,
        country = ?,
        city = ?,
        address = ?,
        telephone = ?,
        lon = ?,
        lat = ?
      WHERE username = ?
    `;
    
    const [result] = await conn.execute(updateQuery, [
      password,
      firstname,
      lastname,
      birthdate,
      gender,
      country,
      city,
      address,
      telephone,
      lon,
      lat,
      username, // username for WHERE clause
    ]);
    
    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "No user found with that username and email.",
      };
    }

    return { success: true, message: "User profile updated successfully." };
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end(); // Close connection in finally block
    }
  }
}
/*
async function updateUser(username, newFirstname) {
  try {
    const conn = await getConnection();

    const updateQuery = `
      UPDATE users
      SET firstname = ?
      WHERE username = ?
    `;

    const [result] = await conn.execute(updateQuery, [newFirstname, username]);

    if (result.affectedRows === 0) {
      return 'No user found with that username.';
    }

    return 'Firstname updated successfully.';
  } catch (err) {
    throw new Error('DB error: ' + err.message);
  }
}*/

async function deleteUser(username) {
  let conn;
  try {
    conn = await getConnection();

    const deleteQuery = `
      DELETE FROM users
      WHERE username = ?
    `;

    const [result] = await conn.execute(deleteQuery, [username]);

    if (result.affectedRows === 0) {
      return "No user found with that username.";
    }

    return "User deleted successfully.";
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

module.exports = { getAllUsers, getUserByCredentials, updateUser, deleteUser, getUserIdByName, checkIfLoggedInAsUser };
