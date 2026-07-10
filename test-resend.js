const nodemailer = require('nodemailer');

async function testResendSMTP() {
  // Create transporter with Resend SMTP configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true, // true for SSL (port 465)
    auth: {
      user: 'resend',
      pass: 're_hHR7HDmU_35TRK98pYYL3kBvSVAujDqHY'
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    debug: true,
    logger: true
  });

  console.log('Testing Resend SMTP connection...');
  console.log('Host: smtp.resend.com');
  console.log('Port: 465');
  console.log('User: resend');

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    const mailOptions = {
      from: 'Email Sender <onboarding@resend.dev>',
      to: 'abdulganiyutechng@gmail.com',
      subject: 'Resend SMTP Test Email',
      text: 'This is a test email sent via Resend SMTP to verify the configuration.',
      html: '<p>This is a test email sent via <strong>Resend SMTP</strong> to verify the configuration.</p>'
    };

    console.log('Sending test email to abdulganiyutechng@gmail.com...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testResendSMTP().catch(console.error);
