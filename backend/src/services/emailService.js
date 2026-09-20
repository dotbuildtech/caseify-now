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

const getFromAddress = () => {
    if (process.env.SMTP_USER) {
        return `Caseify Now <${process.env.SMTP_USER}>`;
    }
    if (process.env.SMTP_FROM && process.env.SMTP_FROM.includes('@') && !process.env.SMTP_FROM.includes('vercel.app')) {
        return process.env.SMTP_FROM;
    }
    return 'Caseify Now <noreply@caseifynow.com>';
};

const sendViaResend = async (email, otp) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddr = (process.env.RESEND_FROM && process.env.RESEND_FROM.includes('@'))
        ? process.env.RESEND_FROM
        : 'onboarding@resend.dev';
    return await resend.emails.send({
        from: fromAddr,
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
            // Fast timeouts so Render firewall port 587 blocks fail fast instead of freezing the request
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 8000,
        });
    }
    return transporter;
};

const sendViaNodemailer = async (email, otp) => {
    return await getTransporter().sendMail({
        from: getFromAddress(),
        to: email,
        subject: 'Password Reset OTP - Caseify Now',
        html: htmlTemplate(otp),
    });
};

const sendViaBrevo = async (email, otp) => {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'caseifynow11@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Caseify Now';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email }],
            subject: 'Password Reset OTP - Caseify Now',
            htmlContent: htmlTemplate(otp),
        }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.message || `Brevo HTTP error ${response.status}`);
    }
    return data;
};

const sendOTPEmail = async (email, otp) => {
    let lastError = null;

    // 1. Brevo HTTP API (Uses HTTPS Port 443 — NEVER blocked by Render)
    if (process.env.BREVO_API_KEY) {
        try {
            const result = await sendViaBrevo(email, otp);
            console.log(`[emailService] OTP email successfully sent via Brevo HTTP to ${email}`);
            return result;
        } catch (brevoErr) {
            console.warn(`[emailService] Brevo HTTP send failed to ${email}: ${brevoErr.message}. Trying next provider...`);
            lastError = brevoErr;
        }
    }

    // 2. Resend HTTP API (Uses HTTPS Port 443 — Works on Render, requires verified domain or test recipient)
    if (process.env.RESEND_API_KEY) {
        try {
            const result = await sendViaResend(email, otp);
            if (result?.error) {
                console.warn(`[emailService] Resend returned error for ${email}: ${result.error.message}`);
                lastError = new Error(result.error.message);
            } else {
                console.log(`[emailService] OTP email successfully sent via Resend to ${email}`);
                return result;
            }
        } catch (resendErr) {
            console.warn(`[emailService] Resend exception for ${email}: ${resendErr.message}`);
            lastError = resendErr;
        }
    }

    // 3. SMTP / Nodemailer (Works on localhost; blocked on Render Free tier due to port 587 restriction)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const info = await sendViaNodemailer(email, otp);
            console.log(`[emailService] OTP email successfully sent via SMTP to ${email} (messageId: ${info.messageId})`);
            return info;
        } catch (smtpErr) {
            console.warn(`[emailService] SMTP send failed to ${email}: ${smtpErr.message} (Note: Render Free Tier blocks port 587)`);
            lastError = smtpErr;
        }
    }

    if (lastError) {
        throw lastError;
    }
    throw new Error('No working email provider configured (Brevo, Resend, or SMTP)');
};

module.exports = { sendOTPEmail };
