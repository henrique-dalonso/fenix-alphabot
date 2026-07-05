// ██████████████████████████████████████████████████████████████████████████████
// ██                        SUPERPROMPT QUICK ACCESS MENU                   ██
// ██                                                                        ██
// ██   Slash command system, prompt search & insertion, floating menu       ██
// ██████████████████████████████████████████████████████████████████████████

// Global namespace for quick access menu utilities
window.SuperPromptQuickAccessMenu = {
  // ============================================================================
  // STATE AND CONFIGURATION
  // ============================================================================

  showFavoritesOnly: false,
  ultimateInterceptionInitialized: false,
  nukeHandlersInitialized: false,
  inputForm: null,

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Simple debounce function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  },

  /**
   * Get current text selection position
   * @returns {Object|null} Selection position data
   */
  getSelectionPosition() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    const offset = range.startOffset;

    // Find the editable parent
    let parentElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;

    // Walk up to find contenteditable parent
    while (parentElement && parentElement.contentEditable !== "true") {
      parentElement = parentElement.parentElement;
    }

    if (!parentElement) return null;

    return {
      start: offset,
      parentElement: parentElement,
    };
  },

  /**
   * Find previous character position
   * @param {HTMLElement} element - Element to search in
   * @param {string} char - Character to find
   * @param {number} fromPosition - Starting position
   * @returns {number} Position or -1 if not found
   */
  previousCharPosition(element, char, fromPosition) {
    const text = element.textContent || element.innerText || "";
    for (let i = fromPosition - 1; i >= 0; i--) {
      if (text[i] === char) return i;
    }
    return -1;
  },

  /**
   * Find next character position
   * @param {HTMLElement} element - Element to search in
   * @param {string} char - Character to find
   * @param {number} fromPosition - Starting position
   * @returns {number} Position or -1 if not found
   */
  nextCharPosition(element, char, fromPosition) {
    const text = element.textContent || element.innerText || "";
    for (let i = fromPosition; i < text.length; i++) {
      if (text[i] === char) return i;
    }
    return -1;
  },

  /**
   * Get character at specific position
   * @param {HTMLElement} element - Element to check
   * @param {number} position - Position to check
   * @returns {string|null} Character or null
   */
  getCharAtPosition(element, position) {
    const text = element.textContent || element.innerText || "";
    return position >= 0 && position < text.length ? text[position] : null;
  },

  /**
   * Get string between two positions
   * @param {HTMLElement} element - Element to extract from
   * @param {number} startPos - Start position
   * @param {number} endPos - End position
   * @returns {string} Extracted string
   */
  getStringBetween(element, startPos, endPos) {
    const text = element.textContent || element.innerText || "";
    return text.substring(startPos, endPos);
  },

  // ============================================================================
  // PROMPT FIELD DETECTION
  // ============================================================================

  /**
   * Check if element is a prompt input field
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Whether element is a prompt field
   */
  isPromptField(element) {
    if (!element) return false;

    const isContentEditable = element.contentEditable === "true";
    const isTextArea = element.tagName?.toLowerCase() === "textarea";
    const hasPromptAttributes =
      element.hasAttribute("data-testid") &&
      element.getAttribute("data-testid").includes("composer");

    return (
      (isContentEditable || isTextArea) &&
      (hasPromptAttributes ||
        element.closest("form") ||
        element.id?.includes("prompt") ||
        element.placeholder?.toLowerCase().includes("message"))
    );
  },

  /**
   * Find the active prompt field with text
   * @returns {HTMLElement|null} Found prompt field
   */
  findPromptFieldWithText() {
    const candidates = [
      ...document.querySelectorAll('[contenteditable="true"]'),
      ...document.querySelectorAll("textarea"),
    ];

    for (const field of candidates) {
      if (
        this.isPromptField(field) &&
        (field.textContent?.trim() || field.value?.trim())
      ) {
        return field;
      }
    }

    return null;
  },

  // ============================================================================
  // PROMPT OPERATIONS
  // ============================================================================

  /**
   * Insert prompt content into active textarea/field
   * @param {string} content - Prompt content to insert
   */
  insertPromptIntoTextarea(content) {
    try {
      const promptField =
        this.findPromptFieldWithText() ||
        document.querySelector('[contenteditable="true"], textarea');

      if (!promptField) {
        devWarn("No prompt field found for insertion");
        return;
      }

      const cursorPosition = this.getSelectionPosition();
      if (!cursorPosition?.parentElement) return;

      // Find the slash position
      const slashPosition = this.previousCharPosition(
        cursorPosition.parentElement,
        "/",
        cursorPosition.start,
      );

      if (slashPosition === -1) return;

      // Get text before slash and after current position
      const fullText =
        promptField.textContent ||
        promptField.innerText ||
        promptField.value ||
        "";
      const beforeSlash = fullText.substring(0, slashPosition);
      const afterCursor = fullText.substring(cursorPosition.start);

      // Construct new content
      const newText = beforeSlash + content + afterCursor;

      if (promptField.contentEditable === "true") {
        promptField.textContent = newText;

        // Set cursor position after inserted content
        const range = document.createRange();
        const sel = window.getSelection();
        const targetPos = beforeSlash.length + content.length;

        try {
          const textNode = promptField.firstChild || promptField;
          range.setStart(
            textNode,
            Math.min(targetPos, textNode.textContent?.length || 0),
          );
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (e) {
          promptField.focus();
        }
      } else {
        promptField.value = newText;
        promptField.selectionStart = promptField.selectionEnd =
          beforeSlash.length + content.length;
      }

      // Trigger input event
      promptField.dispatchEvent(new Event("input", { bubbles: true }));
      promptField.focus();

      // Use SuperPromptCoreUtils for logging if available
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log("✅ Prompt inserted successfully");
      } else {
        devLog("✅ Prompt inserted successfully");
      }
    } catch (e) {
      devError("Error inserting prompt:", e);
    }
  },

  /**
   * Remove trailing slash from prompt after insertion
   */
  removeTrailingSlashFromPrompt() {
    try {
      const promptField =
        this.findPromptFieldWithText() ||
        document.querySelector('[contenteditable="true"], textarea');

      if (!promptField) return;

      let text =
        promptField.textContent ||
        promptField.innerText ||
        promptField.value ||
        "";
      if (text.endsWith("/")) {
        const newText = text.slice(0, -1);

        if (promptField.contentEditable === "true") {
          promptField.textContent = newText;
        } else {
          promptField.value = newText;
        }

        promptField.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } catch (e) {
      devWarn("Error removing trailing slash:", e);
    }
  },

  // ============================================================================
  // PROMPT DATA MANAGEMENT
  // ============================================================================

  /**
   * Get saved prompts from storage (async version)
   * @returns {Promise<Array>} Array of prompt objects
   */
  async getSavedPromptsAsync() {
    return new Promise((resolve) => {
      // Request prompts from content script
      const requestId = Math.random().toString(36).substr(2, 9);

      const handleResponse = (event) => {
        if (
          event.data?.type === "SUPERPROMPT_PROMPTS_RESPONSE" &&
          event.data?.requestId === requestId
        ) {
          window.removeEventListener("message", handleResponse);
          const prompts = event.data.prompts || [];
          
          // 🔍 DEBUG: Log received prompts
          if (window.SuperPromptCoreUtils) {
            window.SuperPromptCoreUtils.log(
              `📥 Received ${prompts.length} prompts from storage`,
            );
            const favoritePrompts = prompts.filter(p => p.favorite);
            window.SuperPromptCoreUtils.log(
              `⭐ Found ${favoritePrompts.length} favorite prompts:`,
              favoritePrompts.map(p => ({ id: p.id, title: p.title, favorite: p.favorite })),
            );
          }
          
          resolve(prompts);
        }
      };

      window.addEventListener("message", handleResponse);

      // Send request
      window.postMessage(
        {
          type: "SUPERPROMPT_GET_PROMPTS",
          requestId: requestId,
        },
        "*",
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener("message", handleResponse);
        if (window.SuperPromptCoreUtils) {
          window.SuperPromptCoreUtils.log(
            "⚠️ Prompt request timeout - no response from content script",
          );
        }
        resolve([]);
      }, 5000);
    });
  },

  /**
   * Load and filter prompts based on search term and favorites
   * @param {number} page - Page number
   * @param {string} searchTerm - Search term
   * @param {boolean} favoritesOnly - Only show favorites
   */
  async loadPrompts(page = 1, searchTerm = "", favoritesOnly = false) {
    try {
      // 🔍 DEBUG: Log filter state
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          `🔍 Loading prompts with filters:`,
          { page, searchTerm, favoritesOnly },
        );
      }
      
      const allPrompts = await this.getSavedPromptsAsync();

      // 🔍 DEBUG: Log all prompts before filtering
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          `📋 All prompts (${allPrompts.length} total):`,
          allPrompts.map(p => ({ 
            id: p.id, 
            title: p.title, 
            favorite: p.favorite,
            isFavorite: p.isFavorite // Check if wrong field exists
          })),
        );
      }

      // Filter prompts (FIX: use 'favorite' not 'isFavorite')
      let filteredPrompts = allPrompts.filter((prompt) => {
        const matchesSearch =
          !searchTerm ||
          prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.content?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFavorites = !favoritesOnly || prompt.favorite; // ✅ FIXED: was prompt.isFavorite

        return matchesSearch && matchesFavorites;
      });
      
      // 🔍 DEBUG: Log filtered results
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          `✅ Filtered to ${filteredPrompts.length} prompts`,
          filteredPrompts.map(p => ({ id: p.id, title: p.title, favorite: p.favorite })),
        );
      }

      // Sort by title
      filteredPrompts.sort((a, b) =>
        (a.title || "").localeCompare(b.title || ""),
      );

      // Update menu content
      const menuContent = document.querySelector("#quick-access-menu-content");
      if (!menuContent) return;

      menuContent.innerHTML = "";

      if (filteredPrompts.length === 0) {
        const noResults = document.createElement("div");
        noResults.textContent = searchTerm
          ? `No prompts found for "${searchTerm}"`
          : "No prompts available";
        noResults.style.cssText = `
          padding: 20px;
          text-align: center;
          color: rgba(200, 200, 210, 0.7);
          font-style: italic;
        `;
        menuContent.appendChild(noResults);
        return;
      }

      // Create menu items
      filteredPrompts.forEach((prompt, index) => {
        const item = document.createElement("button");
        item.id = `quick-access-menu-item-${prompt.id}`;
        item.className = "sp-quick-access-item";

        const accent = window.SuperPromptCoreUtils
          ? window.SuperPromptCoreUtils.getAccentColorFallback()
          : "#3B82F6";

        item.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin: 2px 4px;
          border: none;
          border-radius: 8px;
          background: rgba(40, 40, 50, 0.6);
          color: rgba(220, 220, 230, 0.95);
          cursor: pointer;
          font-size: 13px;
          text-align: left;
          transition: all 0.15s ease;
          width: calc(100% - 8px);
          font-family: Inter, system-ui, sans-serif;
        `;

        // Add favorite star if applicable (FIX: use 'favorite' not 'isFavorite')
        if (prompt.favorite) {
          const star = document.createElement("span");
          star.textContent = "★";
          star.style.cssText = `color: ${accent}; font-size: 12px; flex-shrink: 0;`;
          item.appendChild(star);
          
          // 🔍 DEBUG: Log favorite prompt being rendered
          if (window.SuperPromptCoreUtils) {
            window.SuperPromptCoreUtils.log(
              `⭐ Rendering favorite prompt: ${prompt.title}`,
            );
          }
        }

        // Add title
        const title = document.createElement("span");
        title.textContent = prompt.title || "Untitled";
        title.style.cssText = `
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        `;
        item.appendChild(title);

        // Add arrow (hidden by default)
        const arrow = document.createElement("span");
        arrow.id = "item-arrow";
        arrow.textContent = "→";
        arrow.style.cssText = `
          color: ${accent};
          font-weight: bold;
          visibility: hidden;
        `;
        item.appendChild(arrow);

        // Hover effects
        item.addEventListener("mouseenter", () => {
          item.style.background = "rgba(60, 60, 80, 0.7)";
          item.style.transform = "translateX(2px)";
          item.style.boxShadow = `0 2px 8px rgba(59, 130, 246, 0.3)`;
          arrow.style.visibility = "visible";
        });

        item.addEventListener("mouseleave", () => {
          item.style.background = "rgba(40, 40, 50, 0.6)";
          item.style.transform = "translateX(0)";
          item.style.boxShadow = "none";
          arrow.style.visibility = "hidden";
        });

        // Click handler
        item.addEventListener("click", () => {
          this.insertPromptIntoTextarea(prompt.content);
          this.removeQuickAccessMenu();

          // Remove trailing slash after insertion
          setTimeout(() => {
            this.removeTrailingSlashFromPrompt();
          }, 50);
        });

        menuContent.appendChild(item);
      });

      // Focus first item
      this.focusOnFirstItem();
    } catch (e) {
      devError("Error loading prompts:", e);
    }
  },

  // ============================================================================
  // MENU UI CREATION
  // ============================================================================

  /**
   * Create and show the quick access menu
   */
  createQuickAccessMenu() {
    try {
      // Remove existing menu
      this.removeQuickAccessMenu();

      // Find input form
      this.inputForm =
        document.querySelector("form") ||
        document.querySelector('[contenteditable="true"]')?.closest("div") ||
        document.body;

      if (!this.inputForm) {
        devWarn("No suitable container found for menu");
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.id = "quick-access-menu-wrapper";

      const menu = document.createElement("div");
      menu.id = "quick-access-menu";
      wrapper.appendChild(menu);

      // Menu styles
      menu.style.cssText = `
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-radius: 12px;
        background: rgba(20, 20, 22, 0.95);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(100, 116, 139, 0.45);
        padding: 8px;
        height: 300px;
        top: -308px;
        left: 0;
        width: 100%;
        z-index: 999999999;
        font-family: Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif !important;
      `;

      // Menu header
      const menuHeader = document.createElement("div");
      menuHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 2px solid rgba(100, 116, 139, 0.35);
        margin-bottom: 4px;
      `;

      // Title
      const menuTitle = document.createElement("h3");
      const updateMenuTitle = () => {
        const t = window.SuperPromptI18n?.t || ((key) => key);
        menuTitle.textContent = `${t(
          this.showFavoritesOnly ? "favoritePrompts" : "allPrompts",
        )} (/)`;
      };
      updateMenuTitle();
      menuTitle.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: rgba(220, 220, 230, 0.95);
        margin: 0;
        flex: 1;
      `;

      // Toggle container
      const toggleContainer = document.createElement("div");
      toggleContainer.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: center;
      `;

      // Favorites toggle
      const favoritesToggle = document.createElement("button");
      const updateToggleText = () => {
        favoritesToggle.textContent = this.showFavoritesOnly ? "★" : "☆";
      };
      updateToggleText();

      const accent = window.SuperPromptCoreUtils
        ? window.SuperPromptCoreUtils.getAccentColorFallback()
        : "#3B82F6";

      favoritesToggle.style.cssText = `
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid ${accent}66;
        background: rgba(40, 40, 52, 0.6);
        color: ${accent};
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
      `;

      favoritesToggle.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.showFavoritesOnly = !this.showFavoritesOnly;
        updateToggleText();
        updateMenuTitle();

        // Reload prompts with new filter
        const searchInput = document.querySelector("#quick-access-search");
        const currentSearchTerm = searchInput ? searchInput.value : "";
        await this.loadPrompts(1, currentSearchTerm, this.showFavoritesOnly);
      });

      // Add new prompt button
      const menuHeaderButton = document.createElement("button");
      const t = window.SuperPromptI18n?.t || ((key) => key);
      menuHeaderButton.textContent = t("addNewPrompt");
      menuHeaderButton.style.cssText = `
        padding: 4px 8px;
        border-radius: 6px;
        border: 2px solid ${accent};
        background: rgba(40, 40, 52, 0.6);
        color: ${accent};
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        transition: all 0.2s ease;
      `;

      menuHeaderButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Send message to content script to open create prompt dialog
        try {
          window.postMessage(
            {
              type: "SUPERPROMPT_OPEN_CREATE_PROMPT",
              source: "chatgpt-injected",
            },
            "*",
          );

          if (window.SuperPromptCoreUtils) {
            window.SuperPromptCoreUtils.log(
              "Create prompt dialog requested from quick access menu",
            );
          }
        } catch (error) {
          devError("Failed to request create prompt dialog:", error);
        }
      });

      // Add buttons to toggle container
      toggleContainer.appendChild(favoritesToggle);
      toggleContainer.appendChild(menuHeaderButton);

      menuHeader.appendChild(menuTitle);
      menuHeader.appendChild(toggleContainer);

      // Menu content
      const menuContent = document.createElement("div");
      menuContent.id = "quick-access-menu-content";
      menuContent.style.cssText = `
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        height: 100%;
        width: 100%;
        padding: 2px;
        gap: 1px;
        scrollbar-width: thin;
        scrollbar-color: rgba(80, 80, 100, 0.5) transparent;
      `;

      menu.appendChild(menuHeader);
      menu.appendChild(menuContent);

      // Set container position
      this.inputForm.style.position = "relative";
      this.inputForm.appendChild(wrapper);

      // Aggressive menu suppression for ChatGPT's default menu
      // PERFORMANCE: Changed from 25ms to 150ms (83% less CPU, still responsive)
      const aggressiveHideInterval = setInterval(() => {
        if (!this.inputForm) return;
        const scopedMenus = this.inputForm.querySelectorAll(
          '[data-testid="composer-slash-menu"], .slate-suggest-menu',
        );
        scopedMenus.forEach((menu) => {
          if (
            !menu.id?.includes("quick-access-menu") &&
            !menu.closest("#quick-access-menu-wrapper") &&
            (menu.closest('[data-testid="composer"]') ||
              menu.closest(".composer") ||
              menu.closest('textarea[placeholder*="Message"]') ||
              menu.closest('[role="textbox"]'))
          ) {
            menu.remove();
          }
        });
      }, 150);

      // Clean up interval when menu is removed
      const observer = new MutationObserver(() => {
        if (!document.querySelector("#quick-access-menu-wrapper")) {
          clearInterval(aggressiveHideInterval);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Load prompts
      this.loadPrompts(1, "", this.showFavoritesOnly);

      // Focus management
      menuHeaderButton.focus();

      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          "✅ SuperPrompt quick access menu created",
        );
      } else {
        devLog("✅ SuperPrompt quick access menu created");
      }
    } catch (e) {
      devError("Error creating quick access menu:", e);
    }
  },

  /**
   * Remove the quick access menu
   */
  removeQuickAccessMenu() {
    const menu = document.querySelector("#quick-access-menu-wrapper");
    if (menu) menu.remove();
  },

  /**
   * Focus on first visible menu item
   */
  focusOnFirstItem() {
    const firstItem = document.querySelector(".sp-quick-access-item");
    if (firstItem) {
      firstItem.focus();
      const arrow = firstItem.querySelector("#item-arrow");
      if (arrow) arrow.style.visibility = "visible";
    }
  },

  /**
   * Update menu items based on current search term
   */
  async updateQuickAccessMenuItems() {
    const menu = document.querySelector("#quick-access-menu-wrapper");
    if (!menu) return;

    const promptField =
      this.findPromptFieldWithText() ||
      document.querySelector('[contenteditable="true"], textarea');

    if (!promptField) {
      this.removeQuickAccessMenu();
      return;
    }

    const cursorPosition = this.getSelectionPosition();
    if (!cursorPosition?.parentElement) return;

    const text =
      promptField.textContent ||
      promptField.innerText ||
      promptField.value ||
      "";
    const previousSlashPosition = this.previousCharPosition(
      cursorPosition.parentElement,
      "/",
      cursorPosition.start,
    );

    if (cursorPosition.start === 0 || previousSlashPosition === -1) {
      this.removeQuickAccessMenu();
      return;
    }

    // Extract search term between slash and cursor
    let nextSpacePos = this.nextCharPosition(
      cursorPosition.parentElement,
      " ",
      cursorPosition.start,
    );
    let nextNewLinePos = this.nextCharPosition(
      cursorPosition.parentElement,
      "\n",
      cursorPosition.start,
    );

    if (nextSpacePos === -1) nextSpacePos = text.length;
    if (nextNewLinePos === -1) nextNewLinePos = text.length;

    const triggerEndPosition = Math.min(nextSpacePos, nextNewLinePos);
    const triggerWord = this.getStringBetween(
      cursorPosition.parentElement,
      previousSlashPosition + 1,
      triggerEndPosition,
    );

    await this.loadPrompts(1, triggerWord, this.showFavoritesOnly);
  },

  // ============================================================================
  // SLASH COMMAND INTERCEPTION
  // ============================================================================

  /**
   * Show menu only without inserting slash
   * @param {HTMLElement} field - Field to show menu for
   */
  showMenuOnly(field) {
    setTimeout(() => {
      this.createQuickAccessMenu();
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log("✅ SuperPrompt menu triggered");
      }
    }, 1);
  },

  /**
   * Ultimate slash interception at browser level
   */
  ultimateSlashInterception() {
    if (this.ultimateInterceptionInitialized) {
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          "⚠️ Ultimate interception already initialized",
        );
      }
      return;
    }

    if (window.SuperPromptCoreUtils) {
      window.SuperPromptCoreUtils.log(
        "🚨 Starting browser-level slash interception",
      );
    }
    this.ultimateInterceptionInitialized = true;

    try {
      const handleSlashInterception = (e) => {
        if (e.key === "/" && this.isPromptField(e.target)) {
          // Check if slash is at the beginning or after newline
          const cursorPosition = this.getSelectionPosition();
          if (!cursorPosition?.parentElement) return;

          const text = cursorPosition.parentElement.textContent || cursorPosition.parentElement.innerText || "";
          const textBeforeCursor = text.substring(0, cursorPosition.start);
          
          // Only trigger if:
          // 1. At the very start (empty or cursor at 0)
          // 2. After a newline character
          const isAtStart = cursorPosition.start === 0 || textBeforeCursor.trim() === "";
          const isAfterNewline = textBeforeCursor.endsWith("\n");
          
          if (!isAtStart && !isAfterNewline) {
            // Don't trigger menu - this is mid-sentence
            return;
          }

          if (window.SuperPromptCoreUtils) {
            window.SuperPromptCoreUtils.log(
              "🚫 Window-level slash interception triggered!",
            );
          }

          e.stopImmediatePropagation();
          // Don't preventDefault - let "/" be typed naturally

          // Show menu after slash is typed
          setTimeout(() => {
            this.showMenuOnly(e.target);
          }, 10);

          return false;
        }
      };

      // Add to window with highest priority
      window.addEventListener("keydown", handleSlashInterception, {
        capture: true,
        passive: false,
      });

      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          "✅ Ultimate slash interception active",
        );
      }
    } catch (e) {
      devError("Error in ultimate slash interception:", e);
    }
  },

  /**
   * Override ChatGPT's slash handling
   */
  overrideChatGPTSlashHandling() {
    try {
      // Monitor for and suppress ChatGPT's default slash menus
      const menuObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const chatGPTMenu =
                node.querySelector &&
                (node.querySelector('[data-testid="composer-slash-menu"]') ||
                  node.querySelector(".slate-suggest-menu"));

              // More specific check for slash menus - only suppress if it's actually in the composer area
              if (
                chatGPTMenu &&
                !chatGPTMenu.closest("#quick-access-menu-wrapper") &&
                (chatGPTMenu.closest('[data-testid="composer"]') ||
                  chatGPTMenu.closest(".composer") ||
                  chatGPTMenu.closest('textarea[placeholder*="Message"]') ||
                  chatGPTMenu.closest('[role="textbox"]'))
              ) {
                chatGPTMenu.style.display = "none";
                if (window.SuperPromptCoreUtils) {
                  window.SuperPromptCoreUtils.log(
                    "🚫 Suppressed ChatGPT slash menu",
                  );
                }
              }
            }
          });
        });
      });

      menuObserver.observe(document.body, { childList: true, subtree: true });

      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log("✅ ChatGPT slash handling overridden");
      }
    } catch (e) {
      devError("Error overriding ChatGPT slash handling:", e);
    }
  },

  /**
   * Continuous suppression of ChatGPT menus
   * PERFORMANCE: Changed from 100ms to 500ms (80% less CPU)
   */
  continuousMenuSuppression() {
    setInterval(() => {
      const chatGPTMenus = document.querySelectorAll(
        '[data-testid="composer-slash-menu"], .slate-suggest-menu:not(#quick-access-menu *)',
      );

      chatGPTMenus.forEach((menu) => {
        if (
          !menu.closest("#quick-access-menu-wrapper") &&
          (menu.closest('[data-testid="composer"]') ||
            menu.closest(".composer") ||
            menu.closest('textarea[placeholder*="Message"]') ||
            menu.closest('[role="textbox"]'))
        ) {
          menu.style.display = "none";
        }
      });
    }, 500);
  },

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  /**
   * Debounced update function
   */
  debounceUpdateQuickAccessMenuItems: null,

  /**
   * Add event listeners for quick access menu
   */
  addQuickAccessMenuEventListener() {
    try {
      // Initialize debounced update function
      this.debounceUpdateQuickAccessMenuItems = this.debounce(() => {
        this.updateQuickAccessMenuItems();
      }, 200);

      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          "🎛️ Initializing quick access menu handlers",
        );
      }

      // Apply ultimate slash interception
      this.ultimateSlashInterception();

      // Override ChatGPT's event listener registration
      this.overrideChatGPTSlashHandling();

      // Start continuous menu suppression
      this.continuousMenuSuppression();

      // Document-level event interceptor
      const ultimateBlocker = (e) => {
        if (e.key === "/" && this.isPromptField(document.activeElement)) {
          if (window.SuperPromptCoreUtils) {
            window.SuperPromptCoreUtils.log(
              "🚨 Ultimate blocker: Document level",
            );
          }

          e.stopPropagation();
          e.stopImmediatePropagation();

          const cursorPosition = this.getSelectionPosition();
          if (cursorPosition?.parentElement) {
            const text = cursorPosition.parentElement.textContent || cursorPosition.parentElement.innerText || "";
            const textBeforeCursor = text.substring(0, cursorPosition.start);
            
            // Only trigger if at start or after newline
            const isAtStart = cursorPosition.start === 0 || textBeforeCursor.trim() === "";
            const isAfterNewline = textBeforeCursor.endsWith("\n");
            const triggerIsValid = isAtStart || isAfterNewline;

            if (triggerIsValid) {
              setTimeout(() => {
                this.showMenuOnly(document.activeElement);
                if (window.SuperPromptCoreUtils) {
                  window.SuperPromptCoreUtils.log(
                    "✅ SuperPrompt menu triggered",
                  );
                }
              }, 10);
            }
          }
          return false;
        }
      };

      document.addEventListener("keydown", ultimateBlocker, {
        capture: true,
        passive: false,
      });

      // Selection change handler
      document.addEventListener("selectionchange", () => {
        const quickAccessMenuElement = document.querySelector(
          "#quick-access-menu-wrapper",
        );
        const cursorPosition = this.getSelectionPosition();

        if (!cursorPosition?.parentElement) return;

        const previousSlashPosition = this.previousCharPosition(
          cursorPosition.parentElement,
          "/",
          cursorPosition.start,
        );
        const previousSpacePosition = this.previousCharPosition(
          cursorPosition.parentElement,
          " ",
          cursorPosition.start,
        );

        if (cursorPosition.start === 0 || previousSlashPosition === -1) {
          if (quickAccessMenuElement) quickAccessMenuElement.remove();
          return;
        }

        // Check if trigger is valid
        const charBeforeTrigger = this.getCharAtPosition(
          cursorPosition.parentElement,
          previousSlashPosition - 1,
        );
        const triggerIsValid =
          !charBeforeTrigger ||
          charBeforeTrigger === " " ||
          charBeforeTrigger === "\n" ||
          charBeforeTrigger === "." ||
          charBeforeTrigger === "?" ||
          charBeforeTrigger === "!" ||
          previousSlashPosition === 0;

        if (
          triggerIsValid &&
          previousSlashPosition !== -1 &&
          previousSlashPosition > previousSpacePosition &&
          !quickAccessMenuElement
        ) {
          // Hide any existing ChatGPT menu
          const existingChatGPTMenu = document.querySelector(
            '[data-testid="composer-slash-menu"], .slate-suggest-menu:not(#quick-access-menu *)',
          );
          if (
            existingChatGPTMenu &&
            (existingChatGPTMenu.closest('[data-testid="composer"]') ||
              existingChatGPTMenu.closest(".composer") ||
              existingChatGPTMenu.closest('textarea[placeholder*="Message"]') ||
              existingChatGPTMenu.closest('[role="textbox"]'))
          ) {
            existingChatGPTMenu.style.display = "none";
          }

          this.createQuickAccessMenu();
        } else if (
          quickAccessMenuElement &&
          (previousSlashPosition === -1 ||
            previousSpacePosition > previousSlashPosition)
        ) {
          quickAccessMenuElement.remove();
        }
      });

      // Global keydown handler for menu navigation
      document.addEventListener("keydown", (event) => {
        const menu = document.querySelector("#quick-access-menu-wrapper");
        if (!menu) return;

        const menuItems = Array.from(
          document.querySelectorAll(".sp-quick-access-item"),
        );
        if (menuItems.length === 0) return;

        let currentFocusIndex = menuItems.findIndex(
          (item) => document.activeElement === item,
        );

        if (event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();

          // Hide current arrow
          if (currentFocusIndex >= 0) {
            const currentArrow =
              menuItems[currentFocusIndex]?.querySelector("#item-arrow");
            if (currentArrow) currentArrow.style.visibility = "hidden";
          }

          // Focus next item
          const nextIndex =
            currentFocusIndex >= menuItems.length - 1
              ? 0
              : currentFocusIndex + 1;
          menuItems[nextIndex].focus();

          const nextArrow = menuItems[nextIndex]?.querySelector("#item-arrow");
          if (nextArrow) nextArrow.style.visibility = "visible";

          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();

          // Hide current arrow
          if (currentFocusIndex >= 0) {
            const currentArrow =
              menuItems[currentFocusIndex]?.querySelector("#item-arrow");
            if (currentArrow) currentArrow.style.visibility = "hidden";
          }

          // Focus previous item
          const prevIndex =
            currentFocusIndex <= 0
              ? menuItems.length - 1
              : currentFocusIndex - 1;
          menuItems[prevIndex].focus();

          const prevArrow = menuItems[prevIndex]?.querySelector("#item-arrow");
          if (prevArrow) prevArrow.style.visibility = "visible";

          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();

          const focusedItem = document.activeElement;
          if (
            focusedItem &&
            focusedItem.id.startsWith("quick-access-menu-item-")
          ) {
            focusedItem.click();
          }
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          this.removeQuickAccessMenu();

          const promptField =
            this.findPromptFieldWithText() ||
            document.querySelector('[contenteditable="true"], textarea');
          if (promptField) promptField.focus();
          return;
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          event.stopPropagation();

          const promptField =
            this.findPromptFieldWithText() ||
            document.querySelector('[contenteditable="true"], textarea');

          if (promptField) {
            const cursorPosition = this.getSelectionPosition();
            if (cursorPosition?.parentElement) {
              const prevSlashPos = this.previousCharPosition(
                cursorPosition.parentElement,
                "/",
                cursorPosition.start,
              );

              if (prevSlashPos !== -1) {
                // Remove the slash
                if (promptField.contentEditable === "true") {
                  const fullText =
                    promptField.textContent || promptField.innerText || "";
                  const before = fullText.substring(0, prevSlashPos);
                  const after = fullText.substring(prevSlashPos + 1);
                  promptField.textContent = before + after;

                  // Set cursor position
                  const range = document.createRange();
                  const sel = window.getSelection();
                  const node = promptField.firstChild || promptField;
                  const caretIndex = Math.min(before.length, node.length || 0);

                  try {
                    range.setStart(node, caretIndex);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                  } catch (e) {
                    promptField.focus();
                  }
                } else {
                  // Textarea
                  const value = promptField.value;
                  const before = value.substring(0, prevSlashPos);
                  const after = value.substring(prevSlashPos + 1);
                  promptField.value = before + after;
                  promptField.selectionStart = promptField.selectionEnd =
                    before.length;
                }

                promptField.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
              }

              this.removeQuickAccessMenu();
              promptField.focus();
            }
          }

          this.debounceUpdateQuickAccessMenuItems();
          return;
        }

        // For other keys, focus on textarea and update menu
        if (event.key.length === 1 || event.key === "Delete") {
          const promptField =
            this.findPromptFieldWithText() ||
            document.querySelector('[contenteditable="true"], textarea');

          if (promptField) {
            promptField.focus();
            this.debounceUpdateQuickAccessMenuItems();
          }
        }
      });

      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          "✅ Quick access menu event listeners initialized",
        );
      }
    } catch (e) {
      devError("Error adding quick access menu event listeners:", e);
    }
  },

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the complete quick access menu system
   */
  initialize() {
    try {
      // Add event listeners
      this.addQuickAccessMenuEventListener();

      // Setup real-time storage listener for prompt updates
      this.setupStorageListener();

      // Add debug shortcut (Ctrl+Alt+Q)
      document.addEventListener(
        "keydown",
        (e) => {
          if (e.ctrlKey && e.altKey && (e.key === "q" || e.key === "Q")) {
            e.preventDefault();
            e.stopPropagation();
            this.createQuickAccessMenu();
          }
        },
        { capture: true },
      );

      devLog("✅ SuperPrompt Quick Access Menu module initialized");
    } catch (e) {
      devError("❌ Failed to initialize quick access menu:", e);
    }
  },

  /**
   * Cleanup function
   */
  cleanup() {
    try {
      this.removeQuickAccessMenu();
      this.ultimateInterceptionInitialized = false;
      // Remove window message listener
      if (this.promptUpdateListener) {
        window.removeEventListener("message", this.promptUpdateListener);
      }
      devLog("🧹 Quick access menu cleaned up");
    } catch (e) {
      devWarn("Error cleaning up quick access menu:", e);
    }
  },

  /**
   * Window message listener reference
   */
  promptUpdateListener: null,

  /**
   * Setup listener for prompt update notifications from content script
   */
  setupStorageListener() {
    // Listen for messages from content script about prompt updates
    this.promptUpdateListener = (event) => {
      // Only accept messages from same origin
      if (event.source !== window) return;

      const data = event.data;
      if (
        data?.type === "SUPERPROMPT_PROMPTS_UPDATED" &&
        data?.source === "content-script"
      ) {
        // Refresh the menu if it's currently open
        const menu = document.querySelector("#quick-access-menu-wrapper");
        if (menu) {
          if (window.SuperPromptCoreUtils) {
            window.SuperPromptCoreUtils.log(
              "🔄 Prompts updated, refreshing quick access menu",
            );
          }
          // Refresh with current search term and favorites setting
          this.updateQuickAccessMenuItems();
        }
      }
    };

    window.addEventListener("message", this.promptUpdateListener);

    if (window.SuperPromptCoreUtils) {
      window.SuperPromptCoreUtils.log(
        "✅ Prompt update listener setup for real-time refresh",
      );
    }
  },
};

// Auto-initialize when module loads if not in test mode
if (typeof window !== "undefined" && !window.__SUPERPROMPT_TEST_MODE__) {
  // Wait for other dependencies to load
  setTimeout(() => {
    if (window.SuperPromptQuickAccessMenu) {
      window.SuperPromptQuickAccessMenu.initialize();
    }
  }, 100);
}
