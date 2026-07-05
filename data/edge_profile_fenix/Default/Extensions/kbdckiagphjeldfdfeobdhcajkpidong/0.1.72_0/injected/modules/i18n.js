/**
 * SuperPrompt Internationalization Module
 * Language management and translation system
 * Extracted from chat-gpt-page-listener.js for better maintainability
 */

(function () {
  "use strict";

  // Prevent multiple initialization
  if (window.SuperPromptI18n) {
    return;
  }

  // Only log module loading in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog("[SP-I18n] Initializing i18n module...");
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                           LANGUAGE DETECTION                           ██
  // ██████████████████████████████████████████████████████████████████████████████

  function spGetLang() {
    try {
      const l = localStorage.getItem("superprompt-language");
      return l === "nl" ? "nl" : l === "fr" ? "fr" : "en";
    } catch {}
    try {
      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("nl")) return "nl";
      if (nav.startsWith("fr")) return "fr";
      return "en";
    } catch {}
    return "en";
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                            TRANSLATIONS                                ██
  // ██████████████████████████████████████████████████████████████████████████████

  const spI18n = {
    en: {
      // Notes System
      notes: "Notes",
      addNote: "Add Note",
      editNote: "Edit Note",
      title: "Title",
      content: "Content",
      enterNoteTitle: "Enter note title...",
      writeYourNote: "Write your note here...",
      autoSaved: "Auto-saved",
      cancel: "Cancel",
      save: "Save",
      update: "Update",

      // Chat Categories
      searchChats: "Search chats...",
      clearSearch: "Clear search",
      chatCategories: "Chat Categories",
      readOnly: "read-only",
      collapseAll: "Collapse All",
      uncollapseAll: "Uncollapse All",

      // Sidebar Settings
      sidebarSettings: "Sidebar settings",
      showFavWhenEmpty: "Show Favorites when empty",
      showArchivedWhenEmpty: "Show Archived when empty",
      unassignedMaxHeightLabel: "Unassigned max height (px, 0 = no limit)",
      unassignedLabel: (n) => `Unassigned (${n})`,

      // Loading States
      loadingConversation: "Loading conversation…",
      restoringLargePrev: (s) =>
        `Restoring large conversation (~${s}s previously)…`,
      elapsedSuffix: (s) => `${s}s elapsed`,
      characters: (c) => `${c} characters`,

      // Prompts System
      allPrompts: "All Prompts",
      favoritePrompts: "Favorite Prompts",
      addNewPrompt: "+ Add New Prompt",
      searchPrompts: "Search prompts...",
      noPrompts: "No prompts found",
      showAllPrompts: "Show all prompts",
      showOnlyFavorites: "Show only favorites",
      noFavoritePromptsFor: (term) => `No favorite prompts found for "${term}"`,
      noFavoritePrompts: "No favorite prompts found",
      noPromptsFor: (term) => `No prompts found for "${term}"`,
      noSavedPrompts: "No saved prompts found",

      // Print System
      print: "Print",
      printConversation: "Print conversation",
      printLoading: "Preparing print page...",

      // Vault System
      vault: "Vault",
      openVault: "Open Vault",
      closeVault: "Close Vault",
      selectPrompts: "Select Prompts",
      insertSelected: "Insert Selected",

      // Audio System
      audioEnabled: "Audio enabled",
      audioDisabled: "Audio disabled",

      // Sidebar Toggle
      switchToDefaultView: "Switch to default view",
      switchToWideView: "Switch to alternative view",
      currentWide: "Current: Wide",
      currentDefault: "Current: Default",

      // Error Messages
      errorLoading: "Error loading",
      errorSaving: "Error saving",
      tryAgain: "Try again",

      // Generic Actions
      close: "Close",
      open: "Open",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      loading: "Loading...",
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Information",
    },

    nl: {
      // Notes System
      notes: "Notities",
      addNote: "Notitie toevoegen",
      editNote: "Notitie bewerken",
      title: "Titel",
      content: "Inhoud",
      enterNoteTitle: "Voer een notitietitel in...",
      writeYourNote: "Schrijf hier je notitie...",
      autoSaved: "Automatisch opgeslagen",
      cancel: "Annuleren",
      save: "Opslaan",
      update: "Bijwerken",

      // Chat Categories
      searchChats: "Zoek chats...",
      clearSearch: "Zoekopdracht wissen",
      chatCategories: "Chatcategorieën",
      readOnly: "alleen-lezen",
      collapseAll: "Alles inklappen",
      uncollapseAll: "Alles uitklappen",

      // Sidebar Settings
      sidebarSettings: "Zijbalkinstellingen",
      showFavWhenEmpty: "Toon favorieten wanneer leeg",
      showArchivedWhenEmpty: "Toon gearchiveerd wanneer leeg",
      unassignedMaxHeightLabel:
        "Niet-toegewezen max-hoogte (px, 0 = geen limiet)",
      unassignedLabel: (n) => `Niet-toegewezen (${n})`,

      // Loading States
      loadingConversation: "Gesprek laden…",
      restoringLargePrev: (s) => `Groot gesprek herstellen (~${s}s eerder)…`,
      elapsedSuffix: (s) => `${s}s verlopen`,
      characters: (c) => `${c} tekens`,

      // Prompts System
      allPrompts: "Alle Prompts",
      favoritePrompts: "Favoriete Prompts",
      addNewPrompt: "+ Nieuwe Prompt Toevoegen",
      searchPrompts: "Zoek prompts...",
      noPrompts: "Geen prompts gevonden",
      showAllPrompts: "Toon alle prompts",
      showOnlyFavorites: "Toon alleen favorieten",
      noFavoritePromptsFor: (term) =>
        `Geen favoriete prompts gevonden voor "${term}"`,
      noFavoritePrompts: "Geen favoriete prompts gevonden",
      noPromptsFor: (term) => `Geen prompts gevonden voor "${term}"`,
      noSavedPrompts: "Geen opgeslagen prompts gevonden",

      // Print System
      print: "Afdrukken",
      printConversation: "Conversatie afdrukken",
      printLoading: "Print pagina voorbereiden...",

      // Vault System
      vault: "Kluis",
      openVault: "Kluis openen",
      closeVault: "Kluis sluiten",
      selectPrompts: "Prompts selecteren",
      insertSelected: "Geselecteerde invoegen",

      // Audio System
      audioEnabled: "Audio ingeschakeld",
      audioDisabled: "Audio uitgeschakeld",

      // Sidebar Toggle
      switchToDefaultView: "Naar standaardweergave",
      switchToWideView: "Naar alternatieve weergave",
      currentWide: "Huidige: Breed",
      currentDefault: "Huidige: Standaard",

      // Error Messages
      errorLoading: "Fout bij laden",
      errorSaving: "Fout bij opslaan",
      tryAgain: "Probeer opnieuw",

      // Generic Actions
      close: "Sluiten",
      open: "Openen",
      edit: "Bewerken",
      delete: "Verwijderen",
      confirm: "Bevestigen",
      loading: "Laden...",
      success: "Succes",
      error: "Fout",
      warning: "Waarschuwing",
      info: "Informatie",
    },

    fr: {
      // Notes System
      notes: "Notes",
      addNote: "Ajouter une note",
      editNote: "Modifier la note",
      title: "Titre",
      content: "Contenu",
      enterNoteTitle: "Entrez le titre de la note...",
      writeYourNote: "Écrivez votre note ici...",
      autoSaved: "Enregistrement automatique",
      cancel: "Annuler",
      save: "Enregistrer",
      update: "Mettre à jour",

      // Chat Categories
      searchChats: "Rechercher des conversations...",
      clearSearch: "Effacer la recherche",
      chatCategories: "Catégories de conversation",
      readOnly: "lecture seule",
      collapseAll: "Tout réduire",
      uncollapseAll: "Tout déplier",

      // Sidebar Settings
      sidebarSettings: "Paramètres de la barre latérale",
      showFavWhenEmpty: "Afficher les favoris lorsque vide",
      showArchivedWhenEmpty: "Afficher les archivés lorsque vide",
      unassignedMaxHeightLabel:
        "Hauteur max non assignés (px, 0 = pas de limite)",
      unassignedLabel: (n) => `Non assignés (${n})`,

      // Loading States
      loadingConversation: "Chargement de la conversation…",
      restoringLargePrev: (s) =>
        `Restauration d'une grande conversation (~${s}s précédemment)…`,
      elapsedSuffix: (s) => `${s}s écoulées`,
      characters: (c) => `${c} caractères`,

      // Prompts System
      allPrompts: "Tous les prompts",
      favoritePrompts: "Prompts favoris",
      addNewPrompt: "+ Ajouter un nouveau prompt",
      searchPrompts: "Rechercher des prompts...",
      noPrompts: "Aucun prompt trouvé",
      showAllPrompts: "Afficher tous les prompts",
      showOnlyFavorites: "Afficher uniquement les favoris",
      noFavoritePromptsFor: (term) =>
        `Aucun prompt favori trouvé pour "${term}"`,
      noFavoritePrompts: "Aucun prompt favori trouvé",
      noPromptsFor: (term) => `Aucun prompt trouvé pour "${term}"`,
      noSavedPrompts: "Aucun prompt enregistré trouvé",

      // Print System
      print: "Imprimer",
      printConversation: "Imprimer la conversation",
      printLoading: "Préparation de la page d'impression...",

      // Vault System
      vault: "Coffre",
      openVault: "Ouvrir le coffre",
      closeVault: "Fermer le coffre",
      selectPrompts: "Sélectionner les prompts",
      insertSelected: "Insérer la sélection",

      // Audio System
      audioEnabled: "Audio activé",
      audioDisabled: "Audio désactivé",

      // Sidebar Toggle
      switchToDefaultView: "Passer à la vue par défaut",
      switchToWideView: "Passer à la vue alternative",
      currentWide: "Actuel: Large",
      currentDefault: "Actuel: Par défaut",

      // Error Messages
      errorLoading: "Erreur de chargement",
      errorSaving: "Erreur d'enregistrement",
      tryAgain: "Réessayer",

      // Generic Actions
      close: "Fermer",
      open: "Ouvrir",
      edit: "Modifier",
      delete: "Supprimer",
      confirm: "Confirmer",
      loading: "Chargement...",
      success: "Succès",
      error: "Erreur",
      warning: "Avertissement",
      info: "Information",
    },
  };

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                         TRANSLATION FUNCTION                          ██
  // ██████████████████████████████████████████████████████████████████████████████

  function t(key, arg) {
    const lang = spGetLang();
    const dict = spI18n[lang] || spI18n.en;
    const v = dict[key];
    if (typeof v === "function") return v(arg);
    return v || key;
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                         LANGUAGE MANAGEMENT                            ██
  // ██████████████████████████████████████████████████████████████████████████████

  function setLanguage(lang) {
    if (lang !== "en" && lang !== "nl" && lang !== "fr") {
      devWarn("[SP-I18n] Invalid language:", lang, "defaulting to en");
      lang = "en";
    }

    try {
      localStorage.setItem("superprompt-language", lang);
      devLog("[SP-I18n] Language set to:", lang);

      // Notify other modules of language change
      window.dispatchEvent(
        new CustomEvent("superprompt-language-changed", {
          detail: { language: lang },
        })
      );

      return true;
    } catch (error) {
      devError("[SP-I18n] Failed to set language:", error);
      return false;
    }
  }

  function getCurrentLanguage() {
    return spGetLang();
  }

  function getSupportedLanguages() {
    return Object.keys(spI18n);
  }

  function addTranslations(lang, translations) {
    if (!spI18n[lang]) {
      spI18n[lang] = {};
    }

    Object.assign(spI18n[lang], translations);
    devLog(`[SP-I18n] Added translations for language: ${lang}`);
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                           MODULE EXPORT                                ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Export the module API
  window.SuperPromptI18n = {
    // Core translation function
    t,

    // Language management
    spGetLang,
    getCurrentLanguage,
    setLanguage,
    getSupportedLanguages,

    // Translation management
    addTranslations,

    // Direct access to translation dictionaries (read-only)
    getTranslations: (lang) => {
      return spI18n[lang] ? { ...spI18n[lang] } : null;
    },

    // Check if a key exists
    hasTranslation: (key, lang = null) => {
      const targetLang = lang || spGetLang();
      const dict = spI18n[targetLang] || spI18n.en;
      return dict.hasOwnProperty(key);
    },
  };

  // Make global shortcuts available for backward compatibility
  window.t = t;
  window.spGetLang = spGetLang;

  // Only log detailed info in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog("✅ [SP-I18n] i18n module initialized successfully");
    devLog(`[SP-I18n] Current language: ${spGetLang()}`);
    devLog(
      `[SP-I18n] Supported languages: ${getSupportedLanguages().join(", ")}`
    );
  }
})();
