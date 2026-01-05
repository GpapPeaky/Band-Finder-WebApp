const express = require("express");
const router = express.Router();

const {
  usernameExists,
  emailExists,
  phoneExistsBand,
  bandnameExistsBand,
} = require("../src/_helpers/userBand");

const { 
    insertBand,
    deleteBand,
 } = require("../src/band/band");

const {
  getBandByCredentials,
  updateBand,
  getBandsAtDate,
  getBandsByPublicEventType,
  getBandsByPublicEventPrice,
  setBandAvailability,
  removeBandAvailability,
  getBandAvailability,
  getAllBands,
  bandExists,
} = require("../src/band/band");

// Get band details by credentials
router.get("/bands/details", async (req, res) => {
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

// Register band
router.post("/bands/register", async (req, res) => {
  console.log("=== BAND REGISTER ENDPOINT HIT ===");
  console.log("Received body:", req.body);

  try {
    const data = req.body;

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
  } catch (err) {
    console.error("=== BAND REGISTRATION ERROR ===");
    console.error("Error details:", err);

    return res.status(500).json({
      success: false,
      error: "Server registration error: " + err.message,
      mytype: "none",
    });
  }
});

// Update band schedule - add availability
router.put("/bands/setAvailability", async (req, res) => {
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

// Update band schedule - remove availability
router.delete("/bands/removeAvailability", async (req, res) => {
  console.log("=== REMOVE BAND AVAILABILITY ENDPOINT HIT ===");

  if(!req.body.band_name || !req.body.date){
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  try {
    const band_name = req.body.band_name;
    const date = req.body.date;

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

// Update band fields
router.post("/bands/updateBand", async (req, res) => {
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
router.get("/bands/seeAvailability/", async (req, res) => {
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

module.exports = router;
