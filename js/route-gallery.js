// -----------------------------------------------------------
// RENDER SLIDESHOW GALERIJ
// -----------------------------------------------------------
function renderGallery(route) {
  if (!route.gallery?.length) return;

  const photos = route.gallery.filter((p) => p.url);
  if (!photos.length) return;

  let current = 0;
  const img = $("slideshow-img");
  const dotsEl = $("slideshow-dots");
  const prevBtn = $("slideshow-prev");
  const nextBtn = $("slideshow-next");

  function show(idx) {
    current = idx;
    img.src = photos[idx].url;
    img.alt = photos[idx].caption || "";
    dotsEl.querySelectorAll(".route-slideshow__dot").forEach((d, i) => {
      d.classList.toggle("route-slideshow__dot--active", i === idx);
    });
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === photos.length - 1;
  }
  

  // Dots aanmaken
  photos.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "route-slideshow__dot";
    dot.setAttribute("aria-label", `Foto ${i + 1}`);
    dot.addEventListener("click", () => show(i));
    dotsEl.appendChild(dot);
  });

  prevBtn.addEventListener("click", () => { if (current > 0) show(current - 1); });
  nextBtn.addEventListener("click", () => { if (current < photos.length - 1) show(current + 1); });

  show(0);
  $("section-gallery").hidden = false;
}

window.renderGallery = renderGallery;
