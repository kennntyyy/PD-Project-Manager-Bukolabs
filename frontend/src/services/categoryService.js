import api from './api';

const CATEGORIES_API = '/categories';

export const categoryService = {
  getAll: async () => {
    const response = await api.get(CATEGORIES_API);
    return response.data;
  },
  create: async (categoryData) => {
    const response = await api.post(CATEGORIES_API, categoryData);
    return response.data;
  },
  update: async (id, categoryData) => {
    const response = await api.patch(`${CATEGORIES_API}/${id}`, categoryData);
    return response.data;
  },
  remove: async (id) => {
    const response = await api.delete(`${CATEGORIES_API}/${id}`);
    return response.data;
  },
};
