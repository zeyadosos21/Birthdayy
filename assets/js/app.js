(() => {
  const cfg = window.BIRTHDAY_CONFIG || {};
  const page = document.body.dataset.page || "home";
  const gate = document.getElementById("passwordGate");
  const app = document.getElementById("siteApp");
  const digits = [...document.querySelectorAll(".pin-digit")];
  const button = document.getElementById("unlockBtn");
  const status = document.getElementById("gateStatus");

  const supabaseReady = Boolean(
    cfg.supabaseUrl &&
    !cfg.supabaseUrl.startsWith("PASTE_") &&
    cfg.supabasePublishableKey &&
    !cfg.supabasePublishableKey.startsWith("PASTE_") &&
    window.supabase
  );

  window.BIRTHDAY_SUPABASE_READY = supabaseReady;
  window.birthdaySupabase = supabaseReady
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey)
    : null;

  document.querySelectorAll(`[data-nav="${page}"]`).forEach(link => link.classList.add("active"));

  const timeout = (promise, ms = 8000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), ms)
      )
    ]);

  function currentPin() {
    return digits.map(input => input.value).join("");
  }

  function clearPin() {
    digits.forEach(input => { input.value = ""; });
    digits[0]?.focus();
  }

  function clearUnlock() {
    sessionStorage.removeItem("birthdayUnlocked");
    sessionStorage.removeItem("birthdayCode");
    document.documentElement.classList.remove("session-unlocked");
  }

  function showGate(message = "") {
    document.documentElement.classList.remove("session-unlocked");
    gate?.classList.remove("hidden");
    app?.classList.add("hidden");
    if (status) status.textContent = message;
    setTimeout(() => digits[0]?.focus(), 60);
  }

  function showSite(code) {
    sessionStorage.setItem("birthdayUnlocked", "yes");
    sessionStorage.setItem("birthdayCode", code);
    document.documentElement.classList.add("session-unlocked");
    gate?.classList.add("hidden");
    app?.classList.remove("hidden");
    window.dispatchEvent(new CustomEvent("birthday:unlocked", { detail: { code } }));
  }

  async function verifyCode(code) {
    if (!supabaseReady) throw new Error("Supabase unavailable");
    const result = await timeout(
      window.birthdaySupabase.rpc("verify_site_code", { p_code: code }),
      8000
    );
    if (result.error) throw result.error;
    return result.data === true;
  }

  async function unlock() {
    const code = currentPin();

    if (code.length !== 4) {
      if (status) status.textContent = "Enter all four digits.";
      digits.find(input => !input.value)?.focus();
      return;
    }

    if (!supabaseReady) {
      if (status) status.textContent = "Connection unavailable. Refresh and try again.";
      return;
    }

    button.disabled = true;
    if (status) status.textContent = "Checking...";

    try {
      const valid = await verifyCode(code);

      if (!valid) {
        gate?.querySelector(".lock-card")?.classList.add("shake");
        setTimeout(() => gate?.querySelector(".lock-card")?.classList.remove("shake"), 450);
        if (status) status.textContent = "Wrong code. Access denied.";
        clearPin();
        return;
      }

      showSite(code);
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent =
          error?.message === "Connection timeout"
            ? "Connection is slow. Try again."
            : "Could not verify the code. Try again.";
      }
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
      const pasted = (event.clipboardData?.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, 4);

      pasted.split("").forEach((char, i) => {
        if (digits[i]) digits[i].value = char;
      });

      if (pasted.length) digits[Math.min(pasted.length, 4) - 1]?.focus();
    });
  });

  button?.addEventListener("click", unlock);

  function restoreSession() {
    const unlocked = sessionStorage.getItem("birthdayUnlocked") === "yes";
    const savedCode = sessionStorage.getItem("birthdayCode") || "";

    // IMPORTANT:
    // Once a PIN was verified, navigation inside this tab does NOT call Supabase
    // again. This prevents loading hangs and the password screen flashing again.
    if (unlocked && /^\d{4}$/.test(savedCode)) {
      showSite(savedCode);
      return;
    }

    clearUnlock();

    if (page !== "home") {
      window.location.replace("index.html");
      return;
    }

    showGate(
      supabaseReady
        ? ""
        : "Connection unavailable. Refresh and try again."
    );
  }

  window.birthdayGetCode = () => sessionStorage.getItem("birthdayCode") || "";

  window.birthdayLockSite = () => {
    clearUnlock();
    window.location.href = "index.html";
  };

  restoreSession();
})();