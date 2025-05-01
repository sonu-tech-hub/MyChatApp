const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

// Initialize transporter
let transporter;

const initTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail', // Use Gmail
            auth: {
                user: process.env.EMAIL_USER, // Get from .env
                pass: process.env.EMAIL_PASSWORD, // Get from .env
            },
        });
    }
    return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 */
const sendEmail = async (options) => {
    try {
        const mailTransporter = initTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Chat App" <noreply@chatapp.com>', // Get from .env
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        await mailTransporter.sendMail(mailOptions);
        console.log(`Email sent to: ${options.to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

/**
 * Send OTP verification email
 * @param {String} email - Recipient email
 * @param {String} otp - OTP code
 */
exports.sendVerificationEmail = async (email, otp) => {
    try {
        const appName = process.env.APP_NAME || 'Chat App';
        const mailOptions = {
            to: email,
            subject: 'Verify Your Email Address',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Verify Your Email Address</h2>
                    <p>Thank you for registering with ${appName}. Please use the verification code below to complete your registration:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Best regards,<br>${appName}</p>
                </div>
            `,
        };

        await sendEmail(mailOptions);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} resetToken - Password reset token
 */
exports.sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const appName = process.env.APP_NAME || 'Chat App';

        const mailOptions = {
            to: email,
            subject: 'Reset Your Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Reset Your Password</h2>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                    <p>This link will expire in 15 minutes.</p>
                    <p>Best regards,<br>${appName}</p>
                </div>
            `,
        };

        await sendEmail(mailOptions);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};
