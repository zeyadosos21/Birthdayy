(() => {
  const media = Array.isArray(window.BIRTHDAY_CONFIG?.media) ? window.BIRTHDAY_CONFIG.media : [];
  const categories = ["21/6", "22/7", "Gym", "In Cairoo"];
  const cardRoot = document.getElementById("categoryCards");
  const browseView = document.getElementById("galleryBrowse");
  const mediaView = document.getElementById("galleryMediaView");
  const grid = document.getElementById("galleryGrid");
  const empty = document.getElementById("galleryEmpty");
  const mediaTitle = document.getElementById("galleryMediaTitle");
  const mediaCount = document.getElementById("galleryMediaCount");
  const back = document.getElementById("galleryBack");
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightboxContent");

  const normalize = value => String(value || "").trim().toLowerCase();
  const countFor = category => category === "all"
    ? media.length
    : media.filter(item => normalize(item.category) === normalize(category)).length;

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function categoryCard(title, subtitle, category, accent) {
    const link = document.createElement("a");
    link.href = `gallery.html?category=${encodeURIComponent(category)}`;
    link.className = `category-card ${accent}`;
    link.innerHTML = `
      <div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
        <span class="category-count">${countFor(category)} ${countFor(category) === 1 ? "item" : "items"}</span>
      </div>
      <span class="category-arrow" aria-hidden="true">›</span>
    `;
    return link;
  }

  function renderCards() {
    if (!cardRoot) return;
    cardRoot.innerHTML = "";
    cardRoot.appendChild(categoryCard("All Memories", "A collection of everything", "all", "pink"));
    cardRoot.appendChild(categoryCard("21/6", "A favorite chapter", "21/6", "beige"));
    cardRoot.appendChild(categoryCard("22/7", "Another day to keep", "22/7", "pink-soft"));
    cardRoot.appendChild(categoryCard("Gym", "Growing stronger together", "Gym", "lavender"));
    cardRoot.appendChild(categoryCard("In Cairoo", "Our Cairo days", "In Cairoo", "sand wide"));
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

  function showCategory(category) {
    const isAll = normalize(category) === "all";
    let items = isAll
      ? [...media]
      : media.filter(item => normalize(item.category) === normalize(category));

    // User requested All Memories to mix photos/videos from every category.
    if (isAll) items = shuffle(items);

    browseView?.classList.add("hidden");
    mediaView?.classList.remove("hidden");
    if (mediaTitle) mediaTitle.textContent = isAll ? "All Memories" : category;
    if (mediaCount) mediaCount.textContent = `${items.length} ${items.length === 1 ? "memory" : "memories"}`;

    grid.innerHTML = "";
    if (!items.length) {
      empty?.classList.remove("hidden");
      grid.classList.add("hidden");
      return;
    }

    empty?.classList.add("hidden");
    grid.classList.remove("hidden");
    items.forEach(item => grid.appendChild(makeMediaCard(item)));
  }

  function showBrowse() {
    browseView?.classList.remove("hidden");
    mediaView?.classList.add("hidden");
  }

  renderCards();

  const params = new URLSearchParams(location.search);
  const requested = params.get("category");
  if (requested) showCategory(requested);
  else showBrowse();

  back?.addEventListener("click", event => {
    event.preventDefault();
    history.pushState({}, "", "gallery.html");
    showBrowse();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("popstate", () => {
    const cat = new URLSearchParams(location.search).get("category");
    if (cat) showCategory(cat); else showBrowse();
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
