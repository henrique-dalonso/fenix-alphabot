(function () {
  // ⏸️ EXTENSION PAUSE STATE - Shared pause management
  if (!window._spExtensionPaused) {
    window._spExtensionPaused = false;
    window._spObservers = [];
    window._spIntervals = [];

    window._spPauseExtension = function () {
      if (window._spExtensionPaused) return;
      window._spExtensionPaused = true;
      console.info("⏸️ [SuperPrompt/Claude] Extension PAUSED");
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
      console.info("▶️ [SuperPrompt/Claude] Extension RESUMED");
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

  function spGetLang() {
    try {
      const l = localStorage.getItem("superprompt-language");
      if (l === "nl") return "nl";
      if (l === "fr") return "fr";
      return "en";
    } catch {}
    return "en";
  }
  const spI18n = {
    en: {
      send: "Send",
    },
    nl: {
      send: "Verzenden",
    },
    fr: {
      send: "Envoyer",
    },
  };
  function t(key) {
    const lang = spGetLang();
    const dict = spI18n[lang] || spI18n.en;
    return dict[key] || key;
  }
  const tSend = t("send");
  let lastPromptText = ""; // Cache voor de laatste prompt

  function isPromptField(el) {
    // Claude gebruikt andere selectors
    try {
      if (el && el.closest && el.closest("[data-superprompt]")) return false;
    } catch {}

    // Additional checks for SuperPrompt-specific field IDs/classes
    try {
      if (
        el &&
        el.id &&
        (el.id.includes("prompt-content") || el.id.includes("prompt-textarea"))
      ) {
        return false;
      }
      if (el && el.className && el.className.includes("superprompt")) {
        return false;
      }
    } catch {}

    // Claude input field detection - supports both new chat and existing conversation
    return (
      el &&
      (el.tagName === "TEXTAREA" ||
        el.getAttribute("contenteditable") === "true" ||
        el.classList.contains("ProseMirror") || // Claude's editor (both contexts)
        el.closest('[data-testid="chat-input"]') || // New chat input
        el.closest('[role="textbox"]') || // Existing conversation input
        el.closest(".ProseMirror") || // Alternative ProseMirror selector
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("prompt")) ||
        (el.getAttribute("aria-label") &&
          el.getAttribute("aria-label").toLowerCase().includes("claude")) ||
        (el.getAttribute("data-placeholder") &&
          el.getAttribute("data-placeholder").toLowerCase().includes("claude")))
    );
  }

  function extractText(el) {
    // Claude kan andere text extractie nodig hebben
    return el?.value || el?.innerText || el?.textContent || "";
  }

  function log(...args) {
    // Console logging disabled for production
  }

  function logError(...args) {
    // Console error logging disabled for production
  }

  // Helper to detect events originating from SuperPrompt UI (including Shadow DOM)
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

  function sendPrompt(text = null) {
    // Als er geen tekst is meegegeven, probeer het veld te vinden
    if (!text) {
      const active = document.activeElement;
      const field = isPromptField(active) ? active : findPromptFieldWithText();
      text = extractText(field).trim();
    }

    log("📤 sendPrompt()", text);

    if (text) {
      window.postMessage(
        {
          type: "claude-prompt-detected",
          prompt: text,
          source: "claude", // Source voor Claude
        },
        "*"
      );
    } else {
      log("⚠️ Geen geldige prompt gevonden");
    }
  }

  // Vind het veld dat daadwerkelijk tekst bevat (Claude-specifiek)
  function findPromptFieldWithText() {
    const allFields = [
      ...document.querySelectorAll('[contenteditable="true"]'),
      ...document.querySelectorAll("textarea"),
      ...document.querySelectorAll(".ProseMirror"), // Claude's editor (both contexts)
      ...document.querySelectorAll('[data-testid="chat-input"]'), // New chat
      ...document.querySelectorAll('[role="textbox"]'), // Existing conversation
      ...document.querySelectorAll('[aria-label*="prompt" i]'), // Case-insensitive prompt label
      ...document.querySelectorAll('[aria-label*="claude" i]'), // Case-insensitive claude label
      ...document.querySelectorAll('[data-placeholder*="claude" i]'), // Claude placeholder
    ].filter((el) => {
      try {
        return !(el.closest && el.closest("[data-superprompt]"));
      } catch {
        return true;
      }
    });

    // Zoek het veld met tekst
    for (const field of allFields) {
      // Additional check: skip fields that look like SuperPrompt inputs
      try {
        if (
          field.id &&
          (field.id.includes("prompt-content") ||
            field.id.includes("prompt-textarea"))
        ) {
          continue;
        }
        if (field.className && field.className.includes("superprompt")) {
          continue;
        }
      } catch {}

      const text = extractText(field).trim();
      if (text) {
        log("✅ Gevonden veld met tekst:", text);
        return field;
      }
    }

    // Fallback: pak het eerste veld (but still avoid SuperPrompt fields)
    return (
      allFields.find((field) => {
        try {
          if (
            field.id &&
            (field.id.includes("prompt-content") ||
              field.id.includes("prompt-textarea"))
          ) {
            return false;
          }
          if (field.className && field.className.includes("superprompt")) {
            return false;
          }
          return true;
        } catch {
          return true;
        }
      }) || allFields[0]
    );
  }

  // ⌨️ ENTER zonder shift → sendPrompt
  document.addEventListener(
    "keydown",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;
      if (e.key === "Enter" && !e.shiftKey) {
        // Capture text BEFORE Enter is processed
        const el = e.target;
        if (isPromptField(el)) {
          const textBeforeEnter = extractText(el).trim();
          if (textBeforeEnter) {
            lastPromptText = textBeforeEnter;
            log(
              "⏎ ENTER → Captured text before send:",
              textBeforeEnter.substring(0, 100)
            );
          }
        }

        log("⏎ ENTER → sendPrompt");

        // Small delay to let the prompt be sent, then log it
        setTimeout(() => {
          sendPrompt(lastPromptText);
        }, 100);
      }
    },
    true
  );

  // � Cache tekst tijdens het typen (Claude-specifiek)
  document.addEventListener(
    "input",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;
      const el = e.target;
      if (isPromptField(el)) {
        lastPromptText = extractText(el).trim();
      }
    },
    true
  );

  // �🖱️ Klik op verzendknop → sendPrompt (Claude-specifieke selectors)
  document.addEventListener(
    "click",
    function (e) {
      const el = e.target;
      if (isEventFromSuperPrompt(e)) return;

      // Enhanced send button detection for both new chat and existing conversation
      const isSendButton =
        el?.closest('button[aria-label*="Send"]') ||
        el?.closest('button[aria-label*="Versturen"]') ||
        el?.closest('[data-testid="send-button"]') ||
        el?.closest('button[type="submit"]') ||
        (el?.closest("button") &&
          el?.closest("button").textContent?.includes("Send")) ||
        (el?.closest("button") &&
          el?.closest("button").textContent?.includes("Versturen")) ||
        // Additional selectors for Claude's send buttons in different contexts
        el?.closest('button[title*="Send"]') ||
        el?.closest('button[title*="Submit"]') ||
        (el?.tagName === "BUTTON" && el.getAttribute("type") === "submit") ||
        // Look for buttons near prompt fields
        (el?.closest("button") &&
          el?.closest("form, .chat-input, .prompt-input, .ProseMirror-parent"));

      if (isSendButton) {
        log("🖱️ Klik op verzendknop gedetecteerd");

        // Probeer eerst de huidige tekst te lezen
        const field = findPromptFieldWithText();
        const currentText = field ? extractText(field).trim() : "";

        // Gebruik cached tekst als fallback
        const textToSend = currentText || lastPromptText;

        log("📝 Huidige tekst:", currentText);
        log("💾 Cached tekst:", lastPromptText);
        log("📤 Versturen:", textToSend);

        if (textToSend) {
          sendPrompt(textToSend);
        }
      }
    },
    true
  );

  log("✅ Claude listener actief met caching");
})();
