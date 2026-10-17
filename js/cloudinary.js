// ======================= CLOUDINARY =======================
// MyTrailWalks v1.1.0
// Centrale instellingen + unsigned image upload.
// Bewaart alleen cloud_name en upload_preset in localStorage.
// Geen API key, API secret, wachtwoord of token opslaan.
"use strict";

(function () {
  const CLOUDINARY_VERSION = "1.1.0";
  const SETTINGS_KEY = "mytrailwalks.cloudinary";

  function validateSetting(value, label) {
    const normalized = String(value || "").trim();
    if (!normalized) throw new Error(`${label} is verplicht.`);
    if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
      throw new Error(`${label} bevat ongeldige tekens.`);
    }
    return normalized;
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return null;
      const cfg = JSON.parse(raw);
      if (!cfg?.cloud_name || !cfg?.upload_preset) return null;
      return {
        cloud_name: String(cfg.cloud_name),
        upload_preset: String(cfg.upload_preset),
      };
    } catch (error) {
      console.warn("[cloudinary] Instellingen konden niet worden gelezen:", error);
      return null;
    }
  }

  function saveSettings(cloudName, uploadPreset) {
    const settings = {
      cloud_name: validateSetting(cloudName, "Cloud name"),
      upload_preset: validateSetting(uploadPreset, "Upload preset"),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }

  function removeSettings() {
    localStorage.removeItem(SETTINGS_KEY);
  }

  function validateImage(file) {
    if (!(file instanceof File)) throw new Error("Selecteer eerst een afbeelding.");
    if (!file.type.startsWith("image/")) throw new Error("Alleen afbeeldingsbestanden zijn toegestaan.");
  }

  async function uploadImage(file) {
    validateImage(file);
    const settings = getSettings();
    if (!settings) {
      throw new Error("Cloudinary is nog niet geconfigureerd. Open Cloudinary via het menu en sla cloud name + unsigned upload preset op.");
    }

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", settings.upload_preset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(settings.cloud_name)}/image/upload`,
      { method: "POST", body: form }
    );

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.secure_url) {
      throw new Error(result?.error?.message || "Cloudinary-upload mislukt.");
    }

    return {
      url: result.secure_url,
      secure_url: result.secure_url,
      publicId: result.public_id || null,
      assetId: result.asset_id || null,
    };
  }

  function setMessage(text, type) {
    const el = document.getElementById("cloudinary-message");
    if (!el) return;
    el.textContent = text || "";
    el.className = "cloudinary-message" + (type ? ` ${type}` : "");
  }

  function setConnectedState(isConnected) {
    const status = document.getElementById("cloudinary-status");
    const text = document.getElementById("cloudinary-status-text");
    const removeBtn = document.getElementById("cloudinary-remove");
    if (status) status.classList.toggle("connected", !!isConnected);
    if (text) text.textContent = isConnected ? "Cloudinary gekoppeld" : "Nog niet gekoppeld";
    if (removeBtn) removeBtn.disabled = !isConnected;
  }

  function loadSettingsPage() {
    const cloudNameInput = document.getElementById("cloudinary-cloud-name");
    const presetInput = document.getElementById("cloudinary-upload-preset");
    if (!cloudNameInput || !presetInput) return;
    const settings = getSettings();
    cloudNameInput.value = settings?.cloud_name || "";
    presetInput.value = settings?.upload_preset || "";
    setConnectedState(!!settings);
  }

  function bindSettingsPage() {
    const saveBtn = document.getElementById("cloudinary-save");
    const removeBtn = document.getElementById("cloudinary-remove");
    const cloudNameInput = document.getElementById("cloudinary-cloud-name");
    const presetInput = document.getElementById("cloudinary-upload-preset");

    if (saveBtn && cloudNameInput && presetInput) {
      saveBtn.addEventListener("click", () => {
        try {
          saveSettings(cloudNameInput.value, presetInput.value);
          setConnectedState(true);
          setMessage("Cloudinary-koppeling opgeslagen.", "success");
        } catch (error) {
          setMessage(`Opslaan mislukt: ${error.message || String(error)}`, "error");
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        if (!window.confirm("Cloudinary-koppeling verwijderen? Bestaande foto-URL's blijven behouden.")) return;
        removeSettings();
        if (cloudNameInput) cloudNameInput.value = "";
        if (presetInput) presetInput.value = "";
        setConnectedState(false);
        setMessage("Cloudinary-koppeling verwijderd.", "success");
      });
    }
  }

  function initializeHeroPhotoUpload() {
    const button = document.getElementById("btn-upload-hero-photo");
    const fileInput = document.getElementById("input-hero-photo-file");
    const urlInput = document.getElementById("input-hero-photo");
    const status = document.getElementById("hero-photo-upload-status");
    if (!button || !fileInput || !urlInput) return;

    button.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      button.disabled = true;
      if (status) status.textContent = "Uploaden…";
      try {
        const media = await uploadImage(file);
        const url = typeof window.fixCloudinaryUrl === "function"
          ? window.fixCloudinaryUrl(media.url)
          : media.url;
        urlInput.value = url;
        urlInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (status) status.textContent = "Geüpload";
      } catch (error) {
        console.error("[cloudinary] Hero-upload mislukt:", error);
        if (status) status.textContent = error.message || "Upload mislukt";
        alert(error.message || "Cloudinary-upload mislukt.");
      } finally {
        button.disabled = false;
        fileInput.value = "";
      }
    });
  }

  function init() {
    bindSettingsPage();
    loadSettingsPage();
    initializeHeroPhotoUpload();
  }

  window.CloudinaryUpload = {
    version: CLOUDINARY_VERSION,
    getSettings,
    saveSettings,
    removeSettings,
    uploadImage,
  };

  window.CloudinaryModule = window.CloudinaryUpload;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
