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
module.exports = {
  usernameExists,
  emailExists,
  phoneExistsSimple,
  phoneExistsBand,
  bandnameExistsBand,
  phoneExistsSimpleForother,
  getReviews,
};