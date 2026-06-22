// =============================================================================
// topbar-auth.js — TopBar Auth Modal & Admin Dropdown
// MyTrailWalks v1.3.0
// -----------------------------------------------------------------------------
// Changelog v1.3.0:
// - Luistert naar i18next languageChanged event → herrendert topbar knop
// Changelog v1.2.0:
// - Modal wordt pas gebouwd bij openModal() zodat i18next klaar is
// Changelog v1.1.0:
// - Alle hardcoded teksten vervangen door i18next.t() sleutels
//
// Dependencies: Supabase SDK, auth.js, i18next (geladen via i18n.js)
// Load order:   auth.js → topbar-auth.js → app.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  // Huidige sessiestate bijhouden voor herrender bij taalwissel
  var _currentUsername = null;
  var _currentRole     = null;

  // ---------------------------------------------------------------------------
  // _t(key) — veilige i18next wrapper
  // ---------------------------------------------------------------------------
  function _t(key) {
    if (window.i18next && window.i18next.isInitialized) {
      return window.i18next.t(key);
    }
    return key.split(":").pop().split(".").pop().replace(/_/g, " ");
  }

  // ---------------------------------------------------------------------------
  // _injectModal()
  // ---------------------------------------------------------------------------
  function _injectModal() {
    if (document.getElementById("auth-modal-root")) return;

    const root = document.createElement("div");
    root.id = "auth-modal-root";
    root.innerHTML = `
      <div id="auth-modal-backdrop" onclick="TopBarAuth.closeModal()"></div>
      <div id="auth-modal-box" role="dialog" aria-modal="true" aria-label="${_t('auth:login')}">
        <button id="auth-modal-close" onclick="TopBarAuth.closeModal()" aria-label="${_t('auth:close')}">&times;</button>
        <div class="auth-tabs" id="auth-tabs">
          <button class="auth-tab active" id="tab-btn-login"    onclick="TopBarAuth.switchTab('login')">${_t('auth:login')}</button>
          <button class="auth-tab"        id="tab-btn-register" onclick="TopBarAuth.switchTab('register')">${_t('auth:register')}</button>
        </div>

        <!-- LOGIN -->
        <div class="auth-form-section active" id="auth-section-login">
          <div class="auth-field">
            <label for="auth-login-email">${_t('auth:email')}</label>
            <input type="email" id="auth-login-email" placeholder="${_t('auth:email_placeholder')}" autocomplete="email">
          </div>
          <div class="auth-field">
            <label for="auth-login-password">${_t('auth:password')}</label>
            <input type="password" id="auth-login-password" placeholder="${_t('auth:password_placeholder')}" autocomplete="current-password">
          </div>
          <button class="auth-btn-primary" id="auth-btn-login" onclick="TopBarAuth.doLogin()">${_t('auth:login')}</button>
          <p class="auth-forgot-link">
            <a href="#" onclick="TopBarAuth.switchTab('forgot'); return false;">${_t('auth:forgot_password')}</a>
          </p>
          <div class="auth-msg" id="auth-msg-login"></div>
        </div>

        <!-- REGISTRATIE -->
        <div class="auth-form-section" id="auth-section-register">
          <div class="auth-field">
            <label for="auth-reg-username">${_t('auth:username')}</label>
            <input type="text" id="auth-reg-username" placeholder="${_t('auth:username_placeholder')}" maxlength="32" autocomplete="nickname">
          </div>
          <div class="auth-field">
            <label for="auth-reg-email">${_t('auth:email')}</label>
            <input type="email" id="auth-reg-email" placeholder="${_t('auth:email_placeholder')}" autocomplete="email">
          </div>
          <div class="auth-field">
            <label for="auth-reg-password">${_t('auth:password')}</label>
            <input type="password" id="auth-reg-password" placeholder="${_t('auth:password_new_placeholder')}" autocomplete="new-password">
          </div>
          <div class="auth-field">
            <label for="auth-reg-password2">${_t('auth:password_repeat')}</label>
            <input type="password" id="auth-reg-password2" placeholder="${_t('auth:password_repeat_placeholder')}" autocomplete="new-password">
          </div>
          <button class="auth-btn-primary" id="auth-btn-register" onclick="TopBarAuth.doRegister()">${_t('auth:register')}</button>
          <div class="auth-msg" id="auth-msg-register"></div>
        </div>

        <!-- WACHTWOORD VERGETEN -->
        <div class="auth-form-section" id="auth-section-forgot">
          <p class="auth-back-link">
            <a href="#" onclick="TopBarAuth.switchTab('login'); return false;">${_t('auth:back_to_login')}</a>
          </p>
          <p class="auth-forgot-intro">${_t('auth:forgot_intro')}</p>
          <div class="auth-field">
            <label for="auth-forgot-email">${_t('auth:email')}</label>
            <input type="email" id="auth-forgot-email" placeholder="${_t('auth:email_placeholder')}" autocomplete="email">
          </div>
          <button class="auth-btn-primary" id="auth-btn-forgot" onclick="TopBarAuth.doForgotPassword()">${_t('auth:send_reset_link')}</button>
          <div class="auth-msg" id="auth-msg-forgot"></div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    _injectStyles();
  }

  // ---------------------------------------------------------------------------
  // _injectStyles()
  // ---------------------------------------------------------------------------
  function _injectStyles() {
    if (document.getElementById("auth-modal-styles")) return;

    const style = document.createElement("style");
    style.id = "auth-modal-styles";
    style.textContent = `
      #auth-modal-backdrop {
        display: none; position: fixed; inset: 0;
        background: rgba(43, 41, 38, 0.6); z-index: 1000;
      }
      #auth-modal-box {
        display: none; position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: #F6F1E7; border-radius: 8px;
        padding: 32px 36px 28px; width: 100%; max-width: 420px;
        z-index: 1001; box-shadow: 0 8px 40px rgba(43,41,38,0.18);
        font-family: 'Inter', system-ui, sans-serif;
      }
      #auth-modal-root.open #auth-modal-backdrop,
      #auth-modal-root.open #auth-modal-box { display: block; }

      #auth-modal-close {
        position: absolute; top: 14px; right: 18px;
        background: none; border: none; font-size: 1.4rem;
        cursor: pointer; color: #5C5752; line-height: 1;
      }
      #auth-modal-close:hover { color: #2B2926; }

      .auth-tabs {
        display: flex; border-bottom: 1px solid #DDD4C2;
        margin-bottom: 24px; gap: 0;
      }
      .auth-tab {
        padding: 8px 20px; border: none; background: none;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.88rem; font-weight: 600; cursor: pointer;
        color: #5C5752; border-bottom: 2px solid transparent;
        margin-bottom: -1px; transition: color 0.15s, border-color 0.15s;
      }
      .auth-tab.active { color: #2C4A3B; border-bottom-color: #2C4A3B; }

      .auth-form-section        { display: none; }
      .auth-form-section.active { display: block; }

      .auth-field { margin-bottom: 16px; }
      .auth-field label {
        display: block; font-size: 0.82rem; font-weight: 600;
        margin-bottom: 5px; color: #2B2926;
        text-transform: uppercase; letter-spacing: 0.04em;
      }
      .auth-field input {
        width: 100%; padding: 9px 12px; font-size: 0.92rem;
        border: 1px solid #DDD4C2; border-radius: 6px;
        box-sizing: border-box; background: #fff;
        color: #2B2926; font-family: 'Inter', system-ui, sans-serif;
        transition: border-color 0.15s;
      }
      .auth-field input:focus {
        outline: none; border-color: #2C4A3B;
        box-shadow: 0 0 0 3px rgba(44,74,59,0.12);
      }

      .auth-btn-primary {
        width: 100%; padding: 10px; font-size: 0.9rem; font-weight: 600;
        background: #2C4A3B; color: #fff; border: none;
        border-radius: 6px; cursor: pointer; margin-top: 4px;
        font-family: 'Inter', system-ui, sans-serif;
        transition: background 0.15s;
      }
      .auth-btn-primary:hover    { background: #1C3328; }
      .auth-btn-primary:disabled { background: #7a9e8e; cursor: default; }

      .auth-msg {
        margin-top: 12px; padding: 10px 14px; border-radius: 6px;
        font-size: 0.85rem; display: none; line-height: 1.5;
      }
      .auth-msg.error   { background: #fde8e8; color: #8b1c1c; display: block; border: 1px solid #f5c6c6; }
      .auth-msg.success { background: #e6f4ea; color: #1a5c2a; display: block; border: 1px solid #b7dfbf; }

      .auth-forgot-link { margin-top: 12px; font-size: 0.82rem; text-align: right; }
      .auth-forgot-link a, .auth-back-link a { color: #4C7A89; text-decoration: none; }
      .auth-forgot-link a:hover, .auth-back-link a:hover { text-decoration: underline; }
      .auth-back-link { font-size: 0.85rem; margin-bottom: 14px; }
      .auth-forgot-intro {
        font-size: 0.85rem; color: #5C5752;
        margin-bottom: 16px; line-height: 1.6;
      }

      #top-auth { display: flex; align-items: center; position: relative; }

      .top-auth-login {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.85rem; font-weight: 500;
        color: var(--color-cream, #F6F1E7);
        background: none; border: 1px solid rgba(246,241,231,0.35);
        border-radius: 5px; padding: 5px 14px;
        cursor: pointer; transition: background 0.15s, border-color 0.15s;
        text-decoration: none;
      }
      .top-auth-login:hover {
        background: rgba(246,241,231,0.12);
        border-color: rgba(246,241,231,0.7);
        text-decoration: none;
      }

      .top-user-wrapper { position: relative; display: inline-block; }

      .top-user-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 5px 12px; border-radius: 5px;
        background: rgba(246,241,231,0.1);
        border: 1px solid rgba(246,241,231,0.3);
        cursor: pointer; font-size: 0.85rem; font-weight: 500;
        color: var(--color-cream, #F6F1E7);
        font-family: 'Inter', system-ui, sans-serif;
        transition: background 0.15s, border-color 0.15s;
        white-space: nowrap;
      }
      .top-user-btn:hover,
      .top-user-btn.open {
        background: rgba(246,241,231,0.18);
        border-color: rgba(246,241,231,0.6);
      }

      .top-user-chevron {
        font-size: 0.6rem; color: rgba(246,241,231,0.6);
        transition: transform 0.2s; display: inline-block;
      }
      .top-user-btn.open .top-user-chevron { transform: rotate(180deg); }

      .top-user-dropdown {
        display: none;
        position: absolute; top: calc(100% + 8px);
        right: 0; left: auto;
        min-width: 200px; background: #fff;
        border: 1px solid #DDD4C2; border-radius: 8px;
        box-shadow: 0 4px 20px rgba(43,41,38,0.14);
        z-index: 2000; overflow: hidden; padding: 4px 0;
      }
      .top-user-wrapper.open .top-user-dropdown { display: block; }

      .top-user-dropdown-header {
        padding: 10px 16px 8px;
        font-size: 0.75rem; font-weight: 600;
        color: #5C5752; text-transform: uppercase;
        letter-spacing: 0.06em;
        border-bottom: 1px solid #DDD4C2; margin-bottom: 4px;
      }

      .top-user-dropdown a,
      .top-user-dropdown button {
        display: flex; align-items: center; gap: 9px;
        width: 100%; padding: 9px 16px;
        font-size: 0.88rem; color: #2B2926;
        background: none; border: none; cursor: pointer;
        text-align: left; text-decoration: none;
        font-family: 'Inter', system-ui, sans-serif;
        transition: background 0.1s; box-sizing: border-box;
      }
      .top-user-dropdown a:hover,
      .top-user-dropdown button:hover {
        background: #F6F1E7; color: #1C3328;
        text-decoration: none;
      }

      .top-user-dropdown .dropdown-divider {
        border: none; border-top: 1px solid #DDD4C2; margin: 4px 0;
      }
      .top-user-dropdown .btn-logout { color: #B5503D; }
      .top-user-dropdown .btn-logout:hover { background: #fdf0ee; color: #8b3a2b; }

      .dropdown-section-label {
        padding: 6px 16px 4px;
        font-size: 0.7rem; font-weight: 600;
        color: #8C6A4F; text-transform: uppercase;
        letter-spacing: 0.08em;
      }
    `;

    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // _fixDropdownPosition(dropdownEl)
  // ---------------------------------------------------------------------------
  function _fixDropdownPosition(dropdownEl) {
    dropdownEl.classList.remove("align-left");
    requestAnimationFrame(function () {
      var rect = dropdownEl.getBoundingClientRect();
      if (rect.left < 8) {
        dropdownEl.style.right = "auto";
        dropdownEl.style.left  = "0";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // _renderTopBar(username, role)
  // ---------------------------------------------------------------------------
  function _renderTopBar(username, role) {
    // Sla op voor herrender bij taalwissel
    _currentUsername = username;
    _currentRole     = role;

    const slot = document.getElementById("top-auth");
    if (!slot) return;

    const isAdmin   = role === "admin";
    const isCreator = role === "creator" || isAdmin;

    if (username) {
      const adminItems = isCreator ? `
        <div class="dropdown-section-label">${_t('auth:admin_section')}</div>
        <a href="creator.html" role="menuitem">✦ ${_t('auth:route_creator')}</a>
        <hr class="dropdown-divider">
      ` : "";

      slot.innerHTML = `
        <div class="top-user-wrapper" id="top-user-wrapper">
          <button class="top-user-btn" id="top-user-btn" aria-haspopup="true" aria-expanded="false">
            <span>👤</span>
            <span>${_escHtml(username)}</span>
            <span class="top-user-chevron">▼</span>
          </button>
          <div class="top-user-dropdown" role="menu" id="top-user-dropdown">
            <div class="top-user-dropdown-header">${_escHtml(username)}</div>
            ${adminItems}
            <button class="btn-logout" id="btn-dropdown-logout" role="menuitem">🚪 ${_t('auth:logout')}</button>
          </div>
        </div>
      `;

      const wrapper  = document.getElementById("top-user-wrapper");
      const btn      = document.getElementById("top-user-btn");
      const dropdown = document.getElementById("top-user-dropdown");

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = wrapper.classList.toggle("open");
        btn.classList.toggle("open", isOpen);
        btn.setAttribute("aria-expanded", isOpen);
        if (isOpen) _fixDropdownPosition(dropdown);
      });

      document.getElementById("btn-dropdown-logout").addEventListener("click", async () => {
        await AuthModule.logout();
      });

    } else {
      slot.innerHTML = `
        <button class="top-auth-login" onclick="TopBarAuth.openModal()">${_t('auth:login')}</button>
      `;
    }
  }

  // ---------------------------------------------------------------------------
  // _escHtml(str)
  // ---------------------------------------------------------------------------
  function _escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------------------------------------------------------------------------
  // _closeUserDropdown()
  // ---------------------------------------------------------------------------
  function _closeUserDropdown() {
    const wrapper = document.getElementById("top-user-wrapper");
    const btn     = document.getElementById("top-user-btn");
    if (!wrapper) return;
    wrapper.classList.remove("open");
    if (btn) { btn.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  }

  // ---------------------------------------------------------------------------
  // _getUsernameFromSession(session)
  // ---------------------------------------------------------------------------
  async function _getUsernameFromSession(session) {
    if (!session) return null;
    try {
      const { profile } = await AuthModule.getProfile();
      if (profile && profile.username) return profile.username;
    } catch (e) { /* profiel bestaat nog niet */ }
    const email = session.user.email || "";
    return email.split("@")[0] || _t('auth:fallback_user');
  }

  // ---------------------------------------------------------------------------
  // Modal functies
  // ---------------------------------------------------------------------------
  function openModal() {
    // Verwijder bestaande modal zodat hij opnieuw gebouwd wordt met actuele i18n vertalingen
    const existing = document.getElementById("auth-modal-root");
    if (existing) existing.remove();
    _injectModal();
    switchTab("login");
    document.getElementById("auth-modal-root").classList.add("open");
    setTimeout(() => {
      const f = document.getElementById("auth-login-email");
      if (f) f.focus();
    }, 50);
  }

  function closeModal() {
    const root = document.getElementById("auth-modal-root");
    if (root) root.classList.remove("open");
    ["auth-msg-login", "auth-msg-register", "auth-msg-forgot"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ""; el.className = "auth-msg"; }
    });
  }

  function switchTab(tab) {
    ["login", "register", "forgot"].forEach((name) => {
      const s = document.getElementById("auth-section-" + name);
      if (s) s.classList.remove("active");
    });
    const target = document.getElementById("auth-section-" + tab);
    if (target) target.classList.add("active");
    const tabs = document.getElementById("auth-tabs");
    if (tabs) tabs.style.display = tab === "forgot" ? "none" : "flex";
    const lb = document.getElementById("tab-btn-login");
    const rb = document.getElementById("tab-btn-register");
    if (lb) lb.classList.toggle("active", tab === "login");
    if (rb) rb.classList.toggle("active", tab === "register");
  }

  function _showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className   = "auth-msg " + type;
  }

  async function doLogin() {
    const email    = document.getElementById("auth-login-email").value.trim();
    const password = document.getElementById("auth-login-password").value;
    const btn      = document.getElementById("auth-btn-login");
    btn.disabled = true; btn.textContent = _t('auth:busy');
    const { user, error } = await AuthModule.login(email, password);
    btn.disabled = false; btn.textContent = _t('auth:login');
    if (error) { _showMsg("auth-msg-login", error, "error"); return; }
    _showMsg("auth-msg-login", _t('auth:logged_in'), "success");
    setTimeout(() => {
      closeModal();
      // Verwijder modal volledig uit DOM na inloggen
      const root = document.getElementById("auth-modal-root");
      if (root) root.remove();
    }, 800);
  }

  async function doRegister() {
    const username  = document.getElementById("auth-reg-username").value.trim();
    const email     = document.getElementById("auth-reg-email").value.trim();
    const password  = document.getElementById("auth-reg-password").value;
    const password2 = document.getElementById("auth-reg-password2").value;
    const btn       = document.getElementById("auth-btn-register");
    if (password !== password2) {
      _showMsg("auth-msg-register", _t('auth:passwords_no_match'), "error");
      return;
    }
    btn.disabled = true; btn.textContent = _t('auth:busy');
    const { user, error } = await AuthModule.register(email, password, username);
    btn.disabled = false; btn.textContent = _t('auth:register');
    if (error) { _showMsg("auth-msg-register", error, "error"); return; }
    switchTab("login");
    _showMsg("auth-msg-login", _t('auth:confirm_email'), "success");
  }

  async function doForgotPassword() {
    const email = document.getElementById("auth-forgot-email").value.trim();
    const btn   = document.getElementById("auth-btn-forgot");
    btn.disabled = true; btn.textContent = _t('auth:busy');
    const { error } = await AuthModule.resetPassword(email);
    btn.disabled = false; btn.textContent = _t('auth:send_reset_link');
    if (error) { _showMsg("auth-msg-forgot", error, "error"); return; }
    _showMsg("auth-msg-forgot", _t('auth:reset_sent'), "success");
  }

  // ---------------------------------------------------------------------------
  // init()
  // ---------------------------------------------------------------------------
  async function init() {
    // Modal NIET hier injecteren — i18next is nog niet klaar.
    // _injectModal() wordt aangeroepen bij openModal(), dan is i18next geïnitialiseerd.

    const session = await AuthModule.getSession();

    if (session) {
      const username = await _getUsernameFromSession(session);
      let role = "gast";
      try {
        const { profile } = await AuthModule.getProfile();
        if (profile && profile.role) role = profile.role;
      } catch (e) { /* geen profiel */ }
      _renderTopBar(username, role);
    } else {
      _renderTopBar(null, null);
    }

    AuthModule.onAuthChange(async (event, session) => {
      if (session) {
        const username = await _getUsernameFromSession(session);
        let role = "gast";
        try {
          const { profile } = await AuthModule.getProfile();
          if (profile && profile.role) role = profile.role;
        } catch (e) { /* geen profiel */ }
        _renderTopBar(username, role);
      } else {
        _renderTopBar(null, null);
      }
    });

    // Herrender topbar knop bij taalwissel (v1.3.0)
    if (window.i18next) {
      window.i18next.on("languageChanged", function () {
        _renderTopBar(_currentUsername, _currentRole);
      });
    }

    document.addEventListener("click", () => _closeUserDropdown());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { _closeUserDropdown(); closeModal(); }
    });
  }

  // Auto-init — wacht op i18nReady zodat vertalingen gegarandeerd beschikbaar zijn
  function startInit() {
    const ready = window.i18nReady || Promise.resolve();
    ready.then(init).catch(init); // init ook bij fout — pagina blijft werken
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startInit);
  } else {
    startInit();
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.TopBarAuth = {
    openModal,
    closeModal,
    switchTab,
    doLogin,
    doRegister,
    doForgotPassword,
  };

})();
