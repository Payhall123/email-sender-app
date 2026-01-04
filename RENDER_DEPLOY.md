# Render Deployment Guide

This guide will help you deploy the Email Sender App to Render.

## Prerequisites

- Render account (free tier available)
- Git repository (GitHub or GitLab)
- Domain (optional, for custom domain)

## Deployment Steps

### 1. Connect Your Repository

1. Log into your [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub/GitLab account
4. Select your `email-sender-app` repository

### 2. Configure Web Service

Render will automatically detect your `render.yaml` file and configure the service:

- **Name**: email-sender-app
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node server.js`
- **Plan**: Starter (required for WebSocket support - Free tier has limitations)

### 3. Environment Variables

The following environment variables are already configured in `render.yaml`:

- `NODE_ENV=production`
- `PORT=10000`

### 4. Deploy

1. Click "Create Web Service"
2. Render will build and deploy your app automatically
3. The deployment usually takes 5-10 minutes

### 5. Custom Domain (Optional)

1. Go to your service settings
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is provided automatically

## Post-Deployment Setup

### 1. Access Keys Setup

After deployment, you'll need to set up access keys:

1. Go to your Render service dashboard
2. Click "Shell" to access the app's terminal
3. Create or upload your `access_keys.json` file:
   ```bash
   # Create access keys file
   nano access_keys.json
   ```

### 2. Environment Variables (Optional)

You can add additional environment variables through the Render dashboard:

- SMTP configurations
- Custom settings
- API keys

## File Structure

```
email-sender-app/
├── render.yaml           # Render service configuration
├── Dockerfile            # Docker build instructions (alternative)
├── package.json          # Node.js dependencies
├── server.js            # Custom server with WebSocket support
├── src/                 # Next.js source code
├── access_keys.json     # Access keys (create after deployment)
└── public/              # Static assets
```

## Troubleshooting

### Build Issues

If the build fails:

1. Check the build logs in Render dashboard
2. Ensure all dependencies are in `package.json`
3. Verify that `render.yaml` is in the root directory
4. Check that the build/start commands are correct

### WebSocket Connection Issues

If WebSocket connections fail:

1. Verify the app is running on port 10000
2. Check that WebSocket traffic is allowed
3. Review firewall settings (Render handles this automatically)

### Access Key Issues

If authentication fails:

1. Verify `access_keys.json` exists in the app directory
2. Check file permissions
3. Ensure correct JSON format

## Cost Estimation

- **Free Tier**: $0/month (750 hours/month, sleeps after 15min inactivity)
- **Starter Plan**: $7/month (750 hours/month, no sleeping)
- **Paid Plans**: From $7-89/month depending on resources
- **SSL Certificate**: Free
- **Custom Domain**: Free (bring your own domain)

## WebSocket Support

Render supports WebSocket connections through persistent connections. Your custom `server.js` file handles WebSocket server setup, providing real-time email sending updates.

## Support

For Render-specific issues, refer to the [Render Documentation](https://docs.render.com/).

For app-specific issues, check the main README.md file.
