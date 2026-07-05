/**
 * ████████████████████████████████████████████████████████████████████████████
 * ██              INSTRUCTION PROFILE SELECTOR MODULE                       ██
 * ████████████████████████████████████████████████████████████████████████████
 *
 * Manages the instruction profile selector UI on ChatGPT pages.
 * Injects a profile selector above the textarea on new chat pages.
 *
 * Features:
 * - Profile selector dropdown with SuperPrompt styling
 * - Apply/clear instruction profiles via ChatGPT API
 * - Auto-injection on page load and navigation
 * - Free tier limit enforcement (1 profile)
 * - Upgrade to Pro badge for free users
 * - Integration with content script for profile management
 *
 * @module instructionProfileSelector
 * @exports window.SuperPromptInstructionProfileSelector
 */

(function () {
  "use strict";

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  let profileSelectorInjected = false;
  let currentProfile = null;

  // ============================================================================
  // CHATGPT API INTEGRATION
  // ============================================================================

  async function getChatGPTAccessToken() {
    const sessionResponse = await fetch(
      "https://chatgpt.com/api/auth/session",
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!sessionResponse.ok) {
      throw new Error(
        `Failed to get session data: ${sessionResponse.status} ${sessionResponse.statusText}`,
      );
    }

    const sessionData = await sessionResponse.json();
    const accessToken = sessionData.accessToken;
    if (!accessToken) {
      throw new Error("No access token available in session");
    }
    return accessToken;
  }

  function getChatGPTContextHeaders(accessToken, { useBearer = true } = {}) {
    const deviceId =
      window.localStorage.getItem("oai-did")?.replaceAll('"', "") || "";
    const accountCookie = document?.cookie
      ?.split("; ")
      ?.find((c) => c?.startsWith("_account="))
      ?.split("=")?.[1];
    const accountId =
      accountCookie === "personal" ? "default" : accountCookie || "default";

    const headers = {
      "content-type": "application/json",
      "Oai-Language": navigator?.language || "en-US",
      Authorization: useBearer ? `Bearer ${accessToken}` : accessToken,
    };

    if (deviceId) {
      headers["Oai-Device-Id"] = deviceId;
    }

    if (accountId && accountId !== "default") {
      headers["Chatgpt-Account-Id"] = accountId;
    }

    return headers;
  }

  async function patchUserSystemMessages(payload, headers) {
    return await fetch("/backend-api/user_system_messages", {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(payload),
    });
  }

  async function postUserSystemMessagesInit(payload, headers) {
    return await fetch("/backend-api/user_system_messages", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(payload),
    });
  }

  /**
   * Apply an instruction profile to ChatGPT via API
   * Flow:
   * 1. GET to check if user_system_messages exists
   * 2. If not exists: POST to initialize
   * 3. PATCH voice/connector_search settings
   * 4. PATCH personality_type_selection if needed
   * 5. PATCH personality_traits if needed
   * 6. PATCH text fields (custom instructions, about me, etc.)
   */
  async function applyInstructionProfile(profile) {
    if (!profile) {
      return;
    }

    try {
      const accessToken = await getChatGPTAccessToken();

      let headers = getChatGPTContextHeaders(accessToken, { useBearer: true });

      // STEP 1: Check if user_system_messages exists
      const getResponse = await fetch("/backend-api/user_system_messages", {
        method: "GET",
        credentials: "include",
        headers,
      });

      let needsInit = false;
      if (!getResponse.ok || getResponse.status === 404) {
        needsInit = true;
      }

      // STEP 2: Initialize if needed (POST only first time!)
      if (needsInit) {
        const initPayload = {
          object: "user_system_message_detail",
          about_model_message: "",
          about_user_message: "",
          disabled_tools: [],
          enabled: true,
          name_user_message: "",
          other_user_message: "",
          personality_traits: {},
          personality_type_selection: "default",
          role_user_message: "",
          traits_enabled: true,
          traits_model_message: "",
        };

        const initResponse = await postUserSystemMessagesInit(
          initPayload,
          headers,
        );
      }

      const isEnabled = true;

      let disabledTools = Array.isArray(profile.disabledTools)
        ? [...profile.disabledTools]
        : [];

      // STEP 3: PATCH voice and connector_search settings
      const hasVoice = disabledTools.includes("chatgpt_voice");
      const hasConnectorSearch = disabledTools.includes("connector_search");

      if (hasVoice) {
        disabledTools = disabledTools.filter(
          (tool) => tool !== "chatgpt_voice",
        );
        await fetch(
          "/backend-api/settings/account_user_setting?feature=voice_enabled&value=false",
          {
            method: "PATCH",
            credentials: "include",
            headers,
          },
        );
      } else {
        await fetch(
          "/backend-api/settings/account_user_setting?feature=voice_enabled&value=true",
          {
            method: "PATCH",
            credentials: "include",
            headers,
          },
        );
      }

      if (hasConnectorSearch) {
        disabledTools = disabledTools.filter(
          (tool) => tool !== "connector_search",
        );
        await fetch(
          "/backend-api/settings/account_user_setting?feature=connector_search_enabled&value=false",
          {
            method: "PATCH",
            credentials: "include",
            headers,
          },
        );
      } else {
        await fetch(
          "/backend-api/settings/account_user_setting?feature=connector_search_enabled&value=true",
          {
            method: "PATCH",
            credentials: "include",
            headers,
          },
        );
      }

      disabledTools.sort();

      // STEP 4: PATCH personality_type_selection
      // Map UI personality types to API values
      const personalityTypeMap = {
        default: "default",
        professional: "professional",
        friendly: "listener",
        candid: "coach",
        quirky: "creative",
        efficient: "robot",
        nerdy: "nerd",
        cynical: "cynic",
      };

      const uiPersonalityType = profile.personalityType || "default";
      const apiPersonalityType =
        personalityTypeMap[uiPersonalityType] || "default";

      const patchPersonalityResponse = await patchUserSystemMessages(
        {
          conversation_id: null,
          enabled: true,
          message_id: null,
          personality_type_selection: apiPersonalityType,
        },
        headers,
      );

      if (!patchPersonalityResponse.ok) {
        const errorText = await patchPersonalityResponse.text();
        console.warn(
          "⚠️ [SuperPrompt] PATCH personality_type_selection failed:",
          errorText,
        );
      }

      // STEP 5: PATCH personality_traits
      const personalityTraits = {
        warm: "default",
        enthusiastic: "default",
        scannable: "default",
        emoji: "default",
        ...(profile.personalityTraits || {}),
      };

      const patchTraitsResponse = await patchUserSystemMessages(
        {
          conversation_id: null,
          enabled: true,
          message_id: null,
          personality_traits: personalityTraits,
        },
        headers,
      );

      if (!patchTraitsResponse.ok) {
        const errorText = await patchTraitsResponse.text();
        console.warn(
          "⚠️ [SuperPrompt] PATCH personality_traits failed:",
          errorText,
        );
      }

      // STEP 6: PATCH text fields
      const textPayload = {
        about_model_message:
          isEnabled && profile.customInstructions
            ? profile.customInstructions.toString()
            : "",
        traits_model_message:
          isEnabled && profile.customInstructions
            ? profile.customInstructions.toString()
            : "",
        about_user_message:
          isEnabled && profile.aboutMe ? profile.aboutMe.toString() : "",
        name_user_message:
          isEnabled && profile.nickname ? profile.nickname.toString() : "",
        role_user_message:
          isEnabled && profile.occupation ? profile.occupation.toString() : "",
        other_user_message:
          isEnabled && profile.aboutMe ? profile.aboutMe.toString() : "",
        conversation_id: null,
        disabled_tools: disabledTools,
        enabled: true,
        message_id: null,
      };

      let response = await patchUserSystemMessages(textPayload, headers);

      if (response.status === 401 || response.status === 403) {
        console.warn(
          "⚠️ [SuperPrompt] Auth rejected; retrying without Bearer prefix...",
        );
        headers = getChatGPTContextHeaders(accessToken, { useBearer: false });
        response = await patchUserSystemMessages(textPayload, headers);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [SuperPrompt] API error response:", errorText);
        throw new Error(
          `Failed to apply profile: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      currentProfile = profile;

      updateProfileSelectorUI();
    } catch (error) {
      alert(`Failed to apply profile "${profile.name}": ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear the current instruction profile
   * PATCH voice/connector settings and PATCH user_system_messages to empty values
   */
  async function clearInstructionProfile() {
    try {
      const accessToken = await getChatGPTAccessToken();
      let headers = getChatGPTContextHeaders(accessToken, { useBearer: true });

      // STEP 1: PATCH voice and connector_search back to enabled
      await fetch(
        "/backend-api/settings/account_user_setting?feature=voice_enabled&value=true",
        {
          method: "PATCH",
          credentials: "include",
          headers,
        },
      );

      await fetch(
        "/backend-api/settings/account_user_setting?feature=connector_search_enabled&value=true",
        {
          method: "PATCH",
          credentials: "include",
          headers,
        },
      );

      // STEP 2: PATCH all user_system_messages fields to defaults in ONE request
      const payload = {
        about_model_message: "",
        traits_model_message: "",
        about_user_message: "",
        name_user_message: "",
        role_user_message: "",
        other_user_message: "",
        conversation_id: null,
        disabled_tools: [],
        enabled: true,
        message_id: null,
        personality_type_selection: "default",
        personality_traits: {
          warm: "default",
          enthusiastic: "default",
          scannable: "default",
          emoji: "default",
        },
      };

      let response = await patchUserSystemMessages(payload, headers);

      if (response.status === 401 || response.status === 403) {
        console.warn(
          "⚠️ [SuperPrompt] Auth rejected; retrying without Bearer prefix...",
        );
        headers = getChatGPTContextHeaders(accessToken, { useBearer: false });
        response = await patchUserSystemMessages(payload, headers);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to clear profile: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      currentProfile = null;

      // Update selector UI
      updateProfileSelectorUI();
    } catch (error) {
      throw error;
    }
  }

  // ============================================================================
  // UI MANAGEMENT
  // ============================================================================

  /**
   * Update the profile selector button text
   */
  function updateProfileSelectorUI() {
    const selectorButton = document.getElementById(
      "sp-instruction-profile-selector-button",
    );
    if (selectorButton) {
      selectorButton.textContent = currentProfile
        ? currentProfile.name
        : "Select a profile";
    }
  }

  /**
   * Inject the profile selector above the textarea
   */
  function injectProfileSelector() {
    // Declare variables at function scope to avoid ReferenceError
    let selectorWrapper = null;
    let selectorButton = null;
    let dropdown = null;

    try {
      // ⚠️ EARLY EXIT: If selector already exists, don't re-inject
      const existingSelector = document.getElementById(
        "sp-instruction-profile-selector",
      );
      if (existingSelector && profileSelectorInjected) {
        console.log(
          "ℹ️ [SuperPrompt] Profile selector already exists, skipping re-injection",
        );
        return;
      }

      // ⚠️ IMPORTANT: Only show on NEW CHAT pages (no conversation ID in URL)
      // Don't show on existing conversations
      const hasConversationId = /\/c\/[a-f0-9-]+/.test(
        window.location.pathname,
      );
      if (hasConversationId) {
        console.log(
          "🚫 [SuperPrompt] Skipping profile selector - existing conversation detected",
        );
        return;
      }

      // Find the main form element - try multiple selectors
      const form =
        document.querySelector("main form") ||
        document.querySelector('form[class*="stretch"]') ||
        document.querySelector('form[class*="flex"]');

      if (!form) {
        return;
      }

      // Create selector wrapper
      selectorWrapper = document.createElement("div");
      selectorWrapper.id = "sp-instruction-profile-selector";
      selectorWrapper.style.cssText = `
      position: absolute;
      top: -44px;
      right: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 8px;
      `;

      // Create selector button with SuperPrompt styling
      selectorButton = document.createElement("button");
      selectorButton.id = "sp-instruction-profile-selector-button";
      selectorButton.type = "button";
      selectorButton.innerHTML = currentProfile
        ? `<span class="truncate" style="max-width:200px;">${currentProfile.name}</span>`
        : "<span>Custom instruction profiles</span>";
      selectorButton.style.cssText = `
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid rgba(102, 204, 255, 0.35);
      border-radius: 8px;
      background: #1b1b25;
      color: #e5e5e5;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    `;

      // Add hover effect
      selectorButton.addEventListener("mouseenter", () => {
        selectorButton.style.background = "#252530";
        selectorButton.style.borderColor = "rgba(102, 204, 255, 0.5)";
        selectorButton.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
      });
      selectorButton.addEventListener("mouseleave", () => {
        selectorButton.style.background = "#1b1b25";
        selectorButton.style.borderColor = "rgba(102, 204, 255, 0.35)";
        selectorButton.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
      });

      // Create dropdown menu with SuperPrompt styling (opens upward)
      dropdown = document.createElement("div");
      dropdown.id = "sp-instruction-profile-dropdown";
      dropdown.style.cssText = `
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 8px;
      min-width: 280px;
      max-height: 400px;
      overflow-y: auto;
      background: #1b1b25;
      border: 1px solid rgba(102, 204, 255, 0.35);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 1000;
    `;

      selectorWrapper.appendChild(selectorButton);
      selectorWrapper.appendChild(dropdown);

      // Toggle dropdown on button click - INSIDE try block!
      selectorButton.addEventListener("click", async (e) => {
        try {
          e.preventDefault();
          e.stopPropagation();

          console.log("🔽 [SuperPrompt] Profile selector button clicked");

          // Request profiles from content script
          window.postMessage(
            {
              type: "sp-request-instruction-profiles",
              source: "instructionProfileSelector",
            },
            "*",
          );

          console.log(
            "📤 [SuperPrompt] Sent sp-request-instruction-profiles message",
          );

          // Toggle dropdown
          const isVisible = dropdown.style.display === "block";
          dropdown.style.display = isVisible ? "none" : "block";
          console.log(
            "🔽 [SuperPrompt] Dropdown visibility:",
            dropdown.style.display,
          );
        } catch (err) {
          console.error("❌ [SuperPrompt] Error in button click:", err);
        }
      });

      // Close dropdown when clicking outside - INSIDE try block!
      document.addEventListener("click", (e) => {
        try {
          if (
            !selectorWrapper.contains(e.target) &&
            dropdown &&
            dropdown.style &&
            dropdown.style.display === "block"
          ) {
            dropdown.style.display = "none";
          }
        } catch (err) {
          console.error("❌ [SuperPrompt] Error in document click:", err);
        }
      });

      // Position form and inject
      if (!form.style.position || form.style.position === "static") {
        form.style.position = "relative";
      }
      form.style.marginTop = "20px";
      form.appendChild(selectorWrapper);

      profileSelectorInjected = true;
      console.log("✅ [SuperPrompt] Profile selector injected successfully!");
    } catch (error) {
      console.error(
        "❌ [SuperPrompt] CRITICAL ERROR in injectProfileSelector:",
        error,
      );
      console.error("❌ [SuperPrompt] Stack trace:", error.stack);
      // Reset injection flag so it can retry
      profileSelectorInjected = false;
    }
  }

  /**
   * Populate the dropdown with profiles
   */
  function populateProfileDropdown(profiles, isProUser = false) {
    const dropdown = document.getElementById("sp-instruction-profile-dropdown");
    if (!dropdown) {
      console.warn("⚠️ [SuperPrompt] Dropdown element not found");
      return;
    }

    console.log("📋 [SuperPrompt] Populating dropdown with profiles:", {
      profileCount: profiles?.length || 0,
      isProUser,
      profiles: profiles?.map((p) => p.name) || [],
    });

    dropdown.innerHTML = "";

    const FREE_USER_LIMIT = 1;

    // 🧪 TEST MODE: Force FREE user behavior (set to true to test upgrade badge)
    const FORCE_FREE_MODE = false;
    const effectiveIsProUser = FORCE_FREE_MODE ? false : isProUser;

    if (!profiles || profiles.length === 0) {
      const emptyItem = document.createElement("div");
      emptyItem.textContent = "No profiles available";
      emptyItem.style.cssText = `
        padding: 12px 16px;
        font-size: 13px;
        color: #9ca3af;
      `;
      dropdown.appendChild(emptyItem);
    } else {
      // Show profiles (limited for FREE users)
      profiles.forEach((profile, index) => {
        // For FREE users, only show first profile
        // For PRO users, show all
        const shouldShow = effectiveIsProUser || index < FREE_USER_LIMIT;

        if (!shouldShow) {
          return; // Skip this profile
        }

        const item = document.createElement("button");
        item.type = "button";
        item.textContent = profile.name;
        item.style.cssText = `
          width: 100%;
          padding: 10px 16px;
          font-size: 13px;
          text-align: left;
          border: none;
          background: transparent;
          color: #e5e5e5;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        `;

        // Add enabled badge
        if (profile.enabled) {
          const badge = document.createElement("span");
          badge.textContent = "enabled";
          badge.style.cssText = `
            padding: 2px 6px;
            font-size: 10px;
            border-radius: 4px;
            background: rgba(102, 204, 255, 0.9);
            color: #ffffff;
            font-weight: 600;
          `;
          item.appendChild(badge);
        }

        item.addEventListener("mouseenter", () => {
          item.style.background = "rgba(102, 204, 255, 0.15)";
        });

        item.addEventListener("mouseleave", () => {
          item.style.background = "transparent";
        });

        item.addEventListener("click", async (e) => {
          try {
            e.preventDefault();
            e.stopPropagation();

            // Check if this profile is already enabled
            if (profile.enabled) {
              // DISABLE the profile (clear back to defaults)
              console.log(
                "🔄 [SuperPrompt] Disabling enabled profile:",
                profile.name,
              );

              try {
                await clearInstructionProfile();

                // Notify content script to update enabled state (clear all profiles)
                window.postMessage(
                  {
                    type: "sp-profile-cleared",
                    source: "instructionProfileSelector",
                  },
                  "*",
                );

                // Close dropdown
                if (dropdown && dropdown.style) {
                  dropdown.style.display = "none";
                }
              } catch (error) {
                console.error(
                  "❌ [SuperPrompt] Profile clearing failed:",
                  error,
                );
              }
            } else {
              // ENABLE the profile
              try {
                await applyInstructionProfile(profile);

                // Notify content script to update enabled state
                window.postMessage(
                  {
                    type: "sp-profile-applied",
                    profileId: profile.id,
                    source: "instructionProfileSelector",
                  },
                  "*",
                );

                // Close dropdown
                if (dropdown && dropdown.style) {
                  dropdown.style.display = "none";
                }
              } catch (error) {
                console.error(
                  "❌ [SuperPrompt] Profile application failed:",
                  error,
                );
                // Don't re-throw - we already alerted the user in applyInstructionProfile
              }
            }
          } catch (error) {
            console.error(
              "❌ [SuperPrompt] CRITICAL: Click handler error:",
              error,
            );
            console.error("Failed to handle profile click:", error);
          }
        });

        dropdown.appendChild(item);
      });

      // Show "Upgrade to Pro" badge if FREE user has reached/exceeded limit
      if (!effectiveIsProUser && profiles.length >= FREE_USER_LIMIT) {
        const upgradeItem = document.createElement("button");
        upgradeItem.type = "button";
        upgradeItem.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px; flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          <span style="font-weight: 600; font-size: 13px;">Upgrade to Pro</span>
          <span style="font-size: 11px; opacity: 0.85; margin-left: auto;">See all profiles</span>
        `;
        upgradeItem.style.cssText = `
          width: calc(100% - 16px);
          padding: 10px 12px;
          margin: 6px 8px;
          font-size: 13px;
          text-align: left;
          border: none;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1b1b25;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
          box-sizing: border-box;
          overflow: hidden;
        `;

        upgradeItem.addEventListener("mouseenter", () => {
          upgradeItem.style.transform = "scale(1.02)";
          upgradeItem.style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.4)";
        });

        upgradeItem.addEventListener("mouseleave", () => {
          upgradeItem.style.transform = "scale(1)";
          upgradeItem.style.boxShadow = "0 2px 8px rgba(251, 191, 36, 0.3)";
        });

        upgradeItem.addEventListener("click", (e) => {
          try {
            e.preventDefault();
            e.stopPropagation();

            // Send message to content script to show upgrade modal
            window.postMessage(
              {
                type: "sp-show-upgrade-modal",
                context: "instruction-profiles-limit",
                blockedFeature: "Instruction Profiles",
                source: "instructionProfileSelector",
              },
              "*",
            );

            if (dropdown && dropdown.style) {
              dropdown.style.display = "none";
            }
          } catch (error) {
            console.error(
              "❌ [SuperPrompt] Error opening upgrade modal:",
              error,
            );
          }
        });

        dropdown.appendChild(upgradeItem);
      }
    }

    // Add separator
    const separator = document.createElement("div");
    separator.style.cssText = `
      height: 1px;
      margin: 8px 0;
      background: rgba(102, 204, 255, 0.2);
    `;
    dropdown.appendChild(separator);

    // Add "Manage profiles" button with + icon
    const manageButton = document.createElement("button");
    manageButton.type = "button";
    manageButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      <span>Manage profiles</span>
    `;
    manageButton.style.cssText = `
      width: 100%;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      text-align: left;
      border: none;
      background: transparent;
      color: rgba(102, 204, 255, 0.9);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    manageButton.addEventListener("mouseenter", () => {
      manageButton.style.background = "rgba(102, 204, 255, 0.15)";
      manageButton.style.color = "rgba(102, 204, 255, 1)";
    });

    manageButton.addEventListener("mouseleave", () => {
      manageButton.style.background = "transparent";
      manageButton.style.color = "rgba(102, 204, 255, 0.9)";
    });

    manageButton.addEventListener("click", (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();

        // Request content script to open instruction profiles manager
        window.postMessage(
          {
            type: "sp-open-instruction-profiles-manager",
            source: "instructionProfileSelector",
          },
          "*",
        );

        // Close dropdown
        if (dropdown && dropdown.style) {
          dropdown.style.display = "none";
        }
      } catch (error) {
        console.error("❌ [SuperPrompt] Error opening manager:", error);
      }
    });

    dropdown.appendChild(manageButton);
  }

  // ============================================================================
  // INITIALIZATION & NAVIGATION
  // ============================================================================

  /**
   * Inject selector on page load and navigation
   */
  function initProfileSelector() {
    try {
      profileSelectorInjected = false;
      // Try multiple times with increasing delays
      setTimeout(() => {
        try {
          injectProfileSelector();
        } catch (err) {
          console.error(
            "❌ [SuperPrompt] Error in first injection attempt:",
            err,
          );
        }
      }, 500);
      setTimeout(() => {
        try {
          injectProfileSelector();
        } catch (err) {
          console.error(
            "❌ [SuperPrompt] Error in second injection attempt:",
            err,
          );
        }
      }, 1500);
      setTimeout(() => {
        try {
          injectProfileSelector();
        } catch (err) {
          console.error(
            "❌ [SuperPrompt] Error in third injection attempt:",
            err,
          );
        }
      }, 3000);
    } catch (error) {
      console.error(
        "❌ [SuperPrompt] Critical error in initProfileSelector:",
        error,
      );
    }
  }

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  // Listen for messages from content script
  window.addEventListener("message", async (event) => {
    if (event.data?.type === "sp-instruction-profiles-response") {
      console.log(
        "📥 [SuperPrompt] Received sp-instruction-profiles-response:",
        event.data,
      );
      populateProfileDropdown(
        event.data.profiles,
        event.data.isProUser || false,
      );
    } else if (event.data?.type === "sp-apply-instruction-profile") {
      await applyInstructionProfile(event.data.profile);
    } else if (event.data?.type === "sp-clear-instruction-profile") {
      await clearInstructionProfile();
    }
  });

  // ============================================================================
  // AUTO-INITIALIZATION
  // ============================================================================

  // Initialize on load
  try {
    if (document.readyState === "complete") {
      initProfileSelector();
    } else {
      window.addEventListener("load", () => {
        try {
          initProfileSelector();
        } catch (err) {
          console.error("❌ [SuperPrompt] Error in load event:", err);
        }
      });
    }

    // Re-inject on navigation (SPA) and DOM changes
    window.addEventListener("popstate", () => {
      try {
        // Remove existing selector if present
        const existing = document.getElementById(
          "sp-instruction-profile-selector",
        );
        if (existing) {
          existing.remove();
        }
        profileSelectorInjected = false;
        setTimeout(() => {
          try {
            injectProfileSelector();
          } catch (err) {
            console.error("❌ [SuperPrompt] Error re-injecting:", err);
          }
        }, 500);
      } catch (err) {
        console.error("❌ [SuperPrompt] Error in popstate handler:", err);
      }
    });

    // Also watch for URL changes (for SPA navigation without popstate)
    let lastUrl = window.location.href;
    setInterval(() => {
      try {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          lastUrl = currentUrl;

          // Remove existing selector if present
          const existing = document.getElementById(
            "sp-instruction-profile-selector",
          );
          if (existing) {
            existing.remove();
          }

          profileSelectorInjected = false;
          initProfileSelector();
        }
      } catch (err) {
        console.error("❌ [SuperPrompt] Error in URL change detector:", err);
      }
    }, 500);

    // Watch for DOM changes to detect when form appears
    // Debounce to prevent rapid re-injection during dropdown population
    let mutationTimeout = null;
    const formObserver = new MutationObserver(() => {
      try {
        // Clear previous timeout to debounce
        if (mutationTimeout) {
          clearTimeout(mutationTimeout);
        }

        // Wait 200ms before checking (avoids re-injection during dropdown population)
        mutationTimeout = setTimeout(() => {
          if (
            !profileSelectorInjected &&
            !document.getElementById("sp-instruction-profile-selector")
          ) {
            injectProfileSelector();
          }
        }, 200);
      } catch (err) {
        console.error("❌ [SuperPrompt] Error in MutationObserver:", err);
      }
    });

    formObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log(
      "✅ [SuperPrompt] Instruction profile selector module initialized",
    );
  } catch (error) {
    console.error(
      "❌ [SuperPrompt] FATAL ERROR initializing profile selector module:",
      error,
    );
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.SuperPromptInstructionProfileSelector = {
    applyProfile: applyInstructionProfile,
    clearProfile: clearInstructionProfile,
    injectSelector: injectProfileSelector,
    initSelector: initProfileSelector,
    version: "1.0.0",
  };
})();
