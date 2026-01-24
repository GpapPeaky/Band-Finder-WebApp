const mysql = require("mysql2/promise");
const { getConnection } = require("./dbConfig");

let connection;

async function getNumberOfEventsByType(type) {
  let conn;
  try {
    conn = await getConnection();

    if (!type) {
      throw new Error("Event type is required");
    } else if (type === "private") {
      const [count] = await conn.query(
        `SELECT COUNT(*) AS count FROM private_events`
      );
      return count[0].count;
    } else if (type === "public") {
      const [count2] = await conn.query(
        `SELECT COUNT(*) AS count FROM public_events`
      );
      return count2[0].count;
    } else {
      throw new Error("Invalid event type. Must be 'private' or 'public'");
    }
  } catch (error) {
    console.error("Error in getNumberOfEventsByType:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
async function getTotalMoney() {
  let conn;
  try {
    conn = await getConnection();

    const [count] = await conn.query(
      `SELECT SUM(price) AS total FROM private_events WHERE status = 'done'`
    );
    return count[0].total;
  } catch (error) {
    console.error("Error in getTotalMoney:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
async function getPublicEvents() {
  let conn;
  try {
    conn = await getConnection();
    const [events] = await conn.query(`SELECT * FROM public_events`);
    return events;
  } catch (error) {
    console.error("Error in getPublicEvents:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}
async function getPrivateEvents(user_type, username) {
  let conn;
  try {
    conn = await getConnection();
    if (user_type !== "user" && user_type !== "band") {
      throw new Error("Invalid user type");
    }
    if (user_type === "user") {
      const [events] = await conn.query(
        `SELECT * FROM private_events WHERE user_id = (SELECT user_id FROM users WHERE username = ?)`,
        [username]
      );
      return events;
    } else {
      const [events] = await conn.query(
        `SELECT * FROM private_events WHERE band_id = (SELECT band_id FROM bands WHERE username = ?)`,
        [username]
      );
      return events;
    }
  } catch (error) {
    console.error("Error in getPrivateEvents:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function updateRequest(private_event_id, band_decision) {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.query(
      `
            UPDATE private_events
            SET band_decision = ?
            WHERE private_event_id = ?
            AND status = 'requested'
        `,
      [band_decision, private_event_id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error("Error in updateRequest:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function deleteAvailableEvent(private_event_id) {
  let conn;
  try {
    conn = await getConnection();
    const [result] = await conn.query(
      `
              DELETE FROM private_events
              WHERE private_event_id = ?
              AND status = 'available'
          `,
      [private_event_id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error("Error in deleteAvailableEvent:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

async function createAvailableEvent(username, date) {
  let conn;
  try {
    conn = await getConnection();
    const isDateAllreadyClosedQuery = await conn.query(
      `
            SELECT COUNT(*) AS count
            FROM private_events pe WHERE pe.event_datetime = ? AND 
            band_id = (SELECT band_id FROM bands WHERE username = ?)
      `);
    if (isDateAllreadyClosedQuery[0][0].count > 0) {
      throw new Error("Date is already booked or marked unavailable");
    }
    const insertQueryRes = await conn.query(`
          INSERT INTO private_events (band_id, status, event_datetime)
          VALUES (
            (SELECT band_id FROM bands WHERE username = ?),
            'available',
            ?
          )
        `,[username, date]);
    return insertQueryRes[0].affectedRows;
  } catch (error) {
    console.error("Error in createAvailableEvent:", error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

module.exports = {
  getNumberOfEventsByType,
  getTotalMoney,
  getPublicEvents,
  getPrivateEvents,
  updateRequest,
  deleteAvailableEvent,
  createAvailableEvent,
};
