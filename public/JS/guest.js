// Guest frontend stuff.

document.addEventListener("DOMContentLoaded", () => {
  fetchBands();
});

// Guest band fetch, and html rendering
async function fetchBands() {
  const res = await fetch("/general/getBands");
  const data = await res.json();
  const bands = data.bands;

  const list = document.getElementById("band_list");
  list.innerHTML = "";

  bands.forEach(b => {
    const li = document.createElement("div");
    li.classList.add("band-card");
    
    li.innerHTML = `<h3>${b.band_name}</h3>
        <p><strong>Genre:</strong> <i> ${b.music_genres}</i></p>
        <p>${b.band_description}</p>
        <p><em>${b.band_city}</em></p>
        <p class= "hyper">${b.webpage}</p>
    `;

    // Add band name and band_id to the query
    li.addEventListener("click", () => {
        window.location.href = `/reviews.html?band=${encodeURIComponent(b.band_name)}#${encodeURIComponent(b.band_id)}`;
    });


    list.appendChild(li);
  });
}
