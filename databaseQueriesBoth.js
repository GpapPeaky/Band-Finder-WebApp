const mysql = require("mysql2/promise");

const { getConnection } = require("./dbConfig");

async function getReviews(band_name, ratingFrom = 1, ratingTo = 5) {
  let conn;
  try {
    conn = await getConnection();

    let query;
    let params = [];

    if (band_name === "all") {
      // Get reviews for all bands
      query = `
        SELECT r.*, b.band_name 
        FROM reviews r
        JOIN bands b ON r.band_name = b.band_name
        WHERE r.status = 'published'
        AND r.rating BETWEEN ? AND ?
        ORDER BY r.date_time DESC
      `;
      params = [ratingFrom, ratingTo];
    } else {
      // Get reviews for specific band
      query = `
        SELECT * FROM reviews 
        WHERE band_name = ? 
        AND status = 'published'
        AND rating BETWEEN ? AND ?
        ORDER BY date_time DESC
      `;
      params = [band_name, ratingFrom, ratingTo];
    }

    const [rows] = await conn.execute(query, params);
    return rows;
  } catch (err) {
    console.error("Error getting reviews:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

module.exports = { getReviews };
// Check if username exists in users OR bands table
async function usernameExists(username) {
  let conn;
  try {
    conn = await getConnection();

    // Check in users table
    const [usersResult] = await conn.query(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );

    // Check in bands table
    const [bandsResult] = await conn.query(
      "SELECT username FROM bands WHERE username = ?",
      [username]
    );

    // Return true if found in either table
    return usersResult.length > 0 || bandsResult.length > 0;
  } catch (err) {
    console.error("Error checking username:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Check if email exists in users OR bands table
async function emailExists(email) {
  let conn;
  try {
    conn = await getConnection();

    // Check in users table
    const [usersResult] = await conn.query(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    // Check in bands table
    const [bandsResult] = await conn.query(
      "SELECT email FROM bands WHERE email = ?",
      [email]
    );

    // Return true if found in either table
    return usersResult.length > 0 || bandsResult.length > 0;
  } catch (err) {
    console.error("Error checking email:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
// Check if phone exists in users
async function phoneExistsSimple(telephone) {
  let conn;
  try {
    conn = await getConnection();

    // Check in users table
    const [usersResult] = await conn.query(
      "SELECT telephone FROM users WHERE telephone = ?",
      [telephone]
    );

    // Return true if found in either table
    return usersResult.length > 0;
  } catch (err) {
    console.error("Error checking telephone:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
async function phoneExistsSimpleForother(username, telephone) {
  let conn;
  try {
    conn = await getConnection();

    // Check in users table
    const [usersResult] = await conn.query(
      "SELECT telephone FROM users WHERE telephone = ? and username != ?",
      [telephone, username]
    );

    // Return true if found in either table
    return usersResult.length > 0;
  } catch (err) {
    console.error("Error checking telephone:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
// Check if email phone in bands table
async function phoneExistsBand(telephone) {
  let conn;
  try {
    conn = await getConnection();

    // Check in bands table
    const [bandsResult] = await conn.query(
      "SELECT telephone FROM bands WHERE telephone = ?",
      [telephone]
    );

    // Return true if found in either table
    return bandsResult.length > 0;
  } catch (err) {
    console.error("Error checking telephone:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Check if band_name exists bands table
async function bandnameExistsBand(band_name) {
  let conn;
  try {
    conn = await getConnection();

    // Check in bands table
    const [bandsResult] = await conn.query(
      "SELECT band_name FROM bands WHERE band_name = ?",
      [band_name]
    );

    // Return true if found in either table
    return bandsResult.length > 0;
  } catch (err) {
    console.error("Error checking band_name:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
async function getNumberOfUsersByType(type) {
  let conn;
  try {
    conn = await getConnection();
    if (!type) {
      throw new Error("User type is required");
    } else if (type === "user") {
      const [usersResult] = await conn.query(
        "SELECT COUNT(*) AS count FROM users"
      );
      return usersResult[0].count;
    } else if (type === "band") {
      const [bandsResult] = await conn.query(
        "SELECT COUNT(*) AS count FROM bands"
      );
      return bandsResult[0].count;
    } else {
      throw new Error("Invalid user type");
    }
  } catch (err) {
    console.error("Error getting number of users by type:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
async function getMessageHistory(private_event_id) {
  let conn;
  try {
    conn = await getConnection();

    const [messages] = await conn.query(
      "SELECT message, sender,private_event_id FROM messages WHERE private_event_id = ? ORDER BY date_time ASC",
      [private_event_id]
    );
    //send only message and sender back
    return messages.map((msg) => ({
      message: msg.message,
      sender: msg.sender,
    }));
  } catch (err) {
    console.error("Error retrieving messages:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function isPartOfTheEvent(private_event_id, sender_type, username) {
  let conn;
  if (sender_type !== "user" && sender_type !== "band") {
    throw new Error("Invalid sender type");
  }

  try {
    conn = await getConnection();
    if (sender_type === "user") {
      const [events] = await conn.query(
        `SELECT COUNT(*) AS count
         FROM private_events WHERE private_event_id = ? AND user_id = (SELECT user_id FROM users WHERE username = ?)`,
        [private_event_id, username]
      );
      console.log(`Events count for user ${username} and event ${private_event_id}: ${events[0].count}`);
      return events[0].count > 0;
    } else {
      const [events2] = await conn.query(
        `SELECT COUNT(*) AS count
         FROM private_events WHERE private_event_id = ? AND band_id = (SELECT band_id FROM bands WHERE username = ?)`,
        [private_event_id, username]
      );

      console.log(`Events count for band ${username} and event ${private_event_id}: ${events2[0].count}`);
      return events2[0].count > 0;
    }
  } catch (err) {
    console.error("Error checking event participation:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// returns number of affected rows
async function newMessage(private_event_id, sender_type,message) {
  let conn;
  try {
    conn = await getConnection();
    const [messages] = await conn.query(
      "INSERT INTO messages (private_event_id, sender,message) VALUES (?, ?, ?)",
      [private_event_id,sender_type,message]
    );
    return messages.affectedRows;
  } catch (err) {
    console.error("Error adding new message:", err);
    throw err;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
module.exports = {
  usernameExists,
  emailExists,
  phoneExistsSimple,
  phoneExistsBand,
  bandnameExistsBand,
  phoneExistsSimpleForother,
  getReviews,
  getNumberOfUsersByType,
  getMessageHistory,
  isPartOfTheEvent,
  newMessage
};
