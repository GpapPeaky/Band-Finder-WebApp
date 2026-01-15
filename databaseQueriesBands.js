const mysql = require("mysql2/promise");
const { getConnection } = require("./dbConfig"); 
const { getUserByCredentials } = require("./databaseQueriesUsers");
const { usernameExists } = require("./databaseQueriesBoth");

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

async function checkIfBandAvailableAtDate(band_id, date) {
  const result = await conn.query(
    `
      SELECT * FROM private_events 
      WHERE band_id = $1
        AND event_datetime = $2
        AND status = 'available'
        AND event_type = 'availability'
    `,
    [band_id, date]
  );

  if(result.rowCount === 0) {
    return false;
  }

  return true;
}

async function requestBandForEvent(user_id, band_name, date, event_type, event_description, event_city, event_address) {
  const band_Id = await getBandIdByName(band_name);

  
  // check if the private event of that date and band_id has status -> available and event_type availability
  // if yes post to it the new data
  // else throw error and fuck off.
  const valid = await checkIfBandAvailableAtDate(band_Id, date);
  
  if(valid){
    await createPrivateEvent(user_id, band_Id, date, event_type, event_description, event_city, event_address);
  }

  return valid;
}

async function createPrivateEvent(
  user_id,
  band_Id,
  date,
  event_type,
  event_description,
  event_city,
  event_address
) {
  let conn;

  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // find the private event
    const [events] = await conn.query(
      `
      SELECT private_event_id
      FROM private_events
      WHERE band_id = ?
        AND event_datetime = ?
        AND status = 'available'
        AND event_type = 'availability'
      `,
      [band_Id, date]
    );

    if (events.length === 0) {
      throw new Error("Band is not available on this date");
    }

    const private_event_id = events[0].private_event_id;

    // Update availability
    await conn.query(
      `
      UPDATE private_events
      SET
        user_id = ?,
        event_type = ?,
        event_description = ?,
        event_city = ?,
        event_address = ?,
        status = 'pending',
        band_decision = 'pending'
      WHERE private_event_id = ?
      `,
      [
        user_id,
        event_type,
        event_description,
        event_city,
        event_address,
        private_event_id
      ]
    );

    return private_event_id;
  } catch (err) {
    throw new Error("Failed to create private event: " + err.message);
  } finally {
    if (conn) await conn.end();
  }
}

async function getBandsPerCity() {
  let conn;

  try {
    conn = await getConnection();

    // TODO.
    const [bandCount_City_Pairs] = conn.query(
      `
        
      `
    )
  } catch(err) {

  }
}

module.exports = { getAllBands, getBandByCredentials, updateBand,
  deleteBand ,bandExists, getBandsAtDate, setBandAvailability,
  removeBandAvailability, getBandsPerCity, requestBandForEvent,
  getBandsByPublicEventType, getBandsByPublicEventPrice, getBandAvailability
 };