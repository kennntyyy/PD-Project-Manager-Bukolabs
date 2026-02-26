import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../services/userService";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const ChangePasswordPanel = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword(user.user_id, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess("Password changed successfully.");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <h3 className="card-title">Change Password</h3>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <div className="p-field">
          <label htmlFor="currentPassword">Current Password</label>
          <InputText
            id="currentPassword"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            type="password"
            required
            className="p-inputtext"
          />
        </div>
        <div className="p-field">
          <label htmlFor="newPassword">New Password</label>
          <InputText
            id="newPassword"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            type="password"
            required
            className="p-inputtext"
          />
        </div>
        <div className="p-field">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <InputText
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            type="password"
            required
            className="p-inputtext"
          />
        </div>
        <Button
          type="submit"
          label={loading ? "Saving..." : "Change Password"}
          className="p-button-warning"
          disabled={loading}
        />
        {success && <div style={{ color: "green", marginTop: 10 }}>{success}</div>}
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default ChangePasswordPanel;
