/**
 * Frontend Internationalization (i18n) System for AetherMeet
 * Handles language switching and text translation in the browser
 */

class FrontendI18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.translations = {};
        this.languageNames = {
            'en': 'EN',
            'es': 'ES', 
            'fr': 'FR',
            'de': 'DE',
            'it': 'IT',
            'pt': 'PT',
            'ru': 'RU',
            'ja': 'JP',
            'ko': 'KR',
            'zh': 'CN'
        };
        
        this.init();
    }

    async init() {
        // Load translations for current language
        await this.loadTranslations(this.currentLanguage);
        
        // Update UI
        this.updateLanguageButton();
        this.translatePage();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async loadTranslations(languageCode) {
        try {
            const response = await fetch(`/api/i18n/translations/${languageCode}`);
            const data = await response.json();
            
            if (data.success) {
                this.translations = data.translations;
                return true;
            } else {
                console.warn(`Failed to load translations for ${languageCode}:`, data.message);
                return false;
            }
        } catch (error) {
            console.error(`Error loading translations for ${languageCode}:`, error);
            return false;
        }
    }

    setupEventListeners() {
        // Language toggle button
        const languageToggle = document.getElementById('languageToggle');
        const languageDropdown = document.getElementById('languageDropdown');
        
        if (languageToggle && languageDropdown) {
            // Toggle dropdown
            languageToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                languageDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                languageDropdown.classList.add('hidden');
            });

            // Language selection
            const languageOptions = document.querySelectorAll('.language-option');
            languageOptions.forEach(option => {
                option.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newLanguage = option.dataset.lang;
                    await this.changeLanguage(newLanguage);
                    languageDropdown.classList.add('hidden');
                });
            });
        }
    }

    async changeLanguage(languageCode) {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load new translations
            const loaded = await this.loadTranslations(languageCode);
            
            if (loaded) {
                this.currentLanguage = languageCode;
                localStorage.setItem('language', languageCode);
                
                // Update UI
                this.updateLanguageButton();
                this.translatePage();
                
                // Save user preference to server if authenticated
                this.saveUserLanguagePreference(languageCode);
                
                console.log(`Language changed to: ${languageCode}`);
            } else {
                this.showError('Failed to load language pack');
            }
        } catch (error) {
            console.error('Error changing language:', error);
            this.showError('Error changing language');
        } finally {
            this.hideLoadingState();
        }
    }

    translatePage() {
        // Find all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.dataset.i18n;
            const translation = this.getTranslation(key);
            
            if (translation) {
                // Handle different element types
                if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                    element.value = translation;
                } else if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }

    getTranslation(key) {
        // Split key by dots to access nested properties
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Return original key if translation not found
                console.warn(`Translation not found for key: ${key}`);
                return null;
            }
        }
        
        return value;
    }

    updateLanguageButton() {
        const languageText = document.getElementById('languageText');
        if (languageText) {
            languageText.textContent = this.languageNames[this.currentLanguage] || 'EN';
        }
        
        // Update active state in dropdown
        const languageOptions = document.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            if (option.dataset.lang === this.currentLanguage) {
                option.style.backgroundColor = '#f3f4f6';
                option.style.fontWeight = 'bold';
            } else {
                option.style.backgroundColor = '';
                option.style.fontWeight = '';
            }
        });
    }

    async saveUserLanguagePreference(languageCode) {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/i18n/user/language', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ language: languageCode })
                });
            }
        } catch (error) {
            console.warn('Could not save language preference:', error);
        }
    }

    showLoadingState() {
        const languageText = document.getElementById('languageText');
        if (languageText) {
            languageText.textContent = '...';
        }
    }

    hideLoadingState() {
        this.updateLanguageButton();
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-20 right-4 bg-red-100 border-2 border-red-500 text-red-800 p-4 z-50 font-mono text-sm';
        notification.style.boxShadow = '4px 4px 0px 0px #dc2626';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Public method to translate specific text
    translate(key) {
        return this.getTranslation(key) || key;
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize the i18n system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new FrontendI18n();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendI18n;
}