/**
 * Internationalization (i18n) module for the application
 * Provides functionality for language detection, switching, and text translation
 */

// Available languages
const AVAILABLE_LANGUAGES = ['en', 'fr'];
const DEFAULT_LANGUAGE = 'en';

// Store translations
let translations = {};
let currentLanguage = DEFAULT_LANGUAGE;

// DOM elements that need to be updated when language changes
const elementsToUpdate = [];

/**
 * Initialize the i18n module
 * @returns {Promise<void>} A promise that resolves when initialization is complete
 */
async function initI18n() {
    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    
    // Set initial language (browser language if supported, otherwise default)
    let initialLang = AVAILABLE_LANGUAGES.includes(browserLang) ? browserLang : DEFAULT_LANGUAGE;
    
    // Check if user has a language preference stored
    const storedLang = localStorage.getItem('language');
    if (storedLang && AVAILABLE_LANGUAGES.includes(storedLang)) {
        initialLang = storedLang;
    }
    
    // Load translations for all languages
    await Promise.all(AVAILABLE_LANGUAGES.map(async (lang) => {
        try {
            const response = await fetch(`/i18n/${lang}.json`);
            translations[lang] = await response.json();
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
            // If default language fails to load, create an empty object to prevent errors
            if (lang === DEFAULT_LANGUAGE) {
                translations[DEFAULT_LANGUAGE] = {};
            }
        }
    }));
    
    // Set the language
    await setLanguage(initialLang);
    
    // Add language switcher to the page
    addLanguageSwitcher();
}

/**
 * Set the current language and update the UI
 * @param {string} lang - The language code to set
 * @returns {Promise<void>} A promise that resolves when the language is set
 */
async function setLanguage(lang) {
    if (!AVAILABLE_LANGUAGES.includes(lang)) {
        console.error(`Language ${lang} is not supported`);
        return;
    }
    
    // Update current language
    currentLanguage = lang;
    
    // Store language preference
    localStorage.setItem('language', lang);
    
    // Update html lang attribute
    document.documentElement.lang = lang;
    
    // Update all registered elements
    updateAllElements();
    
    // Update all data-i18n elements
    translateDataI18nElements();
}

/**
 * Get a translated string
 * @param {string} key - The translation key (dot notation, e.g., 'general.backToHome')
 * @param {Object} [params] - Optional parameters for string interpolation
 * @returns {string} The translated string
 */
function t(key, params = {}) {
    // Split the key into parts (e.g., 'general.backToHome' -> ['general', 'backToHome'])
    const parts = key.split('.');
    
    // Get the translation object for the current language
    let translation = translations[currentLanguage];
    
    // If translation for current language is not available, fall back to default
    if (!translation) {
        translation = translations[DEFAULT_LANGUAGE];
    }
    
    // Navigate through the translation object
    for (const part of parts) {
        if (translation && translation[part] !== undefined) {
            translation = translation[part];
        } else {
            // If translation is not found, return the key
            return key;
        }
    }
    
    // If translation is not a string, return the key
    if (typeof translation !== 'string') {
        return key;
    }
    
    // Replace parameters in the translation string
    let result = translation;
    for (const [param, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), value);
    }
    
    return result;
}

/**
 * Register an element for translation updates
 * @param {HTMLElement} element - The element to register
 * @param {string} key - The translation key
 * @param {string} [attribute='textContent'] - The attribute to update (default: 'textContent')
 * @param {Object} [params] - Optional parameters for string interpolation
 */
function registerElement(element, key, attribute = 'textContent', params = {}) {
    elementsToUpdate.push({ element, key, attribute, params });
    
    // Initial update
    updateElement({ element, key, attribute, params });
}

/**
 * Update a registered element with the current translation
 * @param {Object} elementInfo - The element info object
 */
function updateElement(elementInfo) {
    const { element, key, attribute, params } = elementInfo;
    
    // Get the translated string
    const translatedText = t(key, params);
    
    // Update the element
    if (attribute === 'textContent') {
        element.textContent = translatedText;
    } else if (attribute === 'innerHTML') {
        element.innerHTML = translatedText;
    } else {
        element.setAttribute(attribute, translatedText);
    }
}

/**
 * Update all registered elements with the current translations
 */
function updateAllElements() {
    elementsToUpdate.forEach(updateElement);
}

/**
 * Translate all elements with data-i18n attribute
 */
function translateDataI18nElements() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const attribute = element.getAttribute('data-i18n-attr') || 'textContent';
        
        // Get the translated string
        const translatedText = t(key);
        
        // Update the element
        if (attribute === 'textContent') {
            element.textContent = translatedText;
        } else if (attribute === 'innerHTML') {
            element.innerHTML = translatedText;
        } else {
            element.setAttribute(attribute, translatedText);
        }
    });
}

/**
 * Add a language switcher to the page
 */
function addLanguageSwitcher() {
    // Create language switcher container
    const container = document.createElement('div');
    container.className = 'language-switcher fixed top-4 right-4 bg-white p-2 rounded-lg shadow-md z-50';
    
    // Create language options
    AVAILABLE_LANGUAGES.forEach(lang => {
        const button = document.createElement('button');
        button.textContent = lang.toUpperCase();
        button.className = 'px-2 py-1 mx-1 rounded hover:bg-gray-200 focus:outline-none';
        button.addEventListener('click', () => setLanguage(lang));
        
        // Highlight current language
        if (lang === currentLanguage) {
            button.classList.add('font-bold', 'bg-gray-200');
        }
        
        container.appendChild(button);
    });
    
    // Add to the page
    document.body.appendChild(container);
}

// Export functions for global use
window.i18n = {
    init: initI18n,
    setLanguage,
    t,
    registerElement,
    translateDataI18nElements
};

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initI18n);