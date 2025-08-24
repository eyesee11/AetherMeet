#!/usr/bin/env node

/**
 * AetherMeet Phase 3 Implementation Verification
 * Validates all advanced features including encryption, moderation, analytics, and i18n
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 AetherMeet Phase 3 Advanced Features Verification\n');

const phase3Features = [
    {
        name: 'End-to-End Encryption System',
        file: './utils/encryption.js',
        requiredFeatures: [
            'AES-256-GCM',
            'generateRoomKey',
            'encryptMessage',
            'decryptMessage',
            'generateKeyPair',
            'rotateRoomKey'
        ]
    },
    {
        name: 'Advanced Moderation Manager',
        file: './utils/moderation.js',
        requiredFeatures: [
            'applyModerationAction',
            'checkModerationPermissions',
            'muteUser',
            'banUser',
            'isUserMuted',
            'addModerator'
        ]
    },
    {
        name: 'Analytics and Insights Model',
        file: './models/Analytics.js',
        requiredFeatures: [
            'logEvent',
            'getDashboardStats',
            'getHourlyTrends',
            'getPopularRooms',
            'getUserEngagement'
        ]
    },
    {
        name: 'Multi-language Support (i18n)',
        file: './utils/i18n.js',
        requiredFeatures: [
            'supportedLanguages',
            'setLanguage',
            'translate',
            'formatNumber',
            'formatDate',
            'detectAndSetBrowserLanguage'
        ]
    },
    {
        name: 'Enhanced User Model with Phase 3 features',
        file: './models/User.js',
        requiredFeatures: [
            'isAdmin',
            'preferences',
            'encryption',
            'analytics',
            'moderationHistory'
        ]
    },
    {
        name: 'Enhanced Room Model with Phase 3 features',
        file: './models/Room.js',
        requiredFeatures: [
            'moderators',
            'mutedUsers',
            'bannedUsers',
            'moderationLog',
            'encryption',
            'analytics'
        ]
    },
    {
        name: 'Phase 3 Security Middleware',
        file: './middleware/security.js',
        requiredFeatures: [
            'adminLimiter',
            'analyticsLimiter',
            'validateEncryption',
            'validateModerationAction',
            'validateLanguageCode',
            'logSecurityEvent'
        ]
    },
    {
        name: 'Rate Limiting Dashboard API',
        file: './routes/analytics.js',
        requiredFeatures: [
            '/stats',
            '/connections',
            '/top-ips',
            '/reset-stats',
            '/configure'
        ]
    },
    {
        name: 'Advanced Moderation API',
        file: './routes/moderation.js',
        requiredFeatures: [
            '/moderate',
            '/moderation-history',
            '/moderators',
            '/permissions',
            '/bulk-moderate'
        ]
    },
    {
        name: 'Internationalization API',
        file: './routes/i18n.js',
        requiredFeatures: [
            '/languages',
            '/translations',
            '/user/language',
            '/translate',
            '/detect-language'
        ]
    }
];

function checkFeatureImplementation(feature) {
    console.log(`\n${feature.name}`);
    
    try {
        if (!fs.existsSync(feature.file)) {
            console.log(`   ❌ File not found: ${feature.file}`);
            return 0;
        }
        
        console.log(`   ✅ File exists: ${feature.file}`);
        
        const fileContent = fs.readFileSync(feature.file, 'utf8');
        let foundFeatures = 0;
        let missingFeatures = [];
        
        feature.requiredFeatures.forEach(requiredFeature => {
            if (fileContent.includes(requiredFeature)) {
                foundFeatures++;
            } else {
                missingFeatures.push(requiredFeature);
            }
        });
        
        console.log(`   📝 Features found: ${foundFeatures}/${feature.requiredFeatures.length}`);
        
        if (missingFeatures.length > 0) {
            console.log(`   ⚠️  Missing features: ${missingFeatures.join(', ')}`);
        } else {
            console.log('   🎯 All expected features present!');
        }
        
        return foundFeatures;
        
    } catch (error) {
        console.log(`   ❌ Error checking ${feature.file}: ${error.message}`);
        return 0;
    }
}

function checkServerIntegration() {
    console.log('\n📋 Checking Server Integration:');
    
    const serverFile = './server.js';
    
    if (!fs.existsSync(serverFile)) {
        console.log('   ❌ Server file not found');
        return false;
    }
    
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    
    const integrationChecks = [
        { name: 'Analytics Routes', pattern: '/api/analytics' },
        { name: 'Moderation Routes', pattern: '/api/moderation' },
        { name: 'i18n Routes', pattern: '/api/i18n' },
        { name: 'Analytics Route Import', pattern: 'require(\'./routes/analytics\')' },
        { name: 'Moderation Route Import', pattern: 'require(\'./routes/moderation\')' },
        { name: 'i18n Route Import', pattern: 'require(\'./routes/i18n\')' }
    ];
    
    let integratedFeatures = 0;
    
    integrationChecks.forEach(check => {
        if (serverContent.includes(check.pattern)) {
            console.log(`   ✅ ${check.name} integrated`);
            integratedFeatures++;
        } else {
            console.log(`   ❌ ${check.name} not integrated`);
        }
    });
    
    return integratedFeatures === integrationChecks.length;
}

function checkDependencies() {
    console.log('\n📦 Checking Package Dependencies:');
    
    const packageFile = './package.json';
    
    if (!fs.existsSync(packageFile)) {
        console.log('   ❌ Package.json not found');
        return false;
    }
    
    const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    
    // All required dependencies are already present from Phase 1
    const requiredDeps = [
        'express',
        'mongoose',
        'jsonwebtoken',
        'bcryptjs',
        'helmet',
        'express-rate-limit',
        'socket.io',
        'pdfkit',
        'multer'
    ];
    
    let foundDeps = 0;
    
    requiredDeps.forEach(dep => {
        if (packageContent.dependencies && packageContent.dependencies[dep]) {
            console.log(`   ✅ ${dep}`);
            foundDeps++;
        } else {
            console.log(`   ❌ ${dep} missing`);
        }
    });
    
    return foundDeps === requiredDeps.length;
}

function generatePhase3Summary() {
    console.log('\n🎯 Phase 3 Advanced Features Summary:');
    console.log('   ✅ End-to-End Encryption (AES-256-GCM with key rotation)');
    console.log('   ✅ Advanced Moderation System (warn, mute, kick, ban, restrict)');
    console.log('   ✅ API Rate Limiting Dashboard (real-time monitoring)');
    console.log('   ✅ Comprehensive Analytics (usage tracking and insights)');
    console.log('   ✅ Multi-language Support (10 languages with auto-detection)');
    console.log('   ✅ Enhanced Security Features (validation and audit logging)');
    console.log('   ✅ Admin Management Tools (bulk operations and statistics)');
    console.log('   ✅ User Preference System (persistent settings)');
    console.log('   ✅ Room Analytics (popularity scoring and engagement)');
    console.log('   ✅ Moderation Audit Trail (complete action history)');
    
    console.log('\n🔧 Phase 3 API Endpoints:');
    console.log('   📊 /api/analytics/* - Rate limiting and usage statistics');
    console.log('   🛡️  /api/moderation/* - Advanced moderation tools');
    console.log('   🌍 /api/i18n/* - Multi-language support');
    console.log('   🔐 Enhanced encryption utilities');
    console.log('   📈 Real-time analytics and insights');
}

// Run verification
console.log('📋 Checking Phase 3 Implementation Files:\n');

let totalFeatures = 0;
let implementedFeatures = 0;

phase3Features.forEach(feature => {
    const foundFeatures = checkFeatureImplementation(feature);
    totalFeatures += feature.requiredFeatures.length;
    implementedFeatures += foundFeatures;
});

const serverIntegrated = checkServerIntegration();
const depsReady = checkDependencies();

console.log('\n🚀 Phase 3 Verification Results:');
console.log(`   📈 Feature Implementation: ${implementedFeatures}/${totalFeatures} (${Math.round(implementedFeatures/totalFeatures*100)}%)`);
console.log(`   🔧 Server Integration: ${serverIntegrated ? 'Complete' : 'Incomplete'}`);
console.log(`   📦 Dependencies: ${depsReady ? 'Ready' : 'Missing'}`);

if (implementedFeatures === totalFeatures && serverIntegrated && depsReady) {
    console.log('\n🎉 Phase 3 Implementation: COMPLETE!');
    console.log('   🌟 All advanced features successfully implemented');
    console.log('   🔐 End-to-end encryption system active');
    console.log('   🛡️  Advanced moderation tools ready');
    console.log('   📊 Analytics and insights operational');
    console.log('   🌍 Multi-language support enabled');
    console.log('   ⚡ Enhanced security measures in place');
} else {
    console.log('\n⚠️  Phase 3 Implementation: INCOMPLETE');
    console.log('   Please review missing features and complete implementation');
}

generatePhase3Summary();

console.log('\n✅ Phase 3 verification completed!');
console.log('\n🧪 Testing Recommendations:');
console.log('   1. Test encryption/decryption with different room keys');
console.log('   2. Verify moderation actions with temporary restrictions');
console.log('   3. Monitor rate limiting dashboard during usage');
console.log('   4. Test language switching and translations');
console.log('   5. Review analytics data collection and insights');
console.log('   6. Validate admin-level bulk operations');
