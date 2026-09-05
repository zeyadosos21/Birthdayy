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
  let adminMode = false;

  function status(el, text, type = "") {
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
    if (type === "todo") todoList.innerHTML = `<div class="shared-empty"><p>${text}</p></div>`;
    else songList.innerHTML = `<div class="shared-empty"><p>${text}</p></div>`;
  }

  function todoRow(todo) {
    const row = document.createElement("article");
    row.className = `todo-row${todo.completed ? " completed" : ""}`;

    const check = document.createElement("button");
    check.type = "button";
    check.className = "todo-check";
    check.setAttribute("aria-label", todo.completed ? "Mark as not done" : "Mark as done");
    check.innerHTML = todo.completed ? "✓" : "";
    check.addEventListener("click", async () => {
      if (!ready) return;
      check.disabled = true;
      const { error } = await supa.rpc("set_todo_completed", {
        p_todo_id: todo.id,
        p_completed: !todo.completed,
        p_code: code()
      });
      check.disabled = false;
      if (error) alert(error.message); else loadTodos();
    });

    const copy = document.createElement("div");
    copy.className = "todo-copy";
    const title = document.createElement("p");
    title.textContent = todo.item;
    const date = document.createElement("span");
    date.textContent = new Date(todo.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    copy.append(title, date);

    row.append(check, copy);

    if (adminMode) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "owner-delete";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!confirm("Delete this to-do?")) return;
        const { error } = await supa.rpc("delete_todo_admin", { p_todo_id: todo.id });
        if (error) alert(error.message); else loadTodos();
      });
      row.appendChild(del);
    }

    return row;
  }

  function songRow(song) {
    const row = document.createElement("article");
    row.className = "song-row";
    const copy = document.createElement("div");
    const title = document.createElement("p");
    title.textContent = song.song;
    copy.append(title);
    row.appendChild(copy);

    if (adminMode) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "owner-delete";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!confirm("Delete this song?")) return;
        const { error } = await supa.rpc("delete_song_admin", { p_song_id: song.id });
        if (error) alert(error.message); else loadSongs();
      });
      row.appendChild(del);
    }

    return row;
  }

  async function loadTodos() {
    if (!todoList) return;
    if (!ready) return backendMessage("todo");
    todoList.innerHTML = `<div class="shared-empty"><p>Loading…</p></div>`;
    const { data, error } = await supa.rpc("get_todos", { p_code: code() });
    if (error) {
      todoList.innerHTML = `<div class="shared-empty error"><p>${error.message}</p></div>`;
      return;
    }
    todoList.innerHTML = "";
    if (!data?.length) {
      todoList.innerHTML = `<div class="shared-empty"><p>No to-dos yet. Add the first one.</p></div>`;
      return;
    }
    data.forEach(todo => todoList.appendChild(todoRow(todo)));
  }

  async function loadSongs() {
    if (!songList) return;
    if (!ready) return backendMessage("song");
    songList.innerHTML = `<div class="shared-empty"><p>Loading…</p></div>`;
    const { data, error } = await supa.rpc("get_wedding_songs", { p_code: code() });
    if (error) {
      songList.innerHTML = `<div class="shared-empty error"><p>${error.message}</p></div>`;
      return;
    }
    songList.innerHTML = "";
    if (!data?.length) {
      songList.innerHTML = `<div class="shared-empty"><p>No songs yet. Add the first suggestion.</p></div>`;
      return;
    }
    data.forEach(song => songList.appendChild(songRow(song)));
  }

  todoForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return status(todoStatus, "Connect Supabase first using SETUP.md.", "error");
    const item = todoInput.value.trim();
    if (item.length < 2) return status(todoStatus, "Write a to-do first.", "error");
    const submit = todoForm.querySelector("button[type=submit]");
    submit.disabled = true;
    const { error } = await supa.rpc("add_todo", { p_item: item, p_code: code() });
    submit.disabled = false;
    if (error) return status(todoStatus, error.message, "error");
    todoForm.reset();
    status(todoStatus, "Added.", "success");
    loadTodos();
  });

  songForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return status(songStatus, "Connect Supabase first using SETUP.md.", "error");
    const song = songInput.value.trim();
    if (song.length < 2) return status(songStatus, "Type a song name first.", "error");
    const submit = songForm.querySelector("button[type=submit]");
    submit.disabled = true;
    const { error } = await supa.rpc("add_wedding_song", {
      p_song: song,
      // Keep the existing Supabase function compatible without asking visitors for a name.
      p_added_by: "Guest",
      p_code: code()
    });
    submit.disabled = false;
    if (error) return status(songStatus, error.message, "error");
    songForm.reset();
    status(songStatus, "Song added.", "success");
    loadSongs();
  });

  async function syncAdmin() {
    if (!ready) return;
    const { data } = await supa.auth.getSession();
    adminMode = Boolean(data.session);
    adminLogout?.classList.toggle("hidden", !adminMode);
    if (adminMode) status(adminStatus, "Owner mode is on. Delete controls are visible.", "success");
    loadTodos();
    loadSongs();
  }

  adminForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return status(adminStatus, "Connect Supabase first.", "error");
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return status(adminStatus, "Owner login failed.", "error");
    adminForm.reset();
    syncAdmin();
  });

  adminLogout?.addEventListener("click", async () => {
    if (!ready) return;
    await supa.auth.signOut();
    adminMode = false;
    status(adminStatus, "Owner mode is off.");
    syncAdmin();
  });

  function loadAll() {
    loadTodos();
    loadSongs();
  }

  window.addEventListener("birthday:unlocked", loadAll);
  if (sessionStorage.getItem("birthdayUnlocked") === "yes") loadAll();
  if (ready) {
    supa.auth.onAuthStateChange(() => syncAdmin());
    syncAdmin();
  }
})();
