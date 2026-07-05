// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  // Display version from manifest (single source of truth)
  const manifest = chrome.runtime.getManifest();
  const versionEl = document.getElementById("version-display");
  if (versionEl && manifest.version) {
    versionEl.textContent = `v${manifest.version}`;
  }

  // Add event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Open Manager
  document.getElementById("openManager").addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (currentTab?.url) {
      const url = new URL(currentTab.url);
      const isSupportedSite =
        url.hostname === "chatgpt.com" ||
        url.hostname === "claude.ai" ||
        url.hostname === "grok.com";

      if (isSupportedSite) {
        // Send message to open manager on current tab
        chrome.tabs
          .sendMessage(currentTab.id, {
            type: "OPEN_MANAGER",
          })
          .catch(() => {
            // If content script not loaded, open ChatGPT
            chrome.tabs.create({ url: "https://chatgpt.com" });
          });
      } else {
        // Open ChatGPT if not on supported site
        chrome.tabs.create({ url: "https://chatgpt.com" });
      }
    } else {
      // Fallback: open ChatGPT
      chrome.tabs.create({ url: "https://chatgpt.com" });
    }

    window.close();
  });

  // Open Settings
  document
    .getElementById("openSettings")
    .addEventListener("click", async () => {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (currentTab?.url) {
        const url = new URL(currentTab.url);
        const isSupportedSite =
          url.hostname === "chatgpt.com" ||
          url.hostname === "claude.ai" ||
          url.hostname === "grok.com";

        if (isSupportedSite) {
          // Send message to open settings on current tab
          chrome.tabs
            .sendMessage(currentTab.id, {
              type: "OPEN_SETTINGS",
            })
            .catch(() => {
              // If content script not loaded, open ChatGPT
              chrome.tabs.create({ url: "https://chatgpt.com" });
            });
        } else {
          // Open ChatGPT if not on supported site
          chrome.tabs.create({ url: "https://chatgpt.com" });
        }
      } else {
        // Fallback: open ChatGPT
        chrome.tabs.create({ url: "https://chatgpt.com" });
      }

      window.close();
    });
}

// Add CSS for animations (if needed in future)
