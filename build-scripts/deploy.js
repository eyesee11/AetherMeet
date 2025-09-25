#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 AetherMeet Production Deployment Script');
console.log('==========================================\n');

const deploymentOptions = {
    heroku: 'Deploy to Heroku',
    docker: 'Build Docker container',
    pm2: 'Deploy with PM2',
    systemd: 'Create systemd service',
    static: 'Prepare for static hosting'
};

function runCommand(command, description) {
    console.log(`\n🔄 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} completed`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        return false;
    }
}

function createPM2Config() {
    const pm2Config = {
        apps: [{
            name: 'aethermeet',
            script: 'server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: process.env.PORT || 3000
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            max_memory_restart: '1G',
            node_args: '--max-old-space-size=1024'
        }]
    };
    
    fs.writeFileSync('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
    console.log('✅ PM2 configuration created: ecosystem.config.js');
}

function createSystemdService() {
    const serviceContent = `[Unit]
Description=AetherMeet - Secure Team Chat Rooms
Documentation=https://github.com/your-repo/aethermeet
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/aethermeet
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=aethermeet
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target`;

    fs.writeFileSync('aethermeet.service', serviceContent);
    console.log('✅ Systemd service file created: aethermeet.service');
    console.log('   Install with: sudo cp aethermeet.service /etc/systemd/system/');
    console.log('   Enable with: sudo systemctl enable aethermeet');
    console.log('   Start with: sudo systemctl start aethermeet');
}

function showHerokuInstructions() {
    console.log(`
📋 Heroku Deployment Instructions:
==================================

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login to Heroku: heroku login
3. Create app: heroku create your-app-name
4. Set environment variables:
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SESSION_SECRET=your_session_secret
5. Deploy: git push heroku main

Note: Your heroku-postbuild script will automatically run the build process.
`);
}

function showDockerInstructions() {
    console.log(`
📋 Docker Deployment Instructions:
==================================

1. Build image: docker build -t aethermeet .
2. Run container: docker run -p 3000:3000 --env-file .env aethermeet

For Docker Compose, create docker-compose.yml:
---
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./storage:/app/storage
    restart: unless-stopped
---
`);
}

// Main deployment process
console.log('Available deployment options:');
Object.entries(deploymentOptions).forEach(([key, value], index) => {
    console.log(`${index + 1}. ${value} (${key})`);
});

console.log('\n🔨 Running build process...');

// Run the build
if (!runCommand('npm run build', 'Building application')) {
    console.error('❌ Build failed. Cannot proceed with deployment.');
    process.exit(1);
}

// Create deployment artifacts
console.log('\n📦 Creating deployment configurations...');

createPM2Config();
createSystemdService();

console.log('\n🎯 Deployment options ready!');
console.log('\nChoose your deployment method:');

showHerokuInstructions();
showDockerInstructions();

console.log(`
📋 PM2 Deployment Instructions:
===============================

1. Install PM2: npm install -g pm2
2. Start app: pm2 start ecosystem.config.js --env production
3. Save PM2 process list: pm2 save
4. Set PM2 to start on boot: pm2 startup

📋 Manual Server Deployment:
============================

1. Upload files to your server
2. Install dependencies: npm ci --production
3. Set environment variables in .env file
4. Start with: NODE_ENV=production npm start

🔐 Don't forget to:
==================
- Set up SSL/TLS certificates
- Configure firewall rules
- Set up monitoring and logging
- Configure backup strategies
- Set strong environment variables

✅ Build and configuration complete!
`);