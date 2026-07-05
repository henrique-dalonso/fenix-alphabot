(function () {
  // ⚠️ PLATFORM CHECK: This script is Grok-only
  const isGrok = window.location.hostname.includes("grok.com");

  if (!isGrok) {
    // Silently skip on non-Grok platforms
    return;
  }

  // ⏸️ EXTENSION PAUSE STATE - Shared pause management
  if (!window._spExtensionPaused) {
    window._spExtensionPaused = false;
    window._spObservers = [];
    window._spIntervals = [];

    window._spPauseExtension = function () {
      if (window._spExtensionPaused) return;
      window._spExtensionPaused = true;
      console.info("⏸️ [SuperPrompt/Grok] Extension PAUSED");
      window._spObservers.forEach((obs) => {
        try {
          obs.disconnect();
        } catch (e) {}
      });
      window._spIntervals.forEach((id) => {
        try {
          clearInterval(id);
        } catch (e) {}
      });
    };

    window._spResumeExtension = function () {
      if (!window._spExtensionPaused) return;
      window._spExtensionPaused = false;
      console.info("▶️ [SuperPrompt/Grok] Extension RESUMED");
    };

    window._spCreateObserver = function (callback) {
      if (window._spExtensionPaused) {
        return { observe: () => {}, disconnect: () => {} };
      }
      const observer = new MutationObserver((...args) => {
        if (window._spExtensionPaused) return;
        callback(...args);
      });
      window._spObservers.push(observer);
      return observer;
    };

    window._spSetInterval = function (callback, delay) {
      if (window._spExtensionPaused) return null;
      const intervalId = setInterval(() => {
        if (window._spExtensionPaused) return;
        callback();
      }, delay);
      window._spIntervals.push(intervalId);
      return intervalId;
    };
  }

  // Listen for pause/resume commands
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== "superprompt-content") return;
    if (event.data?.type !== "sp-extension-pause-state") return;
    const { paused } = event.data;
    if (paused) {
      window._spPauseExtension();
    } else {
      window._spResumeExtension();
    }
  });

  // Debug logging helper
  function log(...args) {
    try {
      console.log("[SP Grok Listener]", ...args);
    } catch {}
  }

  function spGetLang() {
    try {
      const l = localStorage.getItem("superprompt-language");
      if (l === "nl") return "nl";
      if (l === "fr") return "fr";
      return "en";
    } catch {}
    return "en";
  }

  // ============================================================================
  // FETCH INTERCEPTION - Onderschep Grok API calls
  // ============================================================================
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [url, options] = args;
    const urlString = typeof url === "string" ? url : url?.toString() || "";

    // Check if this is a Grok conversation API call
    if (
      urlString.includes("/rest/app-chat/conversations/new") ||
      urlString.includes("/rest/app-chat/conversations/")
    ) {
      try {
        // Parse the request body to get the message
        if (options?.body) {
          const body =
            typeof options.body === "string"
              ? JSON.parse(options.body)
              : options.body;

          if (body.message && body.message.trim()) {
            log("📤 Grok prompt detected via fetch:", body.message);

            // Extract conversation ID from URL if available
            const conversationMatch =
              window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
            const conversationId = conversationMatch
              ? conversationMatch[1]
              : null;

            // Post message to content script
            window.postMessage(
              {
                type: "grok-prompt-detected",
                prompt: body.message.trim(),
                source: "grok",
                conversationId: conversationId,
                timestamp: Date.now(),
              },
              "*"
            );
          }
        }
      } catch (error) {
        log("❌ Error parsing Grok fetch request:", error);
      }
    }

    // Call original fetch
    return originalFetch.apply(this, args);
  };

  // ============================================================================
  // XHR INTERCEPTION - Fallback for XMLHttpRequest
  // ============================================================================
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._grokUrl = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (
      this._grokUrl &&
      (this._grokUrl.includes("/rest/app-chat/conversations/new") ||
        this._grokUrl.includes("/rest/app-chat/conversations/"))
    ) {
      try {
        const parsedBody = typeof body === "string" ? JSON.parse(body) : body;

        if (parsedBody?.message && parsedBody.message.trim()) {
          log("📤 Grok prompt detected via XHR:", parsedBody.message);

          const conversationMatch =
            window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
          const conversationId = conversationMatch
            ? conversationMatch[1]
            : null;

          window.postMessage(
            {
              type: "grok-prompt-detected",
              prompt: parsedBody.message.trim(),
              source: "grok",
              conversationId: conversationId,
              timestamp: Date.now(),
            },
            "*"
          );
        }
      } catch (error) {
        log("❌ Error parsing Grok XHR request:", error);
      }
    }

    return originalXHRSend.apply(this, arguments);
  };

  log("✅ Grok fetch/XHR interception active");
})();
