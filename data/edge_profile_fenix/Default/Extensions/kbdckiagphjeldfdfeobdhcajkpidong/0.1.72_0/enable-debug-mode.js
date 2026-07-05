/**
 * Enable Debug Mode Helper Script
 *
 * Usage: Open browser console on any ChatGPT page and run:
 * - To enable: chrome.storage.local.set({ superprompt_debug_mode: true })
 * - To disable: chrome.storage.local.set({ superprompt_debug_mode: false })
 * - Then reload the page
 *
 * This script provides a shortcut for support/troubleshooting.
 */

console.log("🔧 SuperPrompt Debug Mode Helper");
console.log("");
console.log("To ENABLE debug logging:");
console.log(
  "  chrome.storage.local.set({ superprompt_debug_mode: true }).then(() => location.reload())",
);
console.log("");
console.log("To DISABLE debug logging:");
console.log(
  "  chrome.storage.local.set({ superprompt_debug_mode: false }).then(() => location.reload())",
);
console.log("");
console.log(
  "Note: Debug mode is automatically disabled in production builds for performance.",
);
