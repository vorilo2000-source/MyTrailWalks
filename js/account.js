// account.js — MyTrailWalks v1.0.0
document.addEventListener("DOMContentLoaded", async () => {
  await window.appReady;

  const session = await AuthModule.getSession();
  if (!session) {
    document.getElementById("auth-modal").hidden = false;
    return;
  }

  const user = session.user;
  document.getElementById("account-main").hidden = false;
  document.getElementById("account-email").textContent = user.email || "";
  document.getElementById("account-username").value = user.user_metadata?.username || "";

  document.getElementById("account-profile-save").addEventListener("click", async () => {
    const status = document.getElementById("account-profile-status");
    const username = document.getElementById("account-username").value.trim();
    const result = await AuthModule.updateProfile({ username });
    status.textContent = result.error || "Profiel opgeslagen.";
  });

  document.getElementById("account-password-save").addEventListener("click", async () => {
    const status = document.getElementById("account-password-status");
    const password = document.getElementById("account-password").value;
    const confirmation = document.getElementById("account-password-confirm").value;

    if (password !== confirmation) {
      status.textContent = "Wachtwoorden komen niet overeen.";
      return;
    }

    const result = await AuthModule.updatePassword(password);
    status.textContent = result.error || "Wachtwoord gewijzigd.";
  });

  document.getElementById("account-delete").addEventListener("click", () => {
    document.getElementById("account-delete-status").textContent =
      "Accountverwijdering is nog niet actief: hiervoor moet eerst de beveiligde Supabase serverfunctie van dit project worden bevestigd.";
  });
});
