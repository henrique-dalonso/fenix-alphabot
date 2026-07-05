/**
 * Debug Helper: Clear Entitlements Cache
 *
 * TEMPORARY DEVELOPMENT BYPASS - disables Pro gating for testing
 *
 * Run in ChatGPT page console:
 *   localStorage.setItem('superprompt_debug_mode', 'true');
 *   localStorage.setItem('superprompt_force_pro', 'true');
 *   location.reload();
 *
 * To disable:
 *   localStorage.removeItem('superprompt_force_pro');
 *   location.reload();
 */

(function () {
  "use strict";

  // Check if we should force Pro mode (development bypass)
  const forcePro = localStorage.getItem("superprompt_force_pro") === "true";

  if (forcePro) {
    console.log("🔓 PRO MODE FORCED (Development Bypass Active)");
    console.log("   All themes unlocked for testing");
    console.log(
      '   To disable: localStorage.removeItem("superprompt_force_pro"); location.reload();'
    );
  }

  function enableDevBypass() {
    localStorage.setItem("superprompt_debug_mode", "true");
    localStorage.setItem("superprompt_force_pro", "true");
    console.log("✅ Development bypass ENABLED");
    console.log("🔄 Reloading in 1 second...");
    setTimeout(() => location.reload(), 1000);
  }

  function disableDevBypass() {
    localStorage.removeItem("superprompt_force_pro");
    localStorage.removeItem("superprompt_debug_mode");
    console.log("✅ Development bypass DISABLED");
    console.log("🔄 Reloading in 1 second...");
    setTimeout(() => location.reload(), 1000);
  }

  // Make it globally available
  if (typeof window !== "undefined") {
    window.enableProBypass = enableDevBypass;
    window.disableProBypass = disableDevBypass;
    console.log("💡 Dev helpers loaded!");
    console.log("   - window.enableProBypass()  → Unlock all themes");
    console.log("   - window.disableProBypass() → Re-enable Pro gating");
  }
})();
