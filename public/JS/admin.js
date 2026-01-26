const DEBUG_ADMIN_JS = true;

document.addEventListener("DOMContentLoaded", () => {
  // Verify admin session
  const session = checkSession();

  if (!session) {
    alert("You must login first!");
    window.location.href = "index.html";
    return;
  }

  if (session.userType !== "admin") {
    alert("Access denied. This page is for admin users only.");
    window.location.href = "index.html";
    return;
  }
  // Fetch and display reviews
  fetchReviews();
});

async function fetchReviews() {
  // Get session data
  const session = checkSession();

  if (!session) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
    return;
  }
  console.log(session);

  // Create credentials JSON from localStorage
  const credentials = {
    username: session.user.username,
    password: session.user.password,
  };

  try {
    const response = await fetch("/admin/getReviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch reviews");
    }

    const reviews = data.reviews || [];

    // Display reviews
    displayReviews(reviews);
  } catch (error) {
    const list = document.getElementById("review_list");
    list.innerHTML = `
      <div class="result-message error">
        Error loading reviews: ${error.message}
      </div>
    `;
  }
}

/**
 * Display reviews in the UI
 * @param {Array} reviews - Array of review objects
 */
function displayReviews(reviews) {
  const list = document.getElementById("review_list");

  if (!reviews || reviews.length === 0) {
    list.innerHTML = `
      <div class="result-message" style="background: white; padding: 20px; text-align: center;">
        No reviews to display
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  reviews.forEach((review) => {
    const reviewCard = document.createElement("div");
    reviewCard.classList.add("review-card");

    reviewCard.id = `review-${review.review_id}`;
    // Build review HTML
    reviewCard.innerHTML = `
      <h3>Review #${review.review_id}</h3>
      <p><strong>Band:</strong> ${review.band_name || ""}</p>
      <p><strong>User:</strong> ${review.sender || ""}</p>
      <p><strong>Rating:</strong> ${review.rating || ""} / 5</p>
      <p><strong>Review:</strong> ${review.review}</p>
    
      <div class="review-actions">
        <button class="btn-approve" onclick="updateReviewStatus(${review.review_id}, 'published')">
            Approve
        </button>
        <button class="btn-reject" onclick="updateReviewStatus(${review.review_id}, 'rejected')">
            Reject
        </button>
      </div>
    `;

    list.appendChild(reviewCard);
  });
}
async function updateReviewStatus(review_id, status) {
  console.log("=== UPDATE REVIEW STATUS CALLED ===");
  console.log("Review ID:", review_id);
  console.log("Status:", status);
  
  const session = checkSession();

  if (!review_id || !status) {
    console.error("❌ Missing review_id or status");
    return;
  }
  
  if (!session) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
    return;
  }

  // Create credentials JSON from localStorage
  const credentials = {
    username: session.user.username,
    password: session.user.password,
  };

  console.log("Sending credentials:", credentials);
  
  try {
    console.log("Making fetch request to:", `/admin/reviewStatus/${review_id}/${status}`);
    
    const response = await fetch(`/admin/reviewStatus/${review_id}/${status}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Response data:", data);
    console.log("Success:", data.success);

    // If successful, remove the review card from DOM
    if (data.success) {
      console.log("Trying to find element: review-" + review_id);
      const reviewCard = document.getElementById(`review-${review_id}`);
      console.log("Found element:", reviewCard);
      
      if (reviewCard) {
        console.log("Removing card...");
        reviewCard.remove();
        console.log("Card removed!");
        
        // Check if there are no more reviews
        const list = document.getElementById("review_list");
        if (list.children.length === 0) {
          list.innerHTML = `
            <div class="result-message" style="background: white; padding: 20px; text-align: center;">
              No reviews to display
            </div>
          `;
        }
      } else {
        console.error("Could not find review card element!");
      }
      
    } else {
      console.error("API returned success: false");
    }

  } catch (err) {
    console.error("❌ Error updating review:", err);
  }
}