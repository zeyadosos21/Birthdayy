(() => {
  const cfg = window.BIRTHDAY_CONFIG || {};
  const supabaseReady = Boolean(
    cfg.supabaseUrl &&
    !cfg.supabaseUrl.startsWith("PASTE_") &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseAnonKey.startsWith("PASTE_") &&
    window.supabase
  );

  window.BIRTHDAY_SUPABASE_READY = supabaseReady;
  window.birthdaySupabase = supabaseReady
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  const page = document.body.dataset.page || "home";

  // PASSWORD GATE:
  // The lock screen is the only entrance. If somebody tries to open
  // Gallery / Memories / Notes directly before unlocking, send them home.
  if (page !== "home" && sessionStorage.getItem("birthdayUnlocked") !== "yes") {
    window.location.replace("index.html");
    return;
  }
  document.querySelectorAll(`[data-nav="${page}"]`).forEach(link => link.classList.add("active"));

  const gate = document.getElementById("passwordGate");
  const app = document.getElementById("siteApp");
  const digits = [...document.querySelectorAll(".pin-digit")];
  const button = document.getElementById("unlockBtn");
  const status = document.getElementById("gateStatus");

  const sha256 = async value => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  };

  async function verifyCode(code) {
    if (supabaseReady) {
      const { data, error } = await window.birthdaySupabase.rpc("verify_site_code", { p_code: code });
      if (error) throw error;
      return data === true;
    }
    return (await sha256(code)) === cfg.fallbackPasswordHash;
  }

  function currentPin() {
    return digits.map(input => input.value).join("");
  }

  function clearPin() {
    digits.forEach(input => { input.value = ""; });
    digits[0]?.focus();
  }

  function showSite(code) {
    sessionStorage.setItem("birthdayUnlocked", "yes");
    sessionStorage.setItem("birthdayCode", code);
    gate?.classList.add("hidden");
    app?.classList.remove("hidden");
    window.dispatchEvent(new CustomEvent("birthday:unlocked", { detail: { code } }));
  }

  async function unlock() {
    const code = currentPin();
    if (code.length !== 4) {
      if (status) status.textContent = "Enter all four digits.";
      digits.find(input => !input.value)?.focus();
      return;
    }

    button.disabled = true;
    if (status) status.textContent = "";

    try {
      if (!(await verifyCode(code))) {
        gate?.querySelector(".lock-card")?.classList.add("shake");
        setTimeout(() => gate?.querySelector(".lock-card")?.classList.remove("shake"), 450);
        if (status) status.textContent = "Wrong code. Access denied.";
        clearPin();
        return;
      }
      showSite(code);
    } catch (error) {
      console.error(error);
      if (status) status.textContent = "Couldn’t verify the code right now.";
    } finally {
      button.disabled = false;
    }
  }

  digits.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(-1);
      if (input.value && index < digits.length - 1) digits[index + 1].focus();
      if (currentPin().length === 4) button?.focus();
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Backspace" && !input.value && index > 0) digits[index - 1].focus();
      if (event.key === "ArrowLeft" && index > 0) digits[index - 1].focus();
      if (event.key === "ArrowRight" && index < digits.length - 1) digits[index + 1].focus();
      if (event.key === "Enter") unlock();
    });

    input.addEventListener("paste", event => {
      event.preventDefault();
      const pasted = (event.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 4);
      if (!pasted) return;
      pasted.split("").forEach((char, i) => { if (digits[i]) digits[i].value = char; });
      digits[Math.min(pasted.length, 4) - 1]?.focus();
    });
  });

  button?.addEventListener("click", unlock);

  if (sessionStorage.getItem("birthdayUnlocked") === "yes") {
    gate?.classList.add("hidden");
    app?.classList.remove("hidden");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("birthday:unlocked", {
        detail: { code: sessionStorage.getItem("birthdayCode") || "" }
      }));
    }, 0);
  } else {
    setTimeout(() => digits[0]?.focus(), 100);
  }

  window.birthdayGetCode = () => sessionStorage.getItem("birthdayCode") || "";
})();
