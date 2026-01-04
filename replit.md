# Email Sender App

## Overview
A Next.js-based bulk email sending application with WebSocket real-time communication. The app allows users to configure SMTP settings and send emails to multiple recipients with progress tracking.

## Project Structure
- `server.js` - Custom Node.js server that combines Next.js with WebSocket handling
- `src/app/` - Next.js App Router pages and layouts
- `src/lib/` - Utility functions
- `access_keys.json` - Access key storage for authentication

## Key Features
- Access key authentication with browser fingerprinting
- SMTP configuration with provider presets (Gmail, Outlook, SendGrid, AWS SES)
- Bulk email sending with real-time progress updates via WebSocket
- Dynamic URL personalization in emails

## Running the Application
- Development: `npm run dev` (runs on port 5000)
- Production: `npm start`

## Configuration
- Server binds to `0.0.0.0:5000` for Replit compatibility
- WebSocket endpoint: `/ws`

## Deployment
Configured for VM deployment (required for WebSocket support)
- Build: `npm run build`
- Run: `npm start`
