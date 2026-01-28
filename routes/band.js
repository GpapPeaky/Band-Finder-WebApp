const express = require("express");
const router = express.Router();

const {
  getBandByCredentials,
  updateBand,
  getBandIdByUserName,
} = require("../databaseQueriesBands");
const {
  isPartOfTheEvent,
  phoneExistsSimpleForother,
} = require("../databaseQueriesBoth");
const {
  updateRequest,
  deleteAvailableEvent,
  createAvailableEvent,
  createPublicEvent,
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
        req.body[f] === undefined || req.body[f] === null || req.body[f] === "",
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
      (p) => req.params[p] === undefined || req.params[p] === "",
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
    (bands) => bands.length > 0,
  );
}
/**
 * Band details / verifies band login
 * Gets a JSON with "username" "password"
 * Returns {success: true/false, message, band}
 */
router.post(
  "/details",
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/band/details endpoint hit");

    try {
      const bands = await getBandByCredentials(
        req.body.username,
        req.body.password,
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
  },
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
    try {
      const affectedRows = await createPublicEvent(
        await getBandIdByUserName(req.body.username),
        req.body.event_address,
        req.body.event_city,
        req.body.event_datetime,
        req.body.event_description,
        req.body.event_lat,
        req.body.event_lon,
        req.body.event_type,
        req.body.participants_price,
      );

      if (affectedRows === 0) {
        return res.json({
          success: false,
          message: "Failed to create event",
        });
      }

      return res.json({
        success: true,
        message: "Event created successfully",
      });
    } catch (err) {
      return res.json({
        success: false,
        message: "Error creating event: " + err.message,
      });
    }
  },
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

      const result = await createAvailableEvent(
        req.body.username,
        req.body.date,
      );

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
  },
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
        req.body.username,
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
  },
);

/**
 *  Band updates its details
 *  Gets a JSON with all band's attributes
 *  Returns {success: true/false , message}
 */
router.post(
  "/updateBand",
  requireBody([
    "username",
    "password",
    "band_city",
    "band_description",
    "band_name",
    "email",
    "foundedYear",
    "members_number",
    "music_genres",
    "photo",
    "telephone",
    "webpage",
  ]),
  async (req, res) => {
    console.log("/band/updateBand endpoint hit");

    const data = req.body;

    try {
      const telephoneTaken = await phoneExistsSimpleForother(
        data.username,
        data.telephone,
      );

      if (telephoneTaken) {
        return res.status(409).json({
          success: false,
          error: "An account already exists using this phone number",
          mytype: "sameusername",
        });
      }

      const result = await updateBand(
        data.username,
        data.password,
        data.band_city,
        data.band_description,
        data.band_name,
        data.email,
        data.foundedYear,
        data.members_number,
        data.music_genres,
        data.photo,
        data.telephone,
        data.webpage,
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Update-band error:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  },
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
        return res.status(401).json({
          success: false,
          message: "Invalid band_decision. Must be 'to be done' or 'rejected'",
        });
      }

      let isPart = await isPartOfTheEvent(
        req.body.private_event_id,
        "band",
        req.body.username,
      );

      if (!isPart) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: You are not part of this event",
        });
      }

      const result = await updateRequest(
        req.body.private_event_id,
        req.body.band_decision,
      );

      if (result > 0) {
        return res.status(200).json({
          success: true,
          message: "Request updated successfully",
        });
      } else {
        return res.status(401).json({
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
  },
);

module.exports = router;
