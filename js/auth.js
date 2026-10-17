// =============================================================================
// auth.js — MyTrailWalks Supabase Authentication
// v1.0.0
// =============================================================================
(function () {
  "use strict";

  const SUPABASE_URL = "https://bzcevvfesushlorymszd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5QbW5oWDnlSr9vBVD9QIRg_GFX-6aPV";

  if (!window.supabase) {
    throw new Error("Supabase JS SDK is niet geladen.");
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  async function login(email, password) {
    const result = await client.auth.signInWithPassword({ email, password });
    return { user: result.data?.user || null, error: result.error?.message || null };
  }

  async function logout() {
    const result = await client.auth.signOut();
    return { error: result.error?.message || null };
  }

  async function getSession() {
    const result = await client.auth.getSession();
    return result.data?.session || null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 8) {
      return { error: "Wachtwoord moet minimaal 8 tekens bevatten." };
    }
    const result = await client.auth.updateUser({ password: newPassword });
    return { error: result.error?.message || null };
  }

  async function updateProfile(profile) {
    const data = {};
    if (typeof profile?.username === "string") data.username = profile.username.trim();
    const result = await client.auth.updateUser({ data });
    return { user: result.data?.user || null, error: result.error?.message || null };
  }

  async function updateCloudinarySettings(cloudName, uploadPreset) {
    const cloud_name = String(cloudName || "").trim();
    const upload_preset = String(uploadPreset || "").trim();

    if (!cloud_name || !upload_preset) {
      return { error: "Cloud name en unsigned upload preset zijn verplicht." };
    }

    const result = await client.auth.updateUser({
      data: { cloudinary: { cloud_name, upload_preset } }
    });

    return { user: result.data?.user || null, error: result.error?.message || null };
  }

  async function removeCloudinarySettings() {
    const result = await client.auth.updateUser({ data: { cloudinary: null } });
    return { error: result.error?.message || null };
  }

  function onAuthChange(callback) {
    return client.auth.onAuthStateChange((event, session) => callback(event, session));
  }

  function getClient() {
    return client;
  }

  window.AuthModule = {
    login,
    logout,
    getSession,
    getUser,
    updatePassword,
    updateProfile,
    updateCloudinarySettings,
    removeCloudinarySettings,
    onAuthChange,
    getClient,
    supabaseUrl: SUPABASE_URL
  };
})();
