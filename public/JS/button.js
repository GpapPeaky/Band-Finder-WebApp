// Switch to Simple User form
document.getElementById("simpleBtn").addEventListener("click", function () {
  document.getElementById("simpleUserForm").parentElement.style.display = "block";
  document.getElementById("bandUserFormContainer").style.display = "none";
  document.getElementById("simpleBtn").classList.add("selected");
  document.getElementById("bandBtn").classList.remove("selected");
  
  // Change background color to simple user color
  document.body.style.backgroundColor = "#adf8db";
});

// Switch to Band User form
document.getElementById("bandBtn").addEventListener("click", function () {
  document.getElementById("simpleUserForm").parentElement.style.display = "none";
  document.getElementById("bandUserFormContainer").style.display = "block";
  document.getElementById("bandBtn").classList.add("selected");
  document.getElementById("simpleBtn").classList.remove("selected");
  
  // Change background color to band user color
  document.body.style.backgroundColor = "#f79fceff"; // Light pink
});

// Switch to Simple User form (from band form buttons)
document.getElementById("simpleBtn2").addEventListener("click", function () {
  document.getElementById("simpleUserForm").parentElement.style.display = "block";
  document.getElementById("bandUserFormContainer").style.display = "none";
  document.getElementById("simpleBtn").classList.add("selected");
  document.getElementById("bandBtn").classList.remove("selected");
  
  // Change background color to simple user color
  document.body.style.backgroundColor = "#adf8db";
});

// Switch to Band User form (from band form buttons)
document.getElementById("bandBtn2").addEventListener("click", function () {
  document.getElementById("simpleUserForm").parentElement.style.display = "none";
  document.getElementById("bandUserFormContainer").style.display = "block";
  document.getElementById("bandBtn2").classList.add("selected");
  document.getElementById("simpleBtn2").classList.remove("selected");
  
  // Change background color to band user color
  document.body.style.backgroundColor = "#f79fceff"; // Light pink
});