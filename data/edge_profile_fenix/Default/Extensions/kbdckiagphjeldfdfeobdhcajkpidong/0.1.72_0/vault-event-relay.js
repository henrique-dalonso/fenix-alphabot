// Vault Event Relay - Runs in PAGE context to bridge content script events to page
// This script is injected into the actual page (not content script) so it can
// communicate with vaultSidebar.js which also runs in page context

(function () {
  "use strict";

  // Track processed messages to prevent duplicates
  const processedMessages = new Set();

  // Listen for messages from content script
  window.addEventListener("message", function (event) {
    const data = event.data;

    // Check if this is a category update event
    if (data && data.type === "sp-chat-categories-updated") {
      // Create unique key for this message
      const messageKey = `${data.timestamp}-${data.action}-${data.categoryId}`;

      // Skip if we've already processed this exact message
      if (processedMessages.has(messageKey)) {
        return;
      }

      // Mark as processed
      processedMessages.add(messageKey);

      // Clean up old entries after 10 seconds
      setTimeout(function () {
        processedMessages.delete(messageKey);
      }, 10000);

      // Trigger vault sidebar refresh directly via global function
      if (typeof window.triggerVaultSidebarRefresh === "function") {
        window.triggerVaultSidebarRefresh();
      }
    }
  });
})();
