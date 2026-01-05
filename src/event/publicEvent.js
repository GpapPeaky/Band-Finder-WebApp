const { getConnection } = require("./db/db"); 

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

module.exports = router;
