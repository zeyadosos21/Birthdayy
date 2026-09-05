(() => {
  const media = Array.isArray(window.BIRTHDAY_CONFIG?.media) ? window.BIRTHDAY_CONFIG.media : [];

  // ==========================================================
  // GALLERY CATEGORY SLIDER
  // These are the tabs shown in the swipeable slider at the top.
  // "All Memories" automatically combines every category below.
  // ==========================================================
  const categories = [
    { label: "All Memories", value: "all" },
    { label: "21/6", value: "21/6" },
    { label: "22/7", value: "22/7" },
    { label: "Gym", value: "Gym" },
    { label: "In Cairoo", value: "In Cairoo" }
  ];

  const slider = document.getElementById("categorySlider");
  const grid = document.getElementById("galleryGrid");
  const empty = document.getElementById("galleryEmpty");
  const mediaTitle = document.getElementById("galleryMediaTitle");
  const mediaCount = document.getElementById("galleryMediaCount");
  const prev = document.getElementById("gallerySliderPrev");
  const next = document.getElementById("gallerySliderNext");
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightboxContent");

  const normalize = value => String(value || "").trim().toLowerCase();
  let activeCategory = "all";

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function itemsFor(category) {
    if (normalize(category) === "all") {
      // All Memories = photos + videos from every category, mixed together.
      return shuffle(media);
    }
    return media.filter(item => normalize(item.category) === normalize(category));
  }

  function openLightbox(item) {
    if (!lightbox || !lightboxContent) return;
    lightboxContent.innerHTML = "";
    const el = document.createElement(item.type === "video" ? "video" : "img");
    el.src = item.src;
    if (item.type === "video") {
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
      if (item.poster) el.poster = item.poster;
    } else {
      el.alt = item.caption || "Memory";
    }
    lightboxContent.appendChild(el);
    if (item.caption) {
      const caption = document.createElement("p");
      caption.className = "lightbox-caption";
      caption.textContent = item.caption;
      lightboxContent.appendChild(caption);
    }
    lightbox.classList.add("open");
    document.body.classList.add("no-scroll");
  }

  function makeMediaCard(item) {
    const figure = document.createElement("figure");
    figure.className = "memory-media";

    let el;
    if (item.type === "video") {
      el = document.createElement("video");
      el.src = item.src;
      el.preload = "metadata";
      el.playsInline = true;
      el.muted = true;
      if (item.poster) el.poster = item.poster;
    } else {
      el = document.createElement("img");
      el.src = item.src;
      el.alt = item.caption || "Memory";
      el.loading = "lazy";
    }
    figure.appendChild(el);

    if (item.type === "video") {
      const play = document.createElement("span");
      play.className = "video-play";
      play.textContent = "▶";
      figure.appendChild(play);
    }

    if (item.caption) {
      const caption = document.createElement("figcaption");
      caption.textContent = item.caption;
      figure.appendChild(caption);
    }

    figure.addEventListener("click", () => openLightbox(item));
    return figure;
  }

  function updateSliderActive() {
    slider?.querySelectorAll(".gallery-category-pill").forEach(button => {
      const selected = normalize(button.dataset.category) === normalize(activeCategory);
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      if (selected) button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }

  function showCategory(category, updateUrl = true) {
    const valid = categories.some(item => normalize(item.value) === normalize(category));
    activeCategory = valid ? category : "all";
    const items = itemsFor(activeCategory);
    const active = categories.find(item => normalize(item.value) === normalize(activeCategory)) || categories[0];

    if (mediaTitle) mediaTitle.textContent = active.label;
    if (mediaCount) mediaCount.textContent = `${items.length} ${items.length === 1 ? "memory" : "memories"}`;

    if (grid) grid.innerHTML = "";
    if (!items.length) {
      empty?.classList.remove("hidden");
      grid?.classList.add("hidden");
    } else {
      empty?.classList.add("hidden");
      grid?.classList.remove("hidden");
      items.forEach(item => grid?.appendChild(makeMediaCard(item)));
    }

    updateSliderActive();

    if (updateUrl) {
      const url = activeCategory === "all"
        ? "gallery.html"
        : `gallery.html?category=${encodeURIComponent(activeCategory)}`;
      history.replaceState({}, "", url);
    }
  }

  function renderSlider() {
    if (!slider) return;
    slider.innerHTML = "";
    categories.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-category-pill";
      button.dataset.category = category.value;
      button.setAttribute("role", "tab");
      button.textContent = category.label;
      button.addEventListener("click", () => showCategory(category.value));
      slider.appendChild(button);
    });
  }

  renderSlider();

  const requested = new URLSearchParams(location.search).get("category") || "all";
  showCategory(requested, false);

  prev?.addEventListener("click", () => slider?.scrollBy({ left: -220, behavior: "smooth" }));
  next?.addEventListener("click", () => slider?.scrollBy({ left: 220, behavior: "smooth" }));

  window.addEventListener("popstate", () => {
    showCategory(new URLSearchParams(location.search).get("category") || "all", false);
  });

  document.getElementById("lightboxClose")?.addEventListener("click", () => {
    lightbox?.classList.remove("open");
    document.body.classList.remove("no-scroll");
  });

  lightbox?.addEventListener("click", event => {
    if (event.target === lightbox) {
      lightbox.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }
  });
})();
