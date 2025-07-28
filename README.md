# Email Sender App with WebSocket

A modern email sender application built with Next.js and WebSocket for real-time email sending with toast notifications.

## Features

- 🚀 **WebSocket Integration**: Real-time email sending with live progress updates
- 🔔 **Toast Notifications**: Individual notifications for each email sent/failed
- ⚡ **Fast Performance**: WebSocket eliminates the need for polling and provides instant feedback
- 📧 **Multiple SMTP Support**: Automatic failover between multiple SMTP servers
- 🎯 **Real-time Progress**: See each email being sent in real-time
- ✅/❌ **Individual Status**: Toast notification for each email's success/failure status
- 📊 **Detailed Results**: Complete summary with success/failure breakdown

## What's Changed

### From API to WebSocket
- **Before**: Used REST API with slow response times and no real-time feedback
- **After**: WebSocket connection provides instant real-time updates for each email

### Toast Notifications
- Individual toast for each email being sent
- Success toasts for successful sends
- Error toasts for failed sends with specific error messages
- Final summary toast with overall results

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository** (if applicable)
   ```bash
   cd email-sender-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Running the Application

### Option 1: Run Both Servers Simultaneously (Recommended)
```bash
npm run dev
```
This will start both the Next.js development server (port 3000) and the WebSocket server (port 8080) concurrently.

### Option 2: Run Servers Separately
If you prefer to run them in separate terminals:

**Terminal 1 - Next.js Server:**
```bash
npm run dev:next
```

**Terminal 2 - WebSocket Server:**
```bash
npm run dev:ws
```

## Access the Application

- **Frontend**: http://localhost:3000
- **WebSocket Server**: ws://localhost:8080

## How It Works

### WebSocket Flow
1. User clicks "Send Emails"
2. Frontend establishes WebSocket connection to `ws://localhost:8080`
3. WebSocket server processes emails one by one
4. Real-time notifications are sent for each email:
   - `email-sending`: Toast shows "Sending to [email]"
   - `email-sent`: Success toast for successful sends
   - `email-failed`: Error toast for failed sends
   - `send-complete`: Final summary toast

### Toast Notifications
- **Connection**: "Connected to the email server"
- **SMTP Connected**: "Connected to SMTP: [smtp-email]"
- **Sending**: "📤 Sending to [recipient]"
- **Success**: "✅ Sent to [recipient]"
- **Failed**: "❌ Failed: [recipient]"
- **Complete**: "🎉 All X emails sent successfully!" or "⚠️ X sent, Y failed"

## Features

### Real-time Email Sending
- Each email is processed individually
- Real-time progress updates via WebSocket
- Individual toast notifications for each email
- No more waiting for bulk operations to complete

### SMTP Configuration
The app uses multiple SMTP credentials with automatic failover:
- Round-robin selection of SMTP credentials
- Automatic retry with different SMTP servers if one fails
- Support for multiple Namecheap Private Email accounts

### Error Handling
- Connection timeout handling
- Individual email failure tracking
- Detailed error messages in toast notifications
- Graceful WebSocket connection management

## File Structure

```
email-sender-app/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main frontend component with WebSocket integration
│   │   └── api/
│   │       └── send-email/   # Original API (still available as backup)
├── websocket-server.js       # Standalone WebSocket server
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Development Scripts

- `npm run dev` - Run both Next.js and WebSocket servers
- `npm run dev:next` - Run only Next.js development server
- `npm run dev:ws` - Run only WebSocket server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### WebSocket Connection Issues
- Ensure the WebSocket server is running on port 8080
- Check that port 8080 is not blocked by firewall
- Verify the WebSocket server started successfully (check console output)

### Email Sending Issues
- Check SMTP credentials in `websocket-server.js`
- Verify network connectivity
- Check email server settings (ports 587, 465)

### Toast Notifications Not Showing
- Ensure `react-hot-toast` is properly installed
- Check browser console for JavaScript errors
- Verify WebSocket connection is established

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js WebSocket Server
- **Email**: Nodemailer with SMTP
- **Notifications**: react-hot-toast
- **WebSocket**: ws library
- **Icons**: Lucide React

## Benefits of WebSocket Implementation

1. **Real-time Feedback**: See each email being sent as it happens
2. **Better User Experience**: Individual notifications keep users informed
3. **Error Transparency**: Immediate feedback on which emails failed and why
4. **Performance**: No need to wait for entire batch to complete
5. **Reliability**: Connection management and error handling
6. **Scalability**: Can handle large email batches efficiently

The WebSocket implementation provides a much better user experience compared to the previous API-based approach, with real-time feedback and individual email status notifications.

# Email Sender App

A full-stack Next.js application for sending emails to multiple recipients using Nodemailer with SMTP rotation.

## Features

- **Multi-recipient support**: Send emails to multiple recipients at once
- **Dynamic email management**: Add/remove recipients easily
- **SMTP rotation**: Uses multiple SMTP credentials for load balancing
- **HTML/Text email support**: Toggle between HTML and plain text emails
- **Form validation**: Client-side validation with Zod
- **Real-time results**: See detailed send results with success/failure counts
- **Responsive UI**: Modern, responsive design with Tailwind CSS
- **Error handling**: Comprehensive error handling and user feedback

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **Form handling**: React Hook Form with Zod validation
- **Email service**: Nodemailer with SMTP
- **Backend**: Next.js API routes

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The app includes a `.env.local` file with the SMTP credentials. The following email accounts are configured:

- importantnoticenow@redwon.shop
- importantnoticenow2@redwon.shop
- importantnoticenow3@redwon.shop
- importantnoticenow4@redwon.shop
- importantnoticenow5@redwon.shop

All use the password: `Omertag@1972`

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### Sending Emails

1. **Add Recipients**: 
   - Use the recipient input fields to add email addresses
   - Use the quick-add input to type an email and click "+" to add
   - Remove recipients using the "X" button

2. **Compose Email**:
   - Enter a subject line
   - Write your message content
   - Toggle "Send as HTML" if you want to send HTML formatted emails

3. **Send**: Click "Send Emails" to dispatch emails to all recipients

### Features Explained

#### SMTP Rotation
The app uses a round-robin system to rotate between the 5 SMTP accounts, helping to:
- Distribute email load
- Reduce chances of being flagged as spam
- Improve delivery reliability

#### Email Validation
- Client-side validation ensures proper email format
- Duplicate emails are automatically removed
- Invalid emails are highlighted with error messages

#### Results Tracking
After sending, you'll see:
- Total emails sent successfully
- Total failed emails
- Which SMTP account was used
- Detailed breakdown of successful/failed recipients
- Specific error messages for failed sends

## API Endpoints

### POST /api/send-email

Sends emails to multiple recipients.

**Request Body:**
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Your Subject",
  "message": "Your message content",
  "isHtml": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully sent 2 emails",
  "results": [...],
  "failed": [...],
  "totalSent": 2,
  "totalFailed": 0,
  "smtpUsed": "importantnoticenow@redwon.shop"
}
```

## File Structure

```
email-sender-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── send-email/
│   │   │       └── route.ts          # Email sending API endpoint
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Main email sender interface
│   └── lib/
│       └── email-utils.ts           # Email utility functions
├── .env.local                       # Environment variables
├── package.json                     # Dependencies
└── README.md                       # This file
```

## Security Features

- Input sanitization to prevent XSS attacks
- HTML content sanitization for HTML emails
- Email validation to prevent injection
- Environment variables for sensitive credentials

## Error Handling

The app includes comprehensive error handling:
- SMTP connection failures
- Individual email send failures
- Network errors
- Invalid email addresses
- Server errors

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Deploy to your preferred platform (Vercel, Netlify, etc.)
