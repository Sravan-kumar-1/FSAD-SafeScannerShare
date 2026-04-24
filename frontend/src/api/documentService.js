import api from './axiosConfig'; // or wherever your axios instance is

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getDocuments = async () => {
    const response = await api.get('/documents');
    return response.data;
};

export const streamDocument = async (id) => {
    const response = await api.get(`/documents/${id}/stream`, {
        responseType: 'blob', // Critical for secure raw file streaming
    });
    return response.data;
};

// ============================================
// Internal Native Dashboard Viewer (Owner Only)
// ============================================

export const streamRawDocument = async (id) => {
    const response = await api.get(`/documents/raw/${id}`, {
        responseType: 'blob',
    });
    return response.data;
};

export const getRawDocumentMetadata = async (id) => {
    const response = await api.get(`/documents/${id}/metadata`);
    return response.data;
};
// ============================================

export const streamSharedDocument = async (token) => {
    const response = await api.get(`/share/${token}/stream`, {
        responseType: 'blob',
    });
    return response.data;
};

export const getAuditLogs = async (id) => {
    const response = await api.get(`/documents/${id}/audit-logs`);
    return response.data;
};

export const shareDocument = async (documentId, durationInMinutes, targetUserId, oneTimeView = false, watermarkText = "", watermarkOpacity = 15, watermarkSize = 14, watermarkDensity = 100) => {
    try {
        // We force documentId to a Number just in case it's a string
        const cleanId = Number(documentId);

        // We force duration to a Float
        const payload = {
            durationInMinutes: parseFloat(durationInMinutes),
            targetUserId: targetUserId ? Number(targetUserId) : null,
            oneTimeView: oneTimeView,
            watermarkText: watermarkText.trim() === "" ? null : watermarkText.trim(),
            watermarkOpacity: Number(watermarkOpacity),
            watermarkSize: Number(watermarkSize),
            watermarkDensity: Number(watermarkDensity)
        };

        console.log("Sending Share Request:", { cleanId, payload });

        const response = await api.post(`/documents/${cleanId}/share`, payload);
        return response.data;
    } catch (error) {
        console.error("Share API Error:", error.response?.data || error.message);
        throw error;
    }
};

export const searchUsersByEmail = async (email) => {
    const response = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
    return response.data;
};

export const getActiveShares = async () => {
    const response = await api.get('/shares/active');
    return response.data;
};

export const revokeShare = async (token) => {
    const response = await api.delete(`/shares/${token}`);
    return response.data;
};

export const getShareMetadata = async (token) => {
    const response = await api.get(`/share/${token}/metadata`);
    return response.data;
};