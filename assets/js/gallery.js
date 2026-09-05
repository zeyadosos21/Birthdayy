(() => {
  const cfg = window.BIRTHDAY_CONFIG || {};
  const supa = window.birthdaySupabase;
  const ready = window.BIRTHDAY_SUPABASE_READY;
  const code = () => window.birthdayGetCode?.() || "";

  const slider = document.getElementById("categorySlider");
  const grid = document.getElementById("galleryGrid");
  const empty = document.getElementById("galleryEmpty");
  const mediaTitle = document.getElementById("galleryMediaTitle");
  const mediaCount = document.getElementById("galleryMediaCount");
  const prev = document.getElementById("gallerySliderPrev");
  const next = document.getElementById("gallerySliderNext");
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightboxContent");

  let categories = [{ label: "All Memories", value: "all" }];
  let media = [];
  let activeCategory = "all";
  let loaded = false;
  const normalize = value => String(value ?? "").trim().toLowerCase();

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function publicMediaUrl(path) {
    if (!ready || !path) return path || "";
    return supa.storage.from("gallery-media").getPublicUrl(path).data.publicUrl;
  }

  function fallbackData() {
    const names = Array.isArray(cfg.fallbackCategories) ? cfg.fallbackCategories : ["21/6", "22/7", "Gym", "In Cairoo"];
    categories = [{ label: "All Memories", value: "all" }, ...names.map(name => ({ label: name, value: name }))];
    media = (Array.isArray(cfg.media) ? cfg.media : []).map((item, index) => ({
      ...item, id: `local-${index}`, categoryValue: item.category
    }));
  }

  async function loadBackendData() {
    if (!ready) return fallbackData();
    const [categoryResult, mediaResult] = await Promise.all([
      supa.rpc("get_gallery_categories", { p_code: code() }),
      supa.rpc("get_gallery_media", { p_code: code() })
    ]);
    if (categoryResult.error) throw categoryResult.error;
    if (mediaResult.error) throw mediaResult.error;

    categories = [{ label: "All Memories", value: "all" }, ...(categoryResult.data || []).map(c => ({ label: c.name, value: String(c.id) }))];
    media = (mediaResult.data || []).map(item => ({
      id: item.id,
      type: item.media_type,
      src: publicMediaUrl(item.storage_path),
      categoryValue: String(item.category_id),
      category: item.category_name,
      caption: item.caption || ""
    }));
  }

  function itemsFor(category) {
    if (normalize(category) === "all") return shuffle(media);
    return media.filter(item => normalize(item.categoryValue) === normalize(category));
  }

  function openLightbox(item) {
    if (!lightbox || !lightboxContent) return;
    lightboxContent.innerHTML = "";
    const el = document.createElement(item.type === "video" ? "video" : "img");
    el.src = item.src;
    if (item.type === "video") { el.controls = true; el.autoplay = true; el.playsInline = true; }
    else el.alt = item.caption || "Memory";
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
    const el = document.createElement(item.type === "video" ? "video" : "img");
    el.src = item.src;
    if (item.type === "video") { el.preload = "metadata"; el.playsInline = true; el.muted = true; }
    else { el.alt = item.caption || "Memory"; el.loading = "lazy"; }
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
    activeCategory = valid ? String(category) : "all";
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
      const url = activeCategory === "all" ? "gallery.html" : `gallery.html?category=${encodeURIComponent(activeCategory)}`;
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
      button.textContent = category.label;
      button.addEventListener("click", () => showCategory(category.value));
      slider.appendChild(button);
    });
  }

  async function initGallery(force = false) {
    if (loaded && !force) return;
    loaded = true;
    try { await loadBackendData(); }
    catch (error) {
      console.error(error);
      fallbackData();
      if (empty) empty.innerHTML = `<h2>Couldn’t load the shared gallery</h2><p>${error.message}</p>`;
    }
    renderSlider();
    const requested = new URLSearchParams(location.search).get("category") || "all";
    showCategory(requested, false);
  }

  prev?.addEventListener("click", () => slider?.scrollBy({ left: -220, behavior: "smooth" }));
  next?.addEventListener("click", () => slider?.scrollBy({ left: 220, behavior: "smooth" }));
  window.addEventListener("popstate", () => showCategory(new URLSearchParams(location.search).get("category") || "all", false));

  document.getElementById("lightboxClose")?.addEventListener("click", () => {
    lightbox?.classList.remove("open"); document.body.classList.remove("no-scroll");
  });
  lightbox?.addEventListener("click", event => {
    if (event.target === lightbox) { lightbox.classList.remove("open"); document.body.classList.remove("no-scroll"); }
  });

  window.addEventListener("birthday:unlocked", () => initGallery());
  if (sessionStorage.getItem("birthdayUnlocked") === "yes") initGallery();
})();
