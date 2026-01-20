import api from "./api";

const USERS_API = "/users";

export const userService = {
  // Get all users
  getAllUsers: async () => {
    const response = await api.get(USERS_API);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`${USERS_API}/${id}`);
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await api.get(`${USERS_API}/role/${role}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    console.log("[userService] createUser called with data:", userData);
    console.log("[userService] POST endpoint:", USERS_API);
    try {
      const response = await api.post(USERS_API, userData);
      console.log("[userService] createUser response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "[userService] createUser error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Update user
  updateUser: async (id, updateData) => {
    console.log(
      "[userService] updateUser called for id:",
      id,
      "with data:",
      updateData,
    );
    console.log("[userService] PUT endpoint:", `${USERS_API}/${id}`);
    try {
      const response = await api.put(`${USERS_API}/${id}`, updateData);
      console.log("[userService] updateUser response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "[userService] updateUser error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    await api.delete(`${USERS_API}/${id}`);
  },

  // Soft delete user (move to recycle bin)
  softDeleteUser: async (id) => {
    const response = await api.put(`${USERS_API}/${id}/soft-delete`);
    return response.data;
  },

  // Restore user from recycle bin
  restoreUser: async (id) => {
    const response = await api.put(`${USERS_API}/${id}/restore`);
    return response.data;
  },

  // Change password
  changePassword: async (id, passwordData) => {
    const response = await api.post(
      `${USERS_API}/${id}/change-password`,
      passwordData,
    );
    return response.data;
  },

  // Toggle user active status
  toggleUserActive: async (id) => {
    const response = await api.put(`${USERS_API}/${id}/toggle-active`);
    return response.data;
  },

  // Change user role
  changeUserRole: async (id, role) => {
    const response = await api.put(`${USERS_API}/${id}/change-role`, {
      role,
    });
    return response.data;
  },
};
