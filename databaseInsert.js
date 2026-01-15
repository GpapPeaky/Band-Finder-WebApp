const mysql = require("mysql2/promise");

let connection;

async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "HY359_2025",
    });
    console.log("MySQL connection established.");
  }
  return connection;
}

async function insertUser(user) {
  try {
    const conn = await getConnection();

    const insertQuery = `
          INSERT INTO users (
            username, email, password, firstname, lastname,
            birthdate, gender, country, city, address, telephone, lat, lon
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    await conn.execute(insertQuery, [
      user.username,
      user.email,
      user.password,
      user.firstname,
      user.lastname,
      user.birthdate,
      user.gender,
      user.country,
      user.city,
      user.address,
      user.telephone,
      user.lat,
      user.lon,
    ]);

    return "User inserted successfully (single connection reused).";
  } catch (err) {
    console.log(err.message);

    throw new Error("DB error: " + err.message);
  }
}

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
async function insertAdmin(admin) {
  try {
    const conn = await getConnection();
    const insertQuery = `
      INSERT INTO admins (
        admin_username, admin_password
      ) VALUES (?, ?)
    `;
    await conn.execute(insertQuery, [
      admin.admin_username,
      admin.admin_password
    ]);

    return "Admin inserted successfully.";
  } catch (err) {
    console.log(err.message);
    throw new Error("DB error: " + err.message);
  }
}
async function insertReview(review) {
  try {
    const conn = await getConnection();

    const insertQuery = `
      INSERT INTO reviews (
        band_name, sender, review, rating, date_time, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertQuery, [
      review.band_name,
      review.sender,
      review.review,
      review.rating,
      review.date_time,
      review.status,
    ]);

    return "Review inserted successfully.";
  } catch (err) {
    console.log(err.message);
    throw new Error("DB error: " + err.message);
  }
}
async function insertMessage(message) {
  try {
    const conn = await getConnection();

    const insertQuery = `
      INSERT INTO messages (
        private_event_id, message, sender, recipient, date_time
      ) VALUES (?, ?, ?, ?, ?)
    `;

    await conn.execute(insertQuery, [
      message.private_event_id,
      message.message,
      message.sender,
      message.recipient,
      message.date_time,
    ]);

    return "Message inserted successfully.";
  } catch (err) {
    console.log(err.message);
    throw new Error("DB error: " + err.message);
  }
}
async function deleteReview(review_id) {
  try {
    const conn = await getConnection();

    console.log(`Attempting to delete review ${review_id}`);

    // First, check if review exists
    const checkQuery = `SELECT review_id, status FROM reviews WHERE review_id = ?`;
    const [checkResult] = await conn.execute(checkQuery, [review_id]);

    if (checkResult.length === 0) {
      console.log(`Review ${review_id} not found in database`);
      return {
        deleted: false,
        affectedRows: 0,
        reason: "not_found",
      };
    }

    const currentStatus = checkResult[0].status;
    console.log(`Review ${review_id} current status: ${currentStatus}`);

    // Delete the review (no status restriction - can delete any review)
    const deleteQuery = `DELETE FROM reviews WHERE review_id = ?`;

    console.log(
      `Executing: DELETE FROM reviews WHERE review_id = ${review_id}`
    );

    const [result] = await conn.execute(deleteQuery, [review_id]);

    return {
      deleted: result.affectedRows > 0,
      affectedRows: result.affectedRows,
      currentStatus: currentStatus,
    };
  } catch (err) {
    console.log(err.message);
    throw new Error("DB error: " + err.message);
  }
}
async function modifyReview(review_id, status) {
  try {
    const conn = await getConnection();

    console.log(`Checking review ${review_id} before update`);

    const checkQuery = `SELECT review_id, status FROM reviews WHERE review_id = ?`;
    const [checkResult] = await conn.execute(checkQuery, [review_id]);

    if (checkResult.length === 0) {
      console.log(`Review ${review_id} not found in database`);
      return {
        updated: false,
        affectedRows: 0,
        reason: "not_found",
      };
    }

    const currentStatus = checkResult[0].status;
    console.log(`Review ${review_id} current status: ${currentStatus}`);

    // Update only if review is pending
    const updateQuery = `
      UPDATE reviews 
      SET status = ? 
      WHERE review_id = ? AND status = 'pending'
    `;

    console.log(
      `Executing: UPDATE reviews SET status='${status}' WHERE review_id=${review_id} AND status='pending'`
    );

    const [result] = await conn.execute(updateQuery, [status, review_id]);

    console.log(`Update affected ${result.affectedRows} rows`);

    if (result.affectedRows === 0) {
      console.log(`Update failed. Possible reasons:`);
      console.log(`1. Review ${review_id} not found`);
      console.log(
        `2. Review status is not 'pending' (it's '${currentStatus}')`
      );
    }

    return {
      updated: result.affectedRows > 0,
      affectedRows: result.affectedRows,
      currentStatus: currentStatus,
    };
  } catch (err) {
    console.log(err.message); // Use console.log like others
    throw new Error("DB error: " + err.message);
  }
}

async function insertPublicEvent(event) {
  try {
    const conn = await getConnection();

    const insertQuery = `
      INSERT INTO public_events (
        band_id,
        event_type,
        event_datetime,
        event_description,
        participants_price,
        event_city,
        event_address,
        event_lat,
        event_lon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertQuery, [
      event.band_id,
      event.event_type,
      event.event_datetime,
      event.event_description,
      event.participants_price,
      event.event_city,
      event.event_address,
      event.event_lat,
      event.event_lon,
    ]);
    return "Public event inserted successfully.";
  } catch (err) {
    console.log(err.message);
    throw new Error("DB error: " + err.message);
  }
}

async function insertPrivateEvent(event) {
  try {
    const conn = await getConnection();

    const insertQuery = `
      INSERT INTO private_events (
        band_id,
        price,
        status,
        band_decision,
        user_id,
        event_type,
        event_datetime,
        event_description,
        event_city,
        event_address,
        event_lat,
        event_lon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(insertQuery, [
      event.band_id,
      event.price,
      event.status,
      event.band_decision,
      event.user_id,
      event.event_type,
      event.event_datetime,
      event.event_description,
      event.event_city,
      event.event_address,
      event.event_lat,
      event.event_lon,
    ]);

    return "Private event inserted successfully.";
  } catch (err) {
    console.log(err.message);
    throw new Error("DB error: " + err.message);
  }
}

module.exports = {
  insertUser,
  insertBand,
  insertAdmin,
  insertReview,
  insertMessage,
  insertPublicEvent,
  insertPrivateEvent,
  modifyReview,
  deleteReview,
};
