require('dotenv').config();
const { sendOTPEmail } = require('./services/otpService');

async function testSend() {
  console.log('🚀 Attempting to send test OTP...');
  
  // Use the email that was failing in the user's logs
  const testEmail = 'invoicepro.zyx@gmail.com'; 
  
  const result = await sendOTPEmail(testEmail, '123456', 'signup');
  
  if (result.success) {
    console.log('✅ Test Passed: Email sent successfully!');
  } else {
    console.error('❌ Test Failed: Email sending failed.');
  }
}

testSend();
