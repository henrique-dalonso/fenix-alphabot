// Runs at document_start to avoid native list flicker when the alt view is ON
(function () {
  try {
    // Inject ultra-early React #418 suppressor for ChatGPT main world
    try {
      var s = document.createElement("script");
      s.src = chrome.runtime.getURL("chatgpt-early-suppressor.js");
      s.type = "text/javascript";
      (document.head || document.documentElement).appendChild(s);
      // Leave it in place; it self-cleans handlers later
    } catch (_) {}

    var on = null;
    try {
      on = window.localStorage && window.localStorage.getItem("sp_alt_view_on");
    } catch (_) {}
    if (on !== "1") return;

    // Mark early so CSS selectors can apply before first paint
    try {
      document.documentElement.setAttribute("data-sp-alt-view", "1");
    } catch (_) {}

    // Inject minimal CSS to hide native conversation list items
    var css = [
      'html[data-sp-alt-view="1"] nav a[href^="/c/"],',
      'html[data-sp-alt-view="1"] nav a[href*="/c/"] { display: none !important; }',
      'html[data-sp-alt-view="1"] nav li:has(> a[href^="/c/"]),',
      'html[data-sp-alt-view="1"] nav li:has(> a[href*="/c/"]) { display: none !important; }',
      'html[data-sp-alt-view="1"] nav div:has(> a[href^="/c/"]),',
      'html[data-sp-alt-view="1"] nav div:has(> a[href*="/c/"]) { display: none !important; }',
      'html[data-sp-alt-view="1"] nav [role="list"]:has(a[href^="/c/"]),',
      'html[data-sp-alt-view="1"] nav [role="list"]:has(a[href*="/c/"]) { display: none !important; }',
    ].join("\n");

    var style = document.createElement("style");
    style.id = "sp-prehide-native-list-early";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  } catch (_) {}
})();
