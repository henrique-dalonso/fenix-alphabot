
  

﻿// ██████████████████████████████████████████████████████████████████████████████
// ██                        SUPERPROMPT UI COMPONENTS                        ██
// ██                                                                        ██
// ██   Modular UI utilities, button creators, dialog builders, overlays     ██
// ██████████████████████████████████████████████████████████████████████████

// Global namespace for UI component utilities
window.SuperPromptUIComponents = {
  // ============================================================================
  // BUTTON CREATION & VARIANTS
  // ============================================================================

  // Button constants
  BUTTON_VARIANTS: {
    primary: "primary",
    secondary: "secondary",
    danger: "danger",
    success: "success",
    warning: "warning",
  },

  BUTTON_SIZES: {
    sm: "sm",
    md: "md",
    lg: "lg",
  },

  /**
   * Create a styled button with consistent design
   * @param {Object} options - Button configuration
   * @returns {HTMLButtonElement} Configured button element
   */
  createGenericButton(options = {}) {
    const {
      text = "",
      variant = this.BUTTON_VARIANTS.primary,
      size = this.BUTTON_SIZES.md,
      disabled = false,
      loading = false,
      icon = null,
      iconPosition = "left",
      fullWidth = false,
      onClick = null,
      type = "button",
      customStyles = {},
      ariaLabel = "",
      title = "",
    } = options;

    const button = document.createElement("button");
    button.type = type;
    button.disabled = disabled || loading;

    if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
    if (title) button.title = title;

    // Base styles
    const baseStyles = {
      transition: "all 0.2s ease",
      cursor: "pointer",
      borderRadius: "8px",
      fontFamily: "Inter, system-ui, sans-serif",
      fontWeight: "500",
      outline: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      position: "relative",
      overflow: "hidden",
      border: "none",
      boxSizing: "border-box",
    };

    // Size styles
    const sizeStyles = {
      [this.BUTTON_SIZES.sm]: {
        padding: "6px 12px",
        fontSize: "13px",
        height: "32px",
        minWidth: "60px",
      },
      [this.BUTTON_SIZES.md]: {
        padding: "8px 16px",
        fontSize: "14px",
        height: "40px",
        minWidth: "80px",
      },
      [this.BUTTON_SIZES.lg]: {
        padding: "12px 20px",
        fontSize: "16px",
        height: "48px",
        minWidth: "100px",
      },
    };

    // Variant styles
    const variantStyles = {
      [this.BUTTON_VARIANTS.primary]: {
        background: "var(--color-accent, #2563eb)",
        color: "white",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      },
      [this.BUTTON_VARIANTS.secondary]: {
        border: "1px solid var(--color-border, #444)",
        background: "var(--color-surface-primary, #1a1a1a)",
        color: "var(--color-text-secondary, #ccc)",
      },
      [this.BUTTON_VARIANTS.danger]: {
        background: "var(--color-error, #dc2626)",
        color: "white",
        boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
      },
      [this.BUTTON_VARIANTS.success]: {
        background: "var(--color-success, #059669)",
        color: "white",
        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.15)",
      },
      [this.BUTTON_VARIANTS.warning]: {
        background: "var(--color-warning, #d97706)",
        color: "white",
        boxShadow: "0 2px 8px rgba(217, 119, 6, 0.15)",
      },
    };

    // Hover styles
    const hoverStyles = {
      [this.BUTTON_VARIANTS.primary]: {
        background: "var(--color-accent-hover, #1d4ed8)",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      },
      [this.BUTTON_VARIANTS.secondary]: {
        background: "var(--color-surface-hover, rgba(255, 255, 255, 0.1))",
        color: "var(--color-text-primary, #fff)",
        transform: "translateY(-1px)",
      },
      [this.BUTTON_VARIANTS.danger]: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
      },
      [this.BUTTON_VARIANTS.success]: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
      },
      [this.BUTTON_VARIANTS.warning]: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)",
      },
    };

    // Apply all styles
    const allStyles = {
      ...baseStyles,
      ...(variantStyles[variant] ||
        variantStyles[this.BUTTON_VARIANTS.primary]),
      ...(sizeStyles[size] || sizeStyles[this.BUTTON_SIZES.md]),
      width: fullWidth ? "100%" : "auto",
      opacity: disabled || loading ? "0.6" : "1",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      ...customStyles,
    };

    Object.assign(button.style, allStyles);

    // Create content container
    const contentContainer = document.createElement("div");
    contentContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: ${loading ? "0.7" : "1"};
    `;

    // Add loading spinner if needed
    if (loading) {
      const spinner = document.createElement("div");
      spinner.style.cssText = `
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: generic-button-spin 1s linear infinite;
      `;
      contentContainer.appendChild(spinner);
    }

    // Add icon if provided (left position)
    if (!loading && icon && iconPosition === "left") {
      const iconElement = document.createElement("span");
      iconElement.innerHTML = icon;
      iconElement.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      contentContainer.appendChild(iconElement);
    }

    // Add text content
    if (text) {
      const textElement = document.createElement("span");
      textElement.textContent = text;
      contentContainer.appendChild(textElement);
    }

    // Add icon if provided (right position)
    if (!loading && icon && iconPosition === "right") {
      const iconElement = document.createElement("span");
      iconElement.innerHTML = icon;
      iconElement.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      contentContainer.appendChild(iconElement);
    }

    button.appendChild(contentContainer);

    // Add hover effects
    if (!disabled && !loading) {
      button.addEventListener("mouseenter", () => {
        Object.assign(button.style, hoverStyles[variant] || {});
      });

      button.addEventListener("mouseleave", () => {
        Object.assign(button.style, allStyles);
      });

      button.addEventListener("mousedown", () => {
        button.style.transform = "scale(0.98)";
      });

      button.addEventListener("mouseup", () => {
        Object.assign(button.style, hoverStyles[variant] || allStyles);
      });
    }

    // Add click handler
    if (onClick && !disabled && !loading) {
      button.addEventListener("click", onClick);
    }

    // Ensure spinner animation is available
    if (!document.getElementById("superprompt-ui-styles")) {
      this.injectUIStyles();
    }

    return button;
  },

  // ============================================================================
  // DIALOG & OVERLAY CREATION
  // ============================================================================

  /**
   * Create a modal dialog backdrop
   * @param {Object} options - Dialog configuration
   * @returns {HTMLElement} Dialog backdrop element
   */
  createDialogBackdrop(options = {}) {
    const {
      className = "",
      zIndex = 1000,
      backgroundColor = "rgba(0, 0, 0, 0.5)",
      onClick = null,
    } = options;

    const backdrop = document.createElement("div");
    backdrop.className = `superprompt-dialog-backdrop ${className}`;
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${backgroundColor};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${zIndex};
      backdrop-filter: blur(4px);
    `;

    if (onClick) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) onClick(e);
      });
    }

    return backdrop;
  },

  /**
   * Create a dialog container
   * @param {Object} options - Dialog configuration
   * @returns {HTMLElement} Dialog container element
   */
  createDialogContainer(options = {}) {
    const { className = "", maxWidth = "500px", maxHeight = "80vh" } = options;

    const container = document.createElement("div");
    container.className = `superprompt-dialog-container ${className}`;
    container.style.cssText = `
      background: var(--color-surface-primary, #1a1a1a);
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: ${maxWidth};
      max-height: ${maxHeight};
      width: 90%;
      margin: 20px;
      overflow: hidden;
      border: 1px solid var(--color-border, #444);
    `;

    return container;
  },

  /**
   * Create dialog header with title and close button
   * @param {Object} options - Header configuration
   * @returns {HTMLElement} Header element
   */
  createDialogHeader(options = {}) {
    const {
      title = "",
      onClose = null,
      className = "",
      showCloseButton = true,
    } = options;

    const header = document.createElement("div");
    header.className = `superprompt-dialog-header ${className}`;
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border, #444);
      background: var(--color-surface-secondary, #2a2a2a);
    `;

    const titleElement = document.createElement("h2");
    titleElement.textContent = title;
    titleElement.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    `;

    header.appendChild(titleElement);

    if (showCloseButton && onClose) {
      const closeButton = this.createGenericButton({
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`,
        variant: this.BUTTON_VARIANTS.secondary,
        size: this.BUTTON_SIZES.sm,
        onClick: onClose,
        ariaLabel: "Close dialog",
      });

      header.appendChild(closeButton);
    }

    return header;
  },

  /**
   * Create dialog content area
   * @param {Object} options - Content configuration
   * @returns {HTMLElement} Content element
   */
  createDialogContent(options = {}) {
    const { className = "", padding = "20px" } = options;

    const content = document.createElement("div");
    content.className = `superprompt-dialog-content ${className}`;
    content.style.cssText = `
      padding: ${padding};
      color: var(--color-text-primary, #fff);
      overflow-y: auto;
    `;

    return content;
  },

  /**
   * Create dialog footer with action buttons
   * @param {Object} options - Footer configuration
   * @returns {HTMLElement} Footer element
   */
  createDialogFooter(options = {}) {
    const {
      className = "",
      buttons = [],
      alignment = "right", // left, center, right
    } = options;

    const footer = document.createElement("div");
    footer.className = `superprompt-dialog-footer ${className}`;
    footer.style.cssText = `
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--color-border, #444);
      background: var(--color-surface-secondary, #2a2a2a);
      justify-content: ${
        alignment === "left"
          ? "flex-start"
          : alignment === "center"
          ? "center"
          : "flex-end"
      };
    `;

    buttons.forEach((buttonConfig) => {
      const button = this.createGenericButton(buttonConfig);
      footer.appendChild(button);
    });

    return footer;
  },

  /**
   * Create a complete modal dialog
   * @param {Object} options - Full dialog configuration
   * @returns {Object} Dialog elements and controls
   */
  createModal(options = {}) {
    const {
      title = "",
      content = "",
      buttons = [],
      onClose = null,
      className = "",
      maxWidth = "500px",
      showCloseButton = true,
    } = options;

    const backdrop = this.createDialogBackdrop({ onClick: onClose });
    const container = this.createDialogContainer({ className, maxWidth });
    const header = this.createDialogHeader({ title, onClose, showCloseButton });
    const contentDiv = this.createDialogContent();
    const footer = this.createDialogFooter({ buttons });

    if (typeof content === "string") {
      contentDiv.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentDiv.appendChild(content);
    }

    container.appendChild(header);
    container.appendChild(contentDiv);
    if (buttons.length > 0) {
      container.appendChild(footer);
    }
    backdrop.appendChild(container);

    return {
      backdrop,
      container,
      header,
      content: contentDiv,
      footer,
      show: () => document.body.appendChild(backdrop),
      hide: () => backdrop.remove(),
      destroy: () => backdrop.remove(),
    };
  },

  // ============================================================================
  // OVERLAY & TOOLTIP CREATION
  // ============================================================================

  /**
   * Create message overlay for ChatGPT responses
   * @param {Object} options - Overlay configuration
   * @returns {HTMLElement} Overlay element
   */
  createMessageOverlay(options = {}) {
    const {
      chars = 0,
      words = 0,
      timestamp = "",
      className = "",
      position = "top-right",
    } = options;

    const overlay = document.createElement("div");
    overlay.className = `sp-overlay ${className}`;
    overlay.style.cssText = `
      position: absolute;
      ${position.includes("top") ? "top: 8px;" : "bottom: 8px;"}
      ${position.includes("right") ? "right: 8px;" : "left: 8px;"}
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'SF Mono', Consolas, monospace;
      backdrop-filter: blur(8px);
      z-index: 10;
      pointer-events: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const text = [];
    if (chars > 0) text.push(`${chars} chars`);
    if (words > 0) text.push(`${words} words`);
    if (timestamp) text.push(timestamp);

    overlay.textContent = text.join(" • ");

    return overlay;
  },

  /**
   * Create tooltip element
   * @param {Object} options - Tooltip configuration
   * @returns {HTMLElement} Tooltip element
   */
  createTooltip(options = {}) {
    const { content = "", className = "", maxWidth = "200px" } = options;

    const tooltip = document.createElement("div");
    tooltip.className = `superprompt-tooltip ${className}`;
    tooltip.style.cssText = `
      position: absolute;
      background: var(--color-surface-primary, #1a1a1a);
      color: var(--color-text-primary, #fff);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      max-width: ${maxWidth};
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--color-border, #444);
      pointer-events: none;
    `;

    if (typeof content === "string") {
      tooltip.textContent = content;
    } else {
      tooltip.appendChild(content);
    }

    return tooltip;
  },

  // ============================================================================
  // FORM ELEMENTS
  // ============================================================================

  /**
   * Create styled input field
   * @param {Object} options - Input configuration
   * @returns {HTMLElement} Input element
   */
  createStyledInput(options = {}) {
    const {
      type = "text",
      placeholder = "",
      value = "",
      className = "",
      onChange = null,
    } = options;

    const input = document.createElement("input");
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    input.className = `superprompt-input ${className}`;

    input.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border, #444);
      border-radius: 6px;
      background: var(--color-surface-primary, #1a1a1a);
      color: var(--color-text-primary, #fff);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    `;

    // Add focus styles
    input.addEventListener("focus", () => {
      input.style.borderColor = "var(--color-accent, #2563eb)";
    });

    input.addEventListener("blur", () => {
      input.style.borderColor = "var(--color-border, #444)";
    });

    if (onChange) {
      input.addEventListener("input", onChange);
    }

    return input;
  },

  /**
   * Create styled textarea
   * @param {Object} options - Textarea configuration
   * @returns {HTMLElement} Textarea element
   */
  createStyledTextarea(options = {}) {
    const {
      placeholder = "",
      value = "",
      rows = 4,
      className = "",
      onChange = null,
    } = options;

    const textarea = document.createElement("textarea");
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.rows = rows;
    textarea.className = `superprompt-textarea ${className}`;

    textarea.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--color-border, #444);
      border-radius: 6px;
      background: var(--color-surface-primary, #1a1a1a);
      color: var(--color-text-primary, #fff);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      resize: vertical;
      font-family: inherit;
    `;

    // Add focus styles
    textarea.addEventListener("focus", () => {
      textarea.style.borderColor = "var(--color-accent, #2563eb)";
    });

    textarea.addEventListener("blur", () => {
      textarea.style.borderColor = "var(--color-border, #444)";
    });

    if (onChange) {
      textarea.addEventListener("input", onChange);
    }

    return textarea;
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Inject required CSS styles for UI components
   */
  injectUIStyles() {
    if (document.getElementById("superprompt-ui-styles")) return;

    const style = document.createElement("style");
    style.id = "superprompt-ui-styles";
    style.textContent = `
      @keyframes generic-button-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .superprompt-dialog-backdrop {
        animation: fadeIn 0.2s ease-out;
      }
      
      .superprompt-dialog-container {
        animation: slideUp 0.2s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to { 
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .superprompt-input:focus,
      .superprompt-textarea:focus {
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Position element relative to anchor
   * @param {HTMLElement} element - Element to position
   * @param {HTMLElement} anchor - Anchor element
   * @param {string} position - Position relative to anchor
   */
  positionElement(element, anchor, position = "bottom-right") {
    const anchorRect = anchor.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    let top, left;

    switch (position) {
      case "top-left":
        top = anchorRect.top - elementRect.height - 8;
        left = anchorRect.left;
        break;
      case "top-right":
        top = anchorRect.top - elementRect.height - 8;
        left = anchorRect.right - elementRect.width;
        break;
      case "bottom-left":
        top = anchorRect.bottom + 8;
        left = anchorRect.left;
        break;
      case "bottom-right":
      default:
        top = anchorRect.bottom + 8;
        left = anchorRect.right - elementRect.width;
        break;
    }

    // Keep within viewport
    top = Math.max(
      8,
      Math.min(top, window.innerHeight - elementRect.height - 8)
    );
    left = Math.max(
      8,
      Math.min(left, window.innerWidth - elementRect.width - 8)
    );

    element.style.position = "fixed";
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
  },

  /**
   * Format character and word counts
   * @param {number} chars - Character count
   * @param {number} words - Word count
   * @returns {string} Formatted count string
   */
  formatCounts(chars, words) {
    const parts = [];
    if (chars > 0) parts.push(`${chars} chars`);
    if (words > 0) parts.push(`${words} words`);
    return parts.join(" • ");
  },
};

// Backward compatibility - expose createGenericButton and variants globally
window.createGenericButton =
  window.SuperPromptUIComponents.createGenericButton.bind(
    window.SuperPromptUIComponents
  );
window.BUTTON_VARIANTS = window.SuperPromptUIComponents.BUTTON_VARIANTS;
window.BUTTON_SIZES = window.SuperPromptUIComponents.BUTTON_SIZES;

// Auto-inject UI styles
window.SuperPromptUIComponents.injectUIStyles();

// Log successful module loading
if (window.SuperPromptCoreUtils?.spPostLog) {
  window.SuperPromptCoreUtils.spPostLog(
    "info",
    "UI Components module loaded successfully"
  );
} else if (console?.log) {
  devLog("✅ SuperPrompt UI Components module loaded");
}
