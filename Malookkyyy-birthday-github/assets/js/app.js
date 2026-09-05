(() => {
  const cfg = window.BIRTHDAY_CONFIG;
  const SUPABASE_READY = cfg.supabaseUrl && !cfg.supabaseUrl.startsWith("PASTE_") && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.startsWith("PASTE_") && window.supabase;
  window.BIRTHDAY_SUPABASE_READY = !!SUPABASE_READY;
  window.birthdaySupabase = SUPABASE_READY ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const page = document.body.dataset.page || "home";
  document.querySelectorAll(`[data-nav="${page}"]`).forEach(a => a.classList.add("active"));
  document.querySelectorAll("[data-name]").forEach(el => el.textContent = cfg.name);
  document.querySelectorAll("[data-title]").forEach(el => el.textContent = cfg.title);

  const gate = document.getElementById("passwordGate");
  const app = document.getElementById("siteApp");
  const input = document.getElementById("sitePassword");
  const status = document.getElementById("gateStatus");
  const button = document.getElementById("unlockBtn");

  const sha256 = async text => {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
  };

  async function verifyCode(code) {
    if (SUPABASE_READY) {
      const { data, error } = await window.birthdaySupabase.rpc("verify_site_code", { p_code: code });
      if (error) throw error;
      return data === true;
    }
    return (await sha256(code)) === cfg.fallbackPasswordHash;
  }

  async function unlock() {
    const code = input.value.trim();
    if (!code) return;
    button.disabled = true;
    status.textContent = "";
    try {
      const ok = await verifyCode(code);
      if (!ok) {
        status.textContent = "Wrong password 💔";
        input.select();
        return;
      }
      sessionStorage.setItem("birthdayUnlocked", "yes");
      sessionStorage.setItem("birthdayCode", code);
      gate.classList.add("hidden");
      app.classList.remove("hidden");
      window.dispatchEvent(new CustomEvent("birthday:unlocked", { detail: { code } }));
    } catch (e) {
      console.error(e);
      status.textContent = "Couldn’t verify right now. Check the Supabase setup.";
    } finally {
      button.disabled = false;
    }
  }

  if (sessionStorage.getItem("birthdayUnlocked") === "yes") {
    gate.classList.add("hidden");
    app.classList.remove("hidden");
    setTimeout(() => window.dispatchEvent(new CustomEvent("birthday:unlocked", { detail: { code: sessionStorage.getItem("birthdayCode") || "" } })), 0);
  }
  button?.addEventListener("click", unlock);
  input?.addEventListener("keydown", e => { if (e.key === "Enter") unlock(); });

  window.birthdayGetCode = () => sessionStorage.getItem("birthdayCode") || "";
})();
