const express = require('express');
const { authenticateToken } = require('../utils/helpers');
const { validateLanguageCode } = require('../middleware/security');
const i18n = require('../utils/i18n');
const User = require('../models/User');

const router = express.Router();

/**
 * Internationalization (i18n) API Routes
 * Provides multi-language support and localization
 */

// Get supported languages
router.get('/languages', (req, res) => {
    try {
        const languages = i18n.getSupportedLanguages();
        
        res.json({
            success: true,
            data: {
                languages,
                currentLanguage: i18n.getCurrentLanguage(),
                total: languages.length
            }
        });

    } catch (error) {
        console.error('Get languages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve supported languages'
        });
    }
});

// Get translations for a specific language
router.get('/translations/:languageCode', (req, res) => {
    try {
        const { languageCode } = req.params;
        
        // Validate language code
        validateLanguageCode(languageCode);
        
        const translations = i18n.exportTranslations(languageCode);
        
        res.json({
            success: true,
            data: translations
        });

    } catch (error) {
        console.error('Get translations error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get current user's language preference
router.get('/user/language', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userLanguage = user.preferences?.language || 'en';
        const languageInfo = i18n.getSupportedLanguages().find(lang => lang.code === userLanguage);

        res.json({
            success: true,
            data: {
                languageCode: userLanguage,
                languageInfo,
                direction: i18n.getLanguageDirection(userLanguage),
                locale: i18n.getLocale()
            }
        });

    } catch (error) {
        console.error('Get user language error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user language preference'
        });
    }
});

// Update user's language preference
router.put('/user/language', authenticateToken, async (req, res) => {
    try {
        const { languageCode } = req.body;
        
        if (!languageCode) {
            return res.status(400).json({
                success: false,
                message: 'Language code is required'
            });
        }

        // Validate language code
        validateLanguageCode(languageCode);

        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user preferences
        if (!user.preferences) {
            user.preferences = {};
        }
        user.preferences.language = languageCode;
        await user.save();

        // Set the i18n current language for this session
        i18n.setLanguage(languageCode);

        const languageInfo = i18n.getSupportedLanguages().find(lang => lang.code === languageCode);

        res.json({
            success: true,
            message: 'Language preference updated successfully',
            data: {
                languageCode,
                languageInfo,
                direction: i18n.getLanguageDirection(languageCode),
                locale: i18n.getLocale()
            }
        });

    } catch (error) {
        console.error('Update user language error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Translate specific keys
router.post('/translate', (req, res) => {
    try {
        const { keys, languageCode, params } = req.body;
        
        if (!keys || !Array.isArray(keys)) {
            return res.status(400).json({
                success: false,
                message: 'Keys array is required'
            });
        }

        // Set language if provided
        const originalLanguage = i18n.getCurrentLanguage();
        if (languageCode) {
            validateLanguageCode(languageCode);
            i18n.setLanguage(languageCode);
        }

        const translations = {};
        keys.forEach(key => {
            translations[key] = i18n.translate(key, params);
        });

        // Restore original language
        if (languageCode) {
            i18n.setLanguage(originalLanguage);
        }

        res.json({
            success: true,
            data: {
                translations,
                languageCode: languageCode || i18n.getCurrentLanguage()
            }
        });

    } catch (error) {
        console.error('Translate keys error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Format number according to language locale
router.post('/format/number', (req, res) => {
    try {
        const { number, languageCode, options } = req.body;
        
        if (number === undefined || number === null) {
            return res.status(400).json({
                success: false,
                message: 'Number is required'
            });
        }

        // Set language if provided
        const originalLanguage = i18n.getCurrentLanguage();
        if (languageCode) {
            validateLanguageCode(languageCode);
            i18n.setLanguage(languageCode);
        }

        const formattedNumber = i18n.formatNumber(number, options || {});

        // Restore original language
        if (languageCode) {
            i18n.setLanguage(originalLanguage);
        }

        res.json({
            success: true,
            data: {
                originalNumber: number,
                formattedNumber,
                languageCode: languageCode || i18n.getCurrentLanguage(),
                locale: i18n.getLocale()
            }
        });

    } catch (error) {
        console.error('Format number error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Format date according to language locale
router.post('/format/date', (req, res) => {
    try {
        const { date, languageCode, options } = req.body;
        
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Set language if provided
        const originalLanguage = i18n.getCurrentLanguage();
        if (languageCode) {
            validateLanguageCode(languageCode);
            i18n.setLanguage(languageCode);
        }

        const formattedDate = i18n.formatDate(dateObj, options || {});

        // Restore original language
        if (languageCode) {
            i18n.setLanguage(originalLanguage);
        }

        res.json({
            success: true,
            data: {
                originalDate: date,
                formattedDate,
                languageCode: languageCode || i18n.getCurrentLanguage(),
                locale: i18n.getLocale()
            }
        });

    } catch (error) {
        console.error('Format date error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Detect browser language
router.get('/detect-language', (req, res) => {
    try {
        const acceptLanguage = req.get('Accept-Language');
        let detectedLanguage = 'en'; // default

        if (acceptLanguage) {
            // Parse Accept-Language header
            const languages = acceptLanguage
                .split(',')
                .map(lang => {
                    const parts = lang.trim().split(';');
                    const code = parts[0].split('-')[0]; // Get base language code
                    const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
                    return { code, quality };
                })
                .sort((a, b) => b.quality - a.quality);

            // Find first supported language
            const supportedCodes = i18n.getSupportedLanguages().map(lang => lang.code);
            for (const lang of languages) {
                if (supportedCodes.includes(lang.code)) {
                    detectedLanguage = lang.code;
                    break;
                }
            }
        }

        const languageInfo = i18n.getSupportedLanguages().find(lang => lang.code === detectedLanguage);

        res.json({
            success: true,
            data: {
                detectedLanguage,
                languageInfo,
                acceptLanguageHeader: acceptLanguage,
                direction: i18n.getLanguageDirection(detectedLanguage)
            }
        });

    } catch (error) {
        console.error('Detect language error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to detect language'
        });
    }
});

// Get language usage statistics (admin only)
router.get('/admin/language-stats', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Aggregate language usage statistics
        const languageStats = await User.aggregate([
            {
                $group: {
                    _id: '$preferences.language',
                    userCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    languageCode: { $ifNull: ['$_id', 'en'] },
                    userCount: 1
                }
            },
            {
                $sort: { userCount: -1 }
            }
        ]);

        // Add language info
        const supportedLanguages = i18n.getSupportedLanguages();
        const enrichedStats = languageStats.map(stat => {
            const languageInfo = supportedLanguages.find(lang => lang.code === stat.languageCode);
            return {
                ...stat,
                languageInfo: languageInfo || { code: stat.languageCode, name: 'Unknown' }
            };
        });

        const totalUsers = await User.countDocuments();

        res.json({
            success: true,
            data: {
                languageStats: enrichedStats,
                totalUsers,
                supportedLanguages: supportedLanguages.length
            }
        });

    } catch (error) {
        console.error('Language stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve language statistics'
        });
    }
});

module.exports = router;
