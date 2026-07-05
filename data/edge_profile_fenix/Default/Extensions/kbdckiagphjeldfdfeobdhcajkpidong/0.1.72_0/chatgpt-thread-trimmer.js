/**
 * chatgpt-thread-trimmer.js
 * Injected script to trim long ChatGPT threads for better performance
 * Keeps only the last N messages visible while hiding older ones
 */

(function () {
  "use strict";

  // ⚠️ PLATFORM CHECK: This module is ChatGPT-only
  const isChatGPT =
    window.location.hostname.includes("chatgpt.com") ||
    window.location.hostname.includes("chat.openai.com") ||
    window.location.hostname.includes("openai.com");

  if (!isChatGPT) {
    return;
  }

  const MESSAGE_SELECTOR = '[data-testid^="conversation-turn-"]';
  const ROLE_SELECTOR = "[data-message-author-role]";
  const DEBUG = false; // Set to true for debugging

  // If we ever sit on 0/0 for too long, we should attempt a resync.
  // In real chats, 0 turns is only possible transiently while the DOM is still swapping.
  const ZERO_WATCHDOG_GRACE_MS = 1500;
  const ZERO_WATCHDOG_RETRY_DELAY_MS = 750;
  const ZERO_WATCHDOG_MAX_RETRIES = 3;

  let settings = {
    enabled: false,
    limit: 50,
    preserveSystem: true,
  };

  let observer = null;
  let isTemporarilyDisabled = false;
  let currentConversationId = null;
  let syncToken = 0;
  let messageMutationTick = 0;
  let currentStats = {
    visible: 0,
    total: 0,
    hidden: 0,
  };

  let zeroWatchdog = {
    conversationId: null,
    firstSeenAt: 0,
    attempts: 0,
    timer: null,
  };

  function log(...args) {
    if (DEBUG) console.log("[ThreadTrimmer]", ...args);
  }

  function getConversationId() {
    const match = window.location.pathname.match(/\/c\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getActiveConversationId() {
    const idFromUrl = getConversationId();
    return currentConversationId || idFromUrl;
  }

  function uniqElements(elements) {
    const unique = [];
    const seen = new Set();
    for (const el of elements) {
      if (!el) continue;
      if (seen.has(el)) continue;
      seen.add(el);
      unique.push(el);
    }
    return unique;
  }

  function getTurnElements() {
    // Primary: classic ChatGPT turns.
    const byTestId = Array.from(document.querySelectorAll(MESSAGE_SELECTOR));
    if (byTestId.length > 0) return byTestId;

    // Fallback: derive turns from role nodes.
    const roleNodes = Array.from(document.querySelectorAll(ROLE_SELECTOR));
    if (roleNodes.length === 0) return [];

    const containers = roleNodes
      .map((node) => {
        return (
          node.closest?.(MESSAGE_SELECTOR) ||
          node.closest?.("article") ||
          node.closest?.("div")
        );
      })
      .filter(Boolean);

    return uniqElements(containers);
  }

  function clearZeroWatchdog() {
    if (zeroWatchdog.timer) {
      clearTimeout(zeroWatchdog.timer);
      zeroWatchdog.timer = null;
    }
    zeroWatchdog.firstSeenAt = 0;
    zeroWatchdog.attempts = 0;
    zeroWatchdog.conversationId = null;
  }

  function scheduleZeroWatchdog(reason) {
    const convId = getActiveConversationId() || getConversationId();
    if (!convId) return;

    // If we have turns, nothing to do.
    const countNow = getTurnElements().length;
    if (countNow > 0) {
      clearZeroWatchdog();
      return;
    }

    // New conversation => reset attempts.
    if (zeroWatchdog.conversationId !== convId) {
      clearZeroWatchdog();
      zeroWatchdog.conversationId = convId;
    }

    if (!zeroWatchdog.firstSeenAt) {
      zeroWatchdog.firstSeenAt = Date.now();
    }

    const ageMs = Date.now() - zeroWatchdog.firstSeenAt;
    if (ageMs < ZERO_WATCHDOG_GRACE_MS) return;
    if (zeroWatchdog.attempts >= ZERO_WATCHDOG_MAX_RETRIES) return;
    if (zeroWatchdog.timer) return;

    zeroWatchdog.timer = setTimeout(() => {
      zeroWatchdog.timer = null;

      // Still same conversation and still 0? Try to re-sync and re-read.
      const stillConvId = getActiveConversationId() || getConversationId();
      if (stillConvId !== convId) {
        clearZeroWatchdog();
        return;
      }

      const count = getTurnElements().length;
      if (count > 0) {
        clearZeroWatchdog();
        applyTrimmingAndPostState();
        return;
      }

      zeroWatchdog.attempts += 1;
      log("0/0 watchdog resync", {
        reason,
        convId,
        attempt: zeroWatchdog.attempts,
      });

      // Re-attach observer in case ChatGPT replaced <main>.
      setupObserver();

      // Wait for DOM to settle, then recompute.
      waitForDOMStable(() => {
        applyTrimmingAndPostState();
        // If we are still 0, schedule another attempt.
        scheduleZeroWatchdog("post-resync");
      });
    }, ZERO_WATCHDOG_RETRY_DELAY_MS);
  }

  function waitForConversationDomChange(token, startCount, startTick) {
    const maxWaitMs = 8000;
    const startTs = Date.now();

    const poll = () => {
      if (token !== syncToken) return;

      const count = getTurnElements().length;

      const changed = count !== startCount || messageMutationTick !== startTick;
      if (changed) {
        // After we detect any change, wait briefly for it to settle.
        waitForDOMStable(() => {
          if (token !== syncToken) return;
          applyTrimmingAndPostState();
        });
        return;
      }

      if (Date.now() - startTs > maxWaitMs) {
        // Fallback: apply anyway (better than being stuck on 0/0).
        applyTrimmingAndPostState();
        return;
      }

      setTimeout(poll, 100);
    };

    poll();
  }

  /**
   * Wait for the DOM to stabilize after navigation.
   * ChatGPT replaces content, so we wait until message count is stable for 300ms.
   */
  function waitForDOMStable(callback, previousCount = -1, stableChecks = 0) {
    const currentCount = getTurnElements().length;

    log("DOM check:", { currentCount, previousCount, stableChecks });

    // If count changed, reset stability counter
    if (currentCount !== previousCount) {
      setTimeout(() => waitForDOMStable(callback, currentCount, 0), 100);
      return;
    }

    // If count is same, increment stability counter
    stableChecks++;

    // Need 3 consecutive stable checks (300ms total stability)
    if (stableChecks >= 3) {
      log("DOM stable with", currentCount, "messages");
      callback(currentCount);
      return;
    }

    // Check again
    setTimeout(
      () => waitForDOMStable(callback, currentCount, stableChecks),
      100
    );
  }

  /**
   * Apply trimming or refresh stats based on settings
   */
  function applyTrimmingAndPostState() {
    if (settings.enabled && !isTemporarilyDisabled) {
      applyTrimming();
    } else {
      refreshStats();
    }
  }

  /**
   * Refresh stats without trimming
   */
  function refreshStats() {
    const messages = getTurnElements();
    currentStats = {
      visible: messages.length,
      total: messages.length,
      hidden: 0,
    };
    postStateUpdate();
  }

  function startConversationSync(nextConversationId) {
    syncToken += 1;
    const token = syncToken;

    currentConversationId = nextConversationId;

    // Emit a loading state for the *new* conversation.
    currentStats = { visible: 0, total: 0, hidden: 0 };
    postStateUpdate();

    const startCount = getTurnElements().length;
    const startTick = messageMutationTick;

    // Wait until we see *any* message DOM changes for this navigation.
    waitForConversationDomChange(token, startCount, startTick);
  }

  /**
   * Handle state request from React component
   */
  function handleStateRequest(messageEvent) {
    const requestConvId = getConversationId();
    const expectedConvId = messageEvent?.data?.payload?.chatId;

    // If React tells us what chat it expects, always sync to that ID.
    if (expectedConvId && expectedConvId !== currentConversationId) {
      log("State requested for different chatId than URL", {
        expectedConvId,
        urlConvId: requestConvId,
      });

      // Kick a sync using the expected ID.
      startConversationSync(expectedConvId);
      return;
    }

    // Check if conversation changed
    if (requestConvId && requestConvId !== currentConversationId) {
      log("Conversation changed:", currentConversationId, "->", requestConvId);
      startConversationSync(requestConvId);
      return;
    }

    // Same conversation - just send current state (or refresh if needed)
    const messages = getTurnElements();

    // If the DOM is mid-swap we can transiently see 0. Don't get stuck there.
    if (messages.length === 0) {
      scheduleZeroWatchdog("state-request");
      // Try a fresh stable-wait then recompute.
      waitForDOMStable(() => {
        applyTrimmingAndPostState();
        scheduleZeroWatchdog("state-request-post");
      });
      return;
    }

    if (messages.length !== currentStats.total) {
      // Stats are stale, refresh
      applyTrimmingAndPostState();
    } else {
      postStateUpdate();
    }
  }

  /**
   * Initialize the thread trimmer
   */
  function init() {
    log("Initializing...");

    loadSettings();
    currentConversationId = getConversationId();

    // Message listener for commands from React
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;

      // Handle settings changes
      if (
        event.data?.type === "sp-thread-trimming-settings-changed" &&
        event.data?.source !== "thread-trimmer"
      ) {
        settings = {
          enabled: event.data.enabled ?? settings.enabled,
          limit: event.data.limit ?? settings.limit,
          preserveSystem: event.data.preserveSystem ?? settings.preserveSystem,
        };

        if (settings.enabled && !isTemporarilyDisabled) {
          applyTrimming();
        } else {
          restoreAllMessages();
        }
        postStateUpdate();
      }

      // Handle commands from UI
      if (event.data?.source === "superprompt-content") {
        switch (event.data.type) {
          case "sp-thread-trimmer-enable":
            settings.enabled = true;
            isTemporarilyDisabled = false;
            localStorage.setItem("sp_thread_trimming_enabled", "1");
            applyTrimming();
            postStateUpdate();
            break;

          case "sp-thread-trimmer-disable":
            settings.enabled = false;
            localStorage.setItem("sp_thread_trimming_enabled", "0");
            restoreAllMessages();
            postStateUpdate();
            break;

          case "sp-thread-trimmer-show-all":
            if (settings.enabled) {
              isTemporarilyDisabled = true;
              restoreAllMessages();
              postStateUpdate();
            }
            break;

          case "sp-thread-trimmer-reenable":
            if (settings.enabled) {
              isTemporarilyDisabled = false;
              applyTrimming();
              postStateUpdate();
            }
            break;

          case "sp-request-thread-trimmer-state":
            handleStateRequest(event);
            break;
        }
      }
    });

    // Setup MutationObserver
    setupObserver();

    // Initial state - wait for DOM to be ready
    waitForDOMStable(() => {
      applyTrimmingAndPostState();
    });

    // Watch for URL changes (SPA navigation) as backup detection
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        const newConvId = getConversationId();
        if (newConvId && newConvId !== currentConversationId) {
          log("URL changed, new conversation:", newConvId);
          startConversationSync(newConvId);
        }
      }
    }, 500);
  }

  /**
   * Load settings from localStorage
   */
  function loadSettings() {
    try {
      const enabled = localStorage.getItem("sp_thread_trimming_enabled");
      const limit = localStorage.getItem("sp_thread_trimming_limit");
      const preserveSystem = localStorage.getItem(
        "sp_thread_trimming_preserve_system"
      );

      settings.enabled = enabled === "1";
      settings.limit = limit
        ? Math.max(10, Math.min(100, parseInt(limit, 10)))
        : 50;
      settings.preserveSystem = preserveSystem !== "0";
    } catch (error) {
      console.warn("[Thread Trimmer] Failed to load settings:", error);
    }
  }

  /**
   * Setup MutationObserver to detect when messages are added
   */
  function setupObserver() {
    if (observer) {
      try {
        observer.disconnect();
      } catch (e) {
        // ignore
      }
      observer = null;
    }

    const chatContainer = document.querySelector("main");
    if (!chatContainer) {
      setTimeout(setupObserver, 1000);
      return;
    }

    observer = new MutationObserver((mutations) => {
      // Track whether the message list actually changed.
      const touchedMessages = mutations.some((mutation) => {
        const nodes = [
          ...Array.from(mutation.addedNodes),
          ...Array.from(mutation.removedNodes),
        ];
        return nodes.some((node) => {
          if (node.nodeType !== 1) return false;
          return (
            node.matches?.(MESSAGE_SELECTOR) ||
            node.querySelector?.(MESSAGE_SELECTOR) ||
            node.matches?.(ROLE_SELECTOR) ||
            node.querySelector?.(ROLE_SELECTOR) ||
            // Last-resort: ChatGPT sometimes reshuffles markup; articles are commonly message containers.
            node.matches?.("article") ||
            node.querySelector?.("article")
          );
        });
      });

      if (touchedMessages) {
        messageMutationTick += 1;
      }

      // Only react to actual message changes
      const messages = getTurnElements();

      if (messages.length === 0) {
        // Avoid being stuck on 0/0; schedule a resync attempt.
        scheduleZeroWatchdog("mutation-observer");
        return;
      }

      if (messages.length === currentStats.total) return;

      // Message count changed
      if (!settings.enabled || isTemporarilyDisabled) {
        // Just update stats
        currentStats.total = messages.length;
        currentStats.visible = messages.length;
        currentStats.hidden = 0;
        postStateUpdate();
      } else {
        // Debounce trimming
        clearTimeout(observer.trimTimeout);
        observer.trimTimeout = setTimeout(() => {
          applyTrimming();
        }, 300);
      }
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Apply trimming to the current thread
   */
  function applyTrimming() {
    const messages = Array.from(getTurnElements());
    const totalMessages = messages.length;

    if (totalMessages <= settings.limit) {
      messages.forEach((msg) => {
        msg.style.display = "";
        msg.dataset.spTrimmed = "false";
      });

      currentStats = {
        visible: totalMessages,
        total: totalMessages,
        hidden: 0,
      };
      postStateUpdate();
      return;
    }

    let visibleCount = 0;
    let hiddenCount = 0;

    messages.reverse().forEach((msg, index) => {
      const shouldKeep = index < settings.limit;
      const isSystemMessage =
        settings.preserveSystem &&
        (msg.querySelector('[data-message-author-role="system"]') ||
          msg.querySelector('[data-message-author-role="tool"]'));
      const hasHighlights = msg.querySelector(".sp-highlight") !== null;

      if (shouldKeep || isSystemMessage || hasHighlights) {
        msg.style.display = "";
        msg.dataset.spTrimmed = "false";
        visibleCount++;
      } else {
        msg.style.display = "none";
        msg.dataset.spTrimmed = "true";
        hiddenCount++;
      }
    });

    currentStats = {
      visible: visibleCount,
      total: totalMessages,
      hidden: hiddenCount,
    };
    postStateUpdate();
  }

  /**
   * Restore all hidden messages
   */
  function restoreAllMessages() {
    const messages = getTurnElements();
    messages.forEach((msg) => {
      msg.style.display = "";
      msg.dataset.spTrimmed = "false";
    });

    currentStats = {
      visible: messages.length,
      total: messages.length,
      hidden: 0,
    };
    postStateUpdate();
  }

  /**
   * Post state update to content script
   */
  function postStateUpdate() {
    const conversationId = getActiveConversationId();
    if (conversationId && conversationId !== currentConversationId) {
      currentConversationId = conversationId;
    }
    log("Posting state:", { conversationId, currentStats, settings });

    if ((currentStats?.total ?? 0) === 0) {
      scheduleZeroWatchdog("post-state");
    } else {
      clearZeroWatchdog();
    }

    window.postMessage(
      {
        type: "sp-thread-trimmer-state-update",
        source: "thread-trimmer",
        payload: {
          conversationId,
          enabled: settings.enabled,
          temporarilyDisabled: isTemporarilyDisabled,
          stats: currentStats,
          limit: settings.limit,
        },
      },
      "*"
    );
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
