const express = require("express");
const path = require("path");

const { initDatabase, dropDatabase } = require("./database");
const {
  usernameExists,
  emailExists,
  phoneExistsSimple,
  phoneExistsBand,
  bandnameExistsBand,
  phoneExistsSimpleForother,
  getReviews,
} = require("./databaseQueriesBoth");
const {
  insertUser,
  insertBand,
  insertReview,
  insertMessage,
  insertPublicEvent,
  insertPrivateEvent,
  modifyReview,
  deleteReview,
} = require("./databaseInsert");
const {
  users,
  bands,
  public_events,
  private_events,
  reviews,
  messages,
} = require("./resources");
const {
  getAllUsers,
  getUserByCredentials,
  updateUser,
  deleteUser,
  getUserIdByName,
} = require("./databaseQueriesUsers");
const {
  getAllBands,
  getBandByCredentials,
  updateBand,
  deleteBand,
  bandExists,
} = require("./databaseQueriesBands");
const { send } = require("process");
const { error } = require("console");

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// Route to serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/initdb", async (req, res) => {
  try {
    const result = await initDatabase();
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/insertRecords", async (req, res) => {
  try {
    for (const user of users) var result = await insertUser(user);
    for (const band of bands) var result = await insertBand(band);
    for (const pev of public_events) var result = await insertPublicEvent(pev);
    for (const rev of reviews) var result = await insertReview(rev);
    for (const priv of private_events)
      var result = await insertPrivateEvent(priv);
    for (const msg of messages) var result = await insertMessage(msg);
    res.send(result);
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
});

app.get("/dropdb", async (req, res) => {
  try {
    const message = await dropDatabase();
    res.send(message);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/user/details", async (req, res) => {
  const { username, password } = req.query;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const users = await getUserByCredentials(username, password);

    if (users.length > 0) {
      res.json(users[0]);
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/band/details", async (req, res) => {
  const { username, password } = req.query;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const bands = await getBandByCredentials(username, password);

    if (bands.length > 0) {
      res.json(bands[0]);
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update-user", async (req, res) => {
  try {
    const data = req.body;

    if (!data.address || data.address.trim() === "") {
      return res.status(400).json({ success: false, error: "Address is required" });
    }

    if (!data.username) {
      return res.status(400).json({ success: false, error: "Username is required" });
    }

    // ================== GEOCODING ==================
    let lat = parseFloat(data.lat);
    let lon = parseFloat(data.lon);

    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      const query = `${data.address}, ${data.city}, ${data.country}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`;

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "app/1.0 (csd5185@csd.uoc.gr)",
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);

        const osmData = await response.json();

        if (!osmData || osmData.length === 0) {
          return res.status(400).json({ success: false, error: "Address not found on map" });
        }

        lat = parseFloat(osmData[0].lat);
        lon = parseFloat(osmData[0].lon);
      } catch (err) {
        console.error("OSM error:", err);
        return res.status(500).json({ success: false, error: "Failed to validate address via map" });
      }
    }

    const telephoneTaken = await phoneExistsSimpleForother(
      data.username,
      data.telephone
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
      lat
    );

    return res.status(200).json(result);

  } catch (err) {
    console.error("Update-user error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/register", async (req, res) => {
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

      // Address check.
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

app.post("/review", async (req, res) => {
  console.log("=== REVIEW ENDPOINT HIT ===");
  console.log("Received review data:", req.body);

  try {
    const data = req.body;

    // Validate required fields
    if (!data.band_name || !data.sender || !data.review || !data.rating) {
      return res.status(400).json({
        success: false,
        error: "Missing required review fields",
      });
    }

    // Add current date if not provided
    if (!data.date_time) {
      data.date_time = new Date().toISOString().slice(0, 19).replace("T", " ");
    }

    // Add default status if not provided
    if (!data.status) {
      data.status = "pending";
    }

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
});

app.get("/reviewStatus/:review_id/:status", async (req, res) => {
  console.log("=== REVIEW STATUS (GET) ENDPOINT HIT ===");

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

    if (!review_id || !status) {
      return res.status(400).json({
        success: false,
        error: "Missing review_id or status",
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
});
app.put("/reviewStatus/:review_id/:status", async (req, res) => {
  console.log("=== REVIEW STATUS ENDPOINT HIT ===");

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

    if (!review_id || !status) {
      return res.status(400).json({
        success: false,
        error: "Missing review_id or status",
      });
    }

    if (status !== "published" && status !== "rejected") {
      return res.status(400).json({
        success: false,
        error: "Status must be 'published' or 'rejected'",
      });
    }

    const result = await modifyReview(review_id, status);

    console.log("Review update result:", result);

    if (result.updated) {
      return res.status(200).json({
        success: true,
        message: `Review ${review_id} status updated to '${status}'`,
        review_id: review_id,
      });
    } else {
      // Detailed error
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
    console.error("Review status update error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});
app.delete("/reviewDeletion/:review_id", async (req, res) => {
  console.log("=== REVIEW DELETION (DELETE) ENDPOINT HIT ===");

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
    const { deleteReview } = require("./databaseInsert");

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
});
// Add this endpoint - it's missing from your code!
app.get("/reviews/:band_name", async (req, res) => {
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
});

/// ================================== PEAKY ================================== ///

/*
  USER JSON FORMAT:

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

------------------------------------------------------------------------------

BAND JSON FORMAT:

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

------------------------------------------------------------------------------

PRIV-EVENT JSON FORMAT:

events: events.map((event) => ({
        private_event_id: event.private_event_id,
        band_id: event.band_id,
        price: event.price,
        status: event.status,
        band_decision: event.band_decision,
        user_id: event.user_id,
        event_type: event.event_type,
        event_datetime: event.event_datetime,
        event_description: event.event_description,
        event_city: event.event_city,
        event_address: event.event_address,
        event_lat: event.event_lat,
        event_lon: event.event_lon,
      })),

------------------------------------------------------------------------------

PUB-EVENT JSON FORMAT:

events: events.map((event) => ({
        public_event_id: event.public_event_id,
        band_id: event.band_id,
        event_type: event.event_type,
        event_datetime: event.event_datetime,
        event_description: event.event_description,
        participants_price: event.participants_price,
        event_city: event.event_city,
        event_address: event.event_address,
        event_lat: event.event_lat,
        event_lon: event.event_lon,
      })),

------------------------------------------------------------------------------


*/

// Get bands in public events by date
app.get("/bands/pub-events/:event_date", async (req, res) => {
  console.log("Event date:", req.params.event_date);
  console.log("Query params:", req.query);

  try {
    const event_date = req.params.event_date;

    // Get bands from database bands
    const bands = await getBandsAtDate(event_date);

    // Format response
    const response = {
      success: true,
      event_date: event_date,
      count: bands.length,
      bands: bands.map((band) => ({
        username: band.username,
        email: band.email,
        band_name: band.band_name,
        music_genres: band.music_genres,
        band_description: band.band_description,
        members_number: band.members_number,
        foundedYear: band.foundedYear,
        band_city: band.band_city,
        telephone: band.telephone,
        webpage: data.webpage || null,
        photo: data.photo || null,
      })),
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error getting bands in public events: ", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// Get bands based on public event type
app.get("/bands/pub-events/:event_type", async (req, res) => {
  console.log("Event type:", req.params.event_type);
  console.log("Query params:", req.query);

  try {
    const event_type = req.params.event_type;

    // Get bands from database
    const bands = await getBandsByPublicEventType(event_type);

    // Format response
    const response = {
      success: true,
      event_type: event_type,
      count: bands.length,
      bands: bands.map((band) => ({
        username: band.username,
        email: band.email,
        band_name: band.band_name,
        music_genres: band.music_genres,
        band_description: band.band_description,
        members_number: band.members_number,
        foundedYear: band.foundedYear,
        band_city: band.band_city,
        telephone: band.telephone,
        webpage: data.webpage || null,
        photo: data.photo || null,
      })),
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error getting bands by event type:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// Get bands based on public event price
app.get("/bands/pub-events/:price", async (req, res) => {
  console.log("Event price:", req.params.price);
  console.log("Query params:", req.query);

  try {
    const price = parseFloat(req.params.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid price parameter",
      });
    }
    // Get bands from database
    const bands = await getBandsByPublicEventPrice(price);

    // Format response
    const response = {
      success: true,
      price: price,
      count: bands.length,
      bands: bands.map((band) => ({
        username: band.username,
        email: band.email,
        band_name: band.band_name,
        music_genres: band.music_genres,
        band_description: band.band_description,
        members_number: band.members_number,
        foundedYear: band.foundedYear,
        band_city: band.band_city,
        telephone: band.telephone,
        webpage: data.webpage || null,
        photo: data.photo || null,
      })),
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error getting bands by event price:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// Update band schedule, add a date that the band is available
// otherwise it will be thought as unavailable
app.put("/bands/setAvailability", async (req, res) => {
    console.log("=== UPDATE BAND SCHEDULE ENDPOINT HIT ===");

    if(!req.body.band_name || !req.body.date){
        return res.status(400).json({
            success: false,
            error: "Missing required fields",
        });
    }

    try {
        const band_name = req.body.band_name;
        const date = req.body.date;
        
        // Add availability to database
        await setBandAvailability(band_name, date);

        return res.status(200).json({
            success: true,
            message: "Band availability added successfully",
        });
    } catch (err) {
        console.error("Error adding band availability:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }
});

// Update band schedule, remove a date that the band is available
app.delete("/bands/removeAvailability", async (req, res) => {
    console.log("=== UPDATE BAND SCHEDULE ENDPOINT HIT ===");

    if(!req.body.band_name || !req.body.date){
        return res.status(400).json({
            success: false,
            error: "Missing required fields",
        });
    }

    try {
        const band_name = req.body.band_name;
        const date = req.body.date;

        // Remove availability from database
        await removeBandAvailability(band_name, date);

        return res.status(200).json({
            success: true,
            message: "Band availability removed successfully",
        });
    } catch (err) {
        console.error("Error removing band availability:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }
});

// remove a user with a specific name if he exists
app.delete("/admin/removeUser/:user_name", async (req, res) => {
    if (checkIfLoggedInAsAdmin(req)) {
      try {
          const user_name = req.params.user_name;
          // Remove user from database
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

// admin username/pass and stuff.
const ADMIN_USER = "ADMIN_SNIK_2004";
const ADMIN_PASS = "admin_feet_lover";

// Get admin details
app.post("/admin/details", async (req, res) => {
  const { username, password } = req.body;

  // validate credentials
  const isAdmin =
    username === ADMIN_USER && password === ADMIN_PASS;

  if (!isAdmin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // set admin cookie
  res.cookie("is_admin", "true", {
    httpOnly: true,
    sameSite: "strict",
    secure: false // true in production with HTTPS
  });

  return res.json({ success: true });
});

// FINISHED
// CHECK ADMIN COOKIE, RETHINK AVAILAVILITY ROUTES.

// Admin gets number of bands per city
// {n-bands_at_city, city }
app.get("/admin/bandsPerCity", async (req, res) => {
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

// Admin gets the number of events
app.get("/admin/numOfEvents/:type", async (req, res) => {
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
    }
});

// Admin gets the number of users
app.get("/admin/numOfUsers/:type", async (req, res) => {
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
    }
});

// User sends a message to a band, through input fields
app.put("/sendMessage", async (req, res) => {
    try {
      const data = req.body;

      // Validate required fields
      if (!data.sender || !data.band_name || !data.message || !data.event_id || !data.senderType) {
        return res.status(400).json({
          success: false,
          error: "Missing required message fields",
        });
      }

      if (data.senderType === "user") {
        sendMessageToBand(data.sender, data.band_name, data.message, data.event_id);  // TODO
      } else if (data.senderType === "band") {
        sendMessageToUser(data.sender, data.band_name, data.message, data.event_id);  // TODO
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid senderType, must be 'user' or 'band'",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Message sent successfully!",
      });

    } catch (err) {
      console.error("Error sending message:", err);
      return res.status(500).json({
        success: false,
        error: "Server error: " + err.message,
      });
    }
});

// Band can creates a public event
app.put("/createEvent", async (req, res) => {
    console.log("=== CREATE PUBLIC EVENT ENDPOINT HIT ===");

    try {
        const data = req.body;
        const event = await createPublicEvent(data);
        return res.status(200).json({
            success: true,
            event: event,
        });
    } catch (err) {
        console.error("Error creating public event:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }
});

// User requests a band for an event
app.put("/requestBand", async (req, res) => {
    console.log("=== REQUEST BAND ENDPOINT HIT ===");
    
    try {
        const band_name = req.body.band_name;
        const date = req.body.date;
        const user_name = req.body.username;
        const password = req.body.password;

        
        const users = getUserByCredentials(user_name, password);
      if(users.length > 0) {
        const user_id = await getUserIdByName(user_name);
        
        const request = await requestBandForEvent(user_id, band_name, date);

        if(request) {
          return res.status(200).json({
            success: true,
            request: request,
          });
        } else {
          console.error("Couldn't create private event");
        }
      } else {
        console.error("Not logged in as user");

        return res.status(401).json({
          success: false,
          error: "Unauthorized request"
        });
      }
    } catch (err) {
        console.error("Error requesting band for event:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }
});

// Get events based on a special filter
app.get("/getEventsBasedOn/:filter", async (req, res) => {
    console.log("=== GET EVENTS BASED ON FILTER ENDPOINT HIT ===");

    try {
        const filter = req.params.filter;
        const events = await getEventsBasedOnFilter(filter);
     
        return res.status(200).json({
            success: true,
            filter: filter,
            events: events,
        });
    } catch (err) {
        console.error("Error getting events based on filter:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }    
});

// Band updates user requests
app.post("/updateRequest", async (req, res) => {
    console.log("=== UPDATE REQUEST ENDPOINT HIT ===");

    try {
        const data = req.body;
        const request = await updateRequest(data);
        return res.status(200).json({
            success: true,
            request: request,
        });
    } catch (err) {
        console.error("Error updating request:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }
});

// Update band fields, all of em
app.post("/updateBand", async (req, res) => {
    console.log("=== UPDATE BAND ENDPOINT HIT ===");

    try {
        const data = req.body;
        const result = await updateBand(data);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Update-band error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// See band availability
app.get("/seeAvailability/", async (req, res) => {
    console.log("=== SEE BAND AVAILABILITY ENDPOINT HIT ===");

    try { 
        const band_name = req.body.band_name;
        const availability = await getBandAvailability(band_name);
        
        return res.status(200).json({
            success: true,
            band_name: band_name,
            availability: availability,
        });
    } catch (err) {
        console.error("Error getting band availability:", err);
        return res.status(500).json({
            success: false,
            error: "Server error: " + err.message,
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("=== UNHANDLED ERROR ===");
  console.error(err);
  res.status(500).json({
    success: false,
    error: "Internal server error: " + err.message,
    mytype: "none",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
