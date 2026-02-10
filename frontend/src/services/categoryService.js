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
};
