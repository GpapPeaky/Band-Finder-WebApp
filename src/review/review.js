const { getUserByCredentials } = require("../user/user");
const { getConnection } = require("../db/db"); 

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

module.exports = {
    getReviews,
    insertReview,
    deleteReview,
    modifyReview
}
