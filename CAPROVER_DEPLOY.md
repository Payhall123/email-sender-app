# CapRover Deployment Guide

This guide will help you deploy the Email Sender App to CapRover.

## Prerequisites

- CapRover instance running
- Domain configured in CapRover
- Git repository accessible

## Deployment Steps

### 1. Create a New App in CapRover

1. Log into your CapRover dashboard
2. Click "Create New App"
3. Choose "From Source Code" or "From Git Repository"
4. Enter your app name (e.g., `email-sender-app`)
5. Select your CapRover server

### 2. Configure App Settings

1. **App Name**: `email-sender-app`
2. **Has Persistent Data**: Yes (for access keys storage)
3. **Instance Count**: 1
4. **Captain Definition Path**: `./captain-definition`

### 3. Environment Variables

Set the following environment variables in CapRover:

```
NODE_ENV=production
PORT=3000
```

### 4. Persistent Storage

The app uses `access_keys.json` for storing access keys. Make sure persistent storage is enabled for the app.

### 5. Deploy

1. If deploying from Git:

   - Enter your repository URL
   - Set branch to `main` or your deployment branch
   - CapRover will automatically build and deploy

2. If deploying from source:
   - Upload the source code
   - CapRover will use the Dockerfile and captain-definition

### 6. Configure Domain

1. Go to the app settings in CapRover
2. Add your custom domain
3. Configure SSL certificate (Let's Encrypt is recommended)

## Post-Deployment Setup

### 1. Access Keys Setup

After deployment, you'll need to set up access keys:

1. SSH into your CapRover server or use the web terminal
2. Navigate to your app directory: `/captain/app-directory`
3. Create or upload your `access_keys.json` file

### 2. Environment Variables (Optional)

You can set additional environment variables through CapRover for:

- SMTP configurations (if needed)
- Custom ports
- Other app-specific settings

## Troubleshooting

### WebSocket Connection Issues

If WebSocket connections fail:

1. Check that the app is running on the correct port (3000)
2. Verify that your CapRover instance supports WebSocket connections
3. Check firewall settings for WebSocket traffic

### Build Issues

If the build fails:

1. Check the build logs in CapRover dashboard
2. Ensure all dependencies are properly listed in `package.json`
3. Verify that the Dockerfile is correct

### Access Key Issues

If authentication fails:

1. Verify that `access_keys.json` exists in the app directory
2. Check file permissions
3. Ensure the JSON format is correct

## File Structure

```
email-sender-app/
├── captain-definition    # CapRover app definition
├── Dockerfile           # Docker build instructions
├── .dockerignore        # Files to exclude from Docker build
├── package.json         # Node.js dependencies
├── server.js           # Custom server with WebSocket support
├── src/                # Next.js source code
├── access_keys.json    # Access keys (create after deployment)
└── public/             # Static assets
```

## Support

For CapRover-specific issues, refer to the [CapRover documentation](https://caprover.com/docs/).

For app-specific issues, check the main README.md file.
