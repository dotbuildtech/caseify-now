import api from './api';

export const submitContact = (payload) =>
    api.post('/contact', payload).then((r) => r.data);

export const listMessages = (params = {}) =>
    api.get('/contact', { params }).then((r) => r.data);

export const getMessage = (id) =>
    api.get(`/contact/${id}`).then((r) => r.data);

export const markAsRead = (id) =>
    api.put(`/contact/${id}/read`).then((r) => r.data);

export const markAsUnread = (id) =>
    api.put(`/contact/${id}/unread`).then((r) => r.data);

export const replyToMessage = (id, replyMessage) =>
    api.put(`/contact/${id}/reply`, { replyMessage }).then((r) => r.data);

export const deleteMessage = (id) =>
    api.delete(`/contact/${id}`).then((r) => r.data);

export const getUnreadCount = () =>
    api.get('/contact/unread-count').then((r) => r.data);
