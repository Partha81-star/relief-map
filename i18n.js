/**
 * i18n.js - Lightweight Language Manager for ReliefMap
 * Manages language switching, string retrieval, and localStorage persistence
 */

window.i18n = {
  currentLanguage: 'en',
  translations: {}, // will be loaded from translations.json
  
  /**
   * Initialize i18n - load translations and restore user's language preference
   */
  async init() {
    try {
      // Load translations from JSON
      const response = await fetch('translations.json');
      this.translations = await response.json();
      
      // Restore language preference from localStorage, default to 'en'
      this.currentLanguage = localStorage.getItem('userLanguage') || 'en';
      
      console.log('✅ i18n initialized. Current language:', this.currentLanguage);
      console.log('Available translations:', Object.keys(this.translations));
    } catch (e) {
      console.warn('⚠️ Could not load translations.json, using English:', e);
      // Fallback: use English strings from str object
      this.translations = { en: this._extractEnglishStrings() };
      this.currentLanguage = 'en';
    }
  },

  /**
   * Get translated string by key path (e.g., "auth.heading", "feed.title")
   * Supports simple parameter substitution: "{param}" in the string
   * Falls back to English if translation not found
   * @param {string} keyPath - Dot-notation path to string (e.g., "auth.signin")
   * @param {object} params - Optional parameters for string interpolation
   * @returns {string} - Translated string or English fallback
   */
  t(keyPath, params = {}) {
    // Get translated string
    let translated = this._getByPath(
      this.translations[this.currentLanguage] || {},
      keyPath
    );

    // Fallback to English if not found
    if (!translated) {
      translated = this._getByPath(this.translations.en || {}, keyPath);
    }

    // Fallback to key path itself if still not found
    if (!translated) {
      translated = keyPath;
    }

    // Simple parameter substitution: "{param}" → value
    Object.keys(params).forEach(key => {
      translated = translated.replace(`{${key}}`, params[key]);
    });

    return translated;
  },

  /**
   * Switch to a different language
   * @param {string} lang - Language code ('en', 'hi', 'mr')
   */
  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.warn(`⚠️ Language '${lang}' not available, keeping '${this.currentLanguage}'`);
      return;
    }
    
    this.currentLanguage = lang;
    localStorage.setItem('userLanguage', lang);
    console.log(`🌐 Language changed to: ${lang}`);
    
    // Trigger UI re-render if callback exists
    if (window.reRenderUI) {
      window.reRenderUI();
    }
  },

  /**
   * Get available languages from translations object
   * @returns {array} - Array of language codes
   */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  },

  /**
   * Get language name for display
   * @param {string} code - Language code('en', 'hi', 'mr')
   * @returns {string} - Display name
   */
  getLanguageName(code) {
    const names = {
      en: 'English',
      hi: 'हिन्दी (Hindi)',
      mr: 'मराठी (Marathi)'
    };
    return names[code] || code;
  },

  /**
   * ──────────────── INTERNAL HELPERS ────────────────
   */

  /**
   * Navigate nested object by dot-notation path
   * @private
   */
  _getByPath(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },

  /**
   * Extract English strings from str object (fallback)
   * @private
   */
  _extractEnglishStrings() {
    return window.str || {};
  }
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}
