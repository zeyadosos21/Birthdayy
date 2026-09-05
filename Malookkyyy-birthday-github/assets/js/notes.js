(() => {
  const form = document.getElementById("noteForm");
  if (!form) return;
  const list = document.getElementById("notesList");
  const status = document.getElementById("noteStatus");
  const loading = document.getElementById("notesLoading");
  const adminStatus = document.getElementById("adminStatus");
  const adminForm = document.getElementById("adminForm");
  const adminLogout = document.getElementById("adminLogout");
  let adminMode = false;

  const supa = window.birthdaySupabase;
  const ready = window.BIRTHDAY_SUPABASE_READY;
  const code = () => window.birthdayGetCode?.() || "";

  function showStatus(el, msg, type="") { el.textContent = msg; el.className = "form-status" + (type ? ` ${type}` : ""); }

  function renderNotes(notes) {
    list.innerHTML = "";
    if (!notes?.length) {
      list.innerHTML = `<div class="card empty-state"><div class="big-heart">💌</div><h3 style="font-family:'EB Garamond',serif;color:#000666;font-size:30px;margin:8px 0">Be the first to leave a note</h3><p style="color:#656574;margin:0">Your message will appear here after you submit it.</p></div>`;
      return;
    }
    notes.forEach(n => {
      const card = document.createElement("article");
      card.className = "card note-card";
      const date = new Date(n.created_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
      card.innerHTML = `<div class="note-author"></div><div class="note-date"></div><p class="note-text"></p>`;
      card.querySelector(".note-author").textContent = `— ${n.name}`;
      card.querySelector(".note-date").textContent = date;
      card.querySelector(".note-text").textContent = n.message;
      if (adminMode) {
        const btn = document.createElement("button");
        btn.className = "delete-note"; btn.textContent = "Delete";
        btn.addEventListener("click", async () => {
          if (!confirm(`Delete ${n.name}'s note?`)) return;
          const { error } = await supa.rpc("delete_note_admin", { p_note_id: n.id });
          if (error) alert(error.message); else loadNotes();
        });
        card.appendChild(btn);
      }
      list.appendChild(card);
    });
  }

  async function loadNotes() {
    if (!ready) {
      loading?.classList.add("hidden");
      list.innerHTML = `<div class="card empty-state"><div class="big-heart">🛠️</div><h3 style="font-family:'EB Garamond',serif;color:#000666;font-size:30px;margin:8px 0">Notes backend not connected yet</h3><p style="color:#656574;margin:0">Finish the 3-minute Supabase setup in <strong>SETUP.md</strong>. GitHub Pages remains your host and the link stays the same.</p></div>`;
      return;
    }
    loading?.classList.remove("hidden");
    const { data, error } = await supa.rpc("get_notes", { p_code: code() });
    loading?.classList.add("hidden");
    if (error) {
      list.innerHTML = `<div class="card empty-state"><p style="color:#9b2335">Couldn’t load notes: ${error.message}</p></div>`;
      return;
    }
    renderNotes(data || []);
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!ready) return showStatus(status,"Connect Supabase first using SETUP.md.","error");
    const name = document.getElementById("noteName").value.trim();
    const message = document.getElementById("noteMessage").value.trim();
    if (name.length < 2 || message.length < 2) return showStatus(status,"Add your name and a real note first 💖","error");
    if (name.length > 60 || message.length > 1200) return showStatus(status,"Keep the name under 60 characters and the note under 1200.","error");
    const submit = form.querySelector("button[type=submit]"); submit.disabled = true;
    showStatus(status,"Sending your note…");
    const { error } = await supa.rpc("add_note", { p_name:name, p_message:message, p_code:code() });
    submit.disabled = false;
    if (error) return showStatus(status,error.message,"error");
    form.reset(); showStatus(status,"Your note is now part of her birthday page 💌","success");
    await loadNotes();
  });

  async function syncAdmin() {
    if (!ready) return;
    const { data } = await supa.auth.getSession();
    adminMode = !!data.session;
    adminLogout?.classList.toggle("hidden", !adminMode);
    if (adminMode) showStatus(adminStatus,"Admin mode is on. Delete buttons are visible.","success");
    loadNotes();
  }

  adminForm?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!ready) return showStatus(adminStatus,"Connect Supabase first.","error");
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return showStatus(adminStatus,"Admin login failed.","error");
    adminForm.reset(); await syncAdmin();
  });
  adminLogout?.addEventListener("click", async () => { await supa.auth.signOut(); adminMode=false; showStatus(adminStatus,"Admin mode off."); await syncAdmin(); });

  window.addEventListener("birthday:unlocked", loadNotes);
  if (sessionStorage.getItem("birthdayUnlocked") === "yes") loadNotes();
  if (ready) supa.auth.onAuthStateChange(() => syncAdmin());
})();
