// =============================================================================
// auth.js — Supabase Authentication Module
// MyTrailWalks v1.1.0
// -----------------------------------------------------------------------------
// Changelog v1.1.0:
// - getProfile() haalt nu `role` op i.p.v. `is_admin` (tabel gewijzigd)
// - window._supabase geëxporteerd voor analytics.js
// - redirectTo aangepast naar correcte GitHub Pages URL
//
// Dependencies: Supabase JS SDK (geladen via CDN vóór dit script)
// Load order:   auth.js → topbar-auth.js → analytics.js → app.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuratie
  // ---------------------------------------------------------------------------
  var SUPABASE_URL  = "https://bzcevvfesushlorymszd.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Y2V2dmZlc3VzaGxvcnltc3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTQ4NjIsImV4cCI6MjA5NzU5MDg2Mn0.0uHB4KdVftiHnKWeB0T2FArbNtjcZ51fvQz_PDBy72Y";

  // ---------------------------------------------------------------------------
  // Supabase client — ook beschikbaar als window._supabase voor analytics.js
  // ---------------------------------------------------------------------------
  var _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  window._supabase = _client;

  // ---------------------------------------------------------------------------
  // _errMsg(error)
  // ---------------------------------------------------------------------------
  function _errMsg(error) {
    if (!error) return null;
    var msg = error.message || "Onbekende fout";

    if (msg.includes("Invalid login credentials"))
      return "E-mailadres of wachtwoord onjuist.";
    if (msg.includes("Email not confirmed"))
      return "Bevestig eerst je e-mailadres via de ontvangen mail.";
    if (msg.includes("User already registered"))
      return "Dit e-mailadres is al in gebruik.";
    if (msg.includes("Password should be"))
      return "Wachtwoord moet minimaal 6 tekens bevatten.";
    if (msg.includes("Email rate limit exceeded"))
      return "Te veel pogingen. Probeer het later opnieuw.";
    return msg;
  }

  // ---------------------------------------------------------------------------
  // register(email, password, username)
  // ---------------------------------------------------------------------------
  async function register(email, password, username) {
    if (!email || !password || !username)
      return { user: null, error: "Vul alle velden in." };
    if (username.trim().length < 2)
      return { user: null, error: "Gebruikersnaam moet minimaal 2 tekens bevatten." };

    var result = await _client.auth.signUp({
      email: email,
      password: password,
      options: { data: { username: username.trim() } },
    });

    if (result.error) return { user: null, error: _errMsg(result.error) };
    return { user: result.data.user, error: null };
  }

  // ---------------------------------------------------------------------------
  // login(email, password)
  // ---------------------------------------------------------------------------
  async function login(email, password) {
    if (!email || !password)
      return { user: null, error: "Vul e-mailadres en wachtwoord in." };

    var result = await _client.auth.signInWithPassword({ email, password });

    if (result.error) return { user: null, error: _errMsg(result.error) };
    return { user: result.data.user, error: null };
  }

  // ---------------------------------------------------------------------------
  // logout()
  // ---------------------------------------------------------------------------
  async function logout() {
    var result = await _client.auth.signOut();
    return { error: _errMsg(result.error) };
  }

  // ---------------------------------------------------------------------------
  // resetPassword(email)
  // ---------------------------------------------------------------------------
  async function resetPassword(email) {
    if (!email) return { error: "Vul je e-mailadres in." };

    var result = await _client.auth.resetPasswordForEmail(email, {
      redirectTo: "https://vorilo2000-source.github.io/MyTrailWalks/reset.html",
    });

    if (result.error) return { error: _errMsg(result.error) };
    return { error: null };
  }

  // ---------------------------------------------------------------------------
  // updatePassword(newPassword)
  // ---------------------------------------------------------------------------
  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6)
      return { error: "Wachtwoord moet minimaal 6 tekens bevatten." };

    var result = await _client.auth.updateUser({ password: newPassword });
    if (result.error) return { error: _errMsg(result.error) };
    return { error: null };
  }

  // ---------------------------------------------------------------------------
  // getSession()
  // ---------------------------------------------------------------------------
  async function getSession() {
    var result = await _client.auth.getSession();
    return result.data && result.data.session ? result.data.session : null;
  }

  // ---------------------------------------------------------------------------
  // getUser()
  // ---------------------------------------------------------------------------
  async function getUser() {
    var session = await getSession();
    return session ? session.user : null;
  }

  // ---------------------------------------------------------------------------
  // getProfile()
  // Haalt username en role op uit de profiles tabel.
  // ---------------------------------------------------------------------------
  async function getProfile() {
    var user = await getUser();
    if (!user) return { profile: null, error: "Niet ingelogd." };

    var result = await _client
      .from("profiles")
      .select("username, role")
      .eq("id", user.id)
      .single();

    if (result.error) return { profile: null, error: _errMsg(result.error) };
    return { profile: result.data, error: null };
  }

  // ---------------------------------------------------------------------------
  // onAuthChange(callback)
  // ---------------------------------------------------------------------------
  function onAuthChange(callback) {
    _client.auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
  }

  // ---------------------------------------------------------------------------
  // getClient()
  // ---------------------------------------------------------------------------
  function getClient() {
    return _client;
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.AuthModule = {
    register,
    login,
    logout,
    resetPassword,
    updatePassword,
    getSession,
    getUser,
    getProfile,
    onAuthChange,
    getClient,
  };

})();
