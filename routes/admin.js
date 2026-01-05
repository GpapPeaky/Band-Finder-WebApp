const express = require("express");
const router = express.Router();

const {
    deleteUser, 
    insertUser
} = require("../src/user/user");

const {
  getBandsPerCity,
  getNumberOfEvents,
  getNumberOfUsers,
} = require("../src/admin/admin");

// Get admin details (login)
router.post("/details", async (req, res) => {
  const { username, password } = req.body;

  // Validate credentials
  const isAdmin = username === ADMIN_USER && password === ADMIN_PASS;

  if (!isAdmin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Set admin cookie
  res.cookie("is_admin", "true", {
    httpOnly: true,
    sameSite: "strict",
    secure: false // true in production with HTTPS
  });

  return res.json({ success: true });
});

// Remove a user
router.delete("/removeUser/:user_name", async (req, res) => {
  if (checkIfLoggedInAsAdmin(req)) {
    try {
      const user_name = req.params.user_name;
      const result = await deleteUser(user_name);

      return res.status(200).json({
        success: true,
        message: `User ${user_name} removed successfully`,
      });

    } catch(err){
      console.error("Error removing user:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin access required",
    });
  }
});

// Get number of bands per city
router.get("/bandsPerCity", async (req, res) => {
  if (checkIfLoggedInAsAdmin(req)) {
    try {
      const bandsPerCity = await getBandsPerCity();

      return res.status(200).json({
        success: true,
        bandsPerCity: bandsPerCity,
      });
    } catch(err){
      console.error("Error getting bands per city:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin access required",
    });
  }
});

// Get the number of events
router.get("/numOfEvents/:type", async (req, res) => {
  if (checkIfLoggedInAsAdmin(req)) {
    try {
      const eventType = req.params.type;
      const numOfEvents = await getNumberOfEvents(eventType);
      return res.status(200).json({
        success: true,
        eventType: eventType,
        numOfEvents: numOfEvents,
      });
    } catch(err){
      console.error("Error getting number of events:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin access required",
    });
  }
});

// Get the number of users
router.get("/numOfUsers/:type", async (req, res) => {
  if (checkIfLoggedInAsAdmin(req)) {
    try {
      const userType = req.params.type;
      const numOfUsers = await getNumberOfUsers(userType);

      return res.status(200).json({
        success: true,
        userType: userType,
        numOfUsers: numOfUsers,
      });
    } catch(err){
      console.error("Error getting number of users:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin access required",
    });
  }
});

module.exports = router;