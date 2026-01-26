const express = require("express");
const router = express();

const { phoneExistsSimpleForother } = require("../databaseQueriesBoth");
const {
  getBandIdByName,
  getBandAvailability,
} = require("../databaseQueriesBands");
const { insertReview, insertPrivateEvent,updatePrivateEvent } = require("../databaseInsert");
const {
  getUserByCredentials,
  updateUser,
  getUserIdByName,
} = require("../databaseQueriesUsers");

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
async function checkIfUser(username, password) {
  const users = await getUserByCredentials(username, password);
  return users.length > 0;
}

/**
 * User details / verifies user login
 * Gets a JSON with "username" "password"
 * Returns {success: true/false, message, user}
 */
router.post(
  "/details",
  requireBody(["username", "password"]),
  async (req, res) => {
    console.log("/user/details endpoint hit");

    try {
      const users = await getUserByCredentials(
        req.body.username,
        req.body.password,
      );

      if (users.length > 0) {
        return res.json({
          success: true,
          message: "User found",
          user: users[0],
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
          user: null,
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
        user: null,
      });
    }
  },
);
/**
 * User requests a band for a private event
 * Gets a JSON with "username" , "password" (of the user), "band_name" , "date", "event_type", "event_city", "event_address"
 * Returns {success: true/false , message}
 */
router.put(
  "/requestBand",
  requireBody([
    "username",
    "password",
    "band_name",
    "date",
    "event_type",
    "event_city",
    "event_address",
    "event_description",
  ]),
  async (req, res) => {
    console.log("/user/requestBand endpoint hitt");

    let band_id;
    let user_id;

    try {
      if (!(await checkIfUser(req.body.username, req.body.password))) {
        return res.json({
          success: false,
          message: "Unauthorized: Invalid credentials",
        });
      }

      // Requests for private events will flow like this:
      //  request is handled as a private event with status "pending"
      //  and the band accepts/rejects accordingly

      band_id = await getBandIdByName(req.body.band_name);
      user_id = await getUserIdByName(req.body.username);

      if (!user_id || !band_id)
        return res.json({
          success: false,
          message: "not found user_id or band_id",
        });
      console.log("band id :" + band_id);
      console.log("user id :" + user_id);

      let price;
      switch (req.body.event_type) {
        case "wedding":
          price = 2000;
          break;
        case "baptism":
          price = 1000;
          break;
        case "party":
          price = 500;
          break;

        default:
          price = 300;
      }

      // Geocoding
      const query = `${req.body.event_address}, ${req.body.event_city}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query,
      )}&format=json&addressdetails=1&limit=1`;
      let lat, lon;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "app/1.0 (https://example.com/contact)",
          },
        });
        const data = await response.json();
        if (data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }

      // Construct object
      const eventRequest = {
        band_id,
        price,
        status: "requested",
        band_decision: "requested",
        user_id,
        event_type: req.body.event_type,
        event_datetime: req.body.date,
        event_description: req.body.event_description,
        event_city: req.body.event_city,
        event_address: req.body.event_address,
        event_lat: lat ?? null,
        event_lon: lon ?? null,
      };

      const msg = await updatePrivateEvent(eventRequest); // Added await

      return res.json({
        success: true,
        message: msg,
      });
    } catch (err) {
      console.error("Error in /user/requestBand:", err);

      // Check for specific errors
      if (err.message.includes("Band not found")) {
        return res.json({
          success: false,
          message: "Band not found",
        });
      }

      if (err.message.includes("User not found")) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      // Generic error handling
      return res.json({
        success: false,
        message: "Error requesting band: " + err.message,
      });
    }
  },
);

/**
 * User sees band's availability
 * Gets a JSON with "username" , "password" (of the user), "band_name"
 * Returns {success: true/false , message, dates[]}
 */
router.post(
  "/seeAvailability/",
  requireBody(["username", "password", "band_name"]),
  async (req, res) => {
    console.log("/user/seeAvailability endpoint hit");

    try {
      if (!(await checkIfUser(req.body.username, req.body.password))) {
        return res.json({
          success: false,
          message: "Unauthorized: Invalid credentials",
          dates: [],
        });
      }

      // Availability is marked as private events with status "available"
      const availability = await getBandAvailability(req.body.band_name);

      return res.json({
        success: true,
        message: "Band " + req.body.band_name + " availability retrieved",
        dates: availability,
      });
    } catch (err) {
      console.error("Error in /user/seeAvailability:", err);

      // Check if it's a "Band not found" error
      if (err.message.includes("Band not found")) {
        return res.json({
          success: false,
          message: "Band not found",
          dates: [],
        });
      }

      // Generic error handling
      return res.json({
        success: false,
        message: "Error retrieving band availability: " + err.message,
        dates: [],
      });
    }
  },
);
/**
 * Submit a review for a band
 * Gets a JSON with "band_name", "sender", "password", "review", "rating"
 * Returns {success: true/false, message, reviewId?, error?}
 */
router.post(
  "/review",
  requireBody(["band_name", "sender", "password", "review", "rating"]),
  async (req, res) => {
    console.log("/review endpoint hit");

    if (!(await checkIfUser(req.body.sender, req.body.password))) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid user credentials",
      });
    }

    try {
      const data = req.body;

      data.date_time = new Date().toISOString().slice(0, 19).replace("T", " ");
      data.status = "pending";

      // Insert review into database
      const result = await insertReview(data);
      console.log("Review insert result:", result);

      return res.status(200).json({
        success: true,
        message: "Review submitted successfully!",
        reviewId: result.insertId,
      });
    } catch (err) {
      console.error("Review submission error:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  },
);

/**
 * User updates its details
 * Gets a JSON with all user's attributes
 * Returns {success: true/false, message}
 */
router.post(
  "/update-user",
  requireBody([
    "address",
    "birthdate",
    "city",
    "country",
    "firstname",
    "gender",
    "lastname",
    "username",
    "password",
    "telephone",
  ]),
  async (req, res) => {
    console.log("/update-user endpoint hit");

    try {
      const data = req.body;

      // ================== GEOCODING ==================
      let lat = parseFloat(data.lat);
      let lon = parseFloat(data.lon);

      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        const query = `${data.address}, ${data.city}, ${data.country}`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&addressdetails=1&limit=1`;

        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent": "app/1.0 (csd5185@csd.uoc.gr)",
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
          }

          const osmData = await response.json();

          if (!osmData || osmData.length === 0) {
            /*return res.status(400).json({
              success: false,
              message: "Address not found on map",
            });*/
            lat = null;
            lon = null;
          } else {
            lat = parseFloat(osmData[0].lat);
            lon = parseFloat(osmData[0].lon);
          }
        } catch (err) {
          console.error("OSM error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to validate address via map",
          });
        }
      }

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

      // ================== UPDATE DATABASE ==================
      const result = await updateUser(
        data.username,
        data.password,
        data.firstname,
        data.lastname,
        data.birthdate,
        data.gender,
        data.country,
        data.city,
        data.address,
        data.telephone,
        lon,
        lat,
      );

      return res.status(200).json(result);
    } catch (err) {
      console.error("Update-user error:", err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  },
);

module.exports = router;
