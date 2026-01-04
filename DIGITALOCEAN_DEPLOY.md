# Digital Ocean App Platform Deployment Guide

This guide will help you deploy the Email Sender App to Digital Ocean App Platform.

## Prerequisites

- Digital Ocean account
- Git repository (GitHub, GitLab, or Bitbucket)
- Domain (optional, for custom domain)
j
## Deployment Steps

### 1. Prepare Your Repository

1. Make sure your code is pushed to a Git repository
2. Update the `.do/app.yaml` file with your actual repository information:
   ```yaml
   github:
     repo: your-actual-github-username/email-sender-app
     branch: main
   ```

### 2. Create App on Digital Ocean

1. Log into your [Digital Ocean Dashboard](https://cloud.digitalocean.com/)
2. Click "Create" → "Apps"
3. Choose your Git repository
4. Select the repository and branch
5. Digital Ocean will automatically detect the `.do/app.yaml` file

### 3. Configure App Settings

The app will be configured automatically from the `.do/app.yaml` file:

- **Runtime**: Docker (using your Dockerfile)
- **Instance Size**: Basic XXS (can be upgraded later)
- **Environment Variables**: NODE_ENV=production, PORT=8080

### 4. Deploy

1. Review the configuration
2. Click "Create Resources"
3. Wait for the build and deployment to complete (usually 5-10 minutes)

### 5. Configure Domain (Optional)

1. Go to your app settings
2. Add your custom domain
3. Update DNS records as instructed
4. Enable SSL certificate (free with App Platform)

## Post-Deployment Setup

### 1. Access Keys Setup

After deployment, you'll need to set up access keys:

1. Go to your app in Digital Ocean dashboard
2. Click "Console" to access the app's terminal
3. Create or upload your `access_keys.json` file:
   ```bash
   # Create access keys file
   nano access_keys.json
   ```

### 2. Environment Variables (Optional)

You can add additional environment variables through the Digital Ocean dashboard:

- SMTP configurations
- Custom settings
- API keys

## File Structure

```
email-sender-app/
├── .do/
│   └── app.yaml          # Digital Ocean app specification
├── Dockerfile            # Docker build instructions
├── .dockerignore         # Files to exclude from Docker build
├── package.json          # Node.js dependencies
├── server.js            # Custom server with WebSocket support
├── src/                 # Next.js source code
├── access_keys.json     # Access keys (create after deployment)
└── public/              # Static assets
```

## Troubleshooting

### Build Issues

If the build fails:

1. Check the build logs in Digital Ocean dashboard
2. Ensure all dependencies are in `package.json`
3. Verify the Dockerfile is correct
4. Check that `.do/app.yaml` is properly formatted

### WebSocket Connection Issues

If WebSocket connections fail:

1. Verify the app is running on port 8080
2. Check that WebSocket traffic is allowed
3. Review firewall settings

### Access Key Issues

If authentication fails:

1. Verify `access_keys.json` exists in the app directory
2. Check file permissions
3. Ensure correct JSON format

## Cost Estimation

- **Basic XXS Instance**: ~$6/month
- **Outbound Data Transfer**: $0.01/GB
- **SSL Certificate**: Free
- **Custom Domain**: Free (bring your own domain)

## Support

For Digital Ocean App Platform issues, refer to the [Digital Ocean Documentation](https://docs.digitalocean.com/products/app-platform/).

For app-specific issues, check the main README.md file.
