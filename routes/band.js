const express = require("express");
const router = express.Router();

const { getBandByCredentials } = require("../databaseQueriesBands");
const { isPartOfTheEvent } = require("../databaseQueriesBoth");
const {
  updateRequest,
  deleteAvailableEvent,
  createAvailableEvent
} = require("../databaseQueriesEvents");
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
async function checkIfBand(username, password) {
  return getBandByCredentials(username, password).then(
    (bands) => bands.length > 0
  );
}
/**
 * Band details / verifies band login
 * Gets a JSON with "username" "password"
 * Returns {success: true/false, message, band}
 */
router.get(
  "/details",
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/band/details endpoint hit");

    try {
      const bands = await getBandByCredentials(
        req.body.username,
        req.body.password
      );

      if (bands.length > 0) {
        return res.json({
          success: true,
          message: "Band found",
          band: bands[0],
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
          band: null,
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
        band: null,
      });
    }
  }
);

/**
 * Band creates a public event
 * Gets a JSON with "username" , "password" , "event_address", "event_city"  , "event_datetime" ,
 *                  "event_description" , "event_lat" , "event_lon", "event_type" , "participants_price"
 * Returns {success: true/false , message }
 */
router.put(
  "/createEvent",
  requireBody([
    "username",
    "password",
    "event_address",
    "event_city",
    "event_datetime",
    "event_description",
    "event_lat",
    "event_lon",
    "event_type",
    "participants_price",
  ]),
  async (req, res) => {
    console.log("/band/createEvent endpoint hit");
    if (!(await checkIfBand(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Invalid credentials",
      });
    }
    return res.json({
      success: false,
      message: "Under construction",
    });
  }
);

/**
 * Band availability endpoints
 * Gets a JSON with "username" "password" (of the band) and "date" (YYYY-MM-DD)
 * Returns {success: true/false , message}
 */
router.put(
  "/setAvailability",
  requireBody(["username", "password", "date"]),
  async (req, res) => {
    console.log("/bands/setAvailability endpoint hit");

    if (!(await checkIfBand(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Invalid credentials",
      });
    }
    try {
      const date = Date.parse(req.body.date);
      //check if date is on the future
      if (isNaN(date) || date < Date.now()) {
        return res.json({
          success: false,
          message: "Invalid date. Must be a valid future date.",
        });
      }

      const result = await createAvailableEvent(req.body.username, req.body.date);

      if (result > 0) {
        return res.json({
          success: true,
          message: "Availability set successfully",
        });
      } else {
        return res.json({
          success: false,
          message: "Failed to set availability",
        });
      }
    } catch (err) {
      return res.json({
        success: false,
        message: "Error on setting new availability :" + err.message,
      });
    }
  }
);

/**
 *  Remove a date that the band is available
 *  Gets a JSON with "username" "password" (of the band) and "private_event_id"
 *  Returns {success: true/false , message}
 */
router.delete(
  "/removeAvailability",
  requireBody(["username", "password", "private_event_id"]),
  async (req, res) => {
    console.log("/bands/removeAvailability endpoint hit");
    try {
      if (!(await checkIfBand(req.body.username, req.body.password))) {
        return res.json({
          success: false,
          message: "Unauthorized: Invalid credentials",
        });
      }

      let isPart = await isPartOfTheEvent(
        req.body.private_event_id,
        "band",
        req.body.username
      );

      if (!isPart) {
        return res.json({
          success: false,
          message: "Unauthorized: You are not part of this event",
        });
      }

      const result = await deleteAvailableEvent(req.body.private_event_id);

      if (result > 0) {
        return res.json({
          success: true,
          message: "Request deleted successfully",
        });
      } else {
        return res.json({
          success: false,
          message:
            "Request didn't get deleted (probably didnt exist or hasnt available status)",
        });
      }
    } catch (err) {
      console.error("Error in /band/removeAvailability:", err);
      return res.json({
        success: false,
        message: "Error deleting request: " + err.message,
      });
    }
  }
);

/**
 *  Band updates its details
 *  Gets a JSON with all band's attributes
 *  Returns {success: true/false , message}
 */
router.post(
  "/updateBand",
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/band/updateBand endpoint hit");
    if (!(await checkIfBand(req.body.username, req.body.password))) {
      return res.json({
        success: false,
        message: "Unauthorized: Invalid credentials",
      });
    }
    return res.json({
      success: false,
      message: "Under construction",
    });
  }
);

/**
 * Band updates a request for an event request (status == requested)
 * Gets a JSON with "username" , "password" (of the band), "private_event_id" , "band_decision" (to be done/rejected)
 * Returns {success: true/false , message}
 */
router.post(
  "/updateRequest",
  requireBody(["username", "password", "private_event_id", "band_decision"]),
  async (req, res) => {
    console.log("/band/updateRequest endpoint hit");

    try {
      if (!(await checkIfBand(req.body.username, req.body.password))) {
        return res.json({
          success: false,
          message: "Unauthorized: Invalid credentials",
        });
      }

      // Validate band_decision
      if (
        req.body.band_decision !== "to be done" &&
        req.body.band_decision !== "rejected"
      ) {
        return res.json({
          success: false,
          message: "Invalid band_decision. Must be 'to be done' or 'rejected'",
        });
      }

      let isPart = await isPartOfTheEvent(
        req.body.private_event_id,
        "band",
        req.body.username
      );

      if (!isPart) {
        return res.json({
          success: false,
          message: "Unauthorized: You are not part of this event",
        });
      }

      const result = await updateRequest(
        req.body.private_event_id,
        req.body.band_decision
      );

      if (result > 0) {
        return res.json({
          success: true,
          message: "Request updated successfully",
        });
      } else {
        return res.json({
          success: false,
          message: "Request didn't get updated (probably wasn't found)",
        });
      }
    } catch (err) {
      console.error("Error in /band/updateRequest:", err);
      return res.json({
        success: false,
        message: "Error updating request: " + err.message,
      });
    }
  }
);

module.exports = router;
