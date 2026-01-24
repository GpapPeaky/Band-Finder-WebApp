async function checkLogin(type, username, password, messageBox) {
  console.log("Starting login check...");
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
    localStorage.setItem("userType", type); // 'band' or 'user' or 'admin'
    localStorage.setItem("loginTime", Date.now()); // Track login time

    // Redirect after a short delay
    setTimeout(() => {
      if (type === "band") {
        window.location.href = "band.html";
      } else if (type === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "userUpdate.html";
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

function guestLogin() {
  window.location.href = "guest.html";
}

function checkSession() {
  const user = localStorage.getItem("currentUser");
  const userType = localStorage.getItem("userType");
  const loginTime = localStorage.getItem("loginTime");
  
  // Check for undefined string or null
  if (!user || !userType || !loginTime || user === "undefined") {
    return null;
  }
  
  const sessionDuration = 24 * 60 * 60 * 1000;
  const currentTime = Date.now();
  
  if (currentTime - loginTime > sessionDuration) {
    logout();
    return null;
  }
  
  try {
    return {
      user: JSON.parse(user),
      userType: userType,
    };
  } catch (error) {
    console.error("Error parsing user data:", error);
    logout();
    return null;
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("userType");
  localStorage.removeItem("loginTime");
  window.location.href = "index.html";
}

async function handleLoginFormSubmit(event, type) {
  console.log("Form submit handler called for type:", type);
  event.preventDefault();
  event.stopPropagation(); // Stop the event from bubbling
  
  let username, password, messageBox, actualType;

  if (type === "band") {
    username = document.getElementById("bandUsername").value;
    password = document.getElementById("bandPassword").value;
    messageBox = document.getElementById("bandmessagebox");
    actualType = document.getElementById("bandType").value;
  } else if (type === "admin") {
    username = document.getElementById("adminUsername").value;
    password = document.getElementById("adminPassword").value;
    messageBox = document.getElementById("adminmessagebox");
    actualType = document.getElementById("adminType").value;
  } else {
    username = document.getElementById("simpleUsername").value;
    password = document.getElementById("simplePassword").value;
    messageBox = document.getElementById("messagebox");
    actualType = document.getElementById("simpleType").value;
  }

  let apiType;
  if (actualType === "Band User") {
    apiType = "band";
  } else if (actualType === "Admin User") {
    apiType = "admin";
  } else {
    apiType = "user";
  }

  if (!username || !password) {
    if (messageBox) {
      messageBox.textContent = "Please enter both username and password!";
      messageBox.style.color = "red";
      messageBox.style.padding = "0.5rem";
    }
    return;
  }

  await checkLogin(apiType, username, password, messageBox);
}

// Set up event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded fired");
  
  // Clear any corrupted localStorage
  const user = localStorage.getItem("currentUser");
  if (user === "undefined") {
    console.log("Clearing corrupted localStorage");
    localStorage.clear();
  }
  
  // Check if user is already logged in
  const session = checkSession();
  if (session && window.location.pathname.includes("index.html")) {
    if (session.userType === "band") {
      window.location.href = "band-dashboard.html";
    } else {
      window.location.href = "userUpdate.html";
    }
    return; // Stop execution if redirecting
  }
  
  // Simple user form
  const simpleForm = document.getElementById("SimpleUserForm");
  if (simpleForm) {
    console.log("Attaching event to SimpleUserForm");
    simpleForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "simple");
    });
  }

  // Band user form
  const bandForm = document.getElementById("BandUserForm");
  if (bandForm) {
    console.log("Attaching event to BandUserForm");
    bandForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "band");
    });
  }
  
  // Admin user form
  const adminForm = document.getElementById("AdminUserForm");
  if (adminForm) {
    console.log("Attaching event to AdminUserForm");
    adminForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "admin");
    });
  }
});