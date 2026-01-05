// routes/user.js
const express = require("express");
const router = express.Router();

// routes here
router.get("/", (req, res) => {
  res.send("USER ROUTE");
});

module.exports = router;
