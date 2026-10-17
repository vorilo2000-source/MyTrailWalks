// cloudinary.js — MyTrailWalks v1.0.0
(function () {
  "use strict";

  async function getSettings() {
    const user = await AuthModule.getUser();
    const cfg = user?.user_metadata?.cloudinary;
    if (!cfg?.cloud_name || !cfg?.upload_preset) return null;
    return { cloud_name: cfg.cloud_name, upload_preset: cfg.upload_preset };
  }

  async function uploadImage(file) {
    if (!file) throw new Error("Geen bestand geselecteerd.");

    const session = await AuthModule.getSession();
    if (!session) throw new Error("Log eerst in.");

    const settings = await getSettings();
    if (!settings) throw new Error("Cloudinary is nog niet geconfigureerd.");

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", settings.upload_preset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(settings.cloud_name)}/image/upload`,
      { method: "POST", body: form }
    );

    const result = await response.json();
    if (!response.ok || !result?.secure_url) {
      throw new Error(result?.error?.message || "Cloudinary upload mislukt.");
    }
    return result;
  }

  async function initSettingsPage() {
    if (!document.getElementById("cloudinary-main")) return;

    await window.appReady;
    const session = await AuthModule.getSession();
    if (!session) {
      document.getElementById("auth-modal").hidden = false;
      return;
    }

    document.getElementById("cloudinary-main").hidden = false;

    const settings = await getSettings();
    if (settings) {
      document.getElementById("cloudinary-cloud-name").value = settings.cloud_name;
      document.getElementById("cloudinary-upload-preset").value = settings.upload_preset;
    }

    document.getElementById("cloudinary-save").addEventListener("click", async () => {
      const message = document.getElementById("cloudinary-message");
      const result = await AuthModule.updateCloudinarySettings(
        document.getElementById("cloudinary-cloud-name").value,
        document.getElementById("cloudinary-upload-preset").value
      );
      message.textContent = result.error || "Cloudinary-configuratie opgeslagen.";
    });

    document.getElementById("cloudinary-remove").addEventListener("click", async () => {
      const message = document.getElementById("cloudinary-message");
      const result = await AuthModule.removeCloudinarySettings();
      if (!result.error) {
        document.getElementById("cloudinary-cloud-name").value = "";
        document.getElementById("cloudinary-upload-preset").value = "";
      }
      message.textContent = result.error || "Cloudinary-koppeling verwijderd.";
    });
  }

  window.CloudinaryModule = { getSettings, uploadImage };

  document.addEventListener("DOMContentLoaded", initSettingsPage);
})();
