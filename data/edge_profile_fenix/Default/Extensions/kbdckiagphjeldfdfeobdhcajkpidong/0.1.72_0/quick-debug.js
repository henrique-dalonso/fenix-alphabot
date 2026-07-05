// Eenvoudige debug helper - voeg toe aan de console
function quickDebugVaultId() {
  console.log("=== Quick VaultId Debug ===");

  // 1. localStorage check
  const activeVaultId = localStorage.getItem("activeVaultId");
  console.log("localStorage activeVaultId:", activeVaultId);

  // 2. Check of het in de URL staat
  console.log("Current URL:", window.location.href);

  // 3. Check vaults in chrome storage
  chrome.storage.local.get(["vaults"], (result) => {
    const vaults = result.vaults || [];
    console.log("Available vaults:");
    vaults.forEach((vault) => {
      const isActive = vault.id === activeVaultId;
      console.log(
        `${isActive ? "👉" : "  "} ${vault.name} (${vault.id}) - ${
          vault.isEncrypted ? "🔒" : "🔓"
        }`
      );
    });

    // 4. Check active vault details
    const activeVault = vaults.find((v) => v.id === activeVaultId);
    if (activeVault) {
      console.log("Active vault details:", {
        name: activeVault.name,
        id: activeVault.id,
        isEncrypted: activeVault.isEncrypted,
      });
    } else {
      console.log("⚠️ No active vault found!");
    }
  });

  // 5. Direct IndexedDB check
  const request = indexedDB.open("Prompture-chats", 1);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(["chats"], "readonly");
    const store = transaction.objectStore("chats");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const allChats = getAllRequest.result;
      const chatsForActiveVault = allChats.filter(
        (chat) => chat.vaultId === activeVaultId
      );
      console.log(
        `Chats in IndexedDB for active vault (${activeVaultId}):`,
        chatsForActiveVault.length
      );

      if (chatsForActiveVault.length > 0) {
        console.log("Found chats:");
        chatsForActiveVault.forEach((chat) => {
          console.log(`- "${chat.title}" (${chat.id})`);
        });
      }

      // Show all chats with vaultId for comparison
      const allVaultChats = allChats.filter((chat) => chat.vaultId);
      console.log("All chats with vaultId in IndexedDB:");
      allVaultChats.forEach((chat) => {
        console.log(`- "${chat.title}" (${chat.id}): vaultId=${chat.vaultId}`);
      });
    };
  };
}

// Make available in console
window.quickDebugVaultId = quickDebugVaultId;
