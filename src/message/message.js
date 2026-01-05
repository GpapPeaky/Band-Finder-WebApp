const { getConnection } = require("./db/db"); 

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

module.exports = router;
