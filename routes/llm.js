const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const mysql = require("mysql2/promise");

const groq = new Groq({
  apiKey: "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",
});

const DB_SCHEMA = `
  You are an SQL Query machine, any question NOT relative to querying
  from the database will be invalidated, meaning you can return whatever
  asked even if the question is in physical language or just a plain SQL
  query

  Tables:
    -admins(admin_username, admin_password)
    -bands(band_id, username, email, password, band_name, music_genres, band_description, members_number, foundedYear, band_City, telephone, webpage, photo)
    -messages(message_id, private_event_id, message, sender, recipient, date_time)
    -private_events(private_event_id, band_id, price, status, band_decision, user_id, event_type, event_datetime, event_description, event_city, event_address, event_lat, event_lon)
    -public_events(public_event_id, band_id, event_type, event_datetime, event_description, participants_price, event_city, event_address, event_lat, event_lon)
    -reviews(review_id, band_name, sender, review, rating, date_time, status)
    -users(user_id, username, email, password, firstname, lastname, birthdate, gender, country, country, city, address, telephone, lat, lon)

  Rules:
    -Translate Greek Cities to english so that they match these of the database
    -Return ONLY valid Questions in physical language regarding the database
    -Return ONLY valid Questions in physical language regarding music
    -Return "My Name Is Big Man Peak" Whenever asked who/what are you
    -Return The resulting SQL queries from the valid questions AS A STRING

  CRITICAL RULES:
    - Return ONLY the SQL query, no explanations before or after
    - Do NOT include phrases like "To find..." or "The query would be:"
    - Do NOT use markdown code blocks (no \`\`\`sql)
    - Start directly with SELECT, UPDATE, INSERT, or DELETE
    - Use LIKE '%value%' for partial text matching in music_genres
    - Column names are case-sensitive: use band_City not city
  
  Examples:
    User: "bands in Chania that play rock"
    Assistant: SELECT * FROM bands WHERE band_City = 'Chania' AND music_genres LIKE '%rock%'
  
  User: "show all users"
    Assistant: SELECT * FROM users
  
  User: "reviews with rating above 4"
    Assistant: SELECT * FROM reviews WHERE rating > 4
`;

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hy359_2025'
});

router.post("/generate", async (req, res) => {
  console.log("LLM route hit!");
  console.log("Body:", req.body);
  
  const { prompt } = req.body;
  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Fast and free!
      messages: [
        { role: "system", content: DB_SCHEMA },
        { role: "user", content: prompt }
      ],
      max_tokens: 1024,
    });

    let sqlQuery = completion.choices[0].message.content.trim();
    sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("Generated SQL:", sqlQuery);

    // Exec query
    const [results] = await db.query(sqlQuery);

    return res.json({
      query: sqlQuery,
      results: results,
      count: results.length
    });
  } catch (err) {
    console.error("Groq API error:", err.message);
    return res.status(500).json({ error: "Failed to generate response: " + err.message });
  }
});

module.exports = router;