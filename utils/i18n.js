/**
 * Internationalization (i18n) System for AetherMeet
 * Provides multi-language support with dynamic language switching
 */

class InternationalizationManager {
    constructor() {
        this.currentLanguage = 'en';
        this.fallbackLanguage = 'en';
        this.translations = {};
        this.supportedLanguages = [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'it', name: 'Italiano', flag: '🇮🇹' },
            { code: 'pt', name: 'Português', flag: '🇵🇹' },
            { code: 'ru', name: 'Русский', flag: '🇷🇺' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' },
            { code: 'ko', name: '한국어', flag: '🇰🇷' },
            { code: 'zh', name: '中文', flag: '🇨🇳' }
        ];
        
        this.loadTranslations();
    }

    /**
     * Load all translation files
     */
    loadTranslations() {
        // English (default)
        this.translations.en = {
            // Navigation
            'nav.home': 'Home',
            'nav.dashboard': 'Dashboard',
            'nav.notes': 'Notes',
            'nav.logout': 'Logout',
            'nav.login': 'Login',
            'nav.register': 'Register',
            'nav.tryDemo': 'Try Demo',

            // Common
            'common.loading': 'Loading...',
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.submit': 'Submit',
            'common.close': 'Close',
            'common.yes': 'Yes',
            'common.no': 'No',
            'common.ok': 'OK',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.warning': 'Warning',

            // Landing Page
            'landing.title': 'AetherMeet',
            'landing.subtitle': 'Secure & Ephemeral Team Chat Rooms',
            'landing.hero.title': 'Connect Securely, Communicate Freely',
            'landing.hero.description': 'Create temporary chat rooms with advanced security features, instant demo access, and complete privacy control.',
            'landing.demo.button': 'Try Demo Room',
            'landing.demo.description': 'No registration required - create and join instantly',
            'landing.features.title': 'Why Choose AetherMeet?',
            'landing.features.security.title': 'Advanced Security',
            'landing.features.security.description': 'End-to-end encryption, rate limiting, and comprehensive security headers',
            'landing.features.ephemeral.title': 'Ephemeral Rooms',
            'landing.features.ephemeral.description': 'Temporary chat rooms that expire automatically for ultimate privacy',
            'landing.features.instant.title': 'Instant Access',
            'landing.features.instant.description': 'Demo rooms available immediately without any registration',

            // Authentication
            'auth.login.title': 'Login to AetherMeet',
            'auth.login.username': 'Username',
            'auth.login.password': 'Password',
            'auth.login.button': 'Login',
            'auth.login.register': 'Don\'t have an account? Register here',
            'auth.register.title': 'Create Account',
            'auth.register.username': 'Username',
            'auth.register.email': 'Email',
            'auth.register.password': 'Password',
            'auth.register.confirmPassword': 'Confirm Password',
            'auth.register.button': 'Register',
            'auth.register.login': 'Already have an account? Login here',

            // Dashboard
            'dashboard.title': 'Dashboard',
            'dashboard.welcome': 'Welcome back',
            'dashboard.createRoom': 'Create New Room',
            'dashboard.joinRoom': 'Join Existing Room',
            'dashboard.recentRooms': 'Recent Rooms',
            'dashboard.noRooms': 'No recent rooms found',

            // Room Creation
            'room.create.title': 'Create New Room',
            'room.create.name': 'Room Name',
            'room.create.description': 'Description (optional)',
            'room.create.password': 'Primary Password',
            'room.create.passwordSecondary': 'Secondary Password (optional)',
            'room.create.admissionType': 'Admission Type',
            'room.create.admissionTypes.instant': 'Instant Entry',
            'room.create.admissionTypes.approval': 'Owner Approval',
            'room.create.admissionTypes.voting': 'Democratic Voting',
            'room.create.schedule': 'Schedule Room',
            'room.create.scheduleTime': 'Scheduled Time',
            'room.create.createInstant': 'Create Instant Room',
            'room.create.createScheduled': 'Create Scheduled Room',

            // Room Interface
            'room.title': 'Chat Room',
            'room.members': 'Members',
            'room.onlineMembers': 'Online Members',
            'room.typeMessage': 'Type your message...',
            'room.sendMessage': 'Send Message',
            'room.shareMedia': 'Share Media',
            'room.exportPDF': 'Export Chat as PDF',
            'room.leaveRoom': 'Leave Room',
            'room.dissolveRoom': 'Dissolve Room',
            'room.memberJoined': '{username} joined the room',
            'room.memberLeft': '{username} left the room',
            'room.mediaShared': 'Media file shared',

            // Moderation
            'moderation.title': 'Moderation Tools',
            'moderation.warn': 'Warn User',
            'moderation.mute': 'Mute User',
            'moderation.kick': 'Kick User',
            'moderation.ban': 'Ban User',
            'moderation.restrictMedia': 'Restrict Media',
            'moderation.reason': 'Reason',
            'moderation.duration': 'Duration (minutes)',
            'moderation.permanent': 'Permanent',
            'moderation.apply': 'Apply Action',
            'moderation.history': 'Moderation History',

            // Analytics
            'analytics.title': 'Analytics Dashboard',
            'analytics.overview': 'Overview',
            'analytics.roomStats': 'Room Statistics',
            'analytics.userEngagement': 'User Engagement',
            'analytics.popularRooms': 'Popular Rooms',
            'analytics.hourlyTrends': 'Hourly Trends',
            'analytics.totalEvents': 'Total Events',
            'analytics.activeUsers': 'Active Users',
            'analytics.roomsCreated': 'Rooms Created',
            'analytics.messagesTotal': 'Messages Sent',

            // Settings
            'settings.title': 'Settings',
            'settings.language': 'Language',
            'settings.theme': 'Theme',
            'settings.notifications': 'Notifications',
            'settings.privacy': 'Privacy',
            'settings.changeLanguage': 'Change Language',
            'settings.lightTheme': 'Light Theme',
            'settings.darkTheme': 'Dark Theme',

            // Errors
            'error.generic': 'An error occurred. Please try again.',
            'error.networkError': 'Network error. Please check your connection.',
            'error.unauthorized': 'You are not authorized to perform this action.',
            'error.notFound': 'The requested resource was not found.',
            'error.validationError': 'Please check your input and try again.',
            'error.rateLimitExceeded': 'Too many requests. Please wait and try again.',

            // Success Messages
            'success.roomCreated': 'Room created successfully',
            'success.roomJoined': 'Successfully joined the room',
            'success.messageSent': 'Message sent',
            'success.fileUploaded': 'File uploaded successfully',
            'success.settingsSaved': 'Settings saved successfully',
            'success.userRegistered': 'Account created successfully',
            'success.loginSuccessful': 'Login successful'
        };

        // Spanish
        this.translations.es = {
            'nav.home': 'Inicio',
            'nav.dashboard': 'Panel',
            'nav.notes': 'Notas',
            'nav.logout': 'Cerrar Sesión',
            'nav.login': 'Iniciar Sesión',
            'nav.register': 'Registrarse',
            'nav.tryDemo': 'Probar Demo',

            'common.loading': 'Cargando...',
            'common.save': 'Guardar',
            'common.cancel': 'Cancelar',
            'common.delete': 'Eliminar',
            'common.edit': 'Editar',
            'common.submit': 'Enviar',
            'common.close': 'Cerrar',
            'common.yes': 'Sí',
            'common.no': 'No',
            'common.ok': 'OK',
            'common.error': 'Error',
            'common.success': 'Éxito',
            'common.warning': 'Advertencia',

            'landing.title': 'AetherMeet',
            'landing.subtitle': 'Salas de Chat Seguras y Efímeras',
            'landing.hero.title': 'Conéctate de Forma Segura, Comunícate Libremente',
            'landing.hero.description': 'Crea salas de chat temporales con características de seguridad avanzadas, acceso demo instantáneo y control completo de privacidad.',
            'landing.demo.button': 'Probar Sala Demo',
            'landing.demo.description': 'No se requiere registro - crear y unirse instantáneamente',

            'auth.login.title': 'Iniciar Sesión en AetherMeet',
            'auth.login.username': 'Nombre de Usuario',
            'auth.login.password': 'Contraseña',
            'auth.login.button': 'Iniciar Sesión',
            'auth.register.title': 'Crear Cuenta',
            'auth.register.username': 'Nombre de Usuario',
            'auth.register.email': 'Correo Electrónico',
            'auth.register.password': 'Contraseña',
            'auth.register.button': 'Registrarse',

            'room.title': 'Sala de Chat',
            'room.members': 'Miembros',
            'room.typeMessage': 'Escribe tu mensaje...',
            'room.sendMessage': 'Enviar Mensaje',
            'room.memberJoined': '{username} se unió a la sala',
            'room.memberLeft': '{username} dejó la sala',

            'error.generic': 'Ocurrió un error. Por favor, inténtalo de nuevo.',
            'error.networkError': 'Error de red. Por favor, verifica tu conexión.',
            'success.roomCreated': 'Sala creada exitosamente',
            'success.loginSuccessful': 'Inicio de sesión exitoso'
        };

        // French
        this.translations.fr = {
            'nav.home': 'Accueil',
            'nav.dashboard': 'Tableau de bord',
            'nav.notes': 'Notes',
            'nav.logout': 'Déconnexion',
            'nav.login': 'Connexion',
            'nav.register': 'S\'inscrire',
            'nav.tryDemo': 'Essayer la Démo',

            'landing.title': 'AetherMeet',
            'landing.subtitle': 'Salles de Chat Sécurisées et Éphémères',
            'landing.hero.title': 'Connectez-vous en Sécurité, Communiquez Librement',
            'landing.demo.button': 'Essayer Salle Démo',

            'auth.login.title': 'Se connecter à AetherMeet',
            'auth.login.username': 'Nom d\'utilisateur',
            'auth.login.password': 'Mot de passe',
            'auth.login.button': 'Se connecter',

            'room.title': 'Salon de Discussion',
            'room.typeMessage': 'Tapez votre message...',
            'room.sendMessage': 'Envoyer le Message',

            'success.roomCreated': 'Salle créée avec succès',
            'success.loginSuccessful': 'Connexion réussie'
        };

        // German
        this.translations.de = {
            'nav.home': 'Startseite',
            'nav.dashboard': 'Dashboard',
            'nav.notes': 'Notizen',
            'nav.logout': 'Abmelden',
            'nav.login': 'Anmelden',
            'nav.register': 'Registrieren',
            'nav.tryDemo': 'Demo Testen',

            'landing.title': 'AetherMeet',
            'landing.subtitle': 'Sichere & Vergängliche Team-Chaträume',
            'landing.hero.title': 'Sicher Verbinden, Frei Kommunizieren',
            'landing.demo.button': 'Demo-Raum Testen',

            'auth.login.title': 'Bei AetherMeet Anmelden',
            'auth.login.username': 'Benutzername',
            'auth.login.password': 'Passwort',
            'auth.login.button': 'Anmelden',

            'room.title': 'Chatraum',
            'room.typeMessage': 'Nachricht eingeben...',
            'room.sendMessage': 'Nachricht Senden',

            'success.roomCreated': 'Raum erfolgreich erstellt',
            'success.loginSuccessful': 'Anmeldung erfolgreich'
        };

        // Add more languages with partial translations (they'll fall back to English)
        this.translations.it = {
            'nav.home': 'Home',
            'landing.title': 'AetherMeet',
            'auth.login.button': 'Accedi',
            'room.title': 'Stanza Chat'
        };

        this.translations.pt = {
            'nav.home': 'Início',
            'landing.title': 'AetherMeet',
            'auth.login.button': 'Entrar',
            'room.title': 'Sala de Chat'
        };

        this.translations.ru = {
            'nav.home': 'Главная',
            'landing.title': 'AetherMeet',
            'auth.login.button': 'Войти',
            'room.title': 'Чат-Комната'
        };

        this.translations.ja = {
            'nav.home': 'ホーム',
            'landing.title': 'AetherMeet',
            'auth.login.button': 'ログイン',
            'room.title': 'チャットルーム'
        };

        this.translations.ko = {
            'nav.home': '홈',
            'landing.title': 'AetherMeet',
            'auth.login.button': '로그인',
            'room.title': '채팅방'
        };

        this.translations.zh = {
            'nav.home': '首页',
            'landing.title': 'AetherMeet',
            'auth.login.button': '登录',
            'room.title': '聊天室'
        };
    }

    /**
     * Set the current language
     * @param {string} languageCode - Language code (e.g., 'en', 'es', 'fr')
     */
    setLanguage(languageCode) {
        if (this.supportedLanguages.find(lang => lang.code === languageCode)) {
            this.currentLanguage = languageCode;
            return true;
        }
        return false;
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get all supported languages
     * @returns {array} Array of supported language objects
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Translate a key to the current language
     * @param {string} key - Translation key
     * @param {object} params - Parameters for interpolation
     * @returns {string} Translated text
     */
    translate(key, params = {}) {
        let translation = this.translations[this.currentLanguage]?.[key] ||
                         this.translations[this.fallbackLanguage]?.[key] ||
                         key;

        // Handle parameter interpolation
        if (params && typeof translation === 'string') {
            Object.keys(params).forEach(param => {
                const regex = new RegExp(`{${param}}`, 'g');
                translation = translation.replace(regex, params[param]);
            });
        }

        return translation;
    }

    /**
     * Alias for translate method
     */
    t(key, params = {}) {
        return this.translate(key, params);
    }

    /**
     * Get translation for multiple keys
     * @param {array} keys - Array of translation keys
     * @returns {object} Object with translations
     */
    translateMultiple(keys) {
        const translations = {};
        keys.forEach(key => {
            translations[key] = this.translate(key);
        });
        return translations;
    }

    /**
     * Detect browser language and set if supported
     */
    detectAndSetBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // Get base language code
        
        if (this.setLanguage(langCode)) {
            return langCode;
        }
        
        return this.currentLanguage;
    }

    /**
     * Get language direction (for RTL languages)
     * @param {string} languageCode - Language code
     * @returns {string} 'ltr' or 'rtl'
     */
    getLanguageDirection(languageCode = this.currentLanguage) {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
    }

    /**
     * Format number according to language locale
     * @param {number} number - Number to format
     * @param {object} options - Formatting options
     * @returns {string} Formatted number
     */
    formatNumber(number, options = {}) {
        try {
            return new Intl.NumberFormat(this.getLocale(), options).format(number);
        } catch (error) {
            return number.toString();
        }
    }

    /**
     * Format date according to language locale
     * @param {Date} date - Date to format
     * @param {object} options - Formatting options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        try {
            return new Intl.DateTimeFormat(this.getLocale(), options).format(date);
        } catch (error) {
            return date.toLocaleDateString();
        }
    }

    /**
     * Get locale string for current language
     * @returns {string} Locale string
     */
    getLocale() {
        const localeMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'it': 'it-IT',
            'pt': 'pt-PT',
            'ru': 'ru-RU',
            'ja': 'ja-JP',
            'ko': 'ko-KR',
            'zh': 'zh-CN'
        };
        
        return localeMap[this.currentLanguage] || 'en-US';
    }

    /**
     * Export translations for client-side use
     * @param {string} languageCode - Language to export
     * @returns {object} Translations object
     */
    exportTranslations(languageCode = this.currentLanguage) {
        return {
            language: languageCode,
            translations: this.translations[languageCode] || {},
            fallback: this.translations[this.fallbackLanguage] || {}
        };
    }
}

module.exports = new InternationalizationManager();
