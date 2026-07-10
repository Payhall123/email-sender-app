const { Resend } = require('resend');

async function testResendAPI() {
  const resend = new Resend('re_hHR7HDmU_35TRK98pYYL3kBvSVAujDqHY');

  console.log('Testing Resend API...');
  console.log('API Key: re_hHR7HDmU_35TRK98pYYL3kBvSVAujDqHY');

  try {
    // Test with HTML content
    console.log('\n--- Test 1: HTML Email ---');
    const htmlResult = await resend.emails.send({
      from: 'Email Sender <onboarding@resend.dev>',
      to: ['abdulganiyutechng@gmail.com'],
      subject: 'Resend API Test - HTML',
      html: '<p>This is a <strong>test email</strong> sent via <strong>Resend API</strong> to verify HTML content works.</p>'
    });

    console.log('✅ HTML email sent successfully!');
    console.log('Message ID:', htmlResult.data.id);
    console.log('Response:', htmlResult);

    // Test with text content
    console.log('\n--- Test 2: Text Email ---');
    const textResult = await resend.emails.send({
      from: 'Email Sender <onboarding@resend.dev>',
      to: ['abdulganiyutechng@gmail.com'],
      subject: 'Resend API Test - Text',
      text: 'This is a test email sent via Resend API to verify text content works.'
    });

    console.log('✅ Text email sent successfully!');
    console.log('Message ID:', textResult.data.id);
    console.log('Response:', textResult);

  } catch (error) {
    console.error('❌ Error sending email via Resend API:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
  }
}

testResendAPI().catch(console.error);
