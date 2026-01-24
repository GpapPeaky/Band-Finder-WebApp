// user.js - just keep the function
function isLoggedIn() {
  const user = localStorage.getItem("currentUser");
  const userType = localStorage.getItem("userType");
  console.log("Login check:", { user, userType });
  return (
    user !== null &&
    user !== "undefined" &&
    userType !== null
  );
}