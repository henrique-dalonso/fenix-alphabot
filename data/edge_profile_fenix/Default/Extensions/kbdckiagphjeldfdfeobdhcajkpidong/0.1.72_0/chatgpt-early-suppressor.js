// Runs at document_start, injected via prehide-bootstrap into main world
// Purpose: pre-emptively suppress React RecoverableError #418 on ChatGPT during refresh with textarea content
(function () {
  try {
    if (!location.hostname.includes("chatgpt.com")) return;

    // Only install once
    if (window.__spEarlySuppressorInstalled) return;
    window.__spEarlySuppressorInstalled = true;

    var patts = [
      "#418",
      "RecoverableError",
      "Minified React error",
      "hydration",
      "createRoot",
      "Intercom not booted",
      "Intercom not booted or setup incomplete",
      "user_segments",
      "queryKey: 'user_segments'",
      "reading 'usr'",
      "Unexpected Server Error",
      "Failed to fetch",
      "TypeError: Failed to fetch",
      "fetch request failed",
      "Network request failed",
    ];

    var origConsoleError = console.error;
    var origOnError = window.onerror;
    var origOnRejection = window.onunhandledrejection;

    function containsReact418(msg) {
      if (!msg) return false;
      try {
        var s = String(msg);
        if (/Minified React error #\d+/.test(s)) return true;
        // Check for Intercom errors
        if (s.indexOf("Intercom not booted") !== -1) return true;
        if (s.indexOf("user_segments") !== -1) return true;
        if (s.indexOf("Unexpected Server Error") !== -1) return true;
        // Check for fetch errors (common during ChatGPT loading)
        if (s.indexOf("Failed to fetch") !== -1) return true;
        if (s.indexOf("fetch request failed") !== -1) return true;
        if (s.indexOf("Network request failed") !== -1) return true;
        if (/TypeError.*fetch/.test(s)) return true;
        for (var i = 0; i < patts.length; i++) {
          if (s.indexOf(patts[i]) !== -1) return true;
        }
      } catch (_) {}
      return false;
    }

    console.error = function () {
      try {
        var args = Array.prototype.slice.call(arguments);
        // Check if any argument contains our suppression patterns
        if (args.some(containsReact418)) {
          // Only show debug info in development, not warnings
          if (window.location.search.includes("debug=true")) {
            console.info(
              "[SuperPrompt] 🔇 Suppressed ChatGPT initialization noise"
            );
          }
          return;
        }

        // Special check for Error objects with fetch-related stack traces
        for (var i = 0; i < args.length; i++) {
          if (args[i] instanceof Error && args[i].stack) {
            var stack = String(args[i].stack);
            if (
              stack.indexOf("fetchCallImpl") !== -1 &&
              stack.indexOf("Failed to fetch") !== -1
            ) {
              // Silently suppress these - they're expected during ChatGPT init
              if (window.location.search.includes("debug=true")) {
                console.info(
                  "[SuperPrompt] 🔇 Suppressed ChatGPT fetch initialization noise"
                );
              }
              return;
            }
          }
        }
      } catch (_) {}
      return origConsoleError.apply(console, arguments);
    };

    window.onerror = function (message, source, lineno, colno, error) {
      try {
        if (
          containsReact418(message) ||
          (error && containsReact418(error && error.message))
        ) {
          // Silently suppress or only show in debug mode
          if (window.location.search.includes("debug=true")) {
            console.info(
              "[SuperPrompt] 🔇 Suppressed window error: ChatGPT initialization"
            );
          }
          return true;
        }
      } catch (_) {}
      return typeof origOnError === "function"
        ? origOnError(message, source, lineno, colno, error)
        : false;
    };

    window.onunhandledrejection = function (event) {
      try {
        var reason = event && event.reason;
        if (
          containsReact418(reason && reason.message) ||
          containsReact418(reason)
        ) {
          // Silently suppress or only show in debug mode
          if (window.location.search.includes("debug=true")) {
            console.info(
              "[SuperPrompt] 🔇 Suppressed promise rejection: ChatGPT initialization"
            );
          }
          if (event && typeof event.preventDefault === "function")
            event.preventDefault();
          return;
        }
      } catch (_) {}
      return typeof origOnRejection === "function"
        ? origOnRejection.call(window, event)
        : void 0;
    };

    // Smarter auto-restore: restore faster if page seems loaded properly
    function smartRestore() {
      try {
        console.error = origConsoleError;
        window.onerror = origOnError;
        window.onunhandledrejection = origOnRejection;
        delete window.__spEarlySuppressorInstalled;

        if (window.location.search.includes("debug=true")) {
          console.info(
            "[SuperPrompt] 🔄 Early suppressor restored after initialization"
          );
        }
      } catch (_) {}
    }

    // Auto-restore after ChatGPT initialization (shorter timeout)
    setTimeout(smartRestore, 8000);

    // Also restore when we detect ChatGPT has fully loaded
    var loadCheckInterval = setInterval(function () {
      try {
        // Check if ChatGPT main app seems loaded (less React errors expected)
        if (
          document.querySelector(
            '[data-testid="chat-textarea"], .chat-input, main[role="main"]'
          )
        ) {
          clearInterval(loadCheckInterval);
          setTimeout(smartRestore, 2000); // Give it 2 more seconds then restore
        }
      } catch (_) {}
    }, 1000);
  } catch (_) {}
})();
