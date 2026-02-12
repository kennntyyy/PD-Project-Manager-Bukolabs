import api from './api';

export const contractorTypeService = {
  getAllContractorTypes: async () => {
    const response = await api.get('/contractor-types');
    return response.data;
  },

  createContractorType: async (data) => {
    const response = await api.post('/contractor-types', data);
    return response.data;
  },

  updateContractorType: async (id, data) => {
    const response = await api.patch(`/contractor-types/${id}`, data);
    return response.data;
  },

  deleteContractorType: async (id) => {
    const response = await api.delete(`/contractor-types/${id}`);
    return response.data;
  },
};
