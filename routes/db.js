const express = require("express");
const router = express.Router();

const { initDatabase, dropDatabase } = require("../database");
const {
  insertUser,
  insertBand,
  insertAdmin,
  insertReview,
  insertMessage,
  insertPublicEvent,
  insertPrivateEvent,
} = require("../databaseInsert");
const {
  admins,
  users,
  bands,
  public_events,
  private_events,
  reviews,
  messages,
} = require("../resources");
const {
  getAllUsers,
} = require("../databaseQueriesUsers");

router.get("/initdb", async (req, res) => {
  try {
    const result = await initDatabase();
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/insertRecords", async (req, res) => {
  try {
    for (const user of users) var result = await insertUser(user);
    for (const band of bands) var result = await insertBand(band);
    for (const pev of public_events) var result = await insertPublicEvent(pev);
    for (const rev of reviews) var result = await insertReview(rev);
    for (const priv of private_events)
      var result = await insertPrivateEvent(priv);
    for (const msg of messages) var result = await insertMessage(msg);
    for (const admin of admins) var result = await insertAdmin(admin);
    res.send(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
});

router.get("/dropdb", async (req, res) => {
  try {
    const message = await dropDatabase();
    res.send(message);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;