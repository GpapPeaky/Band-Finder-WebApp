const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Init DB


// routes
app.use("/users", require("./routes/user"));
app.use("/bands", require("./routes/band"));
app.use("/reviews", require("./routes/review"));
app.use("/events", require("./routes/event"));
app.use("/admin", require("./routes/admin"));
app.use("/messages", require("./routes/message"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
