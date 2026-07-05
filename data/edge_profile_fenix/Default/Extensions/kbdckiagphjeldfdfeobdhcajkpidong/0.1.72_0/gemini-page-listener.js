(function () {
  // ⚠️ PLATFORM CHECK: This script is Gemini-only
  const isGemini = window.location.hostname.includes("gemini.google.com");

  if (!isGemini) {
    // Silently skip on non-Gemini platforms
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
      console.info("⏸️ [SuperPrompt/Gemini] Extension PAUSED");
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
      console.info("▶️ [SuperPrompt/Gemini] Extension RESUMED");
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
  const DEV_MODE = true;
  function log(...args) {
    if (DEV_MODE) {
      try {
        console.log("[SP Gemini Listener]", ...args);
      } catch {}
    }
  }

  function logError(...args) {
    try {
      console.error("[SP Gemini Listener]", ...args);
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

  // Track last prompt to prevent duplicates
  let lastPromptText = "";
  let lastPromptTime = 0;
  const DEBOUNCE_MS = 1000;

  // ============================================================================
  // GEMINI DOM SELECTORS
  // ============================================================================
  // The Gemini input is a contenteditable div with class "ql-editor" inside a rich-textarea
  // aria-label="Enter a prompt here" data-placeholder="Ask Gemini"
  const GEMINI_INPUT_SELECTORS = [
    '.ql-editor[contenteditable="true"][aria-label="Enter a prompt here"]',
    '.ql-editor[contenteditable="true"][data-placeholder*="Gemini"]',
    'rich-textarea .ql-editor[contenteditable="true"]',
    ".text-input-field_textarea .ql-editor",
  ];

  const GEMINI_SEND_BUTTON_SELECTORS = [
    'button.send-button[aria-label="Send message"]',
    "button.send-button.submit",
    ".send-button-container button",
  ];

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function findPromptField() {
    for (const selector of GEMINI_INPUT_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function findSendButton() {
    for (const selector of GEMINI_SEND_BUTTON_SELECTORS) {
      const btn = document.querySelector(selector);
      if (btn) return btn;
    }
    return null;
  }

  function extractText(el) {
    if (!el) return "";
    // For contenteditable, get innerText
    return (el.innerText || el.textContent || "").trim();
  }

  function isPromptField(el) {
    if (!el) return false;

    // Check if it's inside SuperPrompt's own UI
    try {
      if (el.closest && el.closest("[data-superprompt]")) return false;
    } catch {}

    // Check if it matches our selectors
    for (const selector of GEMINI_INPUT_SELECTORS) {
      try {
        if (el.matches && el.matches(selector)) return true;
        if (el.closest && el.closest(selector)) return true;
      } catch {}
    }

    return false;
  }

  // Helper to detect events originating from SuperPrompt UI
  function isEventFromSuperPrompt(e) {
    try {
      if (!e) return false;
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      for (const node of path) {
        try {
          if (
            node &&
            node.getAttribute &&
            node.getAttribute("data-superprompt")
          )
            return true;
        } catch {}
      }
      const t = e.target;
      if (t && t.closest && t.closest("[data-superprompt]")) return true;
      const ae = document.activeElement;
      if (ae && ae.closest && ae.closest("[data-superprompt]")) return true;
    } catch {}
    return false;
  }

  // ============================================================================
  // PROMPT DETECTION
  // ============================================================================

  function sendPromptDetection(text) {
    if (!text || !text.trim()) return;

    const trimmedText = text.trim();
    const now = Date.now();

    // Debounce duplicate prompts
    if (trimmedText === lastPromptText && now - lastPromptTime < DEBOUNCE_MS) {
      log("⏭️ Skipping duplicate prompt");
      return;
    }

    lastPromptText = trimmedText;
    lastPromptTime = now;

    log("📤 Gemini prompt detected:", trimmedText.substring(0, 100) + "...");

    window.postMessage(
      {
        type: "gemini-prompt-detected",
        prompt: trimmedText,
        source: "gemini",
        timestamp: now,
      },
      "*"
    );
  }

  // ============================================================================
  // FETCH INTERCEPTION - Detect API calls
  // ============================================================================
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [url, options] = args;
    const urlString = typeof url === "string" ? url : url?.toString() || "";

    // Check if this is a Gemini conversation API call
    // Gemini uses various endpoints like /batchexecute, /generate, etc.
    if (
      urlString.includes("batchexecute") ||
      urlString.includes("generate") ||
      urlString.includes("streamgenerate")
    ) {
      try {
        if (options?.body) {
          // Try to extract the prompt from the request body
          const body =
            typeof options.body === "string"
              ? options.body
              : JSON.stringify(options.body);

          // Gemini uses a complex encoded format, so we rely more on DOM detection
          // But we can use this to detect when a prompt is being sent
          log("📡 Gemini API call detected:", urlString);
        }
      } catch (error) {
        log("❌ Error parsing Gemini fetch request:", error);
      }
    }

    return originalFetch.apply(this, args);
  };

  // ============================================================================
  // KEYBOARD LISTENER - Detect Enter key to send
  // ============================================================================
  document.addEventListener(
    "keydown",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;

      // Enter without Shift sends the message
      if (e.key === "Enter" && !e.shiftKey) {
        const field = findPromptField();
        if (field && isPromptField(document.activeElement)) {
          const text = extractText(field);
          if (text) {
            // Small delay to ensure the prompt is captured before it's cleared
            setTimeout(() => sendPromptDetection(text), 10);
          }
        }
      }
    },
    { capture: true }
  );

  // ============================================================================
  // CLICK LISTENER - Detect send button click
  // ============================================================================
  document.addEventListener(
    "click",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;

      const target = e.target;
      if (!target) return;

      // Check if send button was clicked
      const sendBtn = target.closest
        ? target.closest(GEMINI_SEND_BUTTON_SELECTORS.join(", "))
        : null;

      if (sendBtn) {
        const field = findPromptField();
        if (field) {
          const text = extractText(field);
          if (text) {
            sendPromptDetection(text);
          }
        }
      }
    },
    { capture: true }
  );

  // ============================================================================
  // MUTATION OBSERVER - Watch for dynamic content changes
  // ============================================================================
  const observer = new MutationObserver((mutations) => {
    // We can use this to detect when responses are loaded if needed
    // For now, just keep it simple
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // ============================================================================
  // INJECT PROMPT HANDLER - Listen for injection requests from content script
  // ============================================================================
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const data = event.data;
    if (!data || typeof data !== "object") return;

    // Handle prompt injection request
    if (data.type === "superprompt-inject-to-gemini") {
      log("📥 Received inject request:", data);

      const field = findPromptField();
      if (!field) {
        logError("❌ Gemini input field not found");
        window.postMessage(
          {
            type: "superprompt-inject-result",
            success: false,
            error: "Input field not found",
          },
          "*"
        );
        return;
      }

      try {
        // Clear existing content using textContent instead of innerHTML (CSP compliance)
        field.textContent = "";

        // Insert text as plain text node to avoid CSP issues
        const textNode = document.createTextNode(data.prompt || "");
        const p = document.createElement("p");
        p.appendChild(textNode);
        field.appendChild(p);

        // Dispatch input event to trigger Gemini's state update
        field.dispatchEvent(
          new InputEvent("input", { bubbles: true, composed: true })
        );

        // Focus the field
        field.focus();

        log("✅ Prompt injected successfully");

        // Auto-send if requested
        if (data.autoSend) {
          setTimeout(() => {
            const sendBtn = findSendButton();
            if (sendBtn && !sendBtn.disabled) {
              sendBtn.click();
              log("✅ Send button clicked");
            } else {
              // Try pressing Enter as fallback
              field.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  composed: true,
                })
              );
              log("✅ Enter key dispatched");
            }
          }, 100);
        }

        window.postMessage(
          { type: "superprompt-inject-result", success: true },
          "*"
        );
      } catch (err) {
        logError("❌ Error injecting prompt:", err);
        window.postMessage(
          {
            type: "superprompt-inject-result",
            success: false,
            error: err.message,
          },
          "*"
        );
      }
    }
  });

  log("✅ Gemini page listener initialized");
})();
