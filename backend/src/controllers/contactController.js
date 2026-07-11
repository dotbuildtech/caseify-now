const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

const REPLY_MAX_LENGTH = 5000;

const sanitizeSubject = (subject) => {
    if (!subject) return '';
    return subject.replace(/[\r\n]/g, ' ').trim().substring(0, 300);
};

const sanitizeEmailLine = (val) => {
    if (!val) return '';
    return String(val).replace(/[\r\n]/g, ' ').trim();
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.submitContact = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150) {
        res.status(400);
        throw new Error('Name must be 2-150 characters');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        res.status(400);
        throw new Error('Please provide a valid email address');
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000) {
        res.status(400);
        throw new Error('Message must be 10-5000 characters');
    }

    const contact = await Contact.create({
        name: sanitizeEmailLine(name),
        email: email.toLowerCase().trim(),
        subject: sanitizeSubject(subject),
        message: message.trim()
    });

    res.status(201).json({ message: 'Message sent successfully', id: contact.id });
});

exports.listMessages = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const where = {};

    if (req.query.isRead !== undefined) {
        where.isRead = req.query.isRead === 'true';
    }

    const { count, rows } = await Contact.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
    });

    const unreadCount = await Contact.count({ where: { isRead: false } });

    res.json({
        data: rows,
        unreadCount,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    });
});

exports.getMessage = asyncHandler(async (req, res) => {
    const message = await Contact.findByPk(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }

    if (!message.isRead) {
        message.isRead = true;
        await message.save();
    }

    res.json(message);
});

exports.markAsRead = asyncHandler(async (req, res) => {
    const message = await Contact.findByPk(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }
    message.isRead = true;
    await message.save();
    res.json(message);
});

exports.markAsUnread = asyncHandler(async (req, res) => {
    const message = await Contact.findByPk(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }
    message.isRead = false;
    await message.save();
    res.json(message);
});

exports.replyToMessage = asyncHandler(async (req, res) => {
    const { replyMessage } = req.body;
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) { res.status(404); throw new Error('Message not found'); }

    if (!replyMessage || typeof replyMessage !== 'string') {
        res.status(400);
        throw new Error('Reply message is required');
    }
    const trimmedReply = replyMessage.trim();
    if (trimmedReply.length < 1 || trimmedReply.length > REPLY_MAX_LENGTH) {
        res.status(400);
        throw new Error(`Reply message must be 1-${REPLY_MAX_LENGTH} characters`);
    }

    contact.replyMessage = trimmedReply;
    contact.repliedAt = new Date();
    contact.isRead = true;
    await contact.save();

    res.json({ message: 'Reply sent successfully', contact });

    const safeSubject = sanitizeSubject(contact.subject);
    const safeRecipient = sanitizeEmailLine(contact.email);

    transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: safeRecipient,
        subject: `Re: ${safeSubject || 'Your message to Caseify Now'}`,
        text: trimmedReply,
        replyTo: process.env.SMTP_USER
    }).catch((emailErr) => {
        console.error('Failed to send reply email:', emailErr.message);
    });
});

exports.deleteMessage = asyncHandler(async (req, res) => {
    const message = await Contact.findByPk(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }
    await message.destroy({ force: req.query.force === 'true' });
    res.json({ message: 'Message deleted' });
});

let unreadCache = { count: 0, timestamp: 0 };
const UNREAD_CACHE_TTL = 15000;

exports.getUnreadCount = asyncHandler(async (req, res) => {
    const now = Date.now();
    if (now - unreadCache.timestamp < UNREAD_CACHE_TTL) {
        return res.json(unreadCache);
    }
    const count = await Contact.count({ where: { isRead: false } });
    unreadCache = { count, timestamp: now };
    res.json({ count });
});
