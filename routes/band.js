const express = require("express");
const router = express.Router();

const {
  getBandByCredentials,
} = require("../databaseQueriesBands");

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
  return getBandByCredentials(username, password).then((bands) => bands.length > 0);
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
    return res.json({
      success: false,
      message: "Under construction",
    });
  }
);

/**
 *  Remove a date that the band is available
 *  Gets a JSON with "username" "password" (of the band) and "date" (YYYY-MM-DD)
 *  Returns {success: true/false , message}
 */
router.delete(
  "/removeAvailability",
  requireBody(["username", "password", "date"]),
  async (req, res) => {
    console.log("/bands/removeAvailability endpoint hit");
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
 * Band updates a request for an event request
 * Gets a JSON with "username" , "password" (of the band), "private_event_id" , "band_decision" (accepted/rejected)
 * Returns {success: true/false , message}
 */
router.post(
  "/updateRequest",
  requireBody(["username", "password", "private_event_id", "band_decision"]),
  async (req, res) => {
    console.log("/band/updateRequest endpoint hit");
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

module.exports = router;