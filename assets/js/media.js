(() => {
  const media = window.BIRTHDAY_CONFIG.media || [];

  function mediaNode(item, index, mode = "slide") {
    const wrap = document.createElement(mode === "grid" ? "figure" : "div");
    wrap.className = mode === "grid" ? "stitch-masonry-item" : "slide";
    wrap.dataset.index = index;
    if (mode === "grid") wrap.dataset.category = item.category || "All Memories";

    let el;
    if (item.type === "video") {
      el = document.createElement("video");
      el.src = item.src;
      el.controls = mode !== "grid";
      el.playsInline = true;
      el.preload = "metadata";
      if (item.poster) el.poster = item.poster;
    } else {
      el = document.createElement("img");
      el.src = item.src;
      el.alt = item.caption || `Memory ${index + 1}`;
      el.loading = mode === "grid" ? "lazy" : "eager";
    }

    wrap.appendChild(el);

    if (mode === "grid") {
      const overlay = document.createElement("div");
      overlay.className = "stitch-memory-overlay";
      const label = document.createElement("span");
      label.className = "stitch-memory-label";
      label.textContent = item.caption || item.category || "Memory";
      overlay.appendChild(label);
      if (item.type === "video") {
        const play = document.createElement("span");
        play.className = "stitch-video-badge";
        play.textContent = "▶";
        overlay.appendChild(play);
      }
      wrap.appendChild(overlay);
    } else if (item.caption) {
      const cap = document.createElement("div");
      cap.className = "slide-caption";
      cap.textContent = item.caption;
      wrap.appendChild(cap);
    }

    return wrap;
  }

  // Home page slider stays intact.
  function setupSlider(root) {
    if (!root) return;
    const track = root.querySelector(".slider-track");
    const dots = root.querySelector(".slider-dots");
    const prev = root.querySelector(".slider-btn.prev");
    const next = root.querySelector(".slider-btn.next");
    if (!track || !dots) return;

    track.innerHTML = "";
    dots.innerHTML = "";

    if (!media.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "slide";
      placeholder.innerHTML = `<div class="slide-placeholder"><div class="heart">💖</div><h3 style="font-family:'EB Garamond',serif;color:#000666;font-size:30px;margin:0 0 8px">Your memories will live here</h3><p style="margin:0;line-height:1.7">Add photos and videos later in <strong>assets/js/config.js</strong>.</p></div>`;
      track.appendChild(placeholder);
      prev?.classList.add("hidden");
      next?.classList.add("hidden");
      return;
    }

    media.forEach((item, i) => {
      track.appendChild(mediaNode(item, i));
      const dot = document.createElement("button");
      dot.className = "slider-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to memory ${i + 1}`);
      dots.appendChild(dot);
    });

    let current = 0;
    let startX = 0;
    const allDots = [...dots.children];
    const go = i => {
      current = (i + media.length) % media.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      allDots.forEach((d, idx) => d.classList.toggle("active", idx === current));
      track.querySelectorAll("video").forEach((v, idx) => {
        if (idx !== current) v.pause();
      });
    };

    prev?.addEventListener("click", () => go(current - 1));
    next?.addEventListener("click", () => go(current + 1));
    allDots.forEach((d, i) => d.addEventListener("click", () => go(i)));
    track.addEventListener("touchstart", e => {
      if (e.touches.length === 1) startX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(current + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  document.querySelectorAll("[data-slider]").forEach(setupSlider);

  const grid = document.getElementById("galleryGrid");
  const empty = document.getElementById("galleryEmpty");
  const filters = [...document.querySelectorAll(".stitch-filter")];

  function normalizeCategory(value) {
    return String(value || "").trim().toLowerCase();
  }

  function openLightbox(item) {
    const lb = document.getElementById("lightbox");
    const lbContent = document.getElementById("lightboxContent");
    if (!lb || !lbContent) return;
    lbContent.innerHTML = "";
    const el = document.createElement(item.type === "video" ? "video" : "img");
    el.src = item.src;
    if (item.type === "video") {
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    }
    lbContent.appendChild(el);
    lb.classList.add("open");
  }

  function renderGallery(filter = "all") {
    if (!grid) return;
    grid.innerHTML = "";
    const wanted = normalizeCategory(filter);
    const filtered = wanted === "all"
      ? media
      : media.filter(item => normalizeCategory(item.category) === wanted);

    if (!filtered.length) {
      grid.classList.add("hidden");
      empty?.classList.remove("hidden");
      return;
    }

    empty?.classList.add("hidden");
    grid.classList.remove("hidden");

    filtered.forEach(item => {
      const originalIndex = media.indexOf(item);
      const node = mediaNode(item, originalIndex, "grid");
      node.addEventListener("click", () => openLightbox(item));
      grid.appendChild(node);
    });
  }

  if (grid) {
    renderGallery("all");
    filters.forEach(button => {
      button.addEventListener("click", () => {
        filters.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        renderGallery(button.dataset.filter || "all");
      });
    });
  }

  const lb = document.getElementById("lightbox");
  document.getElementById("lightboxClose")?.addEventListener("click", () => lb?.classList.remove("open"));
  lb?.addEventListener("click", e => {
    if (e.target === lb) lb.classList.remove("open");
  });
})();
