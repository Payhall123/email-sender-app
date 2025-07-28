# Amazon SES Setup Guide

Your email sender app has been configured to use **Amazon SES (Simple Email Service)** exclusively. Here's how to set it up:

## 1. Create AWS Account and Configure SES

### Step 1: AWS Account Setup
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Create an AWS account if you don't have one
3. Navigate to **Amazon SES** service

### Step 2: Verify Your Email Domain
1. In SES Console, go to **Configuration** → **Verified identities**
2. Click **Create identity**
3. Choose **Domain** and enter your domain (e.g., `em4793.redwon.shop`)
4. Follow the DNS verification process
5. Alternatively, you can verify individual email addresses for testing

### Step 3: Request Production Access
- By default, SES is in **sandbox mode** (can only send to verified emails)
- To send to any email address, request production access:
  1. Go to **Account dashboard** → **Request production access**
  2. Fill out the form explaining your use case
  3. Wait for approval (usually 24-48 hours)

### Step 4: Get AWS Credentials
1. Go to **IAM** service in AWS Console
2. Create a new user with **Programmatic access**
3. Attach the **AmazonSESFullAccess** policy
4. Save the **Access Key ID** and **Secret Access Key**

## 2. Configure Environment Variables

Create a `.env` file in your project root with these variables:

```env
# Amazon SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Email Configuration
FROM_EMAIL=support@em4793.redwon.shop
```

## 3. Environment Variables Explanation

- **AWS_REGION**: The AWS region where your SES service is set up (default: us-east-1)
- **AWS_ACCESS_KEY_ID**: Your AWS access key
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret key
- **FROM_EMAIL**: The verified email address to send from

## 4. Testing Your Setup

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Test with verified emails first** (if in sandbox mode):
   - Send test emails to verified email addresses
   - Check AWS SES console for sending statistics

3. **Monitor your usage**:
   - Check AWS SES dashboard for bounce/complaint rates
   - Monitor your sending quota and rate limits

## 5. Amazon SES Limits and Features

### Free Tier Benefits
- 62,000 emails per month when sent from EC2
- 200 emails per day for applications hosted outside AWS

### Sending Limits
- **Sending rate**: Starts at 1 email per second
- **Daily quota**: Starts at 200 emails per day
- Both limits increase automatically based on your sending behavior

### Key Features
- ✅ **Reliable delivery**: High deliverability rates
- ✅ **Cost-effective**: $0.10 per 1,000 emails
- ✅ **Sender reputation**: Built-in reputation management
- ✅ **Analytics**: Detailed sending statistics
- ✅ **Bounce/complaint handling**: Automatic handling

## 6. Best Practices

1. **Warm up your sending**: Start with small volumes and gradually increase
2. **Monitor metrics**: Keep bounce rates < 5% and complaint rates < 0.1%
3. **Use verified domains**: Better deliverability than individual email verification
4. **Handle bounces**: Implement bounce and complaint handling
5. **List hygiene**: Remove invalid emails from your lists

## 7. Troubleshooting

### Common Issues

1. **"Email address not verified" error**:
   - Make sure your FROM_EMAIL is verified in SES console
   - If in sandbox mode, recipient emails must also be verified

2. **"Access denied" error**:
   - Check your AWS credentials
   - Ensure the IAM user has SES permissions

3. **"Sending quota exceeded" error**:
   - Check your daily sending limit in SES console
   - Request a limit increase if needed

4. **High bounce rate**:
   - Clean your email list
   - Use double opt-in for subscriptions

## 8. Advanced Configuration

### Custom Configuration Headers
You can modify the SES configuration in `server.js`:

```javascript
// Custom SES configuration
const sesClient = new SESClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  // Add custom configuration here
});
```

### Webhook Setup for Bounces/Complaints
Consider setting up SNS notifications for bounce and complaint handling:

1. Create SNS topics for bounces and complaints
2. Configure SES to publish to these topics
3. Set up webhooks to handle bounce/complaint events

## 9. Cost Estimation

**Example costs** (after free tier):
- 10,000 emails/month: ~$1.00
- 100,000 emails/month: ~$10.00
- 1,000,000 emails/month: ~$100.00

Much more cost-effective than most other email services!

## 10. Getting Support

- **AWS Support**: Available through AWS Console
- **SES Documentation**: [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/)
- **Community Forums**: [AWS re:Post](https://repost.aws/)

---

Your email sender app is now ready to use Amazon SES! 🚀
