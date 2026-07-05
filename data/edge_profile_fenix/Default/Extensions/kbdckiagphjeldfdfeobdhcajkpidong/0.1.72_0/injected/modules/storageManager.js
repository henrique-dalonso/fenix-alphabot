// ██████████████████████████████████████████████████████████████████████████████
// ██                        SUPERPROMPT STORAGE MANAGER                      ██
// ██                                                                        ██
// ██   Modular storage operations, caching, synchronization utilities       ██
// ██████████████████████████████████████████████████████████████████████████

// Global namespace for storage management utilities
window.SuperPromptStorageManager = {
  // ============================================================================
  // CHROME STORAGE OPERATIONS
  // ============================================================================

  /**
   * Chrome storage wrapper with error handling and caching
   * @param {string|Array} keys - Storage keys to retrieve
   * @returns {Promise<Object>} Retrieved data
   */
  async chromeStorageGet(keys) {
    try {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        throw new Error("Chrome storage API not available");
      }

      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result || {});
          }
        });
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Chrome storage get failed",
          { keys, error: error.message },
        );
      }
      return {};
    }
  },

  /**
   * Chrome storage set with error handling
   * @param {Object} items - Data to store
   * @returns {Promise<boolean>} Success status
   */
  async chromeStorageSet(items) {
    try {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        throw new Error("Chrome storage API not available");
      }

      return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Chrome storage set failed",
          { items: Object.keys(items), error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * Chrome storage remove with error handling
   * @param {string|Array} keys - Keys to remove
   * @returns {Promise<boolean>} Success status
   */
  async chromeStorageRemove(keys) {
    try {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        throw new Error("Chrome storage API not available");
      }

      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Chrome storage remove failed",
          { keys, error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * Chrome storage clear with error handling
   * @returns {Promise<boolean>} Success status
   */
  async chromeStorageClear() {
    try {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        throw new Error("Chrome storage API not available");
      }

      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Chrome storage clear failed",
          { error: error.message },
        );
      }
      return false;
    }
  },

  // ============================================================================
  // LOCAL STORAGE OPERATIONS
  // ============================================================================

  /**
   * LocalStorage wrapper with error handling and JSON support
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Retrieved value or default
   */
  localStorageGet(key, defaultValue = null) {
    try {
      if (typeof localStorage === "undefined") {
        return defaultValue;
      }

      const value = localStorage.getItem(key);
      if (value === null) {
        return defaultValue;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "LocalStorage get failed",
          { key, error: error.message },
        );
      }
      return defaultValue;
    }
  },

  /**
   * LocalStorage set with JSON support and error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  localStorageSet(key, value) {
    try {
      if (typeof localStorage === "undefined") {
        return false;
      }

      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "LocalStorage set failed",
          { key, error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * LocalStorage remove with error handling
   * @param {string} key - Storage key to remove
   * @returns {boolean} Success status
   */
  localStorageRemove(key) {
    try {
      if (typeof localStorage === "undefined") {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "LocalStorage remove failed",
          { key, error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * LocalStorage clear with error handling
   * @returns {boolean} Success status
   */
  localStorageClear() {
    try {
      if (typeof localStorage === "undefined") {
        return false;
      }

      localStorage.clear();
      return true;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "LocalStorage clear failed",
          { error: error.message },
        );
      }
      return false;
    }
  },

  // ============================================================================
  // SESSION STORAGE OPERATIONS
  // ============================================================================

  /**
   * SessionStorage wrapper with error handling and JSON support
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Retrieved value or default
   */
  sessionStorageGet(key, defaultValue = null) {
    try {
      if (typeof sessionStorage === "undefined") {
        return defaultValue;
      }

      const value = sessionStorage.getItem(key);
      if (value === null) {
        return defaultValue;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "SessionStorage get failed",
          { key, error: error.message },
        );
      }
      return defaultValue;
    }
  },

  /**
   * SessionStorage set with JSON support and error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  sessionStorageSet(key, value) {
    try {
      if (typeof sessionStorage === "undefined") {
        return false;
      }

      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "SessionStorage set failed",
          { key, error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * SessionStorage remove with error handling
   * @param {string} key - Storage key to remove
   * @returns {boolean} Success status
   */
  sessionStorageRemove(key) {
    try {
      if (typeof sessionStorage === "undefined") {
        return false;
      }

      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "SessionStorage remove failed",
          { key, error: error.message },
        );
      }
      return false;
    }
  },

  // ============================================================================
  // INDEXEDDB OPERATIONS
  // ============================================================================

  /**
   * Open IndexedDB database with error handling
   * @param {string} dbName - Database name
   * @param {number} version - Database version
   * @param {Function} upgradeCallback - Upgrade callback function
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async openIndexedDB(dbName, version = 1, upgradeCallback = null) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof indexedDB === "undefined") {
          reject(new Error("IndexedDB not available"));
          return;
        }

        const request = indexedDB.open(dbName, version);

        request.onerror = () => {
          const error = request.error || new Error("IndexedDB open failed");
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "error",
              "IndexedDB open failed",
              { dbName, version, error: error.message },
            );
          }
          reject(error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (upgradeCallback) {
            try {
              upgradeCallback(db, event.oldVersion, event.newVersion);
            } catch (upgradeError) {
              if (window.SuperPromptCoreUtils?.spPostLog) {
                window.SuperPromptCoreUtils.spPostLog(
                  "error",
                  "IndexedDB upgrade failed",
                  { dbName, error: upgradeError.message },
                );
              }
              reject(upgradeError);
            }
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Get all data from IndexedDB object store
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @returns {Promise<Array>} All records from store
   */
  async indexedDBGetAll(dbName, storeName) {
    try {
      const db = await this.openIndexedDB(dbName);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => {
          db.close();
          reject(request.error || new Error("IndexedDB getAll failed"));
        };

        request.onsuccess = () => {
          db.close();
          resolve(request.result || []);
        };
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "IndexedDB getAll failed",
          { dbName, storeName, error: error.message },
        );
      }
      return [];
    }
  },

  /**
   * Add data to IndexedDB object store
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @param {*} data - Data to add
   * @returns {Promise<boolean>} Success status
   */
  async indexedDBAdd(dbName, storeName, data) {
    try {
      const db = await this.openIndexedDB(dbName);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onerror = () => {
          db.close();
          reject(request.error || new Error("IndexedDB add failed"));
        };

        request.onsuccess = () => {
          db.close();
          resolve(true);
        };
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "IndexedDB add failed", {
          dbName,
          storeName,
          error: error.message,
        });
      }
      return false;
    }
  },

  /**
   * Update data in IndexedDB object store
   * @param {string} dbName - Database name
   * @param {string} storeName - Object store name
   * @param {*} data - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async indexedDBPut(dbName, storeName, data) {
    try {
      const db = await this.openIndexedDB(dbName);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onerror = () => {
          db.close();
          reject(request.error || new Error("IndexedDB put failed"));
        };

        request.onsuccess = () => {
          db.close();
          resolve(true);
        };
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "IndexedDB put failed", {
          dbName,
          storeName,
          error: error.message,
        });
      }
      return false;
    }
  },

  /**
   * Delete IndexedDB database
   * @param {string} dbName - Database name to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteIndexedDB(dbName) {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB === "undefined") {
          resolve(false);
          return;
        }

        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onerror = () => {
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "error",
              "IndexedDB delete failed",
              { dbName, error: deleteRequest.error?.message },
            );
          }
          resolve(false);
        };

        deleteRequest.onsuccess = () => {
          resolve(true);
        };

        deleteRequest.onblocked = () => {
          if (window.SuperPromptCoreUtils?.spPostLog) {
            window.SuperPromptCoreUtils.spPostLog(
              "warn",
              "IndexedDB delete blocked",
              { dbName },
            );
          }
          // Force resolve after timeout for blocked deletions
          setTimeout(() => resolve(false), 5000);
        };
      } catch (error) {
        if (window.SuperPromptCoreUtils?.spPostLog) {
          window.SuperPromptCoreUtils.spPostLog(
            "error",
            "IndexedDB delete error",
            { dbName, error: error.message },
          );
        }
        resolve(false);
      }
    });
  },

  // ============================================================================
  // CACHING SYSTEM
  // ============================================================================

  // In-memory cache for frequently accessed data
  _memoryCache: new Map(),
  _cacheMetadata: new Map(),

  /**
   * Get cached value with TTL support
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in milliseconds
   * @returns {*} Cached value or null if expired/not found
   */
  getCachedValue(key, ttl = 5 * 60 * 1000) {
    // 5 minutes default TTL
    const cached = this._memoryCache.get(key);
    const metadata = this._cacheMetadata.get(key);

    if (!cached || !metadata) {
      return null;
    }

    // Check if expired
    if (Date.now() - metadata.timestamp > ttl) {
      this._memoryCache.delete(key);
      this._cacheMetadata.delete(key);
      return null;
    }

    return cached;
  },

  /**
   * Set cached value with metadata
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} options - Cache options
   */
  setCachedValue(key, value, options = {}) {
    this._memoryCache.set(key, value);
    this._cacheMetadata.set(key, {
      timestamp: Date.now(),
      size: JSON.stringify(value).length,
      ...options,
    });

    // Simple cache size management (keep max 100 entries)
    if (this._memoryCache.size > 100) {
      const oldestKey = this._memoryCache.keys().next().value;
      this._memoryCache.delete(oldestKey);
      this._cacheMetadata.delete(oldestKey);
    }
  },

  /**
   * Clear memory cache
   */
  clearCache() {
    this._memoryCache.clear();
    this._cacheMetadata.clear();
  },

  // ============================================================================
  // HIGH-LEVEL STORAGE OPERATIONS
  // ============================================================================

  /**
   * Get prompts from storage with caching
   * @returns {Promise<Array>} Array of saved prompts
   */
  async getSavedPrompts() {
    const cacheKey = "saved_prompts";
    const cached = this.getCachedValue(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.chromeStorageGet(["savedPrompts"]);
      const prompts = result.savedPrompts || [];
      this.setCachedValue(cacheKey, prompts);
      return prompts;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Failed to get saved prompts",
          { error: error.message },
        );
      }
      return [];
    }
  },

  /**
   * Save prompts to storage and update cache
   * @param {Array} prompts - Array of prompts to save
   * @returns {Promise<boolean>} Success status
   */
  async setSavedPrompts(prompts) {
    try {
      const success = await this.chromeStorageSet({ savedPrompts: prompts });
      if (success) {
        this.setCachedValue("saved_prompts", prompts);
      }
      return success;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Failed to save prompts",
          { error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * Get vaults from storage with caching
   * @returns {Promise<Array>} Array of vaults
   */
  async getVaults() {
    const cacheKey = "vaults";
    const cached = this.getCachedValue(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.chromeStorageGet(["vaults"]);
      const vaults = result.vaults || [];
      this.setCachedValue(cacheKey, vaults);
      return vaults;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "Failed to get vaults", {
          error: error.message,
        });
      }
      return [];
    }
  },

  /**
   * Save vaults to storage and update cache
   * @param {Array} vaults - Array of vaults to save
   * @returns {Promise<boolean>} Success status
   */
  async setVaults(vaults) {
    try {
      const success = await this.chromeStorageSet({ vaults: vaults });
      if (success) {
        this.setCachedValue("vaults", vaults);
      }
      return success;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Failed to save vaults",
          { error: error.message },
        );
      }
      return false;
    }
  },

  /**
   * Get active vault ID from localStorage
   * @returns {string|null} Active vault ID
   */
  getActiveVaultId() {
    return this.localStorageGet("activeVaultId");
  },

  /**
   * Set active vault ID in localStorage
   * @param {string} vaultId - Vault ID to set as active
   * @returns {boolean} Success status
   */
  setActiveVaultId(vaultId) {
    return this.localStorageSet("activeVaultId", vaultId);
  },

  /**
   * Get recent prompts from storage
   * @returns {Promise<Array>} Array of recent prompts
   */
  async getRecentPrompts() {
    const cacheKey = "recent_prompts";
    const cached = this.getCachedValue(cacheKey, 2 * 60 * 1000); // 2 minutes TTL for recents
    if (cached) return cached;

    try {
      const result = await this.chromeStorageGet(["recentPrompts"]);
      const recents = result.recentPrompts || [];
      this.setCachedValue(cacheKey, recents);
      return recents;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Failed to get recent prompts",
          { error: error.message },
        );
      }
      return [];
    }
  },

  /**
   * Set recent prompts in storage
   * @param {Array} recentPrompts - Array of recent prompts
   * @returns {Promise<boolean>} Success status
   */
  async setRecentPrompts(recentPrompts) {
    try {
      const success = await this.chromeStorageSet({
        recentPrompts: recentPrompts,
      });
      if (success) {
        this.setCachedValue("recent_prompts", recentPrompts);
      }
      return success;
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Failed to save recent prompts",
          { error: error.message },
        );
      }
      return false;
    }
  },

  // ============================================================================
  // CLEANUP UTILITIES
  // ============================================================================

  /**
   * Clean SuperPrompt-related localStorage keys
   * @returns {Array} Removed keys
   */
  cleanupLocalStorage() {
    const removedKeys = [];

    try {
      if (typeof localStorage === "undefined") return removedKeys;

      // Get all keys
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }

      // Remove SuperPrompt-related keys
      keys.forEach((key) => {
        if (
          key &&
          (key.startsWith("sp_") ||
            key.includes("superprompt") ||
            key.includes("vault") ||
            key.includes("prompt") ||
            key.startsWith("lastSyncedConversation") ||
            key.startsWith("userInputValueHistory"))
        ) {
          localStorage.removeItem(key);
          removedKeys.push(key);
        }
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "LocalStorage cleanup failed",
          { error: error.message },
        );
      }
    }

    return removedKeys;
  },

  /**
   * Clean SuperPrompt-related sessionStorage keys
   * @returns {Array} Removed keys
   */
  cleanupSessionStorage() {
    const removedKeys = [];

    try {
      if (typeof sessionStorage === "undefined") return removedKeys;

      // Get all keys
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        keys.push(sessionStorage.key(i));
      }

      // Remove SuperPrompt-related keys
      keys.forEach((key) => {
        if (
          key &&
          (key.startsWith("sp_") ||
            key.startsWith("vault-password-") ||
            key.includes("superprompt"))
        ) {
          sessionStorage.removeItem(key);
          removedKeys.push(key);
        }
      });
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "SessionStorage cleanup failed",
          { error: error.message },
        );
      }
    }

    return removedKeys;
  },

  /**
   * Clean SuperPrompt-related IndexedDB databases
   * @returns {Promise<Array>} Array of deleted database names
   */
  async cleanupIndexedDB() {
    const deletedDatabases = [];

    try {
      if (typeof indexedDB === "undefined") return deletedDatabases;

      // Common SuperPrompt database names
      const dbNames = [
        "SuperPrompt",
        "superprompt",
        "vaults",
        "conversations",
        "prompts",
        "Prompture-chats",
      ];

      for (const dbName of dbNames) {
        const deleted = await this.deleteIndexedDB(dbName);
        if (deleted) {
          deletedDatabases.push(dbName);
        }
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "IndexedDB cleanup failed",
          { error: error.message },
        );
      }
    }

    return deletedDatabases;
  },

  /**
   * Comprehensive cleanup of all SuperPrompt storage data
   * @returns {Promise<Object>} Cleanup report
   */
  async cleanupAllStorageData() {
    const report = {
      localStorageKeys: [],
      sessionStorageKeys: [],
      indexedDBNames: [],
      chromeStorageCleared: false,
      cacheCleared: true,
      errors: [],
    };

    try {
      // Clean localStorage
      report.localStorageKeys = this.cleanupLocalStorage();

      // Clean sessionStorage
      report.sessionStorageKeys = this.cleanupSessionStorage();

      // Clean IndexedDB
      report.indexedDBNames = await this.cleanupIndexedDB();

      // Clean Chrome storage
      report.chromeStorageCleared = await this.chromeStorageClear();

      // Clear memory cache
      this.clearCache();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      report.errors.push(errorMsg);

      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Storage cleanup failed",
          { error: errorMsg },
        );
      }
    }

    return report;
  },

  /**
   * Get chat message timestamp from IndexedDB
   * @param {string} turnId - The turn ID to look up
   * @returns {Promise<number|null>} Unix timestamp or null if not found
   */
  async getChatMessageTimestamp(turnId) {
    try {
      // Get current chat ID from URL
      const urlMatch = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      if (!urlMatch) {
        // Silently handle case where we can't extract chat ID - might be on homepage or other page
        return null;
      }

      const currentChatId = urlMatch[1];
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "debug",
          "Looking up timestamp for turnId:",
          turnId,
          "in chat:",
          currentChatId,
        );
      }

      return new Promise((resolve) => {
        const request = indexedDB.open("Prompture-chats");

        request.onerror = (err) => {
          // Silently handle IndexedDB access errors - database might not exist yet
          resolve(null);
        };

        request.onsuccess = (event) => {
          const db = event.target.result;

          if (!db.objectStoreNames.contains("chats")) {
            // Silently handle case where chats object store doesn't exist yet
            resolve(null);
            return;
          }

          const transaction = db.transaction(["chats"], "readonly");
          const store = transaction.objectStore("chats");

          // Get the specific chat by ID instead of all chats
          const getRequest = store.get(currentChatId);

          getRequest.onsuccess = () => {
            const chat = getRequest.result;

            if (!chat) {
              // Silently handle case where chat is not found - this is normal for unlinked conversations
              resolve(null);
              return;
            }

            // Look in the mapping property for the turnId
            if (chat.mapping && typeof chat.mapping === "object") {
              const messageData = chat.mapping[turnId];
              if (
                messageData &&
                messageData.message &&
                messageData.message.create_time
              ) {
                if (window.SuperPromptCoreUtils?.spPostLog) {
                  window.SuperPromptCoreUtils.spPostLog(
                    "debug",
                    "Found message in mapping for turnId:",
                    turnId,
                    "create_time:",
                    messageData.message.create_time,
                  );
                }
                resolve(messageData.message.create_time);
                return;
              }
            }

            // Silently handle case where turn ID is not found - this is normal for unlinked conversations
            resolve(null);
          };

          getRequest.onerror = (err) => {
            // Silently handle database read errors
            resolve(null);
          };
        };
      });
    } catch (error) {
      // Silently handle IndexedDB access errors
      return null;
    }
  },
};

// Backward compatibility - expose common functions globally
window.spStorageGet = window.SuperPromptStorageManager.chromeStorageGet.bind(
  window.SuperPromptStorageManager,
);
window.spStorageSet = window.SuperPromptStorageManager.chromeStorageSet.bind(
  window.SuperPromptStorageManager,
);
window.spGetActiveVaultId =
  window.SuperPromptStorageManager.getActiveVaultId.bind(
    window.SuperPromptStorageManager,
  );
window.spSetActiveVaultId =
  window.SuperPromptStorageManager.setActiveVaultId.bind(
    window.SuperPromptStorageManager,
  );

// Log successful module loading
if (window.SuperPromptCoreUtils?.spPostLog) {
  window.SuperPromptCoreUtils.spPostLog(
    "info",
    "Storage Manager module loaded successfully",
  );
} else if (console?.log) {
  console.log("✅ SuperPrompt Storage Manager module loaded");
}
