// ██████████████████████████████████████████████████████████████████████████████
// ██                        SUPERPROMPT NOTES MANAGER                        ██
// ██                                                                        ██
// ██   Modular notes system, tabs, sidebar editor, IndexedDB management     ██
// ██   Fully self-contained - no dependencies on chat-gpt-page-listener.js  ██
// ██████████████████████████████████████████████████████████████████████████

// ============================================================================
// MODULE STATE - Track manager and floating menu state independently
// ============================================================================
let _managerIsOpen = false;
let _isFloatingMenuOpen = false;
let _notesGuardStopped = false;
let _notesGuardScheduled = false;
let _notesGuardTimeoutId = null;
let _notesGuardLastRunTs = 0;
const NOTES_GUARD_MIN_SPACING_MS = 500; // Reduced frequency for better performance

// Cache for hasNotes checks to avoid repeated DB calls
const _hasNotesCache = new Map();
const CACHE_TTL_MS = 30000; // 30s for better performance

// ============================================================================
// UTILITY FUNCTIONS - Self-contained helpers
// ============================================================================

/**
 * Get current conversation ID from URL
 * @returns {string|null} Conversation ID or null
 */
function _getCurrentConversationId() {
  try {
    const match = window.location.pathname.match(/\/c\/([\w-]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Check if we're on a valid ChatGPT conversation page
 * @returns {boolean} Whether notes tab should show
 */
function _shouldShowNotesTab() {
  try {
    const host = window.location.hostname || "";
    const isMainChatGPTPage =
      host.includes("openai.com") || host.includes("chatgpt.com");
    if (!isMainChatGPTPage) return false;

    const path = location.pathname || "";
    const onConversationRoute = /\/(?:c)\/[\w-]+/i.test(path);
    if (!onConversationRoute) return false;
  } catch {
    return false;
  }

  if (!_getCurrentConversationId()) return false;
  if (_hasOpenExtensionDialog()) return false;
  if (_isInManagerView()) return false;

  return true;
}

/**
 * Check if any extension dialog is open
 * @returns {boolean} Whether a dialog is open
 */
function _hasOpenExtensionDialog() {
  return !!document.querySelector(
    ".dialog-overlay, .prompt-manager, .sp-settings-panel",
  );
}

/**
 * Check if we're in the manager view
 * @returns {boolean} Whether manager view is open
 */
function _isInManagerView() {
  // Check for React portal manager
  const portalContainer = document.getElementById("superprompt-portal-root");
  if (portalContainer) {
    const managerElement = portalContainer.querySelector(
      '[class*="FloatingButton"], [class*="ManagerContainer"]',
    );
    if (managerElement) {
      const style = window.getComputedStyle(managerElement);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return true;
      }
    }
  }
  return _managerIsOpen;
}

/**
 * Get cached hasNotes result or fetch fresh
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<boolean>} Whether conversation has notes
 */
async function _getHasNotesCached(conversationId) {
  const now = Date.now();
  const cached = _hasNotesCache.get(conversationId);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.value;
  }
  try {
    const hasNote =
      await window.SuperPromptNotesManager.conversationHasNotes(conversationId);
    _hasNotesCache.set(conversationId, { value: hasNote, ts: now });
    return hasNote;
  } catch {
    return false;
  }
}

/**
 * Invalidate hasNotes cache for a conversation
 * @param {string} conversationId - Conversation ID to invalidate
 */
function _invalidateNotesCache(conversationId) {
  if (conversationId) {
    _hasNotesCache.delete(conversationId);
  } else {
    _hasNotesCache.clear();
  }
}

/**
 * Pre-fetch hasNotes status for instant display (warm-up cache)
 * @param {string} conversationId - Conversation ID to pre-fetch
 */
function _prefetchNotesStatus(conversationId) {
  if (!conversationId) return;

  // Eagerly fetch and cache the result
  _getHasNotesCached(conversationId)
    .then(() => {
      // Cache is now warm, next access will be instant
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "debug",
          "Notes status pre-fetched",
          { conversationId },
        );
      }
    })
    .catch(() => {
      // Silent failure, not critical
    });
}

/**
 * Hide note tab immediately
 */
function _hideNoteTabImmediate() {
  const tab = document.querySelector(".sp-note-tab");
  if (tab) tab.remove();
}

// Global namespace for notes management utilities
window.SuperPromptNotesManager = {
  // ============================================================================
  // INDEXEDDB OPERATIONS
  // ============================================================================

  /**
   * Open notes IndexedDB database with proper schema
   * @returns {Promise<IDBDatabase>} Notes database instance
   */
  async openNotesDb() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("Prompture-notes", 1);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("notes")) {
            const store = db.createObjectStore("notes", { keyPath: "id" });
            store.createIndex("byConversationId", "conversationId", {
              unique: false,
            });
          } else {
            const store = request.transaction.objectStore("notes");
            if (!store.indexNames.contains("byConversationId")) {
              store.createIndex("byConversationId", "conversationId", {
                unique: false,
              });
            }
          }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  /**
   * Check if a conversation has notes
   * @param {string} conversationId - Conversation ID to check
   * @returns {Promise<boolean>} Whether conversation has notes
   */
  async conversationHasNotes(conversationId) {
    try {
      const db = await this.openNotesDb();
      if (!db) return false;

      return await new Promise((resolve) => {
        try {
          const tx = db.transaction(["notes"], "readonly");
          const store = tx.objectStore("notes");
          const index = store.index("byConversationId");
          const req = index.getAll(conversationId);
          req.onsuccess = () => resolve((req.result || []).length > 0);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Error checking conversation notes",
          { conversationId, error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * Load existing note content for conversation
   * @param {string} conversationId - Conversation ID
   * @param {HTMLInputElement} titleInput - Title input element
   * @param {HTMLTextAreaElement} contentTextarea - Content textarea element
   * @returns {Promise<void>} Promise that resolves when content is loaded
   */
  async loadExistingNoteContent(conversationId, titleInput, contentTextarea) {
    try {
      const db = await this.openNotesDb();
      if (!db) return;

      return new Promise((resolve) => {
        const transaction = db.transaction(["notes"], "readonly");
        const store = transaction.objectStore("notes");
        const index = store.index("byConversationId");
        const getRequest = index.getAll(conversationId);

        getRequest.onsuccess = () => {
          const notes = getRequest.result || [];
          if (notes.length > 0) {
            const note = notes[0]; // Use first note (there should only be one per conversation)
            titleInput.value = note.title || "";
            contentTextarea.value = note.content || "";
          }
          resolve();
        };

        getRequest.onerror = () => {
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "error",
              "Failed to load note content",
              { conversationId },
            );
          }
          resolve();
        };
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Error loading note content",
          { conversationId, error: error.message },
        );
      }
    }
  },

  /**
   * Save note content to IndexedDB
   * @param {string} conversationId - Conversation ID
   * @param {string} title - Note title
   * @param {string} content - Note content
   * @returns {Promise<boolean>} Success status
   */
  async saveNoteContent(conversationId, title, content) {
    try {
      const db = await this.openNotesDb();
      if (!db) return false;

      const transaction = db.transaction(["notes"], "readwrite");
      const store = transaction.objectStore("notes");
      const index = store.index("byConversationId");
      const getRequest = index.getAll(conversationId);

      return new Promise((resolve) => {
        getRequest.onsuccess = () => {
          const notes = getRequest.result || [];
          const now = Date.now();

          let noteData;
          if (notes.length > 0) {
            // Update existing note
            noteData = {
              ...notes[0],
              title: title,
              content: content,
              updateTime: now,
            };
          } else {
            // Create new note
            noteData = {
              id: crypto.randomUUID(),
              title: title,
              content: content,
              conversationId: conversationId,
              createTime: now,
              updateTime: now,
            };
          }

          const putRequest = store.put(noteData);
          putRequest.onsuccess = () => {
            if (window.SuperPromptCoreUtils?.spPostLog) {
              window.SuperPromptCoreUtils.spPostLog(
                "info",
                "Note saved successfully",
                { conversationId, title },
              );
            }

            // Dispatch custom event to notify other components (e.g., vault sidebar)
            window.dispatchEvent(
              new CustomEvent("sp-note-updated", {
                detail: { conversationId, hasNote: true },
              }),
            );

            resolve(true);
          };
          putRequest.onerror = () => {
            if (window.SuperPromptCoreUtils?.spPostLog) {
              window.SuperPromptCoreUtils.spPostLog(
                "error",
                "Failed to save note",
                { conversationId, title },
              );
            }
            resolve(false);
          };
        };

        getRequest.onerror = () => {
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "error",
              "Failed to query existing notes",
              { conversationId },
            );
          }
          resolve(false);
        };
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Error saving note content",
          { conversationId, error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * Delete note for a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNote(conversationId) {
    try {
      const db = await this.openNotesDb();
      if (!db) return false;

      const transaction = db.transaction(["notes"], "readwrite");
      const store = transaction.objectStore("notes");
      const index = store.index("byConversationId");
      const getRequest = index.getAll(conversationId);

      return new Promise((resolve) => {
        getRequest.onsuccess = () => {
          const notes = getRequest.result || [];

          if (notes.length === 0) {
            resolve(true); // Nothing to delete
            return;
          }

          // Delete all notes for this conversation (usually just one)
          const deletePromises = notes.map((note) => {
            return new Promise((deleteResolve) => {
              const deleteRequest = store.delete(note.id);
              deleteRequest.onsuccess = () => deleteResolve(true);
              deleteRequest.onerror = () => deleteResolve(false);
            });
          });

          Promise.all(deletePromises).then((results) => {
            const success = results.every((r) => r);

            if (success) {
              if (window.SuperPromptCoreUtils?.spPostLog) {
                window.SuperPromptCoreUtils.spPostLog(
                  "info",
                  "Note deleted successfully",
                  { conversationId },
                );
              }

              // Dispatch custom event to notify other components
              window.dispatchEvent(
                new CustomEvent("sp-note-updated", {
                  detail: { conversationId, hasNote: false },
                }),
              );
            }

            resolve(success);
          });
        };

        getRequest.onerror = () => {
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "error",
              "Failed to query notes for deletion",
              { conversationId },
            );
          }
          resolve(false);
        };
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "Error deleting note", {
          conversationId,
          error: error.message,
        });
      }
      return false;
    }
  },

  /**
   * Show confirmation dialog for deleting a note
   * @param {string} conversationId - Conversation ID
   * @param {Function} onSuccess - Callback after successful deletion
   */
  showDeleteNoteConfirmation(conversationId, onSuccess) {
    // Get theme colors (using same logic as vault sidebar)
    const htmlElement = document.documentElement;
    const colorScheme =
      htmlElement.style.colorScheme ||
      getComputedStyle(htmlElement).colorScheme ||
      "dark";
    const isDark = !colorScheme.includes("light");

    const theme = {
      overlayBg: "rgba(0, 0, 0, 0.75)",
      dialogBg: isDark
        ? "linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)"
        : "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
      dialogShadow: isDark
        ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
        : "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(20, 184, 166, 0.1) inset",
      titleColor: isDark ? "#e5e7eb" : "#1f2937",
      textColor: isDark ? "#d1d5db" : "#4b5563",
      textMuted: isDark ? "#9ca3af" : "#6b7280",
      redBorder: "#ef4444",
      redIconBg: isDark
        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)"
        : "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%)",
      redIconBorder: isDark
        ? "rgba(239, 68, 68, 0.3)"
        : "rgba(239, 68, 68, 0.4)",
      redTitle: "#f87171",
      redWarningBg: isDark
        ? "rgba(239, 68, 68, 0.1)"
        : "rgba(239, 68, 68, 0.08)",
      redWarningBorder: isDark
        ? "rgba(239, 68, 68, 0.3)"
        : "rgba(239, 68, 68, 0.35)",
      redText: "#ef4444",
      infoBg: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
      infoBorder: isDark
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(245, 158, 11, 0.35)",
      infoText: "#fbbf24",
      cancelBtnBg: isDark ? "#374151" : "#e5e7eb",
      cancelBtnBorder: isDark ? "#4b5563" : "#d1d5db",
      cancelBtnText: isDark ? "#e5e7eb" : "#374151",
      cancelBtnHoverBg: isDark ? "#4b5563" : "#d1d5db",
      deleteBtnBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      deleteBtnBorder: "rgba(220, 38, 38, 0.3)",
      deleteBtnShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
      deleteBtnHoverShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
    };

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: ${theme.overlayBg};
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000000;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    try {
      overlay.setAttribute("data-superprompt", "note-delete-dialog");
    } catch {}

    // Create dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 2px solid ${theme.redBorder};
      border-radius: 16px;
      padding: 28px;
      max-width: 500px;
      width: 90%;
      box-shadow: ${theme.dialogShadow};
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
    `;

    // Dialog content
    dialog.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
        <div style="flex-shrink: 0; width: 48px; height: 48px; background: ${
          theme.redIconBg
        }; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid ${
          theme.redIconBorder
        };">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${
            theme.redTitle
          }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <div style="flex: 1;">
          <h2 style="margin: 0 0 8px 0; color: ${
            theme.redTitle
          }; font-size: 20px; font-weight: bold; line-height: 1.3;">
            ${
              window.SuperPromptI18n?.t
                ? window.SuperPromptI18n.t("deleteNote")
                : "Delete Note"
            }?
          </h2>
          <p style="margin: 0; color: ${
            theme.textColor
          }; font-size: 14px; line-height: 1.5;">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div style="background: ${theme.redWarningBg}; border: 1px solid ${
        theme.redWarningBorder
      }; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; color: ${
          theme.redText
        }; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${
            theme.redText
          }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>What will be deleted:</span>
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: ${
          theme.titleColor
        }; font-size: 13px; line-height: 1.8;">
          <li>The note for this conversation</li>
          <li>All content in the note (title and text)</li>
          <li style="color: ${
            theme.textMuted
          };">Note will be removed from the database</li>
        </ul>
      </div>

      <div style="background: ${theme.infoBg}; border: 1px solid ${
        theme.infoBorder
      }; border-radius: 10px; padding: 12px; margin-bottom: 20px;">
        <p style="margin: 0; color: ${
          theme.infoText
        }; font-size: 12px; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${
            theme.infoText
          }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>The note will be permanently deleted from local storage</span>
        </p>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="sp-cancel-delete-note" style="
          padding: 10px 20px;
          background: ${theme.cancelBtnBg};
          border: 1px solid ${theme.cancelBtnBorder};
          border-radius: 8px;
          color: ${theme.cancelBtnText};
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          Cancel
        </button>
        <button id="sp-confirm-delete-note" style="
          padding: 10px 20px;
          background: ${theme.deleteBtnBg};
          border: 1px solid ${theme.deleteBtnBorder};
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${theme.deleteBtnShadow};
        ">
          Delete Note
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Button hover effects
    const cancelBtn = dialog.querySelector("#sp-cancel-delete-note");
    const confirmBtn = dialog.querySelector("#sp-confirm-delete-note");

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = theme.cancelBtnHoverBg;
      cancelBtn.style.transform = "translateY(-1px)";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = theme.cancelBtnBg;
      cancelBtn.style.transform = "translateY(0)";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.transform = "translateY(-2px)";
      confirmBtn.style.boxShadow = theme.deleteBtnHoverShadow;
    });
    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = theme.deleteBtnShadow;
    });

    // Close function
    const closeDialog = () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.9) translateY(-20px)";
      setTimeout(() => overlay.remove(), 200);
    };

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      closeDialog();
    });

    // Confirm button
    confirmBtn.addEventListener("click", async () => {
      // Show loading state
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = "0.7";
      confirmBtn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
          Deleting...
        </span>
      `;

      // Add spin animation
      if (!document.getElementById("sp-note-delete-spin-animation")) {
        const style = document.createElement("style");
        style.id = "sp-note-delete-spin-animation";
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      // Delete the note
      const success = await this.deleteNote(conversationId);

      if (success) {
        // Update note tab
        this.updateNoteTab(conversationId, false);

        // Close dialog
        closeDialog();

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Show error state
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.background = "#991b1b";
        confirmBtn.textContent = "Delete Failed - Try Again";

        setTimeout(() => {
          confirmBtn.style.background = theme.deleteBtnBg;
          confirmBtn.innerHTML = "Delete Note";
        }, 2000);
      }
    });

    // Click outside to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeDialog();
      }
    });

    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeDialog();
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);
  },

  // ============================================================================
  // NOTE TAB UI COMPONENT
  // ============================================================================

  /**
   * Create vertical note tab for main content area
   * @param {string} conversationId - Conversation ID
   * @param {boolean} hasNote - Whether conversation has existing notes
   * @returns {HTMLElement} Note tab element
   */
  createNoteTab(conversationId, hasNote = false) {
    const noteTab = document.createElement("div");
    noteTab.className = "sp-note-tab";
    noteTab.setAttribute("data-conversation-id", conversationId);

    // Mark as SuperPrompt surface to prevent global listeners from treating events as prompts
    try {
      noteTab.setAttribute("data-superprompt", "note-tab");
    } catch {}

    // Get accent color from localStorage (same as scroll buttons)
    const getAccentColor = () => {
      const COLORS = {
        teal: "#14b8a6",
        blue: "#3b82f6",
        purple: "#a855f7",
        orange: "#f97316",
        green: "#10b981",
        red: "#ef4444",
        pink: "#ec4899",
        rose: "#f43f5e",
        fuchsia: "#d946ef",
        indigo: "#6366f1",
        cyan: "#06b6d4",
        amber: "#f59e0b",
        lime: "#84cc16",
        sky: "#0ea5e9",
        emerald: "#10b981",
        violet: "#8b5cf6",
        yellow: "#eab308",
        slate: "#64748b",
        crimson: "#dc2626",
        magenta: "#e91e8c",
        coral: "#ff6b6b",
        mint: "#4ecca3",
        lavender: "#b19cd9",
        gold: "#ffd700",
        sapphire: "#0f52ba",
        ruby: "#e0115f",
        onyx: "#2d2d2d",
      };
      try {
        const cached = localStorage.getItem("sp_accent_color");
        return COLORS[cached] || COLORS.teal;
      } catch {
        return COLORS.teal;
      }
    };

    const accentColorValue = getAccentColor();
    const accentColor = hasNote ? accentColorValue : "rgba(100, 116, 139, 0.8)";
    const accentColorAlpha = hasNote
      ? `${accentColorValue}33` // 20% opacity
      : "rgba(100, 116, 139, 0.3)";

    noteTab.style.cssText = `
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      height: 80px;
      background: ${accentColor};
      border: 1px solid ${accentColorAlpha};
      border-right: none;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      z-index: 1000;
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s ease;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    `;

    // Container for icon and indicator
    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: white;
      flex-shrink: 0;
    `;

    // Note icon SVG
    iconContainer.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>
    `;

    // Text label
    const text = document.createElement("span");
    text.textContent = hasNote
      ? window.SuperPromptI18n?.t
        ? window.SuperPromptI18n.t("editNote")
        : "Edit"
      : window.SuperPromptI18n?.t
        ? window.SuperPromptI18n.t("addNote")
        : "Note";
    text.style.cssText = `
      color: white;
      font-size: 10px;
      font-weight: 500;
      text-align: center;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      opacity: 0.9;
    `;

    noteTab.appendChild(iconContainer);
    noteTab.appendChild(text);

    // Calculate hover color (10% darker)
    const getHoverColor = (baseColor) => {
      // Simple darkening by reducing brightness
      const hex = baseColor.replace("#", "");
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 26);
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 26);
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 26);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    };

    const hoverColor = hasNote
      ? getHoverColor(accentColorValue)
      : "rgba(100, 116, 139, 1)";

    // Hover effects with accent color
    noteTab.addEventListener("mouseenter", () => {
      noteTab.style.opacity = "1";
      noteTab.style.boxShadow = "-4px 0 12px rgba(0, 0, 0, 0.15)";
      noteTab.style.background = hoverColor;
    });

    noteTab.addEventListener("mouseleave", () => {
      noteTab.style.opacity = hasNote ? "1" : "0.7";
      noteTab.style.boxShadow = "-2px 0 8px rgba(0, 0, 0, 0.1)";
      noteTab.style.background = accentColor;
    });

    // Click handler to open note sidebar
    noteTab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openNoteSidebar(conversationId, hasNote);
    });

    return noteTab;
  },

  /**
   * Update note tab appearance based on whether notes exist
   * @param {string} conversationId - Conversation ID
   * @param {boolean} hasNote - Whether conversation has notes
   */
  updateNoteTab(conversationId, hasNote) {
    const noteTab = document.querySelector(
      `.sp-note-tab[data-conversation-id="${conversationId}"]`,
    );
    if (!noteTab) return;

    // Update colors
    const accentColor = hasNote
      ? "var(--color-accent, #10a37f)"
      : "var(--color-surface-tertiary, rgba(100, 116, 139, 0.8))";
    const accentColorAlpha = hasNote
      ? "var(--color-accent-alpha, rgba(16, 163, 127, 0.2))"
      : "rgba(100, 116, 139, 0.3)";

    noteTab.style.background = accentColor;
    noteTab.style.borderColor = accentColorAlpha;
    noteTab.style.opacity = hasNote ? "1" : "0.7";

    // Update text
    const textElement = noteTab.querySelector("span");
    if (textElement) {
      textElement.textContent = hasNote
        ? window.SuperPromptI18n?.t
          ? window.SuperPromptI18n.t("editNote")
          : "Edit"
        : window.SuperPromptI18n?.t
          ? window.SuperPromptI18n.t("addNote")
          : "Note";
    }
  },

  /**
   * Create scroll buttons (up/down arrows) next to Notes tab
   * @param {boolean} hasNote - Whether conversation has notes (for theme matching)
   * @returns {HTMLElement} Container with scroll buttons
   */
  createScrollButtons(hasNote = false) {
    // Get accent color directly from localStorage (guaranteed to work before React loads)
    const LOCAL_STORAGE_KEY = "sp_accent_color";
    const DEFAULT_ACCENT = "teal";

    // Exact color palette (DARK mode only, matching chat-gpt-page-listener.js)
    const COLORS = {
      teal: { primary: "#14b8a6", hover: "#0d9488" },
      blue: { primary: "#3b82f6", hover: "#2563eb" },
      purple: { primary: "#a855f7", hover: "#9333ea" },
      orange: { primary: "#f97316", hover: "#ea580c" },
      green: { primary: "#10b981", hover: "#059669" },
      red: { primary: "#ef4444", hover: "#dc2626" },
      pink: { primary: "#ec4899", hover: "#db2777" },
      rose: { primary: "#f43f5e", hover: "#e11d48" },
      fuchsia: { primary: "#d946ef", hover: "#c026d3" },
      indigo: { primary: "#6366f1", hover: "#4f46e5" },
      cyan: { primary: "#06b6d4", hover: "#0891b2" },
      amber: { primary: "#f59e0b", hover: "#d97706" },
      lime: { primary: "#84cc16", hover: "#65a30d" },
      sky: { primary: "#0ea5e9", hover: "#0284c7" },
      emerald: { primary: "#10b981", hover: "#059669" },
      violet: { primary: "#8b5cf6", hover: "#7c3aed" },
      yellow: { primary: "#eab308", hover: "#ca8a04" },
      slate: { primary: "#64748b", hover: "#475569" },
      crimson: { primary: "#dc2626", hover: "#b91c1c" },
      magenta: { primary: "#e91e8c", hover: "#c7185a" },
      coral: { primary: "#ff6b6b", hover: "#ee5a52" },
      mint: { primary: "#4ecca3", hover: "#3fb890" },
      lavender: { primary: "#b19cd9", hover: "#9b7ec4" },
      gold: { primary: "#ffd700", hover: "#ffb700" },
      sapphire: { primary: "#0f52ba", hover: "#0a3d8f" },
      ruby: { primary: "#e0115f", hover: "#c20e52" },
      onyx: { primary: "#2d2d2d", hover: "#1a1a1a" },
    };

    let accentColor, accentColorHover, accentColorAlpha;
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const colorId = cached && COLORS[cached] ? cached : DEFAULT_ACCENT;
      const colors = COLORS[colorId];
      accentColor = colors.primary;
      accentColorHover = colors.hover;
      accentColorAlpha = `${colors.primary}33`; // 20% opacity
      console.log(
        "[NotesManager] Using accent color from localStorage:",
        colorId,
        colors,
      );
    } catch (err) {
      console.error("[NotesManager] Error getting accent color:", err);
      accentColor = COLORS[DEFAULT_ACCENT].primary;
      accentColorHover = COLORS[DEFAULT_ACCENT].hover;
      accentColorAlpha = `${COLORS[DEFAULT_ACCENT].primary}33`;
    }

    // Container for both buttons
    const container = document.createElement("div");
    container.className = "sp-scroll-buttons";
    container.setAttribute("data-superprompt", "scroll-buttons");
    container.style.cssText = `
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(calc(-50% + 100px));
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1001;
    `;

    // Scroll to top button
    const scrollUpButton = document.createElement("button");
    scrollUpButton.className = "sp-scroll-up";
    scrollUpButton.setAttribute("data-superprompt", "scroll-up-btn");
    scrollUpButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;
    scrollUpButton.style.cssText = `
      width: 32px;
      height: 32px;
      background: ${accentColor};
      border: 1px solid ${accentColorAlpha};
      border-right: none;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, box-shadow 0.2s ease;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      color: white;
      opacity: 0.85;
      padding: 0;
      outline: none;
    `;

    // Scroll to bottom button
    const scrollDownButton = document.createElement("button");
    scrollDownButton.className = "sp-scroll-down";
    scrollDownButton.setAttribute("data-superprompt", "scroll-down-btn");
    scrollDownButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    scrollDownButton.style.cssText = `
      width: 32px;
      height: 32px;
      background: ${accentColor};
      border: 1px solid ${accentColorAlpha};
      border-right: none;
      border-radius: 8px 0 0 8px;
      cursor: pointer;
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, box-shadow 0.2s ease;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
      color: white;
      opacity: 0.85;
      padding: 0;
      outline: none;
    `;

    // Hover effects for scroll up button - use accent hover color
    scrollUpButton.addEventListener("mouseenter", () => {
      scrollUpButton.style.opacity = "1";
      scrollUpButton.style.boxShadow = "-4px 0 12px rgba(0, 0, 0, 0.2)";
      scrollUpButton.style.background = accentColorHover;
    });

    scrollUpButton.addEventListener("mouseleave", () => {
      scrollUpButton.style.opacity = "0.85";
      scrollUpButton.style.boxShadow = "-2px 0 8px rgba(0, 0, 0, 0.1)";
      scrollUpButton.style.background = accentColor;
    });

    // Hover effects for scroll down button - use accent hover color
    scrollDownButton.addEventListener("mouseenter", () => {
      scrollDownButton.style.opacity = "1";
      scrollDownButton.style.boxShadow = "-4px 0 12px rgba(0, 0, 0, 0.2)";
      scrollDownButton.style.background = accentColorHover;
    });

    scrollDownButton.addEventListener("mouseleave", () => {
      scrollDownButton.style.opacity = "0.85";
      scrollDownButton.style.boxShadow = "-2px 0 8px rgba(0, 0, 0, 0.1)";
      scrollDownButton.style.background = accentColor;
    });

    // Click handler for scroll to top
    scrollUpButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      devLog("🔼 Scroll to top clicked");

      // Find the main scrollable container
      const scrollContainer =
        document.querySelector(
          'div[class*="flex-col"][class*="overflow-y-auto"]',
        ) ||
        document.querySelector('main[class*="overflow"]') ||
        document
          .querySelector('[data-testid="conversation-turn-1"]')
          ?.closest('div[class*="overflow"]');

      devLog("📦 Scroll container:", scrollContainer);

      try {
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          devLog("✅ Scrolled container to top");
        } else {
          // Fallback to window scroll
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          devLog("✅ Scrolled window to top (fallback)");
        }
      } catch (err) {
        devError("❌ Error scrolling to top:", err);
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        } else {
          window.scrollTo(0, 0);
        }
      }
    });

    // Click handler for scroll to bottom
    scrollDownButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      devLog("🔽 Scroll to bottom clicked");

      // Find the main scrollable container
      const scrollContainer =
        document.querySelector(
          'div[class*="flex-col"][class*="overflow-y-auto"]',
        ) ||
        document.querySelector('main[class*="overflow"]') ||
        document
          .querySelector('[data-testid="conversation-turn-1"]')
          ?.closest('div[class*="overflow"]');

      devLog("📦 Scroll container:", scrollContainer);

      try {
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
          devLog("✅ Scrolled container to bottom");
        } else {
          // Fallback to window scroll
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          });
          devLog("✅ Scrolled window to bottom (fallback)");
        }
      } catch (err) {
        devError("❌ Error scrolling to bottom:", err);
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
          window.scrollTo(0, document.documentElement.scrollHeight);
        }
      }
    });

    container.appendChild(scrollUpButton);
    container.appendChild(scrollDownButton);

    return container;
  },

  // ============================================================================
  // NOTE SIDEBAR EDITOR
  // ============================================================================

  /**
   * Open note sidebar editor from right
   * @param {string} conversationId - Conversation ID
   * @param {boolean} hasNote - Whether conversation has existing notes
   */
  openNoteSidebar(conversationId, hasNote) {
    // Check if sidebar already exists
    if (document.querySelector(".sp-note-sidebar-overlay")) {
      return;
    }

    // Notify React floating button to hide itself
    try {
      window.postMessage({ type: "sp-note-sidebar-state", isOpen: true }, "*");
    } catch {}

    // Add body class to signal notes is open (for scroll nav toggle visibility)
    document.body.classList.add("sp-notes-dialog-open");

    // Hide scroll nav toggle button directly (it's in shadow DOM)
    try {
      const shadowHost = document.querySelector("#superprompt-shadow-root");
      if (shadowHost && shadowHost.shadowRoot) {
        const toggleBtn = shadowHost.shadowRoot.querySelector(
          ".sp-scroll-nav-toggle-btn",
        );
        if (toggleBtn) {
          toggleBtn.style.display = "none";
        }
      }
    } catch (e) {
      console.error("[Notes] Failed to hide scroll nav toggle:", e);
    }

    // Get theme colors
    const isDarkMode =
      document.documentElement.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Get accent color from localStorage (GUARANTEED to work, no CSS var lookup)
    const getAccentColorObj = () => {
      const LOCAL_STORAGE_KEY = "sp_accent_color";
      const DEFAULT_ACCENT = "teal";

      const COLORS = {
        teal: { primary: "#14b8a6", hover: "#0d9488" },
        blue: { primary: "#3b82f6", hover: "#2563eb" },
        purple: { primary: "#a855f7", hover: "#9333ea" },
        orange: { primary: "#f97316", hover: "#ea580c" },
        green: { primary: "#10b981", hover: "#059669" },
        red: { primary: "#ef4444", hover: "#dc2626" },
        pink: { primary: "#ec4899", hover: "#db2777" },
        rose: { primary: "#f43f5e", hover: "#e11d48" },
        fuchsia: { primary: "#d946ef", hover: "#c026d3" },
        indigo: { primary: "#6366f1", hover: "#4f46e5" },
        cyan: { primary: "#06b6d4", hover: "#0891b2" },
        amber: { primary: "#f59e0b", hover: "#d97706" },
        lime: { primary: "#84cc16", hover: "#65a30d" },
        sky: { primary: "#0ea5e9", hover: "#0284c7" },
        emerald: { primary: "#10b981", hover: "#059669" },
        violet: { primary: "#8b5cf6", hover: "#7c3aed" },
        yellow: { primary: "#eab308", hover: "#ca8a04" },
        slate: { primary: "#64748b", hover: "#475569" },
        crimson: { primary: "#dc2626", hover: "#b91c1c" },
        magenta: { primary: "#e91e8c", hover: "#c7185a" },
        coral: { primary: "#ff6b6b", hover: "#ee5a52" },
        mint: { primary: "#4ecca3", hover: "#3fb890" },
        lavender: { primary: "#b19cd9", hover: "#9b7ec4" },
        gold: { primary: "#ffd700", hover: "#ffb700" },
        sapphire: { primary: "#0f52ba", hover: "#0a3d8f" },
        ruby: { primary: "#e0115f", hover: "#c20e52" },
        onyx: { primary: "#2d2d2d", hover: "#1a1a1a" },
      };

      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        const colorId = cached && COLORS[cached] ? cached : DEFAULT_ACCENT;
        return COLORS[colorId];
      } catch {
        return COLORS[DEFAULT_ACCENT];
      }
    };

    const accentColorObj = getAccentColorObj();
    const accentColor = accentColorObj.primary;
    const accentHover = accentColorObj.hover;

    const colors = {
      background: isDarkMode ? "#1a1a1a" : "#ffffff",
      surface: isDarkMode ? "#2a2a2a" : "#f8fafc",
      border: isDarkMode ? "#404040" : "#e5e7eb",
      text: isDarkMode ? "#ffffff" : "#1f2937",
      textSecondary: isDarkMode ? "#d1d5db" : "#6b7280",
      input: isDarkMode ? "#374151" : "#f9fafb",
      accent: accentColor,
      accentHover: accentHover,
    };

    // Create overlay with fade-in animation
    const sidebarOverlay = document.createElement("div");
    sidebarOverlay.className = "sp-note-sidebar-overlay";
    try {
      sidebarOverlay.setAttribute("data-superprompt", "note-sidebar-overlay");
    } catch {}

    sidebarOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0);
      z-index: 10000;
      backdrop-filter: blur(0px);
      transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Create sidebar panel with premium styling
    const sidebarPanel = document.createElement("div");
    try {
      sidebarPanel.setAttribute("data-superprompt", "note-sidebar-panel");
    } catch {}

    sidebarPanel.style.cssText = `
      position: fixed;
      top: 0;
      right: -480px;
      width: 480px;
      height: 100%;
      background: ${colors.background};
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.24), -2px 0 8px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 1px solid ${colors.border};
      border-radius: 16px 0 0 16px;
      overflow: hidden;
    `;

    // Premium Header with accent gradient
    const header = document.createElement("div");
    try {
      header.setAttribute("data-superprompt", "note-header");
    } catch {}

    header.style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"};
      background: ${colors.accent};
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    `;

    // Add subtle animated gradient overlay
    const headerOverlay = document.createElement("div");
    headerOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%);
      pointer-events: none;
    `;
    header.appendChild(headerOverlay);

    const title = document.createElement("h2");
    title.textContent = hasNote
      ? window.SuperPromptI18n?.t
        ? window.SuperPromptI18n.t("editNote")
        : "Edit Note"
      : window.SuperPromptI18n?.t
        ? window.SuperPromptI18n.t("addNote")
        : "Add Note";
    title.style.cssText = `
      color: white;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    // Add note icon to title (Lucide FileText)
    const titleIcon = document.createElement("span");
    titleIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    `;
    titleIcon.style.cssText = `
      display: flex;
      align-items: center;
    `;
    title.insertBefore(titleIcon, title.firstChild);

    header.appendChild(title);

    // Content area
    const content = document.createElement("div");
    try {
      content.setAttribute("data-superprompt", "note-content");
    } catch {}

    content.style.cssText = `
      flex: 1;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      background: ${colors.background};
    `;

    // Title input
    const titleLabel = document.createElement("label");
    titleLabel.textContent = window.SuperPromptI18n?.t
      ? window.SuperPromptI18n.t("title")
      : "Title";
    titleLabel.style.cssText = `
      font-weight: 600;
      color: ${colors.text};
      font-size: 11px;
      margin-bottom: 6px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.8;
    `;

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = window.SuperPromptI18n?.t
      ? window.SuperPromptI18n.t("enterNoteTitle")
      : "Enter note title...";
    try {
      titleInput.setAttribute("data-superprompt", "note-title-input");
    } catch {}

    titleInput.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      border: 2px solid ${colors.border};
      border-radius: 8px;
      background: ${colors.input};
      color: ${colors.text};
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
    `;

    // Premium focus styles for title input
    titleInput.addEventListener("focus", () => {
      titleInput.style.borderColor = colors.accent;
      titleInput.style.boxShadow = `0 0 0 4px ${colors.accent}20`;
      titleInput.style.transform = "translateY(-1px)";
    });
    titleInput.addEventListener("blur", () => {
      titleInput.style.borderColor = colors.border;
      titleInput.style.boxShadow = "none";
      titleInput.style.transform = "translateY(0)";
    });

    // Content textarea wrapper with label and character counter
    const contentWrapper = document.createElement("div");
    contentWrapper.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 0;
    `;

    const contentLabelRow = document.createElement("div");
    contentLabelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const contentLabel = document.createElement("label");
    contentLabel.textContent = window.SuperPromptI18n?.t
      ? window.SuperPromptI18n.t("content")
      : "Content";
    contentLabel.style.cssText = `
      font-weight: 600;
      color: ${colors.text};
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.8;
    `;

    // Character counter
    const charCounter = document.createElement("span");
    charCounter.style.cssText = `
      font-size: 11px;
      color: ${colors.textSecondary};
      font-weight: 500;
    `;
    charCounter.textContent = "0 characters";

    contentLabelRow.appendChild(contentLabel);
    contentLabelRow.appendChild(charCounter);

    const contentTextarea = document.createElement("textarea");
    contentTextarea.placeholder = window.SuperPromptI18n?.t
      ? window.SuperPromptI18n.t("writeYourNote")
      : "Write your note here...";
    try {
      contentTextarea.setAttribute("data-superprompt", "note-content-textarea");
    } catch {}

    contentTextarea.style.cssText = `
      flex: 1;
      width: 100%;
      padding: 16px;
      border: 2px solid ${colors.border};
      border-radius: 8px;
      background: ${colors.input};
      color: ${colors.text};
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      resize: none;
      outline: none;
      box-sizing: border-box;
      line-height: 1.6;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 0;
    `;

    // Update character counter
    const updateCharCounter = () => {
      const count = contentTextarea.value.length;
      charCounter.textContent = `${count} character${count !== 1 ? "s" : ""}`;
      if (count > 5000) {
        charCounter.style.color = "#ef4444";
      } else if (count > 3000) {
        charCounter.style.color = "#f59e0b";
      } else {
        charCounter.style.color = colors.textSecondary;
      }
    };

    contentTextarea.addEventListener("input", updateCharCounter);

    // Premium focus styles for textarea
    contentTextarea.addEventListener("focus", () => {
      contentTextarea.style.borderColor = colors.accent;
      contentTextarea.style.boxShadow = `0 0 0 4px ${colors.accent}20`;
      contentTextarea.style.transform = "translateY(-1px)";
    });
    contentTextarea.addEventListener("blur", () => {
      contentTextarea.style.borderColor = colors.border;
      contentTextarea.style.boxShadow = "none";
      contentTextarea.style.transform = "translateY(0)";
    });

    // Premium auto-save indicator with icon
    const autoSaveIndicator = document.createElement("div");
    autoSaveIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: ${colors.accent};
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      background: ${colors.accent}10;
    `;
    autoSaveIndicator.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${
        window.SuperPromptI18n?.t
          ? window.SuperPromptI18n.t("autoSaved")
          : "Auto-saved"
      }</span>
    `;

    // Auto-save functionality
    let saveTimeout;
    const autoSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        const success = await this.saveNoteContent(
          conversationId,
          titleInput.value,
          contentTextarea.value,
        );
        if (success) {
          autoSaveIndicator.style.opacity = "1";
          setTimeout(() => {
            autoSaveIndicator.style.opacity = "0";
          }, 2000);
        }
      }, 1500);
    };

    titleInput.addEventListener("input", () => {
      autoSave();
    });
    contentTextarea.addEventListener("input", () => {
      updateCharCounter();
      autoSave();
    });

    // Assemble content
    const titleGroup = document.createElement("div");
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);

    contentWrapper.appendChild(contentLabelRow);
    contentWrapper.appendChild(contentTextarea);

    content.appendChild(titleGroup);
    content.appendChild(contentWrapper);

    // Footer with buttons
    const footer = document.createElement("div");
    try {
      footer.setAttribute("data-superprompt", "note-footer");
    } catch {}

    footer.style.cssText = `
      padding: 12px 20px;
      border-top: 1px solid ${colors.border};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: ${colors.background};
    `;

    footer.appendChild(autoSaveIndicator);

    // Define closeSidebar with smooth animation before button creation
    const closeSidebar = () => {
      // Animate panel out
      sidebarPanel.style.right = "-480px";

      // Fade out overlay
      sidebarOverlay.style.background = "rgba(0, 0, 0, 0)";
      sidebarOverlay.style.backdropFilter = "blur(0px)";

      // Remove after animation completes
      setTimeout(() => {
        sidebarOverlay.remove();

        // Remove body class to signal notes is closed
        document.body.classList.remove("sp-notes-dialog-open");

        // Show scroll nav toggle button again (it's in shadow DOM)
        try {
          const shadowHost = document.querySelector("#superprompt-shadow-root");
          if (shadowHost && shadowHost.shadowRoot) {
            const toggleBtn = shadowHost.shadowRoot.querySelector(
              ".sp-scroll-nav-toggle-btn",
            );
            if (toggleBtn) {
              toggleBtn.style.display = "";
            }
          }
        } catch (e) {
          console.error("[Notes] Failed to show scroll nav toggle:", e);
        }
      }, 400);

      // Notify React floating button to show itself again
      try {
        window.postMessage(
          { type: "sp-note-sidebar-state", isOpen: false },
          "*",
        );
      } catch {}
    };

    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // Premium Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span>${
        window.SuperPromptI18n?.t
          ? window.SuperPromptI18n.t("cancel")
          : "Cancel"
      }</span>
    `;
    cancelButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 18px;
      border: 2px solid ${colors.border};
      border-radius: 8px;
      background: transparent;
      color: ${colors.text};
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    `;
    cancelButton.addEventListener("mouseenter", () => {
      cancelButton.style.background = isDarkMode
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.05)";
      cancelButton.style.borderColor = isDarkMode ? "#555" : "#ccc";
      cancelButton.style.transform = "translateY(-1px)";
    });
    cancelButton.addEventListener("mouseleave", () => {
      cancelButton.style.background = "transparent";
      cancelButton.style.borderColor = colors.border;
      cancelButton.style.transform = "translateY(0)";
    });
    cancelButton.addEventListener("click", closeSidebar);
    try {
      cancelButton.setAttribute("data-superprompt", "note-cancel");
    } catch {}

    // Premium Delete button - only show if note exists
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
      <span>${
        window.SuperPromptI18n?.t
          ? window.SuperPromptI18n.t("delete")
          : "Delete"
      }</span>
    `;
    deleteButton.style.cssText = `
      display: ${hasNote ? "flex" : "none"};
      align-items: center;
      gap: 7px;
      padding: 10px 18px;
      border: 2px solid ${isDarkMode ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.2)"};
      border-radius: 8px;
      background: transparent;
      color: #ef4444;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    `;
    deleteButton.addEventListener("mouseenter", () => {
      deleteButton.style.background = "rgba(239, 68, 68, 0.12)";
      deleteButton.style.borderColor = "#ef4444";
      deleteButton.style.transform = "translateY(-1px)";
      deleteButton.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.25)";
    });
    deleteButton.addEventListener("mouseleave", () => {
      deleteButton.style.background = "transparent";
      deleteButton.style.borderColor = isDarkMode
        ? "rgba(239, 68, 68, 0.3)"
        : "rgba(239, 68, 68, 0.2)";
      deleteButton.style.transform = "translateY(0)";
      deleteButton.style.boxShadow = "none";
    });
    deleteButton.addEventListener("click", async () => {
      // Show custom confirmation dialog
      this.showDeleteNoteConfirmation(conversationId, () => {
        closeSidebar();
      });
    });
    try {
      deleteButton.setAttribute("data-superprompt", "note-delete");
    } catch {}

    // Save button - compact custom style with Lucide Check icon
    const saveButton = document.createElement("button");
    saveButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${
        window.SuperPromptI18n?.t ? window.SuperPromptI18n.t("save") : "Save"
      }</span>
    `;
    saveButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: ${colors.accent};
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      box-shadow: 0 2px 8px ${colors.accent}40;
    `;
    saveButton.addEventListener("mouseenter", () => {
      saveButton.style.background = colors.accentHover;
      saveButton.style.transform = "translateY(-2px)";
      saveButton.style.boxShadow = `0 4px 16px ${colors.accent}50`;
    });
    saveButton.addEventListener("mouseleave", () => {
      saveButton.style.background = colors.accent;
      saveButton.style.transform = "translateY(0)";
      saveButton.style.boxShadow = `0 2px 8px ${colors.accent}40`;
    });
    saveButton.addEventListener("click", async () => {
      const success = await this.saveNoteContent(
        conversationId,
        titleInput.value,
        contentTextarea.value,
      );
      if (success) {
        this.updateNoteTab(conversationId, true);
        closeSidebar();
      }
    });
    try {
      saveButton.setAttribute("data-superprompt", "note-save");
    } catch {}

    buttonContainer.appendChild(cancelButton);
    if (hasNote) {
      buttonContainer.appendChild(deleteButton);
    }
    buttonContainer.appendChild(saveButton);
    footer.appendChild(buttonContainer);

    // Assemble sidebar
    sidebarPanel.appendChild(header);
    sidebarPanel.appendChild(content);
    sidebarPanel.appendChild(footer);
    sidebarOverlay.appendChild(sidebarPanel);

    // Load existing note if available
    if (hasNote) {
      this.loadExistingNoteContent(
        conversationId,
        titleInput,
        contentTextarea,
      ).then(() => {
        // Update character counter after loading
        updateCharCounter();
      });
    }

    // Add to DOM and animate in with smooth transitions
    document.body.appendChild(sidebarOverlay);

    // Trigger smooth animations
    requestAnimationFrame(() => {
      // Fade in overlay backdrop
      sidebarOverlay.style.background = "rgba(0, 0, 0, 0.6)";
      sidebarOverlay.style.backdropFilter = "blur(8px)";

      // Slide in panel from right
      setTimeout(() => {
        sidebarPanel.style.right = "0px";
      }, 10);
    });

    // Close on overlay click
    sidebarOverlay.addEventListener("click", (e) => {
      if (e.target === sidebarOverlay) {
        closeSidebar();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeSidebar();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Focus title input
    setTimeout(() => {
      titleInput.focus();
    }, 350);
  },

  /**
   * Fallback button creator if UI Components module is not available
   * @param {string} text - Button text
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Button element
   */
  createFallbackButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText = `
      padding: 8px 16px;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 6px;
      background: var(--color-surface-primary, #fff);
      color: var(--color-text-primary, #000);
      cursor: pointer;
      font-size: 14px;
    `;
    button.addEventListener("click", onClick);
    return button;
  },

  // ============================================================================
  // NOTE TAB MANAGEMENT
  // ============================================================================

  /**
   * Initialize note tab for current conversation
   * @param {Function} getCurrentConversationId - Function to get current conversation ID
   * @param {Function} shouldShowNotesTab - Function to check if notes tab should show
   * @param {boolean} managerIsOpen - Whether manager is currently open
   */
  initializeNoteTab(
    getCurrentConversationId,
    shouldShowNotesTab,
    managerIsOpen = false,
  ) {
    const conversationId = getCurrentConversationId();
    if (!conversationId) {
      const existingTabEarly = document.querySelector(".sp-note-tab");
      if (existingTabEarly) existingTabEarly.remove();
      return;
    }

    // Remove any existing note tab
    const existingTab = document.querySelector(".sp-note-tab");
    if (existingTab) existingTab.remove();

    // Only show on main chat view when conversation was selected from vault sidebar
    if (!shouldShowNotesTab() || managerIsOpen) {
      return;
    }

    // Check if conversation has notes
    this.conversationHasNotes(conversationId).then((hasNote) => {
      // Double-check manager state before adding tab
      if (!managerIsOpen) {
        if (window.SuperPromptCoreUtils?.spPostLog) {
          window.SuperPromptCoreUtils.spPostLog(
            "info",
            "Creating Notes tab for conversation",
            { conversationId, hasNote },
          );
        }

        const noteTab = this.createNoteTab(conversationId, hasNote);
        if (noteTab) {
          document.body.appendChild(noteTab);
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "info",
              "Notes tab created and added to DOM",
            );
          }
        }

        // Create and add scroll buttons if enabled in settings
        const shouldShowScrollButtons =
          window.__SP_ConversationStyleStore__?.getState?.()
            ?.scrollButtonsEnabled ?? true;

        if (shouldShowScrollButtons) {
          const scrollButtons = this.createScrollButtons(hasNote);
          if (scrollButtons) {
            // Remove existing scroll buttons first
            const existingScrollButtons =
              document.querySelector(".sp-scroll-buttons");
            if (existingScrollButtons) existingScrollButtons.remove();

            document.body.appendChild(scrollButtons);
            if (window.SuperPromptCoreUtils?.spPostLog) {
              window.SuperPromptCoreUtils.spPostLog(
                "info",
                "Scroll buttons created and added to DOM",
              );
            }
          }
        }
      }
    });
  },

  /**
   * Remove all note tabs from DOM
   */
  removeAllNoteTabs() {
    const tabs = document.querySelectorAll(".sp-note-tab");
    tabs.forEach((tab) => tab.remove());

    // Also remove scroll buttons
    const scrollButtons = document.querySelectorAll(".sp-scroll-buttons");
    scrollButtons.forEach((btn) => btn.remove());
  },

  /**
   * Check if note tab should be visible based on current state
   * @param {Function} shouldShowNotesTab - Function to check if notes tab should show
   * @param {boolean} managerIsOpen - Whether manager is currently open
   * @returns {boolean} Whether tab should be visible
   */
  shouldNoteTabBeVisible(shouldShowNotesTab, managerIsOpen = false) {
    return shouldShowNotesTab && !managerIsOpen;
  },
};

// Backward compatibility - expose key functions globally
window.spOpenNoteSidebar = window.SuperPromptNotesManager.openNoteSidebar.bind(
  window.SuperPromptNotesManager,
);
window.spCreateNoteTab = window.SuperPromptNotesManager.createNoteTab.bind(
  window.SuperPromptNotesManager,
);
window.spConversationHasNotes =
  window.SuperPromptNotesManager.conversationHasNotes.bind(
    window.SuperPromptNotesManager,
  );

// Log successful module loading
if (window.SuperPromptCoreUtils?.spPostLog) {
  window.SuperPromptCoreUtils.spPostLog(
    "info",
    "Notes Manager module loaded successfully",
  );
} else if (console?.log) {
  devLog("✅ SuperPrompt Notes Manager module loaded");
}

// Listen for scroll buttons setting changes
window.addEventListener("sp-scroll-buttons-changed", (event) => {
  const { scrollButtonsEnabled } = event.detail || {};

  if (window.SuperPromptCoreUtils?.spPostLog) {
    window.SuperPromptCoreUtils.spPostLog(
      "info",
      `Scroll buttons setting changed: ${scrollButtonsEnabled}`,
    );
  }

  const existingButtons = document.querySelector(".sp-scroll-buttons");

  if (scrollButtonsEnabled && !existingButtons) {
    // Create scroll buttons if they don't exist
    const conversationId = _getCurrentConversationId();
    _getHasNotesCached(conversationId || "").then((hasNote) => {
      const scrollButtons =
        window.SuperPromptNotesManager.createScrollButtons(hasNote);
      if (scrollButtons) {
        document.body.appendChild(scrollButtons);
      }
    });
  } else if (!scrollButtonsEnabled && existingButtons) {
    // Remove scroll buttons if they exist
    existingButtons.remove();
  }
});

// ============================================================================
// STATE CHANGE LISTENERS - React to manager/floating menu state
// ============================================================================

// Listen for manager state changes
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "sp-manager-state-change") {
    _managerIsOpen = event.data.showManager === true;

    if (window.SuperPromptCoreUtils?.spPostLog) {
      window.SuperPromptCoreUtils.spPostLog(
        "debug",
        "[NotesManager] Manager state changed",
        { managerIsOpen: _managerIsOpen },
      );
    }

    if (_managerIsOpen) {
      _hideNoteTabImmediate();
    } else {
      // Manager closed, schedule notes tab check
      _scheduleNotesGuardCheck();
    }
  }

  // Also listen for floating menu state changes
  if (event.data && event.data.type === "sp-floating-menu-state") {
    _isFloatingMenuOpen = event.data.isOpen === true;

    if (window.SuperPromptCoreUtils?.spPostLog) {
      window.SuperPromptCoreUtils.spPostLog(
        "debug",
        "[NotesManager] Floating menu state changed",
        { isFloatingMenuOpen: _isFloatingMenuOpen },
      );
    }

    // Update UI visibility
    const noteTab = document.querySelector(".sp-note-tab");
    const scrollButtons = document.querySelector(".sp-scroll-buttons");

    if (_isFloatingMenuOpen) {
      if (noteTab) noteTab.style.display = "none";
      if (scrollButtons) scrollButtons.style.display = "none";
    } else {
      // Floating menu closed, restore visibility if appropriate
      if (noteTab) noteTab.style.display = "";
      if (scrollButtons) scrollButtons.style.display = "flex";
      // Also schedule a check to recreate if needed
      _scheduleNotesGuardCheck();
    }
  }
});

// ============================================================================
// NOTES TAB GUARD - Ensure notes tab is shown/hidden appropriately
// ============================================================================

/**
 * Check and update notes tab visibility
 */
function _notesGuardCheck() {
  if (_notesGuardStopped) return;

  // Visibility gating
  if (document.visibilityState && document.visibilityState !== "visible") {
    return;
  }

  // Respect global pause state
  if (window._spExtensionPaused) return;

  let shouldShow = false;
  try {
    shouldShow =
      _shouldShowNotesTab() && !_managerIsOpen && !_isFloatingMenuOpen;
  } catch {
    shouldShow = false;
  }

  const existingTab = document.querySelector(".sp-note-tab");

  // Remove tab if it shouldn't be shown
  if (existingTab && !shouldShow) {
    existingTab.remove();
    return;
  }

  // Create tab if it should be shown but doesn't exist
  if (!existingTab && shouldShow) {
    const conversationId = _getCurrentConversationId();
    if (!conversationId) return;

    _getHasNotesCached(conversationId).then((hasNote) => {
      if (_notesGuardStopped) return;

      // Double-check conditions
      const stillOk =
        _shouldShowNotesTab() && !_managerIsOpen && !_isFloatingMenuOpen;
      const tabNow = document.querySelector(".sp-note-tab");
      if (!stillOk || tabNow) return;

      const newTab = window.SuperPromptNotesManager.createNoteTab(
        conversationId,
        hasNote,
      );
      if (newTab) {
        document.body.appendChild(newTab);
      }
    });
  }
}

/**
 * Schedule a notes guard check with debouncing
 */
function _scheduleNotesGuardCheck() {
  if (_notesGuardStopped) return;

  // Cancel any pending check
  if (_notesGuardTimeoutId) {
    clearTimeout(_notesGuardTimeoutId);
  }

  _notesGuardScheduled = true;
  const now = Date.now();
  const delay = Math.max(
    0,
    NOTES_GUARD_MIN_SPACING_MS - (now - _notesGuardLastRunTs),
  );

  _notesGuardTimeoutId = setTimeout(() => {
    requestAnimationFrame(() => {
      _notesGuardScheduled = false;
      if (_notesGuardStopped) return;
      _notesGuardLastRunTs = Date.now();
      _notesGuardCheck();
    });
  }, delay);
}

// Expose schedule function globally for other modules
window._spScheduleNotesTabGuardCheck = _scheduleNotesGuardCheck;
window._spInvalidateNotesTabGuardCache = _invalidateNotesCache;

// Listen for visibility changes
document.addEventListener(
  "visibilitychange",
  () => {
    if (!_notesGuardStopped && document.visibilityState === "visible") {
      _scheduleNotesGuardCheck();
    }
  },
  true,
);

// Listen for URL changes (popstate)
window.addEventListener("popstate", () => {
  const conversationId = _getCurrentConversationId();
  if (conversationId) {
    // Invalidate old cache
    _invalidateNotesCache();
    // Immediately pre-fetch new conversation's notes status
    _prefetchNotesStatus(conversationId);
  }
  // Multiple guard checks to ensure tab appears
  _scheduleNotesGuardCheck();
  setTimeout(_scheduleNotesGuardCheck, 100);
  setTimeout(_scheduleNotesGuardCheck, 300);
});

// ============================================================================
// AUTO-INITIALIZATION ON CHATGPT
// ============================================================================

// Initialize on ChatGPT page load
if (
  window.location.hostname.includes("chatgpt") ||
  window.location.hostname.includes("openai")
) {
  console.log(
    "[NotesManager] Detected ChatGPT page, initializing notes system",
  );

  const initNotesSystem = () => {
    // Pre-fetch notes status for instant display
    const conversationId = _getCurrentConversationId();
    if (conversationId) {
      _prefetchNotesStatus(conversationId);
    }

    // Initialize scroll buttons
    const shouldShowScrollButtons =
      window.__SP_ConversationStyleStore__?.getState?.()
        ?.scrollButtonsEnabled ?? true;

    if (shouldShowScrollButtons) {
      const existingButtons = document.querySelector(".sp-scroll-buttons");
      if (!existingButtons && conversationId) {
        _getHasNotesCached(conversationId).then((hasNote) => {
          const scrollButtons =
            window.SuperPromptNotesManager.createScrollButtons(hasNote);
          if (scrollButtons) {
            document.body.appendChild(scrollButtons);
          }
        });
      }
    }

    // Initialize notes tab if on a conversation
    if (_shouldShowNotesTab()) {
      _scheduleNotesGuardCheck();
    }
  };

  // Try immediately or wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNotesSystem);
  } else {
    initNotesSystem();
  }

  // Retry after delays for SPA navigation
  setTimeout(initNotesSystem, 500);
  setTimeout(initNotesSystem, 1500);
  setTimeout(_scheduleNotesGuardCheck, 2000);

  // More reliable URL change detection via polling (SPA navigation)
  let lastUrl = location.href;
  let lastConversationId = _getCurrentConversationId();

  setInterval(() => {
    const currentUrl = location.href;
    const currentConversationId = _getCurrentConversationId();

    if (
      currentUrl !== lastUrl ||
      currentConversationId !== lastConversationId
    ) {
      console.log("[NotesManager] Detected navigation:", {
        from: lastUrl,
        to: currentUrl,
        conversationId: currentConversationId,
      });

      lastUrl = currentUrl;
      lastConversationId = currentConversationId;

      if (currentConversationId) {
        // Clear cache and pre-fetch immediately
        _invalidateNotesCache();
        _prefetchNotesStatus(currentConversationId);
      }

      // Multiple checks to ensure tab appears
      _scheduleNotesGuardCheck();
      setTimeout(_scheduleNotesGuardCheck, 100);
      setTimeout(_scheduleNotesGuardCheck, 300);
      setTimeout(_scheduleNotesGuardCheck, 600);
    }
  }, 200); // Check every 200ms

  // Also listen to hashchange as backup
  window.addEventListener("hashchange", () => {
    const conversationId = _getCurrentConversationId();
    if (conversationId) {
      _invalidateNotesCache();
      _prefetchNotesStatus(conversationId);
      _scheduleNotesGuardCheck();
    }
  });
}
