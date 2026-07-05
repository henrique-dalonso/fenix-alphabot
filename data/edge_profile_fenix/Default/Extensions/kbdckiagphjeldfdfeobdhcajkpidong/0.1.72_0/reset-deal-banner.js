/**
 * Reset Deal Banner - Debug utility
 * Run this in the browser console to reset the deal banner state
 */

(async () => {
  console.log("🔄 Resetting deal banner state...");

  const keysToRemove = [
    "sp_deal_dismissed_permanently",
    "sp_deal_remind_later_timestamp",
    "sp_deal_version",
  ];

  // Check current values
  const currentState = await chrome.storage.local.get(keysToRemove);
  console.log("📊 Current state:", currentState);

  // Remove all deal-related keys
  await chrome.storage.local.remove(keysToRemove);

  console.log("✅ Deal banner state reset!");
  console.log("🔄 Reload the page to see the banner again");

  // Verify removal
  const afterState = await chrome.storage.local.get(keysToRemove);
  console.log("📊 After reset:", afterState);
})();
