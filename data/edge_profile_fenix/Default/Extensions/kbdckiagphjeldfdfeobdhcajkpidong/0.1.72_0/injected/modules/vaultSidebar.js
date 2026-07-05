/**
 * ?? VAULT SIDEBAR - SIBLING APPROACH
 *
 * Purpose: Show vault as a sibling next to #history (not inside it)
 * Simply hide #history and show our sidebar, no DOM fighting needed
 */

(function () {
  "use strict";

  // ============================================================================
  // TRANSLATIONS (simple i18n for injected context)
  // ============================================================================

  const translations = {
    en: {
      openNote: "Open note",
      openProject: "Open project",
      favoriteLimitTitle: "Favorite Limit Reached",
      favoriteLimitMessage:
        "You have reached the maximum number of favorite conversations.",
      favoriteLimitDetails:
        "AIWorkspace Free allows up to 3 favorite conversations. To add more favorites, please remove an existing favorite first or upgrade to AIWorkspace Pro.",
      toggleFavoriteErrorTitle: "Failed to Toggle Favorite",
      toggleFavoriteErrorMessage:
        "An error occurred while trying to favorite this conversation.",
      exportProTitle: "Pro Feature",
      exportProMessage: "Export is only available for Pro users.",
      exportProDetails:
        "Upgrade to AIWorkspace Pro to export your conversations in Markdown, JSON, or plain text format.",
      exportErrorTitle: "Export Error",
      exportErrorMessage: "Failed to export chat. Please try again.",
      // Context menu items
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      archive: "Archive",
      unarchive: "Unarchive",
      removeFromFolder: "Remove from folder",
      openNewTab: "Open (new tab)",
      preview: "Preview",
      renameChat: "Rename chat",
      moveToCategory: "Move to category",
      moveToProject: "Move to project",
      copyLink: "Copy link",
      shareChat: "Share chat",
      printChat: "Print chat",
      exportChat: "Export chat",
      referenceChat: "Reference this chat",
      referenceChatProTitle: "Pro Feature",
      referenceChatProMessage:
        "Reference chat is only available for Pro users.",
      referenceChatProDetails:
        "Upgrade to AIWorkspace Pro to attach conversation exports as references to your current chat.",
      referenceChatError: "Failed to attach chat reference. Please try again.",
      referenceChatSuccess: "Chat reference added as attachment!",
      deleteChat: "Delete chat",
      unlinkFromWorkspace: "Unlink from workspace",
      // Category context menu
      renameCategory: "Rename category",
      changeColor: "Change color",
      createSubfolder: "Create subfolder",
      deleteCategory: "Delete category",
      deleteChats: "Delete chats",
      unfavoriteAllChats: "Unfavorite all chats",
      // UI elements
      searchConversations: "Search conversations...",
      collapseAll: "Collapse All",
      expandAll: "Expand All",
      collapseAllFolders: "Collapse all folders",
      expandAllFolders: "Expand all folders",
      switchWorkspace: "Switch workspace",
      toolsAndGpts: "Tools & GPTs",
      uncategorized: "Uncategorized",
      loadMore: "Load More",
      remaining: "remaining",
      noChatsTitle: "No chats linked yet",
      noChatsDescription:
        'Link your first conversation to this workspace or open "My Workspaces" to connect an existing workspace instantly.',
      openWorkspacesCta: "Open My Workspaces",
    },
    nl: {
      openNote: "Open notitie",
      openProject: "Open project",
      favoriteLimitTitle: "Favorietenlimiet Bereikt",
      favoriteLimitMessage:
        "Je hebt het maximum aantal favoriete gesprekken bereikt.",
      favoriteLimitDetails:
        "AIWorkspace Free staat maximaal 3 favoriete gesprekken toe. Om meer favorieten toe te voegen, verwijder eerst een bestaande favoriet of upgrade naar AIWorkspace Pro.",
      toggleFavoriteErrorTitle: "Favoriet Toevoegen Mislukt",
      toggleFavoriteErrorMessage:
        "Er is een fout opgetreden bij het toevoegen van deze conversatie aan favorieten.",
      exportProTitle: "Pro Functie",
      exportProMessage: "Export is alleen beschikbaar voor Pro gebruikers.",
      exportProDetails:
        "Upgrade naar AIWorkspace Pro om je gesprekken te exporteren in Markdown, JSON of platte tekst formaat.",
      exportErrorTitle: "Export Fout",
      exportErrorMessage: "Exporteren van chat mislukt. Probeer het opnieuw.",
      // Context menu items
      addToFavorites: "Toevoegen aan favorieten",
      removeFromFavorites: "Verwijderen uit favorieten",
      archive: "Archiveren",
      unarchive: "Dearchiveren",
      removeFromFolder: "Verwijderen uit map",
      openNewTab: "Openen (nieuw tabblad)",
      preview: "Voorbeeld",
      renameChat: "Chat hernoemen",
      moveToCategory: "Verplaatsen naar categorie",
      moveToProject: "Verplaatsen naar project",
      copyLink: "Link kopiëren",
      shareChat: "Chat delen",
      printChat: "Chat afdrukken",
      exportChat: "Chat exporteren",
      referenceChat: "Refereer deze chat",
      referenceChatProTitle: "Pro Functie",
      referenceChatProMessage:
        "Refereer chat is alleen beschikbaar voor Pro gebruikers.",
      referenceChatProDetails:
        "Upgrade naar AIWorkspace Pro om conversatie-exports als referenties toe te voegen aan je huidige chat.",
      referenceChatError:
        "Kon chatreferentie niet toevoegen. Probeer het opnieuw.",
      referenceChatSuccess: "Chatreferentie toegevoegd als bijlage!",
      deleteChat: "Chat verwijderen",
      unlinkFromWorkspace: "Ontkoppelen van workspace",
      // Category context menu
      renameCategory: "Categorie hernoemen",
      changeColor: "Kleur wijzigen",
      createSubfolder: "Submap aanmaken",
      deleteCategory: "Categorie verwijderen",
      deleteChats: "Chats verwijderen",
      // UI elements
      searchConversations: "Gesprekken zoeken...",
      collapseAll: "Alles Inklappen",
      expandAll: "Alles Uitklappen",
      collapseAllFolders: "Alle mappen inklappen",
      expandAllFolders: "Alle mappen uitklappen",
      switchWorkspace: "Wissel van werkruimte",
      toolsAndGpts: "Tools & GPT's",
      uncategorized: "Ongecategoriseerd",
      loadMore: "Meer Laden",
      remaining: "resterend",
      noChatsTitle: "Nog geen chats gekoppeld",
      noChatsDescription:
        'Koppel je eerste conversatie aan deze workspace of klik hieronder om "My Workspaces" te openen en meteen een vault te linken.',
      openWorkspacesCta: "Open My Workspaces",
    },
    de: {
      openNote: "Notiz öffnen",
      openProject: "Projekt öffnen",
      favoriteLimitTitle: "Favoritenlimit Erreicht",
      favoriteLimitMessage:
        "Sie haben die maximale Anzahl an Favoriten-Gesprächen erreicht.",
      favoriteLimitDetails:
        "AIWorkspace Free erlaubt bis zu 3 Favoriten-Gespräche. Um weitere Favoriten hinzuzufügen, entfernen Sie bitte zunächst einen vorhandenen Favoriten oder upgraden Sie auf AIWorkspace Pro.",
      toggleFavoriteErrorTitle: "Favorit Hinzufügen Fehlgeschlagen",
      toggleFavoriteErrorMessage:
        "Beim Hinzufügen dieser Unterhaltung zu den Favoriten ist ein Fehler aufgetreten.",
      exportProTitle: "Pro-Funktion",
      exportProMessage: "Export ist nur für Pro-Benutzer verfügbar.",
      exportProDetails:
        "Upgraden Sie auf AIWorkspace Pro, um Ihre Gespräche im Markdown-, JSON- oder Textformat zu exportieren.",
      exportErrorTitle: "Exportfehler",
      exportErrorMessage:
        "Chat konnte nicht exportiert werden. Bitte versuchen Sie es erneut.",
      // Context menu items
      addToFavorites: "Zu Favoriten hinzufügen",
      removeFromFavorites: "Aus Favoriten entfernen",
      archive: "Archivieren",
      unarchive: "Dearchivieren",
      removeFromFolder: "Aus Ordner entfernen",
      openNewTab: "Öffnen (neuer Tab)",
      preview: "Vorschau",
      renameChat: "Chat umbenennen",
      moveToCategory: "In Kategorie verschieben",
      moveToProject: "In Projekt verschieben",
      copyLink: "Link kopieren",
      shareChat: "Chat teilen",
      printChat: "Chat drucken",
      exportChat: "Chat exportieren",
      referenceChat: "Diesen Chat referenzieren",
      referenceChatProTitle: "Pro-Funktion",
      referenceChatProMessage:
        "Chat referenzieren ist nur für Pro-Benutzer verfügbar.",
      referenceChatProDetails:
        "Upgraden Sie auf AIWorkspace Pro, um Konversationsexporte als Referenzen zu Ihrem aktuellen Chat hinzuzufügen.",
      referenceChatError:
        "Chat-Referenz konnte nicht hinzugefügt werden. Bitte erneut versuchen.",
      referenceChatSuccess: "Chat-Referenz als Anhang hinzugefügt!",
      deleteChat: "Chat löschen",
      unlinkFromWorkspace: "Von Workspace trennen",
      // Category context menu
      renameCategory: "Kategorie umbenennen",
      changeColor: "Farbe ändern",
      createSubfolder: "Unterordner erstellen",
      deleteCategory: "Kategorie löschen",
      deleteChats: "Chats löschen",
      // UI elements
      searchConversations: "Gespräche suchen...",
      collapseAll: "Alle Einklappen",
      expandAll: "Alle Ausklappen",
      collapseAllFolders: "Alle Ordner einklappen",
      expandAllFolders: "Alle Ordner ausklappen",
      switchWorkspace: "Arbeitsbereich wechseln",
      toolsAndGpts: "Tools & GPTs",
      uncategorized: "Unkategorisiert",
      loadMore: "Mehr Laden",
      remaining: "verbleibend",
      noChatsTitle: "Noch keine Chats verknüpft",
      noChatsDescription:
        'Verknüpfe deine erste Unterhaltung mit diesem Workspace oder öffne unten "My Workspaces", um sofort eine bestehende Vault zu verbinden.',
      openWorkspacesCta: "My Workspaces öffnen",
    },
    fr: {
      openNote: "Ouvrir la note",
      openProject: "Ouvrir le projet",
      favoriteLimitTitle: "Limite de Favoris Atteinte",
      favoriteLimitMessage:
        "Vous avez atteint le nombre maximum de conversations favorites.",
      favoriteLimitDetails:
        "AIWorkspace Free autorise jusqu'à 3 conversations favorites. Pour ajouter plus de favoris, veuillez d'abord supprimer un favori existant ou passer à AIWorkspace Pro.",
      toggleFavoriteErrorTitle: "Échec de l'Ajout aux Favoris",
      toggleFavoriteErrorMessage:
        "Une erreur s'est produite lors de l'ajout de cette conversation aux favoris.",
      exportProTitle: "Fonctionnalité Pro",
      exportProMessage:
        "L'export est uniquement disponible pour les utilisateurs Pro.",
      exportProDetails:
        "Passez à AIWorkspace Pro pour exporter vos conversations au format Markdown, JSON ou texte brut.",
      exportErrorTitle: "Erreur d'Export",
      exportErrorMessage: "Échec de l'export du chat. Veuillez réessayer.",
      // Context menu items
      addToFavorites: "Ajouter aux favoris",
      removeFromFavorites: "Retirer des favoris",
      archive: "Archiver",
      unarchive: "Désarchiver",
      removeFromFolder: "Retirer du dossier",
      openNewTab: "Ouvrir (nouvel onglet)",
      preview: "Aperçu",
      renameChat: "Renommer le chat",
      moveToCategory: "Déplacer vers la catégorie",
      moveToProject: "Déplacer vers le projet",
      copyLink: "Copier le lien",
      shareChat: "Partager le chat",
      printChat: "Imprimer le chat",
      exportChat: "Exporter le chat",
      referenceChat: "Référencer ce chat",
      referenceChatProTitle: "Fonction Pro",
      referenceChatProMessage:
        "Référencer le chat est uniquement disponible pour les utilisateurs Pro.",
      referenceChatProDetails:
        "Passez à AIWorkspace Pro pour ajouter des exports de conversation comme références à votre chat actuel.",
      referenceChatError:
        "Échec de l'ajout de la référence du chat. Veuillez réessayer.",
      referenceChatSuccess: "Référence du chat ajoutée en pièce jointe !",
      deleteChat: "Supprimer le chat",
      unlinkFromWorkspace: "Dissocier de l'espace de travail",
      // Category context menu
      renameCategory: "Renommer la catégorie",
      changeColor: "Changer la couleur",
      createSubfolder: "Créer un sous-dossier",
      deleteCategory: "Supprimer la catégorie",
      deleteChats: "Supprimer les chats",
      // UI elements
      searchConversations: "Rechercher des conversations...",
      collapseAll: "Tout Réduire",
      expandAll: "Tout Développer",
      collapseAllFolders: "Réduire tous les dossiers",
      expandAllFolders: "Développer tous les dossiers",
      switchWorkspace: "Changer d'espace de travail",
      toolsAndGpts: "Outils & GPT",
      uncategorized: "Non catégorisé",
      loadMore: "Charger Plus",
      remaining: "restant",
      noChatsTitle: "Aucune conversation liée",
      noChatsDescription:
        'Liez votre première conversation à cet espace de travail ou ouvrez "My Workspaces" ci-dessous pour connecter immédiatement un coffre existant.',
      openWorkspacesCta: "Ouvrir My Workspaces",
    },
    es: {
      openNote: "Abrir nota",
      openProject: "Abrir proyecto",
      favoriteLimitTitle: "Límite de Favoritos Alcanzado",
      favoriteLimitMessage:
        "Has alcanzado el número máximo de conversaciones favoritas.",
      favoriteLimitDetails:
        "AIWorkspace Free permite hasta 3 conversaciones favoritas. Para agregar más favoritos, elimina primero un favorito existente o actualiza a AIWorkspace Pro.",
      toggleFavoriteErrorTitle: "Error al Agregar Favorito",
      toggleFavoriteErrorMessage:
        "Ocurrió un error al intentar agregar esta conversación a favoritos.",
      exportProTitle: "Función Pro",
      exportProMessage:
        "La exportación solo está disponible para usuarios Pro.",
      exportProDetails:
        "Actualiza a AIWorkspace Pro para exportar tus conversaciones en formato Markdown, JSON o texto plano.",
      exportErrorTitle: "Error de Exportación",
      exportErrorMessage:
        "Error al exportar el chat. Por favor, inténtalo de nuevo.",
      // Context menu items
      addToFavorites: "Agregar a favoritos",
      removeFromFavorites: "Quitar de favoritos",
      archive: "Archivar",
      unarchive: "Desarchivar",
      removeFromFolder: "Quitar de la carpeta",
      openNewTab: "Abrir (nueva pestaña)",
      preview: "Vista previa",
      renameChat: "Renombrar chat",
      moveToCategory: "Mover a categoría",
      moveToProject: "Mover a proyecto",
      copyLink: "Copiar enlace",
      shareChat: "Compartir chat",
      printChat: "Imprimir chat",
      exportChat: "Exportar chat",
      referenceChat: "Referenciar este chat",
      referenceChatProTitle: "Función Pro",
      referenceChatProMessage:
        "Referenciar chat solo está disponible para usuarios Pro.",
      referenceChatProDetails:
        "Actualiza a AIWorkspace Pro para agregar exportaciones de conversación como referencias a tu chat actual.",
      referenceChatError:
        "Error al agregar la referencia del chat. Por favor, inténtalo de nuevo.",
      referenceChatSuccess: "¡Referencia del chat agregada como adjunto!",
      deleteChat: "Eliminar chat",
      unlinkFromWorkspace: "Desvincular del espacio de trabajo",
      // Category context menu
      renameCategory: "Renombrar categoría",
      changeColor: "Cambiar color",
      createSubfolder: "Crear subcarpeta",
      deleteCategory: "Eliminar categoría",
      deleteChats: "Eliminar chats",
      // UI elements
      searchConversations: "Buscar conversaciones...",
      collapseAll: "Contraer Todo",
      expandAll: "Expandir Todo",
      collapseAllFolders: "Contraer todas las carpetas",
      expandAllFolders: "Expandir todas las carpetas",
      switchWorkspace: "Cambiar espacio de trabajo",
      toolsAndGpts: "Herramientas y GPTs",
      uncategorized: "Sin categoría",
      loadMore: "Cargar Más",
      remaining: "restantes",
      noChatsTitle: "Aún no hay chats vinculados",
      noChatsDescription:
        'Vincula tu primera conversación a este espacio de trabajo o abre "My Workspaces" para conectar una bóveda existente al instante.',
      openWorkspacesCta: "Abrir My Workspaces",
    },
  };

  // Detect user's language preference (respects settings, falls back to browser language, then 'en')
  function getTranslation(key) {
    // First check user's explicit language choice from settings
    let lang = "en";
    try {
      const userLang = localStorage.getItem("superprompt-language");
      if (userLang && translations[userLang]) {
        lang = userLang;
      } else {
        // Fallback to browser language
        const browserLang = navigator.language.split("-")[0]; // 'en-US' -> 'en'
        if (translations[browserLang]) {
          lang = browserLang;
        }
      }
    } catch (e) {
      // If localStorage fails, try browser language
      const browserLang = navigator.language.split("-")[0];
      if (translations[browserLang]) {
        lang = browserLang;
      }
    }

    const t = translations[lang] || translations.en;
    const result = t[key] || translations.en[key] || key;
    return result;
  }

  // ============================================================================
  // LUCIDE ICONS - SVG Helper Function
  // ============================================================================

  /**
   * Generate Lucide-style SVG icons
   * @param {string} iconName - Name of the icon
   * @param {number} size - Size in pixels (default: 16)
   * @param {string} color - Color (default: currentColor)
   * @returns {string} SVG markup
   */
  function getLucideIcon(iconName, size = 16, color = "currentColor") {
    const icons = {
      Star: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      StarOff: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.34 8.34 2 9.27l5 4.87L5.82 21 12 17.77 18.18 21l-.59-3.43"/><path d="M18.42 12.76 22 9.27l-6.91-1L12 2l-1.44 2.91"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
      Archive: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`,
      FolderMinus: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
      ExternalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
      Edit3: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
      FolderInput: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/><path d="M2 13h10"/><path d="m9 16 3-3-3-3"/></svg>`,
      Link: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
      Share2: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`,
      Printer: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>`,
      Trash2: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
      Palette: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="${color}"/><circle cx="17.5" cy="10.5" r=".5" fill="${color}"/><circle cx="8.5" cy="7.5" r=".5" fill="${color}"/><circle cx="6.5" cy="12.5" r=".5" fill="${color}"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
      FolderPlus: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
      FolderOpen: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>`,
      FolderKanban: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/></svg>`,
      ChevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
      Check: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
      Download: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
      FileText: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
      FileJson: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 12a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1 1 1 0 0 0-1 1v1a1 1 0 0 1-1 1"/></svg>`,
      File: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
      AlertCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      Info: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
      Quote: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/></svg>`,
      Eye: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    };

    return icons[iconName] || "";
  }

  // ============================================================================
  // THEME HELPER - Detect and return theme-aware colors
  // ============================================================================

  /**
   * Get theme-aware colors for context menu
   * @returns {object} Theme colors
   */
  function getThemeColors() {
    const htmlElement = document.documentElement;
    const colorScheme =
      htmlElement.style.colorScheme ||
      getComputedStyle(htmlElement).colorScheme ||
      "dark";
    const isDark = !colorScheme.includes("light");

    return {
      isDark,
      // Background colors - solid color with subtle gradient overlay
      menuBg: isDark ? "#1e1e1e" : "#ffffff",
      menuBgGradient: isDark
        ? "linear-gradient(135deg, rgb(26, 26, 26) 0%, rgb(45, 45, 45) 100%)"
        : "linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(249, 250, 251) 100%)",

      // Border colors (using accent color instead of teal)
      menuBorder: isDark
        ? "rgba(100, 116, 139, 0.3)"
        : "rgba(148, 163, 184, 0.4)",

      // Shadow colors
      menuShadow: isDark
        ? "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset"
        : "0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(148, 163, 184, 0.1) inset",

      // Text colors
      textColor: isDark ? "#e5e7eb" : "#1f2937",
      textDanger: isDark ? "#dc2626" : "#991b1b",

      // Divider
      dividerBg: isDark ? "rgba(71, 85, 105, 0.5)" : "rgba(203, 213, 225, 0.8)",

      // Hover backgrounds (neutral accent)
      hoverBg: isDark ? "rgba(51, 65, 85, 0.8)" : "rgba(241, 245, 249, 0.9)",

      hoverBgDanger: isDark
        ? "rgba(127, 29, 29, 0.4)"
        : "rgba(254, 202, 202, 0.5)",

      // Border accent on hover (transparent to remove left border)
      borderAccent: "transparent",

      borderDanger: "#ef4444",
    };
  }

  /**
   * Position context menu with collision detection
   * Opens menu above button if not enough space below
   * @param {HTMLElement} menu - The menu element to position
   * @param {HTMLElement} button - The trigger button
   * @param {HTMLElement} container - The container element (for relative positioning)
   * @param {object} options - Positioning options
   */
  function positionContextMenu(menu, button, container, options = {}) {
    const {
      gap = 4, // Gap between button and menu
      minBottomMargin = 20, // Minimum margin from bottom of viewport
      preferredPosition = "below", // 'below' or 'above'
    } = options;

    const btnRect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Wait for menu to be in DOM to get its height
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      const menuHeight = menuRect.height || 300; // fallback estimate
      const viewportHeight = window.innerHeight;

      // Calculate available space
      const spaceBelow = viewportHeight - btnRect.bottom - minBottomMargin;
      const spaceAbove = btnRect.top - minBottomMargin;

      // Determine if we should open above or below
      let openAbove = false;

      if (preferredPosition === "above") {
        openAbove = spaceAbove >= menuHeight || spaceAbove > spaceBelow;
      } else {
        // Prefer below, but open above if not enough space below
        openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      }

      // Calculate position
      if (openAbove) {
        // Position above the button
        const topOffset =
          btnRect.top -
          containerRect.top +
          container.scrollTop -
          menuHeight -
          gap;
        menu.style.top = `${topOffset}px`;
        menu.style.transformOrigin = "bottom center";
        menu.dataset.position = "above";
        // Update initial transform for upward animation
        menu.style.transform = "scale(0.92) translateY(8px)";
      } else {
        // Position below the button (default)
        const topOffset =
          btnRect.bottom - containerRect.top + container.scrollTop + gap;
        menu.style.top = `${topOffset}px`;
        menu.style.transformOrigin = "top center";
        menu.dataset.position = "below";
        // Keep downward animation
        menu.style.transform = "scale(0.92) translateY(-8px)";
      }

      // Trigger animation to final state
      requestAnimationFrame(() => {
        menu.style.opacity = "1";
        menu.style.transform = "scale(1) translateY(0)";
      });
    });
  }

  /**
   * Position fixed context menu with collision detection
   * For menus using position: fixed (like category menus)
   * @param {HTMLElement} menu - The menu element to position
   * @param {HTMLElement} button - The trigger button
   * @param {object} options - Positioning options
   */
  function positionFixedContextMenu(menu, button, options = {}) {
    const {
      gap = 4,
      minBottomMargin = 20,
      preferredPosition = "below",
    } = options;

    const btnRect = button.getBoundingClientRect();

    // Wait for menu to be in DOM to get its height
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      const menuHeight = menuRect.height || 300;
      const viewportHeight = window.innerHeight;

      // Calculate available space
      const spaceBelow = viewportHeight - btnRect.bottom - minBottomMargin;
      const spaceAbove = btnRect.top - minBottomMargin;

      // Determine if we should open above or below
      let openAbove = false;

      if (preferredPosition === "above") {
        openAbove = spaceAbove >= menuHeight || spaceAbove > spaceBelow;
      } else {
        openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      }

      // Calculate position (fixed positioning uses viewport coordinates)
      if (openAbove) {
        // Position above the button
        menu.style.top = `${btnRect.top - menuHeight - gap}px`;
        menu.style.transformOrigin = "bottom center";
        menu.dataset.position = "above";
        // Update initial transform for upward animation
        menu.style.transform = "scale(0.92) translateY(8px)";
      } else {
        // Position below the button
        menu.style.top = `${btnRect.bottom + gap}px`;
        menu.style.transformOrigin = "top center";
        menu.dataset.position = "below";
        // Keep downward animation
        menu.style.transform = "scale(0.92) translateY(-8px)";
      }

      // Trigger animation to final state
      requestAnimationFrame(() => {
        menu.style.opacity = "1";
        menu.style.transform = "scale(1) translateY(0)";
      });
    });
  }

  /**
   * Get theme-aware colors for dialogs
   * @returns {object} Dialog theme colors
   */
  function getDialogThemeColors() {
    const htmlElement = document.documentElement;
    const colorScheme =
      htmlElement.style.colorScheme ||
      getComputedStyle(htmlElement).colorScheme ||
      "dark";
    const isDark = !colorScheme.includes("light");

    return {
      isDark,
      // Overlay
      overlayBg: "rgba(0, 0, 0, 0.75)",

      // Dialog backgrounds
      dialogBg: isDark
        ? "linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)"
        : "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",

      dialogShadow: isDark
        ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
        : "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(20, 184, 166, 0.1) inset",

      // Text colors
      titleColor: isDark ? "#e5e7eb" : "#1f2937",
      textColor: isDark ? "#d1d5db" : "#4b5563",
      textMuted: isDark ? "#9ca3af" : "#6b7280",

      // Accent color (for Move to Category dialog)
      tealHeader: isDark
        ? "linear-gradient(135deg, #14b8a6 0%, #0d9488 45%, rgba(255,255,255,0.08) 100%)"
        : "linear-gradient(135deg, #14b8a6 0%, #0d9488 45%, rgba(255,255,255,0.2) 100%)",
      tealBorder: "rgba(20, 184, 166, 0.3)",
      tealIconBg: isDark
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(255, 255, 255, 0.3)",
      tealText: "#14b8a6", // Accent color for icons and radio buttons
      tealSelectBg: "rgba(20, 184, 166, 0.1)",
      tealItemHoverBg: "rgba(20, 184, 166, 0.1)",
      tealItemBorder: "rgba(20, 184, 166, 0.3)",

      // Red accent (for Delete dialog)
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

      // Info box (warning/info)
      infoBg: isDark ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)",
      infoBorder: isDark
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(245, 158, 11, 0.35)",
      infoText: "#fbbf24",

      // Buttons
      cancelBtnBg: isDark ? "#374151" : "#e5e7eb",
      cancelBtnBorder: isDark ? "#4b5563" : "#d1d5db",
      cancelBtnText: isDark ? "#e5e7eb" : "#374151",
      cancelBtnHoverBg: isDark ? "#4b5563" : "#d1d5db",

      confirmBtnBg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
      confirmBtnBorder: "rgba(20, 184, 166, 0.3)",
      confirmBtnShadow: "0 2px 8px rgba(20, 184, 166, 0.3)",
      confirmBtnHoverShadow: "0 4px 12px rgba(20, 184, 166, 0.4)",

      deleteBtnBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      deleteBtnBorder: "rgba(220, 38, 38, 0.3)",
      deleteBtnShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
      deleteBtnHoverShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",

      // Borders
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      footerBg: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.03)",

      // Category item
      categoryItemBg: isDark
        ? "rgba(255, 255, 255, 0.02)"
        : "rgba(0, 0, 0, 0.02)",
    };
  }

  // ============================================================================
  // HELPER: Convert hex color to RGB values for use in rgba()
  // ============================================================================

  function hexToRgb(hex) {
    if (!hex) return null;
    // Remove # if present
    hex = hex.replace(/^#/, "");
    // Handle shorthand hex (e.g., #fff)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return `${r}, ${g}, ${b}`;
  }

  // ============================================================================
  // HELPER: Resolve SuperPrompt accent variables (page-injected context)
  // ============================================================================

  function resolveSuperPromptAccentVars() {
    // Prefer the same source as React dialogs: computed CSS vars from the
    // SuperPrompt shadow-root/theme targets. This supports ALL accent IDs,
    // including Pro-only colors (ruby/crimson/etc.) and future additions.
    try {
      const candidates = [];

      const host = document.querySelector("#superprompt-root");
      if (host && host.shadowRoot) {
        const inShadow =
          host.shadowRoot.querySelector("[data-superprompt]") ||
          host.shadowRoot.querySelector("[data-react-root]") ||
          host.shadowRoot.querySelector("[data-superprompt-app]");
        if (inShadow) candidates.push(inShadow);
      }

      try {
        (window.superpromptThemeTargets ?? []).forEach((t) => {
          if (t && t.isConnected) candidates.push(t);
        });
      } catch {
        // ignore
      }

      const el = candidates.find(Boolean);
      if (el) {
        const cs = getComputedStyle(el);
        const primary = cs.getPropertyValue("--color-accent").trim();
        const hover = cs.getPropertyValue("--color-accent-hover").trim();
        const light = cs.getPropertyValue("--color-accent-light").trim();
        const shadow = cs.getPropertyValue("--color-accent-shadow").trim();

        if (primary) {
          return {
            primary,
            hover: hover || primary,
            light: light || "rgba(255, 255, 255, 0.08)",
            shadow: shadow || "rgba(0, 0, 0, 0.25)",
          };
        }
      }
    } catch {
      // ignore
    }

    // Fallback: try a small set of known IDs (better than nothing)
    const themePref = (() => {
      try {
        return localStorage.getItem("superprompt-theme");
      } catch {
        return null;
      }
    })();

    const isDark = themePref !== "light";
    const accentKey = (() => {
      try {
        return localStorage.getItem("sp_accent_color") || "teal";
      } catch {
        return "teal";
      }
    })();

    const map = {
      teal: isDark
        ? {
            primary: "#14b8a6",
            hover: "#0d9488",
            light: "rgba(20, 184, 166, 0.1)",
            shadow: "rgba(20, 184, 166, 0.3)",
          }
        : {
            primary: "#0d9488",
            hover: "#0f766e",
            light: "rgba(13, 148, 136, 0.08)",
            shadow: "rgba(13, 148, 136, 0.25)",
          },
      blue: isDark
        ? {
            primary: "#3b82f6",
            hover: "#2563eb",
            light: "rgba(59, 130, 246, 0.1)",
            shadow: "rgba(59, 130, 246, 0.3)",
          }
        : {
            primary: "#2563eb",
            hover: "#1d4ed8",
            light: "rgba(37, 99, 235, 0.08)",
            shadow: "rgba(37, 99, 235, 0.25)",
          },
      purple: isDark
        ? {
            primary: "#a855f7",
            hover: "#9333ea",
            light: "rgba(168, 85, 247, 0.1)",
            shadow: "rgba(168, 85, 247, 0.3)",
          }
        : {
            primary: "#9333ea",
            hover: "#7e22ce",
            light: "rgba(147, 51, 234, 0.08)",
            shadow: "rgba(147, 51, 234, 0.25)",
          },
      pink: isDark
        ? {
            primary: "#ec4899",
            hover: "#db2777",
            light: "rgba(236, 72, 153, 0.1)",
            shadow: "rgba(236, 72, 153, 0.3)",
          }
        : {
            primary: "#db2777",
            hover: "#be185d",
            light: "rgba(219, 39, 119, 0.08)",
            shadow: "rgba(219, 39, 119, 0.25)",
          },
      red: isDark
        ? {
            primary: "#ef4444",
            hover: "#dc2626",
            light: "rgba(239, 68, 68, 0.1)",
            shadow: "rgba(239, 68, 68, 0.3)",
          }
        : {
            primary: "#dc2626",
            hover: "#b91c1c",
            light: "rgba(220, 38, 38, 0.08)",
            shadow: "rgba(220, 38, 38, 0.25)",
          },
    };

    return map[accentKey] || map.teal;
  }

  function applySuperPromptAccentVars(target) {
    if (!target || !target.style || !target.style.setProperty) return;
    const vars = resolveSuperPromptAccentVars();
    target.style.setProperty("--color-accent", vars.primary);
    target.style.setProperty("--color-accent-hover", vars.hover);
    target.style.setProperty("--color-accent-light", vars.light);
    target.style.setProperty("--color-accent-shadow", vars.shadow);
  }

  // ============================================================================
  // WORKSPACE ICONS (SVG inline)
  // ============================================================================

  /**
   * Get SVG markup for a workspace icon by name
   * @param {string} iconName - Icon name from workspace constants
   * @param {string} color - Icon color (default: currentColor)
   * @param {number} size - Icon size (default: 16)
   * @returns {string} SVG markup
   */
  function getWorkspaceIconSvg(iconName, color = "currentColor", size = 16) {
    const icons = {
      briefcase:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      building:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>',
      document:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>',
      code: '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
      terminal:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" x2="20" y1="19" y2="19"></line></svg>',
      lightbulb:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>',
      palette:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>',
      camera:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>',
      music:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
      pencil:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>',
      graduation:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
      book: '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>',
      home: '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      heart:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>',
      dumbbell:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m2 6 4-4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path></svg>',
      message:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>',
      users:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      mail: '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>',
      globe:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
      calendar:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>',
      target:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
      trending:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>',
      rocket:
        '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>',
      star: '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      zap: '<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    };

    const svgTemplate = icons[iconName] || icons.briefcase; // fallback to briefcase
    return svgTemplate.replace(/SIZE/g, size).replace(/COLOR/g, color);
  }

  // ============================================================================
  // STATE
  // ============================================================================

  let sidebarContainer = null;
  let activeVaultData = null;
  const COLLAPSED_CATEGORIES_KEY = "sp-vault-collapsed-categories";

  // Lazy loading state for large categories
  const LAZY_LOAD_BATCH_SIZE = 25; // Load 25 chats at a time
  const lazyLoadState = new Map(); // categoryId -> { loadedCount, totalCount }

  // Search state
  let currentSearchTerm = "";
  let searchDebounceTimer = null;
  const SEARCH_DEBOUNCE_MS = 500; // Increased to 500ms for smoother typing

  // ============================================================================
  // BULK SELECTION STATE
  // ============================================================================
  let selectedChatIds = new Set(); // Currently selected chat IDs
  let bulkSelectionMode = false; // When true, show checkboxes for all chats
  let bulkToolbarContainer = null; // Floating toolbar element

  // ============================================================================
  // BULK SELECTION FUNCTIONS
  // ============================================================================

  /**
   * Update visibility of all checkboxes based on bulk selection mode
   */
  function updateAllCheckboxVisibility() {
    if (!sidebarContainer) return;

    const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");
    chatItems.forEach((chatItem) => {
      const chatId = chatItem.getAttribute("data-chat-id");
      const isSelected = selectedChatIds.has(chatId);
      const checkboxWrapper = chatItem.querySelector(
        ".sp-vault-chat-checkbox-wrapper",
      );

      if (checkboxWrapper) {
        const checkbox = checkboxWrapper.querySelector(
          ".sp-vault-chat-checkbox",
        );
        const visual = checkboxWrapper.querySelector(
          ".sp-vault-chat-checkbox-visual",
        );

        // Update checkbox state
        if (checkbox) {
          checkbox.checked = isSelected;
        }

        // Update visual state
        if (visual) {
          if (isSelected) {
            visual.style.background = "var(--color-accent, #14b8a6)";
            visual.style.borderColor = "var(--color-accent, #14b8a6)";
            visual.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            visual.innerHTML =
              '<svg width=\"10\" height=\"10\" viewBox=\"0 0 14 14\" fill=\"none\"><path d=\"M11.6667 3.5L5.25 9.91667L2.33333 7\" stroke=\"white\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>';
          } else {
            visual.style.background = "transparent";
            visual.style.borderColor = "rgba(255, 255, 255, 0.3)";
            visual.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
            visual.innerHTML = "";
          }
        }

        // Show/hide wrapper based on bulk mode
        if (bulkSelectionMode || isSelected) {
          checkboxWrapper.style.width = "20px";
          checkboxWrapper.style.opacity = "1";
        } else {
          checkboxWrapper.style.width = "0px";
          checkboxWrapper.style.opacity = "0";
        }
      }

      // Update background color for selected items
      if (isSelected) {
        chatItem.style.background =
          "rgba(var(--sp-accent-rgb, 20, 184, 166), 0.15)";
      } else if (!chatItem.hasAttribute("data-active-chat")) {
        chatItem.style.background = "transparent";
      }
    });
  }

  /**
   * Create/update/hide the floating bulk actions toolbar
   */
  function updateBulkToolbar() {
    const selectedCount = selectedChatIds.size;

    if (selectedCount === 0) {
      // Hide toolbar
      if (bulkToolbarContainer) {
        bulkToolbarContainer.style.opacity = "0";
        bulkToolbarContainer.style.transform = "translateX(20px)";
        setTimeout(() => {
          if (bulkToolbarContainer && selectedChatIds.size === 0) {
            bulkToolbarContainer.style.display = "none";
          }
        }, 200);
      }
      return;
    }

    // Create toolbar if it doesn't exist
    if (!bulkToolbarContainer) {
      createBulkToolbar();
    }

    // Update count
    const countEl = bulkToolbarContainer.querySelector(
      ".sp-bulk-toolbar-count",
    );
    if (countEl) {
      countEl.textContent = `${selectedCount} selected`;
    }

    // Show toolbar
    bulkToolbarContainer.style.display = "flex";
    requestAnimationFrame(() => {
      bulkToolbarContainer.style.opacity = "1";
      bulkToolbarContainer.style.transform = "translateX(0)";
    });
  }

  /**
   * Create the floating bulk actions toolbar
   */
  function createBulkToolbar() {
    const theme = getVaultSidebarThemeColors();

    bulkToolbarContainer = document.createElement("div");
    bulkToolbarContainer.className = "sp-bulk-toolbar";
    bulkToolbarContainer.style.cssText = `
      position: fixed;
      left: 370px;
      bottom: 24px;
      transform: translateX(20px);
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px;
      width: 74px;
      background: ${theme.bgSecondary};
      border: 1px solid ${theme.border};
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    const actions = [
      {
        id: "move",
        icon: "folder",
        label: "Move to category",
        color: "#3b82f6",
      },
      {
        id: "project",
        icon: "briefcase",
        label: "Add to project",
        color: "#8b5cf6",
      },
      {
        id: "export",
        icon: "download",
        label: "Export",
        color: "#10b981",
        isPro: true,
      },
      {
        id: "favorite",
        icon: "star",
        label: "Add to favorites",
        color: "#f59e0b",
      },
      {
        id: "unfavorite",
        icon: "starOff",
        label: "Remove from favorites",
        color: "#f59e0b",
      },
      { id: "archive", icon: "archive", label: "Archive", color: "#6b7280" },
      { id: "delete", icon: "trash", label: "Delete", color: "#ef4444" },
    ];

    // Selection count header
    const countHeader = document.createElement("div");
    countHeader.className = "sp-bulk-toolbar-count";
    countHeader.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      color: ${theme.text};
      padding: 4px 8px;
      text-align: center;
      border-bottom: 1px solid ${theme.border};
      margin-bottom: 4px;
    `;
    countHeader.textContent = "0 selected";
    bulkToolbarContainer.appendChild(countHeader);

    // Action buttons
    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.className = `sp-bulk-action-btn sp-bulk-action-${action.id}`;
      btn.title = action.label + (action.isPro ? " (Pro)" : "");
      btn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: ${theme.text};
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
        margin: 0;
        position: relative;
      `;

      // Wrap icon in a centered container
      const iconWrapper = document.createElement("div");
      iconWrapper.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      `;
      iconWrapper.innerHTML = getBulkActionIcon(action.icon, action.color);
      btn.appendChild(iconWrapper);

      // Add PRO badge for pro features
      if (action.isPro) {
        const proBadge = document.createElement("span");
        proBadge.textContent = "PRO";
        proBadge.style.cssText = `
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 7px;
          font-weight: 700;
          padding: 1px 3px;
          border-radius: 3px;
          background: var(--color-accent, #14b8a6);
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        `;
        btn.appendChild(proBadge);
      }

      btn.addEventListener("mouseenter", () => {
        btn.style.background = `${action.color}20`;
        btn.style.transform = "scale(1.1)";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.background = "transparent";
        btn.style.transform = "scale(1)";
      });

      btn.addEventListener("click", () => {
        handleBulkAction(action.id);
      });

      bulkToolbarContainer.appendChild(btn);
    });

    // Cancel/clear selection button
    const clearBtn = document.createElement("button");
    clearBtn.className = "sp-bulk-action-clear";
    clearBtn.title = "Clear selection";
    clearBtn.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
      border: 1px solid ${theme.border};
      border-radius: 8px;
      background: transparent;
      color: ${theme.textSecondary};
      cursor: pointer;
      transition: all 0.15s ease;
      margin-top: 4px;
      padding: 0;
      margin: 4px 0 0 0;
    `;
    clearBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    clearBtn.addEventListener("click", () => {
      clearBulkSelection();
    });

    clearBtn.addEventListener("mouseenter", () => {
      clearBtn.style.background = theme.hoverBg;
    });

    clearBtn.addEventListener("mouseleave", () => {
      clearBtn.style.background = "transparent";
    });

    bulkToolbarContainer.appendChild(clearBtn);

    document.body.appendChild(bulkToolbarContainer);
  }

  /**
   * Get SVG icon for bulk action button
   */
  function getBulkActionIcon(iconName, color) {
    const icons = {
      folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      briefcase: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      download: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
      star: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      starOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.34 8.34 2 9.27l5 4.87L5.82 21 12 17.77 18.18 21l-.59-3.43"/><path d="M18.42 12.76 22 9.27l-6.91-1L12 2l-1.44 2.91"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
      archive: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
      trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    };
    return icons[iconName] || icons.folder;
  }

  /**
   * Handle bulk action button clicks
   */
  function handleBulkAction(actionId) {
    const selectedIds = Array.from(selectedChatIds);
    if (selectedIds.length === 0) return;

    devLog(
      `?? [VAULT] Bulk action: ${actionId} on ${selectedIds.length} chats`,
    );

    switch (actionId) {
      case "move":
        showBulkMoveToCategoryDialog(selectedIds);
        break;
      case "project":
        showBulkMoveToProjectDialog(selectedIds);
        break;
      case "export":
        handleBulkExport(selectedIds);
        break;
      case "favorite":
        handleBulkFavorite(selectedIds);
        break;
      case "unfavorite":
        handleBulkUnfavorite(selectedIds);
        break;
      case "archive":
        handleBulkArchive(selectedIds);
        break;
      case "delete":
        showBulkDeleteConfirmDialog(selectedIds);
        break;
    }
  }

  /**
   * Clear all selections and exit bulk mode
   */
  function clearBulkSelection() {
    selectedChatIds.clear();
    bulkSelectionMode = false;
    updateAllCheckboxVisibility();
    updateBulkToolbar();

    // Uncheck all checkboxes
    if (sidebarContainer) {
      const checkboxes = sidebarContainer.querySelectorAll(
        ".sp-vault-chat-checkbox",
      );
      checkboxes.forEach((cb) => {
        cb.checked = false;
      });
    }
  }

  // ============================================================================
  // BULK ACTION HANDLERS (Placeholders - to be implemented)
  // ============================================================================

  function showBulkMoveToCategoryDialog(chatIds) {
    if (!activeVaultData || !activeVaultData.categories) {
      showErrorDialog(
        "No Categories Available",
        "There are no categories to move these conversations to.",
        "Please create a category first.",
      );
      return;
    }

    // Use exact same dialog structure as showMoveToCategoryDialog
    const categories = activeVaultData?.categories || [];
    const theme = getDialogThemeColors();

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "sp-move-category-overlay";
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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "sp-move-category-dialog";
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid ${theme.tealBorder};
      border-radius: 16px;
      padding: 0;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: ${theme.dialogShadow};
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
      overflow: hidden;
    `;

    // Header with gradient background
    const header = document.createElement("div");
    header.style.cssText = `
      background: ${theme.tealHeader};
      padding: 24px 28px;
      border-bottom: 1px solid ${theme.borderColor};
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: ${theme.tealIconBg};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${getLucideIcon("FolderInput", 20, "#ffffff")}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h2 style="margin: 0 0 4px 0; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.3;">
            Move to Category
          </h2>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1.4;">
            Move ${chatIds.length} selected chat${chatIds.length === 1 ? "" : "s"} to a category
          </p>
        </div>
      </div>
    `;

    // Content area with category list
    const content = document.createElement("div");
    content.style.cssText = `
      padding: 20px 28px;
      overflow-y: auto;
      flex: 1;
      min-height: 200px;
      max-height: 400px;
    `;

    // Selected category ID
    let selectedCategoryId = null;

    // Render category tree - EXACT same function as original
    function renderCategoryTree(cats, level = 0) {
      const container = document.createElement("div");

      cats.forEach((category) => {
        const categoryItem = document.createElement("div");
        categoryItem.className = "sp-category-item";
        categoryItem.setAttribute("data-category-id", category.id);
        categoryItem.style.cssText = `
          padding: 10px 14px;
          margin: 4px 0;
          margin-left: ${level * 20}px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: ${theme.categoryItemBg};
        `;

        const hasChildren = category.children && category.children.length > 0;

        categoryItem.innerHTML = `
          <span style="display: flex; align-items: center; opacity: 0.7;">
            ${getLucideIcon(
              hasChildren ? "FolderPlus" : "FolderOpen",
              16,
              theme.tealText,
            )}
          </span>
          <span style="flex: 1; color: ${
            theme.titleColor
          }; font-size: 14px; font-weight: 500;">
            ${category.name}
          </span>
          <span class="sp-category-check" style="display: none; opacity: 0; transition: opacity 0.2s ease;">
            ${getLucideIcon("Check", 18, theme.tealText)}
          </span>
        `;

        // Hover effect
        categoryItem.addEventListener("mouseenter", () => {
          if (selectedCategoryId !== category.id) {
            categoryItem.style.background = theme.tealItemHoverBg;
            categoryItem.style.borderColor = theme.tealItemBorder;
          }
        });

        categoryItem.addEventListener("mouseleave", () => {
          if (selectedCategoryId !== category.id) {
            categoryItem.style.background = theme.categoryItemBg;
            categoryItem.style.borderColor = "transparent";
          }
        });

        // Click to select
        categoryItem.addEventListener("click", (e) => {
          e.stopPropagation();

          // Deselect previous
          document.querySelectorAll(".sp-category-item").forEach((item) => {
            item.style.background = theme.categoryItemBg;
            item.style.borderColor = "transparent";
            const check = item.querySelector(".sp-category-check");
            if (check) {
              check.style.display = "none";
              check.style.opacity = "0";
            }
          });

          // Select this one
          selectedCategoryId = category.id;
          categoryItem.style.background = theme.tealSelectBg;
          categoryItem.style.borderColor = theme.tealText;
          const check = categoryItem.querySelector(".sp-category-check");
          if (check) {
            check.style.display = "flex";
            check.style.opacity = "1";
          }

          // Enable confirm button
          const confirmBtn = dialog.querySelector("#sp-confirm-move-category");
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = "1";
            confirmBtn.style.cursor = "pointer";
          }
        });

        container.appendChild(categoryItem);

        // Recursively render children
        if (hasChildren) {
          const childContainer = renderCategoryTree(
            category.children,
            level + 1,
          );
          container.appendChild(childContainer);
        }
      });

      return container;
    }

    if (categories.length === 0) {
      content.innerHTML = `
        <div style="text-center; padding: 40px 20px; color: ${
          theme.textMuted
        };">
          <div style="margin-bottom: 12px;">
            ${getLucideIcon("FolderOpen", 48, theme.textMuted)}
          </div>
          <p style="margin: 0; font-size: 14px;">No categories available</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">Create a category first to organize your chats</p>
        </div>
      `;
    } else {
      const tree = renderCategoryTree(categories);
      content.appendChild(tree);
    }

    // Footer with buttons
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 20px 28px;
      border-top: 1px solid ${theme.borderColor};
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: ${theme.footerBg};
    `;

    footer.innerHTML = `
      <button id="sp-cancel-move-category" style="
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
      <button id="sp-confirm-move-category" disabled style="
        padding: 10px 24px;
        background: ${theme.confirmBtnBg};
        border: 1px solid ${theme.confirmBtnBorder};
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: not-allowed;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: ${theme.confirmBtnShadow};
        opacity: 0.5;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        ${getLucideIcon("Check", 16, "#ffffff")}
        Move to Category
      </button>
    `;

    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Show dialog with animation
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Button handlers
    const cancelBtn = footer.querySelector("#sp-cancel-move-category");
    const confirmBtn = footer.querySelector("#sp-confirm-move-category");

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.95) translateY(-10px)";
      setTimeout(() => {
        overlay.remove();
      }, 200);
    });

    // Confirm button
    confirmBtn.addEventListener("click", async () => {
      if (!selectedCategoryId || confirmBtn.disabled) return;

      try {
        // Show loading state
        confirmBtn.innerHTML = `
          ${getLucideIcon("Loader2", 16, "#ffffff")}
          Moving...
        `;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.7";

        // Move all selected chats to the category
        for (const chatId of chatIds) {
          await new Promise((resolve, reject) => {
            const requestId = `move-bulk-${chatId}-${Date.now()}`;

            const handleResponse = (event) => {
              if (
                event.data &&
                event.data.type === "sp-response" &&
                event.data.requestId === requestId
              ) {
                window.removeEventListener("message", handleResponse);
                if (event.data.success) {
                  resolve(event.data);
                } else {
                  reject(new Error(event.data.error || "Move failed"));
                }
              }
            };

            window.addEventListener("message", handleResponse);

            // Timeout fallback
            setTimeout(() => {
              window.removeEventListener("message", handleResponse);
              resolve(); // Don't fail the entire operation for timeout
            }, 2000);

            window.postMessage(
              {
                type: "sp-move-chat-to-category",
                chatId: chatId,
                categoryId: selectedCategoryId,
                requestId: requestId,
              },
              "*",
            );
          });
        }

        // Close dialog
        overlay.style.opacity = "0";
        dialog.style.transform = "scale(0.95) translateY(-10px)";
        setTimeout(() => {
          overlay.remove();
        }, 200);

        // Show success toast
        showToast(
          `Moved ${chatIds.length} chat${chatIds.length === 1 ? "" : "s"} to category successfully`,
          "success",
        );

        // Clear bulk selection
        clearBulkSelection();

        // Refresh sidebar to show updated state (same as single chat dialog)
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);

        devLog(
          `✅ [VAULT] Moved ${chatIds.length} chats to category ${selectedCategoryId}`,
        );
      } catch (error) {
        devLog(`❌ [VAULT] Failed to move chats:`, error);
        confirmBtn.innerHTML = `
          ${getLucideIcon("Check", 16, "#ffffff")}
          Move to Category
        `;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
      }
    });

    // Button hover effects (same as original)
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = theme.cancelBtnHoverBg;
      cancelBtn.style.transform = "translateY(-1px)";
    });

    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = theme.cancelBtnBg;
      cancelBtn.style.transform = "translateY(0)";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      if (!confirmBtn.disabled) {
        confirmBtn.style.transform = "translateY(-1px)";
        confirmBtn.style.boxShadow = theme.confirmBtnHoverShadow;
      }
    });

    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = theme.confirmBtnShadow;
    });

    // Close on escape
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        cancelBtn.click();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cancelBtn.click();
      }
    });
  }

  function showBulkMoveToProjectDialog(chatIds) {
    devLog("🔄 [VAULT] Bulk move to project:", chatIds);

    // Use the elegant dialog design from showMoveToCategoryDialog but adapted for projects
    const theme = getDialogThemeColors();

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "sp-move-project-overlay";
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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "sp-move-project-dialog";
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid ${theme.tealBorder};
      border-radius: 16px;
      padding: 0;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: ${theme.dialogShadow};
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
      overflow: hidden;
    `;

    // Header with gradient background
    const header = document.createElement("div");
    header.style.cssText = `
      background: ${theme.tealHeader};
      padding: 24px 28px;
      border-bottom: 1px solid ${theme.borderColor};
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: ${theme.tealIconBg};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${getLucideIcon("FolderPlus", 20, "#ffffff")}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h2 style="margin: 0 0 4px 0; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.3;">
            Add to Project
          </h2>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1.4;">
            Add ${chatIds.length} selected chat${chatIds.length === 1 ? "" : "s"} to a project
          </p>
        </div>
      </div>
    `;

    // Content area with project list
    const content = document.createElement("div");
    content.style.cssText = `
      padding: 20px 28px;
      overflow-y: auto;
      flex: 1;
      min-height: 200px;
      max-height: 400px;
    `;

    // Loading state
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: ${
        theme.textMuted
      };">
        <div style="margin-bottom: 12px; animation: spin 1s linear infinite;">
          ${getLucideIcon("Loader2", 48, theme.textMuted)}
        </div>
        <p style="margin: 0; font-size: 14px;">Loading projects...</p>
      </div>
    `;

    // Selected project info
    let selectedProjectId = null;
    let selectedProjectName = null;

    // Footer with action buttons
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 20px 28px;
      border-top: 1px solid ${theme.borderColor};
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: ${theme.footerBg};
    `;

    footer.innerHTML = `
      <button id="sp-cancel-move-project" style="
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
      <button id="sp-confirm-move-project" disabled style="
        padding: 10px 24px;
        background: ${theme.confirmBtnBg};
        border: 1px solid ${theme.confirmBtnBorder};
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: not-allowed;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: ${theme.confirmBtnShadow};
        opacity: 0.5;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        ${getLucideIcon("Plus", 16, "#ffffff")}
        Add to Project
      </button>
    `;

    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Show dialog with animation
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Load projects
    async function loadProjects() {
      try {
        // Get projects from content script (same logic as single-chat)
        const response = await new Promise((resolve, reject) => {
          const requestId = `bulk-projects-${Date.now()}`;

          const handleResponse = (event) => {
            const data = event.data;
            if (data.type === "sp-response" && data.requestId === requestId) {
              window.removeEventListener("message", handleResponse);
              if (data.success) {
                resolve(data.projects);
              } else {
                reject(new Error(data.error || "Failed to load projects"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          window.postMessage(
            {
              type: "sp-get-projects",
              requestId: requestId,
            },
            "*",
          );

          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Request timeout"));
          }, 30000);
        });

        // Render projects
        if (!response || response.length === 0) {
          content.innerHTML = `
            <div style="text-center; padding: 40px 20px; color: ${
              theme.textMuted
            };">
              <div style="margin-bottom: 12px;">
                ${getLucideIcon("FolderOpen", 48, theme.textMuted)}
              </div>
              <p style="margin: 0; font-size: 14px;">No projects available</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">Create a project first to organize your chats</p>
            </div>
          `;
          return;
        }

        // Clear loading content
        content.innerHTML = "";

        // Create project list
        response.forEach((project) => {
          // Use same property chain as single-chat submenu
          const projectId =
            project.gizmo?.gizmo?.id || project.gizmo?.id || project.id;
          const projectName =
            project.gizmo?.gizmo?.display?.name ||
            project.gizmo?.display?.name ||
            project.name ||
            projectId;

          if (!projectId) {
            devWarn("⚠️ [VAULT] Skipping project without ID:", project);
            return;
          }

          const projectItem = document.createElement("div");
          projectItem.className = "sp-project-item";
          projectItem.setAttribute("data-project-id", projectId);
          projectItem.style.cssText = `
            padding: 10px 14px;
            margin: 4px 0;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid transparent;
            background: ${theme.categoryItemBg};
          `;

          projectItem.innerHTML = `
            <span style="display: flex; align-items: center; opacity: 0.7;">
              ${getLucideIcon("FolderPlus", 16, theme.tealText)}
            </span>
            <span style="flex: 1; color: ${
              theme.titleColor
            }; font-size: 14px; font-weight: 500;">
              ${projectName}
            </span>
            <span class="sp-project-check" style="display: none; opacity: 0; transition: opacity 0.2s ease;">
              ${getLucideIcon("Check", 18, theme.tealText)}
            </span>
          `;

          // Hover effect
          projectItem.addEventListener("mouseenter", () => {
            if (selectedProjectId !== projectId) {
              projectItem.style.background = theme.tealItemHoverBg;
              projectItem.style.borderColor = theme.tealItemBorder;
            }
          });

          projectItem.addEventListener("mouseleave", () => {
            if (selectedProjectId !== projectId) {
              projectItem.style.background = theme.categoryItemBg;
              projectItem.style.borderColor = "transparent";
            }
          });

          // Click to select
          projectItem.addEventListener("click", (e) => {
            e.stopPropagation();

            // Deselect previous
            document.querySelectorAll(".sp-project-item").forEach((item) => {
              item.style.background = theme.categoryItemBg;
              item.style.borderColor = "transparent";
              const check = item.querySelector(".sp-project-check");
              if (check) {
                check.style.display = "none";
                check.style.opacity = "0";
              }
            });

            // Select this one
            selectedProjectId = projectId;
            selectedProjectName = projectName;
            projectItem.style.background = theme.tealSelectBg;
            projectItem.style.borderColor = theme.tealText;
            const check = projectItem.querySelector(".sp-project-check");
            if (check) {
              check.style.display = "flex";
              check.style.opacity = "1";
            }

            // Enable confirm button
            const confirmBtn = dialog.querySelector("#sp-confirm-move-project");
            if (confirmBtn) {
              confirmBtn.disabled = false;
              confirmBtn.style.opacity = "1";
              confirmBtn.style.cursor = "pointer";
            }
          });

          content.appendChild(projectItem);
        });
      } catch (error) {
        devError("❌ [VAULT] Failed to load projects:", error);
        content.innerHTML = `
          <div style="text-center; padding: 40px 20px; color: ${
            theme.textMuted
          };">
            <div style="margin-bottom: 12px;">
              ${getLucideIcon("AlertCircle", 48, "#ef4444")}
            </div>
            <p style="margin: 0; font-size: 14px; color: #ef4444;">Failed to load projects</p>
            <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">${error.message}</p>
          </div>
        `;
      }
    }

    // Load projects
    loadProjects();

    // Button handlers
    const cancelBtn = footer.querySelector("#sp-cancel-move-project");
    const confirmBtn = footer.querySelector("#sp-confirm-move-project");

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.95) translateY(-10px)";
      setTimeout(() => {
        overlay.remove();
      }, 200);
    });

    // Confirm button
    confirmBtn.addEventListener("click", async () => {
      if (!selectedProjectId || confirmBtn.disabled) return;

      try {
        // Show loading state
        confirmBtn.innerHTML = `
          ${getLucideIcon("Loader2", 16, "#ffffff")}
          Adding...
        `;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.7";

        // Add all selected chats to the project
        for (const chatId of chatIds) {
          await new Promise((resolve, reject) => {
            const requestId = `move-bulk-project-${chatId}-${Date.now()}`;

            const handleResponse = (event) => {
              if (
                event.data &&
                event.data.type === "sp-response" &&
                event.data.requestId === requestId
              ) {
                window.removeEventListener("message", handleResponse);
                if (event.data.success) {
                  resolve(event.data);
                } else {
                  reject(new Error(event.data.error || "Move failed"));
                }
              }
            };

            window.addEventListener("message", handleResponse);

            // Timeout fallback
            setTimeout(() => {
              window.removeEventListener("message", handleResponse);
              resolve(); // Don't fail the entire operation for timeout
            }, 10000);

            window.postMessage(
              {
                type: "sp-move-to-project",
                chatId: chatId,
                projectId: selectedProjectId,
                projectName: selectedProjectName,
                requestId: requestId,
              },
              "*",
            );
          });
        }

        // Close dialog
        overlay.style.opacity = "0";
        dialog.style.transform = "scale(0.95) translateY(-10px)";
        setTimeout(() => {
          overlay.remove();
        }, 200);

        // Show success toast
        showToast(
          `Added ${chatIds.length} chat${chatIds.length === 1 ? "" : "s"} to ${selectedProjectName}`,
          "success",
        );

        // Clear bulk selection
        clearBulkSelection();

        // Refresh sidebar to show updated state
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);

        devLog(
          `✅ [VAULT] Added ${chatIds.length} chats to project ${selectedProjectId}`,
        );
      } catch (error) {
        devLog(`❌ [VAULT] Failed to add chats to project:`, error);
        confirmBtn.innerHTML = `
          ${getLucideIcon("Plus", 16, "#ffffff")}
          Add to Project
        `;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
      }
    });

    // Button hover effects (same as category dialog)
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = theme.cancelBtnHoverBg;
      cancelBtn.style.transform = "translateY(-1px)";
    });

    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = theme.cancelBtnBg;
      cancelBtn.style.transform = "translateY(0)";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      if (!confirmBtn.disabled) {
        confirmBtn.style.transform = "translateY(-1px)";
        confirmBtn.style.boxShadow = theme.confirmBtnHoverShadow;
      }
    });

    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = theme.confirmBtnShadow;
    });

    // Close on escape
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        cancelBtn.click();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cancelBtn.click();
      }
    });
  }

  function handleBulkExport(chatIds) {
    devLog("📦 [VAULT] Bulk export:", chatIds);

    if (!activeVaultData || !activeVaultData.chats) {
      devError("❌ [VAULT] No active vault data");
      return;
    }

    // Get chat objects for the selected IDs
    const chatsToExport = chatIds
      .map((chatId) => activeVaultData.chats.find((c) => c.id === chatId))
      .filter(Boolean);

    if (chatsToExport.length === 0) {
      devLog("ℹ️  [VAULT] No chats found to export");
      clearBulkSelection();
      return;
    }

    // Send message to show bulk export dialog
    // The dialog handles PRO check internally
    window.postMessage(
      {
        type: "sp-show-bulk-export-dialog",
        payload: {
          chats: chatsToExport.map((chat) => ({
            id: chat.id,
            title: chat.title,
            create_time: chat.create_time,
            update_time: chat.update_time,
            is_archived: chat.is_archived,
            is_starred: chat.is_starred,
            favorite: chat.favorite,
            categoryId: chat.categoryId,
            vaultId: chat.vaultId,
          })),
        },
      },
      "*",
    );

    clearBulkSelection();
  }

  async function handleBulkFavorite(chatIds) {
    devLog("🌟 [VAULT] Bulk favorite:", chatIds);

    if (!activeVaultData || !activeVaultData.chats) {
      devError("❌ [VAULT] No active vault data");
      return;
    }

    // Check SuperPrompt's own favorite limit (not ChatGPT's)
    const isPro = activeVaultData?.isPro === true;
    const maxFavorites = isPro ? Infinity : 3; // Free tier: 3, Pro: unlimited

    // Count current favorites in OUR system
    const currentFavoriteCount = activeVaultData.chats.filter(
      (c) => c.is_starred || c.favorite,
    ).length;

    devLog(
      `📊 [VAULT] Current favorites: ${currentFavoriteCount}/${maxFavorites} (${isPro ? "Pro" : "Free"})`,
    );

    // Find chats to favorite (filter out already favorited ones)
    const chatsToFavorite = [];
    let alreadyFavoritedCount = 0;

    for (const chatId of chatIds) {
      const chat = activeVaultData.chats.find((c) => c.id === chatId);
      if (chat) {
        if (chat.is_starred || chat.favorite) {
          alreadyFavoritedCount++;
          devLog(`⏭️  [VAULT] Chat ${chatId} already favorited, skipping`);
        } else {
          chatsToFavorite.push(chat);
        }
      }
    }

    if (chatsToFavorite.length === 0) {
      if (alreadyFavoritedCount > 0) {
        devLog(
          `ℹ️  [VAULT] All ${alreadyFavoritedCount} chat(s) were already favorited`,
        );
      }
      clearBulkSelection();
      return;
    }

    // Check limit BEFORE processing
    let limitReached = false;
    let chatsToProcess = chatsToFavorite;

    if (currentFavoriteCount + chatsToFavorite.length > maxFavorites) {
      // Can only add some chats
      const canAdd = maxFavorites - currentFavoriteCount;
      if (canAdd <= 0) {
        // Already at limit
        limitReached = true;
        chatsToProcess = [];
      } else {
        chatsToProcess = chatsToFavorite.slice(0, canAdd);
        limitReached = true;
      }
    }

    // 🚀 OPTIMISTIC UPDATE: Update local state immediately
    const successCount = chatsToProcess.length;
    for (const chat of chatsToProcess) {
      chat.is_starred = true;
      chat.favorite = true;
    }

    // 🚀 Refresh UI immediately with updated data (optimistic)
    devLog(
      `🚀 [VAULT] Optimistic update: refreshing UI with ${successCount} favorited chats`,
    );
    renderSidebar(activeVaultData);
    clearBulkSelection();

    // Show limit dialog if reached
    if (limitReached) {
      window.postMessage(
        {
          type: "sp-show-limit-error",
          payload: {
            limitType: "favorites",
            current: currentFavoriteCount + successCount,
            max: maxFavorites,
            message:
              successCount > 0
                ? `Added ${successCount} chat${successCount !== 1 ? "s" : ""} to favorites. You've reached your ${maxFavorites}-favorite limit.`
                : `You've already reached your ${maxFavorites}-favorite limit.`,
          },
        },
        "*",
      );
    }

    // 🔄 Sync to IndexedDB in the background (NO ChatGPT API - favorites are SuperPrompt-only!)
    devLog(
      `🔄 [VAULT] Syncing ${successCount} favorites to IndexedDB in background...`,
    );

    for (const chat of chatsToProcess) {
      // Save to IndexedDB via content script (local storage only, no ChatGPT API)
      window.postMessage(
        {
          type: "sp-save-favorite-local",
          chatId: chat.id,
          isFavorite: true,
        },
        "*",
      );
    }

    devLog(`✅ [VAULT] Successfully favorited ${successCount} chat(s)`);
  }

  async function handleBulkUnfavorite(chatIds) {
    devLog("⭐ [VAULT] Bulk unfavorite:", chatIds);

    if (!activeVaultData || !activeVaultData.chats) {
      devError("❌ [VAULT] No active vault data");
      return;
    }

    // Find chats to unfavorite (filter out ones that are NOT favorited)
    const chatsToUnfavorite = [];
    let notFavoritedCount = 0;

    for (const chatId of chatIds) {
      const chat = activeVaultData.chats.find((c) => c.id === chatId);
      if (chat) {
        if (chat.is_starred || chat.favorite) {
          chatsToUnfavorite.push(chat);
        } else {
          notFavoritedCount++;
          devLog(`⏭️  [VAULT] Chat ${chatId} is not favorited, skipping`);
        }
      }
    }

    if (chatsToUnfavorite.length === 0) {
      if (notFavoritedCount > 0) {
        devLog(
          `ℹ️  [VAULT] None of the ${notFavoritedCount} selected chat(s) were favorited`,
        );
      }
      clearBulkSelection();
      return;
    }

    // 🚀 OPTIMISTIC UPDATE: Update local state immediately
    const successCount = chatsToUnfavorite.length;
    for (const chat of chatsToUnfavorite) {
      chat.is_starred = false;
      chat.favorite = false;
    }

    // 🚀 Refresh UI immediately with updated data (optimistic)
    devLog(
      `🚀 [VAULT] Optimistic update: refreshing UI with ${successCount} unfavorited chats`,
    );
    renderSidebar(activeVaultData);
    clearBulkSelection();

    // 🔄 Sync to IndexedDB in the background (NO ChatGPT API - favorites are SuperPrompt-only!)
    devLog(
      `🔄 [VAULT] Syncing ${successCount} unfavorites to IndexedDB in background...`,
    );

    for (const chat of chatsToUnfavorite) {
      // Save to IndexedDB via content script (local storage only, no ChatGPT API)
      window.postMessage(
        {
          type: "sp-save-favorite-local",
          chatId: chat.id,
          isFavorite: false,
        },
        "*",
      );
    }

    devLog(`✅ [VAULT] Successfully unfavorited ${successCount} chat(s)`);
  }

  async function handleBulkArchive(chatIds) {
    // TODO: Archive multiple chats
    devLog("?? [VAULT] Bulk archive:", chatIds);

    try {
      // Archive all selected chats sequentially with proper response handling
      for (const chatId of chatIds) {
        await new Promise((resolve, reject) => {
          const requestId = `archive-bulk-${chatId}-${Date.now()}`;

          // Get current archived status from activeVaultData
          let currentArchivedStatus = false;
          if (activeVaultData && activeVaultData.chats) {
            const chat = activeVaultData.chats.find((c) => c.id === chatId);
            if (chat) {
              currentArchivedStatus = chat.is_archived || false;
            }
          }

          const handleResponse = (event) => {
            if (
              event.data &&
              event.data.type === "sp-response" &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener("message", handleResponse);
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error || "Archive failed"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Timeout fallback
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            resolve(); // Don't fail the entire operation for timeout
          }, 10000);

          window.postMessage(
            {
              type: "sp-archive-chat",
              chatId: chatId,
              currentStatus: currentArchivedStatus,
              requestId: requestId,
            },
            "*",
          );
        });
      }

      // Show success toast
      showToast(
        `Archived ${chatIds.length} chat${chatIds.length === 1 ? "" : "s"}`,
        "success",
      );

      clearBulkSelection();

      // Refresh sidebar to show updated state
      setTimeout(() => {
        window.triggerVaultSidebarRefresh();
      }, 300);

      devLog(`✅ [VAULT] Archived ${chatIds.length} chats`);
    } catch (error) {
      devLog(`❌ [VAULT] Failed to archive chats:`, error);
      showToast("Failed to archive some chats", "error");
    }
  }

  function showBulkDeleteConfirmDialog(chatIds) {
    // Use the elegant dialog design from other bulk operations
    const theme = getDialogThemeColors();

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "sp-delete-overlay";
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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "sp-delete-dialog";
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid #ef4444;
      border-radius: 16px;
      padding: 0;
      max-width: 500px;
      width: 90%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
      overflow: hidden;
    `;

    // Header with red gradient background
    const header = document.createElement("div");
    header.style.cssText = `
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 24px 28px;
      border-bottom: 1px solid rgba(239, 68, 68, 0.3);
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${getLucideIcon("Trash2", 20, "#ffffff")}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h2 style="margin: 0 0 4px 0; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.3;">
            Delete Chats
          </h2>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1.4;">
            Permanently delete ${chatIds.length} selected chat${chatIds.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    `;

    // Content area with warning
    const content = document.createElement("div");
    content.style.cssText = `
      padding: 24px 28px;
      color: ${theme.textSecondary};
      font-size: 14px;
      line-height: 1.5;
    `;

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
        <div style="color: #ef4444; flex-shrink: 0;">
          ${getLucideIcon("AlertTriangle", 20)}
        </div>
        <div>
          <p style="margin: 0 0 4px 0; color: #ef4444; font-weight: 600; font-size: 14px;">Warning: This action cannot be undone</p>
          <p style="margin: 0; color: ${theme.textSecondary}; font-size: 13px;">The selected conversations will be permanently removed from ChatGPT.</p>
        </div>
      </div>
    `;

    // Footer with action buttons
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 20px 28px;
      border-top: 1px solid ${theme.borderColor};
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: ${theme.footerBg};
    `;

    footer.innerHTML = `
      <button id="sp-cancel-delete" style="
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
      <button id="sp-confirm-delete" style="
        padding: 10px 24px;
        background: #ef4444;
        border: 1px solid #ef4444;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        ${getLucideIcon("Trash2", 16, "#ffffff")}
        Delete ${chatIds.length} Chat${chatIds.length === 1 ? "" : "s"}
      </button>
    `;

    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Show dialog with animation
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Button handlers
    const cancelBtn = footer.querySelector("#sp-cancel-delete");
    const confirmBtn = footer.querySelector("#sp-confirm-delete");

    // Cancel button
    cancelBtn.addEventListener("click", () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.95) translateY(-10px)";
      setTimeout(() => {
        overlay.remove();
      }, 200);
    });

    // Confirm button
    confirmBtn.addEventListener("click", async () => {
      try {
        // Show loading state
        confirmBtn.innerHTML = `
          ${getLucideIcon("Loader2", 16, "#ffffff")}
          Deleting...
        `;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.7";

        // Delete all selected chats
        for (const chatId of chatIds) {
          await new Promise((resolve, reject) => {
            const requestId = `delete-bulk-${chatId}-${Date.now()}`;

            const handleResponse = (event) => {
              if (
                event.data &&
                event.data.type === "sp-response" &&
                event.data.requestId === requestId
              ) {
                window.removeEventListener("message", handleResponse);
                if (event.data.success) {
                  resolve(event.data);
                } else {
                  reject(new Error(event.data.error || "Delete failed"));
                }
              }
            };

            window.addEventListener("message", handleResponse);

            // Timeout fallback
            setTimeout(() => {
              window.removeEventListener("message", handleResponse);
              resolve(); // Don't fail the entire operation for timeout
            }, 10000);

            window.postMessage(
              {
                type: "sp-delete-chat-from-api",
                chatId: chatId,
                requestId: requestId,
              },
              "*",
            );
          });
        }

        // Close dialog
        overlay.style.opacity = "0";
        dialog.style.transform = "scale(0.95) translateY(-10px)";
        setTimeout(() => {
          overlay.remove();
        }, 200);

        // Show success toast
        showToast(
          `Deleted ${chatIds.length} chat${chatIds.length === 1 ? "" : "s"}`,
          "success",
        );

        // Clear bulk selection
        clearBulkSelection();

        // Refresh sidebar to show updated state
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);

        devLog(`✅ [VAULT] Deleted ${chatIds.length} chats`);
      } catch (error) {
        devLog(`❌ [VAULT] Failed to delete chats:`, error);
        confirmBtn.innerHTML = `
          ${getLucideIcon("Trash2", 16, "#ffffff")}
          Delete ${chatIds.length} Chat${chatIds.length === 1 ? "" : "s"}
        `;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
      }
    });

    // Button hover effects
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = theme.cancelBtnHoverBg;
      cancelBtn.style.transform = "translateY(-1px)";
    });

    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = theme.cancelBtnBg;
      cancelBtn.style.transform = "translateY(0)";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      if (!confirmBtn.disabled) {
        confirmBtn.style.transform = "translateY(-1px)";
        confirmBtn.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
        confirmBtn.style.background = "#dc2626";
      }
    });

    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
      confirmBtn.style.background = "#ef4444";
    });

    // Close on escape
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        cancelBtn.click();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cancelBtn.click();
      }
    });
  }

  function showGenericBulkDialog(title, message, onConfirm) {
    const theme = getVaultSidebarThemeColors();

    const overlay = document.createElement("div");
    overlay.className = "sp-vault-modal-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: ${theme.bgSecondary};
      border: 1px solid ${theme.border};
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    `;

    dialog.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: ${theme.text}; font-size: 18px; font-weight: 600;">${title}</h3>
      <p style="color: ${theme.textSecondary}; font-size: 14px; margin: 0 0 24px 0;">${message}</p>
      <p style="color: ${theme.textSecondary}; font-size: 12px; margin: 0 0 24px 0; opacity: 0.7;">This feature is coming soon...</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="sp-dialog-close" style="
          padding: 10px 20px;
          border: 1px solid ${theme.border};
          border-radius: 8px;
          background: transparent;
          color: ${theme.text};
          cursor: pointer;
          font-size: 14px;
        ">Close</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    dialog.querySelector(".sp-dialog-close").addEventListener("click", () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  // ============================================================================
  // HELPER: Get vault sidebar theme colors based on ChatGPT color-scheme
  // ============================================================================

  /**
   * Get theme-aware colors for vault sidebar
   * @returns {object} Vault sidebar theme colors
   */
  function getVaultSidebarThemeColors() {
    const htmlElement = document.documentElement;
    const colorScheme =
      htmlElement.style.colorScheme ||
      getComputedStyle(htmlElement).colorScheme ||
      "dark";
    const isDark = !colorScheme.includes("light");

    if (isDark) {
      return {
        bg: "#171717",
        text: "#e5e7eb",
        textSecondary: "#9ca3af",
        bgSecondary: "#2d2d2d",
        bgTertiary: "#3a3a3a",
        border: "#374151",
        borderLight: "#4b5563",
        hoverBg: "#2d2d2d",
        // Subtle accent-tinted hover (no hard-coded accent colors)
        toolsHeaderHover:
          "color-mix(in srgb, #3a3a3a 88%, var(--color-accent, #3a3a3a) 12%)",
        activeBg:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 18%, transparent) 0%, color-mix(in srgb, var(--color-accent) 12%, transparent) 100%)",
        activeBorder: "var(--color-accent)",
        activeText: "var(--color-accent)",
      };
    } else {
      return {
        bg: "#ffffff",
        text: "#111827",
        textSecondary: "#6b7280",
        bgSecondary: "#f9fafb",
        bgTertiary: "#f3f4f6",
        border: "#e5e7eb",
        borderLight: "#d1d5db",
        hoverBg: "#f0f0f0",
        toolsHeaderHover:
          "color-mix(in srgb, #f3f4f6 90%, var(--color-accent, #f3f4f6) 10%)",
        activeBg:
          "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 14%, transparent) 0%, color-mix(in srgb, var(--color-accent) 10%, transparent) 100%)",
        activeBorder: "var(--color-accent)",
        activeText: "var(--color-accent)",
      };
    }
  }

  // ============================================================================
  // HELPERS: LocalStorage for collapsed state
  // ============================================================================

  function getCollapsedCategories() {
    try {
      const stored = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      devWarn("?? [VAULT] Error reading collapsed categories:", e);
      return [];
    }
  }

  function setCollapsedCategories(collapsedIds) {
    try {
      localStorage.setItem(
        COLLAPSED_CATEGORIES_KEY,
        JSON.stringify(collapsedIds),
      );
    } catch (e) {
      devWarn("?? [VAULT] Error saving collapsed categories:", e);
    }
  }

  function toggleCategoryCollapsed(categoryId) {
    const collapsed = getCollapsedCategories();
    const index = collapsed.indexOf(categoryId);

    if (index > -1) {
      // Was collapsed, expand it
      collapsed.splice(index, 1);
    } else {
      // Was expanded, collapse it
      collapsed.push(categoryId);
    }

    setCollapsedCategories(collapsed);
    return index === -1; // Return true if now collapsed
  }

  function isCategoryCollapsed(categoryId) {
    return getCollapsedCategories().includes(categoryId);
  }

  function collapseAllCategories() {
    if (!activeVaultData) return;

    // Get all category IDs
    const allCategoryIds = [];

    // Add special categories (with correct IDs used in rendering)
    allCategoryIds.push("sp-special-favorites", "sp-special-archived");

    // Add regular categories (including nested ones and dynamically added ones like "uncategorized")
    const categories = activeVaultData.categories || [];
    categories.forEach((cat) => {
      allCategoryIds.push(cat.id);
      // If category has subcategories, add them too
      if (cat.subcategories) {
        cat.subcategories.forEach((sub) => allCategoryIds.push(sub.id));
      }
    });

    // Set all as collapsed
    setCollapsedCategories(allCategoryIds);
  }

  function expandAllCategories() {
    // Clear all collapsed categories
    setCollapsedCategories([]);
  }

  function areAllCategoriesCollapsed() {
    if (!activeVaultData) return false;

    const collapsed = getCollapsedCategories();

    // Count total categories
    let totalCategories = 2; // favorites + archived
    const categories = activeVaultData.categories || [];
    categories.forEach((cat) => {
      totalCategories++;
      if (cat.subcategories) {
        totalCategories += cat.subcategories.length;
      }
    });

    // If most categories are collapsed (80%+), consider it "all collapsed"
    return collapsed.length >= totalCategories * 0.8;
  }

  function initializeDefaultCollapsedState() {
    // Check if we've ever initialized before (marker key in localStorage)
    const INIT_MARKER_KEY = "sp-vault-default-collapsed-initialized";
    const VERSION_KEY = "sp-vault-collapsed-version";
    const CURRENT_VERSION = "4"; // Increment this to force reset

    const hasInitialized = localStorage.getItem(INIT_MARKER_KEY);
    const version = localStorage.getItem(VERSION_KEY);

    // ONLY force collapse if version changed OR first time
    // Do NOT force on every render (breaks user interaction)
    if (!hasInitialized || version !== CURRENT_VERSION) {
      collapseAllCategories();
      localStorage.setItem(INIT_MARKER_KEY, "true");
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } else {
    }
  }

  function getLazyLoadState(categoryId) {
    return (
      lazyLoadState.get(categoryId) || {
        loadedCount: LAZY_LOAD_BATCH_SIZE,
        totalCount: 0,
      }
    );
  }

  function setLazyLoadState(categoryId, loadedCount, totalCount) {
    lazyLoadState.set(categoryId, { loadedCount, totalCount });
  }

  function loadMoreChats(categoryId) {
    const state = getLazyLoadState(categoryId);

    // If totalCount is 0, we haven't initialized yet - skip
    if (state.totalCount === 0) {
      devWarn(
        `?? [VAULT] Cannot load more for ${categoryId}: totalCount not initialized`,
      );
      return;
    }

    const newLoadedCount = Math.min(
      state.loadedCount + LAZY_LOAD_BATCH_SIZE,
      state.totalCount,
    );

    // Only re-render if we actually have more to load
    if (newLoadedCount > state.loadedCount) {
      setLazyLoadState(categoryId, newLoadedCount, state.totalCount);

      // Re-render to show more chats
      renderSidebar(activeVaultData);
    } else {
    }
  }

  // ============================================================================
  // CORE: Wait for ChatGPT's #history div
  // ============================================================================

  function waitForChatListContainer(callback) {
    const check = () => {
      const historyDiv = document.getElementById("history");

      if (historyDiv) {
        callback(historyDiv);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }

  // ============================================================================
  // CORE: Create sidebar as sibling of #history
  // ============================================================================

  function createSidebar(historyDiv) {
    // Clean up any existing sidebar
    const existing = document.getElementById("sp-vault-sidebar");
    if (existing) existing.remove();

    // Get theme colors
    const themeColors = getVaultSidebarThemeColors();

    // Create our container
    sidebarContainer = document.createElement("div");
    sidebarContainer.id = "sp-vault-sidebar";
    sidebarContainer.className = "sp-vault-sidebar";

    // Style to match #history dimensions and appearance with theme-aware colors
    sidebarContainer.style.cssText = `
      display: block !important;
      position: relative !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      padding: 16px !important;
      background: ${themeColors.bg} !important;
      color: ${themeColors.text} !important;
      box-sizing: border-box !important;
    `;

    // Insert as SIBLING of #history (not child!)
    historyDiv.parentNode.insertBefore(sidebarContainer, historyDiv);

    // Hide #history itself AND the "Chats" header section
    hideHistoryAndSiblings(historyDiv);

    // Request data from content script
    requestVaultData();

    // Create the Tools & GPTs collapsible group with retry logic
    let retryCount = 0;
    const maxRetries = 5;
    const tryCreateToolsGroup = () => {
      // Try multiple selectors - CSS.escape handles special characters
      let expandoSections = document.querySelectorAll(
        '[class*="sidebar-expando-section"]',
      );

      if (expandoSections.length === 0) {
        // Try with CSS.escape for the slash
        const escapedClass = "group\\/sidebar-expando-section";
        expandoSections = document.querySelectorAll("." + escapedClass);
      }

      if (expandoSections.length === 0) {
        // Last resort: find by inspecting class list directly
        expandoSections = Array.from(document.querySelectorAll("div")).filter(
          (el) =>
            el.classList &&
            (el.classList.contains("group/sidebar-expando-section") ||
              Array.from(el.classList).some((cls) =>
                cls.includes("sidebar-expando-section"),
              )),
        );
      }

      if (expandoSections.length >= 1 || retryCount >= maxRetries) {
        // Changed from >= 2 to >= 1 since we might only have GPTs visible
        createToolsGroup();
      } else {
        retryCount++;
        setTimeout(tryCreateToolsGroup, 500);
      }
    };

    setTimeout(tryCreateToolsGroup, 300);
  }

  // ============================================================================
  // HELPER: Hide #history and nearby ChatGPT UI elements
  // ============================================================================

  function hideHistoryAndSiblings(historyDiv) {
    // Hide #history itself
    historyDiv.style.display = "none";
    historyDiv.setAttribute("data-sp-vault-hidden", "true");

    // Find the parent container (should be the expand section)
    const parent = historyDiv.parentNode;
    if (!parent) return;

    // CRITICAL: Only hide direct siblings of #history, NOT the parent container
    // Look for the "Chats" header which is a sibling of #history
    const siblings = Array.from(parent.children);
    siblings.forEach((sibling) => {
      // Skip our vault sidebar and the history div itself
      if (sibling === historyDiv || sibling === sidebarContainer) {
        return;
      }

      // Get direct text (not from children)
      const directText = Array.from(sibling.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join("");

      const siblingText = sibling.textContent || "";

      // Only hide if it's a small element (likely a header) with "Chats" or "Your chats" text
      // and it doesn't contain our vault sidebar
      const isSmallElement = sibling.children.length < 10;
      const hasChatsText =
        (siblingText.includes("Chats") || siblingText.includes("Your chats")) &&
        siblingText.length < 100;
      const containsVaultSidebar = sibling.querySelector("#sp-vault-sidebar");

      if (isSmallElement && hasChatsText && !containsVaultSidebar) {
        sibling.style.display = "none";
        sibling.setAttribute("data-sp-vault-hidden", "true");
      }
    });
  }

  // ============================================================================
  // HELPER: Restore #history and hidden siblings
  // ============================================================================

  function restoreHistoryAndSiblings() {
    // Restore all elements we hid
    const hiddenElements = document.querySelectorAll(
      '[data-sp-vault-hidden="true"]',
    );
    hiddenElements.forEach((element) => {
      element.style.display = "";
      element.removeAttribute("data-sp-vault-hidden");
    });
  }

  // ============================================================================
  // HELPER: Create collapsible Tools & GPTs group
  // ============================================================================

  function createToolsGroup() {
    // Get theme colors
    const themeColors = getVaultSidebarThemeColors();

    // Inject styles if not already present
    const existingStyle = document.getElementById("sp-vault-tools-styles");
    if (existingStyle) existingStyle.remove();

    const style = document.createElement("style");
    style.id = "sp-vault-tools-styles";
    style.textContent = `
      /* CRITICAL FIX: Override position:relative on sidebar aside that causes clipping in Firefox */
      /* Be VERY specific to only target ChatGPT's sidebar asides, not our own UI */
      [data-testid="left-sidebar"] aside[class*="sidebar-section-first-margin-top"] {
        position: static !important;
      }

      .sp-vault-tools-group {
        margin: 10px 0 !important;
        border-radius: 0 !important;
        overflow: visible !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        min-height: 48px !important;
        max-height: none !important;
        height: auto !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 10 !important;
        flex-shrink: 0 !important;
      }

      .sp-vault-tools-header {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 12px 16px !important;
        cursor: pointer !important;
        background: ${themeColors.bgTertiary} !important;
        border-bottom: 1px solid ${themeColors.border} !important;
        border-radius: 0 !important;
        transition: all 0.2s ease !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        color: ${themeColors.text} !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        position: relative !important;
        z-index: 1 !important;
        min-height: 44px !important;
        max-height: none !important;
        height: auto !important;
        box-sizing: border-box !important;
        visibility: visible !important;
        opacity: 1 !important;
        overflow: visible !important;
        clip: auto !important;
        clip-path: none !important;
      }

      .sp-vault-tools-collapsed .sp-vault-tools-header {
        border-bottom: none !important;
        border-radius: 0 !important;
      }

      .sp-vault-tools-header:hover {
        background: ${themeColors.toolsHeaderHover} !important;
        color: ${themeColors.text} !important;
      }

      .sp-vault-tools-chevron {
        margin-right: 6px !important;
        transition: transform 0.2s ease !important;
        width: 16px !important;
        height: 16px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
      }

      .sp-vault-tools-chevron::before {
        content: '' !important;
        width: 0 !important;
        height: 0 !important;
        border-left: 5px solid transparent !important;
        border-right: 5px solid transparent !important;
        border-top: 6px solid ${themeColors.textSecondary} !important;
        transition: transform 0.2s ease !important;
      }

      .sp-vault-tools-collapsed .sp-vault-tools-chevron::before {
        transform: rotate(-90deg) !important;
      }

      .sp-vault-tools-label {
        flex: 1 !important;
        white-space: nowrap !important;
      }

      .sp-vault-tools-content {
        overflow: hidden !important;
        transition: max-height 0.3s ease, padding 0.3s ease !important;
        padding: 8px 0 !important;
        background: ${themeColors.bg} !important;
        max-height: 2000px !important;
      }

      .sp-vault-tools-collapsed .sp-vault-tools-content {
        max-height: 0 !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // ChatGPT no longer uses <aside> for GPTs/Projects - they use divs with specific classes
    // Look for the sidebar expando sections (GPTs and Projects)
    // IMPORTANT: Only look inside the navigation sidebar, NOT in banners or other UI elements
    const navSidebarRoot =
      document.querySelector('[data-testid="left-sidebar"]') ||
      document.querySelector("div[data-side-panel]") ||
      document.querySelector('nav[aria-label*="Chat"]')?.parentElement ||
      document.querySelector("nav.flex-col")?.parentElement;

    const navSidebar = navSidebarRoot
      ? navSidebarRoot.querySelector("nav") || navSidebarRoot
      : document.querySelector('nav[aria-label*="Chat"]') ||
        document.querySelector("nav.flex-col") ||
        document.querySelector('nav[class*="sidebar"]');

    if (!navSidebar) {
      return; // No sidebar found, abort
    }

    // Try multiple selectors to be more robust, but ONLY within the sidebar nav
    let allExpandoSections = Array.from(
      navSidebar.querySelectorAll('[class*="sidebar-expando-section"]'),
    );

    // Fallback: if none found, try with direct class check
    if (allExpandoSections.length === 0) {
      allExpandoSections = Array.from(
        navSidebar.querySelectorAll("div"),
      ).filter(
        (el) =>
          el.classList &&
          (el.classList.contains("group/sidebar-expando-section") ||
            Array.from(el.classList).some((cls) =>
              cls.includes("sidebar-expando-section"),
            )),
      );
    }

    // Another fallback: look for divs that contain GPT's, Projects, or Chats text (ONLY in nav)
    if (allExpandoSections.length === 0) {
      allExpandoSections = Array.from(
        navSidebar.querySelectorAll("div"),
      ).filter((div) => {
        const text = div.textContent || "";
        return (
          (text.includes("GPT's") ||
            text.includes("GPTs") ||
            text.includes("Projecten") ||
            text.includes("Projects")) &&
          div.children.length > 1 &&
          div.children.length < 50
        );
      });
    }

    // Filter out our vault sidebar if it somehow got the class
    const expandoSections = allExpandoSections.filter(
      (section) =>
        !section.id?.includes("sp-vault") &&
        !section.classList.contains("sp-vault-sidebar") &&
        !section.querySelector("#sp-vault-sidebar"),
    );

    if (expandoSections.length < 1) {
      return;
    }

    // FIRST: Remove any existing Tools & GPTs groups that might be in wrong locations
    const existingGroups = Array.from(
      document.querySelectorAll(".sp-vault-tools-group"),
    );
    existingGroups.forEach((existingGroup, idx) => {
      const insideSidebar = navSidebar.contains(existingGroup);
      if (!insideSidebar || idx > 0) {
        existingGroup.remove();
      }
    });

    // Check if we already created the group IN THE SIDEBAR
    if (navSidebar.querySelector(".sp-vault-tools-group")) {
      return; // Already have a group in the correct location
    }

    // Log each section to understand what we have
    expandoSections.forEach((section, idx) => {
      const preview = section.textContent?.slice(0, 60).replace(/\s+/g, " ");
    });

    // We want GPTs and Projects sections
    // Look for sections containing "GPTs" or "Projects" text
    const targetSections = [];

    expandoSections.forEach((section) => {
      const text = section.textContent || "";
      // IMPORTANT: Only match sections that are actual GPT/Project containers
      // They should have specific classes or be relatively small containers
      const isSmallEnough = section.children.length < 30;
      // Safely check className - it might be SVGAnimatedString or other type
      const classNameStr =
        typeof section.className === "string"
          ? section.className
          : section.className?.baseVal || section.getAttribute?.("class") || "";
      const hasExpandoClass = classNameStr.includes("sidebar-expando");

      // Check if it's the GPTs section (contains "GPT" - note: no 's needed, and case insensitive)
      if (
        (text.includes("GPT") ||
          text.includes("Explore") ||
          text.includes("Verkennen")) &&
        isSmallEnough
      ) {
        targetSections.push(section);
      }
      // Check if it's the Projects section (contains "Project" - singular or plural)
      else if (
        (text.includes("Project") || text.includes("Nieuw project")) &&
        isSmallEnough
      ) {
        targetSections.push(section);
      }
    });

    if (targetSections.length === 0) {
      return;
    }

    // Log what we're grouping
    targetSections.forEach((section, idx) => {
      const preview = section.textContent?.slice(0, 60).replace(/\s+/g, " ");
    });

    const container = targetSections[0].parentNode;
    if (!container) {
      return;
    }

    // CRITICAL: Check if there's a sibling div with id="thread-bottom"
    // If so, we're in the notification/banner area, not the sidebar
    const parent = container.parentElement;
    if (parent) {
      const threadBottomSibling = parent.querySelector("#thread-bottom");
      if (threadBottomSibling) {
        // In notification/banner area, skip Tools & GPTs injection
        return;
      }
    }

    // Create the collapsible group
    const groupElement = document.createElement("div");
    groupElement.className = "sp-vault-tools-group sp-vault-tools-collapsed";

    const headerElement = document.createElement("div");
    headerElement.className = "sp-vault-tools-header";
    headerElement.innerHTML = `
      <span class="sp-vault-tools-chevron"></span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: 0.9;">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
      <span class="sp-vault-tools-label">${getTranslation(
        "toolsAndGpts",
      )}</span>
    `;

    const contentElement = document.createElement("div");
    contentElement.className = "sp-vault-tools-content";

    // Build structure first
    groupElement.appendChild(headerElement);
    groupElement.appendChild(contentElement);

    // Insert group AFTER our vault sidebar if it exists, otherwise before first target section
    const vaultSidebar = document.getElementById("sp-vault-sidebar");
    if (vaultSidebar && vaultSidebar.parentNode === container) {
      // Insert after vault sidebar
      if (vaultSidebar.nextSibling) {
        container.insertBefore(groupElement, vaultSidebar.nextSibling);
      } else {
        container.appendChild(groupElement);
      }
    } else {
      // Fallback: insert before first target section
      container.insertBefore(groupElement, targetSections[0]);
    }

    // Move target sections into the group
    targetSections.forEach((section, idx) => {
      contentElement.appendChild(section);
    });

    // Add click handler for collapse/expand
    headerElement.addEventListener("click", () => {
      const isCollapsed = groupElement.classList.contains(
        "sp-vault-tools-collapsed",
      );
      if (isCollapsed) {
        groupElement.classList.remove("sp-vault-tools-collapsed");
      } else {
        groupElement.classList.add("sp-vault-tools-collapsed");
      }
    });
  }

  // ============================================================================
  // HELPER: Remove Tools & GPTs group
  // ============================================================================

  function removeToolsGroup() {
    const group = document.querySelector(".sp-vault-tools-group");
    if (!group) return;

    // Get the container
    const container = group.parentNode;
    const contentElement = group.querySelector(".sp-vault-tools-content");

    if (contentElement && container) {
      // Move all expando sections back to their original container
      const sections = contentElement.querySelectorAll(
        ".group\\/sidebar-expando-section",
      );
      sections.forEach((section) => {
        container.insertBefore(section, group);
      });
    }

    // Remove the group
    group.remove();
  }

  // ============================================================================
  // CORE: Request vault data from content script
  // ============================================================================

  function requestVaultData() {
    const requestId = `vault-${Date.now()}`;

    window.postMessage(
      {
        type: "sp-request-vault-sidebar-data",
        source: "superprompt-page",
        requestId,
      },
      "*",
    );
  }

  // ============================================================================
  // GLOBAL REFRESH FUNCTION: Expose for external triggers (category updates, etc.)
  // ============================================================================

  /**
   * Global function to trigger vault sidebar refresh
   * Called by vault-event-relay.js when categories/chats are updated
   */
  window.triggerVaultSidebarRefresh = function () {
    // Clear cached data and request fresh data from content script
    activeVaultData = null;
    requestVaultData();
  };

  // ============================================================================
  // SEARCH: Filter chats by search term
  // ============================================================================

  /**
   * Search all chats for matching titles (case-insensitive)
   * @param {Array} allChats - All chats from vault data
   * @param {string} searchTerm - Search term to filter by
   * @returns {Array} - Filtered chats matching the search term
   */
  function filterChatsBySearch(allChats, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return allChats;
    }

    const term = searchTerm.toLowerCase().trim();
    return allChats.filter((chat) => {
      const title = (chat.title || "Untitled").toLowerCase();
      return title.includes(term);
    });
  }

  /**
   * Highlight search term in chat title
   * @param {string} title - Original chat title
   * @param {string} searchTerm - Term to highlight
   * @returns {string} - HTML with highlighted term
   */
  function highlightSearchTerm(title, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return escapeHtml(title);
    }

    const term = searchTerm.trim();
    const escapedTitle = escapeHtml(title);

    // Case-insensitive replace with highlighting
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    return escapedTitle.replace(
      regex,
      '<mark style="background: #fbbf24; color: #000; padding: 0 2px; border-radius: 2px; font-weight: 600;">$1</mark>',
    );
  }

  /**
   * Escape special regex characters
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Handle search input with debouncing
   */
  function handleSearchInput(event) {
    const searchTerm = event.target.value;
    currentSearchTerm = searchTerm;

    // Clear existing debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Debounce the search
    searchDebounceTimer = setTimeout(() => {
      // Re-render with search filter
      if (activeVaultData) {
        renderSidebar(activeVaultData);
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  /**
   * Clear search and reset view
   */
  function clearSearch() {
    currentSearchTerm = "";
    const searchInput = sidebarContainer?.querySelector(
      ".sp-vault-search-input",
    );
    if (searchInput) {
      searchInput.value = "";
    }

    if (activeVaultData) {
      renderSidebar(activeVaultData);
    }
  }

  /**
   * Check if a category or its children contain matching chats
   * @param {Object} category - Category to check
   * @param {Array} allChats - All chats
   * @param {string} searchTerm - Search term
   * @returns {boolean} - True if category has matches
   */
  function categoryHasMatches(category, allChats, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return true; // No search active, show all
    }

    // Check if this category has matching chats
    const categoryChats = allChats.filter((c) => c.categoryId === category.id);

    const matchingChats = filterChatsBySearch(categoryChats, searchTerm);

    if (matchingChats.length > 0) {
      return true;
    }

    // Recursively check child categories
    const children = category.children || [];
    return children.some((child) =>
      categoryHasMatches(child, allChats, searchTerm),
    );
  }

  /**
   * Filter categories to only show those with matches (or with children that have matches)
   * @param {Array} categories - Categories to filter
   * @param {Array} allChats - All chats
   * @param {string} searchTerm - Search term
   * @returns {Array} - Filtered categories
   */
  function filterCategoriesWithMatches(categories, allChats, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return categories; // No search active, show all
    }

    return categories.filter((category) =>
      categoryHasMatches(category, allChats, searchTerm),
    );
  }

  /**
   * Check if category should be expanded during search
   * (auto-expand categories with matches)
   */
  function shouldExpandCategoryForSearch(categoryId, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return false; // No auto-expand when no search
    }

    // During active search, expand all categories with matches
    return true;
  }

  // ============================================================================
  // CORE: Render sidebar with data
  // ============================================================================

  function renderSidebar(data) {
    if (!sidebarContainer) {
      devWarn("?? [VAULT] No sidebar container, cannot render");
      return;
    }

    activeVaultData = {
      ...data,
      userTier: data?.subscriptionPlan || (data?.isPro ? "pro" : "free"),
    };

    let { activeVaultName, categories, chats } = activeVaultData;

    // Use chats from IndexedDB (already synced by extension)
    const allChats = chats || [];

    // Separate special categories (Favorites and Archived)
    // Note: chats are already sorted by update_time (newest first) from content script
    const favoritedChats = allChats.filter((c) => c.is_starred || c.favorite);
    const archivedChats = allChats.filter((c) => c.is_archived);
    const regularChats = allChats.filter((c) => !c.is_archived); // Regular chats exclude archived

    // Separate categorized and uncategorized chats (from regular chats only)
    const categorizedChats = regularChats.filter((c) => c.categoryId);
    const uncategorizedChats = regularChats.filter((c) => !c.categoryId);

    // Add "Uncategorized" category if there are uncategorized chats
    if (uncategorizedChats.length > 0) {
      const hasUncategorized = categories?.some(
        (cat) => cat.id === "uncategorized",
      );

      if (!hasUncategorized) {
        const uncategorizedCategory = {
          id: "uncategorized",
          name: getTranslation("uncategorized"),
          color: "#6b7280",
          textcolor: "#ffffff",
          borderColor: "#4b5563",
          icon: "📁",
        };

        categories = [...(categories || []), uncategorizedCategory];

        // IMPORTANT: Update activeVaultData so the category persists across re-renders
        activeVaultData.categories = categories;
      }

      // Assign uncategorized chats to the Uncategorized category
      uncategorizedChats.forEach((chat) => {
        chat.categoryId = "uncategorized";
      });
    }

    // CRITICAL: Initialize default collapsed state ALWAYS (not just when uncategorized exists)
    // This must happen AFTER all categories are finalized but BEFORE rendering
    initializeDefaultCollapsedState();

    // Get theme colors based on ChatGPT's active color-scheme
    const themeColors = getVaultSidebarThemeColors();
    const textColor = themeColors.text;
    const secondaryText = themeColors.textSecondary;
    const bgSecondary = themeColors.bgSecondary;
    const bgTertiary = themeColors.bgTertiary;
    const borderColor = themeColors.border;
    const borderLight = themeColors.borderLight;

    // Filter chats by search term if active
    let filteredRegularChats = regularChats;
    let filteredFavoritedChats = favoritedChats;
    let filteredArchivedChats = archivedChats;
    let filteredCategories = categories;

    const isSearchActive = currentSearchTerm && currentSearchTerm.trim();

    if (isSearchActive) {
      filteredRegularChats = filterChatsBySearch(
        regularChats,
        currentSearchTerm,
      );
      filteredFavoritedChats = filterChatsBySearch(
        favoritedChats,
        currentSearchTerm,
      );
      filteredArchivedChats = filterChatsBySearch(
        archivedChats,
        currentSearchTerm,
      );

      // Filter categories to only show those with matches
      filteredCategories = filterCategoriesWithMatches(
        categories,
        regularChats,
        currentSearchTerm,
      );
    }

    // Build HTML with inline styles for reliability
    const html = `
      <div class="sp-vault-header" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${borderColor}; display: flex; align-items: center; justify-content: space-between;">
        <button 
          class="sp-vault-name-btn"
          title="${getTranslation("switchWorkspace")}"
          style="
            margin: 0; 
            padding: 6px 10px;
            font-size: 14px; 
            font-weight: 600; 
            color: ${textColor};
            background: ${bgSecondary};
            border: 1px solid ${borderLight};
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
          "
        >
          <span>${
            data.activeVaultIcon
              ? getWorkspaceIconSvg(data.activeVaultIcon, textColor, 16)
              : "📦"
          }</span>
          <span>${activeVaultName || "Workspace"}</span>
          <svg style="width: 12px; height: 12px; opacity: 0.6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <button 
          class="sp-vault-collapse-all-btn" 
          title="${
            areAllCategoriesCollapsed()
              ? getTranslation("expandAllFolders")
              : getTranslation("collapseAllFolders")
          }"
          style="
            background: ${bgSecondary};
            border: 1px solid ${borderLight};
            border-radius: 6px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            color: ${secondaryText};
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
          "
        >
          <span style="font-size: 12px;">${
            areAllCategoriesCollapsed() ? "▼" : "▲"
          }</span>
          <span>${
            areAllCategoriesCollapsed()
              ? getTranslation("expandAll")
              : getTranslation("collapseAll")
          }</span>
        </button>
      </div>

      <!-- Premium Search Bar -->
      <div class="sp-vault-search-container" style="margin-bottom: 16px; position: relative;">
        <div style="position: relative; display: flex; align-items: center;">
          <!-- Search Icon -->
          <svg style="position: absolute; left: 12px; width: 16px; height: 16px; opacity: 0.5; pointer-events: none;" viewBox="0 0 24 24" fill="none" stroke="${secondaryText}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          
          <!-- Search Input -->
          <input 
            type="text" 
            class="sp-vault-search-input"
            placeholder="${getTranslation("searchConversations")}"
            value="${escapeHtml(currentSearchTerm)}"
            style="
              width: 100%;
              padding: 10px 38px 10px 40px;
              background: ${bgSecondary};
              border: 1px solid ${borderLight};
              border-radius: 8px;
              color: ${textColor};
              font-size: 13px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              transition: all 0.2s ease;
              outline: none;
              box-shadow: 0 0 0 0 rgba(20, 184, 166, 0);
            "
          />

          <!-- Clear Button (shown when search has text) -->
          ${
            currentSearchTerm
              ? `
          <button 
            class="sp-vault-search-clear"
            title="Clear search"
            style="
              position: absolute;
              right: 8px;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${bgTertiary};
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              padding: 0;
            "
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          `
              : ""
          }
        </div>
        ${
          currentSearchTerm
            ? `
        <div style="margin-top: 8px; font-size: 11px; color: ${secondaryText}; padding-left: 12px;">
          Filtering by: <span style="color: #fbbf24; font-weight: 500;">"${escapeHtml(
            currentSearchTerm,
          )}"</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="sp-vault-content" style="display: flex; flex-direction: column; gap: 8px; overflow: visible !important; max-height: none !important;">
        ${renderSpecialCategories(
          filteredFavoritedChats,
          filteredArchivedChats,
          textColor,
          secondaryText,
          bgSecondary,
          bgTertiary,
        )}
        ${renderCategories(
          filteredCategories,
          filteredRegularChats,
          textColor,
          secondaryText,
          bgSecondary,
          bgTertiary,
          isSearchActive,
        )}
        ${
          allChats.length === 0
            ? renderEmptyState(
                textColor,
                secondaryText,
                bgSecondary,
                borderLight,
              )
            : ""
        }
      </div>
    `;

    // Cleanup existing event listeners before replacing DOM
    if (sidebarContainer) {
      const existingChatItems =
        sidebarContainer.querySelectorAll(".sp-vault-chat");
      existingChatItems.forEach((chatItem) => {
        if (chatItem._cleanupHoverEvents) {
          chatItem._cleanupHoverEvents();
        }
      });
    }

    sidebarContainer.innerHTML = html;

    // Ensure accent CSS variables are available for injected SVG icons
    const accentVars = resolveSuperPromptAccentVars();
    if (accentVars && sidebarContainer) {
      sidebarContainer.style.setProperty("--color-accent", accentVars.primary);
      sidebarContainer.style.setProperty(
        "--color-accent-hover",
        accentVars.hover || accentVars.primary,
      );
      if (accentVars.light) {
        sidebarContainer.style.setProperty(
          "--color-accent-light",
          accentVars.light,
        );
      }
      if (accentVars.shadow) {
        sidebarContainer.style.setProperty(
          "--color-accent-shadow",
          accentVars.shadow,
        );
      }
      // Set RGB version for rgba() usage in selection backgrounds
      const rgbValue = hexToRgb(accentVars.primary);
      if (rgbValue) {
        sidebarContainer.style.setProperty("--sp-accent-rgb", rgbValue);
      }
    }

    // Attach error listeners for avatars (CSP safe)
    const avatars = sidebarContainer.querySelectorAll(".sp-vault-chat-avatar");

    avatars.forEach((img) => {
      const handleError = () => {
        const gizmoId = img.getAttribute("data-gizmo-id") || "";
        const projectId = img.getAttribute("data-project-id") || "";

        // Determine if this is a GPT chat (not a project)
        const isProjectChat = !!(
          (gizmoId && gizmoId.startsWith("g-p-")) ||
          (projectId && projectId.startsWith("g-p-"))
        );
        const isGptChat = !!gizmoId && !isProjectChat;

        img.style.display = "none";
        const badge = img.parentNode.querySelector(
          ".sp-vault-chat-project-badge",
        );

        if (badge) {
          // Update SVG paths based on chat type
          if (isGptChat) {
            badge.innerHTML =
              '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>';
          } else {
            badge.innerHTML =
              '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
          }
          badge.setAttribute("stroke", "var(--color-accent)");
          badge.setAttribute("fill", "none");
          badge.style.display = "block";
          badge.style.position = "static";
        }
      };

      img.addEventListener("error", handleError);

      // Check if already failed (image complete but no dimensions)
      if (img.complete && img.naturalHeight === 0) {
        handleError();
      }
    });

    // Resolve GPT avatar URLs via content script (auth-required fetch)
    avatars.forEach((img) => {
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (!/\/backend-api\/estuary\/content/i.test(src)) return;
      if (img.dataset.resolving === "1" || img.dataset.resolved === "1") return;

      img.dataset.resolving = "1";
      const requestId = `resolve-avatar-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      const handleResponse = (event) => {
        const data = event.data;
        if (
          event.source !== window ||
          !data ||
          data.type !== "sp-resolve-avatar-response" ||
          data.requestId !== requestId
        )
          return;

        window.removeEventListener("message", handleResponse);
        img.dataset.resolving = "0";

        if (data.success && data.url) {
          img.dataset.resolved = "1";
          img.src = data.url;
          img.style.display = "block";

          const badge = img.parentNode.querySelector(
            ".sp-vault-chat-project-badge",
          );
          if (badge) {
            badge.style.display = "none";
          }
        }
      };

      window.addEventListener("message", handleResponse);
      window.postMessage(
        {
          type: "sp-resolve-avatar",
          requestId,
          pointer: src,
        },
        "*",
      );

      // Cleanup listener if no response
      setTimeout(() => {
        window.removeEventListener("message", handleResponse);
        img.dataset.resolving = "0";
      }, 10000);
    });

    // Attach event listener for search input
    const searchInput = sidebarContainer.querySelector(
      ".sp-vault-search-input",
    );
    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput);
    }

    // Attach event listener for search clear button
    const searchClear = sidebarContainer.querySelector(
      ".sp-vault-search-clear",
    );
    if (searchClear) {
      searchClear.addEventListener("click", (e) => {
        e.stopPropagation();
        clearSearch();
      });
    }

    // Attach event listener for vault name button (opens workspace selector)
    attachVaultNameButtonListener();

    // Attach event listener for collapse/expand all button
    attachCollapseAllButtonListener();

    // Attach event listeners for category collapse/expand
    attachCategoryEventListeners();

    // Attach event listeners for chat clicks
    attachChatEventListeners();

    // Attach "Load More" button listeners
    attachLoadMoreButtonListeners();

    // Attach event listeners for project badges
    attachProjectBadgeListeners();

    // Attach hover effects (non-inline to avoid CSP errors)
    attachHoverEffects();

    // Attach category menu button hover effects
    attachCategoryMenuHoverEffects();

    // Attach category menu button click handlers
    attachCategoryMenuHandlers();

    // Reset any stuck hover states before attaching new effects
    if (typeof window.resetVaultChatHoverStates === "function") {
      window.resetVaultChatHoverStates();
    }

    // Attach chat menu button hover effects
    attachChatMenuHoverEffects();

    // Attach chat menu button click handlers
    attachChatMenuHandlers();

    // Attach "Load More" button listeners
    attachLoadMoreButtonListeners();

    // Check and update notes badges for all chats
    updateNotesBadges();

    // Attach click listeners for notes badges
    attachNotesBadgeListeners();

    // Attach empty-state CTA listener
    attachEmptyStateButtonListener();
  }

  // ============================================================================
  // UI: Attach event listener for collapse/expand all button
  // ============================================================================

  // ============================================================================
  // UI: Attach event listener for vault name button (opens workspace selector)
  // ============================================================================

  function openWorkspaceSelector() {
    window.postMessage(
      {
        type: "SUPERPROMPT_OPEN_VAULT_SELECTOR",
        source: "superprompt-page",
      },
      "*",
    );

    devLog("📦 [VAULT] Opening workspace selector...");
  }

  function attachVaultNameButtonListener() {
    if (!sidebarContainer) return;

    const vaultNameBtn = sidebarContainer.querySelector(".sp-vault-name-btn");

    if (!vaultNameBtn) {
      devWarn("📦 [VAULT] Vault name button not found");
      return;
    }

    // Get current theme colors
    const themeColors = getVaultSidebarThemeColors();

    // Add hover effect with theme-aware colors
    vaultNameBtn.addEventListener("mouseenter", () => {
      vaultNameBtn.style.background = themeColors.hoverBg;
      vaultNameBtn.style.borderColor = themeColors.accent;
      vaultNameBtn.style.color = themeColors.text;
    });

    vaultNameBtn.addEventListener("mouseleave", () => {
      vaultNameBtn.style.background = themeColors.bgSecondary;
      vaultNameBtn.style.borderColor = themeColors.borderLight;
      vaultNameBtn.style.color = themeColors.text;
    });

    // Add click handler to open workspace selector
    vaultNameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openWorkspaceSelector();
    });
  }

  // ============================================================================
  // UI: Attach event listener for collapse/expand all button
  // ============================================================================

  function attachCollapseAllButtonListener() {
    if (!sidebarContainer) return;

    const collapseAllBtn = sidebarContainer.querySelector(
      ".sp-vault-collapse-all-btn",
    );

    if (!collapseAllBtn) {
      devWarn("📦 [VAULT] Collapse all button not found");
      return;
    }

    // Get current theme colors
    const themeColors = getVaultSidebarThemeColors();

    // Add hover effect with theme-aware colors
    collapseAllBtn.addEventListener("mouseenter", () => {
      collapseAllBtn.style.background = themeColors.hoverBg;
      collapseAllBtn.style.borderColor = themeColors.borderLight;
      collapseAllBtn.style.color = themeColors.text;
    });

    collapseAllBtn.addEventListener("mouseleave", () => {
      collapseAllBtn.style.background = themeColors.bgSecondary;
      collapseAllBtn.style.borderColor = themeColors.borderLight;
      collapseAllBtn.style.color = themeColors.textSecondary;
    });

    // Add click handler
    collapseAllBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const shouldCollapse = !areAllCategoriesCollapsed();

      if (shouldCollapse) {
        collapseAllCategories();
      } else {
        expandAllCategories();
      }

      // Re-render to apply changes
      renderSidebar(activeVaultData);
    });
  }

  // ============================================================================
  // UI: Attach event listener for empty-state CTA
  // ============================================================================

  function attachEmptyStateButtonListener() {
    if (!sidebarContainer) return;

    const emptyStateBtn = sidebarContainer.querySelector(".sp-vault-empty-cta");

    if (!emptyStateBtn) {
      return;
    }

    const themeColors = getVaultSidebarThemeColors();

    const applyDefaultStyles = () => {
      emptyStateBtn.style.background = themeColors.bgSecondary;
      emptyStateBtn.style.borderColor = themeColors.borderLight;
      emptyStateBtn.style.color = themeColors.accent;
      emptyStateBtn.style.boxShadow = "0 4px 14px rgba(0,0,0,0.2)";
    };

    const applyHoverStyles = () => {
      emptyStateBtn.style.background = themeColors.hoverBg;
      emptyStateBtn.style.borderColor = themeColors.accent;
      emptyStateBtn.style.color = themeColors.text;
      emptyStateBtn.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
    };

    applyDefaultStyles();

    emptyStateBtn.addEventListener("mouseenter", applyHoverStyles);
    emptyStateBtn.addEventListener("mouseleave", applyDefaultStyles);

    emptyStateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openWorkspaceSelector();
    });
  }

  // ============================================================================
  // CATEGORY DELETION: Handle category deletion with confirmation
  // ============================================================================

  function handleDeleteCategory(categoryId) {
    // Find the category in our data
    if (!activeVaultData || !activeVaultData.categories) {
      devError("? [VAULT] No active vault data");
      return;
    }

    // Helper to find category and its parent recursively
    // Compare both as strings to handle number/string mismatch
    function findCategory(categories, targetId, parent = null) {
      const targetIdStr = String(targetId);
      for (const cat of categories) {
        if (String(cat.id) === targetIdStr) {
          return { category: cat, parent };
        }
        // Support both 'subcategories' and 'children' properties
        const subCats = cat.subcategories || cat.children;
        if (subCats && subCats.length > 0) {
          const found = findCategory(subCats, targetId, cat);
          if (found) return found;
        }
      }
      return null;
    }

    const result = findCategory(activeVaultData.categories, categoryId);
    if (!result) {
      devError("? [VAULT] Category not found:", categoryId);
      return;
    }

    const { category, parent } = result;

    const normalizeId = (value) => String(value);

    // Count affected items
    const affectedCats = getAllDescendantCategories(category);
    const allAffectedCategoryIds = [
      category.id,
      ...affectedCats.map((c) => c.id),
    ].map(normalizeId);

    // Count chats in these categories
    const affectedChats = (activeVaultData.chats || []).filter((chat) => {
      if (!chat.categoryId) return false;
      return allAffectedCategoryIds.includes(normalizeId(chat.categoryId));
    });

    const subcategoryCount = affectedCats.length;
    const chatCount = affectedChats.length;

    // Show confirmation dialog
    showDeleteCategoryConfirmation(
      category,
      subcategoryCount,
      chatCount,
      () => {
        // On confirm, execute deletion
        executeCategoryDeletion(
          category,
          allAffectedCategoryIds,
          affectedChats,
        );
      },
    );
  }

  // Helper: Get all descendant categories recursively
  function getAllDescendantCategories(category) {
    let descendants = [];
    // Support both 'subcategories' and 'children' properties
    const subCats = category.subcategories || category.children;
    if (subCats) {
      for (const sub of subCats) {
        descendants.push(sub);
        descendants = descendants.concat(getAllDescendantCategories(sub));
      }
    }
    return descendants;
  }

  // Show confirmation dialog for category deletion
  function showDeleteCategoryConfirmation(
    category,
    subcategoryCount,
    chatCount,
    onConfirm,
  ) {
    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000000;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    // Create dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: #2d2d2d;
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s ease, opacity 0.2s ease;
      opacity: 0;
    `;

    // Dialog content
    dialog.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
        <div style="flex-shrink: 0; width: 48px; height: 48px; background: rgba(239, 68, 68, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">🗑️</span>
        </div>
        <div>
          <h2 style="margin: 0 0 8px 0; color: #f87171; font-size: 20px; font-weight: bold;">
            Delete "${category.name}"?
          </h2>
          <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.5;">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #ef4444; font-size: 14px; font-weight: 600;">
          ? What will be deleted:
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #e5e7eb; font-size: 13px; line-height: 1.8;">
          <li>The category "<strong>${category.name}</strong>"</li>
          ${
            subcategoryCount > 0
              ? `<li><strong>${subcategoryCount}</strong> subcategor${
                  subcategoryCount === 1 ? "y" : "ies"
                }</li>`
              : ""
          }
          ${
            chatCount > 0
              ? `<li><strong>${chatCount}</strong> conversation${
                  chatCount === 1 ? "" : "s"
                } (deleted from ChatGPT)</li>`
              : ""
          }
        </ul>
      </div>

      ${
        chatCount > 0
          ? `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <p style="margin: 0; color: #fbbf24; font-size: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">⚠️</span>
            <span>Conversations will be permanently deleted from ChatGPT servers</span>
          </p>
        </div>
      `
          : ""
      }

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="sp-cancel-delete" style="
          padding: 10px 20px;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 6px;
          color: #e5e7eb;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        ">
          Cancel
        </button>
        <button id="sp-confirm-delete" style="
          padding: 10px 20px;
          background: #ef4444;
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        ">
          Delete ${
            chatCount > 0
              ? `& Remove ${chatCount} Chat${chatCount === 1 ? "" : "s"}`
              : "Category"
          }
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Get button references AFTER appending to DOM
    const cancelBtn = dialog.querySelector("#sp-cancel-delete");
    const confirmBtn = dialog.querySelector("#sp-confirm-delete");

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Button hover effects

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#4b5563";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#374151";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.background = "#dc2626";
    });
    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.background = "#ef4444";
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
      confirmBtn.style.opacity = "0.5";
      confirmBtn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
          Deleting...
        </span>
      `;

      // Add spin animation only once (prevent CSS-Watchdog warnings)
      if (!document.getElementById("sp-spin-animation")) {
        const style = document.createElement("style");
        style.id = "sp-spin-animation";
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      try {
        await onConfirm();
        closeDialog();
      } catch (error) {
        devError("? [VAULT] Delete failed:", error);
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.textContent = "Delete Failed - Try Again";
        confirmBtn.style.background = "#991b1b";
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
  }

  // Handle unfavoriting all chats in the Favorites category
  async function handleUnfavoriteAllChats() {
    if (!activeVaultData || !activeVaultData.chats) {
      devError("❌ [VAULT] No active vault data");
      return;
    }

    // Get all favorited chats
    const favoritedChats = activeVaultData.chats.filter(
      (chat) => chat.is_starred || chat.favorite,
    );

    if (favoritedChats.length === 0) {
      alert("No favorited chats found.");
      return;
    }

    // Show confirmation dialog via React ConfirmDialog
    const confirmed = await new Promise((resolve) => {
      const requestId = `confirm-unfavorite-all-${Date.now()}-${Math.random()}`;

      devLog(
        `🔔 [VAULT] Showing unfavorite all confirmation dialog, requestId: ${requestId}`,
      );

      const handleConfirmResponse = (event) => {
        if (
          event.data.type === "sp-confirm-response" &&
          event.data.requestId === requestId
        ) {
          devLog(
            `✅ [VAULT] Received confirmation response: ${event.data.confirmed}`,
          );
          window.removeEventListener("message", handleConfirmResponse);
          resolve(event.data.confirmed);
        }
      };

      window.addEventListener("message", handleConfirmResponse);

      // Show React ConfirmDialog
      window.postMessage(
        {
          type: "sp-show-confirm-dialog",
          requestId,
          payload: {
            title: "Unfavorite all chats?",
            description: `This will remove all ${favoritedChats.length} chat${
              favoritedChats.length === 1 ? "" : "s"
            } from your favorites.`,
            confirmLabel: "Unfavorite All",
            cancelLabel: "Cancel",
            confirmVariant: "primary",
          },
        },
        "*",
      );
    });

    if (!confirmed) {
      return;
    }

    devLog(
      `🔄 [VAULT] Unfavoriting ${favoritedChats.length} chat${
        favoritedChats.length === 1 ? "" : "s"
      }...`,
    );

    // 🚀 OPTIMISTIC UPDATE: Update local state immediately
    for (const chat of favoritedChats) {
      chat.is_starred = false;
      chat.favorite = false;
    }

    const successCount = favoritedChats.length;

    // 🚀 Refresh UI immediately with updated data (optimistic)
    devLog(
      `🚀 [VAULT] Optimistic update: refreshing UI with ${successCount} unfavorited chats`,
    );
    renderSidebar(activeVaultData); // Re-render with optimistically updated data

    // 🔄 Sync to IndexedDB in the background (NO ChatGPT API - favorites are SuperPrompt-only!)
    devLog(
      `🔄 [VAULT] Syncing ${successCount} unfavorites to IndexedDB in background...`,
    );

    for (const chat of favoritedChats) {
      // Save to IndexedDB via content script (local storage only, no ChatGPT API)
      window.postMessage(
        {
          type: "sp-save-favorite-local",
          chatId: chat.id,
          isFavorite: false,
        },
        "*",
      );
    }

    devLog(
      `✅ [VAULT] Unfavorited ${successCount} chat${successCount === 1 ? "" : "s"}`,
    );

    // No need for additional refresh - already done optimistically
  }

  // Handle deleting only chats in a special category (Favorites, Archived, Uncategorized)
  async function handleDeleteChatsInCategory(categoryId) {
    if (!activeVaultData || !activeVaultData.chats) {
      devError("? [VAULT] No active vault data");
      return;
    }

    let categoryName = "";
    let affectedChats = [];

    // Special handling for system categories
    if (categoryId === "sp-special-favorites") {
      categoryName = "Favorites";
      affectedChats = activeVaultData.chats.filter(
        (chat) => chat.is_starred || chat.favorite,
      );
    } else if (categoryId === "sp-special-archived") {
      categoryName = "Archived";
      affectedChats = activeVaultData.chats.filter((chat) => chat.is_archived);
    } else if (categoryId === "uncategorized") {
      categoryName = getTranslation("uncategorized");
      // Uncategorized: chats without a categoryId or with categoryId = 'uncategorized'
      affectedChats = activeVaultData.chats.filter(
        (chat) =>
          !chat.categoryId || String(chat.categoryId) === "uncategorized",
      );
    } else {
      // Regular category - find it in the data
      function findCategory(categories, targetId, parent = null) {
        const targetIdStr = String(targetId);
        for (const cat of categories) {
          if (String(cat.id) === targetIdStr) {
            return { category: cat, parent };
          }
          const subCats = cat.subcategories || cat.children;
          if (subCats && subCats.length > 0) {
            const found = findCategory(subCats, targetId, cat);
            if (found) return found;
          }
        }
        return null;
      }

      const result = findCategory(activeVaultData.categories || [], categoryId);
      if (!result) {
        devError("? [VAULT] Category not found:", categoryId);
        return;
      }

      categoryName = result.category.name;
      affectedChats = activeVaultData.chats.filter(
        (chat) => String(chat.categoryId) === String(categoryId),
      );
    }

    if (affectedChats.length === 0) {
      alert(`No chats found in "${categoryName}".`);
      return;
    }

    // Show confirmation dialog
    showDeleteChatsConfirmation(
      categoryName,
      affectedChats.length,
      async () => {
        // Delete only the chats, not the category
        await executeChatsOnlyDeletion(affectedChats);
      },
    );
  }

  // Show confirmation dialog for deleting chats only (not the category)
  function showDeleteChatsConfirmation(categoryName, chatCount, onConfirm) {
    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000000;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    // Create dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: #2d2d2d;
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s ease, opacity 0.2s ease;
      opacity: 0;
    `;

    // Dialog content
    dialog.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
        <div style="flex-shrink: 0; width: 48px; height: 48px; background: rgba(239, 68, 68, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">🗑️</span>
        </div>
        <div>
          <h2 style="margin: 0 0 8px 0; color: #f87171; font-size: 20px; font-weight: bold;">
            Delete chats in "${categoryName}"?
          </h2>
          <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.5;">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #ef4444; font-size: 14px; font-weight: 600;">
          ? What will be deleted:
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #e5e7eb; font-size: 13px; line-height: 1.8;">
          <li><strong>${chatCount}</strong> conversation${
            chatCount === 1 ? "" : "s"
          } from "${categoryName}"</li>
          <li style="color: #9ca3af;">The category will remain (only chats are deleted)</li>
        </ul>
      </div>

      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
        <p style="margin: 0; color: #fbbf24; font-size: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">⚠️</span>
          <span>Conversations will be permanently deleted from ChatGPT servers</span>
        </p>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="sp-cancel-delete-chats" style="
          padding: 10px 20px;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 6px;
          color: #e5e7eb;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        ">
          Cancel
        </button>
        <button id="sp-confirm-delete-chats" style="
          padding: 10px 20px;
          background: #ef4444;
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        ">
          Delete ${chatCount} Chat${chatCount === 1 ? "" : "s"}
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
    const cancelBtn = dialog.querySelector("#sp-cancel-delete-chats");
    const confirmBtn = dialog.querySelector("#sp-confirm-delete-chats");

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#4b5563";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#374151";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.background = "#dc2626";
    });
    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.background = "#ef4444";
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
      confirmBtn.style.opacity = "0.5";
      confirmBtn.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
          Deleting...
        </span>
      `;

      // Add spin animation only once (prevent CSS-Watchdog warnings)
      if (!document.getElementById("sp-spin-animation")) {
        const style = document.createElement("style");
        style.id = "sp-spin-animation";
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      try {
        await onConfirm();
        closeDialog();
      } catch (error) {
        devError("? [VAULT] Delete chats failed:", error);
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.textContent = "Delete Failed - Try Again";
        confirmBtn.style.background = "#991b1b";
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
  }

  // Execute deletion of chats only (category stays)
  async function executeChatsOnlyDeletion(affectedChats) {
    // Delete each chat from ChatGPT API
    let deletedCount = 0;
    let deletedChatIds = [];
    let errors = [];

    for (const chat of affectedChats) {
      try {
        // Send message to content script to delete from API and IndexedDB
        const response = await new Promise((resolve, reject) => {
          const requestId = `delete-chat-${Date.now()}-${Math.random()}`;

          const handleResponse = (event) => {
            if (
              event.data.type === "sp-response" &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener("message", handleResponse);
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error || "Delete failed"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Timeout deleting chat"));
          }, 10000);

          window.postMessage(
            {
              type: "sp-delete-chat-from-api",
              requestId,
              chatId: chat.id,
            },
            "*",
          );
        });

        if (response.success) {
          deletedCount++;
          deletedChatIds.push(chat.id);
        }
      } catch (error) {
        devError(`? [VAULT] Failed to delete chat ${chat.id}:`, error);
        errors.push({ chatId: chat.id, error: error.message });
      }
    }

    if (errors.length > 0) {
      devWarn(`?? [VAULT] Some chats failed to delete:`, errors);
      alert(
        `Deleted ${deletedCount} chats. ${errors.length} failed to delete.`,
      );
    }

    // Refresh vault sidebar to show updated state
    setTimeout(() => {
      window.triggerVaultSidebarRefresh();

      // Notify Chat Management to update its counts via postMessage (cross-context communication)
      window.postMessage(
        {
          type: "sp-chats-deleted-from-vault",
          count: deletedCount,
          chatIds: deletedChatIds,
          source: "vault-sidebar",
        },
        "*",
      );
    }, 500);
  }

  // Execute the actual category deletion
  async function executeCategoryDeletion(
    category,
    allAffectedCategoryIds,
    affectedChats,
  ) {
    try {
      // Step 1: Delete all affected chats from ChatGPT API
      if (affectedChats.length > 0) {
        for (const chat of affectedChats) {
          try {
            // Send message to content script to delete chat via API
            window.postMessage(
              {
                type: "sp-delete-chat-from-api",
                chatId: String(chat.id),
              },
              "*",
            );
          } catch (error) {
            devError(`? [VAULT] Failed to delete chat ${chat.id}:`, error);
          }
        }

        // Wait a bit for API calls to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Step 2: Send message to content script to update storage (categories and chats)

      const requestId = `delete-cat-${Date.now()}`;

      window.postMessage(
        {
          type: "sp-delete-category-and-chats",
          requestId,
          categoryIds: allAffectedCategoryIds.map((id) => String(id)),
          chatIds: affectedChats.map((c) => String(c.id)),
        },
        "*",
      );

      // Wait for response
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Delete operation timed out"));
        }, 10000);

        const handler = (event) => {
          if (
            event.data?.type === "sp-delete-category-response" &&
            event.data?.requestId === requestId
          ) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);

            if (event.data.success) {
              resolve();
            } else {
              reject(new Error(event.data.error || "Delete failed"));
            }
          }
        };

        window.addEventListener("message", handler);
      });

      // Step 3: Request fresh vault data to re-render
      requestVaultData();
    } catch (error) {
      devError("? [VAULT] Category deletion failed:", error);
      throw error;
    }
  }

  // ============================================================================
  // CHAT ACTIONS: Handle individual chat actions from context menu
  // ============================================================================

  // Show premium error dialog
  function showErrorDialog(title, message, details = null) {
    const theme = getDialogThemeColors();

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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid ${theme.redWarningBorder};
      border-radius: 16px;
      padding: 28px;
      max-width: 480px;
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${
            theme.redTitle
          }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style="flex: 1;">
          <h2 style="margin: 0 0 8px 0; color: ${
            theme.redTitle
          }; font-size: 18px; font-weight: 600; line-height: 1.3;">
            ${title}
          </h2>
          <p style="margin: 0; color: ${
            theme.textColor
          }; font-size: 14px; line-height: 1.5;">
            ${message}
          </p>
        </div>
      </div>

      ${
        details
          ? `
      <div style="background: ${theme.redWarningBg}; border: 1px solid ${
        theme.redWarningBorder
      }; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0; color: ${
          theme.redTitle
        }; font-size: 13px; line-height: 1.6;">
          ${details.replace(
            /AIWorkspace (Free|Pro)/g,
            '<strong style="color: #14b8a6; font-weight: 700;">AIWorkspace $1</strong>',
          )}
        </p>
      </div>
      `
          : ""
      }

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="sp-error-ok-btn" style="
          padding: 10px 24px;
          background: ${theme.confirmBtnBg};
          border: 1px solid ${theme.confirmBtnBorder};
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: ${theme.confirmBtnShadow};
        ">
          OK
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

    // OK button hover effect
    const okBtn = dialog.querySelector("#sp-error-ok-btn");
    okBtn.addEventListener("mouseenter", () => {
      okBtn.style.transform = "translateY(-2px)";
      okBtn.style.boxShadow = theme.confirmBtnHoverShadow;
    });
    okBtn.addEventListener("mouseleave", () => {
      okBtn.style.transform = "translateY(0)";
      okBtn.style.boxShadow = theme.confirmBtnShadow;
    });

    // Close function
    const closeDialog = () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.9) translateY(-20px)";
      setTimeout(() => overlay.remove(), 200);
    };

    // OK button
    okBtn.addEventListener("click", closeDialog);

    // Click outside to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDialog();
    });

    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeDialog();
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);
  }

  // Show loading dialog (for long operations like PDF generation)
  function showLoadingDialog(message) {
    const theme = getDialogThemeColors();
    const accent = resolveSuperPromptAccentVars();

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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid ${theme.borderColor};
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      box-shadow: ${theme.dialogShadow};
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
    `;

    // Dialog content with spinner
    dialog.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
        <div style="width: 48px; height: 48px; border: 4px solid ${theme.borderColor}; border-top-color: ${accent.primary}; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin: 0; color: ${theme.textColor}; font-size: 15px; font-weight: 500; text-align: center;">
          ${message}
        </p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Return close function
    return {
      close: () => {
        overlay.style.opacity = "0";
        dialog.style.transform = "scale(0.9) translateY(-20px)";
        setTimeout(() => overlay.remove(), 200);
      },
    };
  }

  // Unlink chat from workspace (remove vault_id)
  async function handleUnlinkFromWorkspace(chatId, chatTitle) {
    try {
      // Send message to content script to remove vault_id from chat
      const response = await new Promise((resolve, reject) => {
        const requestId = `unlink-workspace-${Date.now()}-${Math.random()}`;

        const handleResponse = (event) => {
          if (
            event.data.type === "sp-response" &&
            event.data.requestId === requestId
          ) {
            window.removeEventListener("message", handleResponse);
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || "Unlink failed"));
            }
          }
        };

        window.addEventListener("message", handleResponse);

        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener("message", handleResponse);
          reject(new Error("Timeout unlinking chat from workspace"));
        }, 10000);

        window.postMessage(
          {
            type: "sp-unlink-chat-from-workspace",
            requestId,
            chatId,
          },
          "*",
        );
      });

      // Show success toast
      showToast(`"${chatTitle}" unlinked from workspace`, "success");

      // Refresh sidebar to show updated state
      setTimeout(() => {
        window.triggerVaultSidebarRefresh();
      }, 300);
    } catch (error) {
      devError(`❌ [VAULT] Failed to unlink chat from workspace:`, error);
      showToast(`Failed to unlink chat: ${error.message}`, "error");
    }
  }

  // Delete a single chat with confirmation
  async function handleDeleteChat(chatId, chatTitle) {
    // Show premium confirmation dialog
    showDeleteChatConfirmation(chatTitle, async () => {
      try {
        // Send message to content script to delete chat via API and IndexedDB
        const response = await new Promise((resolve, reject) => {
          const requestId = `delete-chat-${Date.now()}-${Math.random()}`;

          const handleResponse = (event) => {
            if (
              event.data.type === "sp-response" &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener("message", handleResponse);
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error || "Delete chat failed"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Timeout deleting chat"));
          }, 10000);

          window.postMessage(
            {
              type: "sp-delete-chat-from-api",
              requestId,
              chatId,
            },
            "*",
          );
        });

        // Refresh sidebar to show updated state
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);
      } catch (error) {
        devError(`? [VAULT] Failed to delete chat:`, error);
        showErrorDialog(
          "Delete Failed",
          "Failed to delete conversation",
          error.message || String(error),
        );
      }
    });
  }

  // Show confirmation dialog for deleting a single chat
  function showDeleteChatConfirmation(chatTitle, onConfirm) {
    const theme = getDialogThemeColors();

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

    // Truncate long titles for display
    const displayTitle =
      chatTitle.length > 50 ? chatTitle.slice(0, 50) + "..." : chatTitle;

    // Dialog content
    dialog.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
        <div style="flex-shrink: 0; width: 48px; height: 48px; background: ${
          theme.redIconBg
        }; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid ${
          theme.redIconBorder
        };">
          ${getLucideIcon("Trash2", 24, theme.redTitle)}
        </div>
        <div style="flex: 1;">
          <h2 style="margin: 0 0 8px 0; color: ${
            theme.redTitle
          }; font-size: 20px; font-weight: bold; line-height: 1.3;">
            Delete "${displayTitle}"?
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
          ${getLucideIcon("AlertCircle", 16, theme.redText)}
          <span>What will be deleted:</span>
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: ${
          theme.titleColor
        }; font-size: 13px; line-height: 1.8;">
          <li>The conversation "<strong>${displayTitle}</strong>"</li>
          <li>All messages and responses in this conversation</li>
          <li style="color: ${
            theme.textMuted
          };">Removed from all categories and favorites</li>
        </ul>
      </div>

      <div style="background: ${theme.infoBg}; border: 1px solid ${
        theme.infoBorder
      }; border-radius: 10px; padding: 12px; margin-bottom: 20px;">
        <p style="margin: 0; color: ${
          theme.infoText
        }; font-size: 12px; display: flex; align-items: center; gap: 8px;">
          ${getLucideIcon("Info", 16, theme.infoText)}
          <span>This conversation will be permanently deleted from ChatGPT servers</span>
        </p>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="sp-cancel-delete-chat" style="
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
        <button id="sp-confirm-delete-chat" style="
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
          Delete Chat
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
    const cancelBtn = dialog.querySelector("#sp-cancel-delete-chat");
    const confirmBtn = dialog.querySelector("#sp-confirm-delete-chat");

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
      closeDialog();

      // Execute the deletion callback
      if (onConfirm) {
        await onConfirm();
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
  }

  // Move chat to category with premium category selection dialog
  async function handleMoveToCategory(chatId, chatTitle) {
    if (!activeVaultData || !activeVaultData.categories) {
      showErrorDialog(
        "No Categories Available",
        "There are no categories to move this conversation to.",
        "Please create a category first.",
      );
      return;
    }

    showMoveToCategoryDialog(chatId, chatTitle);
  }

  // Show move to category dialog with hierarchical category tree
  function showMoveToCategoryDialog(chatId, chatTitle) {
    const categories = activeVaultData?.categories || [];
    const theme = getDialogThemeColors();

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "sp-move-category-overlay";
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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "sp-move-category-dialog";
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid ${theme.tealBorder};
      border-radius: 16px;
      padding: 0;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: ${theme.dialogShadow};
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
      overflow: hidden;
    `;

    // Truncate long titles for display
    const displayTitle =
      chatTitle.length > 40 ? chatTitle.slice(0, 40) + "..." : chatTitle;

    // Header with gradient background
    const header = document.createElement("div");
    header.style.cssText = `
      background: ${theme.tealHeader};
      padding: 24px 28px;
      border-bottom: 1px solid ${theme.borderColor};
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: ${theme.tealIconBg};
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${getLucideIcon("FolderInput", 20, "#ffffff")}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h2 style="margin: 0 0 4px 0; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.3;">
            Move to Category
          </h2>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${displayTitle}
          </p>
        </div>
      </div>
    `;

    // Content area with category list
    const content = document.createElement("div");
    content.style.cssText = `
      padding: 20px 28px;
      overflow-y: auto;
      flex: 1;
      min-height: 200px;
      max-height: 400px;
    `;

    // Selected category ID
    let selectedCategoryId = null;

    // Render category tree
    function renderCategoryTree(cats, level = 0) {
      const container = document.createElement("div");

      cats.forEach((category) => {
        const categoryItem = document.createElement("div");
        categoryItem.className = "sp-category-item";
        categoryItem.setAttribute("data-category-id", category.id);
        categoryItem.style.cssText = `
          padding: 10px 14px;
          margin: 4px 0;
          margin-left: ${level * 20}px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: ${theme.categoryItemBg};
        `;

        const hasChildren = category.children && category.children.length > 0;

        categoryItem.innerHTML = `
          <span style="display: flex; align-items: center; opacity: 0.7;">
            ${getLucideIcon(
              hasChildren ? "FolderPlus" : "FolderOpen",
              16,
              theme.tealText,
            )}
          </span>
          <span style="flex: 1; color: ${
            theme.titleColor
          }; font-size: 14px; font-weight: 500;">
            ${category.name}
          </span>
          <span class="sp-category-check" style="display: none; opacity: 0; transition: opacity 0.2s ease;">
            ${getLucideIcon("Check", 18, theme.tealText)}
          </span>
        `;

        // Hover effect
        categoryItem.addEventListener("mouseenter", () => {
          if (selectedCategoryId !== category.id) {
            categoryItem.style.background = theme.tealItemHoverBg;
            categoryItem.style.borderColor = theme.tealItemBorder;
          }
        });

        categoryItem.addEventListener("mouseleave", () => {
          if (selectedCategoryId !== category.id) {
            categoryItem.style.background = theme.categoryItemBg;
            categoryItem.style.borderColor = "transparent";
          }
        });

        // Click to select
        categoryItem.addEventListener("click", (e) => {
          e.stopPropagation();

          // Deselect previous
          document.querySelectorAll(".sp-category-item").forEach((item) => {
            item.style.background = theme.categoryItemBg;
            item.style.borderColor = "transparent";
            const check = item.querySelector(".sp-category-check");
            if (check) {
              check.style.display = "none";
              check.style.opacity = "0";
            }
          });

          // Select this one
          selectedCategoryId = category.id;
          categoryItem.style.background = theme.tealSelectBg;
          categoryItem.style.borderColor = theme.tealText;
          const check = categoryItem.querySelector(".sp-category-check");
          if (check) {
            check.style.display = "flex";
            check.style.opacity = "1";
          }

          // Enable confirm button
          const confirmBtn = dialog.querySelector("#sp-confirm-move-category");
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = "1";
            confirmBtn.style.cursor = "pointer";
          }
        });

        container.appendChild(categoryItem);

        // Recursively render children
        if (hasChildren) {
          const childContainer = renderCategoryTree(
            category.children,
            level + 1,
          );
          container.appendChild(childContainer);
        }
      });

      return container;
    }

    if (categories.length === 0) {
      content.innerHTML = `
        <div style="text-center; padding: 40px 20px; color: ${
          theme.textMuted
        };">
          <div style="margin-bottom: 12px;">
            ${getLucideIcon("FolderOpen", 48, theme.textMuted)}
          </div>
          <p style="margin: 0; font-size: 14px;">No categories available</p>
          <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">Create a category first to organize your chats</p>
        </div>
      `;
    } else {
      const tree = renderCategoryTree(categories);
      content.appendChild(tree);
    }

    // Footer with buttons
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 20px 28px;
      border-top: 1px solid ${theme.borderColor};
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: ${theme.footerBg};
    `;

    footer.innerHTML = `
      <button id="sp-cancel-move-category" style="
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
      <button id="sp-confirm-move-category" disabled style="
        padding: 10px 24px;
        background: ${theme.confirmBtnBg};
        border: 1px solid ${theme.confirmBtnBorder};
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: not-allowed;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: ${theme.confirmBtnShadow};
        opacity: 0.5;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        ${getLucideIcon("Check", 16, "#ffffff")}
        <span>Move to Category</span>
      </button>
    `;

    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Button hover effects
    const cancelBtn = dialog.querySelector("#sp-cancel-move-category");
    const confirmBtn = dialog.querySelector("#sp-confirm-move-category");

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = theme.cancelBtnHoverBg;
      cancelBtn.style.transform = "translateY(-1px)";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = theme.cancelBtnBg;
      cancelBtn.style.transform = "translateY(0)";
    });

    confirmBtn.addEventListener("mouseenter", () => {
      if (!confirmBtn.disabled) {
        confirmBtn.style.transform = "translateY(-2px)";
        confirmBtn.style.boxShadow = theme.confirmBtnHoverShadow;
      }
    });
    confirmBtn.addEventListener("mouseleave", () => {
      if (!confirmBtn.disabled) {
        confirmBtn.style.transform = "translateY(0)";
        confirmBtn.style.boxShadow = theme.confirmBtnShadow;
      }
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
      if (!selectedCategoryId) return;

      // Disable button during operation
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = "0.5";
      confirmBtn.style.cursor = "not-allowed";
      confirmBtn.querySelector("span").textContent = "Moving...";

      try {
        // Send move request to content script
        const response = await new Promise((resolve, reject) => {
          const requestId = `move-chat-${Date.now()}-${Math.random()}`;

          const handleResponse = (event) => {
            if (
              event.data.type === "sp-response" &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener("message", handleResponse);
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error || "Move failed"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Timeout moving chat to category"));
          }, 10000);

          window.postMessage(
            {
              type: "sp-move-chat-to-category",
              requestId,
              chatId,
              categoryId: selectedCategoryId,
            },
            "*",
          );
        });

        closeDialog();

        // Show success toast
        showToast(`Moved to category successfully`, "success");

        // Refresh sidebar to show updated state
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);
      } catch (error) {
        devError(`? [VAULT] Failed to move chat:`, error);

        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.querySelector("span").textContent = "Move to Category";

        showErrorDialog(
          "Move Failed",
          "Failed to move conversation to category",
          error.message || String(error),
        );
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
  }

  // Export a single chat (Pro feature)
  async function handleExportChat(chatId, chatTitle) {
    try {
      // Check entitlements (Pro feature)
      const response = await new Promise((resolve, reject) => {
        const requestId = `check-entitlement-${Date.now()}-${Math.random()}`;
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout checking entitlements"));
        }, 5000);

        const handler = (event) => {
          if (
            event.data?.type === "sp-entitlement-check-response" &&
            event.data?.requestId === requestId
          ) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            resolve(event.data);
          }
        };

        window.addEventListener("message", handler);

        window.postMessage(
          {
            type: "sp-check-entitlement",
            requestId,
            action: "export_data",
          },
          "*",
        );
      });

      if (!response.allowed) {
        // Show LimitErrorDialog via content script
        window.postMessage(
          {
            type: "sp-show-limit-dialog",
            limitType: "general",
            message:
              getTranslation("exportProMessage") ||
              "Export is only available for Pro users.",
          },
          "*",
        );
        return;
      }

      // Show format selection dialog
      showExportFormatDialog(chatId, chatTitle);
    } catch (error) {
      devError("? [VAULT] Export check failed:", error);
      showErrorDialog(
        getTranslation("exportErrorTitle") || "Export Error",
        getTranslation("exportErrorMessage") ||
          "Failed to check export permissions. Please try again.",
        error.message,
      );
    }
  }

  // Show export format selection dialog
  function showExportFormatDialog(chatId, chatTitle) {
    const theme = getDialogThemeColors();
    const accent = resolveSuperPromptAccentVars();
    const headerGradient = theme.isDark
      ? `linear-gradient(135deg, ${accent.primary} 0%, ${accent.hover} 45%, rgba(255,255,255,0.08) 100%)`
      : `linear-gradient(135deg, ${accent.primary} 0%, ${accent.hover} 45%, rgba(255,255,255,0.2) 100%)`;
    const headerBorder = accent.shadow;
    const optionSelectedBg = accent.light;
    const optionSelectedBorder = accent.shadow;
    const optionBorder = theme.borderColor;

    const confirmBtnBg = `linear-gradient(135deg, ${accent.primary} 0%, ${accent.hover} 100%)`;
    const confirmBtnBorder = accent.shadow;
    const confirmBtnShadow = `0 2px 8px ${accent.shadow}`;
    const confirmBtnHoverShadow = `0 4px 12px ${accent.shadow}`;

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

    // Create dialog
    const dialog = document.createElement("div");
    dialog.className = "sp-export-format-dialog";
    dialog.style.cssText = `
      background: ${theme.dialogBg};
      border: 1px solid ${headerBorder};
      border-radius: 16px;
      max-width: 480px;
      width: 90%;
      box-shadow: ${theme.dialogShadow};
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      opacity: 0;
      overflow: hidden;
    `;

    // Ensure accent variables exist in page-injected context (prevents default blue radios)
    applySuperPromptAccentVars(dialog);

    // Dialog content
    // NOTE: We intentionally render our own radio appearance scoped to this dialog,
    // because ChatGPT applies a global custom skin to `input[type=radio]` (incl.
    // background-image + background-color on :checked) which can force a blue dot.
    dialog.innerHTML = `
      <style>
        .sp-export-format-dialog input[type="radio"][name="export-format"] {
          -webkit-appearance: none !important;
          appearance: none !important;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          border: 2px solid ${theme.borderColor};
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          display: grid;
          place-content: center;
          margin: 0;
          cursor: pointer;
        }

        .sp-export-format-dialog input[type="radio"][name="export-format"]::after {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          transform: scale(0);
          transition: transform 120ms ease-in-out;
          background: var(--color-accent);
        }

        .sp-export-format-dialog input[type="radio"][name="export-format"]:checked {
          border-color: var(--color-accent);
        }

        .sp-export-format-dialog input[type="radio"][name="export-format"]:checked::after {
          transform: scale(1);
        }

        .sp-export-format-dialog input[type="radio"][name="export-format"]:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      </style>
      <div style="background: ${headerGradient}; padding: 20px 28px; border-bottom: 1px solid ${headerBorder};">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${getLucideIcon("Download", 24, "white")}
          <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Export Chat</h2>
        </div>
        <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">
          ${chatTitle}
        </p>
      </div>

      <div style="padding: 28px;">
        <p style="margin: 0 0 16px 0; color: ${
          theme.textColor
        }; font-size: 14px;">
          Select export format:
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
          <label style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            theme.categoryItemBg
          }; border: 2px solid ${optionBorder}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" data-format="markdown">
            <input type="radio" name="export-format" value="markdown" checked>
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                ${getLucideIcon("FileText", 16, accent.primary)}
                <span style="color: ${
                  theme.textColor
                }; font-size: 14px; font-weight: 600;">Markdown</span>
              </div>
              <span style="color: ${
                theme.textMuted
              }; font-size: 12px;">Formatted text with headers</span>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            theme.categoryItemBg
          }; border: 2px solid ${optionBorder}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" data-format="json">
            <input type="radio" name="export-format" value="json">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                ${getLucideIcon("FileJson", 16, accent.primary)}
                <span style="color: ${
                  theme.textColor
                }; font-size: 14px; font-weight: 600;">JSON</span>
              </div>
              <span style="color: ${
                theme.textMuted
              }; font-size: 12px;">Complete chat data structure</span>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            theme.categoryItemBg
          }; border: 2px solid ${optionBorder}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" data-format="text">
            <input type="radio" name="export-format" value="text">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                ${getLucideIcon("File", 16, accent.primary)}
                <span style="color: ${
                  theme.textColor
                }; font-size: 14px; font-weight: 600;">Plain Text</span>
              </div>
              <span style="color: ${
                theme.textMuted
              }; font-size: 12px;">Stripped of all formatting</span>
            </div>
          </label>

          <label style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${
            theme.categoryItemBg
          }; border: 2px solid ${optionBorder}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;" data-format="pdf">
            <input type="radio" name="export-format" value="pdf">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                ${getLucideIcon("FileType", 16, accent.primary)}
                <span style="color: ${
                  theme.textColor
                }; font-size: 14px; font-weight: 600;">PDF</span>
              </div>
              <span style="color: ${
                theme.textMuted
              }; font-size: 12px;">Portable document format</span>
            </div>
          </label>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="sp-export-cancel-btn" style="
            padding: 10px 20px;
            background: ${theme.cancelBtnBg};
            border: 1px solid ${theme.cancelBtnBorder};
            border-radius: 8px;
            color: ${theme.cancelBtnText};
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          ">
            Cancel
          </button>
          <button id="sp-export-confirm-btn" style="
            padding: 10px 20px;
            background: ${confirmBtnBg};
            border: 1px solid ${confirmBtnBorder};
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: ${confirmBtnShadow};
          ">
            Export
          </button>
        </div>
      </div>
    `;

    // (Radio styling handled via scoped CSS inside the dialog.)

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      dialog.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    });

    // Format label hover effects
    const formatLabels = dialog.querySelectorAll("label[data-format]");
    formatLabels.forEach((label) => {
      const radio = label.querySelector('input[type="radio"]');

      label.addEventListener("mouseenter", () => {
        label.style.borderColor = optionSelectedBorder;
        label.style.background = optionSelectedBg;
      });

      label.addEventListener("mouseleave", () => {
        if (!radio.checked) {
          label.style.borderColor = optionBorder;
          label.style.background = theme.categoryItemBg;
        }
      });

      radio.addEventListener("change", () => {
        formatLabels.forEach((l) => {
          const r = l.querySelector('input[type="radio"]');
          if (r.checked) {
            l.style.borderColor = optionSelectedBorder;
            l.style.background = optionSelectedBg;
          } else {
            l.style.borderColor = optionBorder;
            l.style.background = theme.categoryItemBg;
          }
        });
      });

      // Set initial state for checked radio
      if (radio.checked) {
        label.style.borderColor = optionSelectedBorder;
        label.style.background = optionSelectedBg;
      }
    });

    // Button hover effects
    const cancelBtn = dialog.querySelector("#sp-export-cancel-btn");
    const confirmBtn = dialog.querySelector("#sp-export-confirm-btn");

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = theme.cancelBtnHoverBg;
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = theme.cancelBtnBg;
    });

    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.transform = "translateY(-2px)";
      confirmBtn.style.boxShadow = confirmBtnHoverShadow;
    });
    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = confirmBtnShadow;
    });

    // Close function
    const closeDialog = () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.9) translateY(-20px)";
      setTimeout(() => overlay.remove(), 200);
    };

    // Cancel button
    cancelBtn.addEventListener("click", closeDialog);

    // Confirm button - perform export
    confirmBtn.addEventListener("click", async () => {
      const selectedFormat = dialog.querySelector(
        'input[name="export-format"]:checked',
      )?.value;

      if (!selectedFormat) {
        return;
      }

      closeDialog();

      // Perform the actual export
      await performExport(chatId, chatTitle, selectedFormat);
    });

    // Click outside to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDialog();
    });

    // ESC key to close
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeDialog();
        document.removeEventListener("keydown", handleEsc);
      }
    };
    document.addEventListener("keydown", handleEsc);
  }

  // Perform the actual export
  async function performExport(chatId, chatTitle, format) {
    try {
      // For PDF format, delegate to content script's PDF service
      if (format === "pdf") {
        // Show loading indicator
        const loadingDialog = showLoadingDialog("Generating PDF...");

        try {
          // Request PDF generation from content script
          const result = await new Promise((resolve, reject) => {
            const requestId = `generate-pdf-${Date.now()}-${Math.random()}`;
            const timeout = setTimeout(() => {
              window.removeEventListener("message", handler);
              reject(new Error("Timeout generating PDF"));
            }, 60000); // 60 second timeout for PDF generation

            const handler = (event) => {
              if (
                event.data?.type === "sp-pdf-generation-response" &&
                event.data?.requestId === requestId
              ) {
                clearTimeout(timeout);
                window.removeEventListener("message", handler);

                if (event.data.success) {
                  resolve(event.data);
                } else {
                  reject(
                    new Error(event.data.error || "Failed to generate PDF"),
                  );
                }
              }
            };

            window.addEventListener("message", handler);

            window.postMessage(
              {
                type: "sp-generate-pdf",
                requestId,
                chatId,
              },
              "*",
            );
          });

          // Close loading dialog
          if (loadingDialog && loadingDialog.close) {
            loadingDialog.close();
          }

          // PDF was already downloaded by content script
          return;
        } catch (error) {
          // Close loading dialog
          if (loadingDialog && loadingDialog.close) {
            loadingDialog.close();
          }
          throw error;
        }
      }

      // Request full chat data from content script for non-PDF formats
      const chatData = await new Promise((resolve, reject) => {
        const requestId = `get-chat-${Date.now()}-${Math.random()}`;
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout getting chat data"));
        }, 10000);

        const handler = (event) => {
          if (
            event.data?.type === "sp-chat-data-response" &&
            event.data?.requestId === requestId
          ) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);

            if (event.data.success && event.data.chat) {
              resolve(event.data.chat);
            } else {
              reject(new Error(event.data.error || "Failed to get chat data"));
            }
          }
        };

        window.addEventListener("message", handler);

        window.postMessage(
          {
            type: "sp-get-chat-data",
            requestId,
            chatId,
          },
          "*",
        );
      });

      // Generate content based on format
      const content = generateExportContent(chatData, chatTitle, format);

      // Download file
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const sanitizedTitle = chatTitle
        .replace(/[^a-z0-9]/gi, "_")
        .substring(0, 50);
      const extension =
        format === "json" ? "json" : format === "markdown" ? "md" : "txt";
      const filename = `${sanitizedTitle}_${timestamp}.${extension}`;

      const blob = new Blob([content], {
        type:
          format === "json" ? "application/json" : "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      devError("? [VAULT] Export failed:", error);
      showErrorDialog(
        getTranslation("exportErrorTitle") || "Export Error",
        getTranslation("exportErrorMessage") ||
          "Failed to export chat. Please try again.",
        error.message,
      );
    }
  }

  // Reference a chat by attaching it as a txt file to the current conversation (Pro feature)
  async function handleReferenceChat(chatId, chatTitle) {
    try {
      // Check entitlements (Pro feature)
      const response = await new Promise((resolve, reject) => {
        const requestId = `check-entitlement-${Date.now()}-${Math.random()}`;
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout checking entitlements"));
        }, 5000);

        const handler = (event) => {
          if (
            event.data?.type === "sp-entitlement-check-response" &&
            event.data?.requestId === requestId
          ) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            resolve(event.data);
          }
        };

        window.addEventListener("message", handler);

        window.postMessage(
          {
            type: "sp-check-entitlement",
            requestId,
            action: "export_data",
          },
          "*",
        );
      });

      if (!response.allowed) {
        // Show LimitErrorDialog via content script
        window.postMessage(
          {
            type: "sp-show-limit-dialog",
            limitType: "general",
            message:
              getTranslation("referenceChatProMessage") ||
              "Reference chat is only available for Pro users.",
          },
          "*",
        );
        return;
      }

      // Show loading toast
      const loadingToast = showToast("Preparing chat reference...", "info", 0);

      // Request full chat data from content script
      const chatData = await new Promise((resolve, reject) => {
        const requestId = `get-chat-${Date.now()}-${Math.random()}`;
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout getting chat data"));
        }, 10000);

        const handler = (event) => {
          if (
            event.data?.type === "sp-chat-data-response" &&
            event.data?.requestId === requestId
          ) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);

            if (event.data.success && event.data.chat) {
              resolve(event.data.chat);
            } else {
              reject(new Error(event.data.error || "Failed to get chat data"));
            }
          }
        };

        window.addEventListener("message", handler);

        window.postMessage(
          {
            type: "sp-get-chat-data",
            requestId,
            chatId,
          },
          "*",
        );
      });

      // Generate plain text content
      const content = generateExportContent(chatData, chatTitle, "text");

      // Create file name from chat title
      const sanitizedTitle = chatTitle
        .replace(/[^a-z0-9\\s]/gi, "_")
        .replace(/\\s+/g, "_")
        .substring(0, 50);
      const filename = `${sanitizedTitle}.txt`;

      // Create a File object
      const file = new File([content], filename, {
        type: "text/plain",
      });

      // Find the ChatGPT input area and attach the file
      const success = await attachFileToCurrentChat(file);

      // Remove loading toast
      if (loadingToast && loadingToast.parentElement) {
        loadingToast.remove();
      }

      if (success) {
        showToast(
          getTranslation("referenceChatSuccess") ||
            "Chat reference added as attachment!",
          "success",
        );
      } else {
        throw new Error("Could not attach file to chat input");
      }
    } catch (error) {
      devError("? [VAULT] Reference chat failed:", error);
      showErrorDialog(
        getTranslation("exportErrorTitle") || "Error",
        getTranslation("referenceChatError") ||
          "Failed to attach chat reference. Please try again.",
        error.message,
      );
    }
  }

  // Attach a file to the current ChatGPT conversation input
  async function attachFileToCurrentChat(file) {
    try {
      // Find the file input or drop zone in ChatGPT
      // ChatGPT uses a hidden file input or drag-and-drop on the composer

      // Method 1: Try to find and use the hidden file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        // Create a DataTransfer to set files on the input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Dispatch change event to trigger ChatGPT's file handler
        const changeEvent = new Event("change", { bubbles: true });
        fileInput.dispatchEvent(changeEvent);

        devLog("📎 [VAULT] File attached via file input");
        return true;
      }

      // Method 2: Simulate a drop event on the composer
      const composer =
        document.querySelector('[id="composer-background"]') ||
        document.querySelector('[data-testid="composer"]') ||
        document.querySelector("form[data-testid]") ||
        document.querySelector("#prompt-textarea")?.closest("form") ||
        document.querySelector(".composer-parent");

      if (composer) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Create and dispatch drag events
        const dragEnterEvent = new DragEvent("dragenter", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        composer.dispatchEvent(dragEnterEvent);

        const dragOverEvent = new DragEvent("dragover", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        composer.dispatchEvent(dragOverEvent);

        const dropEvent = new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        });
        composer.dispatchEvent(dropEvent);

        devLog("📎 [VAULT] File attached via drop event");
        return true;
      }

      // Method 3: Use the global drop handler if available
      const mainContent = document.querySelector("main") || document.body;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const dropEvent = new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      });
      mainContent.dispatchEvent(dropEvent);

      devLog("📎 [VAULT] File attached via main drop");
      return true;
    } catch (error) {
      devError("📎 [VAULT] Failed to attach file:", error);
      return false;
    }
  }

  // Generate export content based on format
  function generateExportContent(chatData, chatTitle, format) {
    if (format === "json") {
      return JSON.stringify(chatData, null, 2);
    }

    // Extract messages from chat.mapping
    const messages = extractMessages(chatData);

    if (format === "markdown") {
      let md = `# ${chatTitle}\n\n`;

      if (chatData.update_time || chatData.create_time) {
        const date = new Date(
          (chatData.update_time || chatData.create_time) * 1000,
        );
        md += `**Date:** ${date.toLocaleString()}\n\n`;
      }

      if (messages.length === 0) {
        md += `_(No messages available)_\n`;
      } else {
        messages.forEach((msg) => {
          md += `## ${msg.role.toUpperCase()}\n\n${msg.text}\n\n`;
        });
      }

      return md;
    } else {
      // Plain text
      let txt = `${chatTitle}\n`;
      txt += "=".repeat(chatTitle.length) + "\n\n";

      if (chatData.update_time || chatData.create_time) {
        const date = new Date(
          (chatData.update_time || chatData.create_time) * 1000,
        );
        txt += `Date: ${date.toLocaleString()}\n\n`;
      }

      if (messages.length === 0) {
        txt += `(No messages available)\n`;
      } else {
        messages.forEach((msg) => {
          txt += `${msg.role.toUpperCase()}:\n`;
          txt += `${msg.text}\n\n`;
          txt += "-".repeat(60) + "\n\n";
        });
      }

      return txt;
    }
  }

  // Extract messages from chat mapping
  function extractMessages(chatData) {
    try {
      if (!chatData.mapping) return [];

      const nodes = Object.values(chatData.mapping);
      const messages = nodes
        .filter(
          (node) =>
            node &&
            node.message &&
            node.message.content &&
            node.message.content.parts,
        )
        .map((node) => {
          const role = node.message.author?.role || "unknown";
          const parts = node.message.content?.parts || [];
          return {
            role,
            text: parts.join("\n\n").trim(),
            created:
              node.message.create_time || node.create_time
                ? new Date(
                    (node.message.create_time || node.create_time) * 1000,
                  ).toISOString()
                : undefined,
          };
        })
        .filter((msg) => msg.text.length > 0);

      return messages.sort((a, b) => {
        if (!a.created || !b.created) return 0;
        return a.created.localeCompare(b.created);
      });
    } catch (error) {
      devError("? [VAULT] Failed to extract messages:", error);
      return [];
    }
  }

  // Toggle favorite status for a chat
  async function handleToggleFavorite(chatId, chatTitle) {
    try {
      // Find the chat in activeVaultData to get current starred status
      let currentStarredStatus = false;
      if (activeVaultData && activeVaultData.chats) {
        const chat = activeVaultData.chats.find((c) => c.id === chatId);
        if (chat) {
          currentStarredStatus = chat.is_starred || chat.favorite || false;
        }
      }

      // Send message to content script to toggle favorite via API
      const response = await new Promise((resolve, reject) => {
        const requestId = `toggle-favorite-${Date.now()}-${Math.random()}`;

        const handleResponse = (event) => {
          if (
            event.data.type === "sp-response" &&
            event.data.requestId === requestId
          ) {
            window.removeEventListener("message", handleResponse);
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || "Toggle favorite failed"));
            }
          }
        };

        window.addEventListener("message", handleResponse);

        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener("message", handleResponse);
          reject(new Error("Timeout toggling favorite"));
        }, 10000);

        window.postMessage(
          {
            type: "sp-toggle-favorite",
            requestId,
            chatId,
            currentStatus: currentStarredStatus,
            userIsPro: activeVaultData?.isPro === true,
            subscriptionPlan:
              activeVaultData?.subscriptionPlan || activeVaultData?.userTier,
          },
          "*",
        );
      });

      // Refresh sidebar to show updated state
      setTimeout(() => {
        window.triggerVaultSidebarRefresh();
      }, 300);
    } catch (error) {
      devError(`? [VAULT] Failed to toggle favorite:`, error);

      // Parse error message to detect limit error
      const errorMsg = error.message || String(error);

      // Debug: Log activeVaultData to see what's available
      devLog("🔍 [VAULT] activeVaultData:", activeVaultData);
      devLog(
        "🔍 [VAULT] isPro check:",
        activeVaultData?.isPro,
        activeVaultData?.userTier,
      );

      // Only show the favorite limit dialog if it's a limit error AND user is on free tier
      // Pro users should never see this dialog
      if (
        errorMsg.includes("maximum number of pinned") ||
        errorMsg.includes("cannot pin more than")
      ) {
        // Check if user is on Pro tier - if so, show generic error instead
        // The limit dialog should only appear for Free tier users
        const isPro = activeVaultData?.isPro === true;

        devLog("🔍 [VAULT] Final isPro value:", isPro);

        if (isPro) {
          // Pro user hitting ChatGPT's own limit - show generic error
          showErrorDialog(
            getTranslation("toggleFavoriteErrorTitle"),
            getTranslation("toggleFavoriteErrorMessage"),
            "You've reached ChatGPT's maximum favorite limit. Please unpin some conversations first.",
          );
        } else {
          // Free tier user hitting our 3-favorite limit
          showErrorDialog(
            getTranslation("favoriteLimitTitle"),
            getTranslation("favoriteLimitMessage"),
            getTranslation("favoriteLimitDetails"),
          );
        }
      } else {
        // Generic error
        showErrorDialog(
          getTranslation("toggleFavoriteErrorTitle"),
          getTranslation("toggleFavoriteErrorMessage"),
          errorMsg,
        );
      }
    }
  }

  // Archive/unarchive a chat (toggle)
  async function handleArchiveChat(chatId, chatTitle) {
    try {
      // Find the chat in activeVaultData to get current archived status
      let currentArchivedStatus = false;
      if (activeVaultData && activeVaultData.chats) {
        const chat = activeVaultData.chats.find((c) => c.id === chatId);
        if (chat) {
          currentArchivedStatus = chat.is_archived || false;
        }
      }

      // Send message to content script to toggle archive via API
      const response = await new Promise((resolve, reject) => {
        const requestId = `archive-chat-${Date.now()}-${Math.random()}`;

        const handleResponse = (event) => {
          if (
            event.data.type === "sp-response" &&
            event.data.requestId === requestId
          ) {
            window.removeEventListener("message", handleResponse);
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || "Archive toggle failed"));
            }
          }
        };

        window.addEventListener("message", handleResponse);

        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener("message", handleResponse);
          reject(new Error("Timeout toggling archive"));
        }, 10000);

        window.postMessage(
          {
            type: "sp-archive-chat",
            requestId,
            chatId,
            currentStatus: currentArchivedStatus,
          },
          "*",
        );
      });

      const action = currentArchivedStatus ? "unarchived" : "archived";

      // Refresh sidebar to show updated state
      setTimeout(() => {
        window.triggerVaultSidebarRefresh();
      }, 300);
    } catch (error) {
      devError(`? [VAULT] Failed to toggle archive:`, error);
      alert(`Failed to toggle archive: ${error.message}`);
    }
  }

  // Remove chat from category (move to uncategorized)
  async function handleUncategorizeChat(chatId, chatTitle) {
    try {
      // Send message to content script to remove from category
      const response = await new Promise((resolve, reject) => {
        const requestId = `uncategorize-${Date.now()}-${Math.random()}`;

        const handleResponse = (event) => {
          if (
            event.data.type === "sp-response" &&
            event.data.requestId === requestId
          ) {
            window.removeEventListener("message", handleResponse);
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || "Uncategorize failed"));
            }
          }
        };

        window.addEventListener("message", handleResponse);

        // Timeout after 10 seconds
        setTimeout(() => {
          window.removeEventListener("message", handleResponse);
          reject(new Error("Timeout uncategorizing chat"));
        }, 10000);

        window.postMessage(
          {
            type: "sp-uncategorize-chat",
            requestId,
            chatId,
          },
          "*",
        );
      });

      // Refresh sidebar to show updated state
      setTimeout(() => {
        window.triggerVaultSidebarRefresh();
      }, 300);
    } catch (error) {
      devError(`? [VAULT] Failed to uncategorize chat:`, error);
      alert(`Failed to move chat: ${error.message}`);
    }
  }

  // Open chat in new tab
  function handleOpenInNewTab(chatId) {
    const url = `https://chatgpt.com/c/${chatId}`;
    window.open(url, "_blank");
  }

  // Preview chat in SuperPrompt preview dialog
  function handlePreviewChat(chatId) {
    window.postMessage(
      {
        type: "sp-open-chat-preview",
        chatId: chatId,
        standalone: true,
        source: "vault-sidebar-context-menu",
      },
      "*",
    );
  }

  // Copy chat link to clipboard
  async function handleCopyLink(chatId) {
    const url = `https://chatgpt.com/c/${chatId}`;

    try {
      await navigator.clipboard.writeText(url);

      // Show brief success message
      showToast("Link copied to clipboard!", "success");
    } catch (error) {
      devError(`? [VAULT] Failed to copy link:`, error);
      showToast("Failed to copy link", "error");
    }
  }

  // Share chat and copy share link to clipboard
  async function handleShareChat(chatId, chatTitle) {
    try {
      // Show loading toast
      const loadingToast = showToast("Creating share link...", "info", 0);

      // Request access token from content script (which has access to chrome.storage)
      window.postMessage(
        {
          type: "sp-request-access-token",
          source: "superprompt-vault",
        },
        "*",
      );

      // Wait for the token response
      const accessToken = await new Promise((resolve, reject) => {
        const handler = (event) => {
          if (
            event.data?.type === "sp-access-token-response" &&
            event.data?.source === "superprompt-content"
          ) {
            window.removeEventListener("message", handler);
            // If the content script signals that login is required,
            // short-circuit with a clear message instead of a vague
            // access-token error.
            if (event.data.loginRequired) {
              devWarn(
                "🔑 [VAULT] Access token request blocked because user is not logged in",
              );
              showToast("Please log in to ChatGPT to share chats.", "warning");
              resolve(null);
              return;
            }

            resolve(event.data.accessToken);
          }
        };
        window.addEventListener("message", handler);

        // Timeout after 5 seconds
        setTimeout(() => {
          devWarn(`? [VAULT] Token request timeout after 5 seconds`);
          window.removeEventListener("message", handler);
          reject(
            new Error("Token request timeout - content script not responding"),
          );
        }, 5000);
      });

      if (!accessToken) {
        throw new Error("Access token is empty or null");
      }

      // First, fetch the conversation to get the current_node_id

      const convUrl = `https://chatgpt.com/backend-api/conversation/${chatId}`;
      const convResponse = await fetch(convUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!convResponse.ok) {
        throw new Error(
          `Failed to fetch conversation (${convResponse.status})`,
        );
      }

      const conversation = await convResponse.json();
      const currentNodeId = conversation.current_node;

      if (!currentNodeId) {
        throw new Error(
          "Could not determine current_node_id from conversation",
        );
      }

      // Create the share (ChatGPT always creates private first)
      const shareApiUrl = `https://chatgpt.com/backend-api/share/create`;
      const body = {
        conversation_id: chatId,
        current_node_id: currentNodeId,
        is_anonymous: true,
        // Note: is_public is NOT sent here, ChatGPT always creates private first
      };

      const response = await fetch(shareApiUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      // Remove loading toast
      if (loadingToast && loadingToast.parentElement) {
        loadingToast.remove();
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to share chat (${response.status}): ${errorText}`,
        );
      }

      const result = await response.json();
      devLog("🔗 [VAULT] Share API response:", result);

      // Check if the share was successful
      if (!result.share_id) {
        throw new Error("No share_id in response");
      }

      // Now PATCH the share to make it public (this is what ChatGPT does)
      const shareId = result.share_id;
      devLog("🔗 [VAULT] Now updating share to make it public...");

      const patchUrl = `https://chatgpt.com/backend-api/share/${shareId}`;
      const patchResponse = await fetch(patchUrl, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          is_public: true,
        }),
      });

      // Remove loading toast
      if (loadingToast && loadingToast.parentElement) {
        loadingToast.remove();
      }

      if (!patchResponse.ok) {
        devWarn(
          "🔗 [VAULT] Failed to update share to public:",
          patchResponse.status,
        );
        // Continue anyway, maybe it works
      }

      const finalShare = await patchResponse.json();
      devLog("🔗 [VAULT] Final share after PATCH:", finalShare);

      // Use the final share data
      const shareUrl =
        finalShare.share_url ||
        result.share_url ||
        `https://chatgpt.com/share/${shareId}`;
      const shareTitle =
        finalShare.title || result.title || chatTitle || "Shared Conversation";

      devLog("🔗 [VAULT] Final share URL:", shareUrl);

      // Show share dialog with social sharing options
      showShareDialog(shareUrl, shareTitle);
    } catch (error) {
      // Remove loading toast
      if (loadingToast && loadingToast.parentElement) {
        loadingToast.remove();
      }

      devError(`? [VAULT] Failed to share chat:`, error);
      showToast(error.message || "Failed to create share link", "error");
    }
  }

  // ============================================================================
  // PRINT CHAT - Trigger print dialog for a chat
  // ============================================================================

  function handlePrintChat(chatId) {
    // Use the same print pipeline as the header print button
    // This sends a message to open the chat preview in silent mode with auto-print
    window.postMessage(
      {
        type: "sp-open-chat-preview",
        chatId: chatId,
        autoPrint: true,
        silent: true,
        source: "vault-sidebar",
      },
      "*",
    );

    showToast("Opening print dialog...", "info", 2000);
  }

  // Show share dialog with social sharing options
  function showShareDialog(shareUrl, title) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Create dialog
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 28px;
      max-width: 520px;
      width: 90%;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transform: scale(0.9) translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Encode URL and title for sharing
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    dialog.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </div>
          <h3 style="
            margin: 0;
            background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
          ">Share Conversation</h3>
        </div>
        <button id="closeShareDialog" style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #999;
          cursor: pointer;
          font-size: 20px;
          padding: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          ✕
        </button>
      </div>

      <div style="
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
        "></div>
        <div style="
          color: #f5f5f5;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          ${title}
        </div>
        <div style="
          color: #a0a0a0;
          font-size: 12px;
          word-break: break-all;
          font-family: 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        ">${shareUrl}</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <button id="copyShareLink" style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Copy link
        </button>

        <button id="shareToX" style="
          background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </button>

        <button id="shareToLinkedIn" style="
          background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 119, 181, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </button>

        <button id="shareToReddit" style="
          background: linear-gradient(135deg, #ff4500 0%, #cc3700 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(255, 69, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
          Reddit
        </button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.style.opacity = "1";
      dialog.style.transform = "scale(1) translateY(0)";
    }, 10);

    // Event listeners
    const closeBtn = dialog.querySelector("#closeShareDialog");
    const copyBtn = dialog.querySelector("#copyShareLink");
    const xBtn = dialog.querySelector("#shareToX");
    const linkedInBtn = dialog.querySelector("#shareToLinkedIn");
    const redditBtn = dialog.querySelector("#shareToReddit");

    const closeDialog = () => {
      overlay.style.opacity = "0";
      dialog.style.transform = "scale(0.9) translateY(20px)";
      setTimeout(() => overlay.remove(), 300);
    };

    closeBtn.addEventListener("click", closeDialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDialog();
    });

    // Enhanced hover effects
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.15)";
      closeBtn.style.color = "#fff";
      closeBtn.style.transform = "rotate(90deg)";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.05)";
      closeBtn.style.color = "#999";
      closeBtn.style.transform = "rotate(0deg)";
    });

    copyBtn.addEventListener("mouseenter", () => {
      copyBtn.style.transform = "translateY(-2px)";
      copyBtn.style.boxShadow =
        "0 6px 20px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
    });
    copyBtn.addEventListener("mouseleave", () => {
      copyBtn.style.transform = "translateY(0)";
      copyBtn.style.boxShadow =
        "0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
    });

    xBtn.addEventListener("mouseenter", () => {
      xBtn.style.transform = "translateY(-2px)";
      xBtn.style.boxShadow =
        "0 6px 20px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
    });
    xBtn.addEventListener("mouseleave", () => {
      xBtn.style.transform = "translateY(0)";
      xBtn.style.boxShadow =
        "0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
    });

    linkedInBtn.addEventListener("mouseenter", () => {
      linkedInBtn.style.transform = "translateY(-2px)";
      linkedInBtn.style.boxShadow =
        "0 6px 20px rgba(0, 119, 181, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
    });
    linkedInBtn.addEventListener("mouseleave", () => {
      linkedInBtn.style.transform = "translateY(0)";
      linkedInBtn.style.boxShadow =
        "0 4px 12px rgba(0, 119, 181, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
    });

    redditBtn.addEventListener("mouseenter", () => {
      redditBtn.style.transform = "translateY(-2px)";
      redditBtn.style.boxShadow =
        "0 6px 20px rgba(255, 69, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
    });
    redditBtn.addEventListener("mouseleave", () => {
      redditBtn.style.transform = "translateY(0)";
      redditBtn.style.boxShadow =
        "0 4px 12px rgba(255, 69, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
    });

    // Copy link
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(shareUrl);

      // Success animation
      copyBtn.style.background =
        "linear-gradient(135deg, #059669 0%, #047857 100%)";
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;

      setTimeout(() => {
        copyBtn.style.background =
          "linear-gradient(135deg, #10b981 0%, #059669 100%)";
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Copy link
        `;
      }, 2000);
    });

    // Share to X (Twitter)
    xBtn.addEventListener("click", () => {
      const xUrl = `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`;
      window.open(xUrl, "_blank", "width=600,height=400");
    });

    // Share to LinkedIn
    linkedInBtn.addEventListener("click", () => {
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      window.open(linkedInUrl, "_blank", "width=600,height=600");
    });

    // Share to Reddit
    redditBtn.addEventListener("click", () => {
      const redditUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
      window.open(redditUrl, "_blank", "width=800,height=600");
    });
  }

  // Helper function to show toast messages
  function showToast(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.textContent = message;

    const colors = {
      success: "#10b981",
      error: "#ef4444",
      info: "#3b82f6",
    };

    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Auto-remove after duration (unless duration is 0 for persistent toast)
    if (duration > 0) {
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast; // Return for manual removal if needed
  }

  // Rename a chat (inline editing)
  async function handleRenameChat(chatId, currentTitle) {
    // Find the chat item in the DOM
    const chatItem = sidebarContainer.querySelector(
      `.sp-vault-chat[data-chat-id="${chatId}"]`,
    );
    if (!chatItem) {
      devError(`? [VAULT] Chat item not found for ${chatId}`);
      return;
    }

    const titleSpan = chatItem.querySelector(".sp-vault-chat-title");
    if (!titleSpan) {
      devError(`? [VAULT] Title span not found`);
      return;
    }

    // Store original title for cancel/restore
    const originalTitle = currentTitle || titleSpan.textContent || "Untitled";

    // Create input field
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalTitle;
    input.className = "sp-vault-rename-input";
    input.style.cssText = `
      flex: 1;
      font-size: 12.5px;
      color: #e5e7eb;
      background: #2d2d2d;
      border: 1px solid #4b5563;
      border-radius: 4px;
      padding: 2px 6px;
      outline: none;
      font-family: inherit;
    `;

    // Focus styling
    input.addEventListener("focus", () => {
      input.style.borderColor = "#10b981";
      input.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.2)";
    });

    input.addEventListener("blur", () => {
      input.style.borderColor = "#4b5563";
      input.style.boxShadow = "none";
    });

    // Save function
    const saveRename = async () => {
      const newTitle = input.value.trim();

      // Validate
      if (!newTitle) {
        alert("Title cannot be empty");
        input.focus();
        return;
      }

      if (newTitle === originalTitle) {
        // No change, just restore
        titleSpan.style.display = "";
        input.remove();
        cleanup();
        return;
      }

      try {
        // Show loading state
        input.disabled = true;
        input.style.opacity = "0.6";

        // Send rename request to content script
        const response = await new Promise((resolve, reject) => {
          const requestId = `rename-chat-${Date.now()}-${Math.random()}`;

          const handleResponse = (event) => {
            if (
              event.data.type === "sp-response" &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener("message", handleResponse);
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error || "Rename failed"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Timeout renaming chat"));
          }, 10000);

          window.postMessage(
            {
              type: "sp-rename-chat",
              requestId,
              chatId,
              newTitle,
            },
            "*",
          );
        });

        // Update UI immediately
        titleSpan.textContent = newTitle;
        titleSpan.setAttribute("title", newTitle);
        titleSpan.style.display = "";
        input.remove();
        cleanup();

        // Refresh sidebar to show updated title everywhere
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);
      } catch (error) {
        devError(`? [VAULT] Failed to rename chat:`, error);
        alert(`Failed to rename chat: ${error.message}`);

        // Restore input
        input.disabled = false;
        input.style.opacity = "1";
        input.focus();
      }
    };

    // Cancel function
    const cancelRename = () => {
      titleSpan.style.display = "";
      input.remove();
      cleanup();
    };

    // Cleanup function to remove event listeners
    let cleanupDone = false;
    const cleanup = () => {
      if (cleanupDone) return;
      cleanupDone = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };

    // Handle click outside (save)
    const handleClickOutside = (e) => {
      // Check if click is outside the input field
      if (!input.contains(e.target) && input.parentElement) {
        e.preventDefault();
        e.stopPropagation();
        saveRename();
      }
    };

    // Handle Enter key (save)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelRename();
      }
    });

    // Prevent chat click when clicking on input
    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Prevent chat click when clicking on the input's parent area
    input.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    // Add document click listener (with small delay to ensure input is mounted)
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    // Replace title span with input
    titleSpan.style.display = "none";
    titleSpan.parentElement.insertBefore(input, titleSpan.nextSibling);

    // Focus and select all text
    input.focus();
    input.select();
  }

  // ============================================================================
  // UI: Attach event listeners to category headers
  // ============================================================================

  function attachCategoryEventListeners() {
    if (!sidebarContainer) return;

    const categoryHeaders = sidebarContainer.querySelectorAll(
      ".sp-vault-category-header",
    );

    categoryHeaders.forEach((header) => {
      header.addEventListener("click", (e) => {
        e.stopPropagation();

        const categoryId = header.getAttribute("data-category-id");
        if (!categoryId) return;

        // Toggle collapsed state
        const isNowCollapsed = toggleCategoryCollapsed(categoryId);

        // Find the content container and chevron
        const category = header.parentElement;
        // Support both regular categories (.sp-vault-category-content) and special categories (.sp-vault-category-chats)
        const contentContainer =
          category.querySelector(".sp-vault-category-content") ||
          category.querySelector(".sp-vault-category-chats");
        const chevron =
          header.querySelector(".sp-vault-chevron") ||
          header.querySelector(".sp-vault-category-chevron");

        if (contentContainer && chevron) {
          // Animate the transition - use display style for consistent behavior
          if (isNowCollapsed) {
            contentContainer.style.display = "none";
            chevron.style.transform = "rotate(0deg)";
          } else {
            contentContainer.style.display = "block";
            chevron.style.transform = "rotate(90deg)";
          }
        } else {
          devWarn(
            "?? [VAULT] Could not find content container or chevron for category:",
            categoryId,
          );
        }
      });

      // Add right-click context menu for category
      header.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const categoryId = header.getAttribute("data-category-id");
        if (!categoryId) return;

        // Find the menu button and trigger its click to open the context menu
        const menuBtn = header.querySelector(".sp-vault-category-menu-btn");
        if (menuBtn) {
          // Simulate click on menu button
          menuBtn.click();
        }
      });
    });
  }

  // ============================================================================
  // UI: Attach event listeners to chat items
  // ============================================================================

  function attachChatEventListeners() {
    if (!sidebarContainer) return;

    const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");

    chatItems.forEach((chatItem) => {
      // Handle checkbox clicks for bulk selection (custom checkbox wrapper)
      const checkboxWrapper = chatItem.querySelector(
        ".sp-vault-chat-checkbox-wrapper",
      );
      if (checkboxWrapper) {
        checkboxWrapper.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent navigation to chat

          const chatId = chatItem.getAttribute("data-chat-id");
          if (!chatId) return;

          const checkbox = checkboxWrapper.querySelector(
            ".sp-vault-chat-checkbox",
          );
          const visual = checkboxWrapper.querySelector(
            ".sp-vault-chat-checkbox-visual",
          );
          const isCurrentlyChecked = checkbox.checked;

          // Toggle checkbox state
          checkbox.checked = !isCurrentlyChecked;

          if (checkbox.checked) {
            selectedChatIds.add(chatId);
            chatItem.classList.add("sp-vault-chat-selected");
            chatItem.style.background =
              "rgba(var(--sp-accent-rgb, 20, 184, 166), 0.15)";
            // Update visual
            if (visual) {
              visual.style.background = "var(--color-accent, #14b8a6)";
              visual.style.borderColor = "var(--color-accent, #14b8a6)";
              visual.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              visual.innerHTML =
                '<svg width=\"10\" height=\"10\" viewBox=\"0 0 14 14\" fill=\"none\"><path d=\"M11.6667 3.5L5.25 9.91667L2.33333 7\" stroke=\"white\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>';
            }
          } else {
            selectedChatIds.delete(chatId);
            chatItem.classList.remove("sp-vault-chat-selected");
            chatItem.style.background = "transparent";
            // Update visual
            if (visual) {
              visual.style.background = "transparent";
              visual.style.borderColor = "rgba(255, 255, 255, 0.3)";
              visual.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
              visual.innerHTML = "";
            }
          }

          // Enable/disable bulk selection mode based on selection count
          const previousBulkMode = bulkSelectionMode;
          bulkSelectionMode = selectedChatIds.size > 0;

          // Update all checkboxes visibility when entering/exiting bulk mode
          if (previousBulkMode !== bulkSelectionMode) {
            updateAllCheckboxVisibility();
          }

          // Show/hide floating toolbar
          updateBulkToolbar();
        });
      }

      chatItem.addEventListener("click", (e) => {
        e.stopPropagation();

        // If clicking on checkbox wrapper, don't navigate
        if (e.target.closest(".sp-vault-chat-checkbox-wrapper")) {
          return;
        }

        const chatId = chatItem.getAttribute("data-chat-id");
        if (!chatId) return;

        // Find the chat in our data
        const allChats = activeVaultData?.chats || [];
        const chat = allChats.find((c) => c.id === chatId);

        if (!chat) {
          devWarn("?? [VAULT] Chat not found:", chatId);
          return;
        }

        // Mark this conversation as selected from vault (for Notes tab visibility)
        try {
          sessionStorage.setItem("sp-vault-selected-conv", chatId);
        } catch (e) {
          devWarn("?? [VAULT] Failed to store chat selection:", e);
        }

        // Use ChatGPT's internal routing instead of full page reload
        const conversationUrl = `/c/${chatId}`;

        // Update browser URL without reload
        window.history.pushState({}, "", conversationUrl);

        // Trigger ChatGPT's router to load the conversation
        // This dispatches a popstate event that ChatGPT's React Router listens to
        window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
      });

      // Add right-click context menu for chat
      chatItem.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const chatId = chatItem.getAttribute("data-chat-id");
        if (!chatId) return;

        // Find the menu button and trigger its click to open the context menu
        const menuBtn = chatItem.querySelector(".sp-vault-chat-menu-btn");
        if (menuBtn) {
          // Simulate click on menu button
          menuBtn.click();
        }
      });
    });
  }

  // ============================================================================
  // UI: Attach "Load More" button listeners
  // ============================================================================

  function attachLoadMoreButtonListeners() {
    if (!sidebarContainer) return;

    const loadMoreButtons = sidebarContainer.querySelectorAll(
      ".sp-vault-load-more-btn",
    );

    loadMoreButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const categoryId = btn.getAttribute("data-category-id");
        if (!categoryId) return;
        loadMoreChats(categoryId);
      });

      // CSP-safe hover effects (replacing inline onmouseover/onmouseout)
      const bgSecondary =
        btn.getAttribute("data-bg-secondary") || "rgba(255, 255, 255, 0.03)";
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(255, 255, 255, 0.05)";
        btn.style.borderColor = "rgba(255, 255, 255, 0.2)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = bgSecondary;
        btn.style.borderColor = "rgba(255, 255, 255, 0.1)";
      });
    });
  }

  // ============================================================================
  // UI: Attach event listeners to project badges
  // ============================================================================

  function attachProjectBadgeListeners() {
    if (!sidebarContainer) return;

    // Handle both avatar images and SVG badges
    const projectElements = sidebarContainer.querySelectorAll(
      ".sp-vault-chat-project-badge, .sp-vault-chat-avatar",
    );

    projectElements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent chat click from firing

        const projectId = element.getAttribute("data-project-id");
        const gizmoId = element.getAttribute("data-gizmo-id");

        // Navigate to the project page using internal routing
        let projectUrl = "";
        if (projectId) {
          projectUrl = `/g/${projectId}`;
        } else if (gizmoId) {
          projectUrl = `/g/${gizmoId}`;
        }

        if (projectUrl) {
          // Update browser URL without reload
          window.history.pushState({}, "", projectUrl);

          // Trigger ChatGPT's router
          window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
        }
      });
    });
  }

  // ============================================================================
  // UI: Attach hover effects to categories and chats
  // ============================================================================

  function attachHoverEffects() {
    if (!sidebarContainer) return;

    // Focus/blur effects for search input
    const searchInput = sidebarContainer.querySelector(
      ".sp-vault-search-input",
    );
    if (searchInput) {
      searchInput.addEventListener("focus", () => {
        searchInput.style.background = "rgba(255, 255, 255, 0.08)";
        searchInput.style.borderColor = "rgba(20, 184, 166, 0.5)";
        searchInput.style.boxShadow = "0 0 0 3px rgba(20, 184, 166, 0.1)";
      });
      searchInput.addEventListener("blur", () => {
        searchInput.style.background = "rgba(255, 255, 255, 0.05)";
        searchInput.style.borderColor = "rgba(255, 255, 255, 0.1)";
        searchInput.style.boxShadow = "0 0 0 0 rgba(20, 184, 166, 0)";
      });
    }

    // Hover effects for search clear button
    const searchClear = sidebarContainer.querySelector(
      ".sp-vault-search-clear",
    );
    if (searchClear) {
      searchClear.addEventListener("mouseenter", () => {
        searchClear.style.background = "rgba(255, 255, 255, 0.2)";
      });
      searchClear.addEventListener("mouseleave", () => {
        searchClear.style.background = "rgba(255, 255, 255, 0.1)";
      });
    }

    // Hover effects for category headers (with custom gradients)
    const categoryHeaders = sidebarContainer.querySelectorAll(
      ".sp-vault-category-header",
    );
    categoryHeaders.forEach((header) => {
      const baseGradient = header.getAttribute("data-base-gradient");
      const hoverGradient = header.getAttribute("data-hover-gradient");

      header.addEventListener("mouseenter", () => {
        header.style.background = hoverGradient;
        header.style.transform = "translateY(-1px)";
        header.style.boxShadow =
          "0 4px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)";
      });
      header.addEventListener("mouseleave", () => {
        header.style.background = baseGradient;
        header.style.transform = "translateY(0)";
        header.style.boxShadow =
          "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)";
      });
    });

    // Hover effects for chat items + Active chat highlighting
    const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");

    // Get current chat ID from URL
    const getCurrentChatId = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/c\/([^\/]+)/);
      return match ? match[1] : null;
    };

    const currentChatId = getCurrentChatId();
    const themeColors = getVaultSidebarThemeColors();

    chatItems.forEach((chatItem) => {
      const chatId = chatItem.getAttribute("data-chat-id");
      const isActive = chatId === currentChatId;

      // Apply active chat styles
      if (isActive) {
        chatItem.style.background = themeColors.activeBg;
        chatItem.style.borderLeft = `3px solid ${themeColors.activeBorder}`;
        chatItem.style.paddingLeft = "7px"; // Compensate for border
        chatItem.style.boxShadow = "none";

        // Make title slightly bolder for active chat
        const titleSpan = chatItem.querySelector(".sp-vault-chat-title");
        if (titleSpan) {
          titleSpan.style.fontWeight = "600";
          titleSpan.style.color = themeColors.activeText;
        }

        // Add a subtle glow effect
        chatItem.style.position = "relative";
        chatItem.setAttribute("data-active-chat", "true");
      }

      // Hover effects (don't override active chat background)
      chatItem.addEventListener("mouseenter", () => {
        // Detect current theme
        const themeColors = getVaultSidebarThemeColors();
        if (!chatItem.hasAttribute("data-active-chat")) {
          chatItem.style.background = themeColors.hoverBg;
        } else {
          // Slightly enhance active chat on hover
          chatItem.style.background = themeColors.activeBg;
        }

        // Show checkbox on hover (if not already in bulk mode)
        const checkboxWrapper = chatItem.querySelector(
          ".sp-vault-chat-checkbox-wrapper",
        );
        const menuBtn = chatItem.querySelector(".sp-vault-chat-menu-btn");
        const isSelected = selectedChatIds.has(
          chatItem.getAttribute("data-chat-id"),
        );

        if (checkboxWrapper && !bulkSelectionMode && !isSelected) {
          checkboxWrapper.style.width = "20px";
          checkboxWrapper.style.opacity = "1";
        }
      });

      chatItem.addEventListener("mouseleave", () => {
        // Detect current theme
        const themeColors = getVaultSidebarThemeColors();
        const isSelected = selectedChatIds.has(
          chatItem.getAttribute("data-chat-id"),
        );

        if (!chatItem.hasAttribute("data-active-chat") && !isSelected) {
          chatItem.style.background = "transparent";
        } else if (isSelected) {
          chatItem.style.background =
            "rgba(var(--sp-accent-rgb, 20, 184, 166), 0.15)";
        } else {
          // Restore active chat gradient
          chatItem.style.background = themeColors.activeBg;
        }

        // Hide checkbox on mouse leave (if not in bulk mode and not selected)
        const checkboxWrapper = chatItem.querySelector(
          ".sp-vault-chat-checkbox-wrapper",
        );

        if (checkboxWrapper && !bulkSelectionMode && !isSelected) {
          checkboxWrapper.style.width = "0px";
          checkboxWrapper.style.opacity = "0";
        }
      });
    });

    // Function to reset hover states of all chat items
    window.resetVaultChatHoverStates = function () {
      const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");
      chatItems.forEach((item) => {
        // Remove hover class and ensure default state
        item.classList.remove("hover");

        // Find and reset hover elements using correct selectors
        const messageIcon = item.querySelector(".sp-vault-chat-message-icon");
        const menuBtn = item.querySelector(".sp-vault-chat-menu-btn");

        if (messageIcon && menuBtn) {
          // Reset to default state: show message icon, hide menu button
          messageIcon.style.display = "";
          messageIcon.style.visibility = "visible";
          messageIcon.style.opacity = "0.7";

          // Menu button should be flex but transparent
          menuBtn.style.display = "flex";
          menuBtn.style.visibility = "visible";
          menuBtn.style.opacity = "0";
          menuBtn.style.pointerEvents = "none";
        }

        // Force a reflow to clear any CSS pseudo-states
        const originalDisplay = item.style.display;
        item.style.display = "none";
        item.offsetHeight; // Trigger reflow
        item.style.display = originalDisplay || "";
      });
    };

    // Function to update active chat highlighting (can be called on URL changes)
    window.updateActiveChatHighlight = function () {
      const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");
      const getCurrentChatId = () => {
        const path = window.location.pathname;
        const match = path.match(/^\/c\/([^\/]+)/);
        return match ? match[1] : null;
      };

      const currentChatId = getCurrentChatId();
      const themeColors = getVaultSidebarThemeColors();

      chatItems.forEach((chatItem) => {
        const chatId = chatItem.getAttribute("data-chat-id");
        const isActive = chatId === currentChatId;
        const wasActive = chatItem.hasAttribute("data-active-chat");

        if (isActive && !wasActive) {
          // Apply active styles with theme-aware colors
          chatItem.style.background = themeColors.activeBg;
          chatItem.style.borderLeft = `3px solid ${themeColors.activeBorder}`;
          chatItem.style.paddingLeft = "7px";
          chatItem.style.boxShadow = "none";

          const titleSpan = chatItem.querySelector(".sp-vault-chat-title");
          if (titleSpan) {
            titleSpan.style.fontWeight = "600";
            titleSpan.style.color = themeColors.activeText;
          }

          chatItem.setAttribute("data-active-chat", "true");
        } else if (!isActive && wasActive) {
          // Remove active styles
          chatItem.style.background = "transparent";
          chatItem.style.borderLeft = "none";
          chatItem.style.paddingLeft = "10px";
          chatItem.style.boxShadow = "none";

          const titleSpan = chatItem.querySelector(".sp-vault-chat-title");
          if (titleSpan) {
            titleSpan.style.fontWeight = "normal";
            titleSpan.style.color = themeColors.text;
          }

          chatItem.removeAttribute("data-active-chat");
        }
      });
    };

    // Hover effects for project badges and avatars
    const projectElements = sidebarContainer.querySelectorAll(
      ".sp-vault-chat-project-badge, .sp-vault-chat-avatar",
    );
    projectElements.forEach((element) => {
      element.addEventListener("mouseenter", () => {
        element.style.opacity = "1";
        element.style.transform = "scale(1.15)";
      });
      element.addEventListener("mouseleave", () => {
        element.style.opacity = element.classList.contains(
          "sp-vault-chat-avatar",
        )
          ? "0.9"
          : "0.8";
        element.style.transform = "scale(1)";
      });
    });

    // Hover effects for notes badges
    const notesBadges = sidebarContainer.querySelectorAll(
      ".sp-vault-chat-note-badge",
    );
    notesBadges.forEach((badge) => {
      badge.addEventListener("mouseenter", () => {
        badge.style.opacity = "1";
        badge.style.transform = "scale(1.15)";
      });
      badge.addEventListener("mouseleave", () => {
        badge.style.opacity = "0.8";
        badge.style.transform = "scale(1)";
      });
    });
  }

  // ============================================================================
  // UI: Update notes badges for chats that have notes
  // ============================================================================

  async function updateNotesBadges() {
    if (!sidebarContainer) return;

    const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");

    devLog(`📝 [VAULT] Updating note badges for ${chatItems.length} chats`);
    devLog(
      `📝 [VAULT] NotesManager available:`,
      !!window.SuperPromptNotesManager,
    );

    // Check each chat for notes
    const checks = Array.from(chatItems).map(async (chatItem) => {
      const chatId = chatItem.getAttribute("data-chat-id");
      if (!chatId) return;

      try {
        // Use NotesManager module if available
        let hasNote = false;
        if (window.SuperPromptNotesManager?.conversationHasNotes) {
          hasNote =
            await window.SuperPromptNotesManager.conversationHasNotes(chatId);
          if (hasNote) {
            devLog(`📝 [VAULT] Chat ${chatId} has notes`);
          }
        } else {
          devWarn("📝 [VAULT] SuperPromptNotesManager not available");
        }

        // Update the badge visibility (target the wrapper now)
        const noteWrapper = chatItem.querySelector(
          ".sp-vault-note-badge-wrapper",
        );
        if (noteWrapper) {
          if (hasNote) {
            noteWrapper.style.display = "flex";
            chatItem.setAttribute("data-has-note", "true");
            devLog(`📝 [VAULT] Showing note badge for chat ${chatId}`);
          } else {
            noteWrapper.style.display = "none";
            chatItem.setAttribute("data-has-note", "false");
            devLog(`📝 [VAULT] Hiding note badge for chat ${chatId}`);
          }
        }
      } catch (error) {
        devWarn(`?? [VAULT] Failed to check notes for chat ${chatId}:`, error);
      }
    });

    await Promise.all(checks);
    devLog(`📝 [VAULT] Finished updating note badges`);
  }

  // ============================================================================
  // UI: Attach event listeners to notes badges
  // ============================================================================

  function attachNotesBadgeListeners() {
    if (!sidebarContainer) return;

    const notesBadges = sidebarContainer.querySelectorAll(
      ".sp-vault-chat-note-badge",
    );

    notesBadges.forEach((badge) => {
      badge.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent chat click from firing

        const chatItem = badge.closest(".sp-vault-chat");
        if (!chatItem) return;

        const chatId = chatItem.getAttribute("data-chat-id");
        if (!chatId) return;

        // Open the notes sidebar using NotesManager module
        if (window.SuperPromptNotesManager?.openNoteSidebar) {
          window.SuperPromptNotesManager.openNoteSidebar(chatId, true);
        } else {
          devWarn("?? [VAULT] NotesManager module not available");
        }
      });
    });
  }

  // ============================================================================
  // UI: Attach hover effects for category menu buttons
  // ============================================================================

  function attachCategoryMenuHoverEffects() {
    if (!sidebarContainer) return;

    const categoryHeaders = sidebarContainer.querySelectorAll(
      ".sp-vault-category-header",
    );

    categoryHeaders.forEach((header) => {
      const actionsContainer = header.querySelector(
        ".sp-vault-category-actions",
      );
      const countSpan = header.querySelector(".sp-vault-category-count");
      const menuBtn = header.querySelector(".sp-vault-category-menu-btn");

      if (!actionsContainer || !countSpan || !menuBtn) return;

      // Show menu button on header hover
      header.addEventListener("mouseenter", () => {
        countSpan.style.opacity = "0";
        countSpan.style.pointerEvents = "none";
        menuBtn.style.opacity = "1";
        menuBtn.style.pointerEvents = "auto";
      });

      header.addEventListener("mouseleave", () => {
        // Only hide if context menu is not open
        if (!menuBtn.hasAttribute("data-menu-open")) {
          menuBtn.style.opacity = "0";
          menuBtn.style.pointerEvents = "none";
          countSpan.style.opacity = "1";
          countSpan.style.pointerEvents = "auto";
        }
      });

      // Hover effect on menu button itself
      menuBtn.addEventListener("mouseenter", () => {
        const isDark = header.classList.contains("sp-vault-special-category");
        // Check if it's Favorites (dark text) or Archived (white text)
        const isFavorites = header.querySelector('span[style*="color: #000"]');
        menuBtn.style.background = isFavorites
          ? "rgba(0,0,0,0.3)"
          : "rgba(255,255,255,0.3)";
      });

      menuBtn.addEventListener("mouseleave", () => {
        const isFavorites = header.querySelector('span[style*="color: #000"]');
        menuBtn.style.background = isFavorites
          ? "rgba(0,0,0,0.2)"
          : "rgba(255,255,255,0.2)";
      });
    });
  }

  // ============================================================================
  // UI: Attach click handlers for category menu buttons
  // ============================================================================

  function attachCategoryMenuHandlers() {
    if (!sidebarContainer) return;

    const menuButtons = sidebarContainer.querySelectorAll(
      ".sp-vault-category-menu-btn",
    );

    menuButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent category collapse/expand

        const categoryId = btn.getAttribute("data-category-id");

        // Get category name directly from the DOM (more reliable than searching activeVaultData)
        const headerElement = btn.closest(".sp-vault-category-header");
        const categoryNameElement = headerElement?.querySelector(
          ".sp-vault-category-name",
        );
        const categoryNameFromDOM =
          categoryNameElement?.textContent?.trim() || "";

        // Close any existing context menu
        const existingMenu = document.querySelector(".sp-vault-context-menu");
        if (existingMenu) {
          existingMenu.style.opacity = "0";
          existingMenu.style.transform = "scale(0.95)";
          setTimeout(() => existingMenu.remove(), 150);
        }

        // Get theme colors
        const theme = getThemeColors();

        // Create context menu
        const menu = document.createElement("div");
        menu.className = "sp-vault-context-menu";
        menu.style.cssText = `
          position: fixed;
          background: ${theme.menuBg};
          background-image: ${theme.menuBgGradient};
          border: 1px solid ${theme.menuBorder};
          border-radius: 12px;
          box-shadow: ${theme.menuShadow};
          backdrop-filter: none;
          min-width: 200px;
          z-index: 999999;
          overflow: hidden;
          opacity: 0;
          transform: scale(0.92) translateY(-8px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // Detect special categories (Favorites, Archived, Uncategorized)
        // These are system categories used for visual filtering, not user-created categories
        const specialCategoryIds = [
          "sp-special-favorites",
          "sp-special-archived",
          "uncategorized",
        ];

        const isSpecialCategory = specialCategoryIds.includes(
          String(categoryId),
        );

        // Add category name header at the top if available
        if (categoryNameFromDOM) {
          const headerDiv = document.createElement("div");
          headerDiv.style.cssText = `
            padding: 14px 16px 12px;
            margin-bottom: 6px;
            border-bottom: 1px solid ${theme.dividerBg};
            color: ${theme.textColor};
            font-weight: 700;
            font-size: 15px;
            letter-spacing: 0.01em;
            background: ${
              theme.isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)"
            };
          `;
          headerDiv.textContent = categoryNameFromDOM;
          menu.appendChild(headerDiv);
        }

        // Menu items with Lucide icons (different for special categories)
        const menuItems = isSpecialCategory
          ? categoryId === "sp-special-favorites"
            ? [
                // Favorites category: allow unfavoriting all + deleting chats
                {
                  label: getTranslation("unfavoriteAllChats"),
                  icon: "StarOff",
                  action: "unfavorite-all",
                  danger: false,
                },
                { label: "---" }, // Divider
                {
                  label: getTranslation("deleteChats"),
                  icon: "Trash2",
                  action: "delete-chats",
                  danger: true,
                },
              ]
            : [
                // Other special categories: only allow deleting chats
                {
                  label: getTranslation("deleteChats"),
                  icon: "Trash2",
                  action: "delete-chats",
                  danger: true,
                },
              ]
          : [
              // Regular categories: full menu
              {
                label: getTranslation("renameCategory"),
                icon: "Edit3",
                action: "rename",
              },
              {
                label: getTranslation("changeColor"),
                icon: "Palette",
                action: "color",
              },
              {
                label: getTranslation("createSubfolder"),
                icon: "FolderPlus",
                action: "subfolder",
              },
              { label: "---" }, // Divider
              {
                label: getTranslation("deleteCategory"),
                icon: "Trash2",
                action: "delete",
                danger: true,
              },
            ];

        menuItems.forEach((item) => {
          if (item.label === "---") {
            const divider = document.createElement("div");
            divider.style.cssText = `
              height: 1px;
              background: ${theme.dividerBg};
              margin: 6px 8px;
            `;
            menu.appendChild(divider);
          } else {
            const menuItem = document.createElement("div");
            menuItem.className = "sp-vault-context-menu-item";
            menuItem.style.cssText = `
              padding: 10px 14px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 10px;
              color: ${item.danger ? theme.textDanger : theme.textColor};
              font-size: 13.5px;
              font-weight: 500;
              transition: background 0.15s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
            `;

            const iconColor = item.danger ? theme.textDanger : theme.textColor;
            const textColor = item.danger ? theme.textDanger : theme.textColor;

            menuItem.innerHTML = `
              <span style="display: flex; align-items: center; opacity: 0.9;">${getLucideIcon(
                item.icon,
                16,
                iconColor,
              )}</span>
              <span style="flex: 1; color: ${textColor};">${item.label}</span>
            `;

            // Hover effect - clean and full width
            menuItem.addEventListener("mouseenter", () => {
              if (item.danger) {
                menuItem.style.background = theme.hoverBgDanger;
              } else {
                menuItem.style.background = theme.hoverBg;
              }
            });

            menuItem.addEventListener("mouseleave", () => {
              menuItem.style.background = "transparent";
            });

            // Click handler
            menuItem.addEventListener("click", () => {
              menu.remove();
              btn.removeAttribute("data-menu-open");

              // Handle actions
              if (item.action === "delete") {
                handleDeleteCategory(categoryId);
              } else if (item.action === "delete-chats") {
                handleDeleteChatsInCategory(categoryId);
              } else if (item.action === "unfavorite-all") {
                handleUnfavoriteAllChats();
              } else if (item.action === "color") {
                // Open a standalone premium color picker in the vault sidebar itself
                openCategoryColorPicker(categoryId);
              } else if (item.action === "rename") {
                // Inline rename category
                renameCategoryInline(categoryId);
              } else {
                // TODO: Implement other actions (subfolder)
              }
            });

            menu.appendChild(menuItem);
          }
        });

        // Position menu relative to button
        const btnRect = btn.getBoundingClientRect();
        const actionsContainer = btn.closest(".sp-vault-category-actions");
        const categoryHeader = btn.closest(".sp-vault-category-header");

        // Append to body instead of actionsContainer to avoid clipping
        document.body.appendChild(menu);

        // Position absolutely relative to viewport
        menu.style.position = "fixed";
        menu.style.right = `${window.innerWidth - btnRect.right + 8}px`;
        menu.style.zIndex = "999999";

        // Use collision detection to position menu vertically (above or below)
        positionFixedContextMenu(menu, btn, {
          gap: 4,
          minBottomMargin: 20,
          preferredPosition: "below",
        });

        // Note: fade-in animation is now handled by positionFixedContextMenu()

        // Mark menu as open
        btn.setAttribute("data-menu-open", "true");

        // Close menu when clicking outside - Use capture phase to catch event BEFORE it bubbles
        const closeMenu = (e) => {
          // Ignore if clicking on the menu itself or the button that opened it
          if (menu.contains(e.target) || btn.contains(e.target)) {
            return;
          }

          // INSTANT: Disable pointer events immediately so menu doesn't block clicks
          menu.style.pointerEvents = "none";

          // Fade out animation (visual only, menu is already "gone" for interactions)
          menu.style.opacity = "0";
          menu.style.transform = "scale(0.95) translateY(-4px)";

          // Remove from DOM after animation completes
          setTimeout(() => {
            menu.remove();
          }, 150);

          btn.removeAttribute("data-menu-open");
          document.removeEventListener("click", closeMenu, true); // Remove from capture phase

          // Reset z-index on header
          if (categoryHeader) {
            categoryHeader.style.zIndex = "";
            categoryHeader.style.position = "";
          }

          // Restore count visibility
          const header = btn.closest(".sp-vault-category-header");
          const countSpan = header?.querySelector(".sp-vault-category-count");
          if (countSpan && !header?.matches(":hover")) {
            btn.style.opacity = "0";
            btn.style.pointerEvents = "none";
            countSpan.style.opacity = "1";
            countSpan.style.pointerEvents = "auto";
          }
        };

        // Add listener in CAPTURE phase - fires before bubble phase, instant!
        document.addEventListener("click", closeMenu, true);
      });
    });
  }

  // ============================================================================
  // UI: Attach hover effects for chat menu buttons
  // ============================================================================

  function attachChatMenuHoverEffects() {
    if (!sidebarContainer) return;

    const chatItems = sidebarContainer.querySelectorAll(".sp-vault-chat");

    chatItems.forEach((chatItem) => {
      const actionsContainer = chatItem.querySelector(".sp-vault-chat-actions");
      const menuBtn = chatItem.querySelector(".sp-vault-chat-menu-btn");
      const messageIcon = chatItem.querySelector(".sp-vault-chat-message-icon");
      const badges = chatItem.querySelectorAll(
        ".sp-vault-chat-note-badge, .sp-vault-chat-project-badge",
      );

      // Ensure initial state is consistent
      if (messageIcon) {
        messageIcon.style.display = "";
        messageIcon.style.visibility = "visible";
        messageIcon.style.opacity = "1";
      }
      if (menuBtn) {
        // Don't set display:none - button needs to be flex to show when opacity changes
        menuBtn.style.display = "flex";
        menuBtn.style.visibility = "visible";
        menuBtn.style.opacity = "0";
      }

      if (!menuBtn) return;

      // Remove any existing listeners by temporarily storing them
      const existingMouseEnter = chatItem._mouseEnterHandler;
      const existingMouseLeave = chatItem._mouseLeaveHandler;

      if (existingMouseEnter) {
        chatItem.removeEventListener("mouseenter", existingMouseEnter);
      }
      if (existingMouseLeave) {
        chatItem.removeEventListener("mouseleave", existingMouseLeave);
      }

      // Force initial state to ensure consistent starting point
      if (messageIcon) {
        messageIcon.style.opacity = "0.7";
      }
      menuBtn.style.opacity = "0";
      menuBtn.style.pointerEvents = "none";

      // Show menu button (and hide message icon) on chat hover
      const handleMouseEnter = () => {
        // Hide message icon
        if (messageIcon) {
          messageIcon.style.opacity = "0";
        }

        // Show menu button
        menuBtn.style.opacity = "1";
        menuBtn.style.pointerEvents = "auto";
      };

      const handleMouseLeave = () => {
        // Only hide if context menu is not open
        if (!menuBtn.hasAttribute("data-menu-open")) {
          // Restore message icon
          if (messageIcon) {
            messageIcon.style.opacity = "0.7";
          }

          // Hide menu button
          menuBtn.style.opacity = "0";
          menuBtn.style.pointerEvents = "none";
        }
      };

      const handleMenuBtnEnter = () => {
        const themeColors = getVaultSidebarThemeColors();
        menuBtn.style.background = themeColors.bgTertiary;
      };

      const handleMenuBtnLeave = () => {
        const themeColors = getVaultSidebarThemeColors();
        menuBtn.style.background = themeColors.bgSecondary;
      };

      // Store handler references for future cleanup
      chatItem._mouseEnterHandler = handleMouseEnter;
      chatItem._mouseLeaveHandler = handleMouseLeave;

      chatItem.addEventListener("mouseenter", handleMouseEnter);
      chatItem.addEventListener("mouseleave", handleMouseLeave);
      menuBtn.addEventListener("mouseenter", handleMenuBtnEnter);
      menuBtn.addEventListener("mouseleave", handleMenuBtnLeave);

      // Store cleanup function on the element for potential future cleanup
      chatItem._cleanupHoverEvents = () => {
        chatItem.removeEventListener("mouseenter", handleMouseEnter);
        chatItem.removeEventListener("mouseleave", handleMouseLeave);
        menuBtn.removeEventListener("mouseenter", handleMenuBtnEnter);
        menuBtn.removeEventListener("mouseleave", handleMenuBtnLeave);
      };
    });
  }

  // ============================================================================
  // Helper: Preload projects for instant submenu display
  // ============================================================================

  // Global loading promise to prevent duplicate requests (shared between vault sidebar and React components)
  const getProjectsLoadingPromise = () => {
    return window.__spProjectsLoadingPromise;
  };

  const setProjectsLoadingPromise = (promise) => {
    window.__spProjectsLoadingPromise = promise;
  };

  async function preloadProjectsForSubmenu() {
    try {
      // Check if already cached and fresh
      window.__spProjectsCache = window.__spProjectsCache || {
        items: null,
        ts: 0,
      };
      const cache = window.__spProjectsCache;

      // If cache is fresh (less than 60 seconds old), no need to reload
      if (cache.items && Date.now() - cache.ts < 60_000) {
        devLog(
          `📦 [VAULT] Projects already cached (${cache.items.length} items), skipping preload`,
        );
        return cache.items;
      }

      // If already loading, return the existing promise (prevent duplicates!)
      const existingPromise = getProjectsLoadingPromise();
      if (existingPromise) {
        devLog(
          "⏳ [VAULT] Projects already loading, waiting for existing request...",
        );
        return await existingPromise;
      }

      devLog("🔄 [VAULT] Starting background project preload...");

      // Create the loading promise
      const loadPromise = new Promise(async (resolve, reject) => {
        try {
          // Get projects from content script
          const response = await new Promise((innerResolve, innerReject) => {
            const requestId = `projects-preload-${Date.now()}`;

            const handleResponse = (event) => {
              const data = event.data;
              if (data.type === "sp-response" && data.requestId === requestId) {
                window.removeEventListener("message", handleResponse);
                if (data.success) {
                  innerResolve(data.projects);
                } else {
                  innerReject(
                    new Error(data.error || "Failed to load projects"),
                  );
                }
              }
            };

            window.addEventListener("message", handleResponse);

            // Send request
            window.postMessage(
              {
                type: "sp-get-projects",
                requestId: requestId,
              },
              "*",
            );

            // Timeout after 30 seconds
            setTimeout(() => {
              window.removeEventListener("message", handleResponse);
              innerReject(new Error("Request timeout"));
            }, 30000);
          });

          // Update cache
          cache.items = response;
          cache.ts = Date.now();
          devLog(
            `✅ [VAULT] Preloaded ${
              response?.length || 0
            } projects in background`,
          );

          resolve(response);
        } catch (error) {
          reject(error);
        } finally {
          // Clear the loading promise when done
          setProjectsLoadingPromise(null);
        }
      });

      setProjectsLoadingPromise(loadPromise);
      return await loadPromise;
    } catch (error) {
      devError("❌ [VAULT] Failed to preload projects:", error);
      setProjectsLoadingPromise(null);
      // Don't throw - preloading is best-effort
      return null;
    }
  }

  // ============================================================================
  // Helper: Create skeleton submenu (instant loading state)
  // ============================================================================

  function createSkeletonSubmenu(parentItem, theme) {
    const submenu = document.createElement("div");
    submenu.className = "sp-project-submenu";
    submenu.style.cssText = `
      position: fixed;
      background: ${theme.menuBg};
      background-image: ${theme.menuBgGradient};
      border: 1px solid ${theme.borderColor};
      border-radius: 12px;
      padding: 8px;
      min-width: 220px;
      max-width: 320px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 10000000;
      opacity: 0;
      transform: scale(0.95) translateY(-6px);
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    // Add skeleton pulse animation if not already added
    if (!document.getElementById("sp-skeleton-pulse-style")) {
      const style = document.createElement("style");
      style.id = "sp-skeleton-pulse-style";
      style.textContent = `
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Create 3 skeleton items with visible backgrounds
    for (let i = 0; i < 3; i++) {
      const skeletonItem = document.createElement("div");
      skeletonItem.style.cssText = `
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 8px;
      `;

      // Create icon skeleton
      const iconSkeleton = document.createElement("span");
      iconSkeleton.style.cssText = `
        width: 17px;
        height: 17px;
        border-radius: 4px;
        background: rgba(148, 163, 184, 0.2);
        flex-shrink: 0;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
        animation-delay: ${i * 0.1}s;
      `;

      // Create text skeleton
      const textSkeleton = document.createElement("span");
      const width = 80 + Math.random() * 40;
      textSkeleton.style.cssText = `
        height: 14px;
        border-radius: 6px;
        background: rgba(148, 163, 184, 0.15);
        width: ${width}%;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
        animation-delay: ${i * 0.1 + 0.05}s;
      `;

      skeletonItem.appendChild(iconSkeleton);
      skeletonItem.appendChild(textSkeleton);
      submenu.appendChild(skeletonItem);
    }

    return submenu;
  }

  // ============================================================================
  // Helper: Create project submenu
  // ============================================================================

  async function createProjectSubmenu(chatId, chatTitle, parentItem, theme) {
    try {
      // Simple in-memory cache for projects to avoid repeated fetch delay
      window.__spProjectsCache = window.__spProjectsCache || {
        items: null,
        ts: 0,
      };
      const cache = window.__spProjectsCache;

      let response = cache.items;
      if (!response || Date.now() - cache.ts > 60_000) {
        devLog("🔄 [VAULT] Fetching projects from content script...");
        // Get projects from content script
        response = await new Promise((resolve, reject) => {
          const requestId = `projects-submenu-${Date.now()}`;

          const handleResponse = (event) => {
            const data = event.data;
            if (data.type === "sp-response" && data.requestId === requestId) {
              window.removeEventListener("message", handleResponse);
              if (data.success) {
                devLog(
                  `✅ [VAULT] Received ${
                    data.projects?.length || 0
                  } projects from content script`,
                );
                resolve(data.projects);
              } else {
                devError("❌ [VAULT] Failed to load projects:", data.error);
                reject(new Error(data.error || "Failed to load projects"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Send request
          window.postMessage(
            {
              type: "sp-get-projects",
              requestId: requestId,
            },
            "*",
          );

          // Timeout after 30 seconds (allows time for pagination with many projects)
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            devError("⏱️ [VAULT] Project request timeout");
            reject(new Error("Request timeout"));
          }, 30000);
        });

        // Update cache
        cache.items = response;
        cache.ts = Date.now();
        devLog(`💾 [VAULT] Cached ${response?.length || 0} projects`);
      } else {
        devLog(`📦 [VAULT] Using cached ${response?.length || 0} projects`);
      }

      if (!response || response.length === 0) {
        devLog("⚠️ [VAULT] No projects available");
        return null;
      }

      devLog(`🏗️ [VAULT] Building submenu with ${response.length} projects`);

      // Create submenu with premium styling
      const submenu = document.createElement("div");
      submenu.className = "sp-project-submenu";
      submenu.style.cssText = `
        position: fixed;
        background: ${theme.menuBg};
        background-image: ${theme.menuBgGradient};
        border: 1px solid ${theme.borderColor};
        border-radius: 12px;
        padding: 8px;
        min-width: 220px;
        max-width: 320px;
        max-height: 420px;
        overflow-y: auto;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10000000;
        opacity: 0;
        transform: scale(0.95) translateY(-6px);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;

      // Add projects to submenu
      response.forEach((project) => {
        const projectId =
          project.gizmo?.gizmo?.id || project.gizmo?.id || project.id;
        const projectName =
          project.gizmo?.gizmo?.display?.name ||
          project.gizmo?.display?.name ||
          project.name ||
          projectId;

        if (!projectId) {
          devWarn("⚠️ [VAULT] Skipping project without ID:", project);
          return;
        }

        const projectItem = document.createElement("div");
        projectItem.className = "sp-project-submenu-item";
        projectItem.style.cssText = `
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          color: ${theme.textColor};
          font-size: 13.5px;
          font-weight: 500;
          transition: background 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        `;

        projectItem.innerHTML = `
          <span style="display: flex; align-items: center; flex-shrink: 0; opacity: 0.85; transition: opacity 0.15s;">
            ${getLucideIcon("FolderKanban", 17, "#14b8a6")}
          </span>
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">
            ${projectName}
          </span>
        `;

        // Clean hover effect - full width background
        projectItem.addEventListener("mouseenter", () => {
          projectItem.style.background = theme.hoverBg;
          const icon = projectItem.querySelector("span");
          if (icon) icon.style.opacity = "1";
        });

        projectItem.addEventListener("mouseleave", () => {
          projectItem.style.background = "transparent";
          const icon = projectItem.querySelector("span");
          if (icon) icon.style.opacity = "0.85";
        });

        // Click handler - move chat to project
        projectItem.addEventListener("click", async (e) => {
          e.stopPropagation();

          try {
            // Close menus
            document
              .querySelectorAll(".sp-project-submenu")
              .forEach((s) => s.remove());
            document
              .querySelectorAll(".sp-vault-chat-context-menu")
              .forEach((m) => m.remove());

            // Show loading toast
            const loadingToast = showToast(
              `Moving to ${projectName}...`,
              "info",
            );

            // Move chat to project
            const moveResponse = await new Promise((resolve, reject) => {
              const requestId = `move-project-${Date.now()}`;

              const handleResponse = (event) => {
                const data = event.data;
                if (
                  data.type === "sp-response" &&
                  data.requestId === requestId
                ) {
                  window.removeEventListener("message", handleResponse);
                  if (data.success) {
                    resolve(true);
                  } else {
                    reject(new Error(data.error || "Failed to move chat"));
                  }
                }
              };

              window.addEventListener("message", handleResponse);

              // Send request
              window.postMessage(
                {
                  type: "sp-move-to-project",
                  requestId: requestId,
                  chatId: chatId,
                  projectId: projectId,
                  projectName: projectName,
                },
                "*",
              );

              // Timeout after 10 seconds
              setTimeout(() => {
                window.removeEventListener("message", handleResponse);
                reject(new Error("Request timeout"));
              }, 10000);
            });

            // Remove loading toast
            if (loadingToast && loadingToast.parentElement) {
              loadingToast.parentElement.removeChild(loadingToast);
            }

            // Show success
            showToast(`Moved to ${projectName}`, "success");
          } catch (error) {
            devError("❌ [VAULT] Failed to move chat:", error);
            showToast("Failed to move chat", "error");
          }
        });

        submenu.appendChild(projectItem);
      });

      // Keep submenu open when hovering over it
      submenu.addEventListener("mouseenter", () => {
        // Cancel any pending hide timeout
        submenu.setAttribute("data-hovering", "true");
      });

      submenu.addEventListener("mouseleave", () => {
        submenu.removeAttribute("data-hovering");
        // Hide submenu
        setTimeout(() => {
          if (!submenu.getAttribute("data-hovering")) {
            submenu.style.opacity = "0";
            submenu.style.transform = "scale(0.95) translateY(-4px)";
            setTimeout(() => submenu.remove(), 150);
          }
        }, 200);
      });

      devLog(
        `✅ [VAULT] Successfully created project submenu with ${response.length} projects`,
      );
      return submenu;
    } catch (error) {
      devError("❌ [VAULT] Failed to create project submenu:", error);
      return null;
    }
  }

  // ============================================================================
  // UI: Attach click handlers for chat menu buttons
  // ============================================================================

  function attachChatMenuHandlers() {
    if (!sidebarContainer) return;

    const menuButtons = sidebarContainer.querySelectorAll(
      ".sp-vault-chat-menu-btn",
    );

    menuButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent chat click from firing

        const chatId = btn.getAttribute("data-chat-id");
        const chatItem = btn.closest(".sp-vault-chat");
        const chatTitle =
          chatItem?.querySelector(".sp-vault-chat-title")?.textContent ||
          "Untitled";
        const categoryId = chatItem?.getAttribute("data-category-id") || "";

        // Get current chat status from activeVaultData
        let isFavorited = false;
        let isArchived = false;
        if (activeVaultData && activeVaultData.chats) {
          const chat = activeVaultData.chats.find((c) => c.id === chatId);
          if (chat) {
            isFavorited = chat.is_starred || chat.favorite || false;
            isArchived = chat.is_archived || false;
          }
        }

        // Check if this is a special category (favorites, archived, uncategorized)
        const isSpecialCategory =
          categoryId === "sp-special-favorites" ||
          categoryId === "sp-special-archived" ||
          categoryId === "uncategorized" ||
          categoryId === "";

        // Close any existing context menu
        const existingMenu = document.querySelector(
          ".sp-vault-chat-context-menu",
        );
        if (existingMenu) {
          existingMenu.style.opacity = "0";
          existingMenu.style.transform = "scale(0.95)";
          setTimeout(() => existingMenu.remove(), 150);
        }

        // Get theme colors
        const theme = getThemeColors();

        // Create context menu
        const menu = document.createElement("div");
        menu.className = "sp-vault-chat-context-menu";
        menu.style.cssText = `
          position: fixed;
          background: ${theme.menuBg};
          background-image: ${theme.menuBgGradient};
          border: 1px solid ${theme.menuBorder};
          border-radius: 12px;
          box-shadow: ${theme.menuShadow};
          backdrop-filter: none;
          min-width: 200px;
          max-width: 240px;
          z-index: 99999999;
          overflow: hidden;
          opacity: 0;
          transform: scale(0.92) translateY(-8px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // Menu items - conditional labels based on current status with Lucide icons
        const menuItems = [
          // Favorite/Unfavorite based on current status
          isFavorited
            ? {
                label: getTranslation("removeFromFavorites"),
                icon: "Star",
                action: "favorite",
              }
            : {
                label: getTranslation("addToFavorites"),
                icon: "Star",
                action: "favorite",
              },
          // Archive/Unarchive based on current status
          isArchived
            ? {
                label: getTranslation("unarchive"),
                icon: "Archive",
                action: "archive",
              }
            : {
                label: getTranslation("archive"),
                icon: "Archive",
                action: "archive",
              },
          // Only show "Remove from folder" for custom categories
          ...(isSpecialCategory
            ? []
            : [
                {
                  label: getTranslation("removeFromFolder"),
                  icon: "FolderMinus",
                  action: "uncategorize",
                },
              ]),
          {
            label: getTranslation("openNewTab"),
            icon: "ExternalLink",
            action: "open-tab",
          },
          {
            label: getTranslation("preview"),
            icon: "Eye",
            action: "preview",
          },
          { label: "---" }, // Divider
          {
            label: getTranslation("renameChat"),
            icon: "Edit3",
            action: "rename",
          },
          {
            label: getTranslation("moveToCategory"),
            icon: "FolderInput",
            action: "move",
          },
          {
            label: getTranslation("moveToProject"),
            icon: "FolderKanban",
            action: "move-project",
          },
          {
            label: getTranslation("copyLink"),
            icon: "Link",
            action: "copy",
          },
          {
            label: getTranslation("shareChat"),
            icon: "Share2",
            action: "share",
          },
          {
            label: getTranslation("printChat"),
            icon: "Printer",
            action: "print",
          },
          {
            label: getTranslation("exportChat"),
            icon: "Download",
            action: "export",
            pro: true,
          },
          {
            label: getTranslation("referenceChat"),
            icon: "Quote",
            action: "reference",
            pro: true,
          },
          { label: "---" }, // Divider
          {
            label: getTranslation("unlinkFromWorkspace"),
            icon: "Link",
            action: "unlink",
          },
          {
            label: getTranslation("deleteChat"),
            icon: "Trash2",
            action: "delete",
            danger: true,
          },
        ];

        menuItems.forEach((item) => {
          if (item.label === "---") {
            const divider = document.createElement("div");
            divider.style.cssText = `
              height: 1px;
              background: ${theme.dividerBg};
              margin: 6px 8px;
            `;
            menu.appendChild(divider);
          } else {
            const menuItem = document.createElement("div");
            menuItem.className = "sp-vault-chat-context-menu-item";
            menuItem.style.cssText = `
              padding: 10px 14px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 10px;
              color: ${item.danger ? theme.textDanger : theme.textColor};
              font-size: 13.5px;
              font-weight: 500;
              transition: background 0.15s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
            `;

            const iconColor = item.danger ? theme.textDanger : theme.textColor;

            // Check if this is "Move to project" - use teal color for icon and show chevron/spinner
            const hasSubmenu = item.action === "move-project";
            const displayIconColor = hasSubmenu ? "#14b8a6" : iconColor;

            // Check if projects are currently loading
            const cache = window.__spProjectsCache || { items: null, ts: 0 };
            const isLoading = getProjectsLoadingPromise() !== null;
            const isCached = cache.items && Date.now() - cache.ts < 60_000;

            menuItem.innerHTML = `
              <span style="display: flex; align-items: center; opacity: ${
                hasSubmenu ? "1" : "0.9"
              };">${getLucideIcon(item.icon, 16, displayIconColor)}</span>
              <span style="flex: 1;">${item.label}</span>
              ${
                item.pro
                  ? `<span style="
                    background: linear-gradient(135deg, var(--color-accent, #14b8a6) 0%, var(--color-accent-hover, #0d9488) 100%);
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    box-shadow: 0 1px 3px var(--color-accent-shadow, rgba(20, 184, 166, 0.3));
                  ">Pro</span>`
                  : ""
              }
              ${
                hasSubmenu
                  ? `<span class="sp-project-loading-indicator" style="display: flex; align-items: center; margin-left: auto; padding-left: 8px;">
                      ${
                        isLoading && !isCached
                          ? `<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(20, 184, 166, 0.3); border-top-color: #14b8a6; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>`
                          : `<span style="display: flex; align-items: center; opacity: 0.8;">${getLucideIcon(
                              "ChevronRight",
                              16,
                              "#14b8a6",
                            )}</span>`
                      }
                    </span>`
                  : ""
              }
            `;

            // Submenu state
            let submenu = null;
            let submenuTimeout = null;

            // Hover effect - clean and full width
            menuItem.addEventListener("mouseenter", async () => {
              if (item.danger) {
                menuItem.style.background = theme.hoverBgDanger;
              } else {
                menuItem.style.background = theme.hoverBg;
              }

              // Show submenu for "Move to project" - INSTANT with skeleton loading
              if (item.action === "move-project") {
                // Clear any pending hide timeout
                if (submenuTimeout) {
                  clearTimeout(submenuTimeout);
                  submenuTimeout = null;
                }

                // Show submenu IMMEDIATELY with skeleton loaders
                if (!submenu) {
                  // Remove any existing submenu
                  document
                    .querySelectorAll(".sp-project-submenu")
                    .forEach((s) => s.remove());

                  // Create submenu with skeleton loaders IMMEDIATELY
                  submenu = createSkeletonSubmenu(menuItem, theme);
                  document.body.appendChild(submenu);

                  // Position submenu to the right of menu item with smart vertical positioning
                  const itemRect = menuItem.getBoundingClientRect();
                  const submenuRect = submenu.getBoundingClientRect();
                  const viewportHeight = window.innerHeight;

                  // Check if submenu fits below the menu item
                  const spaceBelow = viewportHeight - itemRect.top;
                  const submenuHeight = submenuRect.height || 420; // Use max-height as fallback

                  submenu.style.left = `${itemRect.right + 4}px`;

                  if (spaceBelow < submenuHeight + 20) {
                    // Not enough space below - position from bottom
                    const bottomPos = Math.max(
                      10,
                      viewportHeight - submenuHeight - 10,
                    );
                    submenu.style.top = `${bottomPos}px`;
                    devLog(
                      `📍 [VAULT] Submenu positioned from bottom (not enough space below)`,
                    );
                  } else {
                    // Enough space below - position normally
                    submenu.style.top = `${itemRect.top}px`;
                  }

                  // Fade in
                  requestAnimationFrame(() => {
                    submenu.style.opacity = "1";
                    submenu.style.transform = "scale(1) translateY(0)";
                  });

                  // Load actual projects in the background
                  createProjectSubmenu(chatId, chatTitle, menuItem, theme)
                    .then((actualSubmenu) => {
                      devLog(
                        "🔄 [VAULT] createProjectSubmenu resolved, actualSubmenu:",
                        actualSubmenu ? "exists" : "null",
                        "submenu:",
                        submenu ? "exists" : "null",
                      );

                      // Update loading indicator to chevron (projects are now loaded)
                      const loadingIndicator = menuItem.querySelector(
                        ".sp-project-loading-indicator",
                      );
                      if (loadingIndicator) {
                        loadingIndicator.innerHTML = `<span style="display: flex; align-items: center; opacity: 0.8;">${getLucideIcon(
                          "ChevronRight",
                          16,
                          "#14b8a6",
                        )}</span>`;
                      }

                      // Check if skeleton submenu still exists in DOM
                      const skeletonStillExists =
                        submenu && document.body.contains(submenu);

                      if (actualSubmenu && skeletonStillExists) {
                        devLog(
                          "🔄 [VAULT] Replacing skeleton with actual submenu",
                        );
                        // Replace skeleton with actual content with smart positioning
                        const itemRect = menuItem.getBoundingClientRect();
                        const submenuRect =
                          actualSubmenu.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;

                        // Check if submenu fits below the menu item
                        const spaceBelow = viewportHeight - itemRect.top;
                        const submenuHeight = submenuRect.height || 420;

                        actualSubmenu.style.left = `${itemRect.right + 4}px`;

                        if (spaceBelow < submenuHeight + 20) {
                          // Not enough space below - position from bottom
                          const bottomPos = Math.max(
                            10,
                            viewportHeight - submenuHeight - 10,
                          );
                          actualSubmenu.style.top = `${bottomPos}px`;
                        } else {
                          // Enough space below - position normally
                          actualSubmenu.style.top = `${itemRect.top}px`;
                        }

                        // Set initial state for animation
                        actualSubmenu.style.opacity = "0";
                        actualSubmenu.style.transform =
                          "scale(0.95) translateY(-4px)";

                        // Add to DOM
                        document.body.appendChild(actualSubmenu);

                        // Animate in
                        requestAnimationFrame(() => {
                          actualSubmenu.style.opacity = "1";
                          actualSubmenu.style.transform =
                            "scale(1) translateY(0)";
                        });

                        // Remove skeleton
                        submenu.remove();
                        submenu = actualSubmenu;
                        devLog(
                          "✅ [VAULT] Skeleton replaced with actual submenu",
                        );
                      } else {
                        devWarn(
                          "⚠️ [VAULT] Cannot replace skeleton - actualSubmenu:",
                          actualSubmenu ? "exists" : "null",
                          "skeletonStillExists:",
                          skeletonStillExists,
                        );
                      }
                    })
                    .catch((error) => {
                      devError("Failed to load projects:", error);
                      if (submenu) {
                        submenu.innerHTML = `
                          <div style="padding: 20px; text-align: center; color: ${
                            theme.textSecondary
                          };">
                            <div style="margin-bottom: 8px;">${getLucideIcon(
                              "AlertCircle",
                              24,
                              theme.textSecondary,
                            )}</div>
                            <div style="font-size: 13px;">Failed to load projects</div>
                          </div>
                        `;
                      }
                    });
                }
              }
            });

            menuItem.addEventListener("mouseleave", (e) => {
              menuItem.style.background = "transparent";

              // Keep submenu open when moving to it
              if (item.action === "move-project" && submenu) {
                // Small delay to allow mouse to move to submenu
                submenuTimeout = setTimeout(() => {
                  if (submenu && !submenu.matches(":hover")) {
                    submenu.style.opacity = "0";
                    submenu.style.transform = "scale(0.95) translateY(-4px)";
                    setTimeout(() => {
                      if (submenu) submenu.remove();
                      submenu = null;
                    }, 150);
                  }
                }, 100);
              }
            });

            // Click handler (don't trigger for items with submenu)
            if (!hasSubmenu) {
              menuItem.addEventListener("click", async () => {
                menu.remove();
                btn.removeAttribute("data-menu-open");

                // Handle different actions
                switch (item.action) {
                  case "favorite":
                    await handleToggleFavorite(chatId, chatTitle);
                    break;
                  case "archive":
                    await handleArchiveChat(chatId, chatTitle);
                    break;
                  case "uncategorize":
                    await handleUncategorizeChat(chatId, chatTitle);
                    break;
                  case "open-tab":
                    handleOpenInNewTab(chatId);
                    break;
                  case "preview":
                    handlePreviewChat(chatId);
                    break;
                  case "rename":
                    await handleRenameChat(chatId, chatTitle);
                    break;
                  case "move":
                    await handleMoveToCategory(chatId, chatTitle);
                    break;
                  case "copy":
                    await handleCopyLink(chatId);
                    break;
                  case "share":
                    await handleShareChat(chatId, chatTitle);
                    break;
                  case "print":
                    handlePrintChat(chatId);
                    break;
                  case "export":
                    await handleExportChat(chatId, chatTitle);
                    break;
                  case "reference":
                    await handleReferenceChat(chatId, chatTitle);
                    break;
                  case "unlink":
                    await handleUnlinkFromWorkspace(chatId, chatTitle);
                    break;
                  case "delete":
                    await handleDeleteChat(chatId, chatTitle);
                    break;
                  default:
                    devWarn(`Unknown action: ${item.action}`);
                }
              });
            }

            menu.appendChild(menuItem);
          }
        });

        // Preload projects in background immediately (for instant Move to project submenu)
        devLog("🚀 [VAULT] Preloading projects for instant submenu...");
        preloadProjectsForSubmenu().catch((err) => {
          devWarn("⚠️ [VAULT] Failed to preload projects:", err);
        });

        // Preload projects in background immediately (for instant Move to project submenu)
        devLog("🚀 [VAULT] Preloading projects for instant submenu...");
        preloadProjectsForSubmenu().catch((err) => {
          devWarn("⚠️ [VAULT] Failed to preload projects:", err);
        });

        // Position menu relative to the entire chat row
        if (!chatItem) {
          devError("? [VAULT] Chat item not found for menu");
          return;
        }

        // Add menu to document.body to avoid z-index stacking issues
        document.body.appendChild(menu);

        // Calculate fixed position relative to viewport
        const btnRect = btn.getBoundingClientRect();
        const chatItemRect = chatItem.getBoundingClientRect();

        const menuWidth = 200; // min-width from CSS

        // Position menu far to the right using fixed positioning
        // Place it to the right of the chat item, extending beyond if needed
        const leftOffset = chatItemRect.right - 40; // Only 40px of menu visible from right edge of chat item

        // Always position far right, using fixed positioning
        menu.style.left = `${leftOffset}px`;
        menu.style.right = "auto";

        // Use collision detection to position menu vertically (above or below)
        // Note: Pass button and chatItem, menu is now fixed positioned
        positionFixedContextMenu(menu, btn, {
          gap: 4,
          minBottomMargin: 20,
          preferredPosition: "below",
        });

        // Set z-index on the chat item so it appears highlighted
        chatItem.style.position = "relative";
        chatItem.style.zIndex = "10000"; // Very high to ensure it's above everything

        // Note: fade-in animation is now handled by positionContextMenu()

        // Mark menu as open
        btn.setAttribute("data-menu-open", "true");

        // Close menu when clicking outside - Use capture phase to catch event BEFORE it bubbles
        const closeMenu = (e) => {
          // Ignore if clicking on the menu itself or the button that opened it
          if (menu.contains(e.target) || btn.contains(e.target)) {
            return;
          }

          // INSTANT: Disable pointer events immediately so menu doesn't block clicks
          menu.style.pointerEvents = "none";

          // Fade out animation (visual only, menu is already "gone" for interactions)
          menu.style.opacity = "0";
          menu.style.transform = "scale(0.95) translateY(-4px)";

          // Remove from DOM after animation completes
          setTimeout(() => {
            menu.remove();
          }, 150);

          btn.removeAttribute("data-menu-open");
          document.removeEventListener("click", closeMenu, true); // Remove from capture phase

          // Reset z-index
          if (chatItem) {
            chatItem.style.zIndex = "";
            chatItem.style.position = "";
          }

          // Restore message icon if not hovering
          const messageIcon = chatItem?.querySelector(
            ".sp-vault-chat-message-icon",
          );
          if (messageIcon && !chatItem?.matches(":hover")) {
            messageIcon.style.opacity = "0.7";
          }

          // Hide menu button if not hovering
          if (!chatItem?.matches(":hover")) {
            btn.style.opacity = "0";
            btn.style.pointerEvents = "none";
          }
        };

        // Add listener in CAPTURE phase - fires before bubble phase, instant!
        document.addEventListener("click", closeMenu, true);
      });
    });
  }

  // ============================================================================
  // UI: Render special categories (Favorites and Archived)
  // ============================================================================

  function renderSpecialCategories(
    favoritedChats,
    archivedChats,
    textColor,
    secondaryText,
    bgSecondary,
    bgTertiary,
  ) {
    let html = "";

    // Favorites category (only show if there are favorited chats)
    if (favoritedChats && favoritedChats.length > 0) {
      const categoryId = "sp-special-favorites";
      const isCollapsed = isCategoryCollapsed(categoryId);

      // Golden/yellow gradient for favorites
      const baseGradient = "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
      const hoverGradient = "linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)";

      html += `
        <div class="sp-vault-category" data-category-id="${categoryId}" style="margin-bottom: 4px; overflow: visible; position: relative;">
          <div 
            class="sp-vault-category-header sp-vault-special-category" 
            data-category-id="${categoryId}"
            data-base-gradient="${baseGradient}"
            data-hover-gradient="${hoverGradient}"
            style="
              display: flex;
              align-items: center;
              padding: 8px 10px;
              background: ${baseGradient};
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
              position: relative;
            "
          >
            <svg class="sp-vault-category-chevron" data-category-id="${categoryId}" style="width: 14px; height: 14px; fill: #000; margin-right: 8px; transition: transform 0.2s ease; flex-shrink: 0; ${
              isCollapsed ? "" : "transform: rotate(90deg);"
            }" viewBox="0 0 24 24">
              <path d="M9.293 18.707a1 1 0 010-1.414L14.586 12 9.293 6.707a1 1 0 011.414-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0z"/>
            </svg>
            <svg style="width: 16px; height: 16px; margin-right: 10px; fill: #000; flex-shrink: 0;" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style="flex: 1; font-size: 13px; font-weight: 600; color: #000;">Favorites</span>
            <!-- Category count and context menu container -->
            <div class="sp-vault-category-actions" style="position: relative; width: 50px; height: 20px; display: flex; align-items: center; justify-content: flex-end;">
              <span class="sp-vault-category-count" style="position: absolute; right: 0; font-size: 11px; color: rgba(0,0,0,0.7); padding: 2px 8px; background: rgba(0,0,0,0.1); border-radius: 10px; transition: opacity 0.2s ease; pointer-events: auto;">${
                favoritedChats.length
              }</span>
              <button class="sp-vault-category-menu-btn" data-category-id="${categoryId}" 
                      style="position: absolute; right: 0; opacity: 0; background: rgba(0,0,0,0.2); border: none; border-radius: 4px; padding: 2px 6px; cursor: pointer; transition: all 0.2s ease; pointer-events: none; display: flex; align-items: center; justify-content: center;"
                      title="Category options">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="sp-vault-category-chats" data-category-id="${categoryId}" style="padding-left: 12px; display: ${
            isCollapsed ? "none" : "block"
          }; overflow: visible !important;">
            ${renderChats(
              favoritedChats,
              textColor,
              secondaryText,
              bgSecondary,
              0,
              categoryId,
            )}
          </div>
        </div>
      `;
    }

    // Archived category (only show if there are archived chats)
    if (archivedChats && archivedChats.length > 0) {
      const categoryId = "sp-special-archived";
      const isCollapsed = isCategoryCollapsed(categoryId);

      // Dark blue/purple gradient for archived
      const baseGradient = "linear-gradient(135deg, #4338ca 0%, #3730a3 100%)";
      const hoverGradient = "linear-gradient(135deg, #5b21b6 0%, #4338ca 100%)";

      html += `
        <div class="sp-vault-category" data-category-id="${categoryId}" style="margin-bottom: 4px; overflow: visible; position: relative;">
          <div 
            class="sp-vault-category-header sp-vault-special-category" 
            data-category-id="${categoryId}"
            data-base-gradient="${baseGradient}"
            data-hover-gradient="${hoverGradient}"
            style="
              display: flex;
              align-items: center;
              padding: 8px 10px;
              background: ${baseGradient};
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
            "
          >
            <svg class="sp-vault-category-chevron" data-category-id="${categoryId}" style="width: 14px; height: 14px; fill: #fff; margin-right: 8px; transition: transform 0.2s ease; flex-shrink: 0; ${
              isCollapsed ? "" : "transform: rotate(90deg);"
            }" viewBox="0 0 24 24">
              <path d="M9.293 18.707a1 1 0 010-1.414L14.586 12 9.293 6.707a1 1 0 011.414-1.414l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0z"/>
            </svg>
            <svg style="width: 16px; height: 16px; margin-right: 10px; fill: #fff; flex-shrink: 0;" viewBox="0 0 24 24">
              <path d="M21 8v13H3V8h18m0-2H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-11 4H4v2h6v-2zm7-2H4v2h13V8z"/>
            </svg>
            <span style="flex: 1; font-size: 13px; font-weight: 600; color: #fff;">Archived</span>
            <!-- Category count and context menu container -->
            <div class="sp-vault-category-actions" style="position: relative; width: 50px; height: 20px; display: flex; align-items: center; justify-content: flex-end;">
              <span class="sp-vault-category-count" style="position: absolute; right: 0; font-size: 11px; color: rgba(255,255,255,0.7); padding: 2px 8px; background: rgba(255,255,255,0.1); border-radius: 10px; transition: opacity 0.2s ease; pointer-events: auto;">${
                archivedChats.length
              }</span>
              <button class="sp-vault-category-menu-btn" data-category-id="${categoryId}" 
                      style="position: absolute; right: 0; opacity: 0; background: rgba(255,255,255,0.2); border: none; border-radius: 4px; padding: 2px 6px; cursor: pointer; transition: all 0.2s ease; pointer-events: none; display: flex; align-items: center; justify-content: center;"
                      title="Category options">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="sp-vault-category-chats" data-category-id="${categoryId}" style="padding-left: 12px; display: ${
            isCollapsed ? "none" : "block"
          }; overflow: visible !important;">
            ${renderChats(
              archivedChats,
              textColor,
              secondaryText,
              bgSecondary,
              0,
              categoryId,
            )}
          </div>
        </div>
      `;
    }

    // Add horizontal divider if there are special categories
    if (
      (favoritedChats && favoritedChats.length > 0) ||
      (archivedChats && archivedChats.length > 0)
    ) {
      html += `
        <hr style="
          margin: 12px 0;
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        ">
      `;
    }

    return html;
  }

  // ============================================================================
  // UI: Render categories and chats
  // ============================================================================

  function renderCategories(
    categories,
    chats,
    textColor,
    secondaryText,
    bgSecondary,
    bgTertiary,
    isSearchActive = false,
  ) {
    if (!categories || categories.length === 0) {
      return `<p style="color: ${secondaryText}; font-size: 13px; text-align: center; padding: 16px 0;">No categories yet</p>`;
    }

    // Build hierarchical structure: categories are already hierarchical with children arrays
    // We only need to render the root level categories (the children will be rendered recursively)
    const rootCategories = categories;

    const uncategorizedChats = chats.filter(
      (chat) => !chat.categoryId || chat.categoryId === "uncategorized",
    );
    if (uncategorizedChats.length > 0) {
    } else {
    }

    // Don't add another wrapper - parent .sp-vault-content already has flex+gap:8px
    return rootCategories
      .map((cat) => {
        // Add divider before "uncategorized" category
        const divider =
          cat.id === "uncategorized"
            ? `<div style="height: 1px; background: linear-gradient(to right, transparent, ${secondaryText}40, transparent); margin: 12px 0;"></div>`
            : "";

        return (
          divider +
          renderCategory(
            cat,
            categories,
            chats,
            textColor,
            secondaryText,
            bgSecondary,
            bgTertiary,
            0,
            isSearchActive,
          )
        ).trim();
      })
      .join("");
  }

  function renderEmptyState(
    textColor,
    secondaryText,
    bgSecondary,
    borderLight,
  ) {
    return `
      <div class="sp-vault-empty-state" style="
        margin-top: 12px;
        padding: 18px 20px;
        border-radius: 12px;
        border: 1px dashed ${borderLight};
        background: ${bgSecondary};
        text-align: center;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        word-wrap: break-word;
        overflow-wrap: break-word;
      ">
        <div style="
          font-size: 13px; 
          font-weight: 600; 
          color: ${textColor}; 
          margin-bottom: 6px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        ">
          ${getTranslation("noChatsTitle")}
        </div>
        <p style="
          margin: 0 0 12px 0; 
          font-size: 12px; 
          line-height: 1.5; 
          color: ${secondaryText};
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        ">
          ${getTranslation("noChatsDescription")}
        </p>
        <button class="sp-vault-empty-cta" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid ${borderLight};
          background: ${bgSecondary};
          color: ${textColor};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          max-width: 100%;
          white-space: nowrap;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span style="overflow: hidden; text-overflow: ellipsis;">${getTranslation(
            "openWorkspacesCta",
          )}</span>
        </button>
      </div>
    `;
  }

  function renderCategory(
    category,
    allCategories,
    allChats,
    textColor,
    secondaryText,
    bgSecondary,
    bgTertiary,
    level,
    isSearchActive = false,
  ) {
    // Filter chats for this category (already sorted by content script)
    const categoryChats = allChats.filter((c) => c.categoryId === category.id);
    // Use the children array directly instead of filtering by parentId
    const childCategories = category.children || [];

    // During search, auto-expand categories with matches, otherwise use saved state
    const isCollapsed = isSearchActive
      ? false
      : isCategoryCollapsed(category.id);

    // Debug: Log child categories
    if (level === 0) {
    }

    // Calculate indent based on nesting level (20px per level for better visibility)
    const indent = level * 20;
    const paddingLeft = indent + 10; // Add base padding

    // Get custom colors from category (with fallback to defaults)
    const categoryColor = category.color || bgSecondary;
    const categoryBorderColor = category.borderColor || categoryColor;
    const categoryTextColor = category.textcolor || textColor;

    // Create premium gradient background
    const gradientBg = `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}dd 100%)`;
    const hoverGradientBg = `linear-gradient(135deg, ${categoryColor}ee 0%, ${categoryColor}cc 100%)`;

    return `
      <div class="sp-vault-category" style="overflow: visible; position: relative; margin-bottom: 0px;">
        <div class="sp-vault-category-header" data-category-id="${category.id}" 
             data-base-gradient="${gradientBg}"
             data-hover-gradient="${hoverGradientBg}"
             style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; 
                    padding-left: ${paddingLeft}px;
                    background: ${gradientBg}; 
                    border: 1px solid ${categoryBorderColor}; 
                    border-radius: 8px; cursor: pointer; 
                    transition: all 0.15s ease; position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1);">
          <!-- Chevron icon for collapse/expand -->
          <svg class="sp-vault-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${categoryTextColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
               style="flex-shrink: 0; transition: transform 0.2s ease; transform: rotate(${
                 isCollapsed ? "0deg" : "90deg"
               }); opacity: 0.9;">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <!-- Category icon (custom image or folder icon) -->
          ${
            category.icon && category.icon.startsWith("data:image")
              ? `<img src="${category.icon}" alt="icon" style="width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; object-fit: cover; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));" />`
              : `<svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; opacity: ${
                  level > 0 ? "0.85" : "0.95"
                }; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
                ${
                  level > 0
                    ? '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>'
                    : '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'
                }
              </svg>`
          }
          <span class="sp-vault-category-name" style="flex: 1; font-size: ${
            level > 0 ? "12px" : "13px"
          }; font-weight: ${
            level > 0 ? "500" : "600"
          }; color: ${categoryTextColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${
            category.name
          }</span>
          <!-- Category count and context menu container -->
          <div class="sp-vault-category-actions" style="position: relative; width: 50px; height: 20px; display: flex; align-items: center; justify-content: flex-end;">
            <span class="sp-vault-category-count" style="position: absolute; right: 0; font-size: 10px; color: ${categoryTextColor}; background: rgba(0,0,0,0.2); padding: 2px 7px; border-radius: 10px; font-weight: 600; opacity: ${
              level > 0 ? "0.9" : "1"
            }; transition: opacity 0.2s ease; pointer-events: auto;">${
              categoryChats.length
            }</span>
            <button class="sp-vault-category-menu-btn" data-category-id="${
              category.id
            }" 
                    style="position: absolute; right: 0; opacity: 0; background: rgba(0,0,0,0.3); border: none; border-radius: 4px; padding: 2px 6px; cursor: pointer; transition: all 0.2s ease; pointer-events: none; display: flex; align-items: center; justify-content: center;"
                    title="Category options">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${categoryTextColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="sp-vault-category-content" data-category-id="${
          category.id
        }" 
             style="display: ${isCollapsed ? "none" : "block"}; ${
               categoryChats.length > 0 || childCategories.length > 0
                 ? "margin-top: 4px;"
                 : ""
             } transition: all 0.2s ease; overflow: visible !important;">
          <!-- Chats in this category FIRST (before subcategories) -->
          ${
            categoryChats.length > 0
              ? `<div class="sp-vault-category-chats" data-category-id="${
                  category.id
                }" 
                    style="padding-left: ${
                      level === 0 ? "12px" : "28px"
                    }; display: flex; flex-direction: column; gap: 2px; overflow: visible !important;">
                ${renderChats(
                  categoryChats,
                  textColor,
                  secondaryText,
                  bgSecondary,
                  level,
                  category.id,
                )}
               </div>`
              : ""
          }
          <!-- Child categories (nested folders) rendered AFTER parent's chats -->
          ${
            childCategories.length > 0
              ? `<div class="sp-vault-subcategories" style="${
                  categoryChats.length > 0 ? "margin-top: 4px;" : ""
                } margin-left: 16px; margin-bottom: 0px; display: flex; flex-direction: column; gap: 0px; overflow: visible;">${childCategories
                  .map((child) =>
                    renderCategory(
                      child,
                      allCategories,
                      allChats,
                      textColor,
                      secondaryText,
                      bgSecondary,
                      bgTertiary,
                      level + 1,
                      isSearchActive,
                    ).trim(),
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderChats(
    chats,
    textColor,
    secondaryText,
    bgSecondary,
    level = 0,
    categoryId = null,
  ) {
    if (!chats || chats.length === 0) {
      return `<p style="font-size: 11px; color: ${secondaryText}; padding: 8px 12px; font-style: italic; opacity: 0.6;">No chats</p>`;
    }

    // Lazy loading: only render a subset of chats for large categories
    const shouldLazyLoad = categoryId && chats.length > LAZY_LOAD_BATCH_SIZE;
    let chatsToRender = chats;
    let remainingCount = 0;

    if (shouldLazyLoad) {
      const state = getLazyLoadState(categoryId);
      const loadedCount = state.loadedCount || LAZY_LOAD_BATCH_SIZE;

      // Update state if needed
      if (state.totalCount !== chats.length) {
        setLazyLoadState(categoryId, loadedCount, chats.length);
      }

      chatsToRender = chats.slice(0, loadedCount);
      remainingCount = chats.length - loadedCount;
    }

    const chatHtml = chatsToRender
      .map((chat) => {
        // Check if this chat belongs to a project or GPT
        const gizmoId = chat.gizmo_id;
        const projectId = chat.project_id;
        const isProjectChat = !!(
          (gizmoId && gizmoId.startsWith("g-p-")) ||
          (projectId && projectId.startsWith("g-p-"))
        );
        const isGpt = !!gizmoId && !isProjectChat;
        const hasProject = !!(projectId || gizmoId);
        const projectOrGptName = isGpt
          ? chat.gizmo_name || "GPT"
          : chat.project_name || "Project";

        // Get translations for tooltips
        const tooltipNote = getTranslation("openNote");
        const tooltipProject = isGpt
          ? `${getTranslation("openGpt")}: ${projectOrGptName}`
          : `${getTranslation("openProject")}: ${projectOrGptName}`;

        const avatarSrc =
          chat.gizmo_profile_picture || chat.project_profile_picture;
        const isEstuaryAvatar =
          typeof avatarSrc === "string" &&
          /\/backend-api\/estuary\/content/i.test(avatarSrc);

        // Check if this chat is currently selected (for bulk actions)
        const isSelected = selectedChatIds.has(chat.id);
        const showCheckbox = bulkSelectionMode || isSelected;

        return `
      <div class="sp-vault-chat ${isSelected ? "sp-vault-chat-selected" : ""}" data-chat-id="${chat.id}" 
           data-category-id="${categoryId || ""}"
           data-has-note="checking"
           style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; 
                  border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
                  background: ${isSelected ? "rgba(var(--sp-accent-rgb, 20, 184, 166), 0.15)" : "transparent"}; position: relative; overflow: visible;">
        <!-- Checkbox for bulk selection (hidden by default, shown on hover or in bulk mode) -->
        <div class="sp-vault-chat-checkbox-wrapper" data-chat-id="${chat.id}" style="width: ${showCheckbox ? "20px" : "0px"}; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; overflow: hidden; transition: width 0.15s ease, opacity 0.15s ease; opacity: ${showCheckbox ? "1" : "0"};">
          <input type="checkbox" class="sp-vault-chat-checkbox" data-chat-id="${chat.id}" ${isSelected ? "checked" : ""} style="display: none;">
          <span class="sp-vault-chat-checkbox-visual" style="width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; background: ${isSelected ? "var(--color-accent, #14b8a6)" : "transparent"}; border: 2px solid ${isSelected ? "var(--color-accent, #14b8a6)" : "rgba(255, 255, 255, 0.3)"}; box-shadow: ${isSelected ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.05)"};">
            ${isSelected ? '<svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}
          </span>
        </div>
        <!-- Left icon container: message icon OR 3-dot menu -->
        <div class="sp-vault-chat-left-icon" style="position: relative; width: 26px; height: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <!-- Message icon (visible by default) -->
          <svg class="sp-vault-chat-message-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${secondaryText}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; opacity: 0.7; transition: opacity 0.15s ease; pointer-events: none;">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <!-- Chat menu button (3 dots) - hidden by default, shown on row hover when not in bulk mode -->
          <button class="sp-vault-chat-menu-btn" data-chat-id="${chat.id}" 
                  style="position: absolute; opacity: 0; background: rgba(255,255,255,0.1); border: none; border-radius: 4px; padding: 2px 6px; cursor: pointer; transition: all 0.2s ease; pointer-events: none; display: ${bulkSelectionMode ? "none" : "flex"}; align-items: center; justify-content: center; z-index: 10;"
                  title="Chat options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
        <span class="sp-vault-chat-title" 
              title="${chat.title || "Untitled"}"
              style="flex: 1; font-size: 12.5px; color: ${textColor}; 
                     overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                     line-height: 1.4;">${highlightSearchTerm(
                       chat.title || "Untitled",
                       currentSearchTerm,
                     )}</span>
        <!-- Chat actions container (badges only - NO menu button here anymore) -->
        <div class="sp-vault-chat-actions" style="position: relative; display: flex; align-items: center; gap: 4px; min-width: 30px;">
          <!-- Note icon placeholder (will be shown if chat has notes) -->
          <div class="sp-vault-note-badge-wrapper" title="${tooltipNote}" style="display: none; align-items: center; justify-content: center;">
            <svg class="sp-vault-chat-note-badge" 
                 width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                 style="flex-shrink: 0; cursor: pointer; transition: all 0.15s ease;">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          ${
            chat.is_starred || chat.favorite
              ? `
          <!-- Favorite badge icon (shown when chat is favorited) -->
          <div class="sp-vault-favorite-badge-wrapper" title="Favorited" style="display: flex; align-items: center; justify-content: center;">
            <svg class="sp-vault-chat-favorite-badge" 
                 width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                 style="flex-shrink: 0; opacity: 0.9; transition: all 0.15s ease;">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          `
              : ""
          }
          ${
            hasProject
              ? `
          <!-- Project/GPT badge (avatar or icon) -->
          <div class="sp-vault-project-badge-wrapper" title="${tooltipProject}" style="display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; min-width: 18px;">
            ${
              avatarSrc
                ? `
              <img class="sp-vault-chat-avatar" 
                 data-project-id="${chat.project_id || ""}" 
                 data-gizmo-id="${chat.gizmo_id || ""}"
                src="${isEstuaryAvatar ? "" : avatarSrc}" 
                data-src="${isEstuaryAvatar ? avatarSrc : ""}"
                 alt="${chat.gizmo_name || chat.project_name || "Avatar"}"
                 style="width: 14px; height: 14px; max-width: 14px; max-height: 14px; border-radius: 3px; object-fit: cover; flex-shrink: 0; cursor: pointer; transition: all 0.15s ease; opacity: 0.9; display: ${
                   isEstuaryAvatar ? "none" : "block"
                 };">
            <svg class="sp-vault-chat-project-badge" 
                 data-project-id="${chat.project_id || ""}" 
                 data-gizmo-id="${chat.gizmo_id || ""}"
                 width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                style="flex-shrink: 0; opacity: 0.8; cursor: pointer; transition: all 0.15s ease; display: ${
                  isEstuaryAvatar ? "block" : "none"
                }; position: absolute;">
              ${
                isGpt
                  ? '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>'
                  : '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
              }
            </svg>
            `
                : `
            <svg class="sp-vault-chat-project-badge" 
                 data-project-id="${chat.project_id || ""}" 
                 data-gizmo-id="${chat.gizmo_id || ""}"
                 width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                 style="flex-shrink: 0; opacity: 0.8; cursor: pointer; transition: all 0.15s ease; display: block;">
              ${
                isGpt
                  ? '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>'
                  : '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
              }
            </svg>
            `
            }
          </div>
          `
              : ""
          }
          ${
            // Use pre-computed hasAttachments flag from content script (performance optimization)
            chat.hasAttachments
              ? `
          <!-- Attachment badge icon (shown when chat has attachments) -->
          <div class="sp-vault-attachment-badge-wrapper" title="Has attachments" style="display: flex; align-items: center; justify-content: center;">
            <svg class="sp-vault-chat-attachment-badge" 
                 width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                 style="flex-shrink: 0; opacity: 0.6; transition: all 0.15s ease;">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
      })
      .join("");

    // Add "Load More" button if there are remaining chats
    const loadMoreButton =
      remainingCount > 0
        ? `
      <button class="sp-vault-load-more-btn" 
              data-category-id="${categoryId}"
              data-bg-secondary="${bgSecondary}"
              style="
                display: block;
                width: calc(100% - 16px);
                margin: 8px 8px;
                padding: 8px 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                background: ${bgSecondary};
                color: ${textColor};
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              >
        ${getTranslation("loadMore")} (${remainingCount} ${getTranslation(
          "remaining",
        )})
      </button>
    `
        : "";

    return chatHtml + loadMoreButton;
  }

  // ============================================================================
  // API: Show sidebar
  // ============================================================================

  function show() {
    // Check if container exists AND is still in the document
    const isContainerInDOM =
      sidebarContainer && document.body.contains(sidebarContainer);

    // CRITICAL: Also check if sidebar is still a sibling of #history
    // After React hydration, #history might be replaced and our sidebar orphaned
    const historyDiv = document.getElementById("history");
    const isSiblingOfHistory =
      isContainerInDOM &&
      historyDiv &&
      sidebarContainer.parentNode === historyDiv.parentNode &&
      sidebarContainer.nextSibling === historyDiv;

    if (!isContainerInDOM || !isSiblingOfHistory) {
      // Container doesn't exist, was removed, or is no longer a sibling of #history
      // This happens after React hydration - recreate fresh
      devLog("🔄 [VAULT] Sidebar orphaned or missing, recreating...");
      sidebarContainer = null;
      waitForChatListContainer(createSidebar);
      return; // Exit early, createSidebar will call show() again via init
    }

    // Container exists and is correctly positioned - just show it
    sidebarContainer.style.display = "block";

    // Start navigation watcher when sidebar becomes visible
    startNavigationWatcher();

    if (historyDiv) {
      hideHistoryAndSiblings(historyDiv);
    }

    // ALWAYS create the Tools & GPTs collapsible group (even when toggling back)
    // This ensures the group is recreated after hide() removed it
    let retryCount = 0;
    const maxRetries = 5;
    const tryCreateToolsGroup = () => {
      // Try multiple selectors - CSS.escape handles special characters
      let expandoSections = document.querySelectorAll(
        '[class*="sidebar-expando-section"]',
      );

      if (expandoSections.length === 0) {
        // Try with CSS.escape for the slash
        const escapedClass = "group\\/sidebar-expando-section";
        expandoSections = document.querySelectorAll("." + escapedClass);
      }

      if (expandoSections.length === 0) {
        // Last resort: find by inspecting class list directly
        expandoSections = Array.from(document.querySelectorAll("div")).filter(
          (el) =>
            el.classList &&
            (el.classList.contains("group/sidebar-expando-section") ||
              Array.from(el.classList).some((cls) =>
                cls.includes("sidebar-expando-section"),
              )),
        );
      }

      if (expandoSections.length >= 1 || retryCount >= maxRetries) {
        createToolsGroup();
      } else {
        retryCount++;
        setTimeout(tryCreateToolsGroup, 500);
      }
    };

    setTimeout(tryCreateToolsGroup, 300);
  }

  // ============================================================================
  // API: Hide sidebar
  // ============================================================================

  function hide() {
    // Stop navigation watcher when sidebar is hidden
    stopNavigationWatcher();

    if (sidebarContainer) {
      sidebarContainer.style.display = "none";
    }

    // Remove the Tools & GPTs group
    removeToolsGroup();

    // Restore #history and siblings
    restoreHistoryAndSiblings();
  }

  // ============================================================================
  // API: Destroy sidebar
  // ============================================================================

  function destroy() {
    // Stop navigation watcher when destroying sidebar
    stopNavigationWatcher();

    if (sidebarContainer) {
      sidebarContainer.remove();
      sidebarContainer = null;
    }

    // Remove the Tools & GPTs group
    removeToolsGroup();

    // Restore #history and siblings
    restoreHistoryAndSiblings();

    activeVaultData = null;
  }

  // ============================================================================
  // MESSAGE LISTENER: Handle data from content script
  // ============================================================================

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== "superprompt-content") return;

    const { type, payload } = event.data;

    if (type === "sp-vault-sidebar-data") {
      renderSidebar(payload);
    }
  });

  // ============================================================================
  // NOTE EVENT LISTENER: Update note badges when notes are created/updated
  // ============================================================================

  window.addEventListener("sp-note-updated", (event) => {
    const { conversationId, hasNote } = event.detail || {};
    devLog(
      `📝 [VAULT] Note ${
        hasNote ? "created/updated" : "deleted"
      } for chat ${conversationId}`,
    );

    // Update the note badges for all chats
    updateNotesBadges();
  });

  // ============================================================================
  // URL WATCHER: Re-show sidebar after internal navigation
  // ============================================================================

  // Navigation watcher state (only active when vault is enabled and visible)
  let urlObserver = null;
  let popstateHandler = null;
  let lastUrl = window.location.href;

  function handleNavigation(delayMs = 100) {
    const isVaultEnabled = localStorage.getItem("sp_alt_view_on") === "1";

    // Only process navigation if vault is enabled and sidebar is visible
    if (
      !isVaultEnabled ||
      !sidebarContainer ||
      sidebarContainer.style.display === "none"
    ) {
      return;
    }

    const currentPath = window.location.pathname;

    // Clear bulk selection and collapse all categories when navigating to homepage or starting a new chat
    if (
      currentPath === "/" ||
      currentPath === "" ||
      sessionStorage.getItem("sp-new-chat") === "true"
    ) {
      let needsRerender = false;

      // Clear bulk selection
      if (selectedChatIds && selectedChatIds.size > 0) {
        selectedChatIds.clear();
        bulkSelectionMode = false;
        needsRerender = true;
        devLog("🔄 [VAULT] Cleared bulk selection on navigation to homepage");
      }

      // Collapse all categories to reset visual state
      try {
        collapseAllCategories();
        needsRerender = true;
        devLog("🔄 [VAULT] Collapsed all categories on navigation to homepage");
      } catch (e) {
        devWarn("⚠️ [VAULT] Failed to collapse categories:", e);
      }

      // Clear active chat highlight (removes red highlight from previously active chat)
      if (typeof window.updateActiveChatHighlight === "function") {
        window.updateActiveChatHighlight();
        devLog(
          "🔄 [VAULT] Cleared active chat highlight on navigation to homepage",
        );
      }

      // Re-render to update UI
      if (
        needsRerender &&
        typeof window.renderVaultSidebarView === "function"
      ) {
        window.renderVaultSidebarView();
      }
    }

    // Check if we're on a chat or project/GPT page
    const isOnChatOrProject =
      currentPath.startsWith("/c/") || currentPath.startsWith("/g/");

    if (isOnChatOrProject) {
      // Small delay to let ChatGPT's router settle
      setTimeout(() => {
        // Check if sidebar container still exists in DOM
        const stillInDOM =
          sidebarContainer && document.body.contains(sidebarContainer);

        if (!stillInDOM) {
          sidebarContainer = null;
          waitForChatListContainer(createSidebar);
        } else {
          // Only show if sidebar was already visible (don't auto-show if user had it hidden)
          const wasVisible = sidebarContainer.style.display !== "none";
          if (wasVisible) {
            show();

            // Update active chat highlighting
            if (typeof window.updateActiveChatHighlight === "function") {
              window.updateActiveChatHighlight();
            }

            // Reset any stuck hover states after navigation
            if (typeof window.resetVaultChatHoverStates === "function") {
              window.resetVaultChatHoverStates();
            }
          }
        }
      }, delayMs);
    }
  }

  // Start watching for navigation (only when vault is enabled)
  function startNavigationWatcher() {
    if (urlObserver || popstateHandler) {
      // Already watching
      return;
    }

    // Watch for popstate events (back/forward navigation)
    popstateHandler = () => handleNavigation(100);
    window.addEventListener("popstate", popstateHandler);

    // Watch for URL changes via MutationObserver on the page title
    lastUrl = window.location.href;
    urlObserver = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        handleNavigation(500);
      }
    });

    // Observe the document title changes (reliable indicator of navigation)
    urlObserver.observe(document.querySelector("title") || document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    devLog("🔍 [VAULT] Navigation watcher started");
  }

  // Stop watching for navigation
  function stopNavigationWatcher() {
    if (popstateHandler) {
      window.removeEventListener("popstate", popstateHandler);
      popstateHandler = null;
    }

    if (urlObserver) {
      urlObserver.disconnect();
      urlObserver = null;
    }

    devLog("🛑 [VAULT] Navigation watcher stopped");
  }

  // ============================================================================
  // TOGGLE STATE: Read from localStorage
  // ============================================================================

  function getAltViewState() {
    return localStorage.getItem("sp_alt_view_on") === "1";
  }

  // ============================================================================
  // INIT: Auto-start vault sidebar (always shown by default)
  // ============================================================================

  function init() {
    // Check user's toggle preference before initializing
    const isVaultEnabled = getAltViewState();

    devLog(
      "🚀 [VAULT] Initializing vault sidebar, toggle state:",
      isVaultEnabled,
    );

    // CRITICAL: Wait a bit longer for ChatGPT's React hydration to complete
    // Otherwise our sidebar gets orphaned when #history is replaced
    const initDelay = 500; // Wait 500ms for hydration

    setTimeout(() => {
      // Always create the sidebar infrastructure (for quick toggle response)
      // but only show it if user has enabled vault view
      waitForChatListContainer((historyDiv) => {
        createSidebar(historyDiv);

        // Only show vault sidebar if toggle is ON
        if (isVaultEnabled) {
          // Add another small delay to ensure sidebar is fully created
          setTimeout(() => {
            devLog("📦 [VAULT] Toggle is ON - showing vault sidebar");
            show();
          }, 200);
        } else {
          // Toggle is OFF - hide vault sidebar and show default ChatGPT view
          devLog("🚫 [VAULT] Toggle is OFF - hiding vault sidebar");
          setTimeout(() => hide(), 100);
        }

        // Preload projects in background for instant "Move to project" submenu
        setTimeout(() => {
          devLog(
            "🚀 [VAULT] Starting early project preload on sidebar init...",
          );
          preloadProjectsForSubmenu().catch((err) => {
            devWarn("⚠️ [VAULT] Early project preload failed:", err);
          });
        }, 2000); // Wait 2 seconds after sidebar is shown to avoid blocking UI
      });
    }, initDelay);

    // Watch for ChatGPT theme changes and refresh vault sidebar
    observeChatGPTThemeChanges();

    // Watch for language preference changes and refresh sidebar
    observeLanguageChanges();
  }

  // ============================================================================
  // THEME OBSERVER: Watch for ChatGPT color-scheme changes
  // ============================================================================

  function observeChatGPTThemeChanges() {
    const htmlElement = document.documentElement;

    let lastColorScheme =
      htmlElement.style.colorScheme ||
      getComputedStyle(htmlElement).colorScheme;

    // Watch for style AND class attribute changes on html element
    const themeObserver = new MutationObserver((mutations) => {
      const currentColorScheme =
        htmlElement.style.colorScheme ||
        getComputedStyle(htmlElement).colorScheme;

      // Only refresh if color-scheme actually changed
      if (currentColorScheme !== lastColorScheme) {
        // Theme changed - re-render sidebar
        lastColorScheme = currentColorScheme;

        // Re-render vault sidebar with new theme colors
        if (activeVaultData && sidebarContainer) {
          // Get NEW theme colors
          const newThemeColors = getVaultSidebarThemeColors();

          // Update container styling with new theme colors
          sidebarContainer.style.cssText = `
            display: block !important;
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 16px !important;
            background: ${newThemeColors.bg} !important;
            color: ${newThemeColors.text} !important;
            box-sizing: border-box !important;
          `;

          // Force complete refresh: clear container, trigger reflow, then re-render
          sidebarContainer.innerHTML = "";

          // Force browser reflow by reading offsetHeight
          void sidebarContainer.offsetHeight;

          // Now render with new theme
          renderSidebar(activeVaultData);
        }

        // Also refresh Tools & GPTs section with new theme
        createToolsGroup();
      }
    });

    themeObserver.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["style", "class", "data-theme"],
    });

    // NOTE: Removed setInterval fallback - MutationObserver above handles all theme changes
    // The 1-second polling was unnecessary overhead (60 calls/min doing nothing most of the time)
  }

  // ============================================================================
  // CATEGORY RENAME: Inline rename for categories in vault sidebar
  // ============================================================================

  /**
   * Enable inline renaming of a category in the vault sidebar
   * @param {string} categoryId - The ID of the category to rename
   */
  function renameCategoryInline(categoryId) {
    // Find the category header element
    const categoryHeader = document.querySelector(
      `.sp-vault-category-header[data-category-id="${categoryId}"]`,
    );
    if (!categoryHeader) {
      devWarn(`Category header not found for id: ${categoryId}`);
      return;
    }

    // Find the title span within the header
    const titleSpan = categoryHeader.querySelector(".sp-vault-category-name");
    if (!titleSpan) {
      devWarn(`Category title span not found for id: ${categoryId}`);
      return;
    }

    // Store original title
    const originalTitle = titleSpan.textContent.trim();

    // Find and hide the actions container (badge + menu button)
    const actionsContainer = categoryHeader.querySelector(
      ".sp-vault-category-actions",
    );
    if (actionsContainer) {
      actionsContainer.style.display = "none";
    }

    // Create inline input field
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalTitle;
    input.className = "sp-category-rename-input";

    // Get computed styles from title span for consistency
    const computedStyle = window.getComputedStyle(titleSpan);
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight;
    const textColor = computedStyle.color;

    input.style.cssText = `
      background: ${
        document.documentElement.classList.contains("dark")
          ? "rgba(55, 65, 81, 0.9)"
          : "rgba(255, 255, 255, 0.95)"
      };
      color: ${textColor};
      border: 2px solid #14b8a6;
      border-radius: 6px;
      padding: 2px 6px;
      font-size: ${fontSize};
      font-weight: ${fontWeight};
      flex: 1;
      outline: none;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
      margin: 0;
      margin-right: 12px;
      min-width: 0;
      max-width: calc(100% - 16px);
    `;

    // Hide the title span and insert input in its place
    titleSpan.style.display = "none";
    titleSpan.parentNode.insertBefore(input, titleSpan);

    // Focus and select all
    input.focus();
    input.select();

    // Save function
    const saveRename = async () => {
      const newName = input.value.trim();

      // Validate
      if (!newName) {
        alert("Category name cannot be empty");
        input.focus();
        return;
      }

      if (newName === originalTitle) {
        // No change, just restore
        titleSpan.style.display = "";
        input.remove();
        if (actionsContainer) {
          actionsContainer.style.display = "";
        }
        cleanup();
        return;
      }

      try {
        // Show loading state
        input.disabled = true;
        input.style.opacity = "0.6";

        // Send rename request to content script
        const response = await new Promise((resolve, reject) => {
          const requestId = `rename-category-${Date.now()}-${Math.random()}`;

          const handleResponse = (event) => {
            if (
              event.data.type === "sp-response" &&
              event.data.requestId === requestId
            ) {
              window.removeEventListener("message", handleResponse);
              if (event.data.success) {
                resolve(event.data);
              } else {
                reject(new Error(event.data.error || "Rename failed"));
              }
            }
          };

          window.addEventListener("message", handleResponse);

          // Timeout after 10 seconds
          setTimeout(() => {
            window.removeEventListener("message", handleResponse);
            reject(new Error("Timeout renaming category"));
          }, 10000);

          window.postMessage(
            {
              type: "sp-rename-category",
              requestId,
              categoryId,
              newName,
            },
            "*",
          );
        });

        // Update UI immediately
        titleSpan.textContent = newName;
        titleSpan.setAttribute("title", newName);
        titleSpan.style.display = "";
        input.remove();
        if (actionsContainer) {
          actionsContainer.style.display = "";
        }
        cleanup();

        // Refresh sidebar to show updated name everywhere
        setTimeout(() => {
          window.triggerVaultSidebarRefresh();
        }, 300);
      } catch (error) {
        devError(`❌ [VAULT] Failed to rename category:`, error);
        alert(`Failed to rename category: ${error.message}`);

        // Restore input
        input.disabled = false;
        input.style.opacity = "1";
        input.focus();
      }
    };

    // Cancel function
    const cancelRename = () => {
      titleSpan.style.display = "";
      input.remove();
      if (actionsContainer) {
        actionsContainer.style.display = "";
      }
      cleanup();
    };

    // Cleanup function to remove event listeners
    let cleanupDone = false;
    const cleanup = () => {
      if (cleanupDone) return;
      cleanupDone = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };

    // Handle click outside (save)
    const handleClickOutside = (e) => {
      // Check if click is outside the input field
      if (!input.contains(e.target) && input.parentElement) {
        e.preventDefault();
        e.stopPropagation();
        saveRename();
      }
    };

    // Handle Enter key (save)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelRename();
      }
    });

    // Prevent category click when clicking on input
    input.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Prevent category click when clicking on the input's parent area
    input.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    // Add document click listener (with small delay to ensure input is mounted)
    setTimeout(() => {
      if (input.parentElement) {
        document.addEventListener("mousedown", handleClickOutside);
      }
    }, 100);
  }

  // ============================================================================
  // CATEGORY COLOR PICKER: Standalone premium color picker for vault sidebar
  // ============================================================================

  /**
   * Open a premium color picker for changing category colors directly in the vault sidebar
   * @param {string} categoryId - The ID of the category to change color for
   */
  function openCategoryColorPicker(categoryId) {
    devLog(`🎨 Opening color picker for category: ${categoryId}`);

    if (!activeVaultData) {
      devWarn("No active vault data for color picker");
      return;
    }

    // Find the category
    function findCategory(categories, id) {
      for (const cat of categories) {
        if (cat.id === id) return cat;
        if (cat.subcategories) {
          const found = findCategory(cat.subcategories, id);
          if (found) return found;
        }
        if (cat.children) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    }

    const category = findCategory(activeVaultData.categories || [], categoryId);
    if (!category) {
      devWarn("Category not found:", categoryId);
      return;
    }

    devLog(`✅ Found category:`, category.name);

    // Get theme colors
    const themeColors = getVaultSidebarThemeColors();

    // State for color picker
    let currentHue = 0;
    let currentSaturation = 1;
    let currentValue = 1;
    let currentColor = category.color || "#3b82f6";

    // HSV to Hex conversion
    function hsvToHex(h, s, v) {
      const c = v * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = v - c;

      let r1 = 0,
        g1 = 0,
        b1 = 0;

      if (h >= 0 && h < 60) {
        r1 = c;
        g1 = x;
        b1 = 0;
      } else if (h >= 60 && h < 120) {
        r1 = x;
        g1 = c;
        b1 = 0;
      } else if (h >= 120 && h < 180) {
        r1 = 0;
        g1 = c;
        b1 = x;
      } else if (h >= 180 && h < 240) {
        r1 = 0;
        g1 = x;
        b1 = c;
      } else if (h >= 240 && h < 300) {
        r1 = x;
        g1 = 0;
        b1 = c;
      } else {
        r1 = c;
        g1 = 0;
        b1 = x;
      }

      const r = Math.round((r1 + m) * 255);
      const g = Math.round((g1 + m) * 255);
      const b = Math.round((b1 + m) * 255);

      const toHex = (n) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    // Update category color
    async function updateCategoryColor(newColor) {
      currentColor = newColor;

      // Update the category in our local data
      function updateCategoryRecursive(categories, id, updates) {
        return categories.map((cat) => {
          if (cat.id === id) {
            return { ...cat, ...updates };
          }
          if (cat.subcategories) {
            return {
              ...cat,
              subcategories: updateCategoryRecursive(
                cat.subcategories,
                id,
                updates,
              ),
            };
          }
          return cat;
        });
      }

      activeVaultData.categories = updateCategoryRecursive(
        activeVaultData.categories || [],
        categoryId,
        {
          color: newColor,
          borderColor: newColor,
        },
      );

      // Save to storage via content script bridge
      const requestId = `update-category-color-${Date.now()}`;
      window.postMessage(
        {
          type: "sp-update-category-color",
          source: "superprompt-vault-sidebar",
          requestId,
          categoryId,
          color: newColor,
          borderColor: newColor,
        },
        "*",
      );

      // Refresh the sidebar to show new color
      renderSidebar(activeVaultData);
    }

    // Find the category element in the sidebar to position picker next to it
    const categoryElements = document.querySelectorAll(
      ".sp-vault-category-header[data-category-id]",
    );
    let categoryElement = null;

    for (const el of categoryElements) {
      const catIdAttr = el.getAttribute("data-category-id");
      if (catIdAttr === categoryId) {
        categoryElement = el;
        break;
      }
    }

    // Calculate position - right next to the category
    let pickerTop = window.innerHeight / 2 - 150; // Center vertically
    let pickerLeft = window.innerWidth / 2 - 140; // Center horizontally

    if (categoryElement) {
      const rect = categoryElement.getBoundingClientRect();

      // Picker dimensions (including padding and border)
      const pickerWidth = 280;
      const pickerHeight = 360; // Increased to account for padding (20px top/bottom) + content (~320px)
      const gap = 12;
      const margin = 12;

      // Start position: right next to category
      pickerLeft = rect.right + gap;
      pickerTop = rect.top;

      // Check if picker would overflow right edge
      if (pickerLeft + pickerWidth > window.innerWidth - margin) {
        // Try positioning to the left of the category instead
        pickerLeft = rect.left - pickerWidth - gap;

        // If still overflows left edge, clamp to right side with margin
        if (pickerLeft < margin) {
          pickerLeft = window.innerWidth - pickerWidth - margin;
        }
      }

      // Check if picker would overflow bottom edge
      if (pickerTop + pickerHeight > window.innerHeight - margin) {
        // Align bottom of picker with bottom of viewport
        pickerTop = window.innerHeight - pickerHeight - margin;
      }

      // Ensure picker doesn't go above viewport
      if (pickerTop < margin) {
        pickerTop = margin;
      }

      // Ensure picker doesn't overflow left edge (final safety check)
      if (pickerLeft < margin) {
        pickerLeft = margin;
      }

      devLog(
        `📍 Picker position: top=${pickerTop}, left=${pickerLeft}, categoryRect=`,
        rect,
      );
    }

    // Create picker container (no backdrop - we want to see the category change live!)
    const picker = document.createElement("div");
    picker.style.cssText = `
      position: fixed;
      top: ${pickerTop}px;
      left: ${pickerLeft}px;
      width: 280px;
      background: ${themeColors.bgSecondary};
      border: 2px solid ${themeColors.activeBorder};
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(20, 184, 166, 0.5);
      z-index: 10000001;
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.2s ease, transform 0.2s ease;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    `;

    const title = document.createElement("span");
    title.textContent = getTranslation("changeColor");
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: ${themeColors.text};
    `;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${themeColors.textSecondary};
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.15s ease;
    `;
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = themeColors.hoverBg;
      closeBtn.style.color = themeColors.text;
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = "transparent";
      closeBtn.style.color = themeColors.textSecondary;
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Saturation/Value square
    const saturationSquare = document.createElement("div");
    saturationSquare.style.cssText = `
      width: 100%;
      height: 160px;
      border-radius: 8px;
      cursor: crosshair;
      margin-bottom: 12px;
      position: relative;
      background: ${hsvToHex(currentHue, 1, 1)};
    `;

    // White to transparent gradient (left to right)
    const whiteGradient = document.createElement("div");
    whiteGradient.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, white, transparent);
      border-radius: 8px;
    `;

    // Black to transparent gradient (bottom to top)
    const blackGradient = document.createElement("div");
    blackGradient.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, black, transparent);
      border-radius: 8px;
    `;

    saturationSquare.appendChild(whiteGradient);
    saturationSquare.appendChild(blackGradient);

    // Hue bar
    const hueBar = document.createElement("div");
    hueBar.style.cssText = `
      width: 100%;
      height: 14px;
      border-radius: 7px;
      cursor: pointer;
      margin-bottom: 16px;
      position: relative;
      background: linear-gradient(to right, 
        #ff0000 0%, 
        #ffff00 17%, 
        #00ff00 33%, 
        #00ffff 50%, 
        #0000ff 67%, 
        #ff00ff 83%, 
        #ff0000 100%
      );
    `;

    // Hue handle
    const hueHandle = document.createElement("div");
    hueHandle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0%;
      transform: translate(-50%, -50%);
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      border: 2px solid ${themeColors.borderLight};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `;
    hueBar.appendChild(hueHandle);

    // Preview section
    const previewSection = document.createElement("div");
    previewSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    const previewSwatch = document.createElement("div");
    previewSwatch.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: ${currentColor};
      border: 2px solid ${themeColors.borderLight};
      flex-shrink: 0;
    `;

    const previewText = document.createElement("span");
    previewText.textContent = currentColor.toUpperCase();
    previewText.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: 600;
      color: ${themeColors.text};
      flex: 1;
    `;

    previewSection.appendChild(previewSwatch);
    previewSection.appendChild(previewText);

    // Assemble picker
    picker.appendChild(header);
    picker.appendChild(saturationSquare);
    picker.appendChild(hueBar);
    picker.appendChild(previewSection);

    // Event handlers
    saturationSquare.onclick = (e) => {
      const rect = saturationSquare.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      currentSaturation = Math.max(0, Math.min(1, x));
      currentValue = Math.max(0, Math.min(1, 1 - y));

      const newColor = hsvToHex(currentHue, currentSaturation, currentValue);
      currentColor = newColor;
      previewSwatch.style.background = newColor;
      previewText.textContent = newColor.toUpperCase();

      updateCategoryColor(newColor);
    };

    hueBar.onclick = (e) => {
      const rect = hueBar.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      currentHue = Math.max(0, Math.min(360, x * 360));

      hueHandle.style.left = `${x * 100}%`;
      saturationSquare.style.background = hsvToHex(currentHue, 1, 1);

      const newColor = hsvToHex(currentHue, currentSaturation, currentValue);
      currentColor = newColor;
      previewSwatch.style.background = newColor;
      previewText.textContent = newColor.toUpperCase();

      updateCategoryColor(newColor);
    };

    // Close handlers
    const close = () => {
      picker.style.opacity = "0";
      picker.style.transform = "scale(0.95)";
      setTimeout(() => {
        picker.remove();
      }, 200);
    };

    closeBtn.onclick = close;

    // Close on click outside picker
    const handleClickOutside = (e) => {
      if (!picker.contains(e.target)) {
        close();
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };

    // Add slight delay before enabling click-outside to prevent immediate close
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    // ESC key
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        close();
        document.removeEventListener("keydown", handleEsc);
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
    document.addEventListener("keydown", handleEsc);

    // Append to body (no backdrop!)
    document.body.appendChild(picker);

    // Animate in
    requestAnimationFrame(() => {
      picker.style.opacity = "1";
      picker.style.transform = "scale(1)";
    });
  }

  // ============================================================================
  // LANGUAGE CHANGE OBSERVER: Watch for language preference changes
  // ============================================================================

  function observeLanguageChanges() {
    // Listen for localStorage changes (when settings change in another window/tab)
    window.addEventListener("storage", (event) => {
      if (event.key === "superprompt-language") {
        // Language changed - refresh sidebar to update all labels
        if (activeVaultData && sidebarContainer) {
          sidebarContainer.innerHTML = "";
          void sidebarContainer.offsetHeight;
          renderSidebar(activeVaultData);
        }
        // Also refresh Tools & GPTs section
        createToolsGroup();
      }
    });

    // Listen for custom event (when settings change in same window)
    window.addEventListener("superprompt-language-changed", () => {
      if (activeVaultData && sidebarContainer) {
        sidebarContainer.innerHTML = "";
        void sidebarContainer.offsetHeight;
        renderSidebar(activeVaultData);
      }
      // Also refresh Tools & GPTs section
      createToolsGroup();
    });

    // Listen for accent color changes (CustomEvent from same context)
    window.addEventListener("superprompt-accent-color-changed", () => {
      // Re-apply accent color variables to the sidebar
      if (sidebarContainer) {
        applySuperPromptAccentVars(sidebarContainer);
      }

      // If vault is open, refresh the view to apply new colors
      if (activeVaultData && sidebarContainer) {
        // Force re-render to apply new accent colors to all elements
        const scrollTop = sidebarContainer.scrollTop;
        sidebarContainer.innerHTML = "";
        void sidebarContainer.offsetHeight;
        renderSidebar(activeVaultData);
        // Restore scroll position
        sidebarContainer.scrollTop = scrollTop;
      }

      // Also refresh Tools & GPTs section with new colors
      createToolsGroup();
    });

    // Listen for accent color changes (postMessage from extension context)
    window.addEventListener("message", (event) => {
      if (
        event.data?.type === "superprompt-accent-color-changed" ||
        event.data?.type === "superprompt-theme-changed"
      ) {
        // Re-apply accent color variables to the sidebar
        if (sidebarContainer) {
          applySuperPromptAccentVars(sidebarContainer);
        }

        // If vault is open, refresh the view to apply new colors
        if (activeVaultData && sidebarContainer) {
          // Force re-render to apply new accent colors to all elements
          const scrollTop = sidebarContainer.scrollTop;
          sidebarContainer.innerHTML = "";
          void sidebarContainer.offsetHeight;
          renderSidebar(activeVaultData);
          // Restore scroll position
          sidebarContainer.scrollTop = scrollTop;
        }

        // Also refresh Tools & GPTs section with new colors
        createToolsGroup();
      }
    });
  }

  // ============================================================================
  // EXPORT: Public API
  // ============================================================================

  window.SuperPromptVaultSidebar = {
    show,
    hide,
    destroy,
    refresh: requestVaultData,
  };

  // Auto-initialize
  init();
})();
