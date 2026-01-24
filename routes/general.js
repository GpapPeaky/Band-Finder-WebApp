const express = require("express");
const router = express();

const {
  usernameExists,
  emailExists,
  phoneExistsSimple,
  phoneExistsBand,
  bandnameExistsBand,
  getReviews,
  getMessageHistory,
  isPartOfTheEvent,
  newMessage,
} = require("../databaseQueriesBoth");
const { insertUser, insertBand } = require("../databaseInsert");

const { getUserByCredentials } = require("../databaseQueriesUsers");
const { getBandByCredentials, bandExists } = require("../databaseQueriesBands");
const { checkIfLoggedInAsAdmin } = require("../databaseQueriesAdmin");
const {
  getPublicEvents,
  getPrivateEvents,
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
async function checkIfUser(username, password) {
  const users = await getUserByCredentials(username, password);
  return users.length > 0;
}
async function checkIfBand(username, password) {
  return getBandByCredentials(username, password).then(
    (bands) => bands.length > 0
  );
}
async function checkIfAdmin(username, password) {
  return checkIfLoggedInAsAdmin(username, password).then(
    (admins) => admins.length > 0
  );
}
/**
 * User gets events based on filter ( date / music / distance ( only for user))
 * Gets a JSON with "usertype" "username" , "password" (of the user if filter is distance), "filter" (date/music/distance)
 * Returns {success: true/false , message, events[]}
 */
router.get(
  "/getEventsBasedOn/:filter",
  requireParams(["filter"]),
  requireBody(["usertype", "username", "password"]),
  async (req, res) => {
    console.log("/getEventsBasedOn endpoint hit");
    if (req.body.usertype === "user") {
      if (!(await checkIfUser(req.body.username, req.body.password))) {
        return res.json({
          success: false,
          message: "Unauthorized: Invalid credentials",
          events: [],
        });
      }
    }
    return res.json({
      success: false,
      message: "Under construction",
    });
  }
);

/**
 * Send message endpoint ( For user and band )
 * Gets a JSON with "sender_type"(user or band) , "username" , "password" , "message" , "event_id"
 * Returns {success: true/false , message }
 */
router.put(
  "/sendMessage",
  requireBody(["sender_type", "username", "password", "message", "event_id"]),
  async (req, res) => {
    console.log("/sendMessage endpoint hit");
    const ok =
      req.body.sender_type === "user"
        ? await checkIfUser(req.body.username, req.body.password)
        : await checkIfBand(req.body.username, req.body.password);

    if (!ok) {
      return res.json({
        success: false,
        message: "Unauthorized: Invalid credentials",
      });
    }

    let isPart = await isPartOfTheEvent(
      req.body.event_id,
      req.body.sender_type,
      req.body.username
    );
    if (!isPart) {
      return res.json({
        success: false,
        message: "Unauthorized: You are not part of this event",
      });
    } else {
      console.log("User/Band is part of the event, retrieving messages...");
    }

    try {
      const messages = await newMessage(
        req.body.event_id,
        req.body.sender_type,
        req.body.message
      );
      return res.json({
        success: true,
        message: "Messages sent successfully",
      });
    } catch (err) {
      console.error("Error retrieving messages:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  }
);
/**
 * Get message history endpoint ( For user and band )
 * Gets a JSON with "sender_type"(user or band) , "username" , "password" , "event_id"
 * Returns {success: true/false , message, messages[] }
 */
router.post(
  "/messageHistory",
  requireBody(["sender_type", "username", "password", "event_id"]),
  async (req, res) => {
    console.log("/messageHistory endpoint hit");
    const ok =
      req.body.sender_type === "user"
        ? await checkIfUser(req.body.username, req.body.password)
        : await checkIfBand(req.body.username, req.body.password);

    if (!ok) {
      return res.json({
        success: false,
        message: "Unauthorized: Invalid credentials",
      });
    }

    let isPart = await isPartOfTheEvent(
      req.body.event_id,
      req.body.sender_type,
      req.body.username
    );
    if (!isPart) {
      return res.json({
        success: false,
        message: "Unauthorized: You are not part of this event",
      });
    } else {
      console.log("User/Band is part of the event, retrieving messages...");
    }

    try {
      const messages = await getMessageHistory(
        req.body.event_id,
        req.body.sender_type,
        req.body.username
      );
      return res.json({
        success: true,
        message: "Messages retrieved successfully",
        messages: messages,
      });
    } catch (err) {
      console.error("Error retrieving messages:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  }
);

/**
 * Get reviews for a band with optional rating filter
 * Gets URL param "band_name" and optional query params "ratingFrom" and "ratingTo"
 * Returns {success: true/false, band_name, count, reviews[], error?}
 */
router.get(
  "/reviews/:band_name",
  requireParams(["band_name"]),
  async (req, res) => {
    console.log("=== GET REVIEWS ENDPOINT HIT ===");
    console.log("Band name:", req.params.band_name);
    console.log("Query params:", req.query);

    try {
      const band_name = req.params.band_name;
      let ratingFrom = req.query.ratingFrom;
      let ratingTo = req.query.ratingTo;

      if (ratingFrom !== undefined || ratingTo !== undefined) {
        // Convert to numbers
        ratingFrom = ratingFrom ? parseInt(ratingFrom) : 1;
        ratingTo = ratingTo ? parseInt(ratingTo) : 5;
      } else {
        // Default values if not provided
        ratingFrom = 1;
        ratingTo = 5;
      }

      // Get reviews from database
      const reviews = await getReviews(band_name, ratingFrom, ratingTo);

      // Format response
      const response = {
        success: true,
        band_name: band_name,
        count: reviews.length,
        reviews: reviews.map((review) => ({
          review_id: review.review_id,
          band_name: review.band_name,
          sender: review.sender,
          review: review.review,
          rating: review.rating,
          date_time: review.date_time,
          status: review.status,
        })),
      };

      if (band_name !== "all" && reviews.length === 0) {
        const bandexists = await bandExists(band_name);
        if (!bandexists) {
          return res.status(404).json({
            success: false,
            error: "Band not found",
          });
        }
      }

      return res.status(200).json(response);
    } catch (err) {
      console.error("Error getting reviews:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  }
);

/**
 * Registration endpoint for both users and bands
 * Gets a JSON with user or band data depending on registration type
 * Returns {success: true/false, message, redirect?, mytype}
 */
router.post("/register", async (req, res) => {
  console.log("=== REGISTER ENDPOINT HIT ===");
  console.log("Received body:", req.body);

  try {
    const data = req.body;

    // Validate that we have data
    if (!data || Object.keys(data).length === 0) {
      console.error("Empty request body received");
      return res.status(400).json({
        success: false,
        error: "No data received",
        mytype: "none",
      });
    }

    // Determine if it's a band or a simple user
    const isBand = "band_name" in data;
    console.log("Registration type:", isBand ? "BAND" : "USER");

    if (isBand) {
      const bandData = {
        username: data.username_band,
        email: data.email_band,
        password: data.password_band,
        band_name: data.band_name,
        music_genres: data.music_genres,
        band_description: data.band_description,
        members_number: data.band_members,
        foundedYear: data.band_year,
        band_city: data.band_city,
        telephone: data.telephone,
        webpage: data.webpage || null,
        photo: data.photo || null,
      };

      console.log("Converted BAND data:", bandData);

      const usernameTaken = await usernameExists(data.username_band);
      const emailTaken = await emailExists(data.email_band);
      const telephoneTaken = await phoneExistsBand(data.telephone);
      const bandnameTaken = await bandnameExistsBand(data.band_name);

      if (usernameTaken) {
        return res.status(409).json({
          success: false,
          error: "Username already exists",
          mytype: "sameusername",
        });
      }

      if (emailTaken) {
        return res.status(409).json({
          success: false,
          error: "An account already exists using this email.",
          mytype: "sameusername",
        });
      }

      if (telephoneTaken) {
        return res.status(409).json({
          success: false,
          error: "An account already exists using this phone number",
          mytype: "sameusername",
        });
      }

      if (bandnameTaken) {
        return res.status(409).json({
          success: false,
          error: "An account already exists using this band name",
          mytype: "sameusername",
        });
      }

      // Address check
      if (!data.address || data.address.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "Address is required",
        });
      }

      if (!data.lat || !data.lon) {
        return res.status(400).json({
          success: false,
          error: "Address must be validated on the map",
        });
      }

      const lat = parseFloat(data.lat);
      const lon = parseFloat(data.lon);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          success: false,
          error: "Invalid address coordinates",
        });
      }

      const result = await insertBand(bandData);
      console.log("Band insert result:", result);

      return res.status(200).json({
        success: true,
        redirect: "/",
        message: "Band registered successfully!",
        mytype: "none",
      });
    } else {
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstname: data.firstname,
        lastname: data.lastname,
        birthdate: data.birthdate,
        gender: data.gender,
        country: data.country,
        city: data.city,
        address: data.address,
        telephone: data.telephone,
        lat: data.lat,
        lon: data.lon,
      };

      console.log("Converted User data:", userData);

      const usernameTaken = await usernameExists(data.username);
      const emailTaken = await emailExists(data.email);
      const telephoneTaken = await phoneExistsSimple(data.telephone);

      if (usernameTaken) {
        return res.status(409).json({
          success: false,
          error: "Username already exists",
          mytype: "sameusername",
        });
      }

      if (emailTaken) {
        return res.status(409).json({
          success: false,
          error: "An account already exists using this email.",
          mytype: "sameusername",
        });
      }

      if (telephoneTaken) {
        return res.status(409).json({
          success: false,
          error: "An account already exists using this phone number",
          mytype: "sameusername",
        });
      }

      const result = await insertUser(userData);
      console.log("User insert result:", result);

      return res.status(200).json({
        success: true,
        redirect: "/",
        message: "User registered successfully!",
        mytype: "none",
      });
    }
  } catch (err) {
    console.error("=== REGISTRATION ERROR ===");
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);

    return res.status(500).json({
      success: false,
      error: "Server registration error: " + err.message,
      mytype: "none",
    });
  }
});

/**
 * User and guest sees all public events
 * Returns {success: true/false , message , events[]}
 */
router.get("/seePublicEvents", async (req, res) => {
  console.log("/user/seePublicEvents endpoint hit");
  try {
    // Public events are those with event_type "public"
    const events = await getPublicEvents();
    return res.status(200).json({
      success: true,
      message: "Public events retrieved successfully!",
      events: events,
    });
  } catch (err) {
    console.error("Error retrieving public events:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

router.post(
  "/getPrivateEvents",
  requireBody(["user_type", "username", "password"]),
  async (req, res) => {
    console.log("/getPrivateEvents endpoint hit");

    try {
      const ok =
        req.body.user_type === "user"
          ? await checkIfUser(req.body.username, req.body.password)
          : await checkIfBand(req.body.username, req.body.password);

      if (!ok) {
        return res.json({
          success: false,
          message: "Unauthorized: Invalid credentials",
        });
      }

      // Fetch private events for the user
      const privateEvents = await getPrivateEvents(
        req.body.user_type,
        req.body.username
      );

      return res.status(200).json({
        success: true,
        message: "Private events retrieved successfully!",
        events: privateEvents,
      });
    } catch (err) {
      console.error("Error retrieving private events:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
  }
);

module.exports = router;
