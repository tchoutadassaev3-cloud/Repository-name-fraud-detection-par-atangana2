import api from './api';

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: string;
  status: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  upload_date: string;
  created_at?: string;
  file_size?: number;
  description?: string;
  is_active?: boolean;
}

export interface ModelsResponse {
  models: MLModel[];
  total?: number;
}

export const modelsService = {
  async getModels(): Promise<MLModel[]> {
    const response = await api.get<MLModel[] | ModelsResponse>('/models');
    const data = response.data;
    return Array.isArray(data) ? data : data.models || [];
  },

  async uploadModel(file: File, metadata?: { name?: string; version?: string; type?: string }): Promise<MLModel> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.name) formData.append('name', metadata.name);
    if (metadata?.version) formData.append('version', metadata.version);
    if (metadata?.type) formData.append('type', metadata.type);

    const response = await api.post<MLModel>('/models/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
