(() => {
  const cfg = window.BIRTHDAY_CONFIG || {};
  const ready = Boolean(cfg.supabaseUrl && !cfg.supabaseUrl.startsWith("PASTE_") && cfg.supabasePublishableKey && !cfg.supabasePublishableKey.startsWith("PASTE_") && window.supabase);
  const supa = ready ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey) : null;

  const loading = document.getElementById("ownerLoading");
  const loginScreen = document.getElementById("ownerLoginScreen");
  const dashboard = document.getElementById("ownerDashboard");
  const loginForm = document.getElementById("ownerPageLoginForm");
  const loginStatus = document.getElementById("ownerPageLoginStatus");
  const logoutBtn = document.getElementById("ownerLogout");
  const tabs = [...document.querySelectorAll("[data-owner-tab]")];
  const panels = [...document.querySelectorAll("[data-owner-panel]")];

  const ownerSidebar = document.getElementById("ownerSidebar");
  const ownerMenuToggle = document.getElementById("ownerMenuToggle");
  const ownerMenuClose = document.getElementById("ownerMenuClose");
  const ownerMenuBackdrop = document.getElementById("ownerMenuBackdrop");
  const ownerMobileSection = document.getElementById("ownerMobileSection");

  let categories = [], media = [], memories = [], todos = [], songs = [];
  const withTimeout = (promise, ms = 10000) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), ms))
  ]);

  const status = (el, text, type = "") => { if (el) { el.textContent = text; el.className = `form-status${type ? ` ${type}` : ""}`; } };
  const escapeName = name => name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";

  function setOwnerMenu(open) {
    ownerSidebar?.classList.toggle("menu-open", open);
    ownerMenuBackdrop?.classList.toggle("menu-open", open);
    document.body.classList.toggle("owner-menu-open", open);
    ownerMenuToggle?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setTab(name) {
    tabs.forEach(btn => btn.classList.toggle("active", btn.dataset.ownerTab === name));
    panels.forEach(panel => panel.classList.toggle("hidden", panel.dataset.ownerPanel !== name));

    const activeButton = tabs.find(btn => btn.dataset.ownerTab === name);
    if (ownerMobileSection && activeButton) {
      ownerMobileSection.textContent = activeButton.textContent.trim();
    }

    setOwnerMenu(false);
  }

  tabs.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.ownerTab)));
  ownerMenuToggle?.addEventListener("click", () => {
    setOwnerMenu(!ownerSidebar?.classList.contains("menu-open"));
  });
  ownerMenuClose?.addEventListener("click", () => setOwnerMenu(false));
  ownerMenuBackdrop?.addEventListener("click", () => setOwnerMenu(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOwnerMenu(false);
  });

  async function isOwner() {
    const { data: sessionData } = await withTimeout(supa.auth.getSession());
    if (!sessionData.session) return false;
    const { data, error } = await withTimeout(supa.rpc("is_birthday_owner"));
    return !error && data === true;
  }

  async function guard() {
    loading.classList.remove("hidden");
    if (!ready) {
      loading.classList.add("hidden");
      loginScreen.classList.remove("hidden");
      loginStatus.textContent = "Connect Supabase in assets/js/config.js first.";
      return;
    }
    try {
      if (await isOwner()) {
        loading.classList.add("hidden"); loginScreen.classList.add("hidden"); dashboard.classList.remove("hidden");
        await refreshAll();
      } else {
        loading.classList.add("hidden"); dashboard.classList.add("hidden"); loginScreen.classList.remove("hidden");
      }
    } catch (error) {
      loading.classList.add("hidden");
      dashboard.classList.add("hidden");
      loginScreen.classList.remove("hidden");
      status(loginStatus, "Connection is slow. Try again.", "error");
    }
  }

  loginForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!ready) return status(loginStatus, "Connect Supabase first.", "error");
    const email = document.getElementById("ownerPageEmail").value.trim();
    const password = document.getElementById("ownerPagePassword").value;
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return status(loginStatus, "Login failed.", "error");
    if (!(await isOwner())) { await supa.auth.signOut(); return status(loginStatus, "This account is not the owner.", "error"); }
    status(loginStatus, "", ""); await guard();
  });
  logoutBtn?.addEventListener("click", async () => { await supa.auth.signOut(); window.location.href = "index.html"; });

  function publicUrl(path) { return supa.storage.from("gallery-media").getPublicUrl(path).data.publicUrl; }

  async function loadCategories() {
    const { data, error } = await supa.from("gallery_categories").select("id,name,sort_order,created_at").order("sort_order").order("id");
    if (error) throw error; categories = data || [];
    const select = document.getElementById("mediaCategory");
    if (select) select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    renderCategories();
  }
  async function loadMedia() {
    const { data, error } = await supa.from("gallery_media").select("id,category_id,media_type,storage_path,caption,sort_order,created_at,gallery_categories(name)").order("sort_order").order("id");
    if (error) throw error; media = data || []; renderMedia();
  }
  async function loadMemories() {
    const { data, error } = await supa.from("memories").select("id,title,body,sort_order,created_at").order("sort_order").order("id");
    if (error) throw error; memories = data || []; renderMemories();
  }
  async function loadTodos() {
    const { data, error } = await supa.from("birthday_todos").select("id,item,completed,created_at").order("created_at", { ascending: false });
    if (error) throw error; todos = data || []; renderTodos();
  }
  async function loadSongs() {
    const { data, error } = await supa.from("wedding_songs").select("id,song,created_at").order("created_at", { ascending: false });
    if (error) throw error; songs = data || []; renderSongs();
  }
  async function refreshAll() {
    try {
      await Promise.all([loadCategories(), loadMedia(), loadMemories(), loadTodos(), loadSongs()]);
      document.getElementById("statMedia").textContent = media.length;
      document.getElementById("statCategories").textContent = categories.length;
      document.getElementById("statMemories").textContent = memories.length;
      document.getElementById("statNotes").textContent = todos.length + songs.length;
    } catch (error) { console.error(error); alert(error.message); }
  }

  function actionButton(label, handler, cls = "") {
    const btn = document.createElement("button"); btn.type = "button"; btn.className = `owner-mini ${cls}`; btn.textContent = label; btn.addEventListener("click", handler); return btn;
  }

  function renderCategories() {
    const list = document.getElementById("ownerCategoryList"); if (!list) return; list.innerHTML = "";
    categories.forEach((c, index) => {
      const row = document.createElement("div"); row.className = "owner-list-row";
      const input = document.createElement("input"); input.className = "owner-edit-input"; input.value = c.name; input.maxLength = 60;
      const actions = document.createElement("div"); actions.className = "owner-row-actions";
      actions.append(
        actionButton("Save", async () => { const name=input.value.trim(); if(!name)return; await supa.from("gallery_categories").update({name}).eq("id",c.id); await refreshAll(); }),
        actionButton("\u2191", () => moveCategory(index,-1)),
        actionButton("\u2193", () => moveCategory(index,1)),
        actionButton("Delete", async () => { if(!confirm(`Delete ${c.name}? Media in it must be moved/deleted first.`))return; const {error}=await supa.from("gallery_categories").delete().eq("id",c.id); if(error)return alert(error.message); await refreshAll(); }, "danger")
      );
      row.append(input, actions); list.appendChild(row);
    });
    if (!categories.length) list.innerHTML = `<div class="owner-empty">No categories yet.</div>`;
  }
  async function moveCategory(index, delta) {
    const j=index+delta; if(j<0||j>=categories.length)return;
    const a=categories[index], b=categories[j];
    await Promise.all([
      supa.from("gallery_categories").update({sort_order:b.sort_order}).eq("id",a.id),
      supa.from("gallery_categories").update({sort_order:a.sort_order}).eq("id",b.id)
    ]); await refreshAll();
  }
  document.getElementById("categoryAddForm")?.addEventListener("submit", async event => {
    event.preventDefault(); const input=document.getElementById("categoryName"); const name=input.value.trim(); if(!name)return;
    const max=Math.max(0,...categories.map(c=>c.sort_order||0)); const {error}=await supa.from("gallery_categories").insert({name,sort_order:max+10});
    if(error)return status(document.getElementById("categoryStatus"),error.message,"error"); input.value=""; await refreshAll();
  });

  function detectMediaType(file) {
    const mime = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();

    if (mime.startsWith("video/") || /\.(mp4|mov|m4v|webm|ogv)$/i.test(name)) return "video";
    if (mime.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(name)) return "image";
    return "";
  }

  function contentTypeFor(file, type) {
    if (file?.type) return file.type;
    const name = String(file?.name || "").toLowerCase();
    if (type === "video") {
      if (name.endsWith(".webm")) return "video/webm";
      if (name.endsWith(".mov")) return "video/quicktime";
      return "video/mp4";
    }
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    if (name.endsWith(".gif")) return "image/gif";
    return "image/jpeg";
  }

  function primeVideoPreview(video) {
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    const seekPreview = () => {
      const duration = Number(video.duration);
      if (!Number.isFinite(duration) || duration <= 0) return;
      const previewTime = Math.min(0.15, Math.max(0.03, duration * 0.05));
      try {
        if (Math.abs(video.currentTime - previewTime) > 0.01) {
          video.currentTime = previewTime;
        }
      } catch (_) {}
    };

    video.addEventListener("loadedmetadata", seekPreview, { once: true });
  }

  function renderMedia() {
    const list=document.getElementById("ownerMediaList"); if(!list)return; list.innerHTML="";
    media.forEach((m,index)=>{
      const row=document.createElement("div"); row.className="owner-media-row";
      const preview=document.createElement(m.media_type==="video"?"video":"img"); preview.src=publicUrl(m.storage_path); if(m.media_type==="video"){primeVideoPreview(preview);}
      const fields=document.createElement("div"); fields.className="owner-media-fields";
      const caption=document.createElement("input"); caption.className="owner-edit-input"; caption.value=m.caption||""; caption.placeholder="Caption";
      const select=document.createElement("select"); select.className="owner-edit-input"; select.innerHTML=categories.map(c=>`<option value="${c.id}" ${String(c.id)===String(m.category_id)?"selected":""}>${c.name}</option>`).join("");
      fields.append(caption,select);
      const actions=document.createElement("div"); actions.className="owner-row-actions";
      actions.append(
        actionButton("Save",async()=>{await supa.from("gallery_media").update({caption:caption.value.trim(),category_id:Number(select.value)}).eq("id",m.id);await refreshAll();}),
        actionButton("\u2191",()=>moveMedia(index,-1)), actionButton("\u2193",()=>moveMedia(index,1)),
        actionButton("Delete",async()=>{if(!confirm("Delete this media?"))return; const {data,error}=await supa.rpc("delete_gallery_media_admin",{p_media_id:m.id}); if(error)return alert(error.message); if(data) await supa.storage.from("gallery-media").remove([data]); await refreshAll();},"danger")
      );
      row.append(preview,fields,actions); list.appendChild(row);
    });
    if(!media.length) list.innerHTML=`<div class="owner-empty">No photos or videos yet.</div>`;
  }
  async function moveMedia(index,delta){const j=index+delta;if(j<0||j>=media.length)return;const a=media[index],b=media[j];await Promise.all([supa.from("gallery_media").update({sort_order:b.sort_order}).eq("id",a.id),supa.from("gallery_media").update({sort_order:a.sort_order}).eq("id",b.id)]);await refreshAll();}
  const mediaFileInput = document.getElementById("mediaFile");

  mediaFileInput?.addEventListener("change", () => {
    const count = mediaFileInput.files?.length || 0;
    const st = document.getElementById("mediaUploadStatus");
    if (count > 1) status(st, `${count} files selected.`);
    else if (count === 1) status(st, "1 file selected.");
    else status(st, "");
  });

  document.getElementById("mediaUploadForm")?.addEventListener("submit", async event => {
    event.preventDefault();

    const input = document.getElementById("mediaFile");
    const files = [...(input?.files || [])];
    const categoryId = Number(document.getElementById("mediaCategory").value);
    const caption = document.getElementById("mediaCaption").value.trim();
    const st = document.getElementById("mediaUploadStatus");
    const submit = event.currentTarget.querySelector('button[type="submit"]');

    if (!files.length) return status(st, "Choose at least one photo or video.", "error");
    if (!categoryId) return status(st, "Choose a category.", "error");

    const invalid = files.filter(file => !detectMediaType(file));
    if (invalid.length) {
      return status(st, `Unsupported file: ${invalid[0].name}`, "error");
    }

    submit.disabled = true;

    let nextSort = Math.max(0, ...media.map(m => m.sort_order || 0)) + 10;
    let uploaded = 0;
    const failed = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = detectMediaType(file);

      status(st, `Uploading ${i + 1} of ${files.length}...`);

      const path = `${Date.now()}-${crypto.randomUUID()}-${escapeName(file.name)}`;
      const up = await supa.storage.from("gallery-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: contentTypeFor(file, type)
      });

      if (up.error) {
        failed.push(`${file.name}: ${up.error.message}`);
        continue;
      }

      const ins = await supa.from("gallery_media").insert({
        category_id: categoryId,
        media_type: type,
        storage_path: path,
        caption,
        sort_order: nextSort
      });

      if (ins.error) {
        await supa.storage.from("gallery-media").remove([path]);
        failed.push(`${file.name}: ${ins.error.message}`);
        continue;
      }

      uploaded += 1;
      nextSort += 10;
    }

    submit.disabled = false;

    if (uploaded > 0) {
      event.currentTarget.reset();
      await refreshAll();
    }

    if (!failed.length) {
      status(st, `Uploaded ${uploaded} ${uploaded === 1 ? "file" : "files"}.`, "success");
    } else if (uploaded > 0) {
      status(st, `Uploaded ${uploaded}. ${failed.length} failed. Try the failed file(s) again.`, "error");
      console.warn("Upload failures:", failed);
    } else {
      status(st, failed[0] || "Upload failed.", "error");
      console.warn("Upload failures:", failed);
    }
  });

  function renderMemories(){const list=document.getElementById("ownerMemoryList");if(!list)return;list.innerHTML="";memories.forEach((m,index)=>{const row=document.createElement("div");row.className="owner-list-row owner-memory-row";const fields=document.createElement("div");fields.className="owner-memory-fields";const title=document.createElement("input");title.className="owner-edit-input";title.value=m.title;const body=document.createElement("textarea");body.className="owner-edit-input owner-textarea";body.value=m.body;fields.append(title,body);const actions=document.createElement("div");actions.className="owner-row-actions";actions.append(actionButton("Save",async()=>{await supa.from("memories").update({title:title.value.trim(),body:body.value.trim()}).eq("id",m.id);await refreshAll();}),actionButton("\u2191",()=>moveMemory(index,-1)),actionButton("\u2193",()=>moveMemory(index,1)),actionButton("Delete",async()=>{if(!confirm("Delete this memory?"))return;await supa.from("memories").delete().eq("id",m.id);await refreshAll();},"danger"));row.append(fields,actions);list.appendChild(row);});if(!memories.length)list.innerHTML=`<div class="owner-empty">No memories yet.</div>`;}
  async function moveMemory(index,delta){const j=index+delta;if(j<0||j>=memories.length)return;const a=memories[index],b=memories[j];await Promise.all([supa.from("memories").update({sort_order:b.sort_order}).eq("id",a.id),supa.from("memories").update({sort_order:a.sort_order}).eq("id",b.id)]);await refreshAll();}
  document.getElementById("memoryAddForm")?.addEventListener("submit",async event=>{event.preventDefault();const title=document.getElementById("memoryTitle").value.trim(),body=document.getElementById("memoryBody").value.trim();const max=Math.max(0,...memories.map(m=>m.sort_order||0));const {error}=await supa.from("memories").insert({title,body,sort_order:max+10});if(error)return status(document.getElementById("memoryStatus"),error.message,"error");event.target.reset();await refreshAll();});

  function renderTodos(){const list=document.getElementById("ownerTodoList");if(!list)return;list.innerHTML="";todos.forEach(t=>{const row=document.createElement("div");row.className="owner-list-row";const wrap=document.createElement("div");wrap.className="owner-check-edit";const check=document.createElement("input");check.type="checkbox";check.checked=t.completed;check.addEventListener("change",async()=>{await supa.from("birthday_todos").update({completed:check.checked}).eq("id",t.id);await refreshAll();});const input=document.createElement("input");input.className="owner-edit-input";input.value=t.item;wrap.append(check,input);const actions=document.createElement("div");actions.className="owner-row-actions";actions.append(actionButton("Save",async()=>{await supa.from("birthday_todos").update({item:input.value.trim()}).eq("id",t.id);await refreshAll();}),actionButton("Delete",async()=>{if(!confirm("Delete this to-do?"))return;await supa.from("birthday_todos").delete().eq("id",t.id);await refreshAll();},"danger"));row.append(wrap,actions);list.appendChild(row);});if(!todos.length)list.innerHTML=`<div class="owner-empty">No to-dos yet.</div>`;}
  document.getElementById("ownerTodoAddForm")?.addEventListener("submit",async event=>{event.preventDefault();const input=document.getElementById("ownerTodoInput");const {error}=await supa.from("birthday_todos").insert({item:input.value.trim()});if(error)return alert(error.message);input.value="";await refreshAll();});

  function renderSongs(){const list=document.getElementById("ownerSongList");if(!list)return;list.innerHTML="";songs.forEach(s=>{const row=document.createElement("div");row.className="owner-list-row";const input=document.createElement("input");input.className="owner-edit-input";input.value=s.song;const actions=document.createElement("div");actions.className="owner-row-actions";actions.append(actionButton("Save",async()=>{await supa.from("wedding_songs").update({song:input.value.trim()}).eq("id",s.id);await refreshAll();}),actionButton("Delete",async()=>{if(!confirm("Delete this song?"))return;await supa.from("wedding_songs").delete().eq("id",s.id);await refreshAll();},"danger"));row.append(input,actions);list.appendChild(row);});if(!songs.length)list.innerHTML=`<div class="owner-empty">No songs yet.</div>`;}
  document.getElementById("ownerSongAddForm")?.addEventListener("submit",async event=>{event.preventDefault();const input=document.getElementById("ownerSongInput");const {error}=await supa.from("wedding_songs").insert({song:input.value.trim()});if(error)return alert(error.message);input.value="";await refreshAll();});

  document.getElementById("pinForm")?.addEventListener("submit",async event=>{
    event.preventDefault(); const a=document.getElementById("newPin").value.trim(),b=document.getElementById("confirmPin").value.trim(),st=document.getElementById("pinStatus");
    if(!/^\d{4}$/.test(a))return status(st,"PIN must be exactly 4 digits.","error"); if(a!==b)return status(st,"PINs do not match.","error");
    const {error}=await supa.rpc("owner_set_site_code",{p_code:a}); if(error)return status(st,error.message,"error");
    status(st,"Site PIN changed. Re-enter the new PIN on the site.","success");
    event.target.reset();
    sessionStorage.removeItem("birthdayUnlocked");
    sessionStorage.removeItem("birthdayCode");
  });

  guard();
})();
