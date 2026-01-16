const express = require("express");
const router = express.Router();

const { modifyReview, deleteReview } = require("../databaseInsert");
const { deleteUser } = require("../databaseQueriesUsers");

const { checkIfLoggedInAsAdmin } = require("../databaseQueriesAdmin");

const { getBandsPerCity } = require("../databaseQueriesBands");
const {
  getNumberOfEventsByType,
  getTotalMoney,
} = require("../databaseQueriesEvents");
const { getNumberOfUsersByType } = require("../databaseQueriesBoth");

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
  return checkIfLoggedInAsAdmin(username, password).then(
    (admins) => admins.length > 0
  );
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

    const cityBands = await getBandsPerCity();
    return res.json({
      success: true,
      message: "Number of bands per city retrieved successfully",
      cityBands: cityBands,
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

    try {
      if (!(await checkIfAdmin(req.body.username, req.body.password))) {
        return res.json({
          success: false,
          message: "Unauthorized: Admin credentials are invalid",
          numberOfEvents: 0,
        });
      }

      if (req.params.type !== "public" && req.params.type !== "private") {
        return res.json({
          success: false,
          message: "Invalid event type",
          numberOfEvents: 0,
        });
      }

      const numberOfEvents = await getNumberOfEventsByType(req.params.type);
      return res.json({
        success: true,
        message: `Number of events of type ${req.params.type} retrieved successfully`,
        numberOfEvents: numberOfEvents,
      });
    } catch (err) {
      console.error("Error in /admin/numOfEvents:", err);
      return res.json({
        success: false,
        message: "Server error: " + err.message,
        numberOfEvents: 0,
      });
    }
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
    try {
      if (req.params.type !== "band" && req.params.type !== "user") {
        return res.json({
          success: false,
          message: "Invalid user type",
          numberOfUsers: 0,
        });
      }

      const numberOfUsers = await getNumberOfUsersByType(req.params.type);
      return res.json({
        success: true,
        message: `Number of users of type ${req.params.type} retrieved successfully`,
        numberOfUsers: numberOfUsers,
      });
    } catch (err) {
      console.error("Error in /admin/numOfUsers:", err);
      return res.json({
        success: false,
        message: "Server error: " + err.message,
        numberOfUsers: 0,
      });
    }
  }
);

/**
 * Admin's system overview - gets number of earnings
 * Gets a JSON with "username" "password" (of the admin)
 * Returns JSON with {success:true/false , message, totalEarnings}
 * (το 15% της τιμής των private events που έχουν κατάσταση done)
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
    try {
      const totalEarnings = await getTotalMoney();
      return res.json({
        success: true,
        message: `Total earnings retrieved successfully`,
        totalEarnings: totalEarnings * 0.15,
      });
    } catch (err) {
      console.error("Error in /admin/numberOfEarning:", err);
      return res.json({
        success: false,
        message: "Server error: " + err.message,
        totalEarnings: 0,
      });
    }
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

    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
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
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
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

    if (!(await checkIfAdmin(req.body.username, req.body.password))) {
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
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  }
);

module.exports = router;
