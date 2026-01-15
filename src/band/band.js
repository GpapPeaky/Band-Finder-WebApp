const { getConnection } = require("../db/db"); 

async function insertBand(band) {
  try {
    const conn = await getConnection();

    const insertQuery = `
      INSERT INTO bands (
        username, email, password, band_name, music_genres,
        band_description, members_number, foundedYear, band_city,
        telephone, webpage, photo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertQuery, [
      band.username,
      band.email,
      band.password,
      band.band_name,
      band.music_genres,
      band.band_description,
      band.members_number,
      band.foundedYear,
      band.band_city,
      band.telephone,
      band.webpage,
      band.photo,
    ]);

    return "Band inserted successfully.";
  } catch (err) {
    console.log(err.message);

    throw new Error("DB error: " + err.message);
  }
}

// Create a new available slot, reject a pending private event request from user
// Private events created from here have a status set to available, for users to 
// request the band at that specific date, else they can't 
async function setBandAvailability(band_name, date) {
  let conn;
  try {
    conn = await getConnection();
    const band_id = await getBandIdByName(band_name);

    const [exists] = await conn.query(
      `
      SELECT 1
      FROM private_events
      WHERE band_id = ?
        AND event_datetime = ?
        AND status = 'available'
        AND event_type = 'availability'
      `,
      [band_id, date]
    );

    if (exists.length > 0) {
      throw new Error("Availability already exists for this date");
    }

    await conn.query(
      `
      INSERT INTO private_events (band_id, status, event_type, event_datetime)
      VALUES (?, 'available', 'availability', ?)
      `,
      [band_id, date]
    );
  } finally {
    if (conn) await conn.end();
  }
}

async function removeBandAvailability(band_name, date){
  const band_id = await getBandIdByName(band_name);

  const result = await conn.query(
    `
    DELETE FROM private_events
    WHERE band_id = $1
      AND event_datetime = $2
      AND status = 'available'
      AND event_type = 'availability'
    `,
    [band_id, date]
  );

  if (result.rowCount === 0) {
    throw new Error("No availability found for this date");
  }
}

async function getBandAvailability(band_name) {
  let conn;

  try {
    conn = await getConnection();
    const band_id = await getBandIdByName(band_name);

    const [rows] = await conn.query(
      `
      SELECT 
        private_event_id,
        event_datetime
      FROM private_events
      WHERE band_id = ?
        AND status = 'available'
        AND event_type = 'availability'
      ORDER BY event_datetime ASC
      `,
      [band_id]
    );

    return rows; // array of available slots
  } catch (err) {
    throw new Error("Failed to get band availability: " + err.message);
  } finally {
    if (conn) await conn.end();
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

async function getBandIdByName() {
  const result = await conn.query(
    "SELECT band_id FROM bands WHERE band_name = $1",
    [band_name]
  );

  if (result.rowCount === 0) {
    throw new Error("Band not found");
  }

  return result.rows[0].band_id;
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

module.exports = {
    getBandAvailability,
    getBandByCredentials,
    getAllBands,
    getBandIdByName,
    bandExists,
    deleteBand,
    insertBand,
    updateBand,
    removeBandAvailability,
    setBandAvailability,
    getBandAvailability
}
