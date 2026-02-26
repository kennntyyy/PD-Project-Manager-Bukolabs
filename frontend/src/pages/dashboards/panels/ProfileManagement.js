import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../services/userService";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const ProfileManagement = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      await userService.updateUser(user.user_id, form);
      setSuccess("Profile updated successfully.");
      await refreshUser();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h3 className="card-title">Profile Management</h3>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <div className="p-field">
          <label htmlFor="first_name">First Name</label>
          <InputText
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
            className="p-inputtext"
          />
        </div>
        <div className="p-field">
          <label htmlFor="last_name">Last Name</label>
          <InputText
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
            className="p-inputtext"
          />
        </div>
        <div className="p-field">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="p-inputtext"
            type="email"
          />
        </div>
        <Button
          type="submit"
          label={loading ? "Saving..." : "Save Changes"}
          className="p-button-success"
          disabled={loading}
        />
        {success && <div style={{ color: "green", marginTop: 10 }}>{success}</div>}
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default ProfileManagement;
