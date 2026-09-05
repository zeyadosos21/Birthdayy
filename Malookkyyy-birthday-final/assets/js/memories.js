(() => {
  const root = document.getElementById("memoryTimeline");
  if (!root) return;

  const memories = window.BIRTHDAY_CONFIG?.memories || [];
  root.innerHTML = "";

  memories.forEach((memory, index) => {
    const item = document.createElement("article");
    item.className = `timeline-item ${index % 2 === 0 ? "left" : "right"}`;
    item.innerHTML = `
      <span class="timeline-point" aria-hidden="true"></span>
      <div class="timeline-copy">
        <h2></h2>
        <p></p>
      </div>
    `;
    item.querySelector("h2").textContent = memory.title || "";
    item.querySelector("p").textContent = memory.text || "";
    root.appendChild(item);
  });
})();
