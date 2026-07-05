// Captures referral codes on getaiworkspace.com and stores them in chrome.storage
// so the extension can claim referrals after the user registers/logs in.

(() => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get("ref");

    let refFromLocalStorage = null;
    try {
      refFromLocalStorage = window.localStorage
        ? window.localStorage.getItem("aiworkspace_referral_code")
        : null;
    } catch {
      // ignore
    }

    let refFromCookie = null;
    try {
      const cookie = typeof document.cookie === "string" ? document.cookie : "";
      const match = cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("aiworkspace_ref="));
      if (match) {
        refFromCookie = decodeURIComponent(
          match.substring("aiworkspace_ref=".length)
        );
      }
    } catch {
      // ignore
    }

    const referralCode = refFromUrl || refFromLocalStorage || refFromCookie;
    if (!referralCode) return;

    chrome.storage.local.get(
      ["pendingReferralCode", "referralClaimed"],
      (existing) => {
        try {
          if (existing && existing.referralClaimed === true) return;
          if (existing && existing.pendingReferralCode === referralCode) return;

          chrome.storage.local.set({
            pendingReferralCode: referralCode,
            pendingReferralCapturedAt: new Date().toISOString(),
            pendingReferralSourceUrl: window.location.href,
          });
        } catch {
          // ignore
        }
      }
    );
  } catch {
    // ignore
  }
})();
