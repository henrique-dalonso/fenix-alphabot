/**
 * Debug Logger for Injected Scripts
 *
 * Lightweight logging utility for scripts running in page context.
 * Respects debug mode setting from chrome.storage.
 *
 * Usage:
 *   import { createLogger } from './debugLogger.js';
 *   const logger = createLogger('MyModule');
 *   logger.log('info message');
 *   logger.warn('warning');
 *   logger.error('error'); // Always visible
 */

(function () {
  // Check if we're in production (no update_url = development)
  let isProduction = false;
  let debugModeEnabled = false;
  let debugModeChecked = false;

  // Detect production environment
  async function checkEnvironment() {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.runtime &&
        chrome.runtime.getManifest
      ) {
        const manifest = chrome.runtime.getManifest();
        isProduction = !!manifest.update_url;
      }
    } catch (e) {
      // Can't access manifest in page context - assume production to be safe
      isProduction = true;
    }

    // Check debug mode from storage
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get([
          "superprompt_debug_mode",
        ]);
        debugModeEnabled = result.superprompt_debug_mode === true;
      }
    } catch (e) {
      // Storage not accessible in page context - fall back to checking via message
      try {
        const response = await new Promise((resolve) => {
          const messageId = `debug-check-${Date.now()}`;

          const handler = (event) => {
            if (
              event.data?.type === "sp-debug-mode-response" &&
              event.data?.messageId === messageId
            ) {
              window.removeEventListener("message", handler);
              resolve(event.data);
            }
          };

          window.addEventListener("message", handler);

          window.postMessage(
            {
              type: "sp-debug-mode-request",
              messageId: messageId,
              source: "debug-logger",
            },
            "*",
          );

          // Timeout after 1 second
          setTimeout(() => {
            window.removeEventListener("message", handler);
            resolve({ enabled: false });
          }, 1000);
        });

        debugModeEnabled = response.enabled === true;
      } catch (e) {
        debugModeEnabled = false;
      }
    }

    debugModeChecked = true;
  }

  // Initialize check
  checkEnvironment();

  /**
   * Create a logger instance for a module
   * @param {string} moduleName - Name of the module (e.g., "ChatGPT AI Buttons")
   * @returns {object} Logger instance with log, warn, error methods
   */
  function createLogger(moduleName) {
    const prefix = `[${moduleName}]`;

    return {
      /**
       * Log info message (only in development or when debug mode enabled)
       */
      log: (...args) => {
        if (!debugModeChecked) {
          // Queue log until debug mode is checked
          setTimeout(() => {
            if (!isProduction || debugModeEnabled) {
              console.log(prefix, ...args);
            }
          }, 100);
          return;
        }

        if (!isProduction || debugModeEnabled) {
          console.log(prefix, ...args);
        }
      },

      /**
       * Log warning (only in development or when debug mode enabled)
       */
      warn: (...args) => {
        if (!debugModeChecked) {
          setTimeout(() => {
            if (!isProduction || debugModeEnabled) {
              console.warn(prefix, ...args);
            }
          }, 100);
          return;
        }

        if (!isProduction || debugModeEnabled) {
          console.warn(prefix, ...args);
        }
      },

      /**
       * Log error (ALWAYS visible, even in production)
       */
      error: (...args) => {
        console.error(prefix, ...args);
      },

      /**
       * Check if logging is enabled
       */
      isEnabled: () => {
        return !isProduction || debugModeEnabled;
      },
    };
  }

  // Export for use in modules
  if (typeof window !== "undefined") {
    window.SuperPromptDebugLogger = { createLogger };
  }

  // Also support module exports if available
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createLogger };
  }
})();
