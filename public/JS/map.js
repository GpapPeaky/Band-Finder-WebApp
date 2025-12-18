// ===============  GLOBALS  ==================
let validatedLat = null;
let validatedLon = null;

// Reset map when user edits any address field
["country", "city", "address"].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById("showMapBtn").style.display = "none";
    document.getElementById("mapContainer").style.display = "none";
    document.getElementById("osmMessage").innerText = "";

    // Reset coords.
    validatedLat = null;
    validatedLon = null;

    document.getElementById("lat").value = "";
    document.getElementById("lon").value = "";
  });
});

// ===============  ADDRESS VALIDATION (GEOCODING) - Nominatim Version ==================
document
  .getElementById("checkAddressBtn")
  .addEventListener("click", async () => {
    const country = document.getElementById("country").value;
    const city = document.getElementById("city").value;
    const address = document.getElementById("address").value;

    const fullQuery = `${address}, ${city}, ${country}`;

    const msg = document.getElementById("osmMessage");
    if (country.toLowerCase() !== "greece") {
      msg.innerText = "Address is not located in Greece.";
      validatedLat = null;
      validatedLon = null;
      document.getElementById("showMapBtn").style.display = "none";
      return;
    }
    // Χρήση Nominatim API (OpenStreetMap)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      fullQuery
    )}&format=json&addressdetails=1&limit=1`;

    msg.innerText = "Searching Address...";
    msg.style.color = "blue";

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "app/1.0 (csd5185@csd.uoc.gr)",
          Accept: "application/json",
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        throw new Error(`Error on network response: ${response.status}`);
      }

      const data = await response.json(); // Χρειάζεται να πάρεις τα δεδομένα!

      if (!data || data.length === 0) {
        msg.style.color = "red";
        msg.innerText = "Address was not found!";
        validatedLat = null;
        validatedLon = null;
        document.getElementById("showMapBtn").style.display = "none";
        return;
      }

      const result = data[0];

      validatedLat = parseFloat(result.lat);
      validatedLon = parseFloat(result.lon);

      // Validated cooridinates, stored in hidden fields.
      document.getElementById("lat").value = validatedLat;
      document.getElementById("lon").value = validatedLon;

      msg.style.color = "green";

      const displayText = `${result.display_name.substring(0, 90)}...`;

      msg.innerText = `${displayText}`;

      document.getElementById("showMapBtn").style.display = "inline-block";
      console.log("Found coordinates:", validatedLat, validatedLon);
    } catch (error) {
      console.error("Geocoding error:", error);
      msg.innerText = "Connection Failed, Try again.";
      msg.style.color = "red";
    }
  });

// ==================  SHOW MAP  ===================
document.getElementById("showMapBtn").addEventListener("click", () => {
  if (validatedLat === null || validatedLon === null) {
    console.error("No coordinates available!");
    document.getElementById("osmMessage").innerText =
      "Enter an address!";
    document.getElementById("osmMessage").style.color = "red";
    return;
  }

  console.log("Showing map for coordinates:", validatedLat, validatedLon);
  document.getElementById("mapContainer").style.display = "block";

  // Remove old map if exists
  document.getElementById("mapContainer").innerHTML = "";

  // Convert WGS84 → Web Mercator
  const coords = ol.proj.fromLonLat([validatedLon, validatedLat]);
  console.log("Transformed coordinates:", coords);

  // Base map
  const map = new ol.Map({
    target: "mapContainer",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    view: new ol.View({
      center: coords,
      zoom: 17,
    }),
  });

  // Marker layer
  const markerLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [
        new ol.Feature({
          geometry: new ol.geom.Point(coords),
        }),
      ],
    }),
    style: new ol.style.Style({
      image: new ol.style.Icon({
        src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        scale: 0.05,
      }),
    }),
  });

  map.addLayer(markerLayer);
  console.log("Map created successfully!");
});
