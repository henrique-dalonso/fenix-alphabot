/**
 * Debug Subscription Status
 *
 * Run this in the ChatGPT page console to see your subscription data
 */

(async function () {
  console.log("🔍 Checking subscription data...\n");

  // Check localStorage flags
  const forcePro = localStorage.getItem("superprompt_force_pro");
  const debugMode = localStorage.getItem("superprompt_debug_mode");

  console.log("📋 LocalStorage Flags:");
  console.log("   Force Pro:", forcePro);
  console.log("   Debug Mode:", debugMode);
  console.log("");

  // Check chrome.storage.local for user data
  try {
    const data = await chrome.storage.local.get([
      "chatgpt_user_openai_id",
      "chatgpt_user_id",
      "openaiUserId",
      "chatgpt_user_info",
      "superprompt_force_pro",
    ]);

    console.log("💾 Chrome Storage Data:");
    console.log("   OpenAI ID (correct key):", data.chatgpt_user_openai_id);
    console.log("   User ID (alt):", data.chatgpt_user_id);
    console.log("   OpenAI User ID (alt):", data.openaiUserId);
    console.log("   User Info:", data.chatgpt_user_info);
    console.log("   Force Pro Flag:", data.superprompt_force_pro);
    console.log("");

    // If we have an OpenAI ID, try calling the API directly
    const openaiId =
      data.chatgpt_user_openai_id || data.chatgpt_user_id || data.openaiUserId;
    if (openaiId) {
      console.log("🌐 Calling Railway API directly...");
      const API_URL = `https://superprompt-api-production.up.railway.app/api/user/subscription-status/${openaiId}`;

      try {
        const response = await fetch(API_URL);
        const result = await response.json();

        console.log("✅ API Response:");
        console.log("   Status:", response.status);
        console.log("   Data:", result);
        console.log("");

        if (result.subscription) {
          console.log("📊 Subscription Details:");
          console.log("   Plan:", result.subscription.plan);
          console.log("   Status:", result.subscription.status);
          console.log(
            "   Is Pro?",
            result.subscription.plan === "PRO" &&
              (result.subscription.status === "ACTIVE" ||
                result.subscription.status === "INCOMPLETE")
          );
        }
      } catch (apiError) {
        console.error("❌ API Call Failed:", apiError);
      }
    } else {
      console.warn("⚠️  No OpenAI ID found - you may need to refresh ChatGPT");
    }
  } catch (err) {
    console.error("❌ Error checking storage:", err);
  }
})();
