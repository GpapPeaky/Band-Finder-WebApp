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

async function sendReview(bandName) {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user) return;

  const username = user.username;
  const password = user.password;
  const rating = document.getElementById("review_rating").value;
  const review = document.getElementById("review_text").value;

  if (!rating || !review) return;

  const res = await fetch("user/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      band_name: bandName,
      sender: username,
      password,
      review,
      rating
    })
  });

  if (!res.ok) return;

  document.getElementById("review_form").reset();
}