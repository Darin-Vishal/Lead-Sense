import axios from 'axios';

const API_BASE = window.__API_BASE__ || "http://localhost:8000";

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const scoreEmail = async (text) => {
    const response = await api.post('/api/score', { raw_text: text });
    return response.data;
};

export const getLeads = async () => {
    const response = await api.get('/api/leads');
    return response.data;
};

export const getReplyUrl = async (emailId) => {
    const response = await api.get(`/api/reply-url/${emailId}`);
    return response.data.url;
};

export const processEmails = async () => {
    const response = await api.post('/api/process-emails');
    return response.data;
};

export const sendReply = async (payload) => {
    const response = await api.post('/api/send-reply', payload);
    return response.data;
};

export const updateLeadStage = async (id, stage) => {
    const response = await api.patch(`/api/leads/${id}/stage`, { stage });
    return response.data;
};

export default api;
