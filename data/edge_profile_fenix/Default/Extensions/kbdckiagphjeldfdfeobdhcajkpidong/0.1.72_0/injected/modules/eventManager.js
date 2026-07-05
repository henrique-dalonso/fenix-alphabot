
  

﻿/**
 * SuperPrompt Event Manager Module
 * Navigation detection, DOM observers, and event handling system
 * Extracted from chat-gpt-page-listener.js for better maintainability
 */

(function () {
  "use strict";

  // Prevent multiple initialization
  if (window.SuperPromptEventManager) {
    return;
  }

  // Only log module loading in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog("[SP-EventManager] Initializing Event Manager module...");
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                        EVENT MANAGEMENT SYSTEM                        ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global event state
  let urlHookInstalled = false;
  let urlWatchInterval = null;
  let lastNavCause = null;
  let navBaseline = null;
  let contentResetObserved = false;
  let navSessionActive = false;
  let navSessionTimer = null;

  // Current page state
  let spCurrentUrl = window.location.href;

  // ===============================================================================
  // NAVIGATION DETECTION SYSTEM
  // ===============================================================================

  // Get current conversation ID from URL
  function getCurrentConversationId() {
    try {
      const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // Watch for URL changes
  function watchForUrlChanges() {
    try {
      const currentUrl = window.location.href;
      if (currentUrl !== spCurrentUrl) {
        if (window.SuperPromptCoreUtils?.log) {
          window.SuperPromptCoreUtils.log("🔄 URL changed:", {
            from: spCurrentUrl,
            to: currentUrl,
          });
        }

        const oldUrl = spCurrentUrl;
        spCurrentUrl = currentUrl;

        // Notify other modules of navigation change
        window.dispatchEvent(
          new CustomEvent("sp-navigation-change", {
            detail: {
              oldUrl,
              newUrl: currentUrl,
              conversationId: getCurrentConversationId(),
            },
          })
        );

        // Call navigation handlers
        onNavigationChange();
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "URL watch error", {
          error: error.message,
        });
      }
    }
  }

  // Handle navigation changes
  function onNavigationChange() {
    try {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🧭 Navigation change detected");
      }

      // Update conversation loading state
      updateConversationLoadingState();

      // Notify modules that might need to reinitialize
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("sp-page-ready", {
            detail: { conversationId: getCurrentConversationId() },
          })
        );
      }, 100);
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Navigation change error",
          { error: error.message }
        );
      }
    }
  }

  // Update conversation loading state
  function updateConversationLoadingState() {
    try {
      const conversationId = getCurrentConversationId();

      if (conversationId) {
        // We're in a conversation
        navBaseline = {
          convId: conversationId,
          time: performance.now(),
          firstTurnEl: null,
          firstTurnText: "",
          turns: 0,
          messages: 0,
        };
      } else {
        // We're not in a conversation (homepage, etc.)
        navBaseline = null;
        contentResetObserved = false;
        navSessionActive = false;
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Loading state update error",
          { error: error.message }
        );
      }
    }
  }

  // Start URL watching
  function startUrlWatching() {
    if (urlWatchInterval) return;

    // Check for URL changes every second
    urlWatchInterval = setInterval(watchForUrlChanges, 1000);

    if (window.SuperPromptCoreUtils?.log) {
      window.SuperPromptCoreUtils.log("🔍 URL watching started");
    }
  }

  // Stop URL watching
  function stopUrlWatching() {
    if (urlWatchInterval) {
      clearInterval(urlWatchInterval);
      urlWatchInterval = null;

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🛑 URL watching stopped");
      }
    }
  }

  // Install URL hooks for SPA navigation
  function installUrlHooks() {
    if (urlHookInstalled) return;
    urlHookInstalled = true;

    const notify = () => {
      // Defer slightly to let ChatGPT update center content
      setTimeout(watchForUrlChanges, 50);

      // Handle new chat creation
      try {
        if (sessionStorage.getItem("sp-new-chat") === "true") {
          sessionStorage.removeItem("sp-new-chat");
          navBaseline = null;
          contentResetObserved = false;
          navSessionActive = false;
          startUrlWatching();
          return;
        }
      } catch {}

      // Handle navigation to existing conversations
      const conversationId = getCurrentConversationId();
      if (conversationId) {
        const wasFromVaultSidebar =
          sessionStorage.getItem("sp-vault-nav-active") === "true";
        const lastSelectedConv = sessionStorage.getItem(
          "sp-vault-selected-conv"
        );
        const matchesVaultTarget =
          wasFromVaultSidebar && lastSelectedConv === conversationId;
        const shouldShowLoader = matchesVaultTarget || lastNavCause === "pop";

        if (shouldShowLoader) {
          // Establish baseline for navigation tracking
          try {
            navBaseline = {
              convId: conversationId,
              time: performance.now(),
              firstTurnEl: null,
              firstTurnText: "",
              turns: 0,
              messages: 0,
            };
          } catch {}
        } else {
          // Clean slate for non-loader navigations
          navBaseline = null;
          contentResetObserved = false;
          navSessionActive = false;
          startUrlWatching();
        }
      }
    };

    // Hook History API
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    try {
      history.pushState = function () {
        origPush.apply(this, arguments);
        lastNavCause = "push";
        notify();
      };

      history.replaceState = function () {
        origReplace.apply(this, arguments);
        lastNavCause = "replace";
        notify();
      };
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "History API hook error",
          { error: error.message }
        );
      }
    }

    // Back/forward navigation
    window.addEventListener(
      "popstate",
      () => {
        lastNavCause = "pop";
        notify();
      },
      { passive: true }
    );

    // Internal link clicks
    document.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest && e.target.closest("a[href]");
        if (!link) return;

        const href = link.getAttribute("href");
        if (!href || !/\/c\//.test(href)) return;

        // Track vault sidebar navigation
        const isFromVaultSidebar =
          link.closest(".vault-sidebar") ||
          link.classList.contains("sp-vault-item");
        if (isFromVaultSidebar) {
          sessionStorage.setItem("sp-vault-nav-active", "true");
          try {
            const match = href.match(/\/c\/([^/?#]+)/);
            if (match && match[1]) {
              sessionStorage.setItem("sp-vault-selected-conv", match[1]);
            }
          } catch {}

          lastNavCause = "vault";
          setTimeout(notify, 10);
        }
      },
      { passive: true }
    );

    if (window.SuperPromptCoreUtils?.log) {
      window.SuperPromptCoreUtils.log("🔗 URL hooks installed");
    }
  }

  // ===============================================================================
  // DOM OBSERVER SYSTEM
  // ===============================================================================

  let contentObserver = null;
  let isObserverActive = false;

  // Setup content observer for DOM changes
  function setupContentObserver() {
    if (contentObserver || isObserverActive) return;

    try {
      isObserverActive = true;

      contentObserver = new MutationObserver((mutations) => {
        try {
          let significantChange = false;

          for (const mutation of mutations) {
            // Check for conversation content changes
            if (
              mutation.type === "childList" &&
              mutation.addedNodes.length > 0
            ) {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // Check for new conversation turns
                  if (
                    node.matches &&
                    node.matches(
                      '[data-testid*="conversation-turn"], .conversation-turn, [class*="turn"], [class*="message"]'
                    )
                  ) {
                    significantChange = true;
                    break;
                  }
                }
              }
            }
          }

          if (significantChange) {
            // Debounce notifications
            clearTimeout(window._spContentChangeTimeout);
            window._spContentChangeTimeout = setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("sp-content-change", {
                  detail: { conversationId: getCurrentConversationId() },
                })
              );
            }, 100);
          }
        } catch (error) {
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "error",
              "Content observer error",
              { error: error.message }
            );
          }
        }
      });

      // Observe the main content area
      const targetNode = document.querySelector("main") || document.body;
      contentObserver.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("👁️ Content observer setup complete");
      }
    } catch (error) {
      isObserverActive = false;
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Content observer setup error",
          { error: error.message }
        );
      }
    }
  }

  // Disconnect content observer
  function disconnectContentObserver() {
    if (contentObserver) {
      contentObserver.disconnect();
      contentObserver = null;
      isObserverActive = false;

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🛑 Content observer disconnected");
      }
    }
  }

  // ===============================================================================
  // PAGE VISIBILITY AND LIFECYCLE
  // ===============================================================================

  // Handle page visibility changes
  function handleVisibilityChange() {
    if (!document.hidden && document.visibilityState === "visible") {
      // Page became visible, check if we need to reinitialize
      setTimeout(() => {
        if (
          document.hidden === false &&
          document.visibilityState === "visible"
        ) {
          const conversationId = getCurrentConversationId();

          window.dispatchEvent(
            new CustomEvent("sp-visibility-change", {
              detail: {
                visible: true,
                conversationId,
                timestamp: Date.now(),
              },
            })
          );

          if (window.SuperPromptCoreUtils?.log) {
            window.SuperPromptCoreUtils.log(
              "👁️ Page became visible, conversation:",
              conversationId
            );
          }
        }
      }, 500);
    } else {
      // Page became hidden
      window.dispatchEvent(
        new CustomEvent("sp-visibility-change", {
          detail: {
            visible: false,
            conversationId: getCurrentConversationId(),
            timestamp: Date.now(),
          },
        })
      );
    }
  }

  // ===============================================================================
  // ERROR HANDLING
  // ===============================================================================

  // Global error handler for the page
  function handleGlobalError(error) {
    try {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Global error captured",
          {
            error: error.message || String(error),
            stack: error.stack || "No stack trace",
            url: window.location.href,
          }
        );
      }
    } catch {
      // Fail silently to avoid error loops
    }
  }

  // ===============================================================================
  // INITIALIZATION SYSTEM
  // ===============================================================================

  // Initialize all event systems
  function initializeEventSystems() {
    try {
      // Start basic systems
      installUrlHooks();
      setupContentObserver();
      startUrlWatching();

      // Setup core event listeners
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("error", handleGlobalError);
      window.addEventListener("unhandledrejection", (e) =>
        handleGlobalError(e.reason)
      );

      // Setup popstate listener for navigation
      window.addEventListener("popstate", onNavigationChange);

      // Initial state setup
      watchForUrlChanges();
      updateConversationLoadingState();

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("✅ Event systems initialized");
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Event system initialization error",
          { error: error.message }
        );
      }
    }
  }

  // Cleanup event systems
  function cleanupEventSystems() {
    try {
      stopUrlWatching();
      disconnectContentObserver();

      // Clear any pending timers
      if (navSessionTimer) {
        clearTimeout(navSessionTimer);
        navSessionTimer = null;
      }

      if (window._spContentChangeTimeout) {
        clearTimeout(window._spContentChangeTimeout);
        delete window._spContentChangeTimeout;
      }

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🧹 Event systems cleaned up");
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "Event cleanup error", {
          error: error.message,
        });
      }
    }
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                        MODULE EXPORTS                                  ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global namespace for event management
  window.SuperPromptEventManager = {
    // Core navigation functions
    getCurrentConversationId,
    watchForUrlChanges,
    onNavigationChange,
    installUrlHooks,
    updateConversationLoadingState,

    // URL watching control
    startUrlWatching,
    stopUrlWatching,
    isUrlWatchingActive: () => !!urlWatchInterval,

    // DOM observer functions
    setupContentObserver,
    disconnectContentObserver,
    isContentObserverActive: () => isObserverActive,

    // Page lifecycle
    handleVisibilityChange,
    handleGlobalError,

    // System control
    initializeEventSystems,
    cleanupEventSystems,

    // State getters
    getNavigationState: () => ({
      currentUrl: spCurrentUrl,
      conversationId: getCurrentConversationId(),
      navBaseline,
      lastNavCause,
      navSessionActive,
      contentResetObserved,
    }),

    // Utilities for other modules
    getCurrentUrl: () => spCurrentUrl,
    getLastNavCause: () => lastNavCause,
    isNavigationActive: () => navSessionActive,

    // Manual triggers
    triggerNavigationCheck: () => watchForUrlChanges(),
    triggerContentObserver: () => setupContentObserver(),
  };

  // Auto-initialize event systems
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(initializeEventSystems, 50);
  } else {
    document.addEventListener("DOMContentLoaded", initializeEventSystems);
    window.addEventListener("load", initializeEventSystems);
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", cleanupEventSystems);

  // Mark module as available
  window.eventManagerAvailable = true;

  // Only log success in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog(
      "✅ [SP-EventManager] Event Manager module initialized successfully"
    );
  }
})();
