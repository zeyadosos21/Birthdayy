(() => {
  const supa = window.birthdaySupabase;
  const ready = window.BIRTHDAY_SUPABASE_READY;
  const code = () => window.birthdayGetCode?.() || "";

  const tabButtons = [...document.querySelectorAll("[data-notes-tab]")];
  const panels = [...document.querySelectorAll("[data-notes-panel]")];
  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const todoStatus = document.getElementById("todoStatus");
  const songForm = document.getElementById("songForm");
  const songInput = document.getElementById("songInput");
  const songList = document.getElementById("songList");
  const songStatus = document.getElementById("songStatus");
  const adminForm = document.getElementById("adminForm");
  const adminStatus = document.getElementById("adminStatus");
  const adminLogout = document.getElementById("adminLogout");
  const ownerOpen = document.getElementById("ownerOpen");
  let refreshTimer = null;

  function setStatus(el, text, type = "") {
    if (!el) return;
    el.textContent = text;
    el.className = `form-status${type ? ` ${type}` : ""}`;
  }
  function setTab(name) {
    tabButtons.forEach(button => button.classList.toggle("active", button.dataset.notesTab === name));
    panels.forEach(panel => panel.classList.toggle("hidden", panel.dataset.notesPanel !== name));
  }
  tabButtons.forEach(button => button.addEventListener("click", () => setTab(button.dataset.notesTab)));

  function backendMessage(type) {
    const text = "Connect Supabase using SETUP.md so everyone sees the same shared list.";
    (type === "todo" ? todoList : songList).innerHTML = `<div class="shared-empty"><p>${text}</p></div>`;
  }

  function todoRow(todo) {
    const row = document.createElement("article");
    row.className = `todo-row${todo.completed ? " completed" : ""}`;
    const check = document.createElement("button");
    check.type = "button";
    check.className = "todo-check";
    check.innerHTML = todo.completed ? "\u2713" : "";
    check.addEventListener("click", async () => {
      if (!ready) return;
      check.disabled = true;
      const { error } = await supa.rpc("set_todo_completed", { p_todo_id: todo.id, p_completed: !todo.completed, p_code: code() });
      check.disabled = false;
      if (error) alert(error.message); else loadTodos();
    });
    const copy = document.createElement("div");
    copy.className = "todo-copy";
    const title = document.createElement("p"); title.textContent = todo.item;
    const date = document.createElement("span");
    date.textContent = new Date(todo.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    copy.append(title, date); row.append(check, copy); return row;
  }
  function songRow(song) {
    const row = document.createElement("article"); row.className = "song-row";
    const copy = document.createElement("div"); const title = document.createElement("p"); title.textContent = song.song;
    copy.append(title); row.appendChild(copy); return row;
  }

  async function loadTodos() {
    if (!todoList) return;
    if (!ready) return backendMessage("todo");
    const { data, error } = await supa.rpc("get_todos", { p_code: code() });
    if (error) return todoList.innerHTML = `<div class="shared-empty error"><p>${error.message}</p></div>`;
    todoList.innerHTML = "";
    if (!data?.length) return todoList.innerHTML = `<div class="shared-empty"><p>No to-dos yet. Add the first one.</p></div>`;
    data.forEach(todo => todoList.appendChild(todoRow(todo)));
  }
  async function loadSongs() {
    if (!songList) return;
    if (!ready) return backendMessage("song");
    const { data, error } = await supa.rpc("get_wedding_songs", { p_code: code() });
    if (error) return songList.innerHTML = `<div class="shared-empty error"><p>${error.message}</p></div>`;
    songList.innerHTML = "";
    if (!data?.length) return songList.innerHTML = `<div class="shared-empty"><p>No songs yet. Add the first suggestion.</p></div>`;
    data.forEach(song => songList.appendChild(songRow(song)));
  }

  todoForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return setStatus(todoStatus, "Connect Supabase first using SETUP.md.", "error");
    const item = todoInput.value.trim();
    if (item.length < 2) return setStatus(todoStatus, "Write a to-do first.", "error");
    const submit = todoForm.querySelector("button[type=submit]"); submit.disabled = true;
    const { error } = await supa.rpc("add_todo", { p_item: item, p_code: code() }); submit.disabled = false;
    if (error) return setStatus(todoStatus, error.message, "error");
    todoForm.reset(); setStatus(todoStatus, "Added.", "success"); loadTodos();
  });

  songForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return setStatus(songStatus, "Connect Supabase first using SETUP.md.", "error");
    const song = songInput.value.trim();
    if (song.length < 2) return setStatus(songStatus, "Type a song name first.", "error");
    const submit = songForm.querySelector("button[type=submit]"); submit.disabled = true;
    const { error } = await supa.rpc("add_wedding_song", { p_song: song, p_code: code() }); submit.disabled = false;
    if (error) return setStatus(songStatus, error.message, "error");
    songForm.reset(); setStatus(songStatus, "Song added.", "success"); loadSongs();
  });

  async function syncOwnerLogin() {
    if (!ready) return setStatus(adminStatus, "Connect Supabase first.");
    const { data } = await supa.auth.getSession();
    if (!data.session) {
      adminForm?.classList.remove("hidden"); ownerOpen?.classList.add("hidden"); adminLogout?.classList.add("hidden");
      return;
    }
    const { data: isOwner, error } = await supa.rpc("is_birthday_owner");
    if (!error && isOwner === true) {
      adminForm?.classList.add("hidden"); ownerOpen?.classList.remove("hidden"); adminLogout?.classList.remove("hidden");
      setStatus(adminStatus, "Owner signed in.", "success");
    } else {
      await supa.auth.signOut();
      adminForm?.classList.remove("hidden"); ownerOpen?.classList.add("hidden"); adminLogout?.classList.add("hidden");
      setStatus(adminStatus, "This account is not registered as the owner.", "error");
    }
  }

  adminForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return setStatus(adminStatus, "Connect Supabase first.", "error");
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return setStatus(adminStatus, "Owner login failed.", "error");
    await syncOwnerLogin();
    const { data: isOwner } = await supa.rpc("is_birthday_owner");
    if (isOwner === true) window.location.href = "owner.html";
  });
  ownerOpen?.addEventListener("click", () => window.location.href = "owner.html");
  adminLogout?.addEventListener("click", async () => { await supa.auth.signOut(); setStatus(adminStatus, "Signed out."); syncOwnerLogin(); });

  function loadAll() { loadTodos(); loadSongs(); }
  function startSharedRefresh() {
    if (!ready || refreshTimer) return;
    refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible" && sessionStorage.getItem("birthdayUnlocked") === "yes") loadAll();
    }, 8000);
  }
  window.addEventListener("birthday:unlocked", () => { loadAll(); startSharedRefresh(); });
  if (sessionStorage.getItem("birthdayUnlocked") === "yes") { loadAll(); startSharedRefresh(); }
  if (ready) { supa.auth.onAuthStateChange(() => syncOwnerLogin()); syncOwnerLogin(); }
})();
