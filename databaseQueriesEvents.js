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
module.exports = { getNumberOfEventsByType, getTotalMoney };
