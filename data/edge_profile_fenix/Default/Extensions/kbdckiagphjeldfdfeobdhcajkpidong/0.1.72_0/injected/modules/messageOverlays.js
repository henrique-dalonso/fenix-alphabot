// ██████████████████████████████████████████████████████████████████████████████
// ██                        SUPERPROMPT MESSAGE OVERLAYS                    ██
// ██                                                                        ██
// ██   Character/word counters and message annotations for ChatGPT          ██
// ██████████████████████████████████████████████████████████████████████████

let overlayDebugEnabled = false;

try {
  const storedDebugPreference = localStorage.getItem("sp-overlay-debug");
  if (storedDebugPreference === "true") {
    overlayDebugEnabled = true;
  } else if (storedDebugPreference === "false") {
    overlayDebugEnabled = false;
  }
} catch (debugPrefError) {
  devWarn(
    "⚠️ [MessageOverlays] Failed to read debug preference, defaulting to verbose logging",
    debugPrefError,
  );
}

function setOverlayDebugEnabled(value) {
  overlayDebugEnabled = Boolean(value);
}

function isOverlayDebugEnabled() {
  return overlayDebugEnabled;
}

function overlayDebugLog(message, context = undefined) {
  if (!overlayDebugEnabled) {
    return;
  }

  const prefix = `🪵 [MessageOverlays] ${message}`;
  const args = typeof context === "undefined" ? [prefix] : [prefix, context];

  if (window.SuperPromptCoreUtils?.log) {
    try {
      window.SuperPromptCoreUtils.log(...args);
    } catch (coreLogError) {
      devWarn(
        "⚠️ [MessageOverlays] Failed to log via SuperPromptCoreUtils:",
        coreLogError,
      );
    }
  }

  console.info(...args);

  if (typeof console.debug === "function") {
    console.debug(...args);
  }
}

const OVERLAY_THEME_STYLES = Object.freeze({
  "dynamic-accent": {
    light: {
      bg: "var(--color-accent-light, rgba(20, 184, 166, 0.1))",
      fg: "var(--color-accent, #0d9488)",
      border: "var(--color-accent, #0d9488)",
      shadow: "0 2px 8px var(--color-accent-shadow, rgba(20, 184, 166, 0.2))",
      accent: "var(--color-accent, #0d9488)",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "var(--color-accent-light, rgba(20, 184, 166, 0.1))",
      fg: "var(--color-accent, #14b8a6)",
      border: "var(--color-accent, #14b8a6)",
      shadow: "0 2px 8px var(--color-accent-shadow, rgba(20, 184, 166, 0.2))",
      accent: "var(--color-accent, #14b8a6)",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "studio-minimal": {
    light: {
      bg: "#FFFFFF",
      fg: "#1D1D1F",
      border: "rgba(0, 0, 0, 0.1)",
      shadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      accent: "#1D1D1F",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "#1C1C1E",
      fg: "#F5F5F7",
      border: "rgba(255, 255, 255, 0.1)",
      shadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      accent: "#F5F5F7",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "creative-professional": {
    light: {
      bg: "#f1f5f9",
      fg: "#0f172a",
      border: "#cbd5e1",
      shadow: "0 2px 4px rgba(0,0,0,0.05)",
      accent: "#334155",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "#1e293b",
      fg: "#f8fafc",
      border: "#334155",
      shadow: "0 2px 4px rgba(0,0,0,0.2)",
      accent: "#60a5fa",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  default: {
    light: {
      bg: "rgba(59, 130, 246, 0.08)",
      fg: "rgba(30, 58, 138, 0.95)",
      border: "rgba(59, 130, 246, 0.55)",
      shadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
      accent: "#3B82F6",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(59, 130, 246, 0.16)",
      fg: "rgba(191, 219, 254, 0.95)",
      border: "rgba(96, 165, 250, 0.65)",
      shadow: "0 2px 8px rgba(59, 130, 246, 0.28)",
      accent: "#60A5FA",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "elegant-gradient": {
    light: {
      bg: "rgba(16, 185, 129, 0.12)",
      fg: "rgba(15, 118, 110, 0.95)",
      border: "rgba(16, 185, 129, 0.45)",
      shadow: "0 2px 10px rgba(16, 185, 129, 0.18)",
      accent: "#10B981",
      position: {
        placement: "outside-bottom",
        offsetY: 14,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(16, 185, 129, 0.22)",
      fg: "rgba(209, 250, 229, 0.95)",
      border: "rgba(45, 212, 191, 0.5)",
      shadow: "0 2px 12px rgba(16, 185, 129, 0.32)",
      accent: "#34D399",
      position: {
        placement: "outside-bottom",
        offsetY: 14,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "minimal-border": {
    light: {
      bg: "linear-gradient(135deg, #D3E9F0 0%, #C8E4ED 50%, #BDDFEA 100%)",
      fg: "#1F2937",
      border: "rgba(93, 179, 209, 0.25)",
      shadow: "0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.05)",
      accent: "#5DB3D1",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "linear-gradient(135deg, #2D5B6B 0%, #2A5565 50%, #274F5F 100%)",
      fg: "#E5F2F7",
      border: "rgba(74, 159, 186, 0.35)",
      shadow: "0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)",
      accent: "#4A9FBA",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "bold-accent": {
    light: {
      bg: "rgba(20, 184, 166, 0.18)",
      fg: "rgba(19, 78, 74, 0.95)",
      border: "rgba(20, 184, 166, 0.55)",
      shadow: "0 2px 12px rgba(20, 184, 166, 0.25)",
      accent: "#14B8A6",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(20, 184, 166, 0.28)",
      fg: "rgba(204, 251, 241, 0.95)",
      border: "rgba(45, 212, 191, 0.6)",
      shadow: "0 2px 16px rgba(20, 184, 166, 0.4)",
      accent: "#2DD4BF",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "neon-glow": {
    light: {
      bg: "rgba(168, 85, 247, 0.14)",
      fg: "rgba(88, 28, 135, 0.95)",
      border: "rgba(168, 85, 247, 0.55)",
      shadow: "0 0 12px rgba(168, 85, 247, 0.28)",
      accent: "#A855F7",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(168, 85, 247, 0.24)",
      fg: "rgba(243, 232, 255, 0.95)",
      border: "rgba(192, 132, 252, 0.65)",
      shadow: "0 0 16px rgba(168, 85, 247, 0.45)",
      accent: "#C084FC",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "neon-night": {
    light: {
      bg: "rgba(236, 72, 153, 0.18)",
      fg: "#EC4899",
      border: "rgba(236, 72, 153, 0.6)",
      shadow: "0 0 15px rgba(236, 72, 153, 0.35)",
      accent: "#EC4899",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(236, 72, 153, 0.28)",
      fg: "#FF6EC7",
      border: "rgba(236, 72, 153, 0.75)",
      shadow:
        "0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)",
      accent: "#FF6EC7",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "soft-shadow": {
    light: {
      bg: "rgba(148, 163, 184, 0.18)",
      fg: "rgba(30, 41, 59, 0.9)",
      border: "rgba(148, 163, 184, 0.45)",
      shadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
      accent: "#64748B",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(51, 65, 85, 0.55)",
      fg: "rgba(226, 232, 240, 0.95)",
      border: "rgba(148, 163, 184, 0.5)",
      shadow: "0 10px 28px rgba(15, 23, 42, 0.35)",
      accent: "#E2E8F0",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "gradient-border": {
    light: {
      bg: "linear-gradient(135deg, rgba(56, 189, 248, 0.14), rgba(168, 85, 247, 0.14))",
      fg: "rgba(15, 23, 42, 0.95)",
      border: "rgba(56, 189, 248, 0.5)",
      shadow: "0 2px 14px rgba(56, 189, 248, 0.28)",
      accent: "#38BDF8",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "linear-gradient(135deg, rgba(17, 94, 89, 0.32), rgba(76, 29, 149, 0.38))",
      fg: "rgba(226, 232, 240, 0.96)",
      border: "rgba(45, 212, 191, 0.7)",
      shadow: "0 2px 20px rgba(13, 148, 136, 0.45)",
      accent: "#34D399",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  neumorphic: {
    light: {
      bg: "rgba(226, 232, 240, 0.9)",
      fg: "rgba(30, 41, 59, 0.9)",
      border: "rgba(148, 163, 184, 0.5)",
      shadow:
        "4px 4px 8px rgba(148, 163, 184, 0.25), -4px -4px 8px rgba(255, 255, 255, 0.9)",
      accent: "#3B82F6",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(45, 58, 75, 0.85)",
      fg: "rgba(226, 232, 240, 0.95)",
      border: "rgba(59, 130, 246, 0.5)",
      shadow:
        "3px 3px 6px rgba(0, 0, 0, 0.4), -3px -3px 6px rgba(71, 85, 105, 0.25)",
      accent: "#60A5FA",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "refined-glass": {
    light: {
      bg: "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.14) 50%, rgba(59, 130, 246, 0.08) 100%)",
      fg: "rgba(15, 23, 42, 0.96)",
      border: "rgba(255, 255, 255, 0.30)",
      shadow:
        "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.40)",
      accent: "#3B82F6",
      backdropFilter: "blur(16px) saturate(180%)",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.06) 50%, rgba(59, 130, 246, 0.10) 100%)",
      fg: "rgba(226, 232, 240, 0.96)",
      border: "rgba(255, 255, 255, 0.18)",
      shadow:
        "0 8px 32px rgba(0, 0, 0, 0.50), 0 2px 8px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
      accent: "#60A5FA",
      backdropFilter: "blur(16px) saturate(180%)",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "aurora-glow": {
    light: {
      bg: "rgba(139, 92, 246, 0.14)",
      fg: "rgba(76, 29, 149, 0.95)",
      border: "rgba(139, 92, 246, 0.45)",
      shadow: "0 4px 20px rgba(139, 92, 246, 0.18)",
      accent: "#8B5CF6",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(139, 92, 246, 0.22)",
      fg: "rgba(237, 233, 254, 0.95)",
      border: "rgba(167, 139, 250, 0.55)",
      shadow: "0 4px 20px rgba(139, 92, 246, 0.28)",
      accent: "#A78BFA",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "material-depth": {
    light: {
      bg: "rgba(59, 130, 246, 0.1)",
      fg: "rgba(30, 64, 175, 0.95)",
      border: "rgba(59, 130, 246, 0.35)",
      shadow:
        "0 2px 4px rgba(59, 130, 246, 0.1), 0 4px 8px rgba(59, 130, 246, 0.1), 0 8px 16px rgba(59, 130, 246, 0.1)",
      accent: "#3B82F6",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(59, 130, 246, 0.18)",
      fg: "rgba(191, 219, 254, 0.95)",
      border: "rgba(96, 165, 250, 0.45)",
      shadow:
        "0 2px 4px rgba(59, 130, 246, 0.15), 0 4px 8px rgba(59, 130, 246, 0.15), 0 8px 16px rgba(59, 130, 246, 0.15)",
      accent: "#60A5FA",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  holographic: {
    light: {
      bg: "rgba(255, 0, 0, 0.08)",
      fg: "rgba(153, 0, 0, 0.95)",
      border: "rgba(255, 0, 0, 0.35)",
      shadow:
        "0 2px 8px rgba(255, 0, 0, 0.15), 0 4px 16px rgba(255, 0, 0, 0.1)",
      accent: "#CC0000",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(255, 0, 0, 0.14)",
      fg: "rgba(255, 204, 203, 0.95)",
      border: "rgba(255, 0, 0, 0.45)",
      shadow:
        "0 2px 10px rgba(255, 0, 0, 0.22), 0 4px 20px rgba(255, 0, 0, 0.14)",
      accent: "#FF6B6B",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  space: {
    light: {
      bg: "linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(168, 85, 247, 0.12) 100%)",
      fg: "rgba(88, 28, 135, 0.95)",
      border: "rgba(168, 85, 247, 0.45)",
      shadow:
        "0 0 16px rgba(168, 85, 247, 0.25), 0 2px 12px rgba(139, 92, 246, 0.2)",
      accent: "#A855F7",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(168, 85, 247, 0.22) 100%)",
      fg: "rgba(233, 213, 255, 0.96)",
      border: "rgba(168, 85, 247, 0.6)",
      shadow:
        "0 0 20px rgba(168, 85, 247, 0.35), 0 4px 16px rgba(139, 92, 246, 0.25)",
      accent: "#C084FC",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "superprompt-elite": {
    light: {
      bg: "rgba(99, 102, 241, 0.14)",
      fg: "rgba(67, 56, 202, 0.95)",
      border: "rgba(99, 102, 241, 0.5)",
      shadow: "0 2px 10px rgba(99, 102, 241, 0.22)",
      accent: "#6366F1",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "rgba(99, 102, 241, 0.24)",
      fg: "rgba(199, 210, 254, 0.95)",
      border: "rgba(129, 140, 248, 0.6)",
      shadow: "0 2px 14px rgba(99, 102, 241, 0.35)",
      accent: "#818CF8",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
  "light-modern": {
    light: {
      bg: "#FAFAFA",
      fg: "#1A1A1A",
      border: "rgba(0, 0, 0, 0.12)",
      shadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
      accent: "#0D6E9B",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
    dark: {
      bg: "#1A1A1A",
      fg: "#FAFAFA",
      border: "rgba(255, 255, 255, 0.12)",
      shadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      accent: "#10A37F",
      position: {
        placement: "outside-bottom",
        offsetY: 12,
        right: 12,
        zIndex: 14,
      },
    },
  },
});

const DEFAULT_STYLE_TYPE = "elegant-gradient";
const seenOverlayThemeWarnings = new Set();
const seenOverlayThemeKeyWarnings = new Set();
const ASSISTANT_MESSAGE_SELECTORS = Object.freeze([
  'article[data-turn="assistant"]',
  'article[data-message-author-role="assistant"]',
  'div[data-message-author-role="assistant"]',
  'div[data-testid^="assistant-turn"]',
  'div[data-testid^="conversation-turn-"][data-message-author-role="assistant"]',
  'div[data-testid^="conversation-turn-"] article[data-message-author-role="assistant"]',
  'article:has([data-message-author-role="assistant"])',
]);

function resolveConversationStyleSettings() {
  let styleType;
  let enabledValue;
  let styleSource = "unknown";

  let domStyleType;
  let moduleStyleType;
  let storageStyleType;

  let enabledFromModule;
  let enabledFromStorage;

  // Prefer DOM attribute for instant same-tab theme switching.
  // ConversationStyling updates this attribute synchronously.
  try {
    const attr = document.documentElement?.getAttribute?.(
      "data-sp-conversation-style",
    );
    if (attr) {
      domStyleType = attr;
      styleType = attr;
      styleSource = "dom-attr";
      overlayDebugLog("Resolved style type from DOM attribute", {
        source: "dom-attr",
        styleType,
      });
    }
  } catch (attrError) {
    devWarn(
      "⚠️ [MessageOverlays] Failed to read data-sp-conversation-style attribute:",
      attrError,
    );
  }

  // Then use the ConversationStyling module (can lag slightly behind DOM attribute).
  try {
    const settings = window.SuperPromptConversationStyling?.getSettings?.();
    if (settings) {
      if (settings.styleType) {
        moduleStyleType = settings.styleType;
      }

      if (!styleType && settings.styleType) {
        styleType = settings.styleType;
        styleSource = "module";
        overlayDebugLog("Resolved style type from module settings", {
          source: "module",
          styleType,
          enabled: settings.enabled,
        });
      }

      if (typeof settings.enabled === "boolean") {
        enabledFromModule = settings.enabled;
      }
    }
  } catch (err) {
    devWarn(
      "⚠️ [MessageOverlays] Failed to read style from ConversationStyling module:",
      err,
    );
  }

  // Always attempt to read localStorage for the enabled flag (and fallback styleType).
  // During same-tab theme switching, the module settings can momentarily lag; storage is often the freshest.
  try {
    const stored = localStorage.getItem("sp-conversation-style");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.styleType) {
        storageStyleType = parsed.state.styleType;
        if (!styleType) {
          styleType = parsed.state.styleType;
          styleSource = "storage";
          overlayDebugLog("Resolved style type from localStorage", {
            source: "storage",
            styleType,
          });
        }
      }
      if (typeof parsed?.state?.enabled === "boolean") {
        enabledFromStorage = parsed.state.enabled;
      }
    }
  } catch (storageError) {
    devWarn(
      "⚠️ [MessageOverlays] Failed to read conversation style from storage:",
      storageError,
    );
  }

  // Resolve enabled flag with a stable precedence.
  // Prefer storage (persisted Zustand state) over module (which may lag briefly).
  if (typeof enabledFromStorage === "boolean") {
    enabledValue = enabledFromStorage;
    overlayDebugLog("Resolved enabled flag from localStorage", {
      source: "storage",
      enabled: enabledValue,
    });
  } else if (typeof enabledFromModule === "boolean") {
    enabledValue = enabledFromModule;
    overlayDebugLog("Resolved enabled flag from module settings", {
      source: "module",
      enabled: enabledValue,
    });
  }

  // Keep a record of where styleType likely came from (for debug only)
  if (styleSource === "unknown") {
    if (domStyleType) {
      styleSource = "dom-attr";
    } else if (moduleStyleType) {
      styleSource = "module";
    } else if (storageStyleType) {
      styleSource = "storage";
    }
  }

  const normalized = String(styleType || DEFAULT_STYLE_TYPE)
    .trim()
    .toLowerCase();

  overlayDebugLog("Normalized conversation style result", {
    requestedStyle: styleType,
    normalized,
    enabled: enabledValue,
  });

  if (
    !OVERLAY_THEME_STYLES[normalized] &&
    !seenOverlayThemeWarnings.has(normalized)
  ) {
    devWarn(
      "⚠️ [MessageOverlays] Unknown conversation style for overlays, using default:",
      normalized,
    );
    seenOverlayThemeWarnings.add(normalized);
  }

  const resolvedStyleType = OVERLAY_THEME_STYLES[normalized]
    ? normalized
    : DEFAULT_STYLE_TYPE;

  overlayDebugLog("resolveConversationStyleSettings → final selection", {
    resolvedStyleType,
    fallbackUsed:
      resolvedStyleType === DEFAULT_STYLE_TYPE &&
      normalized !== DEFAULT_STYLE_TYPE,
    styleSource,
    enabled: enabledValue !== false,
  });

  return {
    styleType: resolvedStyleType,
    enabled: enabledValue !== false,
    styleSource,
    fallbackUsed:
      resolvedStyleType === DEFAULT_STYLE_TYPE &&
      normalized !== DEFAULT_STYLE_TYPE,
  };
}

// Global namespace for message overlay utilities
window.SuperPromptMessageOverlays = {
  // ============================================================================
  // CONSTANTS AND STATE
  // ============================================================================

  MSG_OVERLAY_SETTING_KEY: "sp-show-message-overlays",
  DEBUG_PREFERENCE_KEY: "sp-overlay-debug",
  _debugLogging: isOverlayDebugEnabled(),
  _lastThemeResolution: null,
  _renderedOverlays: new Map(), // Track turnId -> timestamp to prevent duplicates
  _themeRefreshTimer: null,

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  setDebugLogging(value) {
    const normalized = Boolean(value);
    setOverlayDebugEnabled(normalized);
    this._debugLogging = normalized;

    try {
      localStorage.setItem(
        this.DEBUG_PREFERENCE_KEY,
        normalized ? "true" : "false",
      );
    } catch (persistError) {
      devWarn(
        "⚠️ [MessageOverlays] Unable to persist debug logging preference:",
        persistError,
      );
    }
    return this._debugLogging;
  },

  enableDebugLogging() {
    return this.setDebugLogging(true);
  },

  disableDebugLogging() {
    return this.setDebugLogging(false);
  },

  isDebugLoggingEnabled() {
    return this._debugLogging;
  },

  syncDebugLoggingState() {
    try {
      const storedPreference = localStorage.getItem(this.DEBUG_PREFERENCE_KEY);
      if (storedPreference === "true") {
        this.setDebugLogging(true);
      } else if (storedPreference === "false") {
        this.setDebugLogging(false);
      } else {
        this._debugLogging = isOverlayDebugEnabled();
      }
    } catch (syncError) {
      devWarn(
        "⚠️ [MessageOverlays] Failed to sync debug logging preference:",
        syncError,
      );
      this._debugLogging = isOverlayDebugEnabled();
    }
  },

  /**
   * Get overlay display setting from localStorage
   * @returns {boolean} Whether overlays are enabled (default: true)
   */
  getOverlaysSetting() {
    try {
      const val = localStorage.getItem(this.MSG_OVERLAY_SETTING_KEY);
      return val !== "false"; // default true, only false if explicitly set
    } catch {}
    return true;
  },

  /**
   * Set overlay display setting in localStorage
   * @param {boolean} enabled - Whether overlays should be enabled
   */
  setOverlaysSetting(enabled) {
    try {
      localStorage.setItem(
        this.MSG_OVERLAY_SETTING_KEY,
        enabled ? "true" : "false",
      );
      // Refresh all existing overlays
      this.refreshAllOverlays();
    } catch {}
  },

  /**
   * Global toggle function for console/settings
   * @returns {boolean} New state after toggle
   */
  toggleMessageOverlays() {
    const current = this.getOverlaysSetting();
    this.setOverlaysSetting(!current);
    const state = !current ? "enabled" : "disabled";
    devLog(`🎛️ Message overlays ${state}`);
    return !current;
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format character and word counts for display
   * @param {number} chars - Character count
   * @param {number} words - Word count
   * @returns {string} Formatted count string
   */
  formatCounts(chars, words) {
    // Direct labels without i18n prefix to avoid "overlay:" appearing
    return `${chars} chars • ${words} words`;
  },

  /**
   * Format counts with timestamp on single line with accent colors
   * @param {number} chars - Character count
   * @param {number} words - Word count
   * @param {string} timestamp - Optional timestamp
   * @returns {string} HTML formatted string
   */
  formatCountsWithTimestamp(chars, words, timestamp) {
    // Get theme-specific accent color
    const themeStyle = this.getThemeSpecificStyling
      ? this.getThemeSpecificStyling()
      : null;
    const accent = themeStyle
      ? themeStyle.accent
      : window.SuperPromptCoreUtils
        ? window.SuperPromptCoreUtils.getAccentColorFallback()
        : "#3B82F6";
    const timestampStr = timestamp ? this.formatTimestamp(timestamp) : "";

    const spanAttr = 'data-sp-overlay-accent="true"';
    if (timestampStr) {
      return `<span ${spanAttr} style="color: ${accent}; font-weight: 500;">${chars} chars • ${words} words</span> • ${timestampStr}`;
    } else {
      return `<span ${spanAttr} style="color: ${accent}; font-weight: 500;">${chars} chars • ${words} words</span>`;
    }
  },

  /**
   * Format timestamp for display
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted time string
   */
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp * 1000); // Convert to milliseconds
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      // For older messages, show date
      return date.toLocaleDateString();
    } catch (e) {
      return "";
    }
  },

  /**
   * Ensure element has relative positioning for overlay placement
   * @param {HTMLElement} el - Element to check
   */
  ensureRelativePosition(el) {
    if (!el) return;
    const computed = window.getComputedStyle(el);
    if (computed.position === "static") {
      el.style.position = "relative";
    }
  },

  nodeMatchesAssistant(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    try {
      if (node.matches) {
        for (const selector of ASSISTANT_MESSAGE_SELECTORS) {
          if (node.matches(selector)) {
            return true;
          }
        }
      }
    } catch (err) {
      devWarn("⚠️ [MessageOverlays] nodeMatchesAssistant failed:", err);
    }

    if (node.querySelector) {
      for (const selector of ASSISTANT_MESSAGE_SELECTORS) {
        if (node.querySelector(selector)) {
          return true;
        }
      }
    }

    return false;
  },

  collectAssistantArticles({ includeSelectorUsage = false } = {}) {
    const seen = new Set();
    const collected = [];
    const selectorUsage = [];

    for (const selector of ASSISTANT_MESSAGE_SELECTORS) {
      let nodes = [];
      try {
        nodes = Array.from(document.querySelectorAll(selector));
      } catch (err) {
        devWarn(
          "⚠️ [MessageOverlays] Failed selector in collectAssistantArticles:",
          selector,
          err,
        );
        continue;
      }

      if (includeSelectorUsage && nodes.length > 0) {
        selectorUsage.push({ selector, count: nodes.length });
      }

      nodes.forEach((node) => {
        const article = node.closest("article") || node;
        if (!article || seen.has(article)) {
          return;
        }
        seen.add(article);
        collected.push(article);
      });
    }

    collected.sort((a, b) => {
      if (a === b) return 0;
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      return 0;
    });

    return {
      articles: collected,
      selectorUsage,
    };
  },

  scheduleAnnotationRetry(reason) {
    if (!this._annotationRetry) {
      this._annotationRetry = {
        attempts: 0,
        timer: null,
      };
    }

    const retry = this._annotationRetry;
    if (retry.attempts >= 6) {
      overlayDebugLog("scheduleAnnotationRetry aborted", {
        reason,
        attempts: retry.attempts,
      });
      return;
    }

    if (retry.timer) {
      clearTimeout(retry.timer);
      retry.timer = null;
    }

    retry.attempts += 1;
    const delay = Math.min(1500, 200 * retry.attempts);

    overlayDebugLog("scheduleAnnotationRetry", {
      reason,
      attempt: retry.attempts,
      delay,
    });

    retry.timer = setTimeout(() => {
      overlayDebugLog("annotationRetryTimer fired", {
        attempt: retry.attempts,
        reason,
      });
      this.annotateAssistantMessages();
    }, delay);
  },

  clearAnnotationRetry() {
    if (!this._annotationRetry) return;
    if (this._annotationRetry.timer) {
      clearTimeout(this._annotationRetry.timer);
    }
    this._annotationRetry = null;
  },

  // ============================================================================
  // ARTICLE GROUP DETECTION
  // ============================================================================

  /**
   * Find groups of consecutive assistant articles
   * @returns {Array<Array<HTMLElement>>} Array of article groups
   */
  findAssistantArticleGroups() {
    try {
      const { articles, selectorUsage } = this.collectAssistantArticles({
        includeSelectorUsage: true,
      });

      overlayDebugLog("findAssistantArticleGroups → candidate collection", {
        selectorUsage,
        totalArticles: articles.length,
      });

      if (articles.length === 0) {
        return [];
      }

      const groups = [];
      let currentGroup = [];

      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const nextArticle = articles[i + 1];

        currentGroup.push(article);

        if (!nextArticle || !this.areArticlesAdjacent(article, nextArticle)) {
          groups.push([...currentGroup]);
          currentGroup = [];
        }
      }

      overlayDebugLog("findAssistantArticleGroups → grouped", {
        groupCount: groups.length,
        articleCount: articles.length,
      });

      return groups;
    } catch (e) {
      devWarn("Error finding assistant article groups:", e);
      return [];
    }
  },

  /**
   * Check if two articles are visually adjacent (part of same response)
   * @param {HTMLElement} article1 - First article
   * @param {HTMLElement} article2 - Second article
   * @returns {boolean} Whether articles are adjacent
   */
  areArticlesAdjacent(article1, article2) {
    try {
      // Get all siblings between the two articles
      let current = article1.nextElementSibling;
      while (current && current !== article2) {
        // If we encounter a user article, they're not adjacent
        if (
          current.matches('article[data-turn="user"]') ||
          current.matches('article[data-message-author-role="user"]') ||
          current.getAttribute?.("data-message-author-role") === "user" ||
          current.matches(
            'div[data-testid^="conversation-turn-"][data-message-author-role="user"]',
          ) ||
          current.querySelector?.('[data-message-author-role="user"]')
        ) {
          return false;
        }
        current = current.nextElementSibling;
      }
      return current === article2;
    } catch {
      return false;
    }
  },

  // ============================================================================
  // TEXT COUNTING
  // ============================================================================

  /**
   * Compute text counts for a group of articles
   * @param {Array<HTMLElement>} articleGroup - Group of articles to count
   * @returns {Object} Object with chars and words counts
   */
  computeGroupTextCounts(articleGroup) {
    try {
      let totalChars = 0;
      let totalWords = 0;

      for (const article of articleGroup) {
        // Clone to avoid counting our own overlays
        const clone = article.cloneNode(true);
        clone
          .querySelectorAll("#assistant-group-counter, .sp-overlay")
          .forEach((el) => el.remove());

        // Remove screen reader text and hidden content like "ChatGPT said:"
        clone
          .querySelectorAll('.sr-only, [aria-hidden="true"], .visually-hidden')
          .forEach((el) => el.remove());

        // Get visible text content, excluding hidden elements
        const getVisibleText = (element) => {
          let text = "";
          for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const style = window.getComputedStyle(node);
              // Skip hidden elements
              if (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0"
              ) {
                text += this.getVisibleText
                  ? this.getVisibleText(node)
                  : node.textContent;
              }
            }
          }
          return text;
        };

        const text = getVisibleText(clone).trim();
        if (text) {
          totalChars += text.length;
          totalWords += text
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
        }
      }

      return { chars: totalChars, words: totalWords };
    } catch (e) {
      devWarn("Error computing text counts:", e);
      return { chars: 0, words: 0 };
    }
  },

  // ============================================================================
  // TIMESTAMP FUNCTIONALITY
  // ============================================================================

  /**
   * Read chat data from IndexedDB to get message timestamps
   * @param {string} turnId - Turn ID to look up
   * @returns {Promise<number|null>} Unix timestamp or null
   */
  async getChatMessageTimestamp(turnId) {
    try {
      if (!turnId) return null;

      // Wait for StorageManager to be available with timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait

      while (attempts < maxAttempts) {
        if (
          window.SuperPromptStorageManager?.getChatMessageTimestamp &&
          typeof window.SuperPromptStorageManager.getChatMessageTimestamp ===
            "function"
        ) {
          try {
            return await window.SuperPromptStorageManager.getChatMessageTimestamp(
              turnId,
            );
          } catch (error) {
            devWarn("StorageManager timestamp lookup failed:", error);
            break; // Fall back to local implementation
          }
        }

        // Wait 100ms before next attempt
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      // Fallback implementation when StorageManager is not available
      devLog("⚠️ Using fallback timestamp lookup for turnId:", turnId);
      return await this.getFallbackTimestamp(turnId);
    } catch (e) {
      devWarn("Error getting timestamp:", e);
      return null;
    }
  },

  /**
   * Fallback timestamp lookup when StorageManager module is not available
   * @param {string} turnId - The turn ID to look up
   * @returns {Promise<number|null>} Unix timestamp or null if not found
   */
  async getFallbackTimestamp(turnId) {
    try {
      // Get current chat ID from URL
      const urlMatch = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      if (!urlMatch) return null;

      const currentChatId = urlMatch[1];

      return new Promise((resolve) => {
        const request = indexedDB.open("Prompture-chats");

        request.onerror = () => resolve(null);
        request.onsuccess = (event) => {
          const db = event.target.result;

          if (!db.objectStoreNames.contains("chats")) {
            resolve(null);
            return;
          }

          const transaction = db.transaction(["chats"], "readonly");
          const store = transaction.objectStore("chats");
          const getRequest = store.get(currentChatId);

          getRequest.onsuccess = () => {
            const chat = getRequest.result;
            if (!chat?.mapping) {
              resolve(null);
              return;
            }

            const messageData = chat.mapping[turnId];
            if (messageData?.message?.create_time) {
              resolve(messageData.message.create_time);
            } else {
              resolve(null);
            }
          };

          getRequest.onerror = () => resolve(null);
        };
      });
    } catch (error) {
      return null;
    }
  },

  /**
   * @deprecated Legacy fallback method - keeping for compatibility
   */
  async openChatDatabase() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("SuperPromptConversationCache");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  // ============================================================================
  // OVERLAY RENDERING
  // ============================================================================

  /**
   * Get theme-specific styling for overlays based on active conversation style
   * @returns {Object} Object with bg, fg, border, shadow, and accent colors
   */
  getThemeSpecificStyling() {
    // Determine dark mode FIRST (outside try-catch to avoid issues)
    let dark = false;
    try {
      dark = window.SuperPromptCoreUtils
        ? window.SuperPromptCoreUtils.isDarkTheme()
        : document.documentElement.classList.contains("dark");
    } catch (e) {
      dark = document.documentElement.classList.contains("dark");
    }

    try {
      const { styleType, enabled, styleSource, fallbackUsed } =
        resolveConversationStyleSettings();

      const themeKey = enabled ? styleType : "default";
      const themeConfigRaw = OVERLAY_THEME_STYLES[themeKey];
      if (!themeConfigRaw && !seenOverlayThemeKeyWarnings.has(themeKey)) {
        devWarn(
          "⚠️ [MessageOverlays] Unknown overlay theme key, using default:",
          themeKey,
        );
        seenOverlayThemeKeyWarnings.add(themeKey);
      }
      const themeConfig = themeConfigRaw || OVERLAY_THEME_STYLES.default;

      overlayDebugLog("getThemeSpecificStyling → resolved theme", {
        themeKey,
        enabled,
        dark,
      });

      const resolved = dark ? themeConfig.dark : themeConfig.light;

      if (window.SuperPromptMessageOverlays) {
        window.SuperPromptMessageOverlays._lastThemeResolution = {
          themeKey,
          enabled,
          dark,
          resolved,
          styleSource,
          fallbackUsed,
          resolvedAt: Date.now(),
        };
      }

      return resolved;
    } catch (e) {
      devError("❌ [MessageOverlays] CRASH in getThemeSpecificStyling:", e);
      devError("Stack trace:", e.stack);
      // Fallback to default
      const fallbackDark = document.documentElement.classList.contains("dark");
      return fallbackDark
        ? OVERLAY_THEME_STYLES.default.dark
        : OVERLAY_THEME_STYLES.default.light;
    }
  },

  /**
   * Render overlay for a group of articles
   * @param {Array<HTMLElement>} articleGroup - Group of articles to overlay
   */
  renderOverlayForGroup(articleGroup) {
    try {
      if (!this.getOverlaysSetting() || articleGroup.length === 0) return;

      const lastArticle = articleGroup[articleGroup.length - 1];
      const groupId = `assistant-group-counter-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Skip if overlay already exists for this article
      if (lastArticle.querySelector(".sp-overlay")) return;

      // CRITICAL: Only render if message has action buttons (message is complete)
      // Check multiple signals: message-actions div OR Copy/Good buttons
      const preCheckMessageActions = lastArticle.querySelector(
        'div[id^="message-actions"]',
      );
      const preCheckCopyButton = lastArticle.querySelector(
        'button[aria-label*="Copy"]',
      );
      const preCheckGoodButton = lastArticle.querySelector(
        'button[aria-label*="Good"]',
      );
      const hasActionButtons =
        preCheckMessageActions || preCheckCopyButton || preCheckGoodButton;

      if (!hasActionButtons) {
        return;
      }

      const { chars, words } = this.computeGroupTextCounts(articleGroup);
      if (chars === 0 && words === 0) return;

      // Get the turn ID from the last article for timestamp lookup
      const turnId = lastArticle.getAttribute("data-turn-id");

      // Deduplicate: skip if we already rendered this turnId recently (within 2s)
      if (turnId) {
        const lastRender = this._renderedOverlays.get(turnId);
        const now = Date.now();
        if (lastRender && now - lastRender < 2000) {
          devLog(
            `⏭️ [MessageOverlays] Skipping duplicate render for turnId: ${turnId}`,
          );
          return;
        }
        this._renderedOverlays.set(turnId, now);
      }

      const countEl = document.createElement("div");
      countEl.id = groupId;
      countEl.className = "sp-overlay";

      // Get theme-specific styling
      const themeStyle = this.getThemeSpecificStyling();
      const themeReady = this.hasResolvedConversationStyle();

      // Determine overlay positioning strategy from theme metadata
      const positioning = themeStyle.position || {};
      const placement = positioning.placement || "inside-bottom";

      // Find the button row container (the row with Copy, Good response, etc.)
      // CRITICAL: Find the ACTUAL button row that contains action buttons
      let buttonRow = null;

      // Strategy 1: Find Copy button and trace up to find the button row container
      // This is most reliable as Copy button is always present in completed messages
      const copyButton = lastArticle.querySelector(
        'button[aria-label*="Copy"]',
      );
      if (copyButton) {
        devLog("🔍 Found Copy button, searching for button row container...");

        // Walk up the DOM tree to find the flex container with multiple buttons
        let current = copyButton.parentElement;
        let depth = 0;
        while (current && depth < 5) {
          // Check if this container has multiple action buttons as direct children
          const directButtons = Array.from(current.children).filter(
            function (child) {
              return child.tagName === "BUTTON";
            },
          );

          // Check if inside code block (skip these)
          const isInsideCodeBlock =
            current.className &&
            (current.className.includes("bg-token-sidebar-surface-primary") ||
              current.className.includes("bg-token-bg-elevated-secondary"));

          if (directButtons.length >= 2 && !isInsideCodeBlock) {
            buttonRow = current;
            devLog("✅ Found button row container via Copy button", {
              depth: depth,
              buttons: directButtons.length,
              classes: current.className,
            });
            break;
          }

          current = current.parentElement;
          depth++;
        }
      }

      // Strategy 2: Find message-actions div (fallback)
      if (!buttonRow) {
        const messageActionsDiv = lastArticle.querySelector(
          'div[id^="message-actions"]',
        );
        if (messageActionsDiv) {
          buttonRow = messageActionsDiv;
          devLog("✅ Found message-actions div by ID:", messageActionsDiv.id);
        }
      }

      // Strategy 3: Find Good response button and get its parent (another fallback)
      if (!buttonRow) {
        const goodButton = lastArticle.querySelector(
          'button[aria-label*="Good"]',
        );
        if (goodButton) {
          devLog("🔍 Found Good button, searching for button row container...");

          let current = goodButton.parentElement;
          let depth = 0;
          while (current && depth < 5) {
            const directButtons = Array.from(current.children).filter(
              function (child) {
                return child.tagName === "BUTTON";
              },
            );

            const isInsideCodeBlock =
              current.className &&
              (current.className.includes("bg-token-sidebar-surface-primary") ||
                current.className.includes("bg-token-bg-elevated-secondary"));

            if (directButtons.length >= 2 && !isInsideCodeBlock) {
              buttonRow = current;
              devLog("✅ Found button row container via Good button", {
                depth: depth,
                buttons: directButtons.length,
              });
              break;
            }

            current = current.parentElement;
            depth++;
          }
        }
      }

      // If we STILL can't find button row but we know buttons exist, something is wrong
      if (!buttonRow) {
        devLog("⚠️ WARNING: Action buttons exist but button row not found!", {
          hasCopyButton: !!copyButton,
          hasMessageActions: !!preCheckMessageActions,
        });
      }

      // Use button row if available, otherwise article
      const overlayContainer = buttonRow || lastArticle;

      if (buttonRow) {
        // Button row exists - add as flex child, NO positioning needed
        // Just ensure article allows overflow so no scrollbars appear
        lastArticle.style.overflow = "visible";
        devLog("✅ Using button row as overlay container");
      } else {
        // Fallback: position on article (normal for streaming messages or incomplete messages)
        this.ensureRelativePosition(lastArticle);
        devLog(
          "ℹ️ Using article as overlay container (button row not yet available - normal for streaming)",
        );
      }

      devLog("🎨 [MessageOverlays] Rendering overlay", {
        groupId,
        turnId,
        themeReady,
        themeKey: this._lastThemeResolution?.themeKey,
        styleSource: this._lastThemeResolution?.styleSource,
        colors: {
          bg: themeStyle.bg,
          border: themeStyle.border,
        },
      });

      // Position the overlay below and to the right of the article content
      const backdropFilterStyle = themeStyle.backdropFilter
        ? `backdrop-filter:${themeStyle.backdropFilter}; -webkit-backdrop-filter:${themeStyle.backdropFilter};`
        : `backdrop-filter:saturate(1.2) blur(8px); -webkit-backdrop-filter:saturate(1.2) blur(8px);`;

      const offsetY =
        typeof positioning.offsetY === "number"
          ? positioning.offsetY
          : typeof positioning.bottom === "number"
            ? positioning.bottom
            : 8;
      const rightOffset =
        typeof positioning.right === "number" ? positioning.right : 12;
      const zIndexValue =
        typeof positioning.zIndex === "number" ? positioning.zIndex : 10;

      // Style based on container type
      if (buttonRow) {
        // In button row - simple flex item with margin-left
        // Start hidden, will fade in via requestAnimationFrame after paint
        countEl.style.cssText =
          `margin-left:12px; flex-shrink:0; font-size:11px; color:${themeStyle.fg}; user-select:none; pointer-events:none; font-family:Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif;` +
          `background:${themeStyle.bg}; border:1px solid ${themeStyle.border}; border-radius:12px; padding:4px 10px; letter-spacing:.1px; ${backdropFilterStyle} box-shadow:${themeStyle.shadow}; white-space:nowrap; opacity:0; transition:opacity 0.2s ease-in-out;`;
      } else {
        // Fallback: absolute positioning on article
        // HIDDEN (opacity: 0) - this should rarely happen since we wait for message-actions div
        const positionDeclaration = `right:${rightOffset}px; bottom:${offsetY}px;`;
        countEl.style.cssText =
          `position:absolute; ${positionDeclaration} font-size:11px; color:${themeStyle.fg}; user-select:none; pointer-events:none; font-family:Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif;` +
          `background:${themeStyle.bg}; border:1px solid ${themeStyle.border}; border-radius:12px; padding:4px 10px; letter-spacing:.1px; ${backdropFilterStyle} box-shadow:${themeStyle.shadow}; z-index:${zIndexValue}; white-space:nowrap; opacity:0; transition:opacity 0.2s ease-in-out;`;
      }

      // Initially show just the counts
      countEl.innerHTML = this.formatCountsWithTimestamp(chars, words);
      overlayContainer.appendChild(countEl);

      // Fade in overlay using requestAnimationFrame (waits for next paint cycle)
      // This ensures layout is complete before showing overlay - NO MORE FLASH!
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (countEl.parentElement) {
            countEl.style.opacity = "1";
            devLog("✨ Faded in overlay (rAF)");
          }
        });
      });

      // If button row doesn't exist yet, watch for it to appear and re-attach overlay
      if (!buttonRow) {
        devLog("🔍 No button row found initially, setting up watcher...");

        const buttonWatcher = new MutationObserver((mutations) => {
          // CRITICAL: Use same safe strategy as above - NO generic button selector!
          let newButtonRow = null;

          // Strategy 1: Find div with id starting with "message-actions"
          const messageActionsDiv = lastArticle.querySelector(
            'div[id^="message-actions"]',
          );
          if (messageActionsDiv) {
            newButtonRow = messageActionsDiv;
          }

          // Strategy 2: Find Copy button's parent
          if (!newButtonRow) {
            const copyBtn = lastArticle.querySelector(
              'button[aria-label*="Copy"]',
            );
            if (copyBtn) {
              const parent = copyBtn.parentElement;
              // CRITICAL: Skip if inside code block
              const isInsideCodeBlock =
                parent.className.includes("bg-token-sidebar-surface-primary") ||
                parent.className.includes("bg-token-bg-elevated-secondary") ||
                parent.closest(
                  '[class*="bg-token-sidebar-surface-primary"]',
                ) !== null ||
                parent.closest('[class*="bg-token-bg-elevated"]') !== null;

              if (!isInsideCodeBlock) {
                newButtonRow = parent;
              }
            }
          }

          // Strategy 3: Find Good button's parent
          if (!newButtonRow) {
            const goodBtn = lastArticle.querySelector(
              'button[aria-label*="Good"]',
            );
            if (goodBtn) {
              const parent = goodBtn.parentElement;
              // CRITICAL: Skip if inside code block
              const isInsideCodeBlock =
                parent.className.includes("bg-token-sidebar-surface-primary") ||
                parent.className.includes("bg-token-bg-elevated-secondary") ||
                parent.closest(
                  '[class*="bg-token-sidebar-surface-primary"]',
                ) !== null ||
                parent.closest('[class*="bg-token-bg-elevated"]') !== null;

              if (!isInsideCodeBlock) {
                newButtonRow = parent;
              }
            }
          }

          // Strategy 4: Multi-button flex container
          // CRITICAL: Only look AFTER the article content, not inside it
          if (!newButtonRow) {
            const flexContainers = lastArticle.querySelectorAll(
              'div[class*="flex"][class*="items-center"]',
            );
            for (const container of flexContainers) {
              const buttons = container.querySelectorAll("button");
              if (buttons.length >= 2) {
                // CRITICAL: Skip containers related to code blocks
                const hasCodeBlockClass =
                  container.className.includes(
                    "bg-token-sidebar-surface-primary",
                  ) ||
                  container.className.includes(
                    "bg-token-bg-elevated-secondary",
                  ) ||
                  container.closest(
                    '[class*="bg-token-sidebar-surface-primary"]',
                  ) !== null ||
                  container.closest('[class*="bg-token-bg-elevated"]') !== null;

                if (!hasCodeBlockClass) {
                  newButtonRow = container;
                  break;
                }
              }
            }
          }

          if (newButtonRow && countEl.parentElement !== newButtonRow) {
            // Extra check: only move if current parent is NOT already the correct button row
            // Check if current parent IS the button row itself (not just contains buttons)
            const currentParent = countEl.parentElement;

            // Check if current parent has action buttons as DIRECT children (not descendants)
            let currentParentIsButtonRow = false;
            if (currentParent) {
              if (
                currentParent.id &&
                currentParent.id.startsWith("message-actions")
              ) {
                currentParentIsButtonRow = true;
              } else {
                const children = Array.from(currentParent.children);
                for (let i = 0; i < children.length; i++) {
                  const child = children[i];
                  if (child.tagName === "BUTTON") {
                    const ariaLabel = child.getAttribute("aria-label");
                    if (
                      ariaLabel &&
                      (ariaLabel.includes("Copy") || ariaLabel.includes("Good"))
                    ) {
                      currentParentIsButtonRow = true;
                      break;
                    }
                  }
                }
              }
            }

            if (currentParentIsButtonRow) {
              devLog(
                "✅ Overlay already in correct button row, no need to move",
              );
              buttonWatcher.disconnect();
              return;
            }

            devLog("🔄 Button row appeared! Moving overlay", {
              from: countEl.parentElement?.tagName,
              to: newButtonRow.tagName,
              toClasses: newButtonRow.className,
            });

            // Update styling for flex layout (start hidden)
            countEl.style.cssText =
              `margin-left:12px; flex-shrink:0; font-size:11px; color:${themeStyle.fg}; user-select:none; pointer-events:none; font-family:Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif;` +
              `background:${themeStyle.bg}; border:1px solid ${themeStyle.border}; border-radius:12px; padding:4px 10px; letter-spacing:.1px; ${backdropFilterStyle} box-shadow:${themeStyle.shadow}; white-space:nowrap; opacity:0; transition:opacity 0.2s ease-in-out;`;

            // Move to button row
            newButtonRow.appendChild(countEl);
            lastArticle.style.overflow = "visible";

            // Fade in using requestAnimationFrame
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (countEl.parentElement === newButtonRow) {
                  countEl.style.opacity = "1";
                  devLog("✅ Overlay moved to button row and faded in (rAF)");
                }
              });
            });

            // Stop watching
            buttonWatcher.disconnect();
          }
        });

        // Watch for button row appearance with aggressive settings
        buttonWatcher.observe(lastArticle, {
          childList: true,
          subtree: true,
          attributes: false, // Only watch DOM changes, not attribute changes
        });

        // Auto-disconnect after 10 seconds (increased from 5)
        setTimeout(() => {
          buttonWatcher.disconnect();
          devLog("⏱️ Button watcher timed out after 10s");
        }, 10000);
      }

      // Ensure the newly added overlay immediately reflects the latest theme
      this.restyleExistingOverlays();

      // Asynchronously add timestamp if available
      if (turnId) {
        devLog("⏰ Starting timestamp lookup for:", turnId);

        // Check if this overlay already has a timestamp operation pending
        if (countEl._timestampPending) {
          devLog("⏰ Timestamp already pending for this overlay, skipping");
          return;
        }

        countEl._timestampPending = true;

        this.getChatMessageTimestamp(turnId)
          .then((timestamp) => {
            // Check if element still exists in DOM before updating
            if (!countEl.parentElement) {
              devLog("⏰ Overlay removed from DOM before timestamp resolved");
              return;
            }

            devLog("⏰ Timestamp result for", turnId, ":", timestamp);
            if (timestamp) {
              devLog(
                "⏰ Formatted timestamp:",
                this.formatTimestamp(timestamp),
              );
              countEl.innerHTML = this.formatCountsWithTimestamp(
                chars,
                words,
                timestamp,
              );
              countEl._hasTimestamp = true;
            } else {
              devLog("⏰ No timestamp found for", turnId);
            }
          })
          .catch((err) => {
            devWarn("❌ Error getting timestamp for turn:", turnId, err);
          })
          .finally(() => {
            countEl._timestampPending = false;
          });
      } else {
        devLog("⏰ No turnId found for this article");
      }

      // Store reference to group for updates
      lastArticle._spArticleGroup = articleGroup;

      // Debug logging to see if overlay is created
      devLog(
        "✅ Overlay created for group:",
        articleGroup.length,
        "articles",
        this.formatCounts(chars, words),
        "turnId:",
        turnId,
      );
    } catch (e) {
      devWarn("Error rendering overlay for group:", e);
    }
  },

  hasResolvedConversationStyle() {
    let hasAttr = false;
    let hasModuleSettings = false;

    // Check DOM attribute
    try {
      const attr = document.documentElement?.getAttribute?.(
        "data-sp-conversation-style",
      );
      hasAttr = Boolean(attr);
    } catch (attrErr) {
      devWarn(
        "[MessageOverlays] hasResolvedConversationStyle attr check failed",
        attrErr,
      );
    }

    // Check module settings
    try {
      const settings = window.SuperPromptConversationStyling?.getSettings?.();
      hasModuleSettings = Boolean(settings?.styleType);
    } catch (settingsErr) {
      devWarn(
        "[MessageOverlays] hasResolvedConversationStyle getSettings failed",
        settingsErr,
      );
    }

    // Consider theme "ready" if EITHER source exists.
    // During same-tab theme switching, one can lag briefly.
    if (!hasAttr && !hasModuleSettings) {
      devLog("❌ [MessageOverlays] Theme NOT ready", {
        hasAttr,
        hasModuleSettings,
      });
      return false;
    }

    // Additionally verify _lastThemeResolution is valid
    const last = this._lastThemeResolution;
    if (!last) {
      devLog("❌ [MessageOverlays] No last resolution");
      return false;
    }

    if (last.fallbackUsed && last.styleSource === "unknown") {
      devLog("❌ [MessageOverlays] Fallback used", {
        fallbackUsed: last.fallbackUsed,
        styleSource: last.styleSource,
      });
      return false;
    }

    if (!last.resolved) {
      devLog("❌ [MessageOverlays] No resolved styles");
      return false;
    }

    devLog("✅ [MessageOverlays] Theme READY", {
      hasAttr,
      hasModuleSettings,
      styleSource: last.styleSource,
      themeKey: last.themeKey,
    });

    return true;
  },

  restyleExistingOverlays() {
    try {
      // CRITICAL: Always fetch the latest theme styling to ensure fresh colors
      const resolved = this.getThemeSpecificStyling();
      if (!resolved) {
        return;
      }

      document.querySelectorAll(".sp-overlay").forEach((overlayEl) => {
        overlayEl.style.background = resolved.bg;
        overlayEl.style.color = resolved.fg;
        overlayEl.style.borderColor = resolved.border;
        overlayEl.style.boxShadow = resolved.shadow;
        overlayEl.dataset.spOverlayAccent = resolved.accent;

        const accentTargets = overlayEl.querySelectorAll(
          '[data-sp-overlay-accent="true"]',
        );
        if (accentTargets.length > 0) {
          accentTargets.forEach((span) => {
            span.style.color = resolved.accent;
            span.style.fontWeight = "500";
          });
        } else {
          const fallbackSpan = overlayEl.querySelector("span");
          if (fallbackSpan) {
            fallbackSpan.style.color = resolved.accent;
            fallbackSpan.style.fontWeight = "500";
          }
        }

        // Apply backdrop-filter for glass morphism themes
        if (resolved.backdropFilter) {
          overlayEl.style.backdropFilter = resolved.backdropFilter;
          overlayEl.style.webkitBackdropFilter = resolved.backdropFilter;
        } else {
          overlayEl.style.backdropFilter = "";
          overlayEl.style.webkitBackdropFilter = "";
        }

        // CRITICAL: Only make overlay visible if it's in the correct position (button row)
        // Check if parent has message-actions id or contains action buttons
        const parent = overlayEl.parentElement;
        const isInButtonRow =
          parent &&
          (parent.id?.startsWith("message-actions") ||
            parent.querySelector('button[aria-label*="Copy"]') ||
            parent.querySelector('button[aria-label*="Good"]'));

        if (this.hasResolvedConversationStyle() && isInButtonRow) {
          overlayEl.style.opacity = "1";
        }
        // If not in button row yet, keep opacity as-is (likely 0)
      });

      // Apply any theme-specific container tweaks (e.g., scrollbar fixes)
      this.fixNeonGlowScrollbars();
    } catch (err) {
      devWarn("[MessageOverlays] Failed to restyle existing overlays", err);
    }
  },

  /**
   * Reduce spurious scrollbars for themes with large glows (e.g., neon-glow)
   * Only applies minimal non-destructive styles when that theme is active.
   */
  fixNeonGlowScrollbars() {
    try {
      const themeKey = this._lastThemeResolution?.themeKey;

      // Neon-glow now handles overflow in the theme CSS itself
      // This function is kept for potential future theme-specific tweaks

      // Avoid page-level horizontal scrollbar
      if (themeKey === "neon-glow") {
        const main = document.querySelector("main");
        if (main && main.style) {
          main.style.overflowX = "hidden";
        }
      }
    } catch (e) {
      // Non-fatal; best-effort visual tweak
    }
  },

  // ============================================================================
  // MAIN OVERLAY FUNCTIONS
  // ============================================================================

  /**
   * Remove all existing overlays and re-create them
   */
  refreshAllOverlays() {
    try {
      const themeSnapshot = resolveConversationStyleSettings();
      let isDark = false;
      try {
        isDark = window.SuperPromptCoreUtils
          ? window.SuperPromptCoreUtils.isDarkTheme()
          : document.documentElement.classList.contains("dark");
      } catch {
        isDark = document.documentElement.classList.contains("dark");
      }

      overlayDebugLog("refreshAllOverlays invoked", {
        themeSnapshot,
        isDark,
        overlayCount: document.querySelectorAll(".sp-overlay").length,
      });

      // Clear render tracking to allow fresh renders
      this._renderedOverlays.clear();

      // Apply the latest theme styling to any overlays still on-screen before refresh
      const previewStyle = this.getThemeSpecificStyling();
      overlayDebugLog("refreshAllOverlays → preview style", {
        previewStyle,
      });
      this.restyleExistingOverlays();

      // DON'T remove all overlays - let annotateAssistantMessages handle it incrementally
      // This prevents flickering when timestamps are being async loaded

      // Re-annotate if enabled
      if (this.getOverlaysSetting()) {
        overlayDebugLog("refreshAllOverlays → annotateAssistantMessages", {
          enabled: true,
        });
        this.annotateAssistantMessages();
      } else {
        overlayDebugLog("refreshAllOverlays skipped annotate", {
          enabled: false,
        });
        // Only remove overlays if feature is disabled
        document
          .querySelectorAll("#message-char-word-counter, .sp-overlay")
          .forEach((el) => el.remove());
      }
    } catch (e) {
      devWarn("Error refreshing overlays:", e);
    }
  },

  /**
   * Find and annotate all assistant messages with overlays
   */
  annotateAssistantMessages() {
    try {
      if (!this.getOverlaysSetting()) {
        return;
      }

      overlayDebugLog("annotateAssistantMessages → start", {
        existingOverlays: document.querySelectorAll(".sp-overlay").length,
      });

      // DON'T remove all overlays - instead, only add missing ones
      // This prevents flickering of timestamps that are being async loaded

      // Find and process article groups
      const groups = this.findAssistantArticleGroups();

      overlayDebugLog("annotateAssistantMessages → groups detected", {
        groupCount: groups.length,
      });

      if (groups.length === 0) {
        this.scheduleAnnotationRetry("no-assistant-groups");
        return;
      }

      this.clearAnnotationRetry();

      // CRITICAL: Only render overlays for COMPLETE messages (with message-actions div)
      // This prevents rendering overlays during streaming when refreshing all overlays
      const completeGroups = groups.filter((group) => {
        const lastArticle = group[group.length - 1];

        // Check multiple signals that message is complete (not just message-actions div)
        const hasMessageActions = !!lastArticle.querySelector(
          'div[id^="message-actions"]',
        );
        const hasCopyButton = !!lastArticle.querySelector(
          'button[aria-label*="Copy"]',
        );
        const hasGoodButton = !!lastArticle.querySelector(
          'button[aria-label*="Good"]',
        );
        const hasActionButtons = hasCopyButton || hasGoodButton;

        // Message is complete if it has action buttons OR message-actions div
        const isComplete = hasMessageActions || hasActionButtons;

        if (!isComplete) {
          devLog(
            "⏭️ Skipping incomplete group (no action buttons)",
            lastArticle,
          );
        }
        return isComplete;
      });

      devLog(
        `🎨 Rendering overlays for ${completeGroups.length}/${groups.length} complete groups`,
      );

      completeGroups.forEach((group, index) => {
        // Check if this group already has an overlay
        const lastArticle = group[group.length - 1];
        const existingOverlay = lastArticle.querySelector(".sp-overlay");

        if (existingOverlay) {
          devLog("⏭️ Group already has overlay, skipping", lastArticle);
          return;
        }

        this.renderOverlayForGroup(group);
      });

      // Re-apply the active theme once all overlays are in place
      this.getThemeSpecificStyling();
      this.restyleExistingOverlays();

      // Use SuperPromptCoreUtils for logging if available
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          `🧩 Processed ${groups.length} assistant article groups`,
        );
      } else {
        devLog(`🧩 Processed ${groups.length} assistant article groups`);
      }
    } catch (e) {
      devWarn("Error annotating assistant messages:", e);
    }
  },

  // ============================================================================
  // INITIALIZATION AND MONITORING
  // ============================================================================

  /**
   * Initialize assistant message overlays with safe mutation observer
   */
  initAssistantMessageOverlaysSafe() {
    try {
      // Only initialize if not already done
      if (window._spMsgOverlayInitialized) return;
      window._spMsgOverlayInitialized = true;

      devLog(
        "🧩 [MessageOverlays] Observer initialized, watching for message-actions divs",
      );

      // Track which articles we've already processed to avoid duplicates
      const processedArticles = new WeakSet();

      // Observer that ONLY acts when message-actions divs appear
      // No throttle needed - message-actions div appearance is a one-time definitive event
      // Optimized: early exits to minimize performance impact
      const obs = new MutationObserver((mutations) => {
        // DEVTOOLS PERFORMANCE FIX: Skip observer processing when DevTools is open
        // This prevents extreme lag during inspect element usage in Sources tab
        if (window._spDevToolsOpen) return;

        let messageActionsDivAppeared = false;
        let targetArticle = null;

        // Quick scan: only process if we see DIV additions (message-actions is always a DIV)
        const hasDivAdditions = mutations.some((m) =>
          Array.from(m.addedNodes).some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.tagName === "DIV" || node.querySelector),
          ),
        );
        if (!hasDivAdditions) return; // Early exit - no DIVs added

        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node;

            // Skip our own overlay elements completely
            if (
              el.id?.startsWith("assistant-group-counter") ||
              el.classList?.contains("sp-overlay") ||
              el.closest(".sp-overlay")
            ) {
              continue;
            }

            // CHECK 1: Is this a message-actions div?
            if (el.tagName === "DIV" && el.id?.startsWith("message-actions")) {
              messageActionsDivAppeared = true;
              // Find the parent article
              targetArticle =
                el.closest('article[data-message-author-role="assistant"]') ||
                el.closest('article[data-turn="assistant"]') ||
                el.closest('div[data-testid^="conversation-turn-"]');

              devLog(
                "✅ [MessageOverlays] message-actions div appeared!",
                el.id,
              );
              break;
            }

            // CHECK 2: Does this element CONTAIN a message-actions div?
            // Only check if element has children (querySelector is expensive)
            if (el.children && el.children.length > 0) {
              const messageActionsChild = el.querySelector(
                'div[id^="message-actions"]',
              );
              if (messageActionsChild) {
                messageActionsDivAppeared = true;
                targetArticle =
                  el.closest('article[data-message-author-role="assistant"]') ||
                  el.closest('article[data-turn="assistant"]') ||
                  el.closest('div[data-testid^="conversation-turn-"]') ||
                  (el.tagName === "ARTICLE" ? el : null);

                devLog(
                  "✅ [MessageOverlays] Element with message-actions child appeared!",
                  messageActionsChild.id,
                );
                break;
              }
            }
          }
          if (messageActionsDivAppeared) break;
        }

        // Only render overlay if message-actions div appeared AND we haven't processed this article yet
        if (
          messageActionsDivAppeared &&
          targetArticle &&
          !processedArticles.has(targetArticle)
        ) {
          processedArticles.add(targetArticle);

          devLog(
            "🎯 [MessageOverlays] New complete assistant message detected, rendering overlay for THIS article only",
          );

          // Minimal delay (50ms) to ensure DOM is fully settled
          // Since we're triggered by message-actions div appearance, DOM is already stable
          setTimeout(() => {
            // CRITICAL: Render overlay for THIS specific article only, not all articles!
            // Check if this article is part of a group
            const lastArticle = targetArticle;

            // Skip if overlay already exists for this article
            if (lastArticle.querySelector(".sp-overlay")) {
              devLog(
                "⏭️ [MessageOverlays] Overlay already exists for this article, skipping",
              );
              return;
            }

            // Find the group this article belongs to
            const groups = this.findAssistantArticleGroups();
            const targetGroup = groups.find((group) =>
              group.includes(lastArticle),
            );

            if (targetGroup) {
              devLog(
                "🎨 [MessageOverlays] Rendering overlay for specific article group",
              );
              this.renderOverlayForGroup(targetGroup);
            } else {
              devLog(
                "⚠️ [MessageOverlays] Could not find group for article, rendering as single",
              );
              this.renderOverlayForGroup([lastArticle]);
            }
          }, 50); // 50ms delay to ensure DOM is fully settled
        }
      });

      // Watch the presentation div specifically
      const presentationDiv = document.querySelector(
        'div[role="presentation"]',
      );
      if (presentationDiv) {
        obs.observe(presentationDiv, { childList: true, subtree: true });
      } else {
        // Fallback to body if presentation div not found yet
        obs.observe(document.body, { childList: true, subtree: true });
      }

      window._spMsgOverlayGlobalObs = obs;

      // Log which container we're watching
      if (presentationDiv) {
        devLog(
          "👀 [MessageOverlays] Watching presentation div for message-actions divs",
        );
      } else {
        devLog(
          "👀 [MessageOverlays] Watching body for message-actions divs (presentation div not found)",
        );
      }

      // Use SuperPromptCoreUtils for logging if available
      if (window.SuperPromptCoreUtils) {
        window.SuperPromptCoreUtils.log(
          "🧩 Assistant message overlay system initialized (message-actions-driven mode)",
        );
      } else {
        devLog(
          "🧩 Assistant message overlay system initialized (message-actions-driven mode)",
        );
      }
    } catch (e) {
      devError("❌ Safe assistant article group overlays failed to init", e);
    }
  },

  /**
   * Test overlay system manually (debug function)
   */
  testOverlays() {
    devLog("🧪 Testing SuperPrompt overlay system...");
    devLog("🔧 Overlays setting:", this.getOverlaysSetting());
    this.annotateAssistantMessages();
  },

  /**
   * Start periodic overlay checking
   */
  startPeriodicOverlayCheck() {
    // PERFORMANCE FIX: Changed from 500ms to 8000ms (8 seconds)
    // Original 500ms interval caused constant CPU usage (120 wake-ups per minute)
    // New 8s interval is a safety net for edge cases (7.5 wake-ups per minute)
    // MutationObserver handles real-time updates, this is just backup

    // Clear any existing interval
    if (window._spOverlayCheckInterval) {
      clearInterval(window._spOverlayCheckInterval);
      window._spOverlayCheckInterval = null;
    }

    // Do an immediate check for existing messages on page load
    this.annotateAssistantMessages();
    this.restyleExistingOverlays();

    // Start 8-second interval as safety net
    const checkInterval = setInterval(() => {
      // DEVTOOLS PERFORMANCE FIX: Skip interval execution when DevTools is open
      if (window._spDevToolsOpen) {
        devLog("⏸️ Skipping overlay check - DevTools is open");
        return;
      }

      this.annotateAssistantMessages();
      this.restyleExistingOverlays();
    }, 8000); // 8 seconds instead of 500ms

    window._spOverlayCheckInterval = checkInterval;
    devLog(
      "✅ Periodic overlay check started with 8s interval (performance optimized from 500ms)",
    );
  },

  /**
   * Ensure overlays refresh once the conversation style system finishes bootstrapping
   */
  waitForConversationStyleBootstrap() {
    const maxAttempts = 40;
    let attempts = 0;

    if (this._bootstrapRetryTimer) {
      clearTimeout(this._bootstrapRetryTimer);
      this._bootstrapRetryTimer = null;
    }

    const attemptRefresh = () => {
      const attr = document.documentElement?.getAttribute?.(
        "data-sp-conversation-style",
      );

      let hasModuleSettings = false;
      try {
        const settings = window.SuperPromptConversationStyling?.getSettings?.();
        hasModuleSettings = Boolean(settings);
      } catch (err) {
        // Ignore errors here; resolveConversationStyleSettings will log if needed
      }

      overlayDebugLog("waitForConversationStyleBootstrap attempt", {
        attempt: attempts + 1,
        attrPresent: Boolean(attr),
        hasModuleSettings,
      });

      if (attr || hasModuleSettings) {
        const { styleType } = resolveConversationStyleSettings();
        devLog(
          "🎨 [MessageOverlays] Conversation style detected post-bootstrap:",
          styleType,
          "→ refreshing overlays",
        );
        overlayDebugLog("waitForConversationStyleBootstrap success", {
          styleType,
        });
        // Force a fresh theme resolution and restyle ALL overlays
        this.getThemeSpecificStyling();
        this.restyleExistingOverlays();

        // Also refresh to recreate any that were hidden
        this.refreshAllOverlays();

        // Schedule one more aggressive restyle to catch stragglers
        setTimeout(() => {
          this.getThemeSpecificStyling();
          this.restyleExistingOverlays();
        }, 100);

        this._bootstrapRetryTimer = null;
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        devWarn(
          "⚠️ [MessageOverlays] Conversation style bootstrap not observed; overlays will keep current theme",
        );
        overlayDebugLog("waitForConversationStyleBootstrap aborted", {
          attempts,
          maxAttempts,
        });
        this._bootstrapRetryTimer = null;
        return;
      }

      this._bootstrapRetryTimer = setTimeout(attemptRefresh, 150);
    };

    attemptRefresh();
  },

  /**
   * Initialize the complete message overlay system
   */
  initialize() {
    try {
      this.syncDebugLoggingState();
      if (this._debugLogging) {
        this.setDebugLogging(false);
      }

      // Initialize overlays with safe implementation
      this.initAssistantMessageOverlaysSafe();

      // Start periodic checking
      this.startPeriodicOverlayCheck();

      // Make global functions available
      window.spToggleMessageOverlays = () => this.toggleMessageOverlays();
      window.testSuperPromptOverlays = () => this.testOverlays();

      // Listen for conversation style changes and refresh overlays
      this.listenForThemeChanges();

      // Listen for URL changes (chat navigation)
      this.listenForURLChanges();

      // CRITICAL: Wait for conversation styling to bootstrap BEFORE rendering overlays
      // This ensures both DOM attribute and module settings are available
      this.waitForConversationStyleBootstrap();

      // Render overlays for existing (already completed) messages after a delay
      // This handles page loads on existing chats where messages are already complete
      // ONLY render articles that have message-actions divs (completed messages)
      setTimeout(() => {
        devLog(
          "🔄 [MessageOverlays] Rendering overlays for existing completed messages",
        );
        // Get all assistant articles
        const { articles } = this.collectAssistantArticles();
        const completeArticles = articles.filter((article) =>
          article.querySelector('div[id^="message-actions"]'),
        );

        if (completeArticles.length > 0) {
          devLog(
            `✅ Found ${completeArticles.length} complete articles (with message-actions)`,
          );
          this.annotateAssistantMessages();
        } else {
          devLog(
            "⏭️ No complete articles found on page load, skipping initial render",
          );
        }
      }, 500);

      devLog(
        "✅ SuperPrompt Message Overlays module initialized (message-actions-driven mode)",
      );
    } catch (e) {
      devError("❌ Failed to initialize message overlays:", e);
    }
  },

  /**
   * Listen for theme changes and refresh overlays accordingly
   */
  listenForThemeChanges() {
    const scheduleSecondPassRefresh = (reason) => {
      try {
        if (this._themeRefreshTimer) {
          clearTimeout(this._themeRefreshTimer);
        }

        // Small delay to let Zustand persist + module settings settle.
        this._themeRefreshTimer = setTimeout(() => {
          overlayDebugLog("listenForThemeChanges → second pass refresh", {
            reason,
          });
          this.getThemeSpecificStyling();
          this.restyleExistingOverlays();
          this.refreshAllOverlays();
        }, 150);
      } catch (e) {
        // Non-fatal
      }
    };

    // Listen to storage events (Zustand persist updates)
    window.addEventListener("storage", (e) => {
      if (e.key === "sp-conversation-style" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.state?.styleType) {
            devLog(
              "🎨 [MessageOverlays] Storage updated:",
              parsed.state.styleType,
              "→ refreshing overlays",
            );
            overlayDebugLog("listenForThemeChanges → storage", {
              styleType: parsed.state.styleType,
              enabled: parsed.state.enabled,
            });
            this.getThemeSpecificStyling();
            this.restyleExistingOverlays();
            this.refreshAllOverlays();
            scheduleSecondPassRefresh("storage");
          }
        } catch (err) {
          devWarn("Failed to parse storage update:", err);
        }
      }
    });

    // Also listen for custom events (for same-tab updates)
    window.addEventListener("sp-conversation-style-changed", (event) => {
      devLog("🎨 [MessageOverlays] Style changed event → refreshing overlays");
      overlayDebugLog("listenForThemeChanges → custom event", {
        detail: event?.detail,
      });
      this.getThemeSpecificStyling();
      this.restyleExistingOverlays();
      this.refreshAllOverlays();
      scheduleSecondPassRefresh("custom-event");
    });

    if (this._themeAttrObserver) {
      this._themeAttrObserver.disconnect();
    }

    try {
      const attrObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "data-sp-conversation-style"
          ) {
            const { styleType } = resolveConversationStyleSettings();
            devLog(
              "🎨 [MessageOverlays] data-sp-conversation-style mutated → refreshing overlays:",
              styleType,
            );
            overlayDebugLog("listenForThemeChanges → attr mutation", {
              styleType,
            });
            this.getThemeSpecificStyling();
            this.restyleExistingOverlays();
            this.refreshAllOverlays();
            scheduleSecondPassRefresh("attr-mutation");
            break;
          }
        }
      });

      attrObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-sp-conversation-style"],
      });

      this._themeAttrObserver = attrObserver;
    } catch (observerError) {
      devWarn(
        "⚠️ [MessageOverlays] Failed to observe conversation style attribute:",
        observerError,
      );
    }

    devLog("✅ [MessageOverlays] Listening for theme changes");
  },

  /**
   * Listen for URL changes and refresh overlays when navigating between chats
   */
  listenForURLChanges() {
    let lastURL = window.location.href;

    // Use setInterval to poll for URL changes (reliable across SPAs)
    const checkURL = () => {
      const currentURL = window.location.href;
      if (currentURL !== lastURL) {
        devLog("🔄 [MessageOverlays] URL changed, refreshing overlays", {
          from: lastURL,
          to: currentURL,
        });
        lastURL = currentURL;

        // Wait a bit for new content to load, then refresh
        setTimeout(() => {
          // Rebind our mutation observer to the new presentation container (SPA navigation swaps nodes)
          this.rebindOverlayObserver?.();

          if (this.hasResolvedConversationStyle()) {
            devLog("🔄 [MessageOverlays] Refreshing after navigation");
            this.refreshAllOverlays();
          } else {
            devLog(
              "⏳ [MessageOverlays] Waiting for theme bootstrap after navigation",
            );
            this.waitForConversationStyleBootstrap();
          }
        }, 300);
      }
    };

    // PERFORMANCE: Changed from 500ms to 2000ms (history API patching handles most navigation)
    setInterval(checkURL, 2000);
    devLog("✅ [MessageOverlays] Listening for URL changes (2s polling)");
  },

  /**
   * Rebind the global MutationObserver to the current presentation container.
   * Safe to call multiple times; disconnects any previous observer.
   */
  rebindOverlayObserver() {
    try {
      if (window._spMsgOverlayGlobalObs) {
        try {
          window._spMsgOverlayGlobalObs.disconnect();
        } catch {}
        window._spMsgOverlayGlobalObs = null;
      }

      // Use a throttled observer to prevent rapid loops
      let observerTimeout = null;
      const obs = new MutationObserver((mutations) => {
        if (observerTimeout) clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          let needsUpdate = false;
          let buttonsAppeared = false;

          for (const m of mutations) {
            for (const node of m.addedNodes) {
              if (node.nodeType !== Node.ELEMENT_NODE) continue;
              const el = node;

              if (
                el.id === "assistant-group-counter" ||
                el.classList?.includes?.("sp-overlay") ||
                el.classList?.contains?.("sp-overlay") ||
                el.closest?.("#assistant-group-counter")
              ) {
                continue;
              }

              if (el.tagName === "BUTTON" || el.querySelector?.("button")) {
                const buttonText = el.textContent || "";
                if (
                  buttonText.includes("Copy") ||
                  buttonText.includes("Good") ||
                  el.querySelector?.('button[aria-label*="Copy"]')
                ) {
                  buttonsAppeared = true;
                  needsUpdate = true;
                  break;
                }
              }

              if (this.nodeMatchesAssistant(el)) {
                needsUpdate = true;
                break;
              }
            }
            if (needsUpdate) break;
          }

          if (needsUpdate) {
            const delay = buttonsAppeared ? 50 : 100;
            setTimeout(() => this.annotateAssistantMessages(), delay);
          }
        }, 200);
      });

      const presentationDiv = document.querySelector(
        'div[role="presentation"]',
      );
      if (presentationDiv) {
        obs.observe(presentationDiv, { childList: true, subtree: true });
      } else {
        obs.observe(document.body, { childList: true, subtree: true });
      }

      window._spMsgOverlayGlobalObs = obs;
      devLog(
        "🔗 [MessageOverlays] Rebound overlay MutationObserver to current container",
      );
    } catch (e) {
      devWarn("⚠️ [MessageOverlays] Failed to rebind overlay observer", e);
    }
  },

  /**
   * Cleanup function
   */
  cleanup() {
    try {
      // Remove all overlays
      document.querySelectorAll(".sp-overlay").forEach((el) => el.remove());

      // Clear mutation observer
      if (window._spMsgOverlayGlobalObs) {
        window._spMsgOverlayGlobalObs.disconnect();
        window._spMsgOverlayGlobalObs = null;
      }

      // Clear periodic check
      if (window._spOverlayCheckInterval) {
        clearInterval(window._spOverlayCheckInterval);
        window._spOverlayCheckInterval = null;
      }

      if (this._themeAttrObserver) {
        this._themeAttrObserver.disconnect();
        this._themeAttrObserver = null;
      }

      if (this._bootstrapRetryTimer) {
        clearTimeout(this._bootstrapRetryTimer);
        this._bootstrapRetryTimer = null;
      }

      if (this._annotationRetry?.timer) {
        clearTimeout(this._annotationRetry.timer);
      }
      this._annotationRetry = null;

      // Clear initialization flag
      window._spMsgOverlayInitialized = false;

      devLog("🧹 Message overlays cleaned up");
    } catch (e) {
      devWarn("Error cleaning up message overlays:", e);
    }
  },
};

// Auto-initialize when module loads if not in test mode
if (typeof window !== "undefined" && !window.__SUPERPROMPT_TEST_MODE__) {
  // Wait for other dependencies to load
  setTimeout(() => {
    if (window.SuperPromptMessageOverlays) {
      window.SuperPromptMessageOverlays.initialize();
    }
  }, 100);
}
