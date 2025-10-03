# Kilo Code Web Interface Deployment Guide

This guide explains how to deploy the Kilo Code web interface using PM2 for production hosting.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- PM2 installed globally: `npm install -g pm2`
- Kilo Code API token

### 2. Setup Environment
```bash
# Clone and install dependencies
git clone <repository>
cd kilocode
pnpm install

# Configure environment
cp ecosystem.config.example.js ecosystem.config.js
# Edit ecosystem.config.js and replace YOUR_KILOCODE_TOKEN_HERE with your actual token

# Copy server environment file
cp apps/kilo-web-server/.env.example apps/kilo-web-server/.env
# Edit apps/kilo-web-server/.env and add your KILOCODE_TOKEN
```

### 3. Deploy with PM2
```bash
# Start both services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Stop services
pm2 stop ecosystem.config.js

# Restart services
pm2 restart ecosystem.config.js
```

## 📡 Service Configuration

### Services
- **kilo-web-server**: WebSocket server running on port 3001
- **kilo-web-client**: React web app running on port 8080

### Ports
- **Web Interface**: `http://your-server:8080`
- **WebSocket Server**: `ws://your-server:3001/ws`
- **Health Check**: `http://your-server:3001/health`

### Environment Variables
- `KILOCODE_TOKEN`: Your Kilo Code API token (required)
- `NODE_ENV`: Set to 'production' for production deployment
- `PORT`: Override default ports if needed

## 🔧 Configuration

### PM2 Ecosystem Features
- **Auto-restart**: Services automatically restart on failure
- **Memory limits**: 1GB memory limit per service
- **Logging**: Separate log files for each service in `./logs/`
- **Process management**: Easy start/stop/restart of all services

### Log Files
- `./logs/kilo-web-server-*.log`: WebSocket server logs
- `./logs/kilo-web-client-*.log`: React app logs

### CORS Configuration
The server is configured to accept connections from:
- `localhost:3000` (development)
- `localhost:8080` (production web app)
- `your-server-ip:8080` (remote hosting)

## 🌐 Remote Hosting

### Dynamic WebSocket Connection
The React client automatically detects the current host and connects to the appropriate WebSocket endpoint:
- **Local**: `ws://localhost:3001/ws`
- **Remote**: `ws://your-server-ip:3001/ws`

### Firewall Configuration
Ensure these ports are open:
- **8080**: Web interface (HTTP)
- **3001**: WebSocket server

## 🛠️ Development vs Production

### Development
```bash
# Terminal 1: Start WebSocket server
cd apps/kilo-web-server && pnpm run dev

# Terminal 2: Start React app
cd apps/kilo-web-client && pnpm start
```

### Production
```bash
# Use PM2 for production deployment
pm2 start ecosystem.config.js
```

## 📊 Monitoring

### PM2 Commands
```bash
# View real-time logs
pm2 logs

# Monitor resource usage
pm2 monit

# View detailed process info
pm2 show kilo-web-server
pm2 show kilo-web-client

# Restart specific service
pm2 restart kilo-web-server
pm2 restart kilo-web-client
```

### Health Checks
- **Server Health**: `GET http://your-server:3001/health`
- **Server Stats**: `GET http://your-server:3001/stats`

## 🔐 Security Notes

- Keep your `ecosystem.config.js` file secure (it contains your API token)
- The `ecosystem.config.example.js` is safe to commit (contains placeholders)
- Logs directory is automatically ignored by git
- Environment files (`.env`) are ignored by git

## 🎯 Architecture

- **Thin Client**: React app handles only UI rendering
- **Heavy Server**: WebSocket server contains all Kilo Code orchestration logic
- **Shared Package**: VSCode-independent code shared between web and VSCode extension
- **Real Integration**: Uses actual Kilo Code API and Task orchestration