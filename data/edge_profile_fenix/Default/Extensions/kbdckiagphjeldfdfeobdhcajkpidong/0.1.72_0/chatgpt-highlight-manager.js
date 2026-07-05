/**
 * chatgpt-highlight-manager.js
 * Injected script to manage text highlighting in ChatGPT messages
 * Handles DOM manipulation, selection, and persistence
 */

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

  const HIGHLIGHT_CLASS = "sp-highlight";
  const HIGHLIGHT_ACTIVE_CLASS = "sp-highlight-active";
  const HIGHLIGHT_DATA_ATTR = "data-sp-highlight-id";
  // Support both user and assistant messages for highlighting
  const MESSAGE_SELECTOR =
    '[data-message-author-role="assistant"], [data-message-author-role="user"]';

  // Highlight storage (synced from IndexedDB via content script)
  let highlights = [];
  let currentHighlightIndex = -1;
  let selectedColor = "yellow"; // Default highlight color

  /**
   * Initialize the highlight manager
   */
  function init() {
    // Load saved color from localStorage
    const savedColor = localStorage.getItem("sp-highlight-selected-color");
    if (savedColor) {
      selectedColor = savedColor;
    }

    injectStyles();
    setupMessageObserver();
    setupMessageListeners();

    // Notify content script that we are ready
    window.postMessage(
      {
        type: "sp-highlight-manager-ready",
        source: "highlight-manager",
      },
      "*",
    );
  }

  function injectStyles() {
    if (document.getElementById("sp-highlight-styles")) return;

    const style = document.createElement("style");
    style.id = "sp-highlight-styles";
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        background-color: rgba(254, 240, 138, 0.5);
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 1px 2px;
        position: relative;
      }
      
      .${HIGHLIGHT_CLASS}:hover {
        background-color: rgba(254, 240, 138, 0.7);
      }
      
      .${HIGHLIGHT_CLASS}.${HIGHLIGHT_ACTIVE_CLASS} {
        box-shadow: 
          0 0 0 2px rgba(59, 130, 246, 0.8),
          0 0 12px rgba(59, 130, 246, 0.4),
          0 4px 16px rgba(59, 130, 246, 0.3);
        border-radius: 4px;
        z-index: 10;
        animation: sp-highlight-pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes sp-highlight-pulse {
        0%, 100% { 
          box-shadow: 
            0 0 0 2px rgba(59, 130, 246, 0.8),
            0 0 12px rgba(59, 130, 246, 0.4),
            0 4px 16px rgba(59, 130, 246, 0.3);
        }
        50% { 
          box-shadow: 
            0 0 0 2px rgba(59, 130, 246, 1),
            0 0 20px rgba(59, 130, 246, 0.6),
            0 4px 24px rgba(59, 130, 246, 0.5);
        }
      }
      
      /* Different highlight colors */
      .${HIGHLIGHT_CLASS}[data-color="yellow"] {
        background-color: rgba(254, 240, 138, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="yellow"]:hover {
        background-color: rgba(254, 240, 138, 0.7);
      }
      .${HIGHLIGHT_CLASS}[data-color="green"] {
        background-color: rgba(134, 239, 172, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="green"]:hover {
        background-color: rgba(134, 239, 172, 0.7);
      }
      .${HIGHLIGHT_CLASS}[data-color="blue"] {
        background-color: rgba(147, 197, 253, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="blue"]:hover {
        background-color: rgba(147, 197, 253, 0.7);
      }
      .${HIGHLIGHT_CLASS}[data-color="red"] {
        background-color: rgba(252, 165, 165, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="red"]:hover {
        background-color: rgba(252, 165, 165, 0.7);
      }
      .${HIGHLIGHT_CLASS}[data-color="purple"] {
        background-color: rgba(216, 180, 254, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="purple"]:hover {
        background-color: rgba(216, 180, 254, 0.7);
      }
      .${HIGHLIGHT_CLASS}[data-color="pink"] {
        background-color: rgba(249, 168, 212, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="pink"]:hover {
        background-color: rgba(249, 168, 212, 0.7);
      }
      .${HIGHLIGHT_CLASS}[data-color="orange"] {
        background-color: rgba(253, 186, 116, 0.5);
      }
      .${HIGHLIGHT_CLASS}[data-color="orange"]:hover {
        background-color: rgba(253, 186, 116, 0.7);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup MutationObserver to detect when messages are added/changed
   */
  function setupMessageObserver() {
    const chatContainer = document.querySelector("main");
    if (!chatContainer) {
      console.warn("[Highlight Manager] Chat container not found");
      return;
    }

    const observer = new MutationObserver((mutations) => {
      // Check if any assistant messages were added or modified
      const shouldReapply = mutations.some((mutation) => {
        if (mutation.type === "childList") {
          return Array.from(mutation.addedNodes).some((node) => {
            if (node.nodeType === 1) {
              // Performance Optimization: Ignore our own highlight spans to prevent loops
              if (node.classList && node.classList.contains(HIGHLIGHT_CLASS)) {
                return false;
              }
              return node.querySelector && node.querySelector(MESSAGE_SELECTOR);
            }
            return false;
          });
        }
        return false;
      });

      if (shouldReapply && highlights.length > 0) {
        setTimeout(() => applyAllHighlights(), 100);
      }
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Listen for messages from content script
   */
  function setupMessageListeners() {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== "superprompt-content") return;

      const { type, payload } = event.data;

      switch (type) {
        case "sp-set-highlights":
          highlights = payload.highlights || [];
          currentHighlightIndex = -1;
          applyAllHighlights();
          postNavigationUpdate();
          break;

        case "sp-add-highlight":
          highlights.push(payload.highlight);
          applyHighlight(payload.highlight);
          postNavigationUpdate();
          break;

        case "sp-remove-highlight":
          removeHighlightFromDOM(payload.id);
          highlights = highlights.filter((h) => h.id !== payload.id);
          if (currentHighlightIndex >= highlights.length) {
            currentHighlightIndex = highlights.length - 1;
          }
          postNavigationUpdate();
          break;

        case "sp-clear-highlights":
          clearAllHighlights();
          highlights = [];
          currentHighlightIndex = -1;
          postNavigationUpdate();
          break;

        case "sp-navigate-highlight":
          navigateHighlight(payload.direction);
          break;

        case "sp-request-create-highlight":
          handleCreateHighlightRequest();
          break;

        case "sp-request-highlight-state":
          // Request from toolbar to send current state (e.g., after chat navigation)
          postNavigationUpdate();
          break;

        case "sp-highlight-color-changed":
          // Update selected color when user changes it in toolbar
          selectedColor = payload.color || "yellow";
          console.log("Highlight color changed to:", selectedColor);
          break;
      }
    });
  }

  /**
   * Apply all highlights to the DOM
   */
  function applyAllHighlights() {
    clearAllHighlights();
    highlights.forEach((highlight) => applyHighlight(highlight));
  }

  /**
   * Apply a single highlight to the DOM
   */
  function applyHighlight(highlight) {
    const messageElement = findMessageElement(highlight.messageId);
    if (!messageElement) {
      // This is common during loading/streaming, so we use debug instead of warn
      // The MutationObserver will retry applying highlights as elements appear
      console.debug(
        "[Highlight Manager] Message element not found (yet)",
        highlight.messageId,
      );
      return;
    }

    const textContent = messageElement.textContent || "";
    let startIndex = -1;
    let endIndex = -1;

    // Strategy 1: Use stored offsets (most reliable, calculated via Range API)
    if (
      highlight.startOffset !== undefined &&
      highlight.endOffset !== undefined
    ) {
      const testText = textContent.substring(
        highlight.startOffset,
        highlight.endOffset,
      );
      const normalizedTest = testText.replace(/\s+/g, " ").trim();
      const normalizedExpected = highlight.text.replace(/\s+/g, " ").trim();

      if (normalizedTest === normalizedExpected) {
        startIndex = highlight.startOffset;
        endIndex = highlight.endOffset;
      }
    }

    // Strategy 2: Try using context if stored offsets failed
    if (startIndex === -1 && highlight.textBefore && highlight.textAfter) {
      const contextSearch =
        highlight.textBefore + highlight.text + highlight.textAfter;
      const contextIndex = textContent.indexOf(contextSearch);

      if (contextIndex !== -1) {
        // Found with context - adjust for the "before" part
        startIndex = contextIndex + highlight.textBefore.length;
        endIndex = startIndex + highlight.text.length;
      }
    }

    // Strategy 3: Fallback to direct text search (without normalization)
    if (startIndex === -1) {
      startIndex = textContent.indexOf(highlight.text);
      if (startIndex !== -1) {
        endIndex = startIndex + highlight.text.length;
      }
    }

    if (startIndex === -1) {
      console.warn(
        "[Highlight Manager] Could not locate highlight text",
        highlight.text.substring(0, 50) + "...",
      );
      return;
    }

    // Apply highlight to the text range
    applyHighlightToRange(messageElement, startIndex, endIndex, highlight);
  }

  /**
   * Apply highlight styling to a text range
   */
  function applyHighlightToRange(container, startOffset, endOffset, highlight) {
    try {
      // Create a TreeWalker to iterate through text nodes
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
      );

      let currentOffset = 0;
      const nodesToWrap = [];

      // Find all text nodes that need highlighting
      let textNode;
      while ((textNode = walker.nextNode())) {
        const nodeLength = textNode.textContent.length;
        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + nodeLength;

        // Check if this node overlaps with our highlight range
        if (nodeEnd > startOffset && nodeStart < endOffset) {
          const highlightStart = Math.max(0, startOffset - nodeStart);
          const highlightEnd = Math.min(nodeLength, endOffset - nodeStart);

          nodesToWrap.push({
            node: textNode,
            start: highlightStart,
            end: highlightEnd,
          });
        }

        currentOffset = nodeEnd;

        // Stop if we've passed the end
        if (nodeStart >= endOffset) break;
      }

      if (nodesToWrap.length === 0) {
        console.warn("[Highlight Manager] No text nodes found in range");
        return;
      }

      // Wrap each text node (or portion of it)
      nodesToWrap.forEach(({ node, start, end }) => {
        try {
          const text = node.textContent;
          const before = text.substring(0, start);
          const highlighted = text.substring(start, end);
          const after = text.substring(end);

          // Skip if the highlighted portion is only whitespace
          if (highlighted.trim() === "") {
            return;
          }

          // Create highlight span
          const span = document.createElement("span");
          span.className = HIGHLIGHT_CLASS;
          span.setAttribute(HIGHLIGHT_DATA_ATTR, highlight.id);
          span.setAttribute("data-color", highlight.color || "yellow");
          span.title = highlight.note || "Click to navigate to this highlight";
          span.textContent = highlighted;

          // Add click handler
          span.addEventListener("click", (e) => {
            e.stopPropagation();
            jumpToHighlight(highlight.id);
          });

          // Create document fragment with before, span, after
          const fragment = document.createDocumentFragment();
          if (before) fragment.appendChild(document.createTextNode(before));
          fragment.appendChild(span);
          if (after) fragment.appendChild(document.createTextNode(after));

          // Replace the original text node
          node.parentNode.replaceChild(fragment, node);
        } catch (err) {
          console.error("[Highlight Manager] Error wrapping text node:", err);
        }
      });
    } catch (err) {
      console.error("[Highlight Manager] Error applying highlight", err);
    }
  }

  /**
   * Remove a specific highlight from the DOM
   */
  function removeHighlightFromDOM(highlightId) {
    const spans = document.querySelectorAll(
      `[${HIGHLIGHT_DATA_ATTR}="${highlightId}"]`,
    );
    spans.forEach((span) => {
      const text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
    });
  }

  /**
   * Clear all highlights from the DOM
   */
  function clearAllHighlights() {
    const spans = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    spans.forEach((span) => {
      const text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
    });
  }

  /**
   * Navigate to next or previous highlight
   */
  function navigateHighlight(direction) {
    if (highlights.length === 0) return;

    // Remove active class from current
    if (
      currentHighlightIndex >= 0 &&
      currentHighlightIndex < highlights.length
    ) {
      const currentSpan = document.querySelector(
        `[${HIGHLIGHT_DATA_ATTR}="${highlights[currentHighlightIndex].id}"]`,
      );
      if (currentSpan) {
        currentSpan.classList.remove(HIGHLIGHT_ACTIVE_CLASS);
      }
    }

    // Calculate new index
    if (direction === "next") {
      currentHighlightIndex = (currentHighlightIndex + 1) % highlights.length;
    } else if (direction === "prev") {
      currentHighlightIndex =
        currentHighlightIndex <= 0
          ? highlights.length - 1
          : currentHighlightIndex - 1;
    }

    // Jump to the new highlight
    const targetId = highlights[currentHighlightIndex].id;
    jumpToHighlight(targetId);
  }

  /**
   * Jump to a specific highlight and scroll into view
   */
  function jumpToHighlight(highlightId) {
    // Find ALL spans with this highlight ID (highlights can span multiple elements)
    const spans = document.querySelectorAll(
      `[${HIGHLIGHT_DATA_ATTR}="${highlightId}"]`,
    );
    if (spans.length === 0) {
      console.warn("[Highlight Manager] Highlight span not found", highlightId);
      return;
    }

    // Remove active class from all highlights
    document.querySelectorAll(`.${HIGHLIGHT_ACTIVE_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_ACTIVE_CLASS);
    });

    // Add active class to ALL spans belonging to this highlight
    spans.forEach((span) => {
      span.classList.add(HIGHLIGHT_ACTIVE_CLASS);
    });

    // Scroll the first span into view
    spans[0].scrollIntoView({ behavior: "smooth", block: "center" });

    // Update current index
    currentHighlightIndex = highlights.findIndex((h) => h.id === highlightId);
    postNavigationUpdate();

    // Ensure toolbar is visible
    window.postMessage(
      {
        type: "sp-show-highlight-toolbar",
        source: "highlight-manager",
      },
      "*",
    );
  }

  /**
   * Post navigation state update to content script
   */
  function postNavigationUpdate() {
    const currentId =
      currentHighlightIndex >= 0 && currentHighlightIndex < highlights.length
        ? highlights[currentHighlightIndex].id
        : null;

    window.postMessage(
      {
        type: "sp-highlight-navigation-update",
        source: "highlight-manager",
        payload: {
          total: highlights.length,
          current: currentHighlightIndex + 1,
          hasHighlights: highlights.length > 0,
          currentId: currentId,
        },
      },
      "*",
    );
  }

  /**
   * Handle request to create a highlight from current selection
   */
  function handleCreateHighlightRequest() {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.rangeCount === 0 ||
      selection.toString().trim() === ""
    ) {
      window.postMessage(
        {
          type: "sp-highlight-creation-failed",
          source: "highlight-manager",
          payload: { error: "No text selected" },
        },
        "*",
      );
      return;
    }

    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);

    // Find the message element containing the selection
    let messageElement = range.commonAncestorContainer;
    while (messageElement && messageElement.nodeType !== 1) {
      messageElement = messageElement.parentNode;
    }

    while (
      messageElement &&
      messageElement.matches &&
      !messageElement.matches(MESSAGE_SELECTOR)
    ) {
      messageElement = messageElement.parentNode;
    }

    // Verify we found a valid message element
    if (
      messageElement &&
      (!messageElement.matches || !messageElement.matches(MESSAGE_SELECTOR))
    ) {
      messageElement = null;
    }

    if (!messageElement) {
      window.postMessage(
        {
          type: "sp-highlight-creation-failed",
          source: "highlight-manager",
          payload: { error: "Selection not in a message" },
        },
        "*",
      );
      return;
    }

    // Extract message ID (ChatGPT stores it in various places)
    const messageId = extractMessageId(messageElement);
    if (!messageId) {
      window.postMessage(
        {
          type: "sp-highlight-creation-failed",
          source: "highlight-manager",
          payload: { error: "Could not determine message ID" },
        },
        "*",
      );
      return;
    }

    // Calculate offsets and context using Range API for accuracy
    const messageText = messageElement.textContent || "";

    // Calculate start offset by measuring text length before selection start
    let startOffset = 0;
    try {
      const beforeRange = document.createRange();
      beforeRange.setStart(messageElement, 0);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      startOffset = beforeRange.toString().length;
    } catch (e) {
      console.warn(
        "[Highlight] Failed to calculate start offset via Range, falling back to indexOf",
        e,
      );
      startOffset = messageText.indexOf(selectedText);
      if (startOffset === -1) {
        // Try with normalized whitespace
        const normalizedSelected = selectedText.replace(/\s+/g, " ");
        const normalizedMessage = messageText.replace(/\s+/g, " ");
        startOffset = normalizedMessage.indexOf(normalizedSelected);
        if (startOffset === -1) {
          window.postMessage(
            {
              type: "sp-highlight-creation-failed",
              source: "highlight-manager",
              payload: { error: "Could not locate selected text" },
            },
            "*",
          );
          return;
        }
      }
    }

    const endOffset = startOffset + selectedText.length;
    const textBefore = messageText.substring(
      Math.max(0, startOffset - 50),
      startOffset,
    );
    const textAfter = messageText.substring(
      endOffset,
      Math.min(messageText.length, endOffset + 50),
    );

    // Post highlight data to content script for saving
    window.postMessage(
      {
        type: "sp-highlight-created",
        source: "highlight-manager",
        payload: {
          messageId,
          text: selectedText,
          textBefore,
          textAfter,
          startOffset,
          endOffset,
          color: selectedColor, // Include selected color from toolbar
        },
      },
      "*",
    );

    // Clear selection
    selection.removeAllRanges();
  }

  /**
   * Find message element by message ID
   */
  function findMessageElement(messageId) {
    const messages = document.querySelectorAll(MESSAGE_SELECTOR);
    for (const msg of messages) {
      if (extractMessageId(msg) === messageId) {
        return msg;
      }
    }
    return null;
  }

  /**
   * Extract message ID from a message element
   * ChatGPT stores message IDs in various data attributes
   */
  function extractMessageId(element) {
    // Try common patterns
    const dataMessageId = element.getAttribute("data-message-id");
    if (dataMessageId) return dataMessageId;

    // Try to find in parent structure
    const parentWithId = element.closest("[data-message-id]");
    if (parentWithId) return parentWithId.getAttribute("data-message-id");

    // Fallback: generate stable ID from position and content
    const allMessages = Array.from(document.querySelectorAll(MESSAGE_SELECTOR));
    const index = allMessages.indexOf(element);
    const contentHash = simpleHash(element.textContent.substring(0, 100));
    return `msg-${index}-${contentHash}`;
  }

  /**
   * Simple hash function for fallback message IDs
   */
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
