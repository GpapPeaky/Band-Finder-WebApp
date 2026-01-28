// Guest frontend stuff.

let allBands = []; // Global

document.addEventListener("DOMContentLoaded", () => {
  fetchBands();

  document.querySelectorAll('input[name="filterBy"]').forEach(radio => {
    radio.addEventListener("change", applyRadioFilter);
  });
});


// Guest band fetch, and html rendering
async function fetchBands() {
  const res = await fetch("/general/getBands");
  const data = await res.json();

  allBands = data.bands.sort((a, b) =>
    a.band_name.localeCompare(b.band_name)
  );

  renderBands(allBands);
}

function applyRadioFilter() {
  const filterBy = document.querySelector('input[name="filterBy"]:checked').value;

  let sorted = [...allBands];

  switch (filterBy) {
    case "name":
      sorted.sort((a, b) =>
        a.band_name.localeCompare(b.band_name)
      );
      break;

    case "genre":
      sorted.sort((a, b) =>
        a.music_genres.localeCompare(b.music_genres)
      );
      break;

    case "city":
      sorted.sort((a, b) =>
        a.band_city.localeCompare(b.band_city)
      );
      break;

    case "date":
      sorted.sort((a, b) =>
        new Date(a.available_date) - new Date(b.available_date)
      );
      break;
  }

  renderBands(sorted);
}

function renderBands(bands) {
  const list = document.getElementById("band_list");
  list.innerHTML = "";

  if (!bands.length) {
    list.innerHTML = "<p>No bands found.</p>";
    return;
  }

  bands.forEach(b => {
    const li = document.createElement("div");
    li.classList.add("band-card");

    li.innerHTML = `
      <h3>${b.band_name}</h3>
      <p><strong>Genre:</strong> <i>${b.music_genres}</i></p>
      <p>${b.band_description}</p>
      <p><em>${b.band_city}</em></p>
      <p class="hyper">${b.webpage}</p>
    `;

    li.addEventListener("click", () => {
      window.location.href =
        `/reviews.html?band=${encodeURIComponent(b.band_name)}#${encodeURIComponent(b.band_id)}`;
    });

    list.appendChild(li);
  });
}

