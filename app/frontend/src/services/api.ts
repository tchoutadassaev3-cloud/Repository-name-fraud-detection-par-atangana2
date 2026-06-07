import axios from 'axios';
{/* const API_BASE_URL = 'http://localhost:8000'; */}

const API_BASE_URL = 'https://repository-name-fraud-detection-par.onrender.com';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authService = {
    login: (credentials: any) => api.post('/auth/login', credentials),
};

export const modelService = {
    list: () => api.get('/models'),
    activate: (id: string) => api.post(`/models/${id}/activate`),
    upload: (data: FormData) => api.post('/models/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const transactionService = {
    simulate: (data: any) => api.post('/transactions/simulate', data),
    stressTest: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/forensics/stress-test', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};

export const telemetryService = {
    getRealtime: () => api.get('/stats/realtime'),
};
