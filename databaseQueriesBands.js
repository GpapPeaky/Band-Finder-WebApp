const mysql = require("mysql2/promise");
const { getConnection } = require("./dbConfig"); 

let connection;

// New function to retrieve all bands
async function getAllBands() {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.query("SELECT * FROM bands");
    return rows;
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function getBandByCredentials(username, password) {
  let conn;
  try {
    conn = await getConnection();

    const selectQuery = `
      SELECT * FROM bands
      WHERE username = ? AND password = ?
    `;

    const [rows] = await conn.execute(selectQuery, [username, password]);

    return rows; // returns an array of matching bands (likely 0 or 1)
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function updateBand(username, newBandName) {
  let conn;
  try {
    conn = await getConnection();

    const updateQuery = `
      UPDATE users
      SET band_name = ?
      WHERE username = ?
    `;

    const [result] = await conn.execute(updateQuery, [newBandName, username]);

    if (result.affectedRows === 0) {
      return "No band found with that username.";
    }

    return "Firstname updated successfully.";
  } catch (err) {
    throw new Error("DB error: " + err.message);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function deleteBand(username) {
  let conn;
  try {
    conn = await getConnection();

    const deleteQuery = `
      DELETE FROM bands
      WHERE username = ?
    `;

    const [result] = await conn.execute(deleteQuery, [username]);

    if (result.affectedRows === 0) {
      return "No band found with that username.";
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
async function bandExists(band_name) {
  let conn;
  try {
    conn = await getConnection();
    
    const [bandsResult] = await conn.query(
      'SELECT band_name FROM bands WHERE band_name = ?',
      [band_name]
    );
    
    return bandsResult.length > 0;
  } catch (err) {
    console.error("Error checking band:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

module.exports = { getAllBands, getBandByCredentials, updateBand, deleteBand ,bandExists };
