/**
 * SuperPrompt Vault Integration Module
 * Vault operations, sync logic, and conversation management system
 * Extracted from chat-gpt-page-listener.js for better maintainability
 */

(function () {
  "use strict";

  // Prevent multiple initialization
  if (window.SuperPromptVaultIntegration) {
    return;
  }

  // Only log module loading in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog("[SP-VaultIntegration] Initializing Vault Integration module...");
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                      VAULT INTEGRATION SYSTEM                         ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global vault state
  let spShadowHost = null;
  let spShadowRoot = null;
  let spTreeRoot = null;
  let lastDataKey = "";
  let lastDataTimestamp = 0;
  let lastPayload = null;
  let activeVaultWatchTimer = null;
  let lastObservedActiveVaultId = null;
  let isRenderInProgress = false;
  let pendingVaultRerender = false;
  let currentSearchQuery = "";

  // Cache duration for vault data
  const DATA_CACHE_DURATION = 5000; // 5 seconds
  const RENDER_DEBOUNCE_MS = 2000; // 2 seconds between renders

  // ===============================================================================
  // VAULT STATE MANAGEMENT
  // ===============================================================================

  // Check if vault sidebar is enabled
  // CRITICAL: Must use same key and format as chat-gpt-page-listener.js
  function getAltViewState() {
    try {
      return localStorage.getItem("sp_alt_view_on") === "1";
    } catch {
      return false;
    }
  }

  // Get active vault ID
  function readActiveVaultId() {
    try {
      return localStorage.getItem("activeVaultId") || "";
    } catch {
      return "";
    }
  }

  // Get current conversation ID from URL
  function getCurrentConversationId() {
    try {
      const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // Check if vault host is attached to DOM
  function isVaultHostAttached() {
    try {
      return !!(
        spShadowHost &&
        spShadowHost.isConnected &&
        document.contains(spShadowHost)
      );
    } catch {
      return false;
    }
  }

  // Generate data key for caching
  function dataKey(data) {
    try {
      return JSON.stringify({
        cats: data.categories?.length || 0,
        chats: data.chats?.length || 0,
        vault: data.activeVaultId || "",
      });
    } catch {
      return String(Date.now());
    }
  }

  // ===============================================================================
  // VAULT CONTAINER MANAGEMENT
  // ===============================================================================

  // Ensure shadow DOM container exists with fixed positioning
  function ensureShadowContainer() {
    devLog("🏦 VAULT: ensureShadowContainer called");

    try {
      const historyDiv = document.getElementById("history");
      if (!historyDiv) {
        devLog("❌ VAULT: No history div found - cannot mount vault yet");
        devLog(
          "💡 VAULT: Vault will auto-initialize when history div is ready",
        );
        return null;
      }
      devLog("✅ VAULT: History div found");

      // Check if existing host with valid shadow root exists
      if (
        spShadowHost &&
        spShadowHost.shadowRoot &&
        spShadowHost.isConnected &&
        document.contains(spShadowHost)
      ) {
        devLog("✅ VAULT: Using existing valid shadow host with shadow root");
        return spShadowHost;
      }

      // Check if there's an existing host in DOM but without our reference
      const existingHost = document.querySelector("#sp-vault-sidebar-host");
      if (existingHost) {
        devLog("✅ VAULT: Found existing DOM host, attempting reuse");

        // Try to reuse if it has a shadow root
        if (existingHost.shadowRoot) {
          spShadowHost = existingHost;
          spShadowRoot = existingHost.shadowRoot;
          devLog("✅ VAULT: Reusing existing host with shadow root");
          return spShadowHost;
        } else {
          // Try to attach shadow root to existing host
          devLog("🔧 VAULT: Adding shadow root to existing host");
          try {
            spShadowHost = existingHost;
            spShadowRoot = existingHost.attachShadow({ mode: "open" });
            devLog("✅ VAULT: Shadow root attached to existing host");
            startShadowDomGuardian();
            startShadowRootMonitor();
            return spShadowHost;
          } catch (e) {
            devLog("❌ VAULT: Failed to attach shadow root:", e.message);
            devLog("🔄 VAULT: Removing failed host and creating new one");
            existingHost.remove();
          }
        }
      }

      // Create new shadow host with fixed positioning
      spShadowHost = document.createElement("div");
      spShadowHost.id = "sp-vault-sidebar-host";
      spShadowHost.setAttribute("data-sp-shadow-host", "true");
      spShadowHost.setAttribute("data-sp-isolated", "true");

      // Apply fixed positioning CSS for visibility
      spShadowHost.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 300px !important;
        height: 100vh !important;
        z-index: 10000 !important;
        background: white !important;
        border-right: 1px solid #e5e5e5 !important;
        overflow-y: auto !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      `;

      devLog("🏗️ VAULT: Creating shadow root...");
      // Create shadow root in open mode for debugging
      spShadowRoot = spShadowHost.attachShadow({ mode: "open" });
      devLog("✅ VAULT: Shadow root created:", !!spShadowRoot);
      devLog(
        "🔍 VAULT: Shadow root accessible via .shadowRoot:",
        !!spShadowHost.shadowRoot,
      );

      // Insert into DOM - BYPASS the history div, mount to body for fixed positioning
      document.body.appendChild(spShadowHost);
      devLog(
        "✅ VAULT: Shadow host added to BODY (bypassing hidden history div)",
      );

      // Add continuous monitoring for removal
      let removalCheckCount = 0;
      const monitorRemoval = () => {
        removalCheckCount++;
        if (spShadowHost && !document.contains(spShadowHost)) {
          devError(
            `🚨 VAULT: Host was REMOVED from DOM after ${
              removalCheckCount * 500
            }ms!`,
          );
          devError(
            "🔍 VAULT: Host parent when removed:",
            spShadowHost.parentElement,
          );
          // Force re-add to body
          try {
            document.body.appendChild(spShadowHost);
            devLog("🔄 VAULT: Host force re-added to BODY");
          } catch (e) {
            devError("❌ VAULT: Failed to re-add host:", e);
          }
        }
        if (removalCheckCount < 40) {
          // Monitor for 20 seconds
          setTimeout(monitorRemoval, 500);
        }
      };
      setTimeout(monitorRemoval, 500);

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("📦 Vault shadow container created");
      }

      devLog(
        "🔚 VAULT: Final validation - host:",
        !!spShadowHost,
        "shadow root:",
        !!spShadowRoot,
      );
      devLog(
        "🔚 VAULT: Host.shadowRoot accessible:",
        !!spShadowHost.shadowRoot,
      );

      // Start monitoring systems
      startShadowDomGuardian();
      startShadowRootMonitor();

      return spShadowHost;
    } catch (error) {
      devError("❌ VAULT: Shadow container creation error:", error);
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Shadow container creation error",
          { error: error.message },
        );
      }
      return null;
    }
  }

  // Shadow DOM Guardian - Monitor and protect shadow root
  function startShadowDomGuardian() {
    if (!spShadowHost) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check for removal of shadow host
        if (mutation.type === "childList") {
          mutation.removedNodes.forEach((node) => {
            if (
              node.id === "sp-vault-sidebar-host" ||
              (node.nodeType === 1 &&
                node.querySelector("#sp-vault-sidebar-host"))
            ) {
              devLog("🚨 VAULT: Shadow host REMOVED by external force!");
              devLog("🔍 VAULT: Removed by:", mutation.target);
            }
          });

          mutation.addedNodes.forEach((node) => {
            if (node.id === "sp-vault-sidebar-host" && node !== spShadowHost) {
              devLog("🚨 VAULT: Unknown shadow host ADDED!");
              devLog("🔍 VAULT: Added by:", mutation.target);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    devLog("👁️ VAULT: Shadow DOM Guardian activated");
  }

  // Shadow Root Monitor - Periodically check shadow root integrity
  // PERFORMANCE: Changed from 1s to 5s (shadow root loss is rare, no need for aggressive polling)
  function startShadowRootMonitor() {
    setInterval(() => {
      if (spShadowHost && !spShadowHost.shadowRoot) {
        devError("🚨 VAULT: Shadow root LOST!");
        devLog("🔄 VAULT: Attempting to recreate shadow root...");
        try {
          spShadowRoot = spShadowHost.attachShadow({ mode: "open" });
          devLog("✅ VAULT: Shadow root recreated");
        } catch (e) {
          devError("❌ VAULT: Failed to recreate shadow root:", e);
        }
      }
    }, 5000);
    devLog("⏰ VAULT: Shadow root monitor started (5s interval)");
  }

  // Clean up existing vault sidebars
  function cleanupExistingVaultSidebars() {
    try {
      const historyDiv = document.getElementById("history");
      if (!historyDiv) return;

      // Remove all vault-related elements
      const vaultElements = historyDiv.querySelectorAll(
        "#sp-vault-sidebar-host, [id*='sp-vault'], [class*='sp-vault']",
      );
      vaultElements.forEach((el) => {
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        } catch {}
      });

      // Clear global references
      spShadowHost = null;
      spShadowRoot = null;
      spTreeRoot = null;

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🧹 Vault sidebars cleaned up");
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "Vault cleanup error", {
          error: error.message,
        });
      }
    }
  }

  // Hide/show default ChatGPT conversation list
  function hideDefaultChatsList(hide = true) {
    try {
      const historyDiv = document.getElementById("history");
      if (!historyDiv) return;

      const nativeNav = historyDiv.querySelector("nav");
      if (nativeNav) {
        nativeNav.style.display = hide ? "none" : "";

        if (window.SuperPromptCoreUtils?.log) {
          window.SuperPromptCoreUtils.log(
            `👁️ Default chats list ${hide ? "hidden" : "shown"}`,
          );
        }
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Chat list visibility error",
          { error: error.message },
        );
      }
    }
  }

  // ===============================================================================
  // VAULT DATA MANAGEMENT
  // ===============================================================================

  // Request vault data from content script and render
  function requestVaultSidebarDataAndRender() {
    devLog("🏦 VAULT: requestVaultSidebarDataAndRender called");

    const now = Date.now();

    // Debounce protection
    if (isRenderInProgress) {
      devLog("📋 VAULT: Render already in progress, skipping");
      return Promise.resolve();
    }

    if (now - lastDataTimestamp < RENDER_DEBOUNCE_MS) {
      devLog("📋 VAULT: Render debounced");
      return Promise.resolve();
    }

    lastDataTimestamp = now;
    isRenderInProgress = true;

    // Don't render if vault toggle is OFF
    if (!getAltViewState()) {
      devLog("❌ VAULT: Alt view is OFF, cleaning up");
      isRenderInProgress = false;
      cleanupExistingVaultSidebars();
      return Promise.resolve();
    }

    // Ensure shadow container exists
    try {
      const host = ensureShadowContainer();
      if (!host) {
        devLog("❌ VAULT: Could not create shadow container");
        isRenderInProgress = false;
        return Promise.resolve();
      }
    } catch (e) {
      devError("❌ VAULT: Shadow container error:", e);
      isRenderInProgress = false;
      return Promise.resolve();
    }

    // Request fresh data
    const reqId = String(Date.now()) + Math.random().toString(36).slice(2);
    devLog("📡 VAULT: Sending data request:", reqId);

    return new Promise((resolve) => {
      const onMsg = (e) => {
        const msg = e.data;
        devLog("🏦 VAULT: Received message:", msg?.type, msg?.requestId, reqId);

        if (
          !msg ||
          msg.type !== "sp-vault-sidebar-data" ||
          msg.requestId !== reqId
        ) {
          return;
        }

        window.removeEventListener("message", onMsg);

        if (msg.error) {
          devLog("⚠️ VAULT: Data error:", msg.error);
          resolve(null);
          return;
        }

        devLog("✅ VAULT: Received payload:", msg.payload);
        resolve(msg.payload || null);
      };

      window.addEventListener("message", onMsg);
      window.postMessage(
        {
          type: "sp-request-vault-sidebar-data",
          requestId: reqId,
        },
        "*",
      );
    })
      .then((payload) => {
        if (!payload) {
          devLog("❌ VAULT: No payload received");
          return;
        }

        ensureShadowContainer();
        renderTree(payload);
        updateActiveVaultDisplay(payload);

        lastDataKey = dataKey(payload);
        lastDataTimestamp = now;
        lastPayload = payload;
      })
      .finally(() => {
        isRenderInProgress = false;
      });
  }

  // ===============================================================================
  // VAULT RENDERING SYSTEM
  // ===============================================================================

  // Render vault tree structure
  function renderTree(data) {
    devLog("🎨 VAULT: renderTree called with data:", data);

    if (!spTreeRoot) {
      devLog("🏦 VAULT: No tree root, initializing...");
      initializeTreeContainer();
    }

    if (!spTreeRoot) {
      devError("❌ VAULT: Failed to initialize tree root");
      return;
    }

    spTreeRoot.innerHTML = "";

    const { categories = [], chats = [] } = data || {};
    lastPayload = data;

    devLog(
      "📊 VAULT: Rendering",
      categories.length,
      "categories and",
      chats.length,
      "chats",
    );

    // Apply search filter if active
    const filteredChats = currentSearchQuery
      ? chats.filter((chat) =>
          chat.title?.toLowerCase().includes(currentSearchQuery.toLowerCase()),
        )
      : chats.slice();

    // Render special sections (favorites, archived)
    renderSpecialSections(filteredChats);

    // Render categories
    renderCategories(categories, filteredChats);

    devLog("✅ VAULT: Tree rendering complete");
  }

  // Initialize tree container in shadow DOM
  function initializeTreeContainer() {
    devLog(
      "🌳 VAULT: initializeTreeContainer called, spShadowRoot:",
      !!spShadowRoot,
    );

    if (!spShadowRoot) {
      devError("❌ VAULT: No shadow root available");
      return;
    }

    try {
      // Create comprehensive vault structure with proper styling
      spShadowRoot.innerHTML = `
        <style>
          :host { 
            all: initial; 
            display: block !important; 
            width: 100% !important; 
            height: 100% !important; 
            contain: layout style paint;
          }
          .sp-vault-container {
            width: 100%;
            height: 100%;
            overflow-y: auto;
            background: var(--surface-primary, #ffffff);
            color: var(--text-primary, #000000);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
          }
          .sp-header {
            padding: 16px;
            border-bottom: 1px solid var(--border-light, #e5e5e5);
            font-weight: 600;
            font-size: 16px;
            background: var(--surface-secondary, #f8f9fa);
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .sp-tree-root {
            padding: 8px;
          }
          .sp-special {
            margin-bottom: 16px;
            border: 1px solid var(--border-light, #e5e5e5);
            border-radius: 8px;
            overflow: hidden;
          }
          .sp-special-title {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: var(--surface-secondary, #f8f9fa);
            cursor: pointer;
            font-weight: 600;
            user-select: none;
          }
          .sp-special-title:hover {
            background: var(--surface-hover, #e9ecef);
          }
          .sp-special-list {
            background: var(--surface-primary, #ffffff);
          }
          .sp-conv {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-ultralight, #f0f0f0);
            transition: background-color 0.15s ease;
            cursor: pointer;
          }
          .sp-conv:last-child {
            border-bottom: none;
          }
          .sp-conv:hover {
            background: var(--surface-hover, #f8f9fa);
          }
          .sp-conv a {
            display: flex;
            align-items: center;
            gap: 8px;
            color: inherit;
            text-decoration: none;
          }
          .sp-title {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sp-category {
            margin-bottom: 12px;
          }
          .sp-category-title {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            font-weight: 600;
            background: var(--surface-secondary, #f8f9fa);
            border-radius: 6px;
            margin-bottom: 4px;
            cursor: pointer;
            user-select: none;
          }
          .sp-category-title:hover {
            background: var(--surface-hover, #e9ecef);
          }
          .sp-category-list {
            padding-left: 12px;
          }
        </style>
        <div class="sp-vault-container">
          <div class="sp-header">
            <div>📚 Vault Contents</div>
          </div>
          <div class="sp-tree-root"></div>
        </div>
      `;

      spTreeRoot = spShadowRoot.querySelector(".sp-tree-root");
      devLog("✅ VAULT: Tree container initialized, spTreeRoot:", !!spTreeRoot);
      devLog(
        "🎨 VAULT: Shadow DOM HTML length:",
        spShadowRoot.innerHTML.length,
      );
    } catch (error) {
      devError("❌ VAULT: Tree container init error:", error);
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Tree container init error",
          { error: error.message },
        );
      }
    }
  }

  // Render special sections (favorites, archived)
  function renderSpecialSections(chats) {
    if (!spTreeRoot) return;

    const favChats = chats.filter((c) => c.favorite && !c.is_archived);
    const archivedChats = chats.filter((c) => c.is_archived);

    // Render favorites section
    if (favChats.length > 0) {
      renderSpecialSection("favorites", favChats, "⭐");
    }

    // Render archived section
    if (archivedChats.length > 0) {
      renderSpecialSection("archived", archivedChats, "📦");
    }
  }

  // Render individual special section
  function renderSpecialSection(kind, items, icon) {
    if (!spTreeRoot || !items?.length) return;

    const section = document.createElement("div");
    section.className = "sp-special";
    section.setAttribute("data-kind", kind);

    const title = document.createElement("div");
    title.className = "sp-special-title";
    title.innerHTML = `
      <span>${icon}</span>
      <span>${kind.charAt(0).toUpperCase() + kind.slice(1)}</span>
      <span>(${items.length})</span>
    `;

    const list = document.createElement("div");
    list.className = "sp-special-list";

    items.forEach((conv) => {
      const row = createConversationRow(conv);
      list.appendChild(row);
    });

    section.appendChild(title);
    section.appendChild(list);
    spTreeRoot.appendChild(section);
  }

  // Render categories
  function renderCategories(categories, chats) {
    if (!spTreeRoot || !categories || categories.length === 0) return;

    categories.forEach((category) => {
      const categoryChats = chats.filter(
        (chat) =>
          chat.category_id === category.id &&
          !chat.favorite &&
          !chat.is_archived,
      );

      if (categoryChats.length === 0) return;

      const categoryEl = document.createElement("div");
      categoryEl.className = "sp-category";

      const titleEl = document.createElement("div");
      titleEl.className = "sp-category-title";
      titleEl.innerHTML = `
        <span>📁</span>
        <span>${escapeHtml(category.name || "Untitled")}</span>
        <span>(${categoryChats.length})</span>
      `;

      const listEl = document.createElement("div");
      listEl.className = "sp-category-list";

      categoryChats.forEach((conv) => {
        const row = createConversationRow(conv);
        listEl.appendChild(row);
      });

      categoryEl.appendChild(titleEl);
      categoryEl.appendChild(listEl);
      spTreeRoot.appendChild(categoryEl);
    });
  }

  // Minimal HTML escape to prevent XSS
  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Create conversation row element
  function createConversationRow(conv) {
    const row = document.createElement("div");
    row.className = "sp-conv sp-tree-item";

    const link = document.createElement("a");
    const convId = String(conv.id || conv.conversation_id || "");
    link.href = convId ? `/c/${convId}` : "#";

    const titleSpan = document.createElement("span");
    titleSpan.className = "sp-title";
    titleSpan.textContent = conv.title || "(untitled)";

    link.appendChild(titleSpan);
    row.appendChild(link);

    // Add click handler for vault navigation tracking
    link.addEventListener("click", () => {
      try {
        sessionStorage.setItem("sp-vault-nav-active", "true");
        if (convId) {
          sessionStorage.setItem("sp-vault-selected-conv", convId);
        }
      } catch {}
    });

    return row;
  }

  // Update active vault display
  function updateActiveVaultDisplay(payload) {
    try {
      const activeVaultName = payload?.activeVaultName;

      // Update main title display
      const titleEl = document.getElementById("sp-active-vault-name");
      if (titleEl) {
        titleEl.textContent = activeVaultName || "";
        titleEl.style.display = activeVaultName ? "block" : "none";
      }

      // Update shadow DOM display
      const shadowEl = spShadowRoot?.querySelector("#sp-shadow-active-vault");
      if (shadowEl) {
        shadowEl.textContent = activeVaultName || "read-only";
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Active vault display error",
          { error: error.message },
        );
      }
    }
  }

  // ===============================================================================
  // ACTIVE VAULT MONITORING
  // ===============================================================================

  // Handle active vault changes
  function onActiveVaultChanged(newId) {
    if (!getAltViewState()) return;
    if (newId === lastObservedActiveVaultId) return;

    lastObservedActiveVaultId = newId;

    if (isRenderInProgress) {
      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log(
          "📋 Active vault change ignored - render in progress",
        );
      }
      return;
    }

    // Bust cache and re-render
    lastDataKey = "";
    lastDataTimestamp = 0;

    try {
      requestVaultSidebarDataAndRender();
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Vault change render error",
          { error: error.message },
        );
      }
    }
  }

  // Start monitoring active vault changes
  function startActiveVaultWatcher() {
    try {
      stopActiveVaultWatcher();
      lastObservedActiveVaultId = readActiveVaultId();

      // Poll for changes every 5 seconds
      activeVaultWatchTimer = setInterval(() => {
        const cur = readActiveVaultId();
        if (cur !== lastObservedActiveVaultId) {
          onActiveVaultChanged(cur);
        }
      }, 5000);

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("👁️ Active vault watcher started");
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Vault watcher start error",
          { error: error.message },
        );
      }
    }
  }

  // Stop monitoring active vault changes
  function stopActiveVaultWatcher() {
    if (activeVaultWatchTimer) {
      clearInterval(activeVaultWatchTimer);
      activeVaultWatchTimer = null;

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🛑 Active vault watcher stopped");
      }
    }
  }

  // ===============================================================================
  // INITIALIZATION AND CLEANUP
  // ===============================================================================

  // Initialize vault sidebar view
  async function renderVaultSidebarView() {
    devLog("🏦 VAULT: renderVaultSidebarView called");

    if (!getAltViewState()) {
      devLog("❌ VAULT: Alt view state is OFF, aborting");
      return;
    }
    devLog("✅ VAULT: Alt view state is ON, proceeding");

    try {
      const host = ensureShadowContainer();
      if (!host) {
        devLog("⚠️ VAULT: Could not mount vault sidebar - no container");
        return;
      }

      startActiveVaultWatcher();
      requestVaultSidebarDataAndRender();

      devLog("✅ VAULT: Vault sidebar view initialized");
    } catch (error) {
      devError("❌ VAULT: Vault sidebar init error:", error);
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog(
          "error",
          "Vault sidebar init error",
          { error: error.message },
        );
      }
    }
  }

  // Teardown vault sidebar view
  function teardownVaultSidebarView() {
    try {
      stopActiveVaultWatcher();
      cleanupExistingVaultSidebars();
      hideDefaultChatsList(false);

      // Clear cache
      lastDataKey = "";
      lastDataTimestamp = 0;
      lastPayload = null;
      currentSearchQuery = "";
      pendingVaultRerender = false;

      if (window.SuperPromptCoreUtils?.log) {
        window.SuperPromptCoreUtils.log("🧹 Vault sidebar view torn down");
      }
    } catch (error) {
      if (window.SuperPromptCoreUtils?.spPostLog) {
        window.SuperPromptCoreUtils.spPostLog("error", "Vault teardown error", {
          error: error.message,
        });
      }
    }
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                        MODULE EXPORTS                                  ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global namespace for vault integration
  window.SuperPromptVaultIntegration = {
    // Core vault functions
    renderVaultSidebarView,
    teardownVaultSidebarView,
    requestVaultSidebarDataAndRender,

    // Container management
    ensureShadowContainer,
    cleanupExistingVaultSidebars,
    hideDefaultChatsList,

    // Data rendering
    renderTree,
    updateActiveVaultDisplay,

    // Active vault monitoring
    startActiveVaultWatcher,
    stopActiveVaultWatcher,
    onActiveVaultChanged,

    // State getters
    getVaultState: () => ({
      isRenderInProgress,
      pendingVaultRerender,
      lastDataKey,
      lastDataTimestamp,
      currentSearchQuery,
      isVaultEnabled: getAltViewState(),
      activeVaultId: readActiveVaultId(),
      conversationId: getCurrentConversationId(),
    }),

    // Utilities for other modules
    getCurrentConversationId,
    readActiveVaultId,
    getAltViewState,
    isVaultHostAttached,

    // Search functionality
    setSearchQuery: (query) => {
      currentSearchQuery = query || "";
      if (lastPayload) {
        renderTree(lastPayload);
      }
    },

    // Manual triggers
    triggerVaultRefresh: () => {
      lastDataKey = "";
      lastDataTimestamp = 0;
      requestVaultSidebarDataAndRender();
    },

    // Handle pending rerenders
    handlePendingRerender: () => {
      if (pendingVaultRerender) {
        pendingVaultRerender = false;
        requestVaultSidebarDataAndRender();
      }
    },
  };

  // Listen for vault-related messages
  window.addEventListener("message", (e) => {
    const msg = e?.data;

    // DEBUG: Log all messages to see what's coming through
    if (msg && msg.type && msg.type.startsWith && msg.type.startsWith("sp-")) {
      devLog("🔍 [VAULT INTEGRATION] Received message:", msg.type, msg);
    }

    if (!msg || typeof msg !== "object") return;

    if (msg.type === "sp-active-vault-changed") {
      onActiveVaultChanged(String(msg.vaultId || ""));
    }

    if (msg.type === "sp-sidebar-settings-changed") {
      try {
        if (lastPayload) renderTree(lastPayload);
      } catch {}
    }

    // Handle chat category updates (create, edit, delete)
    if (msg.type === "sp-chat-categories-updated") {
      devLog(
        "🔄 [VAULT INTEGRATION] Chat category updated, refreshing vault sidebar...",
        msg,
      );
      // Clear cache and force refresh
      lastDataKey = "";
      lastDataTimestamp = 0;
      requestVaultSidebarDataAndRender();
    }
  });

  // Mark module as available
  window.vaultIntegrationAvailable = true;

  // Expose global refresh function for relay bridge to call directly
  window.triggerVaultSidebarRefresh = function () {
    devLog(
      "🔄 [VAULT INTEGRATION] Direct refresh triggered via global function",
    );
    lastDataKey = "";
    lastDataTimestamp = 0;
    requestVaultSidebarDataAndRender();
  };

  // Only log success in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog(
      "✅ [SP-VaultIntegration] Vault Integration module initialized successfully",
    );
  }

  // 🚀 AUTO-INITIALIZE: Wait for DOM ready and history div, then render vault
  // This replaces the chat-gpt-page-listener's automatic initialization
  function waitForHistoryAndInitialize() {
    const historyDiv = document.getElementById("history");
    const vaultEnabled = getAltViewState();

    devLog("🚀 [VAULT INTEGRATION] Auto-initialization check...");
    devLog("🔍 [VAULT INTEGRATION] History div exists:", !!historyDiv);
    devLog("🔍 [VAULT INTEGRATION] Vault enabled:", vaultEnabled);

    if (historyDiv && vaultEnabled) {
      devLog("✅ [VAULT INTEGRATION] Auto-starting vault sidebar...");
      window.SuperPromptVaultIntegration.renderVaultSidebarView();
    } else if (!historyDiv) {
      // History div not ready yet, try again
      devLog("⏳ [VAULT INTEGRATION] Waiting for #history div...");
      setTimeout(waitForHistoryAndInitialize, 200);
    } else {
      devLog("⏸️ [VAULT INTEGRATION] Vault disabled - waiting for toggle");
    }
  }

  // Start polling after a small delay to let DOM settle
  setTimeout(waitForHistoryAndInitialize, 100);
})();
