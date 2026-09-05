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

  let categories = [], media = [], memories = [], todos = [], songs = [];

  const status = (el, text, type = "") => { if (el) { el.textContent = text; el.className = `form-status${type ? ` ${type}` : ""}`; } };
  const escapeName = name => name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";

  function setTab(name) {
    tabs.forEach(btn => btn.classList.toggle("active", btn.dataset.ownerTab === name));
    panels.forEach(panel => panel.classList.toggle("hidden", panel.dataset.ownerPanel !== name));
  }
  tabs.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.ownerTab)));

  async function isOwner() {
    const { data: sessionData } = await supa.auth.getSession();
    if (!sessionData.session) return false;
    const { data, error } = await supa.rpc("is_birthday_owner");
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
    if (await isOwner()) {
      loading.classList.add("hidden"); loginScreen.classList.add("hidden"); dashboard.classList.remove("hidden");
      await refreshAll();
    } else {
      loading.classList.add("hidden"); dashboard.classList.add("hidden"); loginScreen.classList.remove("hidden");
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

  function renderMedia() {
    const list=document.getElementById("ownerMediaList"); if(!list)return; list.innerHTML="";
    media.forEach((m,index)=>{
      const row=document.createElement("div"); row.className="owner-media-row";
      const preview=document.createElement(m.media_type==="video"?"video":"img"); preview.src=publicUrl(m.storage_path); if(m.media_type==="video"){preview.muted=true;preview.playsInline=true;preview.preload="metadata";}
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
  document.getElementById("mediaUploadForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const file=document.getElementById("mediaFile").files[0], categoryId=Number(document.getElementById("mediaCategory").value), caption=document.getElementById("mediaCaption").value.trim();
    const st=document.getElementById("mediaUploadStatus"); if(!file)return status(st,"Choose a file.","error");
    const type=file.type.startsWith("video/")?"video":file.type.startsWith("image/")?"image":""; if(!type)return status(st,"Use an image or video file.","error");
    status(st,"Uploading\u2026");
    // ADD/UPLOAD PHOTOS + VIDEOS: this path is what gets stored in Supabase Storage.
    const path=`${Date.now()}-${crypto.randomUUID()}-${escapeName(file.name)}`;
    const up=await supa.storage.from("gallery-media").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
    if(up.error)return status(st,up.error.message,"error");
    const max=Math.max(0,...media.map(m=>m.sort_order||0));
    const ins=await supa.from("gallery_media").insert({category_id:categoryId,media_type:type,storage_path:path,caption,sort_order:max+10});
    if(ins.error){await supa.storage.from("gallery-media").remove([path]);return status(st,ins.error.message,"error");}
    event.target.reset(); status(st,"Uploaded.","success"); await refreshAll();
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
    status(st,"Site PIN changed. Visitors must use the new code.","success"); event.target.reset();
  });

  guard();
})();
