var username;
var password;
var bandId;
var credentials;

document.addEventListener("DOMContentLoaded", () => {
  // Verify admin session
  const session = checkSession();

  if (!session) {
    alert("You must login first!");
    window.location.href = "index.html";
    return;
  }

  if (session.userType !== "band") {
    alert("Access denied. This page is for admin users only.");
    window.location.href = "index.html";
    return;
  }

  username = session.user.username;
  password = session.user.password;
  bandId = session.user.band_id;

  credentials = {
    username: username,
    password: password,
  };
  // Fetch and display events
  fetchPublicEvents();
});

async function fetchPublicEvents() {
  try {
    const response = await fetch("/general/seePublicEvents");

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch events");
    }

    const events = data.events || [];

    displayEvents(events);
  } catch (error) {
    const list = document.getElementById("eventList");
    list.innerHTML = `
      <div class="result-message error">
        Error loading events: ${error.message}
      </div>
    `;
  }
}

/**
 * Display events in the UI
 * @param {Array} events - Array of event objects
 */
function displayEvents(events) {
  const list = document.getElementById("eventList");

  if (!events || events.length === 0) {
    list.innerHTML = `
      <div id="result-message" style="background: white; padding: 20px; text-align: center;">
        No events to display
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  events.forEach((event) => {
    if (event.band_id != bandId) return;

    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");

    eventCard.id = `event-${event.public_event_id}`;
    // Build event HTML
    eventCard.innerHTML = `
        <h3>event #${event.public_event_id}</h3>

<p><strong>Band ID:</strong> ${event.band_id ?? ""}</p>
<p><strong>Event Type:</strong> ${event.event_type ?? ""}</p>
<p><strong>Date & Time:</strong> ${new Date(event.event_datetime).toLocaleString()}</p>
<p><strong>Description:</strong> ${event.event_description ?? ""}</p>
<p><strong>Participant Price:</strong> €${event.participants_price ?? ""}</p>
<p><strong>City:</strong> ${event.event_city ?? ""}</p>
<p><strong>Address:</strong> ${event.event_address ?? ""}</p>
<p><strong>Latitude:</strong> ${event.event_lat ?? ""}</p>
<p><strong>Longitude:</strong> ${event.event_lon ?? ""}</p>     
    `;

    list.appendChild(eventCard);
  });
}

async function submitPubEvent() {
  let msg = document.getElementById("messageBox");
  // Global username
  // Global password
  const eventAddress = document.getElementById("event_address").value;
  const eventCity = document.getElementById("event_city").value;
  const eventDateTime = document.getElementById("event_datetime").value;
  const eventDescription = document.getElementById("event_description").value;
  let lat;
  let lon;
  const eventType = document.getElementById("event_type").value;
  const participantsPrice = document.getElementById("participants_price").value;

  try {
    const fullQuery = `${eventAddress}, ${eventCity} ,Greece`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      fullQuery,
    )}&format=json&addressdetails=1&limit=1`;
    const OSMresponse = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "app/1.0 (csd5185@csd.uoc.gr)",
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });

    if (!OSMresponse.ok) {
      throw new Error(`Error on network response: ${OSMresponse.status}`);
    }

    const OSMdata = await OSMresponse.json();
    if (!OSMdata || OSMdata.length === 0) {
      lat = null;
      lon = null;
    } else {
      const result = OSMdata[0];
      lat = parseFloat(result.lat);
      lon = parseFloat(result.lon);
    }

    const response = await fetch("/band/createEvent", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        event_address: eventAddress,
        event_city: eventCity,
        event_datetime: eventDateTime,
        event_description: eventDescription,
        event_lat: lat,
        event_lon: lon,
        event_type: eventType,
        participants_price: participantsPrice,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch events");
    }

    msg.innerHTML = `<p style="color: green;"><strong>Event added successfully!</strong></p>`;
  } catch (error) {
    msg.innerHTML = `<p style="color: red;"><strong>Error adding event: ${error.message}</strong></p>`;
  }
}
