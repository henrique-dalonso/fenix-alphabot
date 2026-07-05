/**
 * SuperPrompt User Detection Module
 * ChatGPT user account detection and backend registration system
 * Extracted from chat-gpt-page-listener.js for better maintainability
 */

(function () {
  "use strict";

  // Prevent multiple initialization
  if (window.SuperPromptUserDetection) {
    return;
  }

  // Only log module loading in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog("[SP-UserDetection] Initializing User Detection module...");
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                        USER DETECTION SYSTEM                          ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global user detection state
  let userInfoSent = false;
  let userDetectionAttempts = 0;
  const MAX_USER_DETECTION_ATTEMPTS = 10;
  let pendingUserDetection = null; // Deduplicate concurrent attempts
  let lastUserDetectionAttempt = 0;
  const USER_DETECTION_DEBOUNCE_MS = 3000; // Prevent attempts within 3s

  // Browser detection utility
  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";

    if (ua.includes("Chrome") && !ua.includes("Edge")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    return {
      name: browser,
      version:
        ua.match(/(?:Chrome|Firefox|Safari|Edge)\/([\\d\\.]+)/)?.[1] ||
        "Unknown",
      userAgent: ua,
    };
  }

  // Plus subscription detection
  function detectPlusSubscription() {
    try {
      // Check for Plus indicators in DOM
      const plusIndicators = [
        '[data-testid*="plus"]',
        ".text-orange-500",
        '[class*="plus"]',
        ".premium-indicator",
      ];

      for (const selector of plusIndicators) {
        if (document.querySelector(selector)) {
          return true;
        }
      }

      // Check localStorage for subscription data
      const sessionData = localStorage.getItem("session");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.user?.groups?.includes("chatgpt_plus")) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  // Get account info from ChatGPT backend API
  async function getAccountFromBackendAPI() {
    try {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "🔍 Fetching account info from ChatGPT session API..."
        );
      }

      const response = await fetch("https://chatgpt.com/api/auth/session", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (window.SuperPromptCoreUtils?.log) {
          window.SuperPromptCoreUtils.log(
            "✅ Got session data from ChatGPT:",
            data
          );
        }

        // Extract user info from session data
        const user = data.user;
        const account = data.account;

        if (user) {
          const userInfo = {
            id: user.id || account?.account_id || "unknown",
            openai_id: user.id || account?.account_id || "unknown",
            email: user.email || null,
            name: user.name || user.first_name || "ChatGPT User",
            avatar: user.image || user.picture || null,
            plus: account?.plan_type === "plus" || false,
            plan_type: account?.plan_type || "free",
            version: "1.0.0",
            user_agent: navigator.userAgent,
          };

          if (window.SuperPromptCoreUtils?.log) {
            window.SuperPromptCoreUtils.log(
              "🚀 FINAL USER INFO WITH EMAIL FROM SESSION:",
              userInfo
            );
          }
          return userInfo;
        }

        if (data.accounts && data.accounts.default) {
          const account = data.accounts.default;
          return {
            id: account.account_id,
            email: account.email,
            name: account.name || account.email?.split("@")[0],
            picture: account.picture,
            plus: account.entitlement?.has_active_subscription || false,
          };
        }
      } else {
        if (window.SuperPromptCoreUtils?.log) {
          window.SuperPromptCoreUtils.log(
            "⚠️ ChatGPT session API returned:",
            response.status
          );
        }
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "❌ Error fetching account from backend API:",
          error
        );
      }
      return null;
    }
  }

  // Extract ChatGPT user information from the page
  async function extractChatGPTUserInfo() {
    try {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "🔍 Starting user extraction with multiple strategies..."
        );
      }

      // Strategy 0: Try ChatGPT Backend API first (most reliable)
      const backendUser = await getAccountFromBackendAPI();
      if (backendUser) {
        if (window.SuperPromptCoreUtils?.log) {
          window.SuperPromptCoreUtils.log(
            "✅ Found user data from ChatGPT Backend API:",
            backendUser
          );
        }
        return backendUser;
      }

      // Strategy 1: Check for user data in ChatGPT's store/state
      const userDataStore = window?.__NEXT_DATA__?.props?.pageProps?.user;
      if (userDataStore) {
        if (window.SuperPromptCoreUtils?.log) {
          window.SuperPromptCoreUtils.log(
            "✅ Found user data in __NEXT_DATA__:",
            userDataStore
          );
        }
        return {
          id: userDataStore.id,
          email: userDataStore.email,
          name: userDataStore.name,
          picture: userDataStore.picture,
          plus: userDataStore.groups?.includes("chatgpt_plus") || false,
        };
      }

      // Strategy 2: Check localStorage for ChatGPT session data
      const possibleKeys = [
        "session",
        "user",
        "auth",
        "chatgpt-user",
        "oai-user",
        "oai-session",
      ];

      for (const key of possibleKeys) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            if (window.SuperPromptCoreUtils?.log) {
              window.SuperPromptCoreUtils.log(
                `🔍 Checking localStorage key '${key}':`,
                parsed
              );
            }

            if (parsed.user) {
              if (window.SuperPromptCoreUtils?.log) {
                window.SuperPromptCoreUtils.log(
                  "✅ Found user data in localStorage session:",
                  parsed.user
                );
              }
              return {
                id: parsed.user.id,
                email: parsed.user.email,
                name: parsed.user.name,
                picture: parsed.user.picture,
                plus: parsed.user.groups?.includes("chatgpt_plus") || false,
              };
            }
          } catch (e) {
            if (window.SuperPromptCoreUtils?.log) {
              window.SuperPromptCoreUtils.log(
                `⚠️ Failed to parse localStorage ${key}:`,
                e
              );
            }
          }
        }
      }

      // Strategy 3: Extract user ID from cache keys
      const cacheKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache/user-")
      );
      if (cacheKeys.length > 0) {
        const cacheKey = cacheKeys[0];
        const userIdMatch = cacheKey.match(/cache\/user-([a-zA-Z0-9]+)\//);
        if (userIdMatch) {
          const userId = userIdMatch[1];
          if (window.SuperPromptCoreUtils?.log) {
            window.SuperPromptCoreUtils.log(
              `✅ Found user ID from cache key: ${userId}`
            );
          }

          // Try to get more user info from other localStorage keys
          const chatThemeKey = `oai/apps/chatTheme/user-${userId}`;
          const hasTheme = localStorage.getItem(chatThemeKey);

          if (hasTheme) {
            if (window.SuperPromptCoreUtils?.log) {
              window.SuperPromptCoreUtils.log(
                `✅ Confirmed user ${userId} is active (has chat theme)`
              );
            }
            return {
              id: userId,
              email: null,
              name: "ChatGPT User",
              picture: null,
              plus: detectPlusSubscription(),
            };
          }
        }
      }

      // Strategy 4: Check for user avatar/profile elements in DOM
      const profileSelectors = [
        '[data-testid="profile-button"]',
        'button[aria-label*="Profile"]',
        'button[aria-label*="Account"]',
        'button[aria-label*="User"]',
        "[data-headlessui-state] img",
        'nav img[alt*="user"]',
        ".avatar img",
        'button img[src*="user"]',
      ];

      for (const selector of profileSelectors) {
        const profileButton = document.querySelector(selector);
        if (profileButton) {
          if (window.SuperPromptCoreUtils?.log) {
            window.SuperPromptCoreUtils.log(
              `🔍 Found profile element with selector: ${selector}`,
              profileButton
            );
          }

          const img =
            profileButton.tagName === "IMG"
              ? profileButton
              : profileButton.querySelector("img");
          const avatarUrl = img?.src;

          if (avatarUrl) {
            if (window.SuperPromptCoreUtils?.log) {
              window.SuperPromptCoreUtils.log(
                "✅ Found user avatar in DOM:",
                avatarUrl
              );
            }

            // Try to extract user ID from avatar URL pattern
            const idMatch = avatarUrl.match(/user-([a-zA-Z0-9]+)/);
            const userId = idMatch ? idMatch[1] : `user-${Date.now()}`;

            return {
              id: userId,
              email: null,
              name: profileButton.getAttribute("aria-label") || "ChatGPT User",
              picture: avatarUrl,
              plus: detectPlusSubscription(),
            };
          }
        }
      }

      // Strategy 5: Last resort - generate anonymous user
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "⚠️ No user data found, using anonymous user"
        );
      }

      return {
        id: `anonymous-${Date.now()}`,
        email: null,
        name: "ChatGPT User",
        picture: null,
        plus: detectPlusSubscription(),
      };
    } catch (error) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "❌ Error extracting user info:",
          error
        );
      }
      return null;
    }
  }

  // Send user registration to backend
  async function sendUserRegistrationToBackend(userInfo) {
    // Early exit if already sent
    if (!userInfo || userInfoSent) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "⏭️ Skipping user registration (already sent)"
        );
      }
      return;
    }

    // Mark as sent IMMEDIATELY to prevent race conditions
    userInfoSent = true;

    try {
      // Create registration payload
      const registrationData = {
        platform: "chatgpt",
        user_id: userInfo.id,
        openai_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || "ChatGPT User",
        avatar_url: userInfo.picture || userInfo.avatar,
        plus: userInfo.plus || detectPlusSubscription(),
        navigator: getBrowserInfo(),
        version: "1.0.0", // Extension version
        total_conversations: 0,
        multiple_accounts: false,
      };

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "📤 Sending user registration to Railway backend:",
          registrationData
        );
      }

      // Send to content script which will forward to background script and Railway API
      window.postMessage(
        {
          type: "chatgpt-user-detected",
          userInfo: registrationData,
          source: "chatgpt-injected",
        },
        "*"
      );

      userInfoSent = true;
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "✅ User registration sent to content script"
        );
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "❌ Error sending user registration:",
          error
        );
      }
    }
  }

  // Attempt user detection with retries
  async function attemptUserDetection() {
    // Early exit if already sent
    if (userInfoSent) {
      return;
    }

    // Debounce: prevent rapid retries
    const now = Date.now();
    if (now - lastUserDetectionAttempt < USER_DETECTION_DEBOUNCE_MS) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "⏭️ User detection debounced (too soon since last attempt)"
        );
      }
      return;
    }

    // Max attempts check
    if (userDetectionAttempts >= MAX_USER_DETECTION_ATTEMPTS) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "🛑 Max user detection attempts reached"
        );
      }
      return;
    }

    // Deduplicate concurrent attempts
    if (pendingUserDetection) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "⏳ User detection already in progress, reusing existing attempt"
        );
      }
      return pendingUserDetection;
    }

    lastUserDetectionAttempt = now;
    userDetectionAttempts++;

    if (window.SuperPromptCoreUtils?.log) {
      window.SuperPromptCoreUtils.log(
        `🔍 Attempting ChatGPT user detection (attempt ${userDetectionAttempts}/${MAX_USER_DETECTION_ATTEMPTS})`
      );
    }

    // Create detection promise for deduplication
    pendingUserDetection = (async () => {
      try {
        const userInfo = await extractChatGPTUserInfo();
        if (userInfo && userInfo.id) {
          if (window.SuperPromptCoreUtils?.log) {
            window.SuperPromptCoreUtils.log(
              "✅ ChatGPT user detected successfully:",
              userInfo
            );
          }
          await sendUserRegistrationToBackend(userInfo);
        } else {
          if (window.SuperPromptCoreUtils?.log) {
            window.SuperPromptCoreUtils.log(
              `⚠️ User detection attempt ${userDetectionAttempts} failed`
            );
          }

          // Schedule retry with exponential backoff (but don't block)
          if (userDetectionAttempts < MAX_USER_DETECTION_ATTEMPTS) {
            const delay = Math.min(2000 * userDetectionAttempts, 10000);
            setTimeout(() => {
              pendingUserDetection = null; // Clear pending so retry can run
              attemptUserDetection();
            }, delay);
          }
        }
      } finally {
        pendingUserDetection = null;
      }
    })();

    return pendingUserDetection;
  }

  // Initialize user detection
  function initializeUserDetection() {
    if (window.SuperPromptCoreUtils?.log) {
      window.SuperPromptCoreUtils.log(
        "🚀 Initializing ChatGPT user auto-detection..."
      );
    }

    // Start detection immediately
    attemptUserDetection();

    // Single retry after 3s in case page was still loading
    // (further retries handled by attemptUserDetection's own backoff)
    setTimeout(attemptUserDetection, 3000);
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                        MODULE EXPORTS                                  ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global namespace for user detection functionality
  window.SuperPromptUserDetection = {
    // Core user detection functions
    extractChatGPTUserInfo,
    getAccountFromBackendAPI,
    detectPlusSubscription,
    sendUserRegistrationToBackend,
    attemptUserDetection,
    initializeUserDetection,
    getBrowserInfo,

    // State getters
    isUserDetectionComplete: () => userInfoSent,
    getUserDetectionAttempts: () => userDetectionAttempts,
    getMaxAttempts: () => MAX_USER_DETECTION_ATTEMPTS,

    // Utilities for other modules
    resetUserDetection: () => {
      userInfoSent = false;
      userDetectionAttempts = 0;
    },

    // Manual trigger for other modules
    triggerUserDetection: () => {
      if (!userInfoSent) {
        attemptUserDetection();
      }
    },
  };

  // Auto-initialize user detection on page load
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(initializeUserDetection, 100);
  } else {
    document.addEventListener("DOMContentLoaded", initializeUserDetection);
  }

  // Fallback initialization
  setTimeout(() => {
    if (!userInfoSent) {
      initializeUserDetection();
    }
  }, 2000);

  // Mark module as available
  window.userDetectionAvailable = true;

  // Only log success in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog(
      "✅ [SP-UserDetection] User Detection module initialized successfully"
    );
  }
})();
