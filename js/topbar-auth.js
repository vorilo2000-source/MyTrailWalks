// topbar-auth.js — MyTrailWalks v1.0.0
(function () {
  "use strict";

  async function initTopbarAuth() {
    const button = document.getElementById("top-auth-button");
    const dropdown = document.getElementById("top-auth-dropdown");
    const logout = document.getElementById("top-auth-logout");
    const modal = document.getElementById("auth-modal");
    const form = document.getElementById("auth-login-form");
    const status = document.getElementById("auth-login-status");

    if (!button || !dropdown || !modal || !form || !window.AuthModule) return;

    async function render(session) {
      const user = session?.user || null;
      if (!user) {
        button.textContent = "Inloggen";
        button.setAttribute("aria-expanded", "false");
        dropdown.classList.remove("is-open");
        return;
      }

      const username = user.user_metadata?.username || user.email || "Account";
      button.textContent = username;
    }

    const session = await AuthModule.getSession();
    await render(session);

    button.addEventListener("click", async () => {
      const current = await AuthModule.getSession();

      if (!current) {
        modal.hidden = false;
        document.getElementById("auth-email")?.focus();
        return;
      }

      const open = dropdown.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });

    modal.querySelectorAll("[data-auth-close]").forEach((el) => {
      el.addEventListener("click", () => {
        modal.hidden = true;
        status.textContent = "";
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "Inloggen…";

      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;
      const result = await AuthModule.login(email, password);

      if (result.error) {
        status.textContent = result.error;
        return;
      }

      status.textContent = "";
      modal.hidden = true;
      form.reset();
      await render(await AuthModule.getSession());
    });

    logout?.addEventListener("click", async () => {
      await AuthModule.logout();
      dropdown.classList.remove("is-open");
      await render(null);
      window.location.href = "/MyTrailWalks/";
    });

    AuthModule.onAuthChange((_event, nextSession) => render(nextSession));
  }

  window.initTopbarAuth = initTopbarAuth;
})();
