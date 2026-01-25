 /**
 * Email Templates Service
 * Professional, branded email templates with inline CSS for maximum compatibility
 */

/**
 * Generate OTP Email Template - Signup/Account Verification
 * @param {string} otp - 6-digit OTP code
 * @param {string} email - User's email address
 * @returns {string} - HTML email content
 */
function generateOTPEmailSignup(otp, email, logoUrl = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - InvoicePro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; background-color: #f7f8fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header with Brand and Company Logo -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 20px 32px; text-align: center;">
            ${logoUrl ? `<div style="margin-bottom: 12px;"><img src="${logoUrl}" alt="Company Logo" style="height:50px; object-fit:contain; border-radius:8px;" /></div>` : ''}
            <h1 style="margin: 0 0 4px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                InvoicePro
            </h1>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">Professional Invoice Management</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 32px;">
            
            <!-- Greeting -->
            <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 600; letter-spacing: -0.3px;">
                Verify Your Email Address
            </h2>
            <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Welcome to InvoicePro! We're excited to have you on board. To get started, please verify your email address by entering the code below.
            </p>

            <!-- OTP Container -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%); border: 2px solid #bfdbfe; border-radius: 12px; padding: 32px; margin-bottom: 28px; text-align: center;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Your Verification Code
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 40px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; text-transform: uppercase;">
                        ${otp}
                    </p>
                </div>
            </div>

            <!-- Expiration Notice -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                    <strong>⏱️ Expires in 5 minutes</strong><br>
                    This verification code will expire in 5 minutes for security reasons. If it expires, you can request a new one.
                </p>
            </div>

            <!-- How to Use -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600;">How to verify:</p>
                <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                    <li>Return to InvoicePro</li>
                    <li>Enter the 6-digit code above</li>
                    <li>Click "Verify" to complete signup</li>
                </ol>
            </div>

            <!-- Security Note -->
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0; color: #15803d; font-size: 13px; line-height: 1.6;">
                    <strong>🔒 Security tip:</strong> We'll never ask you to share this code via email, phone, or chat. If you didn't sign up for InvoicePro, please ignore this email.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://app.invoicepro.com" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: opacity 0.2s;">
                    Go to InvoicePro
                </a>
            </div>

            <!-- Help Section -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Need help?</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                    If you have any questions or need assistance, our support team is here to help. 
                    <a href="mailto:support@invoicepro.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">Contact us</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 32px; text-align: center;">
            <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 12px;">
                © 2026 InvoicePro. All rights reserved.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="https://invoicepro.com/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a> • 
                <a href="https://invoicepro.com/terms" style="color: #6b7280; text-decoration: none;">Terms of Service</a>
            </p>
            <p style="margin: 12px 0 0 0; color: #d1d5db; font-size: 11px;">
                You received this email because you signed up for InvoicePro.
            </p>
        </div>

    </div>
</body>
</html>
  `;
}

/**
 * Generate OTP Email Template - Password Reset
 * @param {string} otp - 6-digit OTP code
 * @param {string} email - User's email address
 * @returns {string} - HTML email content
 */
function generateOTPEmailPasswordReset(otp, email, logoUrl = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - InvoicePro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; background-color: #f7f8fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header with Brand and Company Logo -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 20px 32px; text-align: center;">
            ${logoUrl ? `<div style="margin-bottom: 12px;"><img src="${logoUrl}" alt="Company Logo" style="height:50px; object-fit:contain; border-radius:8px;" /></div>` : ''}
            <h1 style="margin: 0 0 4px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                InvoicePro
            </h1>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">Professional Invoice Management</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 32px;">
            
            <!-- Alert Icon -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; background-color: #fef3c7; border-radius: 50%; padding: 16px; font-size: 32px;">
                    🔐
                </div>
            </div>

            <!-- Greeting -->
            <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; text-align: center;">
                Reset Your Password
            </h2>
            <p style="margin: 0 0 28px 0; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center;">
                We received a request to reset your InvoicePro password. Use the verification code below to create a new password.
            </p>

            <!-- OTP Container -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%); border: 2px solid #bfdbfe; border-radius: 12px; padding: 32px; margin-bottom: 28px; text-align: center;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Your Verification Code
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 0;">
                    <p style="margin: 0; color: #1e40af; font-size: 40px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace; text-transform: uppercase;">
                        ${otp}
                    </p>
                </div>
            </div>

            <!-- Expiration Notice -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                    <strong>⏱️ Expires in 5 minutes</strong><br>
                    This reset code will expire in 5 minutes. If it expires, you can request a new one from the login page.
                </p>
            </div>

            <!-- Steps -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Steps to reset your password:</p>
                <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                    <li>Go to InvoicePro password reset page</li>
                    <li>Enter the 6-digit code above</li>
                    <li>Create a strong new password</li>
                    <li>Sign in with your new password</li>
                </ol>
            </div>

            <!-- Security Alert -->
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.6;">
                    <strong>⚠️ Important:</strong> If you didn't request a password reset, your account may be at risk. Please change your password immediately or <a href="mailto:support@invoicepro.com" style="color: #dc2626; font-weight: 500; text-decoration: none;">contact our security team</a>.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 28px;">
                <a href="https://app.invoicepro.com/forgot-password" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: opacity 0.2s;">
                    Reset Password
                </a>
            </div>

            <!-- Help Section -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Suspicious activity?</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                    If you notice anything unusual, please 
                    <a href="mailto:security@invoicepro.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">report it to our security team</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 32px; text-align: center;">
            <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 12px;">
                © 2026 InvoicePro. All rights reserved.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="https://invoicepro.com/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a> • 
                <a href="https://invoicepro.com/terms" style="color: #6b7280; text-decoration: none;">Terms of Service</a>
            </p>
            <p style="margin: 12px 0 0 0; color: #d1d5db; font-size: 11px;">
                This is a security email. Please don't share it with others.
            </p>
        </div>

    </div>
</body>
</html>
  `;
}

/**
 * Plain text version of OTP email (for email clients that don't support HTML)
 * @param {string} otp - 6-digit OTP code
 * @param {string} purpose - 'signup' or 'reset'
 * @returns {string} - Plain text email content
 */
function generateOTPEmailPlainText(otp, purpose = 'signup') {
  if (purpose === 'reset') {
    return `
InvoicePro - Password Reset

RESET YOUR PASSWORD

We received a request to reset your InvoicePro password. Use the code below to create a new password.

YOUR VERIFICATION CODE:
${otp}

⏱️ EXPIRES IN 5 MINUTES
This reset code will expire in 5 minutes. If it expires, you can request a new one.

IMPORTANT SECURITY NOTE:
If you didn't request this password reset, your account may be at risk. Please change your password immediately.

Contact our security team if you have concerns: security@invoicepro.com

---
© 2026 KRAS TECHNOLOGY. All rights reserved.
Privacy Policy: https://invoicepro.com/privacy
Terms of Service: https://invoicepro.com/terms
    `;
  }

  // Default to signup
  return `
InvoicePro - Email Verification

VERIFY YOUR EMAIL ADDRESS

Welcome to InvoicePro! To get started, please verify your email by entering the code below.

YOUR VERIFICATION CODE:
${otp}

⏱️ EXPIRES IN 5 MINUTES
This code will expire in 5 minutes for security reasons.

SECURITY TIP:
We'll never ask you to share this code. If you didn't sign up for InvoicePro, please ignore this email.

Need help? Contact us: support@invoicepro.com

---
© 2026 InvoicePro. All rights reserved.
Privacy Policy: https://invoicepro.com/privacy
Terms of Service: https://invoicepro.com/terms
  `;
}

module.exports = {
  generateOTPEmailSignup,
  generateOTPEmailPasswordReset,
  generateOTPEmailPlainText,
};