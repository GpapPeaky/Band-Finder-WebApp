// ========================================
// PASSWORD VALIDATION FUNCTIONS
// ========================================

// Check if password and confirmation match
function samePassword(password, confirmPassword, messageBox) {
  if (password !== confirmPassword) {
    if (messageBox) {
      messageBox.textContent = "Passwords do not match!";
      messageBox.style.color = "red";
      messageBox.style.padding = "0.5rem";
    }
    return false;
  }
  return true;
}

// Check if password has too many numbers (40% or more)
function numberPercentageCheck(password, messageBox) {
  let numberCount = 0;

  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    if (char >= "0" && char <= "9") {
      numberCount++;
    }
  }

  const numberPercentage = (numberCount / password.length) * 100;

  if (numberPercentage >= 40) {
    if (messageBox) {
      messageBox.textContent = "Weak password: Too many numbers (40% or more)!";
      messageBox.style.color = "orange";
      messageBox.style.padding = "0.5rem";
    }
    return false;
  }

  return true;
}

// Check if password contains banned words
function bannedWordsCheck(password, bannedWords, messageBox) {
  const passwordLower = password.toLowerCase();

  for (let word of bannedWords) {
    if (passwordLower.includes(word)) {
      if (messageBox) {
        messageBox.textContent = `Password cannot contain the word '${word}'!`;
        messageBox.style.color = "red";
        messageBox.style.padding = "0.5rem";
      }
      return false;
    }
  }

  return true;
}

// Check if any character appears more than 50% of the time
function hasMajorityCharacter(password, messageBox) {
  // Only check up to halfway since characters appearing after that can't be majority
  for (let i = 0; i < Math.floor(password.length / 2) + 1; i++) {
    const char = password[i];
    let count = 1;

    // Count occurrences from i+1 onwards (before i is already checked)
    for (let j = i + 1; j < password.length; j++) {
      if (password[j] === char) {
        count++;
      }
    }

    if (count > password.length / 2) {
      if (messageBox) {
        messageBox.textContent =
          "Password cannot have a character taking more than 50% of the word!";
        messageBox.style.color = "red";
        messageBox.style.padding = "0.5rem";
      }
      return true;
    }
  }

  return false;
}

// ========================================
// CHARACTER TYPE CHECKERS
// ========================================

function containsNumber(str) {
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= "0" && str[i] <= "9") {
      return true;
    }
  }
  return false;
}

function containsLowercase(str) {
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= "a" && str[i] <= "z") {
      return true;
    }
  }
  return false;
}

function containsUppercase(str) {
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= "A" && str[i] <= "Z") {
      return true;
    }
  }
  return false;
}

function containsSymbol(str) {
  let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  for (let i = 0; i < str.length; i++) {
    if (symbols.includes(str[i])) {
      return true;
    }
  }
  return false;
}

// ========================================
// PASSWORD STRENGTH VALIDATOR
// ========================================

function validateStrength(password) {
  // Weak: fails basic checks
  if (numberPercentageCheck(password, null) === false) {
    return -1;
  }
  if (hasMajorityCharacter(password, null)) {
    return -1;
  }

  // Strong: 8+ chars with numbers, lowercase, uppercase, and symbols
  if (
    password.length >= 8 &&
    containsNumber(password) &&
    containsLowercase(password) &&
    containsUppercase(password) &&
    containsSymbol(password)
  ) {
    return 1;
  }

  // Medium: everything else
  return 0;
}

// ========================================
// UI HELPER FUNCTIONS
// ========================================

function showPassword(passwordId, confirmPasswordId, toggleButton) {
  const passwordField = document.getElementById(passwordId);
  const confirmField = document.getElementById(confirmPasswordId);

  if (passwordField.type === "text") {
    passwordField.type = "password";
    confirmField.type = "password";
    toggleButton.textContent = "Show Password";
  } else {
    passwordField.type = "text";
    confirmField.type = "text";
    toggleButton.textContent = "Hide Password";
  }
}

function displayPasswordStrength(password, messageBox) {
  let strength = validateStrength(password);

  if (strength === -1) {
    messageBox.textContent = "Weak password";
    messageBox.style.color = "red";
    messageBox.style.padding = "0.5rem";
  } else if (strength === 0) {
    messageBox.textContent = "Medium password";
    messageBox.style.color = "orange";
    messageBox.style.padding = "0.5rem";
  } else {
    messageBox.textContent = "Strong password";
    messageBox.style.color = "Green";
    messageBox.style.padding = "0.5rem";
  }
}

function clearMessage(messageBox) {
  messageBox.textContent = "";
  messageBox.style.padding = "0";
}

// ========================================
// SIMPLE USER FORM VALIDATION
// ========================================

async function submitForm(jsonData) {
  try {
    console.log("Sending registration request:", jsonData);

    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData),
    });

    // Check if response is ok
    if (!res.ok) {
      // Try to get error message from response
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          return {
            success: false,
            message:
              errorData.error ||
              errorData.mytype ||
              `Server returned ${res.status}: ${res.statusText}`,
          };
        } else {
          const text = await res.text();
          return {
            success: false,
            message: `Server returned ${res.status}: ${text}`,
          };
        }
      } catch (parseError) {
        return {
          success: false,
          message: `Server returned ${res.status}: ${res.statusText}`,
        };
      }
    }

    // Check content type before parsing
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Server returned non-JSON response:", text);
      return {
        success: false,
        message: "Server returned an invalid response (expected JSON)",
      };
    }

    const data = await res.json();
    console.log("Server response:", data);

    if (data.success) {
      return {
        success: true,
        message: data.message || "Success",
        redirect: data.redirect,
      };
    } else {
      return {
        success: false,
        message: data.error || data.mytype || "Registration failed",
      };
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return { success: false, message: err.message || "Network error" };
  }
}

async function validateSimpleUserForm(event) {
  event.preventDefault();

  const messageBox = document.getElementById("message");
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm_password").value;

  // Check password length
  if (password.length < 8) {
    messageBox.textContent = "Password must be at least 8 characters long!";
    messageBox.style.color = "red";
    messageBox.style.padding = "0.5rem";
    return;
  }

  // Run all validation checks
  if (!samePassword(password, confirmPassword, messageBox)) return;
  if (!numberPercentageCheck(password, messageBox)) return;
  if (hasMajorityCharacter(password, messageBox)) return;

  if (validateStrength(password) === -1) {
    messageBox.textContent = "Password is too weak!";
    messageBox.style.color = "red";
    messageBox.style.padding = "0.5rem";
    return;
  }

  // All checks passed - display form data as JSON
  clearMessage(messageBox);
  const formData = new FormData(event.target);
  const jsonData = Object.fromEntries(formData.entries());

  console.log("=== FORM DATA BEING SENT ===");
  console.log("Field names:", Object.keys(jsonData));
  console.log("Full data:", JSON.stringify(jsonData, null, 2));

  try {
    const result = await submitForm(jsonData);
    console.log("Submit result:", result);

    if (result.success) {
      if (result.redirect) {
        window.location.href = result.redirect;
      } else {
        messageBox.textContent = result.message || "Registration successful!";
        messageBox.style.color = "green";
        messageBox.style.padding = "0.5rem";
        // Reset form after successful registration
        setTimeout(() => {
          event.target.reset();
          clearMessage(messageBox);
        }, 2000);
      }
    } else {
      if (
        result.message === "Username already exists" ||
        result.message === "An account already exists using this email." ||
        result.message === "An account already exists using this phone number"
      ) {
        messageBox.textContent = result.message;
        messageBox.style.color = "red";
        messageBox.style.padding = "0.5rem";
      } else {
        messageBox.textContent = "Registration failed. Please try again.";
        messageBox.style.color = "red";
        messageBox.style.padding = "0.5rem";
      }
    }
  } catch (error) {
    console.error("Validation error:", error);
    messageBox.textContent = "An error occurred. Please try again.";
    messageBox.style.color = "red";
    messageBox.style.padding = "0.5rem";
  }
}

// ========================================
// BAND USER FORM VALIDATION
// ========================================
async function validateBandUserForm(event) {
  event.preventDefault();

  const messageBox = document.querySelector(".band-message");
  const password = document.getElementById("band-password").value;
  const confirmPassword = document.getElementById(
    "band-confirm_password"
  ).value;

  // Run all validation checks
  if (!samePassword(password, confirmPassword, messageBox)) return;
  if (!numberPercentageCheck(password, messageBox)) return;
  if (hasMajorityCharacter(password, messageBox)) return;

  // Band-specific: check for banned words
  const bannedWords = ["band", "music", "mpanta", "mousiki"];
  if (!bannedWordsCheck(password, bannedWords, messageBox)) return;

  if (validateStrength(password) === -1) {
    messageBox.textContent = "Password is too weak!";
    messageBox.style.color = "red";
    messageBox.style.padding = "0.5rem";
    return;
  }

  // All checks passed - display form data as JSON
  clearMessage(messageBox);
  const formData = new FormData(event.target);
  const jsonData = Object.fromEntries(formData.entries());

  console.log("=== BAND FORM DATA BEING SENT ===");
  console.log("Field names:", Object.keys(jsonData));
  console.log("Full data:", JSON.stringify(jsonData, null, 2));

  try {
    const result = await submitForm(jsonData);
    console.log("Submit result:", result);

    if (result.success) {
      if (result.redirect) {
        window.location.href = result.redirect;
      } else {
        messageBox.textContent = result.message || "Registration successful!";
        messageBox.style.color = "green";
        messageBox.style.padding = "0.5rem";
        // Reset form after successful registration
        setTimeout(() => {
          event.target.reset();
          clearMessage(messageBox);
        }, 2000);
      }
    } else {
      if (
        result.message === "Username already exists" ||
        result.message === "An account already exists using this email." ||
        result.message ===
          "An account already exists using this phone number" ||
        result.message === "An account already exists using this band name"
      ) {
        messageBox.textContent = result.message;
        messageBox.style.color = "red";
        messageBox.style.padding = "0.5rem";
      } else {
        messageBox.textContent = "Registration failed. Please try again.";
        messageBox.style.color = "red";
        messageBox.style.padding = "0.5rem";
      }
    }
  } catch (error) {
    console.error("Validation error:", error);
    messageBox.textContent = "An error occurred. Please try again.";
    messageBox.style.color = "red";
    messageBox.style.padding = "0.5rem";
  }
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // Only add event listeners if the forms exist
  const simpleUserForm = document.getElementById("simpleUserForm");
  if (simpleUserForm) {
    simpleUserForm.addEventListener("submit", validateSimpleUserForm);
  }

  const bandUserForm = document.getElementById("bandUserForm");
  if (bandUserForm) {
    bandUserForm.addEventListener("submit", validateBandUserForm);
  }

  // Check if show-password button exists
  const showPasswordBtn = document.querySelector(".show-password");
  if (showPasswordBtn) {
    showPasswordBtn.addEventListener("click", function () {
      showPassword("password", "confirm_password", this);
    });
  }

  // Check if check-strength button exists
  const checkStrengthBtn = document.querySelector(".check-streangth");
  if (checkStrengthBtn) {
    checkStrengthBtn.addEventListener("click", function () {
      const password = document.getElementById("password").value;
      const messageBox = document.getElementById("message");
      if (password && messageBox) {
        displayPasswordStrength(password, messageBox);
      }
    });
  }

  // Check if band show-password button exists
  const bandShowPasswordBtn = document.querySelector(".band-show-password");
  if (bandShowPasswordBtn) {
    bandShowPasswordBtn.addEventListener("click", function () {
      showPassword("band-password", "band-confirm_password", this);
    });
  }

  // Check if band check-strength button exists
  const bandCheckStrengthBtn = document.querySelector(".band-check-streangth");
  if (bandCheckStrengthBtn) {
    bandCheckStrengthBtn.addEventListener("click", function () {
      const password = document.getElementById("band-password").value;
      const messageBox = document.querySelector(".band-message");
      if (password && messageBox) {
        displayPasswordStrength(password, messageBox);
      }
    });
  }
});