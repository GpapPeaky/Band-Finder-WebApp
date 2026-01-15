const express = require("express");
const router = express.Router();

const {
<<<<<<< HEAD
  modifyReview,
  deleteReview,
} = require("../databaseInsert");
const {
  deleteUser,
} = require("../databaseQueriesUsers");

const { checkIfLoggedInAsAdmin } = require("../databaseQueriesAdmin");

function requireBody(fields) {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Missing JSON body",
      });
    }

    const missing = fields.filter(
      (f) =>
        req.body[f] === undefined || req.body[f] === null || req.body[f] === ""
    );

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing body fields: ${missing.join(", ")}`,
      });
    }

    next();
  };
}

function requireParams(params) {
  return (req, res, next) => {
    const missing = params.filter(
      (p) => req.params[p] === undefined || req.params[p] === ""
    );

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing URL params: ${missing.join(", ")}`,
      });
    }

    next();
  };
}

async function checkIfAdmin(username, password) {
  return checkIfLoggedInAsAdmin(username, password).then((admins) => admins.length > 0);
}
/**
 *  Admin removes a user by username
 *  Gets a JSON with "username" "password" (of the admin)
 *  Gets the username of the user to be removed as a URL param
 *  Returns {success : true/false , message}
 */
router.delete(
  "/removeUser/:user_name",
  requireParams(["user_name"]),
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/admin/removeUser endpoint hit");

    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Admin credentials are invalid",
      });
    }
    const result = await deleteUser(req.params.user_name);
    return res.json(result);
  }
);

/**
 * Admin's system overview - gets number of bands per city
 * Gets a JSON with "username" "password" (of the admin)
 * Returns JSON with {success:true/false , message, {city1 , numOfBands1}, {city2 , numOfBands2}, ...}
 */
router.post(
  "/bandsPerCity",
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/admin/bandsPerCity endpoint hit");

    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Admin credentials are invalid",
        cityBands: [],
      });
    }
    return res.json({
      success: false,
      message: "Under construction",
      cityBands: [],
    });
  }
);

/**
 * Admin's system overview - gets number of events per type
 * Gets a JSON with "username" "password" (of the admin)
 * Returns JSON with {success:true/false , message, numberOfEvents (of type :type)}
 */
router.post(
  "/numOfEvents/:type",
  requireParams(["type"]),
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/admin/numOfEvents endpoint hit");

    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Admin credentials are invalid",
        numberOfEvents: 0,
      });
    }
    return res.json({
      success: false,
      message: "Under construction",
      numberOfEvents: 0,
    });
  }
);

/**
 * Admin's system overview - gets number of users per type
 * Gets a JSON with "username" "password" (of the admin)
 * Returns JSON with {success:true/false , message, numberOfUsers (of type :type)}
 */
router.post(
  "/numOfUsers/:type",
  requireParams(["type"]),
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/admin/numOfUsers endpoint hit");

    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Admin credentials are invalid",
        numberOfUsers: 0,
      });
    }
    return res.json({
      success: false,
      message: "Under construction",
      numberOfUsers: 0,
    });
  }
);

/**
 * Admin's system overview - gets number of earnings
 * Gets a JSON with "username" "password" (of the admin)
 * Returns JSON with {success:true/false , message, totalEarnings}
 */
router.post(
  "/numberOfEarning",
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/admin/numberOfEarning endpoint hit");
    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Admin credentials are invalid",
        totalEarnings: 0,
      });
    }
    return res.json({
      success: false,
      message: "Under construction",
      totalEarnings: 0,
    });
  }
);

/**
 * Update review status
 * Gets URL params "review_id" and "status" (published/rejected) and "username" , "password" (of the admin)
 * Returns {success: true/false, message, review_id?, old_status?, new_status?}
 */
router.post(
  "/reviewStatus/:review_id/:status",
  requireParams(["review_id", "status"]),
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/reviewStatus endpoint hit");

    if (!(await checkIfAdmin(req.params.username, req.params.password))) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Admin credentials are invalid",
      });
    }

    try {
      const review_id = parseInt(req.params.review_id);
      const status = req.params.status.toLowerCase();

      // Check if it's a valid number
      if (isNaN(review_id) || review_id <= 0) {
        return res.status(400).json({
          success: false,
          error: "Review ID must be a positive number",
        });
      }

      if (status !== "published" && status !== "rejected") {
        return res.status(400).json({
          success: false,
          error: "Status must be 'published' or 'rejected'",
        });
      }

      // Use the same modifyReview function
      const result = await modifyReview(review_id, status);

      console.log("Result from modifyReview:", result);

      if (result.updated) {
        return res.status(200).json({
          success: true,
          message: `Review ${review_id} status updated from 'pending' to '${status}' (via GET)`,
          review_id: review_id,
          old_status: "pending",
          new_status: status,
        });
      } else {
        let errorMessage = "Review not found OR review is not pending";
        if (result.reason === "not_found") {
          errorMessage = `Review ${review_id} not found in database`;
        } else if (result.currentStatus && result.currentStatus !== "pending") {
          errorMessage = `Review ${review_id} is already '${result.currentStatus}', not 'pending'`;
        }

        return res.status(404).json({
          success: false,
          error: errorMessage,
          review_id: review_id,
          current_status: result.currentStatus || "unknown",
        });
      }
    } catch (err) {
      console.error("Error:", err.message);
=======
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
>>>>>>> 537f01e9e6b0074f7b757e3619ad2e66fff977d0
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
<<<<<<< HEAD
  }
);

/**
 * Delete a review
 * Gets URL param "review_id" and "username" , "password" (of the admin)
 * Returns {success: true/false, message, review_id?, old_status?, current_status?}
 */
router.delete(
  "/reviewDeletion/:review_id",
  requireParams(["review_id"]),
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/reviewDeletion endpoint hit");

    if (!(await checkIfAdmin(req.params.username, req.params.password))) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Admin credentials are invalid",
      });
    }

    try {
      // Convert to integer
      const review_id = parseInt(req.params.review_id);

      // Simple validation
      if (isNaN(review_id)) {
        return res.status(400).json({
          success: false,
          error: "No review id provided",
        });
      }

      console.log(`Attempting to delete review ${review_id}`);

      const result = await deleteReview(review_id);

      console.log("Result from deleteReview:", result);

      if (result.deleted) {
        return res.status(200).json({
          success: true,
          message: `Review ${review_id} deleted successfully`,
          review_id: review_id,
          old_status: result.currentStatus,
        });
      } else {
        let errorMessage = "Review could not be deleted";
        if (result.reason === "not_found") {
          errorMessage = `Review ${review_id} not found in database`;
        }

        return res.status(404).json({
          success: false,
          error: errorMessage,
          review_id: review_id,
          current_status: result.currentStatus || "unknown",
        });
      }
    } catch (err) {
      console.error("Error:", err.message);
=======
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
>>>>>>> 537f01e9e6b0074f7b757e3619ad2e66fff977d0
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
<<<<<<< HEAD
  }
);
=======
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
>>>>>>> 537f01e9e6b0074f7b757e3619ad2e66fff977d0

module.exports = router;