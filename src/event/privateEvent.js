const { getConnection } = require("./db/db"); 

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

module.exports = router;
