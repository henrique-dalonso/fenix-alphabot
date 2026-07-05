// ������������������������������������������������������������������������������
// ��                  SUPERPROMPT CONVERSATION STYLING                        ��
// ��         Premium visual enhancements for conversation turns                ��
// ��         3 different styles: Elegant Gradient, Minimal Border, Refined Glass ��
// ������������������������������������������������������������������������������

(function () {
  "use strict";

  // ⚠️ PLATFORM CHECK: This module is ChatGPT-only
  const isChatGPT =
    window.location.hostname.includes("chatgpt.com") ||
    window.location.hostname.includes("chat.openai.com") ||
    window.location.hostname.includes("openai.com");

  if (!isChatGPT) {
    // Silently skip on non-ChatGPT platforms
    return;
  }

  // 🔧 Development Mode - Set to false for production to reduce console noise
  const DEV_MODE = false; // Enabled for debugging theme issues

  // Conditional logging helpers
  const devLog = (...args) => DEV_MODE && console.log(...args);
  const devWarn = (...args) => DEV_MODE && console.warn(...args);
  // Always log errors
  const devError = (...args) => console.error(...args);

  if (window.SuperPromptConversationStyling) {
    devLog("✅ [SP-ConvoStyling] Module already loaded, skipping");
    return;
  }

  const STYLE_ID = "sp-premium-conversation-style";
  const DATA_FLAG = "spPremiumStyled";

  let currentSettings = {
    enabled: false, // Default disabled for new users (matches store default)
    styleType: "elegant-gradient",
  };

  // Initialize from localStorage (simple and reliable)
  function initializeFromStorage() {
    try {
      // Read from Zustand's persisted store
      const stored = localStorage.getItem("sp-conversation-style");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state) {
          currentSettings = {
            enabled: parsed.state.enabled ?? false,
            styleType: parsed.state.styleType ?? "elegant-gradient",
          };
          devLog(
            "✅ [SP-ConvoStyling] Initialized from localStorage:",
            currentSettings,
          );
        }
      }
    } catch (e) {
      devWarn("⚠️ [SP-ConvoStyling] Failed to read from localStorage:", e);
    }

    // Apply initial styles
    updateStyles();

    // Watch for theme changes
    observeThemeChanges();
  }

  /**
   * Observe ChatGPT's color-scheme changes and re-apply styles
   */
  function observeThemeChanges() {
    const htmlElement = document.documentElement;

    // Apply initial class
    updateChatGPTThemeClass();

    // Watch for style attribute changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const colorScheme =
            htmlElement.style.colorScheme ||
            getComputedStyle(htmlElement).colorScheme;
          devLog(
            "🎨 [SP-ConvoStyling] Theme changed, color-scheme:",
            colorScheme,
          );
          updateChatGPTThemeClass();
          updateStyles();
        }
      });
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    devLog("👀 [SP-ConvoStyling] Theme observer active");
  }

  /**
   * Update body class to reflect ChatGPT's current color-scheme
   */
  function updateChatGPTThemeClass() {
    const isLight = isChatGPTLightMode();
    const bodyElement = document.body;

    if (isLight) {
      bodyElement.classList.add("sp-chatgpt-light-mode");
      bodyElement.classList.remove("sp-chatgpt-dark-mode");
      devLog("☀️ [SP-ConvoStyling] ChatGPT light mode detected");
    } else {
      bodyElement.classList.add("sp-chatgpt-dark-mode");
      bodyElement.classList.remove("sp-chatgpt-light-mode");
      devLog("🌙 [SP-ConvoStyling] ChatGPT dark mode detected");
    }
  }

  /**
   * Detect if ChatGPT is in light mode based on color-scheme
   */
  function isChatGPTLightMode() {
    const htmlElement = document.documentElement;
    const colorScheme =
      htmlElement.style.colorScheme ||
      getComputedStyle(htmlElement).colorScheme ||
      "dark";
    const isLight = colorScheme.includes("light");

    devLog(
      "🎨 [CONVO-STYLING] ChatGPT color-scheme:",
      colorScheme,
      "isLight:",
      isLight,
    );

    return isLight;
  }

  /**
   * Transform @media (prefers-color-scheme) to use ChatGPT's color-scheme instead of system preference
   * This ensures conversation themes adapt to ChatGPT's light/dark mode, not the OS theme
   */
  function transformMediaQueries(cssString) {
    let result = cssString;

    // Replace @media (prefers-color-scheme: dark) with body class selector
    result = result.replace(
      /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/gi,
      ".sp-chatgpt-dark-mode {",
    );

    // Replace @media (prefers-color-scheme: light) with body class selector
    result = result.replace(
      /@media\s*\(prefers-color-scheme:\s*light\)\s*\{/gi,
      ".sp-chatgpt-light-mode {",
    );

    devLog(
      "🔄 [SP-ConvoStyling] Transformed media queries to ChatGPT color-scheme classes",
    );

    return result;
  }

  // Listen for storage changes (from Zustand store updates)
  window.addEventListener("storage", (event) => {
    if (event.key === "sp-conversation-style" && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.state) {
          devLog("🎨 [SP-ConvoStyling] Storage updated:", parsed.state);
          currentSettings = {
            enabled: parsed.state.enabled ?? currentSettings.enabled,
            styleType: parsed.state.styleType ?? currentSettings.styleType,
          };
          updateStyles();
        }
      } catch (e) {
        devWarn("Failed to parse storage update:", e);
      }
    }
  });

  // Listen for custom events (for same-tab updates since storage event doesn't fire in same tab)
  window.addEventListener("sp-conversation-style-changed", (event) => {
    devLog("🎨 [SP-ConvoStyling] Style changed event:", event.detail);
    if (event.detail) {
      currentSettings = {
        enabled: event.detail.enabled ?? currentSettings.enabled,
        styleType: event.detail.styleType ?? currentSettings.styleType,
      };
      updateStyles();
    }
  });

  function getStylesForType(styleType) {
    const styles = {
      "dynamic-accent": `
        /* 🎨 DYNAMIC ACCENT - Follows User's Theme Color 🎨 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: transparent !important;
        }

        /* Main Background - Keep default or slightly tinted? Let's keep default for now to blend in */
        /* But we can add a very subtle tint of the accent to the page background if we wanted. 
           For now, let's focus on the messages. */

        /* User Message */
        [data-message-author-role="user"].sp-premium-message {
          background: var(--color-accent-light, rgba(20, 184, 166, 0.1)) !important;
          border: 1px solid var(--color-accent, #14b8a6) !important;
          border-radius: 12px !important;
          padding: 1.5rem !important;
          box-shadow: 0 4px 12px var(--color-accent-shadow, rgba(20, 184, 166, 0.2)) !important;
          color: var(--color-text-primary) !important;
          position: relative !important;
        }

        /* User Avatar - Use Accent Color */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 12px !important;
          left: 12px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          background: var(--color-accent, #14b8a6) !important;
          box-shadow: 0 0 0 2px var(--color-accent-light, rgba(20, 184, 166, 0.2)) !important;
          z-index: 10 !important;
        }

        /* "You" label */
        [data-message-author-role="user"].sp-premium-message::after {
          content: 'You' !important;
          position: absolute !important;
          top: 18px !important;
          left: 52px !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: var(--color-accent, #14b8a6) !important;
          letter-spacing: 0.025em !important;
        }

        /* Adjust padding for avatar */
        [data-message-author-role="user"].sp-premium-message {
          padding-top: 3rem !important;
        }

        /* Assistant Message */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(90deg, var(--color-accent-light, rgba(20, 184, 166, 0.05)) 0%, transparent 100%) !important;
          border: 1px solid transparent !important;
          border-left: 4px solid var(--color-accent, #14b8a6) !important;
          border-radius: 4px 12px 12px 4px !important;
          padding: 1.5rem !important;
          transition: all 0.3s ease !important;
          box-shadow: -4px 0 16px -4px var(--color-accent-shadow, rgba(20, 184, 166, 0.3)) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          background: linear-gradient(90deg, var(--color-accent-light, rgba(20, 184, 166, 0.1)) 0%, transparent 100%) !important;
          box-shadow: -4px 0 20px -2px var(--color-accent-shadow, rgba(20, 184, 166, 0.4)) !important;
        }

        /* Input Area */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          border: 1px solid var(--color-accent, #14b8a6) !important;
          box-shadow: 0 0 0 1px var(--color-accent-light, rgba(20, 184, 166, 0.1)) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          box-shadow: 0 0 0 2px var(--color-accent, #14b8a6), 0 0 12px var(--color-accent-shadow, rgba(20, 184, 166, 0.3)) !important;
        }
      `,
      "studio-minimal": `
        /* 📐 STUDIO MINIMAL - Swiss Design Inspired 📐 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: transparent !important;
        }

        /* Main Background */
        main .flex.flex-col.text-token-text-primary {
          background: #F5F5F7 !important;
        }
        .sp-chatgpt-dark-mode main .flex.flex-col.text-token-text-primary {
          background: #09090B !important; /* Deep Zinc-950 */
        }

        /* User Message */
        [data-message-author-role="user"].sp-premium-message {
          background: #FFFFFF !important;
          border: 1px solid #E5E5E5 !important;
          border-radius: 4px !important;
          padding: 1.5rem !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
          color: #1D1D1F !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
        
        /* Dark Mode User Message - Robust Selectors */
        .sp-chatgpt-dark-mode [data-message-author-role="user"].sp-premium-message,
        [class*="dark"] [data-message-author-role="user"].sp-premium-message {
          background: #27272A !important; /* Zinc-800 */
          border: 1px solid #3F3F46 !important; /* Zinc-700 */
          color: #F4F4F5 !important; /* Zinc-100 */
          box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
        }

        /* Assistant Message - Now Boxed in Dark Mode */
        [data-message-author-role="assistant"].sp-premium-message {
          background: transparent !important;
          border: none !important;
          padding: 1.5rem !important;
          color: #1D1D1F !important;
        }
        
        /* Dark Mode Assistant Message - Robust Selectors */
        .sp-chatgpt-dark-mode [data-message-author-role="assistant"].sp-premium-message,
        [class*="dark"] [data-message-author-role="assistant"].sp-premium-message {
          background: #18181B !important; /* Zinc-900 */
          border: 1px solid #27272A !important; /* Zinc-800 */
          border-radius: 4px !important;
          padding: 1.5rem !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
          color: #E4E4E7 !important; /* Zinc-200 */
          box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
        }

        /* Ensure text colors inside assistant message are correct */
        .sp-chatgpt-dark-mode [data-message-author-role="assistant"].sp-premium-message *,
        [class*="dark"] [data-message-author-role="assistant"].sp-premium-message * {
          color: #E4E4E7 !important;
        }

        /* Input Area */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: #FFFFFF !important;
          border: 1px solid #E5E5E5 !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03) !important;
        }
        
        .sp-chatgpt-dark-mode .bg-token-bg-primary.cursor-text[class*="grid-cols"],
        .sp-chatgpt-dark-mode div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"],
        [class*="dark"] .bg-token-bg-primary.cursor-text[class*="grid-cols"],
        [class*="dark"] div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: #18181B !important; /* Zinc-900 */
          border: 1px solid #3F3F46 !important; /* Zinc-700 */
          box-shadow: none !important;
        }
      `,
      "creative-professional": `
        /* 🎨 CREATIVE PROFESSIONAL - Sleek & Modern 🎨 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: transparent !important;
        }

        /* User Message */
        [data-message-author-role="user"].sp-premium-message {
          background: #f1f5f9 !important; /* Slate-100 */
          border: none !important;
          border-left: 4px solid #334155 !important; /* Slate-700 */
          border-radius: 4px 12px 12px 4px !important;
          padding: 1.5rem !important;
          color: #0f172a !important; /* Slate-900 */
          box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        }

        /* Assistant Message */
        [data-message-author-role="assistant"].sp-premium-message {
          background: transparent !important;
          border: 1px solid #e2e8f0 !important; /* Slate-200 */
          border-radius: 12px !important;
          padding: 1.5rem !important;
          margin-top: 1rem !important;
        }

        /* Dark Mode Overrides */
        .sp-chatgpt-dark-mode [data-message-author-role="user"].sp-premium-message {
          background: #1e293b !important; /* Slate-800 */
          border-left: 4px solid #60a5fa !important; /* Blue-400 */
          color: #f8fafc !important; /* Slate-50 */
          box-shadow: none !important;
        }

        .sp-chatgpt-dark-mode [data-message-author-role="assistant"].sp-premium-message {
          border: 1px solid #334155 !important; /* Slate-700 */
          background: rgba(30, 41, 59, 0.3) !important; /* Slate-800 with opacity */
        }
        
        /* Message Overlays - Ensure they match */
        .sp-message-overlay {
           border-radius: 6px !important;
           background: rgba(255, 255, 255, 0.9) !important;
           border: 1px solid #e2e8f0 !important;
           color: #475569 !important;
        }
        
        .sp-chatgpt-dark-mode .sp-message-overlay {
           background: rgba(30, 41, 59, 0.9) !important;
           border: 1px solid #334155 !important;
           color: #94a3b8 !important;
        }
      `,
      "elegant-gradient": `
        /* 🎨 SUPERPROMPT APP THEME - Premium Dark Design with Avatars 🎨 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        [data-message-author-role="user"].sp-premium-message {
          --user-message-bubble-color: transparent !important;
        }

        /* Clean dark background - remove ChatGPT's diagonal stripe pattern */
        main .flex.flex-col.text-token-text-primary {
          background: #0B1120 !important;
          background-image: none !important;
        }

        /* Override any background patterns on the main container */
        main.relative,
        main[class*="relative"] {
          background: #0B1120 !important;
          background-image: none !important;
        }

        /* Clean the scrollable conversation area */
        div[class*="react-scroll-to-bottom"] {
          background: #0B1120 !important;
          background-image: none !important;
        }

        /* Reduce massive padding on conversation container */
        .text-base.mx-auto[class*="pt-"] {
          padding-top: 1rem !important;
        }

        /* Conversation article containers - Invisible, don't interfere */
        article.w-full {
          background: transparent !important;
          border-radius: 16px !important;
          padding: 1.5rem !important;
          padding-bottom: 1.5rem !important;
          margin: 0 0 0 0 !important;
          border: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          transition: none !important;
          position: relative !important;
        }

        article.w-full:hover {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* User message with avatar styling - PREMIUM TEAL */
        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(135deg, 
            rgba(13, 148, 136, 0.15) 0%, 
            rgba(20, 184, 166, 0.12) 50%,
            rgba(15, 118, 110, 0.15) 100%) !important;
          border: 2px solid rgba(20, 184, 166, 0.5) !important;
          border-radius: 16px !important;
          padding: 1rem 1.25rem !important;
          padding-top: 2.75rem !important;
          padding-bottom: 1rem !important;
          margin: 0rem 0 !important;
          box-shadow: 
            0 4px 20px rgba(20, 184, 166, 0.25),
            0 2px 8px rgba(20, 184, 166, 0.15),
            0 0 0 1px rgba(20, 184, 166, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          backdrop-filter: blur(12px) saturate(1.3) !important;
        }

        /* First message in article needs extra top space for avatar */
        article.w-full [data-message-author-role="user"].sp-premium-message:first-of-type,
        article.w-full [data-message-author-role="assistant"].sp-premium-message:first-of-type {
          margin-top: 2.5rem !important;
        }

        /* User avatar - extract from ChatGPT profile button */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 12px !important;
          left: 12px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%) !important;
          background-image: var(--user-avatar-url, linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)) !important;
          background-size: cover !important;
          background-position: center !important;
          box-shadow: 
            0 0 0 3px rgba(20, 184, 166, 0.4),
            0 0 20px rgba(20, 184, 166, 0.6),
            0 4px 12px rgba(20, 184, 166, 0.5) !important;
          z-index: 10 !important;
        }

        /* "You" label next to avatar */
        [data-message-author-role="user"].sp-premium-message::after {
          content: 'You' !important;
          position: absolute !important;
          top: 18px !important;
          left: 52px !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: #14B8A6 !important;
          letter-spacing: 0.025em !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          background: linear-gradient(135deg, 
            rgba(13, 148, 136, 0.22) 0%, 
            rgba(20, 184, 166, 0.18) 50%,
            rgba(15, 118, 110, 0.22) 100%) !important;
          border-color: rgba(20, 184, 166, 0.7) !important;
          border-width: 2px !important;
          box-shadow: 
            0 6px 32px rgba(20, 184, 166, 0.35),
            0 3px 12px rgba(20, 184, 166, 0.25),
            0 0 0 1px rgba(20, 184, 166, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 60px rgba(20, 184, 166, 0.15) !important;
          transform: translateY(-3px) scale(1.01) !important;
        }

        /* Assistant message with ChatGPT avatar - PREMIUM DARK */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.92) 0%, 
            rgba(17, 24, 39, 0.95) 50%,
            rgba(15, 23, 42, 0.92) 100%) !important;
          border: 1px solid rgba(51, 65, 85, 0.4) !important;
          border-radius: 16px !important;
          padding: 1rem 1.25rem !important;
          padding-top: 2.75rem !important;
          padding-bottom: 1rem !important;
          margin: 0.75rem 0 !important;
          box-shadow: 
            0 4px 24px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          backdrop-filter: blur(12px) saturate(1.1) !important;
        }

        /* ChatGPT avatar */
        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 12px !important;
          left: 12px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          background: #10A37F !important;
          background-image: url('data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M11.2475 18.25C10.6975 18.25 10.175 18.1455 9.67999 17.9365C9.18499 17.7275 8.74499 17.436 8.35999 17.062C7.94199 17.205 7.50749 17.2765 7.05649 17.2765C6.31949 17.2765 5.63749 17.095 5.01049 16.732C4.38349 16.369 3.87749 15.874 3.49249 15.247C3.11849 14.62 2.93149 13.9215 2.93149 13.1515C2.93149 12.8325 2.97549 12.486 3.06349 12.112C2.62349 11.705 2.28249 11.2375 2.04049 10.7095C1.79849 10.1705 1.67749 9.6095 1.67749 9.0265C1.67749 8.4325 1.80399 7.8605 2.05699 7.3105C2.30999 6.7605 2.66199 6.2875 3.11299 5.8915C3.57499 5.4845 4.10849 5.204 4.71349 5.05C4.83449 4.423 5.08749 3.862 5.47249 3.367C5.86849 2.861 6.35249 2.465 6.92449 2.179C7.49649 1.893 8.10699 1.75 8.75599 1.75C9.30599 1.75 9.82849 1.8545 10.3235 2.0635C10.8185 2.2725 11.2585 2.564 11.6435 2.938C12.0615 2.795 12.496 2.7235 12.947 2.7235C13.684 2.7235 14.366 2.905 14.993 3.268C15.62 3.631 16.1205 4.126 16.4945 4.753C16.8795 5.38 17.072 6.0785 17.072 6.8485C17.072 7.1675 17.028 7.514 16.94 7.888C17.38 8.295 17.721 8.768 17.963 9.307C18.205 9.835 18.326 10.3905 18.326 10.9735C18.326 11.5675 18.1995 12.1395 17.9465 12.6895C17.6935 13.2395 17.336 13.718 16.874 14.125C16.423 14.521 15.895 14.796 15.29 14.95C15.169 15.577 14.9105 16.138 14.5145 16.633C14.1295 17.139 13.651 17.535 13.079 17.821C12.507 18.107 11.8965 18.25 11.2475 18.25ZM7.17199 16.1875C7.72199 16.1875 8.20049 16.072 8.60749 15.841L11.7095 14.059C11.8195 13.982 11.8745 13.8775 11.8745 13.7455V12.3265L7.88149 14.62C7.63949 14.763 7.39749 14.763 7.15549 14.62L4.03699 12.8215C4.03699 12.8545 4.03149 12.893 4.02049 12.937C4.02049 12.981 4.02049 13.047 4.02049 13.135C4.02049 13.696 4.15249 14.213 4.41649 14.686C4.69149 15.148 5.07099 15.511 5.55499 15.775C6.03899 16.05 6.57799 16.1875 7.17199 16.1875ZM7.33699 13.498C7.40299 13.531 7.46349 13.5475 7.51849 13.5475C7.57349 13.5475 7.62849 13.531 7.68349 13.498L8.92099 12.7885L4.94449 10.4785C4.70249 10.3355 4.58149 10.121 4.58149 9.835V6.2545C4.03149 6.4965 3.59149 6.8705 3.26149 7.3765C2.93149 7.8715 2.76649 8.4215 2.76649 9.0265C2.76649 9.5655 2.90399 10.0825 3.17899 10.5775C3.45399 11.0725 3.81149 11.4465 4.25149 11.6995L7.33699 13.498ZM11.2475 17.161C11.8305 17.161 12.3585 17.029 12.8315 16.765C13.3045 16.501 13.6785 16.138 13.9535 15.676C14.2285 15.214 14.366 14.697 14.366 14.125V10.561C14.366 10.429 14.311 10.33 14.201 10.264L12.947 9.538V14.1415C12.947 14.4275 12.826 14.642 12.584 14.785L9.46549 16.5835C10.0045 16.9685 10.5985 17.161 11.2475 17.161ZM11.8745 11.122V8.878L10.01 7.822L8.12899 8.878V11.122L10.01 12.178L11.8745 11.122ZM7.05649 5.8585C7.05649 5.5725 7.17749 5.358 7.41949 5.215L10.538 3.4165C9.99899 3.0315 9.40499 2.839 8.75599 2.839C8.17299 2.839 7.64499 2.971 7.17199 3.235C6.69899 3.499 6.32499 3.862 6.04999 4.324C5.78599 4.786 5.65399 5.303 5.65399 5.875V9.4225C5.65399 9.5545 5.70899 9.659 5.81899 9.736L7.05649 10.462V5.8585ZM15.4385 13.7455C15.9885 13.5035 16.423 13.1295 16.742 12.6235C17.072 12.1175 17.237 11.5675 17.237 10.9735C17.237 10.4345 17.0995 9.9175 16.8245 9.4225C16.5495 8.9275 16.192 8.5535 15.752 8.3005L12.6665 6.5185C12.6005 6.4745 12.54 6.458 12.485 6.469C12.43 6.469 12.375 6.4855 12.32 6.5185L11.0825 7.2115L15.0755 9.538C15.1965 9.604 15.2845 9.692 15.3395 9.802C15.4055 9.901 15.4385 10.022 15.4385 10.165V13.7455ZM12.122 5.3635C12.364 5.2095 12.606 5.2095 12.848 5.3635L15.983 7.195C15.983 7.118 15.983 7.019 15.983 6.898C15.983 6.37 15.851 5.8695 15.587 5.3965C15.334 4.9125 14.9655 4.5275 14.4815 4.2415C14.0085 3.9555 13.4585 3.8125 12.8315 3.8125C12.2815 3.8125 11.803 3.928 11.396 4.159L8.29399 5.941C8.18399 6.018 8.12899 6.1225 8.12899 6.2545V7.6735L12.122 5.3635Z"/></svg>') !important;
          background-size: 20px 20px !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          box-shadow: 
            0 0 0 3px rgba(16, 163, 127, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.3) !important;
          z-index: 10 !important;
        }

        /* ChatGPT icon in avatar */
        [data-message-author-role="assistant"].sp-premium-message::after {
          content: 'ChatGPT' !important;
          position: absolute !important;
          top: 18px !important;
          left: 52px !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          color: #10B981 !important;
          letter-spacing: 0.025em !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.98) 0%, 
            rgba(17, 24, 39, 1) 50%,
            rgba(15, 23, 42, 0.98) 100%) !important;
          border-color: rgba(71, 85, 105, 0.6) !important;
          box-shadow: 
            0 6px 32px rgba(0, 0, 0, 0.5),
            0 3px 12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(71, 85, 105, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3) !important;
          transform: translateY(-3px) scale(1.01) !important;
        }

        /* Text color adjustments for dark theme */
        [data-message-author-role="user"].sp-premium-message,
        [data-message-author-role="user"].sp-premium-message * {
          color: #E5E7EB !important;
        }

        [data-message-author-role="assistant"].sp-premium-message,
        [data-message-author-role="assistant"].sp-premium-message * {
          color: #F3F4F6 !important;
        }

        /* Input/Textarea styling - premium teal accent */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"],
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.95) 0%, 
            rgba(51, 65, 85, 0.90) 100%) !important;
          border: 1px solid rgba(20, 184, 166, 0.15) !important;
          border-radius: 12px !important;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          backdrop-filter: blur(8px) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within,
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          border-color: rgba(20, 184, 166, 0.4) !important;
          box-shadow: 
            0 4px 16px rgba(20, 184, 166, 0.15),
            0 0 0 2px rgba(20, 184, 166, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        }

        /* Composer parent background - rich dark gradient */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(15, 23, 42, 0.98) 0%,
            rgba(30, 41, 59, 0.95) 50%,
            rgba(51, 65, 85, 0.92) 100%) !important;
          transition: background 0.3s ease !important;
        }

        /* Premium glow effects on code blocks */
        [data-message-author-role="user"].sp-premium-message pre,
        [data-message-author-role="assistant"].sp-premium-message pre {
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(71, 85, 105, 0.3) !important;
          border-radius: 8px !important;
        }

        /* Links with teal accent */
        [data-message-author-role="user"].sp-premium-message a,
        [data-message-author-role="assistant"].sp-premium-message a {
          color: #2DD4BF !important;
          text-decoration: none !important;
          border-bottom: 1px solid rgba(45, 212, 191, 0.3) !important;
          transition: all 0.2s ease !important;
        }

        [data-message-author-role="user"].sp-premium-message a:hover,
        [data-message-author-role="assistant"].sp-premium-message a:hover {
          color: #14B8A6 !important;
          border-bottom-color: #14B8A6 !important;
          text-shadow: 0 0 8px rgba(20, 184, 166, 0.5) !important;
        }

        /* Character/word count overlay - from DOM: div.sp-overlay with bottom: -30px */
        .sp-overlay,
        div.sp-overlay,
        div[class="sp-overlay"] {
          bottom: 60px !important;
        }

        /* Also target the assistant-group-counter element */
        div[id*="assistant-group-counter"] {
          bottom: 60px !important;
        }
      `,

      "minimal-border": `
        /* 💬 MODERN BUBBLE - Professional Dark Messaging Design 💬 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }

        /* Dark background gradient */
        main .flex.flex-col.text-token-text-primary {
          background: linear-gradient(180deg,
            #1A1D21 0%,
            #202428 30%,
            #252931 60%,
            #2A2F38 100%) !important;
        }
        
        /* Modern Bubble - User messages (dark theme) */
        [data-message-author-role="user"].sp-premium-message {
            background: linear-gradient(135deg, 
              #2D5B6B 0%, 
              #2A5565 50%,
              #274F5F 100%) !important;
            border: 1px solid rgba(93, 179, 209, 0.35) !important;
            border-radius: 16px !important;
            padding: 1rem 1.25rem !important;
            margin: 0.75rem 0 !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.3),
              0 2px 4px rgba(0, 0, 0, 0.2) !important;
            color: #E5F2F7 !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: relative !important;
          }

          [data-message-author-role="user"].sp-premium-message * {
            color: #E5F2F7 !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover {
            box-shadow: 
              0 2px 4px rgba(0, 0, 0, 0.35),
              0 4px 8px rgba(0, 0, 0, 0.25) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: linear-gradient(135deg, 
              #353A42 0%, 
              #32373F 50%,
              #2F343C 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 16px !important;
            padding: 1rem 1.25rem !important;
            margin: 0.75rem 0 !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.4),
              0 2px 4px rgba(0, 0, 0, 0.3) !important;
            color: #E5E7EB !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: relative !important;
          }

          [data-message-author-role="assistant"].sp-premium-message * {
            color: #E5E7EB !important;
          }

          [data-message-author-role="assistant"].sp-premium-message:hover {
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow: 
              0 2px 4px rgba(0, 0, 0, 0.45),
              0 4px 8px rgba(0, 0, 0, 0.35) !important;
          }

          /* Input area - dark mode */
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: linear-gradient(135deg, 
              #353A42 0%, 
              #32373F 100%) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.3),
              0 2px 4px rgba(0, 0, 0, 0.2) !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"] *, 
          div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] *,
          .bg-token-bg-primary.cursor-text[class*="grid-cols"] textarea,
          div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] textarea,
          .bg-token-bg-primary.cursor-text[class*="grid-cols"] input,
          div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] input {
            color: #F3F4F6 !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
            border-color: #4A9FBA !important;
            box-shadow: 
              0 2px 4px rgba(0, 0, 0, 0.35),
              0 4px 8px rgba(0, 0, 0, 0.25),
              0 0 0 2px rgba(74, 159, 186, 0.25) !important;
          }

          /* Composer buttons - dark mode with specific selectors */
          [data-testid*="composer"] button,
          [data-testid="send-button"],
          button[aria-label*="Send"],
          button[aria-label*="Attach"],
          button[data-testid*="attach"],
          div[class*="cursor-text"] button,
          .composer-btn {
            color: #6BC5E0 !important;
          }

          [data-testid*="composer"] button:hover,
          [data-testid="send-button"]:hover,
          button[aria-label*="Send"]:hover,
          button[aria-label*="Attach"]:hover,
          button[data-testid*="attach"]:hover,
          div[class*="cursor-text"] button:hover,
          .composer-btn:hover {
            color: #5DB3D1 !important;
            background: rgba(93, 179, 209, 0.15) !important;
            border-radius: 8px !important;
          }

          /* Speech button - dark mode accent */
          [data-testid="composer-speech-button"],
          button[aria-label*="voice"],
          button[aria-label*="Voice"],
          .composer-speech-button {
            background: linear-gradient(135deg, #4A9FBA 0%, #3B8AA9 100%) !important;
            color: #FFFFFF !important;
            padding: 0.5rem !important;
            border-radius: 8px !important;
          }

          [data-testid="composer-speech-button"]:hover,
          button[aria-label*="voice"]:hover,
          button[aria-label*="Voice"]:hover,
          .composer-speech-button:hover {
            background: linear-gradient(135deg, #3B8AA9 0%, #2C7A98 100%) !important;
            box-shadow: 0 2px 8px rgba(74, 159, 186, 0.4) !important;
          }
      `,

      "refined-glass": `
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Refined Glass - User messages with sophisticated glass morphism */
        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.12) 0%, 
            rgba(255, 255, 255, 0.08) 50%,
            rgba(59, 130, 246, 0.06) 100%) !important;
          backdrop-filter: blur(16px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 14px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(59, 130, 246, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 1px !important;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.5) 50%, 
            transparent 100%) !important;
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.16) 0%, 
            rgba(255, 255, 255, 0.12) 50%,
            rgba(59, 130, 246, 0.10) 100%) !important;
          border-color: rgba(59, 130, 246, 0.35) !important;
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.12),
            0 4px 12px rgba(59, 130, 246, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
          transform: translateY(-2px) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Refined Glass - Assistant messages with sophisticated glass morphism */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.10) 0%, 
            rgba(255, 255, 255, 0.06) 50%,
            rgba(16, 185, 129, 0.06) 100%) !important;
          backdrop-filter: blur(16px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 14px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.08),
            0 2px 8px rgba(16, 185, 129, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.20) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 1px !important;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(16, 185, 129, 0.5) 50%, 
            transparent 100%) !important;
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.14) 0%, 
            rgba(255, 255, 255, 0.10) 50%,
            rgba(16, 185, 129, 0.10) 100%) !important;
          border-color: rgba(16, 185, 129, 0.30) !important;
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.12),
            0 4px 12px rgba(16, 185, 129, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.30) !important;
          transform: translateY(-2px) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Dark theme - Enhanced glassmorphism */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message {
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.08) 0%, 
              rgba(255, 255, 255, 0.04) 50%,
              rgba(59, 130, 246, 0.08) 100%) !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.40),
              0 2px 8px rgba(59, 130, 246, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover {
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.12) 0%, 
              rgba(255, 255, 255, 0.08) 50%,
              rgba(59, 130, 246, 0.12) 100%) !important;
            border-color: rgba(59, 130, 246, 0.40) !important;
            box-shadow: 
              0 12px 40px rgba(0, 0, 0, 0.50),
              0 4px 12px rgba(59, 130, 246, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.06) 0%, 
              rgba(255, 255, 255, 0.03) 50%,
              rgba(16, 185, 129, 0.08) 100%) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.40),
              0 2px 8px rgba(16, 185, 129, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message:hover {
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.10) 0%, 
              rgba(255, 255, 255, 0.06) 50%,
              rgba(16, 185, 129, 0.12) 100%) !important;
            border-color: rgba(16, 185, 129, 0.35) !important;
            box-shadow: 
              0 12px 40px rgba(0, 0, 0, 0.50),
              0 4px 12px rgba(16, 185, 129, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
          }

          /* Input area - dark mode */
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], 
          div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.06) 0%, 
              rgba(255, 255, 255, 0.03) 100%) !important;
            backdrop-filter: blur(12px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
          }
        }

        /* Input/Textarea styling - Refined Glass */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.16) 0%, 
            rgba(255, 255, 255, 0.08) 100%) !important;
          backdrop-filter: blur(12px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.20) !important;
          border-radius: 14px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.22) 0%, 
            rgba(255, 255, 255, 0.12) 100%) !important;
          border-color: rgba(59, 130, 246, 0.35) !important;
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.10),
            0 2px 8px rgba(59, 130, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
          transform: translateY(-1px) !important;
        }

        /* Composer parent background - matches theme */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(249, 250, 251, 0.95) 0%,
            rgba(243, 244, 246, 0.92) 50%,
            rgba(59, 130, 246, 0.03) 100%) !important;
          transition: background 0.3s ease !important;
        }

        /* Dark mode composer parent */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: linear-gradient(135deg,
              rgba(17, 24, 39, 0.95) 0%,
              rgba(31, 41, 55, 0.92) 50%,
              rgba(59, 130, 246, 0.05) 100%) !important;
          }
        }
      `,

      "neon-glow": `
        /* 🌟 CYBERPUNK NEON GLOW - Futuristic Design 🌟 */
        
        /* Prevent scrollbars from outer glows */
        [data-message-author-role="user"],
        [data-message-author-role="assistant"] {
          overflow: visible !important;
        }
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Neon Glow - User messages with electric blue/cyan */
        [data-message-author-role="user"].sp-premium-message {
          background: rgba(6, 182, 212, 0.03) !important;
          border: 2px solid rgba(6, 182, 212, 0.4) !important;
          border-radius: 8px !important;
          padding: 1rem 1.25rem !important;
          margin: 0.5rem 0 !important;
          position: relative !important;
          overflow: visible !important;
          box-shadow: 
            0 0 10px rgba(6, 182, 212, 0.2),
            0 0 20px rgba(6, 182, 212, 0.1),
            inset 0 0 20px rgba(6, 182, 212, 0.02) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Animated glow effect */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -2px !important;
          left: -2px !important;
          right: -2px !important;
          bottom: -2px !important;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(6, 182, 212, 0.4) 50%,
            transparent 70%
          ) !important;
          border-radius: 8px !important;
          opacity: 0 !important;
          filter: blur(10px) !important;
          transition: opacity 0.4s ease !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }

        /* Corner accent dots */
        [data-message-author-role="user"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 8px !important;
          left: 8px !important;
          width: 4px !important;
          height: 4px !important;
          background: rgb(6, 182, 212) !important;
          border-radius: 50% !important;
          box-shadow: 
            0 0 6px rgba(6, 182, 212, 0.8),
            0 0 12px rgba(6, 182, 212, 0.4) !important;
          animation: neonPulse 2s ease-in-out infinite !important;
        }

        @keyframes neonPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          border-color: rgba(6, 182, 212, 0.7) !important;
          background: rgba(6, 182, 212, 0.06) !important;
          box-shadow: 
            0 0 15px rgba(6, 182, 212, 0.4),
            0 0 30px rgba(6, 182, 212, 0.2),
            0 0 45px rgba(6, 182, 212, 0.1),
            inset 0 0 25px rgba(6, 182, 212, 0.05) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Neon Glow - Assistant messages with electric purple/magenta */
        [data-message-author-role="assistant"].sp-premium-message {
          background: rgba(168, 85, 247, 0.03) !important;
          border: 2px solid rgba(168, 85, 247, 0.4) !important;
          border-radius: 8px !important;
          padding: 1rem 1.25rem !important;
          margin: 0.5rem 0 !important;
          position: relative !important;
          overflow: visible !important;
          box-shadow: 
            0 0 10px rgba(168, 85, 247, 0.2),
            0 0 20px rgba(168, 85, 247, 0.1),
            inset 0 0 20px rgba(168, 85, 247, 0.02) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -2px !important;
          left: -2px !important;
          right: -2px !important;
          bottom: -2px !important;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(168, 85, 247, 0.4) 50%,
            transparent 70%
          ) !important;
          border-radius: 8px !important;
          opacity: 0 !important;
          filter: blur(10px) !important;
          transition: opacity 0.4s ease !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 8px !important;
          left: 8px !important;
          width: 4px !important;
          height: 4px !important;
          background: rgb(168, 85, 247) !important;
          border-radius: 50% !important;
          box-shadow: 
            0 0 6px rgba(168, 85, 247, 0.8),
            0 0 12px rgba(168, 85, 247, 0.4) !important;
          animation: neonPulse 2s ease-in-out infinite 0.5s !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          border-color: rgba(168, 85, 247, 0.7) !important;
          background: rgba(168, 85, 247, 0.06) !important;
          box-shadow: 
            0 0 15px rgba(168, 85, 247, 0.4),
            0 0 30px rgba(168, 85, 247, 0.2),
            0 0 45px rgba(168, 85, 247, 0.1),
            inset 0 0 25px rgba(168, 85, 247, 0.05) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Dark theme enhancements */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message {
            background: rgba(6, 182, 212, 0.05) !important;
            border-color: rgba(6, 182, 212, 0.5) !important;
            box-shadow: 
              0 0 15px rgba(6, 182, 212, 0.25),
              0 0 25px rgba(6, 182, 212, 0.15),
              inset 0 0 25px rgba(6, 182, 212, 0.03) !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover {
            border-color: rgba(6, 182, 212, 0.8) !important;
            background: rgba(6, 182, 212, 0.08) !important;
            box-shadow: 
              0 0 20px rgba(6, 182, 212, 0.5),
              0 0 40px rgba(6, 182, 212, 0.3),
              0 0 60px rgba(6, 182, 212, 0.15),
              inset 0 0 30px rgba(6, 182, 212, 0.08) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: rgba(168, 85, 247, 0.05) !important;
            border-color: rgba(168, 85, 247, 0.5) !important;
            box-shadow: 
              0 0 15px rgba(168, 85, 247, 0.25),
              0 0 25px rgba(168, 85, 247, 0.15),
              inset 0 0 25px rgba(168, 85, 247, 0.03) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message:hover {
            border-color: rgba(168, 85, 247, 0.8) !important;
            background: rgba(168, 85, 247, 0.08) !important;
            box-shadow: 
              0 0 20px rgba(168, 85, 247, 0.5),
              0 0 40px rgba(168, 85, 247, 0.3),
              0 0 60px rgba(168, 85, 247, 0.15),
              inset 0 0 30px rgba(168, 85, 247, 0.08) !important;
          }

          /* Input area - dark mode */
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: rgba(6, 182, 212, 0.04) !important;
            border-color: rgba(6, 182, 212, 0.4) !important;
            box-shadow: 
              0 0 12px rgba(6, 182, 212, 0.2),
              0 0 20px rgba(6, 182, 212, 0.12) !important;
          }
        }

        /* Input/Textarea styling - Neon Glow */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
              background: rgb(33 33 33) !important;
          border: 2px solid rgba(6, 182, 212, 0.3) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
          box-shadow: 
            0 0 8px rgba(6, 182, 212, 0.15),
            0 0 16px rgba(6, 182, 212, 0.08),
            inset 0 0 20px rgba(6, 182, 212, 0.02) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          border-color: rgba(6, 182, 212, 0.6) !important;
              background: rgb(33 33 33) !important;
          box-shadow: 
            0 0 15px rgba(6, 182, 212, 0.3),
            0 0 30px rgba(6, 182, 212, 0.2),
            0 0 45px rgba(6, 182, 212, 0.1),
            inset 0 0 25px rgba(6, 182, 212, 0.05) !important;
        }

        /* Composer parent background - cyberpunk neon */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(17, 24, 39, 0.98) 0%,
            rgba(31, 41, 55, 0.95) 50%,
            rgba(6, 182, 212, 0.08) 100%) !important;
          box-shadow: 
            inset 0 1px 0 rgba(6, 182, 212, 0.15),
            0 -4px 20px rgba(6, 182, 212, 0.1) !important;
          transition: background 0.3s ease !important;
        }

        /* Dark mode composer parent (enhanced) */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: linear-gradient(135deg,
              rgba(17, 24, 39, 0.98) 0%,
              rgba(31, 41, 55, 0.95) 50%,
              rgba(6, 182, 212, 0.12) 100%) !important;
            box-shadow: 
              inset 0 1px 0 rgba(6, 182, 212, 0.2),
              0 -4px 20px rgba(6, 182, 212, 0.15) !important;
          }
        }

        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 
              0 0 8px rgba(6, 182, 212, 0.15),
              0 0 16px rgba(6, 182, 212, 0.08) !important;
          }
          50% {
            box-shadow: 
              0 0 12px rgba(6, 182, 212, 0.25),
              0 0 24px rgba(6, 182, 212, 0.15) !important;
          }
        }
      `,

      "neon-night": `
        /* 🌃 NEON NIGHT - Black Background with Magenta/Purple Neon 🌃 */
        
        /* Full black background for ChatGPT main area */
        main .flex.flex-col.text-token-text-primary,
        main[class*="main"],
        div[class*="flex-1"][class*="overflow-hidden"] {
          background: #000000 !important;
        }

        /* Prevent scrollbars from outer glows */
        [data-message-author-role="user"],
        [data-message-author-role="assistant"] {
          overflow: visible !important;
        }
        
        /* Neutralize ChatGPT's default bubble colors */
        .user-message-bubble-color {
          background-color: transparent !important;
          max-width: 100% !important;
        }
        
        /* User messages with neon magenta glow */
        [data-message-author-role="user"].sp-premium-message {
          background: rgba(236, 72, 153, 0.08) !important;
          border: 2px solid rgba(236, 72, 153, 0.6) !important;
          border-radius: 12px !important;
          padding: 1.25rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          overflow: visible !important;
          box-shadow: 
            0 0 20px rgba(236, 72, 153, 0.4),
            0 0 40px rgba(236, 72, 153, 0.2),
            inset 0 0 30px rgba(236, 72, 153, 0.08) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Animated glow effect for user messages */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -3px !important;
          left: -3px !important;
          right: -3px !important;
          bottom: -3px !important;
          background: linear-gradient(
            45deg,
            transparent 20%,
            rgba(236, 72, 153, 0.5) 50%,
            transparent 80%
          ) !important;
          border-radius: 12px !important;
          opacity: 0 !important;
          filter: blur(15px) !important;
          transition: opacity 0.4s ease !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }

        /* Corner accent dot for user */
        [data-message-author-role="user"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 10px !important;
          right: 10px !important;
          width: 6px !important;
          height: 6px !important;
          background: rgb(236, 72, 153) !important;
          border-radius: 50% !important;
          box-shadow: 
            0 0 10px rgba(236, 72, 153, 1),
            0 0 20px rgba(236, 72, 153, 0.6) !important;
          animation: neonNightPulse 3s ease-in-out infinite !important;
        }

        @keyframes neonNightPulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            box-shadow: 
              0 0 10px rgba(236, 72, 153, 1),
              0 0 20px rgba(236, 72, 153, 0.6);
          }
          50% { 
            opacity: 0.5; 
            transform: scale(0.7);
            box-shadow: 
              0 0 6px rgba(236, 72, 153, 0.8),
              0 0 12px rgba(236, 72, 153, 0.4);
          }
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          border-color: rgba(236, 72, 153, 0.9) !important;
          background: rgba(236, 72, 153, 0.12) !important;
          box-shadow: 
            0 0 30px rgba(236, 72, 153, 0.6),
            0 0 60px rgba(236, 72, 153, 0.3),
            0 0 90px rgba(236, 72, 153, 0.15),
            inset 0 0 40px rgba(236, 72, 153, 0.12) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Assistant messages with neon purple glow */
        [data-message-author-role="assistant"].sp-premium-message {
          background: rgba(168, 85, 247, 0.08) !important;
          border: 2px solid rgba(168, 85, 247, 0.6) !important;
          border-radius: 12px !important;
          padding: 1.25rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          overflow: visible !important;
          box-shadow: 
            0 0 20px rgba(168, 85, 247, 0.4),
            0 0 40px rgba(168, 85, 247, 0.2),
            inset 0 0 30px rgba(168, 85, 247, 0.08) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -3px !important;
          left: -3px !important;
          right: -3px !important;
          bottom: -3px !important;
          background: linear-gradient(
            -45deg,
            transparent 20%,
            rgba(168, 85, 247, 0.5) 50%,
            transparent 80%
          ) !important;
          border-radius: 12px !important;
          opacity: 0 !important;
          filter: blur(15px) !important;
          transition: opacity 0.4s ease !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 10px !important;
          left: 10px !important;
          width: 6px !important;
          height: 6px !important;
          background: rgb(168, 85, 247) !important;
          border-radius: 50% !important;
          box-shadow: 
            0 0 10px rgba(168, 85, 247, 1),
            0 0 20px rgba(168, 85, 247, 0.6) !important;
          animation: neonNightPulse 3s ease-in-out infinite 1s !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          border-color: rgba(168, 85, 247, 0.9) !important;
          background: rgba(168, 85, 247, 0.12) !important;
          box-shadow: 
            0 0 30px rgba(168, 85, 247, 0.6),
            0 0 60px rgba(168, 85, 247, 0.3),
            0 0 90px rgba(168, 85, 247, 0.15),
            inset 0 0 40px rgba(168, 85, 247, 0.12) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Text colors for dark background */
        [data-message-author-role="user"].sp-premium-message,
        [data-message-author-role="user"].sp-premium-message * {
          color: #fce7f3 !important; /* Pink-50 for user text */
        }

        [data-message-author-role="assistant"].sp-premium-message,
        [data-message-author-role="assistant"].sp-premium-message * {
          color: #f3e8ff !important; /* Purple-50 for assistant text */
        }

        /* Input area with magenta/purple gradient border */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: rgba(20, 20, 20, 0.95) !important;
          border: 2px solid transparent !important;
          border-image: linear-gradient(
            135deg, 
            rgba(236, 72, 153, 0.6) 0%, 
            rgba(168, 85, 247, 0.6) 100%
          ) 1 !important;
          border-radius: 10px !important;
          transition: all 0.3s ease !important;
          box-shadow: 
            0 0 15px rgba(236, 72, 153, 0.2),
            0 0 30px rgba(168, 85, 247, 0.15),
            inset 0 0 25px rgba(0, 0, 0, 0.5) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, 
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          border-image: linear-gradient(
            135deg, 
            rgba(236, 72, 153, 0.9) 0%, 
            rgba(168, 85, 247, 0.9) 100%
          ) 1 !important;
          background: rgba(30, 30, 30, 0.95) !important;
          box-shadow: 
            0 0 25px rgba(236, 72, 153, 0.4),
            0 0 50px rgba(168, 85, 247, 0.3),
            0 0 75px rgba(236, 72, 153, 0.2),
            inset 0 0 30px rgba(0, 0, 0, 0.6) !important;
        }

        /* Composer parent background - pure black with subtle glow */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(0, 0, 0, 1) 0%,
            rgba(20, 0, 30, 0.98) 50%,
            rgba(30, 0, 40, 0.95) 100%) !important;
          box-shadow: 
            inset 0 1px 0 rgba(236, 72, 153, 0.2),
            0 -4px 30px rgba(168, 85, 247, 0.15) !important;
          transition: background 0.3s ease !important;
        }

        /* Sidebar and UI elements - keep dark */
        aside, nav, header {
          background: #0a0a0a !important;
        }
      `,

      "soft-shadow": `
        /* ?? SOFT SHADOW - Minimalist Elegance ?? */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Soft Shadow - User messages with layered depth */
        [data-message-author-role="user"].sp-premium-message {
           background: rgb(99 97 97 / 50%) !important;
          border: none !important;
          border-radius: 14px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.04),
            0 2px 6px rgba(0, 0, 0, 0.06),
            0 8px 16px rgba(0, 0, 0, 0.08) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Subtle top highlight */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 10% !important;
          right: 10% !important;
          height: 1px !important;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.8) 20%,
            rgba(255, 255, 255, 0.8) 80%,
            transparent 100%
          ) !important;
          opacity: 0.6 !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          transform: translateY(-2px) !important;
          box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 12px 24px rgba(0, 0, 0, 0.12) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Soft Shadow - Assistant messages */
        [data-message-author-role="assistant"].sp-premium-message {
          background: rgba(248, 250, 252, 0.8) !important;
          border: none !important;
          border-radius: 14px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.03),
            0 2px 6px rgba(0, 0, 0, 0.05),
            0 8px 16px rgba(0, 0, 0, 0.07) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 10% !important;
          right: 10% !important;
          height: 1px !important;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.9) 20%,
            rgba(255, 255, 255, 0.9) 80%,
            transparent 100%
          ) !important;
          opacity: 0.5 !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          transform: translateY(-2px) !important;
          box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.04),
            0 4px 12px rgba(0, 0, 0, 0.07),
            0 12px 24px rgba(0, 0, 0, 0.10) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Dark theme */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message {
            background: rgba(30, 41, 59, 0.6) !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.2),
              0 2px 6px rgba(0, 0, 0, 0.25),
              0 8px 16px rgba(0, 0, 0, 0.3) !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover {
            box-shadow: 
              0 2px 4px rgba(0, 0, 0, 0.25),
              0 4px 12px rgba(0, 0, 0, 0.3),
              0 12px 24px rgba(0, 0, 0, 0.35) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: rgba(15, 23, 42, 0.5) !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.18),
              0 2px 6px rgba(0, 0, 0, 0.22),
              0 8px 16px rgba(0, 0, 0, 0.28) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message:hover {
            box-shadow: 
              0 2px 4px rgba(0, 0, 0, 0.22),
              0 4px 12px rgba(0, 0, 0, 0.28),
              0 12px 24px rgba(0, 0, 0, 0.32) !important;
          }

          [data-message-author-role="user"].sp-premium-message::before,
          [data-message-author-role="assistant"].sp-premium-message::before {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.1) 20%,
              rgba(255, 255, 255, 0.1) 80%,
              transparent 100%
            ) !important;
          }

          /* Input area - dark mode */
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: rgba(30, 41, 59, 0.5) !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.2),
              0 2px 6px rgba(0, 0, 0, 0.25),
              0 8px 16px rgba(0, 0, 0, 0.3) !important;
          }
        }

        /* Input/Textarea styling - Soft Shadow */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
              background: rgb(66 65 65) !important;
          border: none !important;
          border-radius: 14px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.04),
            0 2px 6px rgba(0, 0, 0, 0.06),
            0 8px 16px rgba(0, 0, 0, 0.08) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
              background: rgb(66 65 65) !important;
          box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 12px 24px rgba(0, 0, 0, 0.12) !important;
          transform: translateY(-1px) !important;
        }

        /* Composer parent background - soft neutral */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(248, 250, 252, 0.98) 0%,
            rgba(241, 245, 249, 0.95) 50%,
            rgba(226, 232, 240, 0.92) 100%) !important;
          box-shadow: 
            0 -1px 3px rgba(0, 0, 0, 0.04),
            0 -2px 8px rgba(0, 0, 0, 0.06) !important;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Dark mode composer parent */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: linear-gradient(135deg,
              rgba(30, 41, 59, 0.98) 0%,
              rgba(51, 65, 85, 0.95) 50%,
              rgba(71, 85, 105, 0.92) 100%) !important;
            box-shadow: 
              0 -1px 3px rgba(0, 0, 0, 0.2),
              0 -2px 8px rgba(0, 0, 0, 0.25) !important;
          }
        }
      `,

      "gradient-border": `
        /* ?? GRADIENT BORDER - Modern Animated ?? */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Prevent scrollbars from gradient border pseudo-elements */
        article {
          overflow: visible !important;
        }
        
        /* Gradient Border - User messages */
        [data-message-author-role="user"].sp-premium-message {
          background: var(--sp-bg-primary, #ffffff) !important;
          border: 3px solid transparent !important;
          border-radius: 16px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          position: relative !important;
          background-clip: padding-box !important;
          overflow: visible !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Animated gradient border using pseudo-element */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -3px !important;
          left: -3px !important;
          right: -3px !important;
          bottom: -3px !important;
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #8b5cf6 25%,
            #ec4899 50%,
            #f59e0b 75%,
            #3b82f6 100%
          ) !important;
          border-radius: 16px !important;
          z-index: -1 !important;
          background-size: 200% 200% !important;
          animation: gradientShift 3s ease infinite !important;
          opacity: 0.8 !important;
          transition: opacity 0.3s ease !important;
        }

        /* Inner glow effect */
        [data-message-author-role="user"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: radial-gradient(
            circle at 50% 0%,
            rgba(59, 130, 246, 0.1) 0%,
            transparent 60%
          ) !important;
          border-radius: 13px !important;
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
          pointer-events: none !important;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
          animation-duration: 2s !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::after {
          opacity: 1 !important;
        }

        /* Gradient Border - Assistant messages */
        [data-message-author-role="assistant"].sp-premium-message {
          background: var(--sp-bg-primary, #ffffff) !important;
          border: 3px solid transparent !important;
          border-radius: 16px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          position: relative !important;
          background-clip: padding-box !important;
          overflow: visible !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -3px !important;
          left: -3px !important;
          right: -3px !important;
          bottom: -3px !important;
          background: linear-gradient(
            135deg,
            #10b981 0%,
            #14b8a6 25%,
            #06b6d4 50%,
            #0ea5e9 75%,
            #10b981 100%
          ) !important;
          border-radius: 16px !important;
          z-index: -1 !important;
          background-size: 200% 200% !important;
          animation: gradientShift 3s ease infinite 0.5s !important;
          opacity: 0.8 !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: radial-gradient(
            circle at 50% 0%,
            rgba(16, 185, 129, 0.1) 0%,
            transparent 60%
          ) !important;
          border-radius: 13px !important;
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
          pointer-events: none !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
          animation-duration: 2s !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::after {
          opacity: 1 !important;
        }

        /* Dark theme */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message,
          [data-message-author-role="assistant"].sp-premium-message {
            background: rgba(30, 41, 59, 0.5) !important;
          }

          [data-message-author-role="user"].sp-premium-message::before {
            opacity: 0.9 !important;
          }

          [data-message-author-role="assistant"].sp-premium-message::before {
            opacity: 0.9 !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover::before,
          [data-message-author-role="assistant"].sp-premium-message:hover::before {
            opacity: 1 !important;
          }

          /* Input area - dark mode */
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: rgba(30, 41, 59, 0.4) !important;
          }
        }

        /* Input/Textarea styling - Gradient Border */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: rgba(249, 250, 251, 0.95) !important;
          border: 3px solid transparent !important;
          border-radius: 16px !important;
          position: relative !important;
          background-clip: padding-box !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
          color: #1f2937 !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"] *,
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] * {
          color: #1f2937 !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.2) !important;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: rgba(31, 41, 55, 0.95) !important;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.4) !important;
            color: #f3f4f6 !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"] *,
          div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] * {
            color: #f3f4f6 !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.7), 0 0 20px rgba(96, 165, 250, 0.3) !important;
          }

          .composer-submit-button-color {
            background-color: #226a8f !important;
        }

        /* Composer parent background - animated gradient */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(249, 250, 251, 0.98) 0%,
            rgba(239, 246, 255, 0.95) 50%,
            rgba(219, 234, 254, 0.92) 100%) !important;
          border-top: 1px solid rgba(59, 130, 246, 0.1) !important;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Dark mode composer parent */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: linear-gradient(135deg,
              rgba(31, 41, 55, 0.98) 0%,
              rgba(55, 65, 81, 0.95) 50%,
              rgba(75, 85, 99, 0.92) 100%) !important;
            border-top: 1px solid rgba(96, 165, 250, 0.2) !important;
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `,

      neumorphic: `
        /* ?? NEUMORPHIC - Soft 3D Elevation ?? */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Neumorphic - User messages with soft elevation */
        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(145deg, #f0f4f8, #e2e8f0) !important;
          border: none !important;
          border-radius: 18px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          box-shadow: 
            8px 8px 16px rgba(148, 163, 184, 0.25),
            -8px -8px 16px rgba(255, 255, 255, 0.9),
            inset 2px 2px 4px rgba(148, 163, 184, 0.1) !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Inner glow on hover */
        [data-message-author-role="user"].sp-premium-message:hover {
          box-shadow: 
            8px 8px 20px rgba(148, 163, 184, 0.3),
            -8px -8px 20px rgba(255, 255, 255, 1),
            inset 3px 3px 6px rgba(59, 130, 246, 0.15) !important;
        }

        /* Neumorphic - Assistant messages with blue tint */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(145deg, #e8f0fe, #dbeafe) !important;
          border: none !important;
          border-radius: 18px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          box-shadow: 
            8px 8px 16px rgba(59, 130, 246, 0.15),
            -8px -8px 16px rgba(255, 255, 255, 0.9),
            inset 2px 2px 4px rgba(59, 130, 246, 0.1) !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          box-shadow: 
            8px 8px 20px rgba(59, 130, 246, 0.2),
            -8px -8px 20px rgba(255, 255, 255, 1),
            inset 3px 3px 6px rgba(59, 130, 246, 0.2) !important;
        }

        /* Dark theme - inverted neumorphic */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message {
            background: linear-gradient(145deg, #1e293b, #334155) !important;
            box-shadow: 
              6px 6px 12px rgba(0, 0, 0, 0.4),
              -6px -6px 12px rgba(71, 85, 105, 0.15),
              inset 2px 2px 4px rgba(0, 0, 0, 0.2) !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover {
            box-shadow: 
              6px 6px 16px rgba(0, 0, 0, 0.5),
              -6px -6px 16px rgba(71, 85, 105, 0.2),
              inset 3px 3px 6px rgba(148, 163, 184, 0.1) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: linear-gradient(145deg, #1e3a5f, #2a4a7c) !important;
            box-shadow: 
              6px 6px 12px rgba(0, 0, 0, 0.4),
              -6px -6px 12px rgba(59, 130, 246, 0.1),
              inset 2px 2px 4px rgba(0, 0, 0, 0.2) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message:hover {
            box-shadow: 
              6px 6px 16px rgba(0, 0, 0, 0.5),
              -6px -6px 16px rgba(59, 130, 246, 0.15),
              inset 3px 3px 6px rgba(59, 130, 246, 0.15) !important;
          }

          /* Input area - dark mode */
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: linear-gradient(145deg, #1e293b, #334155) !important;
            box-shadow: 
              6px 6px 12px rgba(0, 0, 0, 0.4),
              -6px -6px 12px rgba(71, 85, 105, 0.15),
              inset 2px 2px 4px rgba(0, 0, 0, 0.2) !important;
          }
        }

        /* Input/Textarea styling - Neumorphic */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: #e2e8f0 !important;
          border: none !important;
          border-radius: 18px !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            8px 8px 16px rgba(148, 163, 184, 0.25),
            -8px -8px 16px rgba(255, 255, 255, 0.9),
            inset 2px 2px 4px rgba(148, 163, 184, 0.1) !important;
          color: #1e293b !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"] *,
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] * {
          color: #1e293b !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          box-shadow: 
            8px 8px 20px rgba(148, 163, 184, 0.3),
            -8px -8px 20px rgba(255, 255, 255, 1),
            inset 3px 3px 6px rgba(59, 130, 246, 0.15) !important;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: #2d3748 !important;
            box-shadow: 
              6px 6px 12px rgba(0, 0, 0, 0.4),
              -6px -6px 12px rgba(71, 85, 105, 0.15),
              inset 2px 2px 4px rgba(0, 0, 0, 0.2) !important;
            color: #e2e8f0 !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"] *,
          div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] * {
            color: #e2e8f0 !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
            box-shadow: 
              8px 8px 20px rgba(0, 0, 0, 0.5),
              -8px -8px 20px rgba(71, 85, 105, 0.2),
              inset 3px 3px 6px rgba(96, 165, 250, 0.2) !important;
          }
        }

        /* Composer parent background - neumorphic soft elevation */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(145deg, #f0f4f8, #e2e8f0) !important;
          box-shadow: 
            0 -4px 12px rgba(148, 163, 184, 0.15),
            0 -2px 6px rgba(255, 255, 255, 0.8),
            inset 0 1px 2px rgba(148, 163, 184, 0.08) !important;
          transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Dark mode composer parent */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: linear-gradient(145deg, #334155, #1e293b) !important;
            box-shadow: 
              0 -4px 12px rgba(0, 0, 0, 0.4),
              0 -2px 6px rgba(71, 85, 105, 0.2),
              inset 0 1px 2px rgba(0, 0, 0, 0.2) !important;
          }
        }
      `,

      holographic: `
        /* 🎬 YOUTUBE PREMIUM - Modern & Sleek 🎬 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* YouTube Premium - User messages with iconic red accent */
        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(135deg, rgba(40, 40, 40, 0.95) 0%, rgba(35, 35, 35, 0.98) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-left: 3px solid #FF0000 !important;
          border-radius: 12px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.25),
            0 6px 20px rgba(255, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        /* Elegant hover effect */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: linear-gradient(
            135deg,
            rgba(255, 0, 0, 0) 0%,
            rgba(255, 0, 0, 0.06) 50%,
            rgba(255, 0, 0, 0) 100%
          ) !important;
          opacity: 0 !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          border-left-width: 4px !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          border-left-color: #FF0000 !important;
          box-shadow: 
            0 4px 10px rgba(0, 0, 0, 0.35),
            0 8px 28px rgba(255, 0, 0, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          transform: translateX(2px) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* YouTube Premium - Assistant messages with clean design */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.96) 0%, rgba(25, 25, 25, 0.98) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 12px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.25),
            0 6px 20px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 
            0 4px 10px rgba(0, 0, 0, 0.35),
            0 8px 28px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        }

        /* Input/Textarea styling - YouTube Premium */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.96) 0%, rgba(25, 25, 25, 0.98) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 8px !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          color: #f1f1f1 !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"] *,
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] * {
          color: #f1f1f1 !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          border-color: #FF0000 !important;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.4),
            0 0 0 2px rgba(229, 9, 20, 0.3),
            0 8px 24px rgba(229, 9, 20, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
        }

        /* Composer parent background - cinematic red theme */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(20, 20, 20, 0.98) 0%,
            rgba(30, 30, 30, 0.95) 50%,
            rgba(229, 9, 20, 0.08) 100%) !important;
          border-top: 1px solid rgba(229, 9, 20, 0.2) !important;
          box-shadow: 
            0 -2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(229, 9, 20, 0.1) !important;
          transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `,

      "aurora-glow": `
        /* ✨ AURORA GLOW - Northern Lights Inspired ✨ */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Aurora Glow - User messages with flowing aurora colors */
        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(
            135deg,
            rgba(167, 139, 250, 0.12) 0%,
            rgba(139, 92, 246, 0.08) 25%,
            rgba(59, 130, 246, 0.08) 50%,
            rgba(14, 165, 233, 0.06) 75%,
            rgba(34, 211, 238, 0.04) 100%
          ) !important;
          background-size: 200% 200% !important;
          border-radius: 16px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: 
            0 4px 20px rgba(139, 92, 246, 0.08),
            0 1px 3px rgba(139, 92, 246, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          animation: auroraShimmer 8s ease-in-out infinite !important;
        }

        /* Flowing aurora effect overlay */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          left: -50% !important;
          width: 200% !important;
          height: 200% !important;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(167, 139, 250, 0.15) 0%,
            rgba(139, 92, 246, 0.1) 25%,
            transparent 50%
          ) !important;
          opacity: 0 !important;
          transition: opacity 0.6s ease !important;
          pointer-events: none !important;
          animation: auroraRotate 12s linear infinite !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          border-color: rgba(139, 92, 246, 0.35) !important;
          box-shadow: 
            0 8px 32px rgba(139, 92, 246, 0.12),
            0 2px 8px rgba(139, 92, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-1px) !important;
        }

        /* Aurora Glow - Assistant messages with complementary aurora */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(
            135deg,
            rgba(52, 211, 153, 0.1) 0%,
            rgba(16, 185, 129, 0.08) 25%,
            rgba(5, 150, 105, 0.06) 50%,
            rgba(6, 182, 212, 0.06) 75%,
            rgba(14, 165, 233, 0.04) 100%
          ) !important;
          background-size: 200% 200% !important;
          border-radius: 16px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.5rem 0 !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: 
            0 4px 20px rgba(16, 185, 129, 0.08),
            0 1px 3px rgba(16, 185, 129, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          animation: auroraShimmer 8s ease-in-out infinite reverse !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          right: -50% !important;
          width: 200% !important;
          height: 200% !important;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(52, 211, 153, 0.15) 0%,
            rgba(16, 185, 129, 0.1) 25%,
            transparent 50%
          ) !important;
          opacity: 0 !important;
          transition: opacity 0.6s ease !important;
          pointer-events: none !important;
          animation: auroraRotate 12s linear infinite reverse !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          border-color: rgba(16, 185, 129, 0.35) !important;
          box-shadow: 
            0 8px 32px rgba(16, 185, 129, 0.12),
            0 2px 8px rgba(16, 185, 129, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-1px) !important;
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message {
            background: linear-gradient(
              135deg,
              rgba(167, 139, 250, 0.15) 0%,
              rgba(139, 92, 246, 0.12) 25%,
              rgba(59, 130, 246, 0.1) 50%,
              rgba(14, 165, 233, 0.08) 75%,
              rgba(34, 211, 238, 0.06) 100%
            ) !important;
            border-color: rgba(139, 92, 246, 0.3) !important;
            box-shadow: 
              0 4px 20px rgba(139, 92, 246, 0.12),
              0 1px 3px rgba(139, 92, 246, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: linear-gradient(
              135deg,
              rgba(52, 211, 153, 0.15) 0%,
              rgba(16, 185, 129, 0.12) 25%,
              rgba(5, 150, 105, 0.1) 50%,
              rgba(6, 182, 212, 0.08) 75%,
              rgba(14, 165, 233, 0.06) 100%
            ) !important;
            border-color: rgba(16, 185, 129, 0.3) !important;
            box-shadow: 
              0 4px 20px rgba(16, 185, 129, 0.12),
              0 1px 3px rgba(16, 185, 129, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
          }
        }

        /* Input/Textarea styling - Aurora Glow */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: linear-gradient(
            135deg,
            rgba(249, 250, 251, 0.98) 0%,
            rgba(243, 244, 246, 0.95) 100%
          ) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          border-radius: 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 2px 8px rgba(139, 92, 246, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          border-color: rgba(139, 92, 246, 0.4) !important;
          box-shadow: 
            0 4px 16px rgba(139, 92, 246, 0.12),
            0 0 0 3px rgba(139, 92, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
        }

        @media (prefers-color-scheme: dark) {
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: linear-gradient(
              135deg,
              rgba(31, 41, 55, 0.95) 0%,
              rgba(17, 24, 39, 0.98) 100%
            ) !important;
            border-color: rgba(139, 92, 246, 0.3) !important;
            box-shadow: 
              0 2px 8px rgba(139, 92, 246, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
            border-color: rgba(139, 92, 246, 0.5) !important;
            box-shadow: 
              0 4px 16px rgba(139, 92, 246, 0.15),
              0 0 0 3px rgba(139, 92, 246, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
          }
        }

        /* Composer parent background - aurora gradient flow */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: linear-gradient(135deg,
            rgba(167, 139, 250, 0.06) 0%,
            rgba(139, 92, 246, 0.04) 25%,
            rgba(59, 130, 246, 0.04) 50%,
            rgba(14, 165, 233, 0.03) 75%,
            rgba(34, 211, 238, 0.02) 100%) !important;
          background-size: 200% 200% !important;
          border-top: 1px solid rgba(139, 92, 246, 0.15) !important;
          box-shadow: 
            0 -2px 8px rgba(139, 92, 246, 0.06),
            inset 0 1px 0 rgba(139, 92, 246, 0.08) !important;
          animation: auroraShimmerBackground 10s ease-in-out infinite !important;
          transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Dark mode composer parent */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: linear-gradient(135deg,
              rgba(167, 139, 250, 0.08) 0%,
              rgba(139, 92, 246, 0.06) 25%,
              rgba(59, 130, 246, 0.06) 50%,
              rgba(14, 165, 233, 0.04) 75%,
              rgba(34, 211, 238, 0.03) 100%) !important;
            border-top-color: rgba(139, 92, 246, 0.25) !important;
            box-shadow: 
              0 -2px 8px rgba(139, 92, 246, 0.1),
              inset 0 1px 0 rgba(139, 92, 246, 0.12) !important;
          }
        }

        @keyframes auroraShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes auroraShimmerBackground {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes auroraRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `,

      space: `
        /* 🌌 SPACE ODYSSEY - Cosmic Nebula Theme 🌌 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }

        /* Deep space background on ChatGPT main area */
        main#main {
          background: radial-gradient(ellipse at center, #1a0b2e 0%, #16082a 40%, #0f051d 100%) !important;
          background-attachment: fixed !important;
        }

        /* Starfield overlay: on main#main, doesn't affect layout or create scrollbars */
        main#main::after {
          content: '' !important;
          position: fixed !important;
          inset: 0 !important;
          pointer-events: none !important;
          z-index: 0 !important;
          overflow: hidden !important;
          background-image:
            /* White stars - various sizes */
            radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.9) 1.5px, transparent 1.5px),
            radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
            radial-gradient(circle at 45% 35%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
            radial-gradient(circle at 75% 60%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
            radial-gradient(circle at 25% 70%, rgba(255, 255, 255, 0.75) 1.5px, transparent 1.5px),
            radial-gradient(circle at 90% 85%, rgba(255, 255, 255, 0.8) 2px, transparent 2px),
            radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
            radial-gradient(circle at 60% 25%, rgba(255, 255, 255, 0.5) 0.8px, transparent 0.8px),
            radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.65) 1.2px, transparent 1.2px),
            radial-gradient(circle at 95% 45%, rgba(255, 255, 255, 0.7) 1.5px, transparent 1.5px),
            radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.55) 0.8px, transparent 0.8px),
            radial-gradient(circle at 5% 40%, rgba(255, 255, 255, 0.8) 1.5px, transparent 1.5px),
            radial-gradient(circle at 70% 95%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
            radial-gradient(circle at 40% 10%, rgba(255, 255, 255, 0.75) 2px, transparent 2px),
            radial-gradient(circle at 80% 75%, rgba(255, 255, 255, 0.5) 0.8px, transparent 0.8px),
            radial-gradient(circle at 18% 55%, rgba(255, 255, 255, 0.65) 1.2px, transparent 1.2px),
            radial-gradient(circle at 92% 10%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
            radial-gradient(circle at 35% 92%, rgba(255, 255, 255, 0.6) 1.5px, transparent 1.5px),
            /* Purple/pink nebula stars */
            radial-gradient(circle at 35% 65%, rgba(168, 85, 247, 0.6) 2.5px, transparent 2.5px),
            radial-gradient(circle at 65% 40%, rgba(139, 92, 246, 0.5) 2px, transparent 2px),
            radial-gradient(circle at 20% 85%, rgba(192, 132, 252, 0.55) 2.5px, transparent 2.5px),
            /* Blue nebula stars */
            radial-gradient(circle at 88% 30%, rgba(96, 165, 250, 0.6) 2.5px, transparent 2.5px),
            radial-gradient(circle at 12% 55%, rgba(59, 130, 246, 0.5) 2px, transparent 2px),
            radial-gradient(circle at 55% 12%, rgba(147, 197, 253, 0.55) 2.5px, transparent 2.5px) !important;
          background-size: 100% 100% !important;
          opacity: 0.7 !important;
          animation: starTwinkle 4s ease-in-out infinite !important;
        }

        @keyframes starTwinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        
        /* Space - User messages with cosmic purple/pink gradients */
        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(
            135deg,
            rgba(139, 92, 246, 0.3) 0%,
            rgba(168, 85, 247, 0.25) 50%,
            rgba(192, 132, 252, 0.2) 100%
          ) !important;
          border: 1px solid rgba(168, 85, 247, 0.4) !important;
          border-radius: 16px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          z-index: 2 !important;
          box-shadow: 
            0 0 20px rgba(168, 85, 247, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: visible !important;
        }

        /* Cosmic glow effect on hover */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -2px !important;
          left: -2px !important;
          right: -2px !important;
          bottom: -2px !important;
          background: linear-gradient(
            135deg,
            rgba(139, 92, 246, 0.4),
            rgba(168, 85, 247, 0.3),
            rgba(192, 132, 252, 0.2)
          ) !important;
          border-radius: 16px !important;
          z-index: -1 !important;
          opacity: 0 !important;
          filter: blur(8px) !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          box-shadow: 
            0 0 30px rgba(168, 85, 247, 0.4),
            0 6px 16px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-2px) !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Inner nebula effect for user messages */
        [data-message-author-role="user"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: radial-gradient(
            ellipse at 30% 20%, 
            rgba(192, 132, 252, 0.15) 0%, 
            transparent 50%
          ),
          radial-gradient(
            ellipse at 70% 80%, 
            rgba(168, 85, 247, 0.12) 0%, 
            transparent 50%
          ) !important;
          border-radius: 16px !important;
          opacity: 0.8 !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }

        /* Ensure text is above nebula effect */
        [data-message-author-role="user"].sp-premium-message > * {
          position: relative !important;
          z-index: 1 !important;
        }

        /* Space - Assistant messages with nebula blue/teal gradients */
        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.3) 0%,
            rgba(96, 165, 250, 0.25) 50%,
            rgba(147, 197, 253, 0.2) 100%
          ) !important;
          border: 1px solid rgba(96, 165, 250, 0.4) !important;
          border-radius: 16px !important;
          padding: 1.25rem 1.5rem !important;
          margin: 0.75rem 0 !important;
          position: relative !important;
          box-shadow: 
            0 0 20px rgba(96, 165, 250, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: visible !important;
        }

        /* Nebula glow effect on hover */
        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: -2px !important;
          left: -2px !important;
          right: -2px !important;
          bottom: -2px !important;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.4),
            rgba(96, 165, 250, 0.3),
            rgba(147, 197, 253, 0.2)
          ) !important;
          border-radius: 16px !important;
          z-index: -1 !important;
          opacity: 0 !important;
          filter: blur(8px) !important;
          transition: opacity 0.3s ease !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          box-shadow: 
            0 0 30px rgba(96, 165, 250, 0.4),
            0 6px 16px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-2px) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover::before {
          opacity: 1 !important;
        }

        /* Inner nebula effect for assistant messages */
        [data-message-author-role="assistant"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: radial-gradient(
            ellipse at 20% 30%, 
            rgba(147, 197, 253, 0.15) 0%, 
            transparent 50%
          ),
          radial-gradient(
            ellipse at 80% 70%, 
            rgba(96, 165, 250, 0.12) 0%, 
            transparent 50%
          ) !important;
          border-radius: 16px !important;
          opacity: 0.8 !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }

        /* Ensure text is above nebula effect */
        [data-message-author-role="assistant"].sp-premium-message > * {
          position: relative !important;
          z-index: 1 !important;
        }

        /* Input/Textarea styling - Space theme */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: linear-gradient(
            135deg,
            rgba(31, 41, 55, 0.6) 0%,
            rgba(17, 24, 39, 0.7) 100%
          ) !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          border-radius: 12px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(139, 92, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05) !important;
          color: #e9d5ff !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"] *,
        div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] * {
          color: #e9d5ff !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          border-color: rgba(168, 85, 247, 0.6) !important;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(168, 85, 247, 0.3),
            0 0 0 3px rgba(168, 85, 247, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        }

        /* Composer parent background - deep space gradient */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: radial-gradient(
            ellipse at bottom,
            rgba(26, 11, 46, 0.95) 0%,
            rgba(22, 8, 42, 0.97) 40%,
            rgba(15, 5, 29, 0.98) 100%
          ) !important;
          border-top: 1px solid rgba(168, 85, 247, 0.2) !important;
          box-shadow: 
            0 -2px 12px rgba(0, 0, 0, 0.6),
            0 -1px 0 rgba(168, 85, 247, 0.15),
            inset 0 1px 0 rgba(168, 85, 247, 0.1) !important;
          position: relative !important;
          transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Starfield effect for composer */
        div[role="presentation"].composer-parent::before,
        div.composer-parent::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: 
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            radial-gradient(circle at 80% 40%, rgba(255, 255, 255, 0.2) 0.5px, transparent 0.5px),
            radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 90% 20%, rgba(255, 255, 255, 0.15) 0.5px, transparent 0.5px),
            radial-gradient(circle at 40% 50%, rgba(255, 255, 255, 0.1) 0.5px, transparent 0.5px) !important;
          opacity: 0.5 !important;
          pointer-events: none !important;
        }
      `,

      "material-depth": `
        /* 🎨 MATERIAL DEPTH - Material Design 3 Elevation 🎨 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        /* Material Depth - User messages with elevated surface */
        [data-message-author-role="user"].sp-premium-message {
          background: var(--sp-bg-primary, #ffffff) !important;
          border-radius: 20px !important;
          padding: 1.5rem 1.75rem !important;
          margin: 0.75rem 0 !important;
          border: none !important;
          position: relative !important;
          box-shadow: 
            0 1px 2px rgba(59, 130, 246, 0.08),
            0 2px 4px rgba(59, 130, 246, 0.08),
            0 4px 8px rgba(59, 130, 246, 0.08),
            0 8px 16px rgba(59, 130, 246, 0.08),
            0 16px 32px rgba(59, 130, 246, 0.08) !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Subtle color tint overlay */
        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.03) 0%,
            rgba(96, 165, 250, 0.02) 50%,
            transparent 100%
          ) !important;
          border-radius: 20px !important;
          pointer-events: none !important;
        }

        /* Top highlight for depth perception */
        [data-message-author-role="user"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 1px !important;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          ) !important;
          border-radius: 20px 20px 0 0 !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          box-shadow: 
            0 2px 4px rgba(59, 130, 246, 0.1),
            0 4px 8px rgba(59, 130, 246, 0.1),
            0 8px 16px rgba(59, 130, 246, 0.1),
            0 16px 32px rgba(59, 130, 246, 0.1),
            0 32px 64px rgba(59, 130, 246, 0.1) !important;
          transform: translateY(-2px) !important;
        }

        /* Material Depth - Assistant messages */
        [data-message-author-role="assistant"].sp-premium-message {
          background: var(--sp-bg-primary, #ffffff) !important;
          border-radius: 20px !important;
          padding: 1.5rem 1.75rem !important;
          margin: 0.75rem 0 !important;
          border: none !important;
          position: relative !important;
          box-shadow: 
            0 1px 2px rgba(16, 185, 129, 0.08),
            0 2px 4px rgba(16, 185, 129, 0.08),
            0 4px 8px rgba(16, 185, 129, 0.08),
            0 8px 16px rgba(16, 185, 129, 0.08),
            0 16px 32px rgba(16, 185, 129, 0.08) !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.03) 0%,
            rgba(52, 211, 153, 0.02) 50%,
            transparent 100%
          ) !important;
          border-radius: 20px !important;
          pointer-events: none !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 1px !important;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 100%
          ) !important;
          border-radius: 20px 20px 0 0 !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          box-shadow: 
            0 2px 4px rgba(16, 185, 129, 0.1),
            0 4px 8px rgba(16, 185, 129, 0.1),
            0 8px 16px rgba(16, 185, 129, 0.1),
            0 16px 32px rgba(16, 185, 129, 0.1),
            0 32px 64px rgba(16, 185, 129, 0.1) !important;
          transform: translateY(-2px) !important;
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          [data-message-author-role="user"].sp-premium-message {
            background: rgba(30, 41, 59, 0.6) !important;
            box-shadow: 
              0 1px 2px rgba(59, 130, 246, 0.12),
              0 2px 4px rgba(59, 130, 246, 0.12),
              0 4px 8px rgba(59, 130, 246, 0.12),
              0 8px 16px rgba(59, 130, 246, 0.12),
              0 16px 32px rgba(0, 0, 0, 0.3) !important;
          }

          [data-message-author-role="user"].sp-premium-message::before {
            background: linear-gradient(
              135deg,
              rgba(59, 130, 246, 0.08) 0%,
              rgba(96, 165, 250, 0.04) 50%,
              transparent 100%
            ) !important;
          }

          [data-message-author-role="user"].sp-premium-message::after {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.08) 50%,
              transparent 100%
            ) !important;
          }

          [data-message-author-role="user"].sp-premium-message:hover {
            box-shadow: 
              0 2px 4px rgba(59, 130, 246, 0.15),
              0 4px 8px rgba(59, 130, 246, 0.15),
              0 8px 16px rgba(59, 130, 246, 0.15),
              0 16px 32px rgba(59, 130, 246, 0.15),
              0 32px 64px rgba(0, 0, 0, 0.4) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message {
            background: rgba(30, 41, 59, 0.6) !important;
            box-shadow: 
              0 1px 2px rgba(16, 185, 129, 0.12),
              0 2px 4px rgba(16, 185, 129, 0.12),
              0 4px 8px rgba(16, 185, 129, 0.12),
              0 8px 16px rgba(16, 185, 129, 0.12),
              0 16px 32px rgba(0, 0, 0, 0.3) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message::before {
            background: linear-gradient(
              135deg,
              rgba(16, 185, 129, 0.08) 0%,
              rgba(52, 211, 153, 0.04) 50%,
              transparent 100%
            ) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message::after {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.08) 50%,
              transparent 100%
            ) !important;
          }

          [data-message-author-role="assistant"].sp-premium-message:hover {
            box-shadow: 
              0 2px 4px rgba(16, 185, 129, 0.15),
              0 4px 8px rgba(16, 185, 129, 0.15),
              0 8px 16px rgba(16, 185, 129, 0.15),
              0 16px 32px rgba(16, 185, 129, 0.15),
              0 32px 64px rgba(0, 0, 0, 0.4) !important;
          }
        }

        /* Input/Textarea styling - Material Depth */
        .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
          background: #ffffff !important;
          border: none !important;
          border-radius: 20px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.05),
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 4px 8px rgba(0, 0, 0, 0.05) !important;
          position: relative !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]::before, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 1px !important;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0, 0, 0, 0.06) 50%,
            transparent 100%
          ) !important;
          border-radius: 20px 20px 0 0 !important;
        }

        .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
          box-shadow: 
            0 2px 4px rgba(59, 130, 246, 0.08),
            0 4px 8px rgba(59, 130, 246, 0.08),
            0 8px 16px rgba(59, 130, 246, 0.08),
            0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          transform: translateY(-1px) !important;
        }

        @media (prefers-color-scheme: dark) {
          .bg-token-bg-primary.cursor-text[class*="grid-cols"], div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"] {
            background: rgba(30, 41, 59, 0.7) !important;
            box-shadow: 
              0 1px 2px rgba(0, 0, 0, 0.2),
              0 2px 4px rgba(0, 0, 0, 0.2),
              0 4px 8px rgba(0, 0, 0, 0.2) !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"]::before, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]::before {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.06) 50%,
              transparent 100%
            ) !important;
          }

          .bg-token-bg-primary.cursor-text[class*="grid-cols"]:focus-within, div[class*="bg-token-bg-primary"][class*="cursor-text"][class*="overflow-clip"]:focus-within {
            box-shadow: 
              0 2px 4px rgba(59, 130, 246, 0.12),
              0 4px 8px rgba(59, 130, 246, 0.12),
              0 8px 16px rgba(59, 130, 246, 0.12),
              0 0 0 2px rgba(59, 130, 246, 0.15) !important;
          }
        }

        /* Composer parent background - material elevation layers */
        div[role="presentation"].composer-parent,
        div.composer-parent {
          background: #ffffff !important;
          border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
          box-shadow: 
            0 -1px 2px rgba(0, 0, 0, 0.05),
            0 -2px 4px rgba(0, 0, 0, 0.05),
            0 -4px 8px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(0, 0, 0, 0.03) !important;
          transition: background 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Dark mode composer parent */
        @media (prefers-color-scheme: dark) {
          div[role="presentation"].composer-parent,
          div.composer-parent {
            background: rgba(30, 41, 59, 0.7) !important;
            border-top-color: rgba(255, 255, 255, 0.06) !important;
            box-shadow: 
              0 -1px 2px rgba(0, 0, 0, 0.2),
              0 -2px 4px rgba(0, 0, 0, 0.2),
              0 -4px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
          }
        }
      `,

      "superprompt-elite": `
        /* 💎 SUPERPROMPT ELITE - Ultimate Premium Teal Theme 💎 */

        .user-message-bubble-color {
          background-color: transparent !important;
          max-width: 100% !important;
        }

        main#main {
          position: relative !important;
          background: radial-gradient(
            circle at 20% 15%,
            rgba(34, 211, 238, 0.14) 0%,
            rgba(15, 23, 42, 0.96) 45%,
            rgba(2, 6, 23, 1) 100%
          ) !important;
          background-attachment: fixed !important;
          color: #f8fafc !important;
        }

        main#main::before {
          content: '' !important;
          position: fixed !important;
          inset: 0 !important;
          pointer-events: none !important;
          background:
            radial-gradient(
              circle at 75% 12%,
              rgba(59, 130, 246, 0.2) 0%,
              transparent 55%
            ),
            radial-gradient(
              circle at 12% 78%,
              rgba(20, 184, 166, 0.18) 0%,
              transparent 60%
            ) !important;
          z-index: 0 !important;
          opacity: 0.8 !important;
          animation: spEliteBackdrop 18s ease-in-out infinite alternate !important;
        }

        main#main::after {
          content: '' !important;
          position: fixed !important;
          inset: 0 !important;
          pointer-events: none !important;
          background: linear-gradient(
            135deg,
            rgba(2, 6, 23, 0.92) 0%,
            rgba(8, 27, 49, 0.86) 45%,
            rgba(7, 30, 46, 0.88) 100%
          ) !important;
          z-index: -1 !important;
        }

        main .flex.flex-col.text-token-text-primary {
          background: transparent !important;
          position: relative !important;
          z-index: 1 !important;
        }

        div[class*="react-scroll-to-bottom"] {
          background: transparent !important;
          position: relative !important;
          z-index: 1 !important;
        }

        article.w-full {
          background: transparent !important;
          border: none !important;
          border-radius: 20px !important;
          padding: 0 !important;
          margin: 1.5rem 0 3.5rem 0 !important;
          box-shadow: none !important;
          position: relative !important;
        }

        [data-message-author-role="user"].sp-premium-message {
          background: linear-gradient(
            135deg,
            rgba(14, 165, 233, 0.25) 0%,
            rgba(45, 212, 191, 0.18) 40%,
            rgba(8, 47, 73, 0.8) 100%
          ) !important;
          border: 1px solid rgba(125, 211, 252, 0.5) !important;
          border-radius: 18px !important;
          padding: 2.5rem 1.6rem 1.35rem 1.6rem !important;
          margin: 0.75rem 0 !important;
          margin-left: auto !important;
          max-width: 78% !important;
          position: relative !important;
          backdrop-filter: blur(14px) saturate(1.25) !important;
          -webkit-backdrop-filter: blur(14px) saturate(1.25) !important;
          box-shadow:
            0 20px 55px rgba(14, 165, 233, 0.25),
            0 8px 24px rgba(12, 74, 110, 0.45),
            inset 0 0 0 1px rgba(125, 211, 252, 0.18) !important;
          color: #e0f2fe !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: visible !important;
        }

        [data-message-author-role="user"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          background: radial-gradient(
            circle at 30% 40%,
            rgba(34, 211, 238, 0.35) 0%,
            rgba(20, 184, 166, 0.25) 30%,
            transparent 70%
          ) !important;
          filter: blur(25px) !important;
          opacity: 0.8 !important;
          pointer-events: none !important;
          border-radius: 18px !important;
          animation: spElitePulse 15s ease-in-out infinite alternate !important;
        }

        [data-message-author-role="user"].sp-premium-message:hover {
          box-shadow:
            0 24px 65px rgba(14, 165, 233, 0.35),
            0 12px 32px rgba(12, 74, 110, 0.5),
            inset 0 0 0 1px rgba(125, 211, 252, 0.22) !important;
        }

        [data-message-author-role="user"].sp-premium-message > :not(.sp-overlay) {
          position: relative !important;
          z-index: 1 !important;
        }

        [data-message-author-role="user"].sp-premium-message * {
          color: #e0f2fe !important;
        }

        [data-message-author-role="assistant"].sp-premium-message {
          background: linear-gradient(
            135deg,
            rgba(2, 6, 23, 0.92) 0%,
            rgba(4, 23, 39, 0.9) 35%,
            rgba(8, 47, 73, 0.88) 100%
          ) !important;
          border: 1px solid rgba(37, 99, 235, 0.35) !important;
          border-radius: 18px !important;
          padding: 2.5rem 1.6rem 1.35rem 1.6rem !important;
          margin: 0.75rem 0 !important;
          margin-right: auto !important;
          max-width: 82% !important;
          position: relative !important;
          backdrop-filter: blur(12px) saturate(1.15) !important;
          -webkit-backdrop-filter: blur(12px) saturate(1.15) !important;
          box-shadow:
            0 24px 65px rgba(3, 7, 18, 0.6),
            0 10px 24px rgba(8, 47, 73, 0.5),
            inset 0 0 0 1px rgba(59, 130, 246, 0.18) !important;
          color: #f8fafc !important;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
          overflow: visible !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::before {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          background: radial-gradient(
            circle at 70% 30%,
            rgba(59, 130, 246, 0.35) 0%,
            rgba(15, 118, 110, 0.25) 35%,
            transparent 75%
          ) !important;
          filter: blur(30px) !important;
          opacity: 0.75 !important;
          pointer-events: none !important;
          border-radius: 18px !important;
          animation: spElitePulse 18s ease-in-out infinite alternate-reverse !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          box-shadow:
            0 28px 75px rgba(3, 7, 18, 0.7),
            0 14px 32px rgba(8, 47, 73, 0.6),
            inset 0 0 0 1px rgba(59, 130, 246, 0.25) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message > :not(.sp-overlay) {
          position: relative !important;
          z-index: 1 !important;
        }

        [data-message-author-role="assistant"].sp-premium-message * {
          color: #f8fafc !important;
        }

        /* Premium avatar labels - Inside the bubbles for better visibility */
        [data-message-author-role="user"].sp-premium-message::after {
          content: 'You' !important;
          position: absolute !important;
          top: 8px !important;
          right: 12px !important;
          font-size: 0.65rem !important;
          font-weight: 700 !important;
          color: #22d3ee !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 0.3rem 0.7rem !important;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.4) 0%, rgba(8, 145, 178, 0.35) 100%) !important;
          border: 1.5px solid rgba(34, 211, 238, 0.7) !important;
          border-radius: 6px !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.4), 
                      0 0 20px rgba(34, 211, 238, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          z-index: 100 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message::after {
          content: 'AI' !important;
          position: absolute !important;
          top: 8px !important;
          left: 12px !important;
          font-size: 0.65rem !important;
          font-weight: 700 !important;
          color: #60a5fa !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          padding: 0.3rem 0.7rem !important;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(29, 78, 216, 0.35) 100%) !important;
          border: 1.5px solid rgba(96, 165, 250, 0.7) !important;
          border-radius: 6px !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4),
                      0 0 20px rgba(96, 165, 250, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          z-index: 100 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        /* Animations */
        @keyframes spElitePulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }

        @keyframes spEliteBackdrop {
          0% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }
      `,

      // ============================================================================
      // LIGHT THEME - Premium Light Conversation Design
      // ============================================================================
      "light-modern": `
        /* 🌞 SUPERPROMPT LIGHT THEME - Premium Light Design with Avatars 🌞 */
        
        /* Neutralize ChatGPT's user bubble color */
        .user-message-bubble-color {
          background-color: #ffffff00 !important;
          max-width: 100% !important;
        }
        
        [data-message-author-role="user"].sp-premium-message {
          --user-message-bubble-color: transparent !important;
        }

        /* Clean light background */
        main .flex.flex-col.text-token-text-primary {
          background: #f9fafb !important;
          background-image: none !important;
        }

        main.relative,
        main[class*="relative"] {
          background: #f9fafb !important;
          background-image: none !important;
        }

        div[class*="react-scroll-to-bottom"] {
          background: #f9fafb !important;
          background-image: none !important;
        }

        /* Conversation article containers */
        article.w-full {
          background: transparent !important;
          border-radius: 16px !important;
          padding: 1.5rem !important;
          padding-bottom: 1.5rem !important;
          margin: 1.25rem 0 3.25rem 0 !important;
          border: none !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          transition: none !important;
          position: relative !important;
        }

        article.w-full:hover {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* User message - Premium Teal with Attitude */
        /* CRITICAL: Ultra-high specificity to override ChatGPT's CSS */
        main div[data-testid^="conversation-turn-"] [data-message-author-role="user"],
        main article.w-full [data-message-author-role="user"],
        main [data-message-author-role="user"].sp-premium-message,
        [data-message-author-role="user"].sp-premium-message,
        article [data-message-author-role="user"],
        div[data-testid^="conversation-turn-"] [data-message-author-role="user"] {
          background: linear-gradient(135deg, 
            rgba(209, 231, 239, 1) 0%, 
            rgba(186, 218, 232, 1) 50%,
            rgba(147, 197, 217, 1) 100%) !important;
          border: 2px solid rgba(13, 110, 155, 0.5) !important;
          border-radius: 16px !important;
          padding: 1rem 1.25rem !important;
          padding-top: 2.75rem !important;
          padding-bottom: 1rem !important;
          margin: 0.75rem 0 !important;
          box-shadow: 
            0 3px 16px rgba(13, 110, 155, 0.2),
            0 2px 6px rgba(13, 110, 155, 0.15),
            0 0 0 1px rgba(13, 110, 155, 0.25) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
        }

        /* User avatar */
        [data-message-author-role="user"].sp-premium-message::before,
        article [data-message-author-role="user"]::before,
        div[data-testid^="conversation-turn-"] [data-message-author-role="user"]::before {
          content: '' !important;
          position: absolute !important;
          top: 12px !important;
          left: 12px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #0D6E9B 0%, #1089BD 100%) !important;
          background-image: var(--user-avatar-url, linear-gradient(135deg, #0D6E9B 0%, #1089BD 100%)) !important;
          background-size: cover !important;
          background-position: center !important;
          box-shadow: 
            0 0 0 2px rgba(13, 110, 155, 0.25),
            0 3px 10px rgba(13, 110, 155, 0.35) !important;
          z-index: 10 !important;
        }

        /* Assistant message - Clean white with subtle shadow */
        /* CRITICAL: Ultra-high specificity to override ChatGPT's CSS */
        main div[data-testid^="conversation-turn-"] [data-message-author-role="assistant"],
        main article.w-full [data-message-author-role="assistant"],
        main [data-message-author-role="assistant"].sp-premium-message,
        [data-message-author-role="assistant"].sp-premium-message,
        article [data-message-author-role="assistant"],
        div[data-testid^="conversation-turn-"] [data-message-author-role="assistant"] {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(249, 250, 251, 1) 100%) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 16px !important;
          padding: 1rem 1.25rem !important;
          padding-top: 2.75rem !important;
          padding-bottom: 1rem !important;
          margin: 0.75rem 0 !important;
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.06),
            0 1px 3px rgba(0, 0, 0, 0.08) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
        }

        /* Assistant avatar */
        [data-message-author-role="assistant"].sp-premium-message::before,
        article [data-message-author-role="assistant"]::before,
        div[data-testid^="conversation-turn-"] [data-message-author-role="assistant"]::before {
          content: '' !important;
          position: absolute !important;
          top: 12px !important;
          left: 12px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #10A37F 0%, #1A7F64 100%) !important;
          box-shadow: 
            0 0 0 2px rgba(16, 163, 127, 0.2),
            0 2px 8px rgba(16, 163, 127, 0.25) !important;
          z-index: 10 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* ChatGPT logo as SVG */
        [data-message-author-role="assistant"].sp-premium-message::after,
        article [data-message-author-role="assistant"]::after,
        div[data-testid^="conversation-turn-"] [data-message-author-role="assistant"]::after {
          content: '' !important;
          position: absolute !important;
          top: 16px !important;
          left: 16px !important;
          width: 24px !important;
          height: 24px !important;
          background-image: url('data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M11.2475 18.25C10.6975 18.25 10.175 18.1455 9.67999 17.9365C9.18499 17.7275 8.74499 17.436 8.35999 17.062C7.94199 17.205 7.50749 17.2765 7.05649 17.2765C6.31949 17.2765 5.63749 17.095 5.01049 16.732C4.38349 16.369 3.87749 15.874 3.49249 15.247C3.11849 14.62 2.93149 13.9215 2.93149 13.1515C2.93149 12.8325 2.97549 12.486 3.06349 12.112C2.62349 11.705 2.28249 11.2375 2.04049 10.7095C1.79849 10.1705 1.67749 9.6095 1.67749 9.0265C1.67749 8.4325 1.80399 7.8605 2.05699 7.3105C2.30999 6.7605 2.66199 6.2875 3.11299 5.8915C3.57499 5.4845 4.10849 5.204 4.71349 5.05C4.83449 4.423 5.08749 3.862 5.47249 3.367C5.86849 2.861 6.35249 2.465 6.92449 2.179C7.49649 1.893 8.10699 1.75 8.75599 1.75C9.30599 1.75 9.82849 1.8545 10.3235 2.0635C10.8185 2.2725 11.2585 2.564 11.6435 2.938C12.0615 2.795 12.496 2.7235 12.947 2.7235C13.684 2.7235 14.366 2.905 14.993 3.268C15.62 3.631 16.1205 4.126 16.4945 4.753C16.8795 5.38 17.072 6.0785 17.072 6.8485C17.072 7.1675 17.028 7.514 16.94 7.888C17.38 8.295 17.721 8.768 17.963 9.307C18.205 9.835 18.326 10.3905 18.326 10.9735C18.326 11.5675 18.1995 12.1395 17.9465 12.6895C17.6935 13.2395 17.336 13.718 16.874 14.125C16.423 14.521 15.895 14.796 15.29 14.95C15.169 15.577 14.9105 16.138 14.5145 16.633C14.1295 17.139 13.651 17.535 13.079 17.821C12.507 18.107 11.8965 18.25 11.2475 18.25ZM7.17199 16.1875C7.72199 16.1875 8.20049 16.072 8.60749 15.841L11.7095 14.059C11.8195 13.982 11.8745 13.8775 11.8745 13.7455V12.3265L7.88149 14.62C7.63949 14.763 7.39749 14.763 7.15549 14.62L4.03699 12.8215C4.03699 12.8545 4.03149 12.893 4.02049 12.937C4.02049 12.981 4.02049 13.047 4.02049 13.135C4.02049 13.696 4.15249 14.213 4.41649 14.686C4.69149 15.148 5.07099 15.511 5.55499 15.775C6.03899 16.05 6.57799 16.1875 7.17199 16.1875ZM7.33699 13.498C7.40299 13.531 7.46349 13.5475 7.51849 13.5475C7.57349 13.5475 7.62849 13.531 7.68349 13.498L8.92099 12.7885L4.94449 10.4785C4.70249 10.3355 4.58149 10.121 4.58149 9.835V6.2545C4.03149 6.4965 3.59149 6.8705 3.26149 7.3765C2.93149 7.8715 2.76649 8.4215 2.76649 9.0265C2.76649 9.5655 2.90399 10.0825 3.17899 10.5775C3.45399 11.0725 3.81149 11.4465 4.25149 11.6995L7.33699 13.498ZM11.2475 17.161C11.8305 17.161 12.3585 17.029 12.8315 16.765C13.3045 16.501 13.6785 16.138 13.9535 15.676C14.2285 15.214 14.366 14.697 14.366 14.125V10.561C14.366 10.429 14.311 10.33 14.201 10.264L12.947 9.538V14.1415C12.947 14.4275 12.826 14.642 12.584 14.785L9.46549 16.5835C10.0045 16.9685 10.5985 17.161 11.2475 17.161ZM11.8745 11.122V8.878L10.01 7.822L8.12899 8.878V11.122L10.01 12.178L11.8745 11.122ZM7.05649 5.8585C7.05649 5.5725 7.17749 5.358 7.41949 5.215L10.538 3.4165C9.99899 3.0315 9.40499 2.839 8.75599 2.839C8.17299 2.839 7.64499 2.971 7.17199 3.235C6.69899 3.499 6.32499 3.862 6.04999 4.324C5.78599 4.786 5.65399 5.303 5.65399 5.875V9.4225C5.65399 9.5545 5.70899 9.659 5.81899 9.736L7.05649 10.462V5.8585ZM15.4385 13.7455C15.9885 13.5035 16.423 13.1295 16.742 12.6235C17.072 12.1175 17.237 11.5675 17.237 10.9735C17.237 10.4345 17.0995 9.9175 16.8245 9.4225C16.5495 8.9275 16.192 8.5535 15.752 8.3005L12.6665 6.5185C12.6005 6.4745 12.54 6.458 12.485 6.469C12.43 6.469 12.375 6.4855 12.32 6.5185L11.0825 7.2115L15.0755 9.538C15.1965 9.604 15.2845 9.692 15.3395 9.802C15.4055 9.901 15.4385 10.022 15.4385 10.165V13.7455ZM12.122 5.3635C12.364 5.2095 12.606 5.2095 12.848 5.3635L15.983 7.195C15.983 7.118 15.983 7.019 15.983 6.898C15.983 6.37 15.851 5.8695 15.587 5.3965C15.334 4.9125 14.9655 4.5275 14.4815 4.2415C14.0085 3.9555 13.4585 3.8125 12.8315 3.8125C12.2815 3.8125 11.803 3.928 11.396 4.159L8.29399 5.941C8.18399 6.018 8.12899 6.1225 8.12899 6.2545V7.6735L12.122 5.3635Z"/></svg>') !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          z-index: 11 !important;
        }

        /* Text colors for light mode */
        [data-message-author-role="user"].sp-premium-message,
        [data-message-author-role="user"].sp-premium-message * {
          color: #111827 !important;
        }

        [data-message-author-role="assistant"].sp-premium-message,
        [data-message-author-role="assistant"].sp-premium-message * {
          color: #1f2937 !important;
        }

        /* Code blocks in light mode */
        [data-message-author-role] pre {
          background: rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
        }

        /* Links */
        [data-message-author-role] a {
          color: #0D6E9B !important;
          font-weight: 600 !important;
        }

        [data-message-author-role] a:hover {
          color: #1089BD !important;
        }

        /* Hover effects */
        [data-message-author-role="user"].sp-premium-message:hover {
          border-color: rgba(13, 110, 155, 0.65) !important;
          box-shadow: 
            0 4px 20px rgba(13, 110, 155, 0.25),
            0 2px 8px rgba(13, 110, 155, 0.2),
            0 0 0 1px rgba(13, 110, 155, 0.3) !important;
          transform: translateY(-1px) !important;
        } 
            0 4px 16px rgba(20, 184, 166, 0.2),
            0 2px 6px rgba(20, 184, 166, 0.12) !important;
        }

        [data-message-author-role="assistant"].sp-premium-message:hover {
          border-color: rgba(0, 0, 0, 0.12) !important;
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.08),
            0 2px 4px rgba(0, 0, 0, 0.06) !important;
        }

        /* 🔘 COMPOSER BUTTONS - Light theme with high contrast */
        /* Ensure buttons are always visible with proper contrast */
        [data-testid*="composer"] button,
        [data-testid="send-button"],
        button[aria-label*="Send"],
        button[aria-label*="Attach"],
        button[data-testid*="attach"],
        div[class*="cursor-text"] button,
        .composer-btn,
        button.composer-submit-button-color {
          color: #0D6E9B !important;
          background: transparent !important;
        }

        /* Button SVG icons - ensure visibility */
        [data-testid*="composer"] button svg,
        [data-testid="send-button"] svg,
        button[aria-label*="Send"] svg,
        button[aria-label*="Attach"] svg,
        button[data-testid*="attach"] svg,
        div[class*="cursor-text"] button svg,
        .composer-btn svg,
        button.composer-submit-button-color svg {
          color: #0D6E9B !important;
          fill: currentColor !important;
        }

        [data-testid*="composer"] button:hover,
        [data-testid="send-button"]:hover,
        button[aria-label*="Send"]:hover,
        button[aria-label*="Attach"]:hover,
        button[data-testid*="attach"]:hover,
        div[class*="cursor-text"] button:hover,
        .composer-btn:hover,
        button.composer-submit-button-color:hover {
          color: #1089BD !important;
          background: rgba(13, 110, 155, 0.1) !important;
          border-radius: 8px !important;
        }

        /* Speech/voice button - keep transparent, only color the icon */
        button[data-testid="composer-speech-button"],
        button[aria-label*="voice"],
        button[aria-label*="Voice"],
        button.composer-speech-button {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          color: #0D6E9B !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        button[data-testid="composer-speech-button"] svg,
        button[aria-label*="voice"] svg,
        button[aria-label*="Voice"] svg,
        button.composer-speech-button svg {
          color: #0D6E9B !important;
          fill: currentColor !important;
        }

        button[data-testid="composer-speech-button"]:hover,
        button[data-testid="composer-speech-button"]:focus,
        button[data-testid="composer-speech-button"]:focus-visible,
        button[aria-label*="voice"]:hover,
        button[aria-label*="voice"]:focus,
        button[aria-label*="voice"]:focus-visible,
        button[aria-label*="Voice"]:hover,
        button[aria-label*="Voice"]:focus,
        button[aria-label*="Voice"]:focus-visible,
        button.composer-speech-button:hover,
        button.composer-speech-button:focus,
        button.composer-speech-button:focus-visible {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          opacity: 0.8 !important;
        }
      `,
    };

    return styles[styleType] || styles["elegant-gradient"];
  }

  function injectStyles() {
    devLog(
      "🔄 [SP-ConvoStyling] injectStyles() called with currentSettings:",
      currentSettings,
    );

    // Remove old style if exists
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) {
      devLog("🧹 [SP-ConvoStyling] Removing old style element");
      oldStyle.remove();
    }

    if (!currentSettings.enabled) {
      devLog("❌ [SP-ConvoStyling] Styling disabled, skipping injection");
      // Also remove the data attribute and classes when disabled
      try {
        document.documentElement.removeAttribute("data-sp-conversation-style");
        document.body?.classList.remove("sp-dynamic-accent-active");
        document.body?.classList.remove("sp-chatgpt-dark-mode");
        document.body?.classList.remove("sp-chatgpt-light-mode");
        // Remove premium styling from all messages
        document.querySelectorAll(".sp-premium-message").forEach((el) => {
          el.classList.remove("sp-premium-message");
        });
        devLog(
          "🧹 [SP-ConvoStyling] Cleaned up all styling attributes and classes",
        );
      } catch (e) {
        devWarn("[SP-ConvoStyling] Failed to clean up attributes:", e);
      }
      return;
    }

    // Check ChatGPT's current theme
    const isChatGPTLight = isChatGPTLightMode();
    devLog("🎨 [SP-ConvoStyling] ChatGPT theme check:", {
      isChatGPTLight,
    });

    let styleType = currentSettings.styleType;
    devLog("📋 [SP-ConvoStyling] Initial styleType from settings:", styleType);

    let didAutoSwitch = false;

    // Simple logic: All themes are dark EXCEPT light-modern
    // When ChatGPT is in light mode, auto-switch to light-modern
    // When ChatGPT is in dark mode, all themes show their dark styling
    const PURE_LIGHT_THEMES = ["light-modern"];
    const PURE_DARK_THEMES = [
      "elegant-gradient",
      "minimal-border",
      "refined-glass",
      "neon-glow",
      "neon-night",
      "soft-shadow",
      "gradient-border",
      "neumorphic",
      "holographic",
      "aurora-glow",
      "material-depth",
      "space",
      "superprompt-elite",
    ];

    // Check if current style is light or dark
    const isStylePureLight = PURE_LIGHT_THEMES.includes(styleType);
    const isStylePureDark = PURE_DARK_THEMES.includes(styleType);

    // Auto-switch logic: switch themes when ChatGPT mode doesn't match
    if (isChatGPTLight && isStylePureDark) {
      // ChatGPT is in light mode, but user selected a pure dark theme -> switch to light theme
      devLog(
        "⚠️ [SP-ConvoStyling] Light mode detected but pure dark theme selected - auto-switching to light-modern",
      );
      styleType = "light-modern";
      didAutoSwitch = true;
      currentSettings.styleType = "light-modern";
      // Notify content script to update store
      window.postMessage(
        {
          type: "SUPERPROMPT_UPDATE_CONVO_THEME",
          source: "chatgpt-injected",
          styleType: "light-modern",
        },
        "*",
      );
    } else if (!isChatGPTLight && isStylePureLight) {
      // ChatGPT is in dark mode, but user selected pure light theme -> switch to dark theme
      devLog(
        "⚠️ [SP-ConvoStyling] Dark mode detected but pure light theme selected - auto-switching to elegant-gradient",
      );
      styleType = "elegant-gradient";
      didAutoSwitch = true;
      currentSettings.styleType = "elegant-gradient";
      // Notify content script to update store
      window.postMessage(
        {
          type: "SUPERPROMPT_UPDATE_CONVO_THEME",
          source: "chatgpt-injected",
          styleType: "elegant-gradient",
        },
        "*",
      );
    }

    let styleContent = getStylesForType(styleType);

    // For all dark themes: remove @media (prefers-color-scheme: dark) wrappers
    // This makes the dark styling apply unconditionally
    if (
      isStylePureDark &&
      styleContent.includes("@media (prefers-color-scheme: dark)")
    ) {
      devLog(
        `🔧 [SP-ConvoStyling] Removing @media dark wrappers from ${styleType}`,
      );

      // Remove @media (prefers-color-scheme: dark) { and matching closing }
      // This regex finds @media blocks and extracts just their content
      styleContent = styleContent.replace(
        /\/\*[^*]*\*\/\s*@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*/g,
        "/* Dark mode styles (always active) */\n        ",
      );

      // Remove the closing braces of @media blocks (match standalone } at proper indentation)
      // We need to be careful to only remove @media closing braces, not CSS rule closing braces
      // Count opening/closing braces to find @media block ends
      const lines = styleContent.split("\n");
      let mediaDepth = 0;
      let inMedia = false;
      const processedLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect @media block start
        if (
          trimmed.includes("@media") &&
          trimmed.includes("prefers-color-scheme")
        ) {
          inMedia = true;
          mediaDepth = 0;
          processedLines.push(line); // Keep the @media line (will be removed by first regex)
          continue;
        }

        if (inMedia) {
          // Count braces
          const openBraces = (line.match(/\{/g) || []).length;
          const closeBraces = (line.match(/\}/g) || []).length;
          mediaDepth += openBraces - closeBraces;

          // If we hit depth 0 and this line has a closing brace, it's the @media closing brace
          if (mediaDepth < 0 && trimmed === "}") {
            inMedia = false;
            mediaDepth = 0;
            // Skip this line (don't add the closing @media brace)
            continue;
          }
        }

        processedLines.push(line);
      }

      styleContent = processedLines.join("\n");
    }

    devLog(`✅ [SP-ConvoStyling] Applying style:`, {
      styleType,
      isChatGPTLight,
      didAutoSwitch,
      isStylePureLight,
      isStylePureDark,
      contentLength: styleContent.length,
    });

    devLog(
      `Final style content length: ${
        styleContent.length
      } chars (theme: ${styleType}${didAutoSwitch ? " - auto-switched" : ""})`,
    );

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.setAttribute("data-superprompt", "true");
    style.textContent = `
      /* ========== SuperPrompt Premium Conversation Styling ========== */
      /* Style: ${currentSettings.styleType} */
      /* ChatGPT Mode: ${
        isChatGPTLight ? "Light (theme disabled)" : "Dark (theme active)"
      } */
      
      /* 🔘 BASE COMPOSER BUTTON VISIBILITY (all themes) */
      body.sp-chatgpt-light-mode [class*="composer"] button:not(.composer-submit-button-color),
      body.sp-chatgpt-light-mode [data-testid*="send"]:not(.composer-submit-button-color),
      body.sp-chatgpt-light-mode div[class*="cursor-text"] button:not(.composer-submit-button-color),
      body.sp-chatgpt-light-mode button[aria-label*="Send"]:not(.composer-submit-button-color) {
        color: #1f2937 !important;
        fill: currentColor !important;
        opacity: 0.95 !important;
      }
      
      /* 🎤 VOICE/SPEECH BUTTONS - Keep transparent, no background/border (all themes) */
      /* CRITICAL: Higher specificity to override ChatGPT's own styles */
      body.sp-chatgpt-light-mode button[data-testid="composer-speech-button"],
      body.sp-chatgpt-light-mode button[aria-label*="voice"],
      body.sp-chatgpt-light-mode button[aria-label*="Voice"],
      body.sp-chatgpt-light-mode button[data-testid*="speech"],
      body.sp-chatgpt-dark-mode button[data-testid="composer-speech-button"],
      body.sp-chatgpt-dark-mode button[aria-label*="voice"],
      body.sp-chatgpt-dark-mode button[aria-label*="Voice"],
      body.sp-chatgpt-dark-mode button[data-testid*="speech"] {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
      
      body.sp-chatgpt-light-mode button[data-testid="composer-speech-button"]:hover,
      body.sp-chatgpt-light-mode button[data-testid="composer-speech-button"]:focus,
      body.sp-chatgpt-light-mode button[data-testid="composer-speech-button"]:focus-visible,
      body.sp-chatgpt-light-mode button[aria-label*="voice"]:hover,
      body.sp-chatgpt-light-mode button[aria-label*="voice"]:focus,
      body.sp-chatgpt-light-mode button[aria-label*="voice"]:focus-visible,
      body.sp-chatgpt-light-mode button[aria-label*="Voice"]:hover,
      body.sp-chatgpt-light-mode button[aria-label*="Voice"]:focus,
      body.sp-chatgpt-light-mode button[aria-label*="Voice"]:focus-visible,
      body.sp-chatgpt-light-mode button[data-testid*="speech"]:hover,
      body.sp-chatgpt-light-mode button[data-testid*="speech"]:focus,
      body.sp-chatgpt-light-mode button[data-testid*="speech"]:focus-visible,
      body.sp-chatgpt-dark-mode button[data-testid="composer-speech-button"]:hover,
      body.sp-chatgpt-dark-mode button[data-testid="composer-speech-button"]:focus,
      body.sp-chatgpt-dark-mode button[data-testid="composer-speech-button"]:focus-visible,
      body.sp-chatgpt-dark-mode button[aria-label*="voice"]:hover,
      body.sp-chatgpt-dark-mode button[aria-label*="voice"]:focus,
      body.sp-chatgpt-dark-mode button[aria-label*="voice"]:focus-visible,
      body.sp-chatgpt-dark-mode button[aria-label*="Voice"]:hover,
      body.sp-chatgpt-dark-mode button[aria-label*="Voice"]:focus,
      body.sp-chatgpt-dark-mode button[aria-label*="Voice"]:focus-visible,
      body.sp-chatgpt-dark-mode button[data-testid*="speech"]:hover,
      body.sp-chatgpt-dark-mode button[data-testid*="speech"]:focus,
      body.sp-chatgpt-dark-mode button[data-testid*="speech"]:focus-visible {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        opacity: 0.8 !important;
      }

      body.sp-chatgpt-dark-mode [class*="composer"] button:not(.composer-submit-button-color),
      body.sp-chatgpt-dark-mode [data-testid*="send"]:not(.composer-submit-button-color),
      body.sp-chatgpt-dark-mode div[class*="cursor-text"] button:not(.composer-submit-button-color),
      body.sp-chatgpt-dark-mode button[aria-label*="Send"]:not(.composer-submit-button-color) {
        color: #E5E7EB !important;
        fill: currentColor !important;
        opacity: 0.9 !important;
      }

      body.sp-chatgpt-light-mode [class*="composer"] button:not(.composer-submit-button-color) svg,
      body.sp-chatgpt-light-mode [data-testid*="send"]:not(.composer-submit-button-color) svg,
      body.sp-chatgpt-light-mode button[aria-label*="Send"]:not(.composer-submit-button-color) svg,
      body.sp-chatgpt-light-mode button[aria-label*="voice"] svg,
      body.sp-chatgpt-light-mode button[aria-label*="Voice"] svg {
        color: #1f2937 !important;
        fill: currentColor !important;
      }

      body.sp-chatgpt-dark-mode [class*="composer"] button:not(.composer-submit-button-color) svg,
      body.sp-chatgpt-dark-mode [data-testid*="send"]:not(.composer-submit-button-color) svg,
      body.sp-chatgpt-dark-mode button[aria-label*="Send"]:not(.composer-submit-button-color) svg,
      body.sp-chatgpt-dark-mode button[aria-label*="voice"] svg,
      body.sp-chatgpt-dark-mode button[aria-label*="Voice"] svg {
        color: #F3F4F6 !important;
        fill: currentColor !important;
      }

      body.sp-chatgpt-light-mode [class*="composer"] button:not(.composer-submit-button-color):hover,
      body.sp-chatgpt-light-mode [data-testid*="send"]:not(.composer-submit-button-color):hover,
      body.sp-chatgpt-light-mode div[class*="cursor-text"] button:not(.composer-submit-button-color):hover,
      body.sp-chatgpt-light-mode button[aria-label*="Send"]:not(.composer-submit-button-color):hover {
        opacity: 1 !important;
        background: rgba(0, 0, 0, 0.05) !important;
        border-radius: 0.5rem !important;
      }

      body.sp-chatgpt-dark-mode [class*="composer"] button:not(.composer-submit-button-color):hover,
      body.sp-chatgpt-dark-mode [data-testid*="send"]:not(.composer-submit-button-color):hover,
      body.sp-chatgpt-dark-mode div[class*="cursor-text"] button:not(.composer-submit-button-color):hover,
      body.sp-chatgpt-dark-mode button[aria-label*="Send"]:not(.composer-submit-button-color):hover {
        opacity: 1 !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border-radius: 0.5rem !important;
      }

      /* Neutral voice button background for non-accent themes - REMOVED voice buttons to keep them transparent */
      body.sp-chatgpt-light-mode button.composer-submit-button-color {
        background: #E5E7EB !important;
        color: #1f2937 !important;
        border: none !important;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset !important;
      }

      body.sp-chatgpt-dark-mode button.composer-submit-button-color {
        background: #374151 !important;
        color: #F9FAFB !important;
        border: none !important;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;
      }

      body.sp-chatgpt-dark-mode button[aria-label*="voice"] svg,
      body.sp-chatgpt-dark-mode button[aria-label*="Voice"] svg,
      body.sp-chatgpt-dark-mode [data-testid*="speech"] svg,
      body.sp-chatgpt-dark-mode button.composer-submit-button-color svg {
        color: #F9FAFB !important;
        fill: currentColor !important;
      }

      /* 📜 THREAD BOTTOM CONTAINER - Use ChatGPT's native content-fade with theme colors */
      /* Override the ::after gradient to use our theme background color */
      html[data-sp-conversation-style] #thread-bottom-container.content-fade::after,
      html[data-sp-conversation-style] #thread-bottom-container.content-fade.single-line::after {
        background: linear-gradient(
          to top,
          var(--sp-convo-fade-color, #0B1120) 0%,
          var(--sp-convo-fade-color, #0B1120) 60%,
          transparent 100%
        ) !important;
        height: 100% !important;
        pointer-events: none !important;
      }

      /* Conversation fade overlay - keep gradient in sync with theme background */
      html[data-sp-conversation-style] {
        --sp-convo-fade-color: #0B1120;
        --sp-convo-fade-rgb: 11, 17, 32;
      }

      html[data-sp-conversation-style] .content-fade.single-line::after {
        background: linear-gradient(
          0deg,
          rgba(var(--sp-convo-fade-rgb, 11, 17, 32), 1) 0%,
          rgba(var(--sp-convo-fade-rgb, 11, 17, 32), 0) 65%
        ) !important;
        pointer-events: none !important;
      }

      html[data-sp-conversation-style="dynamic-accent"] {
        --sp-convo-fade-color: #1A1D21;
        --sp-convo-fade-rgb: 26, 29, 33;
      }

      html[data-sp-conversation-style="studio-minimal"] {
        --sp-convo-fade-color: #09090B;
        --sp-convo-fade-rgb: 9, 9, 11;
      }

      html[data-sp-conversation-style="creative-professional"] {
        --sp-convo-fade-color: #0F172A;
        --sp-convo-fade-rgb: 15, 23, 42;
      }

      html[data-sp-conversation-style="elegant-gradient"] {
        --sp-convo-fade-color: #0B1120;
        --sp-convo-fade-rgb: 11, 17, 32;
      }

      html[data-sp-conversation-style="minimal-border"] {
        --sp-convo-fade-color: #202428;
        --sp-convo-fade-rgb: 32, 36, 40;
      }

      html[data-sp-conversation-style="refined-glass"] {
        --sp-convo-fade-color: #0F172A;
        --sp-convo-fade-rgb: 15, 23, 42;
      }

      html[data-sp-conversation-style="neon-glow"] {
        --sp-convo-fade-color: #050811;
        --sp-convo-fade-rgb: 5, 8, 17;
      }

      html[data-sp-conversation-style="neon-night"] {
        --sp-convo-fade-color: #050505;
        --sp-convo-fade-rgb: 5, 5, 5;
      }

      html[data-sp-conversation-style="soft-shadow"] {
        --sp-convo-fade-color: #1A202C;
        --sp-convo-fade-rgb: 26, 32, 44;
      }

      html[data-sp-conversation-style="gradient-border"] {
        --sp-convo-fade-color: #0F1419;
        --sp-convo-fade-rgb: 15, 20, 25;
      }

      html[data-sp-conversation-style="neumorphic"] {
        --sp-convo-fade-color: #2A3139;
        --sp-convo-fade-rgb: 42, 49, 57;
      }

      html[data-sp-conversation-style="holographic"] {
        --sp-convo-fade-color: #0D0E12;
        --sp-convo-fade-rgb: 13, 14, 18;
      }

      html[data-sp-conversation-style="aurora-glow"] {
        --sp-convo-fade-color: #020617;
        --sp-convo-fade-rgb: 2, 6, 23;
      }

      html[data-sp-conversation-style="space"] {
        --sp-convo-fade-color: #0F051D;
        --sp-convo-fade-rgb: 15, 5, 29;
      }

      html[data-sp-conversation-style="material-depth"] {
        --sp-convo-fade-color: #121212;
        --sp-convo-fade-rgb: 18, 18, 18;
      }

      html[data-sp-conversation-style="superprompt-elite"] {
        --sp-convo-fade-color: #020617;
        --sp-convo-fade-rgb: 2, 6, 23;
      }

      html[data-sp-conversation-style="light-modern"] {
        --sp-convo-fade-color: #F9FAFB;
        --sp-convo-fade-rgb: 249, 250, 251;
      }

      /* Accent-aware overrides only when Dynamic Accent theme is active */
      body.sp-dynamic-accent-active {
        --sp-composer-accent: var(--color-accent, var(--accent, #0D6E9B));
      }

      body.sp-dynamic-accent-active.sp-chatgpt-light-mode [class*="composer"] button:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode [class*="composer"] button:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode [data-testid*="send"]:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode [data-testid*="send"]:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode div[class*="cursor-text"] button:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode div[class*="cursor-text"] button:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode button[aria-label*="Send"]:not(.composer-submit-button-color),
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode button[aria-label*="Send"]:not(.composer-submit-button-color) {
        color: var(--sp-composer-accent, #0D6E9B) !important;
        fill: currentColor !important;
        opacity: 1 !important;
      }

      body.sp-dynamic-accent-active.sp-chatgpt-light-mode [class*="composer"] button:not(.composer-submit-button-color) svg,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode [class*="composer"] button:not(.composer-submit-button-color) svg,
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode [data-testid*="send"]:not(.composer-submit-button-color) svg,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode [data-testid*="send"]:not(.composer-submit-button-color) svg,
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode button[aria-label*="Send"]:not(.composer-submit-button-color) svg,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode button[aria-label*="Send"]:not(.composer-submit-button-color) svg,
      body.sp-dynamic-accent-active button[aria-label*="voice"] svg,
      body.sp-dynamic-accent-active button[aria-label*="Voice"] svg {
        color: var(--sp-composer-accent, #0D6E9B) !important;
        fill: currentColor !important;
      }

      body.sp-dynamic-accent-active.sp-chatgpt-light-mode [class*="composer"] button:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode [class*="composer"] button:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode [data-testid*="send"]:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode [data-testid*="send"]:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode div[class*="cursor-text"] button:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode div[class*="cursor-text"] button:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-light-mode button[aria-label*="Send"]:not(.composer-submit-button-color):hover,
      body.sp-dynamic-accent-active.sp-chatgpt-dark-mode button[aria-label*="Send"]:not(.composer-submit-button-color):hover {
        background: rgba(0, 0, 0, 0.08) !important;
        border-radius: 0.5rem !important;
      }

      /* Voice / speech buttons - keep transparent, only color the icon */
      body.sp-dynamic-accent-active button[data-testid="composer-speech-button"],
      body.sp-dynamic-accent-active button[aria-label*="voice"],
      body.sp-dynamic-accent-active button[aria-label*="Voice"],
      body.sp-dynamic-accent-active button[data-testid*="speech"] {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
      
      body.sp-dynamic-accent-active button[data-testid="composer-speech-button"] svg,
      body.sp-dynamic-accent-active button[aria-label*="voice"] svg,
      body.sp-dynamic-accent-active button[aria-label*="Voice"] svg,
      body.sp-dynamic-accent-active button[data-testid*="speech"] svg {
        color: var(--sp-composer-accent, #0D6E9B) !important;
        fill: currentColor !important;
      }
      
      /* Voice buttons - remove all hover/focus states */
      body.sp-dynamic-accent-active button[data-testid="composer-speech-button"]:hover,
      body.sp-dynamic-accent-active button[data-testid="composer-speech-button"]:focus,
      body.sp-dynamic-accent-active button[data-testid="composer-speech-button"]:focus-visible,
      body.sp-dynamic-accent-active button[aria-label*="voice"]:hover,
      body.sp-dynamic-accent-active button[aria-label*="voice"]:focus,
      body.sp-dynamic-accent-active button[aria-label*="voice"]:focus-visible,
      body.sp-dynamic-accent-active button[aria-label*="Voice"]:hover,
      body.sp-dynamic-accent-active button[aria-label*="Voice"]:focus,
      body.sp-dynamic-accent-active button[aria-label*="Voice"]:focus-visible,
      body.sp-dynamic-accent-active button[data-testid*="speech"]:hover,
      body.sp-dynamic-accent-active button[data-testid*="speech"]:focus,
      body.sp-dynamic-accent-active button[data-testid*="speech"]:focus-visible {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        opacity: 0.8 !important;
      }
      
      /* Send button (composer-submit-button-color) - solid filled button */
      body.sp-dynamic-accent-active button.composer-submit-button-color {
        background: var(--sp-composer-accent, #0D6E9B) !important;
        color: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }

      body.sp-dynamic-accent-active button.composer-submit-button-color svg {
        color: #ffffff !important;
        fill: currentColor !important;
      }
      
      body.sp-dynamic-accent-active button.composer-submit-button-color:focus {
        outline: none !important;
        box-shadow: none !important;
      }
      
      /* Force visibility override - must come first */
      article.sp-premium-turn.sp-premium-turn.sp-premium-turn,
      article.sp-premium-turn.sp-premium-turn.sp-premium-turn.opacity-0 {
        opacity: 1 !important;
        animation: none !important;
      }
      
      /* Global: Handle overflow for wide content (tables, code blocks) */
      [data-message-author-role="user"].sp-premium-message,
      [data-message-author-role="assistant"].sp-premium-message {
        overflow-x: auto !important;
        overflow-y: visible !important;
      }
      
      /* Ensure tables and wide content don't break layout */
      [data-message-author-role="user"].sp-premium-message table,
      [data-message-author-role="assistant"].sp-premium-message table,
      [data-message-author-role="user"].sp-premium-message pre,
      [data-message-author-role="assistant"].sp-premium-message pre {
        max-width: 100% !important;
        overflow-x: auto !important;
      }
      
      /* Custom scrollbar for premium look */
      [data-message-author-role="user"].sp-premium-message::-webkit-scrollbar,
      [data-message-author-role="assistant"].sp-premium-message::-webkit-scrollbar {
        height: 8px !important;
      }
      
      [data-message-author-role="user"].sp-premium-message::-webkit-scrollbar-track,
      [data-message-author-role="assistant"].sp-premium-message::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05) !important;
        border-radius: 4px !important;
      }
      
      [data-message-author-role="user"].sp-premium-message::-webkit-scrollbar-thumb,
      [data-message-author-role="assistant"].sp-premium-message::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2) !important;
        border-radius: 4px !important;
      }
      
      [data-message-author-role="user"].sp-premium-message::-webkit-scrollbar-thumb:hover,
      [data-message-author-role="assistant"].sp-premium-message::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3) !important;
      }
      
      ${styleContent}
    `;

    document.head.appendChild(style);
    devLog(
      `✅ [SP-ConvoStyling] Styles injected (${currentSettings.styleType}), element ID: ${style.id}`,
    );

    // Verify injection
    const verifyStyle = document.getElementById(STYLE_ID);
    if (verifyStyle) {
      devLog("✓ [SP-ConvoStyling] Style element confirmed in DOM");
    } else {
      devError("✗ [SP-ConvoStyling] Style element NOT found in DOM!");
    }
  }

  function updateStyles() {
    devLog("?? [SP-ConvoStyling] Updating styles...");
    injectStyles();

    // Only update DOM attributes and refresh articles if styling is enabled
    if (!currentSettings.enabled) {
      devLog("❌ [SP-ConvoStyling] Styling disabled, skipping DOM updates");
      return;
    }

    refreshAllArticles();

    // Ensure DOM attribute reflects the latest style
    try {
      document.documentElement.setAttribute(
        "data-sp-conversation-style",
        currentSettings.styleType,
      );

      if (document.body) {
        document.body.classList.toggle(
          "sp-dynamic-accent-active",
          currentSettings.styleType === "dynamic-accent",
        );
      }
    } catch (e) {
      devWarn("[SP-ConvoStyling] Failed to update DOM attribute:", e);
    }

    // DIRECT REFRESH: Force message overlays to update immediately
    try {
      if (window.SuperPromptMessageOverlays?.refreshAllOverlays) {
        devLog(
          "🎨 [SP-ConvoStyling] Forcing overlay refresh with theme:",
          currentSettings.styleType,
        );
        window.SuperPromptMessageOverlays.refreshAllOverlays();
      }
    } catch (e) {
      devWarn("[SP-ConvoStyling] Failed to refresh overlays:", e);
    }

    // NOTE: We do NOT dispatch the event here to avoid infinite loops.
    // The event is already dispatched by the Zustand store when the UI changes the theme.
    // This function is called IN RESPONSE to that event, so re-dispatching would create a loop.
  }

  function ensureContainersStyled(article) {
    if (!article) return;
    const containers = article.querySelectorAll("[data-message-author-role]");
    containers.forEach((container) => {
      if (!container.classList.contains("sp-premium-message")) {
        container.classList.add("sp-premium-message");
        devLog(
          "?? [SP-ConvoStyling] Applied premium styling to message container",
          container,
        );
      }
    });
  }

  function decorateArticle(article) {
    if (!article) {
      devLog("?? [SP-ConvoStyling] No article provided");
      return;
    }

    if (article.dataset[DATA_FLAG] === "true") {
      devLog(
        "?? [SP-ConvoStyling] Article already decorated - refreshing containers",
      );
      ensureContainersStyled(article);
      return;
    }

    devLog("?? [SP-ConvoStyling] Processing article:", article);

    let role = article.getAttribute("data-turn") || article.dataset.turn;
    devLog("?? [SP-ConvoStyling] Initial role:", role);

    // Fallback detection if no data-turn
    if (!role) {
      const userMarker = article.querySelector(
        '[data-message-author-role="user"]',
      );
      const assistantMarker = article.querySelector(
        '[data-message-author-role="assistant"]',
      );

      devLog(
        "?? [SP-ConvoStyling] Looking for markers - user:",
        !!userMarker,
        "assistant:",
        !!assistantMarker,
      );

      if (userMarker) {
        role = "user";
        article.setAttribute("data-turn", "user");
      } else if (assistantMarker) {
        role = "assistant";
        article.setAttribute("data-turn", "assistant");
      }
    }

    if (!role) {
      devLog("?? [SP-ConvoStyling] No role found, skipping");
      return;
    }

    devLog(`?? [SP-ConvoStyling] Decorating as ${role}`);

    article.dataset[DATA_FLAG] = "true";
    article.classList.add("sp-premium-turn");

    // Force remove opacity-0 and prevent it from being re-added
    article.classList.remove("opacity-0");

    // Use inline styles to override ChatGPT's animations (highest specificity)
    article.style.setProperty("opacity", "1", "important");
    article.style.setProperty("animation", "none", "important");
    devLog("?? [SP-ConvoStyling] Forced opacity to 1 with inline styles");

    // Find the inner message container with data-message-author-role
    const messageContainer = article.querySelector(
      "[data-message-author-role]",
    );

    if (messageContainer) {
      devLog("?? [SP-ConvoStyling] Found message container:", messageContainer);

      // Add premium styling class
      messageContainer.classList.add("sp-premium-message");
      devLog(`?? [SP-ConvoStyling] Applied premium styling to ${role} message`);
    } else {
      devLog(
        "?? [SP-ConvoStyling] Warning: No message container found with data-message-author-role",
      );
    }

    ensureContainersStyled(article);

    devLog("?? [SP-ConvoStyling] Classes applied:", article.className);
  }

  function refreshAllArticles() {
    const articles = document.querySelectorAll("article");
    devLog(`?? [SP-ConvoStyling] Refreshing ${articles.length} articles`);
    articles.forEach(decorateArticle);
  }

  function handleMutations(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (!node) return;
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // Performance Optimization: Skip elements that are unlikely to contain conversation turns
          // This significantly reduces overhead during text streaming
          const tagName = node.tagName;
          if (
            tagName === "SPAN" ||
            tagName === "SVG" ||
            tagName === "PATH" ||
            tagName === "IMG" ||
            tagName === "CODE" ||
            tagName === "PRE"
          ) {
            return;
          }

          if (node.matches && node.matches("article")) {
            decorateArticle(node);
          } else {
            if (node.matches && node.matches("[data-message-author-role]")) {
              const parentArticle = node.closest("article");
              if (parentArticle) {
                ensureContainersStyled(parentArticle);
              } else if (!node.classList.contains("sp-premium-message")) {
                node.classList.add("sp-premium-message");
              }
            }

            if (node.querySelectorAll) {
              const foundArticles = node.querySelectorAll("article");
              foundArticles.forEach(decorateArticle);

              const foundContainers = node.querySelectorAll(
                "[data-message-author-role]",
              );
              foundContainers.forEach((container) => {
                const parentArticle = container.closest("article");
                if (parentArticle) {
                  ensureContainersStyled(parentArticle);
                } else if (
                  !container.classList.contains("sp-premium-message")
                ) {
                  container.classList.add("sp-premium-message");
                }
              });
            }
          }
        });
      } else if (mutation.type === "attributes") {
        if (mutation.target.matches && mutation.target.matches("article")) {
          decorateArticle(mutation.target);
        } else if (
          mutation.target.matches &&
          mutation.target.matches("[data-message-author-role]")
        ) {
          const parentArticle = mutation.target.closest("article");
          if (parentArticle) {
            ensureContainersStyled(parentArticle);
          } else if (
            !mutation.target.classList.contains("sp-premium-message")
          ) {
            mutation.target.classList.add("sp-premium-message");
          }
        }
      }
    }
  }

  function observeConversation() {
    const container = document.body;
    if (!container) return;

    const observer = new MutationObserver(handleMutations);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-message-author-role", "data-turn"],
    });
    devLog("?? [SP-ConvoStyling] Mutation observer started");
  }

  // Avatar injection for premium app theme
  let cachedUserAvatar = null;
  let cachedGptAvatar = null;

  function injectAvatars() {
    // Cache avatar URLs to avoid repeated DOM queries
    if (!cachedUserAvatar) {
      // Try multiple selectors for user avatar
      const userAvatarElement =
        document.querySelector('img[src*="gravatar.com"]') ||
        document.querySelector('button[data-testid="profile-button"] img') ||
        document.querySelector("div[data-headlessui-state] img");

      if (userAvatarElement && userAvatarElement.src) {
        cachedUserAvatar = userAvatarElement.src;
        devLog("✅ [SP-ConvoStyling] Cached user avatar:", cachedUserAvatar);
      }
    }

    if (!cachedGptAvatar) {
      // Try to find ChatGPT avatar/logo
      const gptAvatarElement =
        document.querySelector('img[alt*="ChatGPT"]') ||
        document.querySelector('img[alt*="chatgpt"]') ||
        document.querySelector('.text-token-text-primary img[src*="openai"]');

      if (gptAvatarElement && gptAvatarElement.src) {
        cachedGptAvatar = gptAvatarElement.src;
        devLog("✅ [SP-ConvoStyling] Cached GPT avatar:", cachedGptAvatar);
      }
    }

    // Inject user avatars
    if (cachedUserAvatar) {
      document
        .querySelectorAll(
          '[data-message-author-role="user"].sp-premium-message',
        )
        .forEach((el) => {
          if (!el.style.getPropertyValue("--user-avatar-url")) {
            el.style.setProperty(
              "--user-avatar-url",
              `url(${cachedUserAvatar})`,
            );
          }
        });
    }

    // Inject GPT avatars (optional - currently using gradient fallback)
    if (cachedGptAvatar) {
      document
        .querySelectorAll(
          '[data-message-author-role="assistant"].sp-premium-message',
        )
        .forEach((el) => {
          if (!el.style.getPropertyValue("--gpt-avatar-url")) {
            el.style.setProperty("--gpt-avatar-url", `url(${cachedGptAvatar})`);
          }
        });
    }
  }

  // Call avatar injection periodically to catch new messages
  function startAvatarInjection() {
    // Initial injection
    injectAvatars();

    // Inject on new messages (check every 2 seconds)
    setInterval(injectAvatars, 2000);
  }

  function init() {
    devLog("🎨 [SP-ConvoStyling] Module initializing...");

    // Initialize from localStorage
    initializeFromStorage();

    observeConversation();
    devLog("👀 [SP-ConvoStyling] Mutation observer active");

    // Start avatar injection system
    startAvatarInjection();
    devLog("👤 [SP-ConvoStyling] Avatar injection system started");

    document.addEventListener("DOMContentLoaded", refreshAllArticles, {
      once: true,
    });
  }

  window.SuperPromptConversationStyling = {
    refresh: refreshAllArticles,
    decorateArticle,
    // Debug helpers
    getSettings: () => currentSettings,
    forceEnable: () => {
      currentSettings.enabled = true;
      updateStyles();
      devLog("✅ [SP-ConvoStyling] Force enabled");
    },
    checkStyleElement: () => {
      const elem = document.getElementById(STYLE_ID);
      devLog("🔍 [SP-ConvoStyling] Style element exists:", !!elem);
      if (elem) {
        devLog(
          "📏 [SP-ConvoStyling] Style content length:",
          elem.textContent.length,
        );
        devLog(
          "📝 [SP-ConvoStyling] First 500 chars:",
          elem.textContent.substring(0, 500),
        );
      }
      return elem;
    },
    checkThemeClass: () => {
      const hasLight = document.body.classList.contains(
        "sp-chatgpt-light-mode",
      );
      const hasDark = document.body.classList.contains("sp-chatgpt-dark-mode");
      const isLight = isChatGPTLightMode();
      devLog("🎨 [SP-ConvoStyling] Theme check:");
      devLog("  - ChatGPT is light mode:", isLight);
      devLog("  - Body has .sp-chatgpt-light-mode:", hasLight);
      devLog("  - Body has .sp-chatgpt-dark-mode:", hasDark);
      return { isLight, hasLight, hasDark };
    },
    forceThemeUpdate: () => {
      devLog("🔄 [SP-ConvoStyling] Forcing theme update...");
      updateChatGPTThemeClass();
      updateStyles();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  devLog("?? [SP-ConvoStyling] Module loaded and registered");
})();
