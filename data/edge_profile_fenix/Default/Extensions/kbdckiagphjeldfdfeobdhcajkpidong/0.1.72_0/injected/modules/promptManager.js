
  

﻿// ██████████████████████████████████████████████████████████████████████████████
// ██                         SUPERPROMPT PROMPT MANAGER                      ██
// ██                                                                        ██
// ██   Modular prompt processing, variable parsing, and template utilities  ██
// ██████████████████████████████████████████████████████████████████████████

// Global namespace for prompt management utilities
window.SuperPromptPromptManager = {
  // ============================================================================
  // VARIABLE PARSING & EXTRACTION
  // ============================================================================

  /**
   * Parse prompt variables from template string
   * Extracts {{variable}} patterns with type hints, defaults, etc.
   *
   * @param {string} template - The prompt template string
   * @returns {Array} Array of variable objects with name, type, default, etc.
   */
  parsePromptVariables(template) {
    if (!template || typeof template !== "string") return [];

    const variables = [];
    const variableRegex = /\{\{(.*?)\}\}/g;
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const fullMatch = match[1];

      // Skip repeater patterns (handled separately)
      if (fullMatch.includes("[]:")) continue;

      // Extract base variable name by removing everything after :: (description)
      const baseVar = fullMatch.split("::")[0].trim();

      // Extract clean name by removing type hints, defaults, and indicators
      const cleanName = baseVar
        .split(":")[0] // Remove type (e.g., :dropdown, :input)
        .replace(/[*?]$/, "") // Remove required (*) or optional (?) indicators
        .split("=")[0] // Remove default values
        .trim();

      // Skip if already processed
      if (variables.find((v) => v.name === cleanName)) continue;

      // Extract type hint
      const typeMatch = baseVar.match(/:(\w+)/);
      const type = typeMatch ? typeMatch[1] : "input";

      // Extract default value
      const defaultMatch = baseVar.match(/=([^:]*?)(?:[*?])?$/);
      const defaultValue = defaultMatch ? defaultMatch[1].trim() : "";

      // Check if required (ends with *)
      const isRequired = baseVar.endsWith("*");

      // Extract description after ::
      const descMatch = fullMatch.match(/::\s*(.+)$/);
      const description = descMatch ? descMatch[1].trim() : "";

      variables.push({
        name: cleanName,
        type: type,
        defaultValue: defaultValue,
        required: isRequired,
        description: description,
        fullPattern: fullMatch,
      });
    }

    return variables;
  },

  /**
   * Extract repeater fields from template
   * Handles {{name[]:{field1,field2}}} patterns
   *
   * @param {string} template - The prompt template string
   * @returns {Array} Array of repeater objects
   */
  extractRepeaters(template) {
    if (!template || typeof template !== "string") return [];

    const repeaters = [];
    const repeaterRegex = /\{\{(\w+)\[\]:\{([^}]+)\}\}\}/g;
    let match;

    while ((match = repeaterRegex.exec(template)) !== null) {
      const name = match[1];
      const fieldsStr = match[2];
      const fields = fieldsStr
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);

      repeaters.push({
        name: name,
        fields: fields,
        fullPattern: match[0],
      });
    }

    return repeaters;
  },

  /**
   * Extract legacy parameters (for backward compatibility)
   *
   * @param {string} template - The prompt template string
   * @returns {Array} Array of parameter objects
   */
  extractParameters(template) {
    // For backward compatibility, use parsePromptVariables
    return this.parsePromptVariables(template);
  },

  // ============================================================================
  // TEMPLATE RENDERING
  // ============================================================================

  /**
   * Render prompt template with provided values
   * Replaces variables and handles repeaters
   *
   * @param {string} template - The prompt template
   * @param {Object} values - Variable values to substitute
   * @param {Object} repeaterValues - Repeater data arrays
   * @returns {string} Rendered prompt text
   */
  renderPromptText(template, values = {}, repeaterValues = {}) {
    if (!template || typeof template !== "string") return "";

    let result = template;

    // First handle repeaters
    result = this.processRepeaters(result, repeaterValues);

    // Then handle regular variables
    result = result.replace(/\{\{(.*?)\}\}/g, (match, varName) => {
      // Extract the base name by removing everything after :: (description)
      const baseVar = varName.split("::")[0].trim();

      // Extract clean name by removing type hints, defaults, and indicators
      const cleanName = baseVar
        .split(":")[0] // Remove type (e.g., :dropdown, :input)
        .replace(/[*?]$/, "") // Remove required (*) or optional (?) indicators
        .split("=")[0] // Remove default values
        .trim();

      // Keep {{name:file}} parameters in prompt - they'll be handled by chatInject.ts
      if (baseVar.includes(":file")) {
        return match; // Return original placeholder
      }

      // Return the value if available, otherwise return empty string
      return values[cleanName] || "";
    });

    return result;
  },

  /**
   * Process repeater sections in template
   *
   * @param {string} template - Template with repeater patterns
   * @param {Object} repeaterValues - Object with repeater data arrays
   * @returns {string} Template with processed repeaters
   */
  processRepeaters(template, repeaterValues = {}) {
    return template.replace(
      /\{\{(\w+)\[\]:\{([^}]+)\}\}\}/g,
      (match, name, fieldsStr) => {
        const fields = fieldsStr.split(",").map((f) => f.trim());
        const data = repeaterValues[name] || [];

        if (data.length === 0) return "";

        return data
          .map((item) => {
            return fields.map((field) => item[field] || "").join(" | ");
          })
          .join("\n");
      }
    );
  },

  /**
   * Generate prompt preview with highlighting
   * Used for UI display of templates
   *
   * @param {string} template - The prompt template
   * @param {Object} values - Variable values for preview
   * @returns {string} HTML preview with styled variables
   */
  renderPromptPreview(template, values = {}) {
    if (!template || typeof template !== "string") return "";

    let result = template;

    // First handle repeaters with special styling
    result = result.replace(
      /\{\{(\w+)\[\]:\{([^}]+)\}\}\}/g,
      (match, name, fields) => {
        const fieldList = fields.split(",").map((f) => f.trim());
        return `<span class="text-teal-400 font-semibold">[${fieldList.join(
          " | "
        )}]</span>`;
      }
    );

    // Then handle regular variables
    result = result.replace(/\{\{(.*?)\}\}/g, (match, varName) => {
      const baseVar = varName.split("::")[0].trim();
      const cleanName = baseVar
        .split(":")[0]
        .replace(/[*?]$/, "")
        .split("=")[0]
        .trim();

      const value = values[cleanName] || "";
      const hasValue = value.trim().length > 0;

      if (hasValue) {
        return `<span class="bg-green-100 text-green-800 px-1 rounded font-medium">${value}</span>`;
      } else {
        return `<span class="bg-yellow-100 text-yellow-800 px-1 rounded font-medium">${cleanName}</span>`;
      }
    });

    return result;
  },

  // ============================================================================
  // VALIDATION & UTILITY
  // ============================================================================

  /**
   * Validate that all required variables have values
   *
   * @param {string} template - The prompt template
   * @param {Object} values - Variable values to check
   * @returns {Array} Array of missing required variable names
   */
  validateRequiredVariables(template, values = {}) {
    const variables = this.parsePromptVariables(template);
    const missing = [];

    variables.forEach((variable) => {
      if (variable.required && !values[variable.name]) {
        missing.push(variable.name);
      }
    });

    return missing;
  },

  /**
   * Check if template contains any variables
   *
   * @param {string} template - The prompt template
   * @returns {boolean} True if template has variables
   */
  hasVariables(template) {
    if (!template || typeof template !== "string") return false;
    return /\{\{.*?\}\}/.test(template);
  },

  /**
   * Get variable count from template
   *
   * @param {string} template - The prompt template
   * @returns {number} Number of unique variables
   */
  getVariableCount(template) {
    return this.parsePromptVariables(template).length;
  },

  /**
   * Clean variable name for safe usage
   *
   * @param {string} varName - Raw variable name
   * @returns {string} Cleaned variable name
   */
  cleanVariableName(varName) {
    if (!varName) return "";
    return varName
      .split("::")[0] // Remove description
      .split(":")[0] // Remove type
      .replace(/[*?]$/, "") // Remove indicators
      .split("=")[0] // Remove default
      .trim();
  },

  // ============================================================================
  // TEMPLATE STORAGE (for Parameter Dialog)
  // ============================================================================

  /**
   * Get saved variable templates from localStorage
   *
   * @returns {Array} Array of saved templates
   */
  getVariableTemplates() {
    try {
      return JSON.parse(
        localStorage.getItem("superprompt_var_templates") || "[]"
      );
    } catch (error) {
      window.SuperPromptCoreUtils?.spPostLog(
        "warn",
        "Failed to load variable templates:",
        error
      );
      return [];
    }
  },

  /**
   * Save variable template to localStorage
   *
   * @param {string} name - Template name
   * @param {Object} values - Variable values to save
   */
  saveVariableTemplate(name, values) {
    try {
      const templates = this.getVariableTemplates();
      templates.push({ name, values });
      localStorage.setItem(
        "superprompt_var_templates",
        JSON.stringify(templates)
      );

      window.SuperPromptCoreUtils?.spPostLog(
        "info",
        `Variable template "${name}" saved`
      );
    } catch (error) {
      window.SuperPromptCoreUtils?.spPostLog(
        "error",
        "Failed to save variable template:",
        error
      );
    }
  },

  /**
   * Remove variable template from localStorage
   *
   * @param {string} name - Template name to remove
   */
  removeVariableTemplate(name) {
    try {
      const templates = this.getVariableTemplates().filter(
        (tpl) => tpl.name !== name
      );
      localStorage.setItem(
        "superprompt_var_templates",
        JSON.stringify(templates)
      );

      window.SuperPromptCoreUtils?.spPostLog(
        "info",
        `Variable template "${name}" removed`
      );
    } catch (error) {
      window.SuperPromptCoreUtils?.spPostLog(
        "error",
        "Failed to remove variable template:",
        error
      );
    }
  },

  // ============================================================================
  // PROMPT DETECTION & ANALYSIS
  // ============================================================================

  /**
   * Detect if text looks like a prompt template
   *
   * @param {string} text - Text to analyze
   * @returns {Object} Detection result with confidence score
   */
  detectPromptTemplate(text) {
    if (!text || typeof text !== "string") {
      return { isPrompt: false, confidence: 0, reasons: [] };
    }

    const reasons = [];
    let score = 0;

    // Check for variables
    const variables = this.parsePromptVariables(text);
    if (variables.length > 0) {
      score += variables.length * 10;
      reasons.push(`Contains ${variables.length} variables`);
    }

    // Check for repeaters
    const repeaters = this.extractRepeaters(text);
    if (repeaters.length > 0) {
      score += repeaters.length * 15;
      reasons.push(`Contains ${repeaters.length} repeater fields`);
    }

    // Check for prompt-like patterns
    const promptPatterns = [
      /act as|you are a|role.*:/i,
      /context:|instructions:|task:/i,
      /please|help me|can you/i,
    ];

    promptPatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        score += 5;
        reasons.push("Contains prompt-like language");
      }
    });

    // Length factor
    if (text.length > 50 && text.length < 2000) {
      score += 5;
      reasons.push("Appropriate length for prompt");
    }

    const confidence = Math.min(score, 100);
    const isPrompt = confidence > 20;

    return { isPrompt, confidence, reasons, variables, repeaters };
  },
};

// Log successful module loading
if (window.SuperPromptCoreUtils?.spPostLog) {
  window.SuperPromptCoreUtils.spPostLog(
    "info",
    "PromptManager module loaded successfully"
  );
} else if (console?.log) {
  devLog("✅ SuperPrompt PromptManager module loaded");
}
