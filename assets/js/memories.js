(() => {
  const root = document.getElementById("memoryTimeline");
  if (!root) return;
  const cfg = window.BIRTHDAY_CONFIG || {};
  const supa = window.birthdaySupabase;
  const ready = window.BIRTHDAY_SUPABASE_READY;
  const code = () => window.birthdayGetCode?.() || "";
  let loaded = false;

  function render(memories) {
    root.innerHTML = "";
    memories.forEach((memory, index) => {
      const item = document.createElement("article");
      item.className = `timeline-item ${index % 2 === 0 ? "left" : "right"}`;
      item.innerHTML = `<span class="timeline-point" aria-hidden="true"></span><div class="timeline-copy"><h2></h2><p></p></div>`;
      item.querySelector("h2").textContent = memory.title || "";
      item.querySelector("p").textContent = memory.text || memory.body || "";
      root.appendChild(item);
    });
    if (!memories.length) root.innerHTML = `<div class="shared-empty"><p>No memories added yet.</p></div>`;
  }

  async function load(force = false) {
    if (loaded && !force) return;
    loaded = true;
    if (!ready) return render(Array.isArray(cfg.memories) ? cfg.memories : []);
    const { data, error } = await supa.rpc("get_memories", { p_code: code() });
    if (error) {
      console.error(error);
      return render(Array.isArray(cfg.memories) ? cfg.memories : []);
    }
    render(data || []);
  }

  window.addEventListener("birthday:unlocked", () => load());
  if (sessionStorage.getItem("birthdayUnlocked") === "yes") load();
})();
