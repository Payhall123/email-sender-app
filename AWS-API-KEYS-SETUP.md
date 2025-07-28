# Step-by-Step Guide: Getting Amazon SES API Keys

## 📋 **Prerequisites**
- A valid email address
- Credit card (required for AWS account, but SES has a generous free tier)
- Access to your domain's DNS settings (if you want to verify a domain)

---

## 🚀 **Step 1: Create AWS Account**

### 1.1 Go to AWS Website
- Open your browser and go to: **https://aws.amazon.com/**
- Click **"Create an AWS Account"** (top right corner)

### 1.2 Fill Account Details
- **Email address**: Enter your email
- **Password**: Create a strong password
- **Confirm password**: Re-enter password
- **AWS account name**: Enter a name for your account (e.g., "MyEmailApp")
- Click **Continue**

### 1.3 Contact Information
- **Account type**: Choose **Personal** (unless you're a business)
- Fill in your personal details:
  - Full name
  - Phone number
  - Country/Region
  - Address
- Click **Continue**

### 1.4 Payment Information
- Add your credit card details (required even for free tier)
- AWS won't charge you unless you exceed free tier limits
- Click **Continue**

### 1.5 Identity Verification
- AWS will call or SMS you for verification
- Choose your preferred method
- Enter the verification code when prompted
- Click **Continue**

### 1.6 Choose Support Plan
- Select **Basic support - Free** (recommended for getting started)
- Click **Complete sign up**

🎉 **Congratulations! Your AWS account is created.**

---

## 🔐 **Step 2: Access AWS Console**

### 2.1 Sign In
- Go to **https://aws.amazon.com/console/**
- Click **"Sign In to the Console"**
- Enter your email and password
- Click **Sign In**

### 2.2 Navigate to SES
- In the AWS Console, find the search bar at the top
- Type **"SES"** or **"Simple Email Service"**
- Click on **"Amazon Simple Email Service"**

---

## 📧 **Step 3: Set Up Amazon SES**

### 3.1 Choose Region
- In the top-right corner, select your region
- **Recommended**: **US East (N. Virginia) us-east-1**
- SES is available in limited regions, us-east-1 is always available

### 3.2 Verify Your Email Domain/Address

#### Option A: Verify Individual Email Address (Quick Start)
1. In SES Console, click **"Verified identities"** (left sidebar)
2. Click **"Create identity"**
3. Choose **"Email address"**
4. Enter: `support@em4793.redwon.shop`
5. Click **"Create identity"**
6. Check your email inbox for a verification email from AWS
7. Click the verification link in the email

#### Option B: Verify Entire Domain (Recommended for Production)
1. In SES Console, click **"Verified identities"** (left sidebar)
2. Click **"Create identity"**
3. Choose **"Domain"**
4. Enter your domain: `em4793.redwon.shop`
5. Click **"Create identity"**
6. AWS will show DNS records you need to add
7. Add these DNS records to your domain provider
8. Wait for verification (can take up to 72 hours)

---

## 🔑 **Step 4: Create IAM User for API Access**

### 4.1 Navigate to IAM
- In the AWS Console search bar, type **"IAM"**
- Click on **"IAM"** (Identity and Access Management)

### 4.2 Create New User
1. Click **"Users"** in the left sidebar
2. Click **"Create user"**
3. **User name**: Enter `ses-email-sender` (or any name you prefer)
4. **Enable console access**: **Uncheck** this (we only need programmatic access)
5. Click **"Next"**

### 4.3 Set Permissions
1. Choose **"Attach policies directly"**
2. In the search box, type: **"AmazonSESFullAccess"**
3. **Check the box** next to **"AmazonSESFullAccess"**
4. Click **"Next"**
5. Review the settings and click **"Create user"**

### 4.4 Create Access Keys
1. Click on the user you just created (`ses-email-sender`)
2. Click the **"Security credentials"** tab
3. Scroll down to **"Access keys"**
4. Click **"Create access key"**
5. Choose **"Application running outside AWS"**
6. Click **"Next"**
7. **Description tag**: Enter "Email Sender App" (optional)
8. Click **"Create access key"**

### 4.5 Save Your Credentials
⚠️ **IMPORTANT**: This is the only time you'll see the secret key!

You'll see:
- **Access key ID**: Something like `AKIAIOSFODNN7EXAMPLE`
- **Secret access key**: Something like `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**COPY BOTH VALUES IMMEDIATELY** - you'll need them for your app!

Click **"Done"**

---

## 📝 **Step 5: Configure Your App**

### 5.1 Create Environment File
1. In your project folder, create a file called `.env`
2. Add your credentials:

```env
# Amazon SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Email Configuration
FROM_EMAIL=support@em4793.redwon.shop
```

### 5.2 Test Your Setup
```bash
npm run dev
```

---

## 🧪 **Step 6: Test Email Sending**

### 6.1 If in Sandbox Mode (Default)
- You can only send emails to verified email addresses
- Add your test email address as a verified identity in SES Console
- Send a test email through your app

### 6.2 Request Production Access (For Real Use)
1. In SES Console, go to **"Account dashboard"**
2. Click **"Request production access"**
3. Fill out the form:
   - **Mail type**: Choose your use case (e.g., "Transactional")
   - **Website URL**: Your website
   - **Use case description**: Explain what you'll send emails for
   - **Additional contacts**: Add if needed
4. Submit the request
5. Wait for approval (usually 24-48 hours)

---

## 🔍 **Step 7: Verify Everything Works**

### 7.1 Check SES Console
- Go to SES Console → **"Account dashboard"**
- Check your sending statistics
- Monitor any bounces or complaints

### 7.2 Test Email Delivery
1. Send a test email through your app
2. Check if it arrives in the recipient's inbox
3. Check spam folder if not in inbox
4. Verify sender name appears correctly

---

## 🚨 **Important Security Notes**

### ✅ **Do's**:
- Keep your API keys secret and secure
- Use environment variables (never commit `.env` to git)
- Regularly rotate your access keys
- Monitor your usage in AWS Console

### ❌ **Don'ts**:
- Never share your secret access key
- Don't commit API keys to version control
- Don't use root account keys (always create IAM users)
- Don't exceed your sending limits

---

## 💰 **Pricing Information**

### Free Tier (First 12 months):
- **62,000 emails per month** when sent from Amazon EC2
- **200 emails per day** for applications outside AWS

### After Free Tier:
- **$0.10 per 1,000 emails** sent
- **$0.12 per 1,000 emails** received (if using inbound email)

### Example Costs:
- 10,000 emails/month: ~$1.00
- 100,000 emails/month: ~$10.00
- 1,000,000 emails/month: ~$100.00

---

## 🆘 **Troubleshooting Common Issues**

### Problem: "Email address not verified"
**Solution**: Verify your FROM_EMAIL in SES Console

### Problem: "Access Denied" 
**Solution**: Check your IAM user has SES permissions

### Problem: "Sending quota exceeded"
**Solution**: Check your limits in SES Console, request increase if needed

### Problem: Emails going to spam
**Solution**: 
- Verify your domain (not just email)
- Set up SPF, DKIM, and DMARC records
- Maintain good sending practices

---

## 📞 **Getting Help**

- **AWS Documentation**: https://docs.aws.amazon.com/ses/
- **AWS Support**: Available in AWS Console
- **Community**: https://repost.aws/

---

🎉 **You're all set!** Your Amazon SES API keys are ready to use with your email sender app.

**Next step**: Start your app with `npm run dev` and test sending an email!
