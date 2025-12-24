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

// Get bands at public events at a specific date
async function getBandsAtDate(date) {
  let conn;

  try {
    conn = await getConnection();

    const [bands] = await conn.query(
      `
      SELECT b.band
      FROM public_events pe
      JOIN bands b ON pe.band_id = b.band_id
      WHERE DATE(pe.event_datetime) = ?
      `,
      [date]
    );

    return bands;
  } catch (err) {
    console.error("Error geetting bands playing at a specific date: ", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Get bands at public events of a specific type :>
// Get bands at public events of a specific type :>
async function getBandsByPublicEventType(event_type) {
  let conn;

  try {
    conn = await getConnection();

    const [bands] = await conn.query(
      `
      SELECT b.band
      FROM public_events pe
      JOIN bands b ON pe.band_id = b.band_id
      WHERE pe.event_type = ?
      `,
      [event_type]
    );

    return bands;
  } catch (err) {
    console.error("Error getting bands playing at a specific type of event: ", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Get bands of less than a specific price.
async function getBandsByPublicEventPrice(price) {
  let conn;

  try {
    conn = await getConnection();

    const [bands] = await conn.query(
      `
      SELECT b.band
      FROM public_events pe
      JOIN bands b ON pe.band_id = b.band_id
      WHERE pe.price < ?
      `,
      [price]
    );

    return bands;
  } catch (err) {
    console.error("Error getting bands playing under a specific price: ", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Create a new available slot, reject a pending private event request from user
async function addBandAvailability(band_name, date) {
  // TODO.
}

async function removeBandAvailability(band_name, date) {
  // TODO.
}

module.exports = { getAllBands, getBandByCredentials, updateBand,
  deleteBand ,bandExists, getBandsAtDate, addBandAvailability,
  removeBandAvailability,
  getBandsByPublicEventType, getBandsByPublicEventPrice };
