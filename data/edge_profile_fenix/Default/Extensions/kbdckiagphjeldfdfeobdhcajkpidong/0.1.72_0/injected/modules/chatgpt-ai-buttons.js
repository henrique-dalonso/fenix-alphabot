/**
 * ChatGPT AI Features Toolbar Module
 *
 * Injects Proofread and Optimize buttons in ChatGPT's input controls area.
 * Features:
 * - Works with all conversation themes
 * - Integrates with Chrome Built-in AI APIs
 * - Preserves {{variables}} in prompts
 * - Shows loading states during processing
 * - Respects AI Features toggle in settings
 */

(function () {
  // Use production-safe logger that respects debug mode
  const logger = window.SuperPromptDebugLogger?.createLogger(
    "ChatGPT AI Buttons",
  ) || {
    log: () => {}, // No-op in production if logger not available
    warn: () => {},
    error: (...args) => console.error("[ChatGPT AI Buttons]", ...args), // Errors always visible
  };
  const log = logger.log;
  const warn = logger.warn;
  const error = logger.error;

  // State
  let aiToolbar = null;
  let isProcessing = false;
  let lastPromptContainer = null;
  let aiEnabled = false;

  // Check AI Features status via message to content script
  async function checkAIFeatures() {
    try {
      // Request AI features status from content script
      const response = await new Promise((resolve, reject) => {
        const messageId = `ai-features-check-${Date.now()}`;

        const handler = (event) => {
          if (
            event.data?.type === "sp-ai-features-response" &&
            event.data?.messageId === messageId
          ) {
            window.removeEventListener("message", handler);
            resolve(event.data);
          }
        };

        window.addEventListener("message", handler);

        window.postMessage(
          {
            type: "sp-ai-features-request",
            messageId: messageId,
            source: "chatgpt-ai-buttons",
          },
          "*",
        );

        // Timeout after 3 seconds
        setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout"));
        }, 3000);
      });

      aiEnabled = response.enabled ?? false;
      log("AI Features status:", aiEnabled ? "enabled" : "disabled");
      return aiEnabled;
    } catch (err) {
      error("Failed to check AI features", err);
      return false;
    }
  }

  // Find the ChatGPT prompt textarea/contenteditable
  function findPromptField() {
    // ChatGPT uses contenteditable div, but fallback to textarea
    const candidates = [
      ...document.querySelectorAll('[contenteditable="true"]'),
      ...document.querySelectorAll("textarea"),
    ].filter((el) => {
      // Skip SuperPrompt UI elements
      return !(el.closest && el.closest("[data-superprompt]"));
    });

    log("🔎 Found", candidates.length, "candidate fields");

    // Find the main prompt input (usually the first visible one)
    for (let i = 0; i < candidates.length; i++) {
      const field = candidates[i];
      const rect = field.getBoundingClientRect();
      log(`📏 Candidate ${i + 1}:`, {
        tagName: field.tagName,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visible: rect.width > 100 && rect.height > 30,
      });
      if (rect.width > 100 && rect.height > 30) {
        log("✅ Selected prompt field:", field);
        return field;
      }
    }

    log("⚠️ No visible field found, returning first candidate:", candidates[0]);
    return candidates[0];
  }

  // Find the ChatGPT input controls container (where microphone and send button are)
  function findInputControlsContainer(shouldLog = false) {
    const threadBottom =
      document.querySelector("#thread-bottom-container") || document;

    const findFirstByClassFragment = (rootEl, fragment) => {
      if (!rootEl) return null;
      const all = rootEl.querySelectorAll("*");
      for (const el of all) {
        const className = typeof el.className === "string" ? el.className : "";
        if (className && className.includes(fragment)) return el;
      }
      return null;
    };

    // Strategy 1 (preferred): unified composer -> [grid-area:trailing]
    const composerForm =
      threadBottom.querySelector('form[data-type="unified-composer"]') ||
      threadBottom.querySelector("form.group\\/composer") ||
      threadBottom.querySelector("form");

    if (composerForm) {
      const trailingGridArea =
        composerForm.querySelector(".\\[grid-area\\:trailing\\]") ||
        findFirstByClassFragment(composerForm, "[grid-area:trailing]");

      if (trailingGridArea) {
        // In the DOM you shared, the inner container is: "ms-auto flex items-center gap-1.5"
        const innerControls =
          trailingGridArea.querySelector(".ms-auto") || trailingGridArea;
        if (shouldLog) {
          log("✅ Found ChatGPT trailing controls container:", innerControls);
        }
        return innerControls;
      }
    }

    // Strategy 2: Look for send button and find its flex container (older DOMs)
    const sendButton = document.querySelector('[data-testid="send-button"]');
    if (sendButton) {
      if (shouldLog) log("📍 Found send button:", sendButton);

      let container = sendButton.parentElement;
      while (container && container !== document.body) {
        const styles = window.getComputedStyle(container);
        const className =
          typeof container.className === "string" ? container.className : "";

        if (
          styles.display === "flex" &&
          (className.includes("gap") || className.includes("items-center"))
        ) {
          if (shouldLog)
            log("✅ Found flex container for send button:", container);
          return container;
        }

        container = container.parentElement;
      }

      if (shouldLog) {
        log(
          "📍 Using send button parent as container:",
          sendButton.parentElement,
        );
      }
      return sendButton.parentElement;
    }

    // Strategy 3: very loose fallback - trailing area by class fragment
    const trailingByClass =
      findFirstByClassFragment(threadBottom, "grid-area:trailing") ||
      findFirstByClassFragment(threadBottom, "[grid-area:trailing]") ||
      document.querySelector('[class*="trailing"]');
    if (trailingByClass) {
      if (shouldLog)
        log("📍 Found trailing container fallback:", trailingByClass);
      return trailingByClass;
    }

    log("⚠️ No suitable controls container found");
    return null;
  }

  // Get text from contenteditable or textarea
  function getPromptText(field) {
    if (!field) return "";
    if (field.contentEditable === "true") {
      return field.textContent || field.innerText || "";
    }
    return field.value || "";
  }

  // Set text in contenteditable or textarea
  function setPromptText(field, text) {
    if (!field) return;

    if (field.contentEditable === "true") {
      field.textContent = text;

      // Trigger input event for React
      field.dispatchEvent(new Event("input", { bubbles: true }));

      // Place cursor at end
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        const node = field.firstChild || field;
        if (node) {
          range.setStart(node, node.length || 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch (err) {
        field.focus();
      }
    } else {
      field.value = text;
      field.selectionStart = field.selectionEnd = text.length;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  // Create the AI toolbar with inline buttons
  function createAIToolbar() {
    const toolbar = document.createElement("div");
    toolbar.id = "sp-ai-toolbar";
    toolbar.setAttribute("data-superprompt", "ai-toolbar");
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 8px;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    `;

    // Add hover effect to container
    toolbar.addEventListener("mouseenter", () => {
      toolbar.style.opacity = "1";
    });
    toolbar.addEventListener("mouseleave", () => {
      toolbar.style.opacity = "0.8";
    });

    // Proofread button - compact inline style
    const proofreadBtn = createInlineButton(
      "✓",
      "Proofread",
      "sp-ai-proofread",
      handleProofread,
    );

    // Optimize button - compact inline style
    const optimizeBtn = createInlineButton(
      "✨",
      "Optimize",
      "sp-ai-optimize",
      handleOptimize,
    );

    toolbar.appendChild(proofreadBtn);
    toolbar.appendChild(optimizeBtn);

    return toolbar;
  }

  // Create a compact inline button that matches ChatGPT's input controls
  function createInlineButton(icon, title, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    // Use ChatGPT's native control button class to inherit hover/active/focus styles
    button.className = `composer-btn sp-ai-button ${className}`;
    button.title = title;
    button.setAttribute("aria-label", title);

    // Icon only for compact design
    const iconSpan = document.createElement("span");
    iconSpan.className = "sp-ai-icon";
    iconSpan.textContent = icon;
    button.appendChild(iconSpan);

    // Keep styling minimal so ChatGPT can control hover states via `.composer-btn`
    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      cursor: pointer;
      padding: 0;
    `;

    // Ensure our text icon behaves like an icon (and doesn't intercept pointer events)
    iconSpan.style.cssText = `
      font-size: 16px;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    `;

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isProcessing) {
        onClick(button);
      }
    });

    return button;
  }

  // Set button loading state for inline buttons
  function setButtonLoading(button, loading) {
    const icon = button.querySelector(".sp-ai-icon");

    if (loading) {
      button.disabled = true;
      button.style.opacity = "0.6";
      button.style.cursor = "not-allowed";
      icon.textContent = "⏳";
      // Add subtle animation
      icon.style.animation = "spin 1s linear infinite";
    } else {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      icon.style.animation = "none";

      // Restore original icon
      if (button.classList.contains("sp-ai-proofread")) {
        icon.textContent = "✓";
      } else if (button.classList.contains("sp-ai-optimize")) {
        icon.textContent = "✨";
      }
    }
  }

  // Handle Proofread action
  async function handleProofread(button) {
    const promptField = findPromptField();
    if (!promptField) {
      showNotification("Could not find prompt field", "error");
      return;
    }

    const text = getPromptText(promptField).trim();
    if (!text) {
      showNotification("Please enter text to proofread", "warning");
      return;
    }

    try {
      isProcessing = true;
      setButtonLoading(button, true);

      // Send message to content script to use chromeAI
      const response = await new Promise((resolve) => {
        window.postMessage(
          {
            type: "sp-proofread-request",
            text: text,
            source: "chatgpt-ai-buttons",
          },
          "*",
        );

        // Listen for response
        const handler = (event) => {
          if (event.data?.type === "sp-proofread-response") {
            window.removeEventListener("message", handler);
            resolve(event.data);
          }
        };
        window.addEventListener("message", handler);

        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener("message", handler);
          resolve({ error: "Timeout" });
        }, 30000);
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.corrected) {
        setPromptText(promptField, response.corrected);
        showNotification("Text proofread successfully!", "success");
      }
    } catch (err) {
      error("Proofread failed:", err);
      showNotification(
        err.message ||
          "Failed to proofread. Please check AI Features settings.",
        "error",
      );
    } finally {
      isProcessing = false;
      setButtonLoading(button, false);
    }
  }

  // Handle Optimize action
  async function handleOptimize(button) {
    const promptField = findPromptField();
    if (!promptField) {
      showNotification("Could not find prompt field", "error");
      return;
    }

    const text = getPromptText(promptField).trim();
    if (!text) {
      showNotification("Please enter text to optimize", "warning");
      return;
    }

    try {
      isProcessing = true;
      setButtonLoading(button, true);

      // Send message to content script to use chromeAI
      const response = await new Promise((resolve) => {
        window.postMessage(
          {
            type: "sp-optimize-request",
            text: text,
            source: "chatgpt-ai-buttons",
          },
          "*",
        );

        // Listen for response
        const handler = (event) => {
          if (event.data?.type === "sp-optimize-response") {
            window.removeEventListener("message", handler);
            resolve(event.data);
          }
        };
        window.addEventListener("message", handler);

        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener("message", handler);
          resolve({ error: "Timeout" });
        }, 30000);
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.optimized) {
        setPromptText(promptField, response.optimized);
        showNotification("Text optimized successfully!", "success");
      }
    } catch (err) {
      error("Optimize failed:", err);
      showNotification(
        err.message || "Failed to optimize. Please check AI Features settings.",
        "error",
      );
    } finally {
      isProcessing = false;
      setButtonLoading(button, false);
    }
  }

  // Show notification toast
  function showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `sp-ai-toast sp-ai-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      animation: slideInUp 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ${
        type === "success"
          ? "background: #10b981; color: white;"
          : type === "error"
            ? "background: #ef4444; color: white;"
            : type === "warning"
              ? "background: #f59e0b; color: white;"
              : "background: rgba(var(--accent-r), var(--accent-g), var(--accent-b), 1); color: white;"
      }
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOutDown 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Inject the AI buttons into the input controls area
  function injectToolbar() {
    log("🔧 injectToolbar called - integrating into ChatGPT controls");

    if (!aiEnabled) {
      log("❌ AI Features disabled, skipping toolbar injection");
      return;
    }

    log("🎯 Looking for trailing controls container...");
    const container = findInputControlsContainer();
    if (!container) {
      warn("❌ Cannot find suitable controls container to inject AI buttons");
      return;
    }
    log("✅ Controls container found:", container);
    log("📍 Container class:", container.className);
    log(
      "📍 Container parent:",
      container.parentElement?.tagName,
      container.parentElement?.className,
    );

    // Don't inject if already present
    if (document.querySelector("#sp-ai-toolbar")) {
      log("⚠️ AI buttons already present anywhere, skipping");
      return;
    }

    // Verify this looks like the trailing controls container (send/voice/mic)
    const likelyControlButton =
      container.querySelector(
        'button[class*="composer-submit-button-color"]',
      ) ||
      container.querySelector('[data-testid="send-button"]') ||
      container.querySelector("button.composer-btn") ||
      container.querySelector('button[aria-label*="Dictate"]') ||
      container.querySelector('button[aria-label*="Voice"]') ||
      container.querySelector('button[aria-label*="Send"]');

    if (!likelyControlButton) {
      warn(
        "❌ Container doesn't look like ChatGPT controls (no expected buttons found)",
      );
      return;
    }

    // Create AI buttons toolbar
    log("🎭 Creating integrated AI buttons...");
    aiToolbar = createAIToolbar();

    // Prefer inserting right before the trailing action button (Send / Voice)
    const actionButton =
      container.querySelector(
        'button[class*="composer-submit-button-color"]',
      ) ||
      container.querySelector('[data-testid="send-button"]') ||
      container.querySelector('button[aria-label*="Send"]') ||
      container.querySelector('button[aria-label*="Voice"]') ||
      container.querySelector('button[type="submit"]');

    if (actionButton && actionButton.parentNode === container) {
      log("📌 Inserting AI buttons before trailing action button...");
      actionButton.parentNode.insertBefore(aiToolbar, actionButton);
    } else {
      log("📌 Inserting AI buttons at end of controls container...");
      container.appendChild(aiToolbar);
    }

    log("✅ 🎉 AI buttons integrated successfully into ChatGPT controls!");
  }

  // Remove the toolbar
  function removeToolbar() {
    if (aiToolbar && aiToolbar.parentNode) {
      aiToolbar.remove();
      aiToolbar = null;
      log("AI toolbar removed");
    }
  }

  // Monitor for prompt field changes
  function watchForPromptField() {
    log("👀 Starting to watch for prompt field...");
    const observer = new MutationObserver(() => {
      const container = findInputControlsContainer(); // Don't log on every mutation

      // Only react when we actually find a new container (reduces noise significantly)
      if (container && container !== lastPromptContainer) {
        log("📍 New container detected, updating reference");
        lastPromptContainer = container;
        removeToolbar();
        if (aiEnabled) {
          log("✅ AI enabled, will inject toolbar in 100ms");
          setTimeout(() => injectToolbar(), 100);
        } else {
          log("❌ AI disabled, not injecting toolbar");
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    log("Watching for prompt field changes");
  }

  // Listen for AI Features toggle via message events
  function listenForAIToggle() {
    window.addEventListener("message", (event) => {
      if (event.data?.type === "sp-ai-features-changed") {
        const newEnabled = event.data.enabled ?? false;
        if (newEnabled !== aiEnabled) {
          aiEnabled = newEnabled;
          log("AI Features toggled:", aiEnabled ? "enabled" : "disabled");

          if (aiEnabled) {
            injectToolbar();
          } else {
            removeToolbar();
          }
        }
      }
    });
  }

  // Add CSS animations
  function injectStyles() {
    if (document.getElementById("sp-ai-toolbar-styles")) return;

    const style = document.createElement("style");
    style.id = "sp-ai-toolbar-styles";
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slideOutDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }

      #sp-ai-toolbar {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .sp-ai-button:active {
        transform: scale(0.95) !important;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize the module
  async function init() {
    log("🚀 Initializing ChatGPT AI Buttons Module...");

    // Check AI Features status
    log("📡 Checking AI Features status...");
    await checkAIFeatures();
    log("📊 AI Features check complete:", aiEnabled ? "ENABLED" : "DISABLED");

    // Inject styles
    log("🎨 Injecting styles...");
    injectStyles();

    // Watch for prompt field and inject toolbar
    log("👁️ Setting up prompt field watcher...");
    watchForPromptField();

    // Listen for AI toggle
    log("🔄 Setting up toggle listener...");
    listenForAIToggle();

    // Initial injection
    setTimeout(() => {
      log("⏰ Initial injection timeout fired, aiEnabled:", aiEnabled);

      // Debug: log all potential containers
      const sendButton = document.querySelector('[data-testid="send-button"]');
      const micButton = document.querySelector(
        '[aria-label*="ictate"], [aria-label*="microphone"]',
      );
      const trailingDivs = document.querySelectorAll('[class*="trailing"]');
      const gapDivs = document.querySelectorAll(".gap-1\\.5, .gap-2");

      log("🔍 Debug elements:", {
        sendButton: !!sendButton,
        sendButtonParent: sendButton?.parentElement?.className,
        sendButtonGrandParent:
          sendButton?.parentElement?.parentElement?.className,
        micButton: !!micButton,
        micButtonParent: micButton?.parentElement?.className,
        trailingDivs: trailingDivs.length,
        gapDivs: gapDivs.length,
      });

      const container = findInputControlsContainer(true); // Log on initial setup
      log("📦 Container found:", !!container);
      if (container) {
        log("📍 Container details:", {
          tagName: container.tagName,
          className: container.className,
          id: container.id,
        });
      }
      if (aiEnabled && container) {
        log("✅ Injecting toolbar now...");
        injectToolbar();
      } else {
        log("❌ Not injecting:", { aiEnabled, containerFound: !!container });
      }
    }, 1000);

    log("✅ Initialized successfully");
  }

  // Start the module
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
