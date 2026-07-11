const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const htmlTemplate = (otp) => `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background-color:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
        <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;padding:24px">
            <tr><td style="padding:24px 0">
                <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 8px">Caseify Now</h1>
                <p style="font-size:14px;color:#666;margin:0 0 24px">Password Reset Request</p>
            </td></tr>
            <tr><td style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
                <p style="font-size:15px;color:#333;line-height:1.5;margin:0 0 20px">Use the following OTP to reset your password. It expires in <strong>1 minute</strong>.</p>
                <div style="font-size:40px;font-weight:700;letter-spacing:10px;text-align:center;padding:20px;background:#f4f4f4;border-radius:8px;color:#1a1a1a;margin:0 0 20px;font-family:monospace">${otp}</div>
                <p style="font-size:13px;color:#999;margin:0;line-height:1.4">If you didn't request this, you can safely ignore this email.</p>
            </td></tr>
            <tr><td style="padding:24px 0;text-align:center">
                <p style="font-size:12px;color:#bbb;margin:0">Caseify Now &mdash; Premium Phone Cases</p>
            </td></tr>
        </table>
    </body>
    </html>
`;

const getFromAddress = () => process.env.SMTP_FROM || 'Caseify Now <noreply@caseifynow.com>';

const sendViaResend = async (email, otp) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
        from: getFromAddress(),
        to: email,
        subject: 'Password Reset OTP - Caseify Now',
        html: htmlTemplate(otp),
    });
};

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

const sendViaNodemailer = async (email, otp) => {
    await getTransporter().sendMail({
        from: getFromAddress(),
        to: email,
        subject: 'Password Reset OTP - Caseify Now',
        html: htmlTemplate(otp),
    });
};

const sendOTPEmail = async (email, otp) => {
    if (process.env.RESEND_API_KEY) {
        await sendViaResend(email, otp);
    } else {
        await sendViaNodemailer(email, otp);
    }
};

module.exports = { sendOTPEmail };
