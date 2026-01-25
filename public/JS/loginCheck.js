const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEBUG = false; // Set to false in production

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Debug logger - only logs when DEBUG is true
 */
function debug(...args) {
  if (DEBUG) {
    console.log("[AUTH DEBUG]", ...args);
  }
}

/**
 * Show message to user in the UI
 */
function showMessage(messageBox, text, isSuccess = false) {
  if (!messageBox) return;
  
  messageBox.textContent = text;
  messageBox.style.color = isSuccess ? "green" : "red";
  messageBox.style.padding = "0.5rem";
}

// ----------------------------------------------------------------------------
// SESSION MANAGEMENT
// ----------------------------------------------------------------------------

/**
 * Check if user has a valid session
 * Returns: { user: object, userType: string } or null
 */
function checkSession() {
  debug("============ CHECK SESSION START ============");
  
  const user = localStorage.getItem("currentUser");
  const userType = localStorage.getItem("userType");
  const loginTime = localStorage.getItem("loginTime");
  
  debug("Raw localStorage values:");
  debug("- currentUser:", user);
  debug("- userType:", userType);
  debug("- loginTime:", loginTime);
  
  // Validate all required data exists
  if (!user || !userType || !loginTime || user === "undefined") {
    debug("Session check failed: Missing data");
    debug("============ CHECK SESSION END (FAILED) ============");
    return null;
  }
  
  // Check if session has expired
  const currentTime = Date.now();
  const timeElapsed = currentTime - parseInt(loginTime);
  
  debug("Session timing:");
  debug("- Current time:", currentTime);
  debug("- Login time:", loginTime);
  debug("- Time elapsed:", timeElapsed, "ms");
  debug("- Session duration:", SESSION_DURATION, "ms");
  
  if (timeElapsed > SESSION_DURATION) {
    debug("Session expired");
    logout();
    debug("============ CHECK SESSION END (FAILED) ============");
    return null;
  }
  
  // Parse user data
  try {
    const userData = JSON.parse(user);
    debug("Session valid!");
    debug("- User type:", userType);
    debug("- Username:", userData.username);
    debug("- Parsed user data:", userData);
    debug("============ CHECK SESSION END (SUCCESS) ============");
    
    return {
      user: userData,
      userType: userType,
    };
  } catch (error) {
    debug("Session check failed: Parse error", error);
    debug("============ CHECK SESSION END (FAILED) ============");
    logout();
    return null;
  }
}

/**
 * Clear session and redirect to login page
 */
function logout() {
  debug("============ LOGOUT START ============");
  
  localStorage.removeItem("currentUser");
  localStorage.removeItem("userType");
  localStorage.removeItem("loginTime");
  
  debug("localStorage cleared");
  debug("Redirecting to index.html");
  debug("============ LOGOUT END ============");
  
  window.location.href = "index.html";
}

// ----------------------------------------------------------------------------
// LOGIN FUNCTIONALITY
// ----------------------------------------------------------------------------

/**
 * Perform login authentication
 * @param {string} type - User type: 'user', 'band', or 'admin'
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {HTMLElement} messageBox - Element to display messages
 */
async function checkLogin(type, username, password, messageBox) {
  debug("============ LOGIN START ============");
  debug("Login parameters:");
  debug("- Type:", type);
  debug("- Username:", username);
  debug("- Password:", password ? "***" : "(empty)");
  
  try {
    // Determine API endpoint based on user type
    let endpoint;
    switch (type) {
      case "band":
        endpoint = "/band/details";
        break;
      case "admin":
        endpoint = "/admin/details";
        break;
      case "user":
      default:
        endpoint = "/user/details";
        break;
    }
    
    debug("API endpoint:", endpoint);
    debug("Making fetch request...");
    
    // Make login request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    
    debug("Response status:", response.status);
    debug("Response ok:", response.ok);
    
    // Handle response errors
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid username or password!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    }
    
    // Parse successful response
    const result = await response.json();
    debug("Login API response received:");
    debug("Full response:", result);
    
    let userData;
    
    if (type === "band" && result.band) {
      userData = result.band;
      debug("Using result.band for band user");
    } else if (type === "admin" && result.admin) {
      userData = result.admin;
      debug("Using result.admin for admin user");
    } else if (result.user) {
      userData = result.user;
      debug("Using result.user");
    } else {
      // Fallback: use the entire result if no specific key found
      userData = result;
      debug("No user/band/admin key found, using entire response");
    }
    
    debug("User data to store:", userData);
    
    // Validate we have actual data
    if (!userData || typeof userData !== 'object') {
      console.error("CRITICAL: No valid user data in API response!");
      console.error("Response was:", result);
      throw new Error("Invalid response from server - no user data");
    }
    
    debug("============ STORING IN LOCALSTORAGE ============");
    debug("About to store:");
    debug("- currentUser:", JSON.stringify(userData));
    debug("- userType:", type);
    debug("- loginTime:", Date.now());
    
    localStorage.setItem("currentUser", JSON.stringify(userData));
    localStorage.setItem("userType", type);
    localStorage.setItem("loginTime", Date.now().toString());
    
    debug("============ VERIFYING STORAGE ============");
    
    // IMMEDIATE verification
    const storedUser = localStorage.getItem("currentUser");
    const storedType = localStorage.getItem("userType");
    const storedTime = localStorage.getItem("loginTime");
    
    debug("Verification - what was actually stored:");
    debug("- currentUser:", storedUser);
    debug("- userType:", storedType);
    debug("- loginTime:", storedTime);
    
    // Check if storage worked
    if (!storedUser || !storedType || !storedTime) {
      console.error("CRITICAL ERROR: localStorage.setItem FAILED!");
      console.error("Browser may be blocking localStorage");
      alert("Error: Unable to save login session. Please check browser settings.");
      return false;
    }
    
    debug("Storage verification passed!");
    
    // Show success message
    showMessage(messageBox, "Login successful!", true);
    
    // Determine redirect URL
    let redirectUrl;
    switch (type) {
      case "band":
        redirectUrl = "band.html";
        break;
      case "admin":
        redirectUrl = "admin.html";
        break;
      case "user":
      default:
        redirectUrl = "userUpdate.html";
        break;
    }
    
    debug("Redirect URL:", redirectUrl);
    debug("============ LOGIN END (SUCCESS) ============");
    debug("Redirecting in 500ms...");
    
    // Small delay to ensure localStorage is written
    setTimeout(() => {
      debug("Executing redirect NOW");
      window.location.href = redirectUrl;
    }, 500);
    
    return true;
    
  } catch (error) {
    debug("Login error:", error);
    debug("============ LOGIN END (FAILED) ============");
    showMessage(messageBox, error.message, false);
    return false;
  }
}

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 * @param {string} formType - Form identifier: 'simple', 'band', or 'admin'
 */
async function handleLoginFormSubmit(event, formType) {
  debug("============ FORM SUBMIT ============");
  debug("Form type:", formType);
  
  event.preventDefault();
  event.stopPropagation();
  
  let username, password, messageBox, selectedType;
  
  // Get form fields based on form type
  switch (formType) {
    case "band":
      username = document.getElementById("bandUsername").value;
      password = document.getElementById("bandPassword").value;
      messageBox = document.getElementById("bandmessagebox");
      selectedType = document.getElementById("bandType").value;
      break;
      
    case "admin":
      username = document.getElementById("adminUsername").value;
      password = document.getElementById("adminPassword").value;
      messageBox = document.getElementById("adminmessagebox");
      selectedType = document.getElementById("adminType").value;
      break;
      
    case "simple":
    default:
      username = document.getElementById("simpleUsername").value;
      password = document.getElementById("simplePassword").value;
      messageBox = document.getElementById("messagebox");
      selectedType = document.getElementById("simpleType").value;
      break;
  }
  
  debug("Form data extracted:");
  debug("- Username:", username);
  debug("- Password:", password ? "***" : "(empty)");
  debug("- Selected type:", selectedType);
  
  // Validate input
  if (!username || !password) {
    debug("Validation failed: Empty username or password");
    showMessage(messageBox, "Please enter both username and password!");
    return;
  }
  
  // Convert selected type to API type
  let apiType;
  switch (selectedType) {
    case "Band User":
      apiType = "band";
      break;
    case "Admin User":
      apiType = "admin";
      break;
    case "Simple User":
    default:
      apiType = "user";
      break;
  }
  
  debug("API type:", apiType);
  
  // Perform login
  await checkLogin(apiType, username, password, messageBox);
}

/**
 * Guest login - no authentication required
 */
function guestLogin() {
  debug("============ GUEST LOGIN ============");
  window.location.href = "guest.html";
}

// ----------------------------------------------------------------------------
// PAGE INITIALIZATION
// ----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  debug("============ PAGE LOAD ============");
  debug("DOM loaded, initializing authentication system");
  debug("Current page:", window.location.pathname);
  
  // Only clean up corrupted localStorage if we're on the login page
  const isLoginPage = window.location.pathname.includes("index.html") || 
                      window.location.pathname === "/" || 
                      window.location.pathname.endsWith("/");
  
  if (isLoginPage) {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser === "undefined") {
      debug("Found corrupted localStorage on login page, clearing...");
      localStorage.clear();
    }
  }
  
  // Check if user is already logged in
  const session = checkSession();
  
  if (session) {
    debug("Active session found!");
    debug("Checking if we should redirect...");
    
    const currentPath = window.location.pathname;
    debug("Current path:", currentPath);
    
    // Only redirect if we're on the login page (index.html)
    const isLoginPage = currentPath.includes("index.html") || 
                        currentPath === "/" || 
                        currentPath.endsWith("/");
    
    if (isLoginPage) {
      // Redirect to appropriate page based on user type
      switch (session.userType) {
        case "band":
          debug("Redirecting band user to band.html");
          window.location.href = "band.html";
          return;
          
        case "admin":
          debug("Redirecting admin user to admin.html");
          window.location.href = "admin.html";
          return;
          
        case "user":
        default:
          debug("Redirecting regular user to userUpdate.html");
          window.location.href = "userUpdate.html";
          return;
      }
    } else {
      debug("Already on a protected page, not redirecting");
    }
  }
  
  debug("No active session, setting up login forms");
  
  // Attach event listeners to login forms
  const simpleForm = document.getElementById("SimpleUserForm");
  if (simpleForm) {
    debug("Attaching event listener to SimpleUserForm");
    simpleForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "simple");
    });
  }
  
  const bandForm = document.getElementById("BandUserForm");
  if (bandForm) {
    debug("Attaching event listener to BandUserForm");
    bandForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "band");
    });
  }
  
  const adminForm = document.getElementById("AdminUserForm");
  if (adminForm) {
    debug("Attaching event listener to AdminUserForm");
    adminForm.addEventListener("submit", function (event) {
      handleLoginFormSubmit(event, "admin");
    });
  }
  
  debug("Authentication system initialized successfully");
  debug("============ PAGE LOAD COMPLETE ============");
});