async function checkLogin(type, username, password, messageBox) {
  try {
    let typeOfConnection;

    console.log("Login attempt:", { type, username, password });
    if (type === "band") {
      typeOfConnection = "/band/details";
    } else if (type === "user") {
      typeOfConnection = "/user/details";
    } else {
      typeOfConnection = "/admin/details";
    }

    const response = await fetch(typeOfConnection, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid username or password!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    }
    const user = await response.json();
    // Login successful
    if (messageBox) {
      messageBox.textContent = "Login successful!";
      messageBox.style.color = "green";
      messageBox.style.padding = "0.5rem";
    }

    // Store user data in localStorage for session persistence
    localStorage.setItem("currentUser", JSON.stringify(user.user));
    localStorage.setItem("userType", type); // 'band' or 'simple' or 'admin'
    localStorage.setItem("loginTime", Date.now()); // Track login time

    // Redirect after a short delay
    setTimeout(() => {
      if (type === "band") {
        alert("band.html");
      } else if (type === "admin") {
        window.location.href = "admin.html"; // Redirect to user profile page
      } else {
        window.location.href = "user.html"; // Redirect to user profile page
      }
    }, 1000);
    return true;
  } catch (error) {
    console.error("Login error:", error);
    if (messageBox) {
      messageBox.textContent = error.message;
      messageBox.style.color = "red";
      messageBox.style.padding = "0.5rem";
    }
    return false;
  }
}

// Login user as a temporary guest, no credentials

function guestLogin() {
  window.location.href = "guest.html";
}

// Function to check if user is logged in
function checkSession() {
  const user = localStorage.getItem("currentUser");
  const userType = localStorage.getItem("userType");
  const loginTime = localStorage.getItem("loginTime");
  if (!user || !userType || !loginTime) {
    return null; // No active session
  }
  // Check if session is expired (24 hours)
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const currentTime = Date.now();
  if (currentTime - loginTime > sessionDuration) {
    logout(); // Session expired
    return null;
  }
  return {
    user: JSON.parse(user),
    userType: userType,
  };
}

// Function to logout

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("userType");
  localStorage.removeItem("loginTime");
  // Redirect to login page
  window.location.href = "index.html";
}

// Function to handle form submission
async function handleLoginFormSubmit(event, type) {
  event.preventDefault(); // Prevent default form submission
  let username, password, messageBox;

  if (type === "band") {
    username = document.getElementById("bandUsername").value;
    password = document.getElementById("bandPassword").value;
    messageBox = document.getElementById("bandmessagebox");
  } else if (type === "admin") {
    username = document.getElementById("adminUsername").value;
    password = document.getElementById("adminPassword").value;
    messageBox = document.getElementById("adminmessagebox");
  } else {
    username = document.getElementById("simpleUsername").value;
    password = document.getElementById("simplePassword").value;
    messageBox = document.getElementById("messagebox");
  }

  // Basic validation
  if (!username || !password) {
    if (messageBox) {
      messageBox.textContent = "Please enter both username and password!";
      messageBox.style.color = "red";
      messageBox.style.padding = "0.5rem";
    }
    return;
  }
  // Call the login function
  await checkLogin(type, username, password, messageBox);
}

// Set up event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is already logged in
  console.log("Checking session on page load...");
  const session = checkSession();
  if (session && window.location.pathname.includes("index.html")) {
    // User is already logged in, redirect to appropriate page
    if (session.userType === "band") {
      window.location.href = "band-dashboard.html";
    } else {
      window.location.href = "userUpdate.html";
    }
  }
  // Simple user form
  const simpleForm = document.getElementById("SimpleUserForm");
  if (simpleForm) {
    simpleForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "simple");
    });
  }

  // Band user form
  const bandForm = document.getElementById("BandUserForm");
  if (bandForm) {
    bandForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "band");
    });
  }
  // Admin user form
  const adminForm = document.getElementById("AdminUserForm");
  if (adminForm) {
    adminForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "admin");
    });
  }
});
