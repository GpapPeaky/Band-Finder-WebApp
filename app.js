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
} = require("./databaseQueriesUsers");
const {
  getAllBands,
  getBandByCredentials,
  updateBand,
  deleteBand,
  bandExists,
} = require("./databaseQueriesBands");

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
