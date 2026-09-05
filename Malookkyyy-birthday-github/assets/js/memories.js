(() => {
  const root = document.getElementById("memoryTimeline");
  if (!root) return;
  (window.BIRTHDAY_CONFIG.memories || []).forEach(m => {
    const item = document.createElement("article");
    item.className = "memory";
    item.innerHTML = `<span class="memory-dot"></span><time></time><h3></h3><p></p>`;
    item.querySelector("time").textContent = m.date || "";
    item.querySelector("h3").textContent = m.title || "";
    item.querySelector("p").textContent = m.text || "";
    root.appendChild(item);
  });
})();
