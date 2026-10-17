// ======================= CLOUDINARY UPLOAD =======================
"use strict";

const CLOUDINARY_UPLOAD_VERSION = "1.0.0";

// Vul deze publieke waarden in voor MyTrailWalks.
// Gebruik hier nooit een API secret.
const CLOUDINARY_CONFIG = {
  cloudName: "",
  uploadPreset: "",
};

function getCloudinaryConfig() {
  return {
    cloudName: String(CLOUDINARY_CONFIG.cloudName || "").trim(),
    uploadPreset: String(CLOUDINARY_CONFIG.uploadPreset || "").trim(),
  };
}

function validateCloudinaryConfig() {
  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error("Cloudinary is nog niet geconfigureerd: vul cloudName en uploadPreset in js/cloudinary.js in.");
  }
  return config;
}

function validateCloudinaryImage(file) {
  if (!(file instanceof File)) throw new Error("Selecteer eerst een afbeelding.");
  if (!file.type.startsWith("image/")) throw new Error("Alleen afbeeldingsbestanden zijn toegestaan.");
}

async function uploadCloudinaryImage(file) {
  validateCloudinaryImage(file);
  const { cloudName, uploadPreset } = validateCloudinaryConfig();

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: "POST", body: form }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Cloudinary-upload mislukt.");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id || null,
    assetId: data.asset_id || null,
  };
}

function setUploadStatus(element, message) {
  if (element) element.textContent = message || "";
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
    setUploadStatus(status, "Uploaden…");

    try {
      const media = await uploadCloudinaryImage(file);
      const url = typeof window.fixCloudinaryUrl === "function"
        ? window.fixCloudinaryUrl(media.url)
        : media.url;

      urlInput.value = url;
      urlInput.dispatchEvent(new Event("input", { bubbles: true }));
      setUploadStatus(status, "Geüpload");
    } catch (error) {
      console.error("[cloudinary] Hero-upload mislukt:", error);
      setUploadStatus(status, error.message || "Upload mislukt");
      alert(error.message || "Cloudinary-upload mislukt.");
    } finally {
      button.disabled = false;
      fileInput.value = "";
    }
  });
}

function initializeCloudinaryUpload() {
  initializeHeroPhotoUpload();
}

window.CloudinaryUpload = {
  version: CLOUDINARY_UPLOAD_VERSION,
  getConfig: getCloudinaryConfig,
  uploadImage: uploadCloudinaryImage,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCloudinaryUpload);
} else {
  initializeCloudinaryUpload();
}
