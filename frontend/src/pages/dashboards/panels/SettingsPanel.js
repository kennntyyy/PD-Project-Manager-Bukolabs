import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { userService } from "../../../services/userService";


const SettingsPanel = ({ activeTab }) => {
  const { user, refreshUser } = useAuth();
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editUsername, setEditUsername] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [name, setName] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState(user?.address || "");
  const [profilePic, setProfilePic] = useState(user?.profile_pic || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setName({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    });
    setEmail(user?.email || "");
    setAddress(user?.address || "");
    setProfilePic(user?.profile_pic || "");
  }, [user]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const toast = useRef(null);

  const handleSaveName = async () => {
    setLoading(true);
    setError(null);
    try {
      await userService.updateUser(user.user_id, {
        first_name: name.first_name,
        last_name: name.last_name,
      });
      setEditName(false);
      refreshUser && refreshUser();
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Name updated successfully', life: 3000 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update name.";
      setError(msg);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      await userService.updateUser(user.user_id, { email });
      setEditEmail(false);
      refreshUser && refreshUser();
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Email updated successfully', life: 3000 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update email.";
      setError(msg);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveAddress = async () => {
    setLoading(true);
    setError(null);
    try {
      await userService.updateUser(user.user_id, { address });
      setEditAddress(false);
      refreshUser && refreshUser();
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Address updated successfully', life: 3000 });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update address.";
      setError(msg);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
    } finally {
      setLoading(false);
    }
  };
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];
        setProfilePic(base64);
        try {
          await userService.updateUser(user.user_id, { profile_pic: base64 });
          refreshUser && refreshUser();
          toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Profile picture updated', life: 3000 });
        } catch (err) {
          const msg = err?.response?.data?.message || "Failed to update profile picture.";
          setError(msg);
          toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="settings-dropdown-panel">
      <Toast ref={toast} position="top-right" />
      <div className="settings-tab-content">
        {activeTab === "general" && (
          <div className="dashboard-card">
            <h2 className="card-title" style={{ marginBottom: 4, fontSize: 22 }}>General</h2>
            <p className="text-color-secondary" style={{ margin: 0, marginBottom: 20, fontSize: 15 }}>
              Manage your profile information
            </p>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={profilePic ? `data:image/jpeg;base64,${profilePic}` : "/default-profile.png"}
                  alt="Profile"
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }}
                />
              </div>
              <Button
                label={uploading ? "Uploading..." : "Upload"}
                className="p-button-sm"
                style={{ alignSelf: "center" }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={uploading}
                aria-label="Upload profile picture"
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleProfilePicChange}
              />
            </div>
            <Divider />
            {/* Name section */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Name</div>
                {!editName ? (
                  <span style={{ fontSize: 16 }}>{name.first_name} {name.last_name}</span>
                ) : (
                  <>
                    <InputText
                      value={name.first_name}
                      onChange={e => setName(n => ({ ...n, first_name: e.target.value }))}
                      placeholder="First Name"
                      style={{ width: 120 }}
                    />
                    <InputText
                      value={name.last_name}
                      onChange={e => setName(n => ({ ...n, last_name: e.target.value }))}
                      placeholder="Last Name"
                      style={{ width: 120 }}
                    />
                  </>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {!editName ? (
                  <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => setEditName(true)} aria-label="Edit name" />
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={handleSaveName} aria-label="Save name" />
                    <Button icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => setEditName(false)} aria-label="Cancel edit name" />
                  </div>
                )}
              </div>
            </div>
            <Divider />
            {/* Email section */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Email</div>
                {!editEmail ? (
                  <span style={{ fontSize: 16 }}>{email}</span>
                ) : (
                  <InputText value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width: 240 }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {!editEmail ? (
                  <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => setEditEmail(true)} aria-label="Edit email" />
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={handleSaveEmail} aria-label="Save email" />
                    <Button icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => setEditEmail(false)} aria-label="Cancel edit email" />
                  </div>
                )}
              </div>
            </div>
            <Divider />
            {/* Address section */}
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Address</div>
                {!editAddress ? (
                  <span style={{ fontSize: 16 }}>{address || <span style={{ color: '#9ca3af' }}>No address set</span>}</span>
                ) : (
                  <InputText value={address} onChange={e => setAddress(e.target.value)} placeholder="Address" style={{ width: 240 }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {!editAddress ? (
                  <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => setEditAddress(true)} aria-label="Edit address" />
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={handleSaveAddress} aria-label="Save address" />
                    <Button icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => setEditAddress(false)} aria-label="Cancel edit address" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === "security" && (
          <div className="dashboard-card">
            <h2 className="card-title" style={{ marginBottom: 4 }}>Security</h2>
            <p className="text-color-secondary" style={{ margin: 0, marginBottom: 20, fontSize: 15 }}>
              Update your login credentials
            </p>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            {/* Username section */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Username</div>
                {!editUsername ? (
                  <span style={{ fontSize: 16 }}>{username}</span>
                ) : (
                  <InputText value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={{ width: 240 }} />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {!editUsername ? (
                  <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => setEditUsername(true)} aria-label="Edit username" />
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={async () => {
                      setLoading(true);
                      setError(null);
                      try {
                        await userService.updateUser(user.user_id, { username });
                        setEditUsername(false);
                        refreshUser && refreshUser();
                        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Username updated successfully', life: 3000 });
                      } catch (err) {
                        const msg = err?.response?.data?.message || "Failed to update username.";
                        setError(msg);
                        toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                      } finally {
                        setLoading(false);
                      }
                    }} aria-label="Save username" />
                    <Button icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => setEditUsername(false)} aria-label="Cancel edit username" />
                  </div>
                )}
              </div>
            </div>
            <Divider />
            {/* Password section */}
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Password</div>
                {!editPassword ? (
                  <span style={{ fontSize: 16, color: '#9ca3af' }}>********</span>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <InputText
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="New Password"
                        style={{ width: 200 }}
                      />
                      <Button
                        icon={showPassword ? "pi pi-eye-slash" : "pi pi-eye"}
                        className="p-button-text p-button-sm"
                        style={{ marginLeft: 4 }}
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        type="button"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <InputText
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        style={{ width: 200 }}
                      />
                      <Button
                        icon={showConfirmPassword ? "pi pi-eye-slash" : "pi pi-eye"}
                        className="p-button-text p-button-sm"
                        style={{ marginLeft: 4 }}
                        onClick={() => setShowConfirmPassword(v => !v)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        type="button"
                      />
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {!editPassword ? (
                  <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => setEditPassword(true)} aria-label="Edit password" />
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Button icon="pi pi-check" className="p-button-text p-button-sm" onClick={async () => {
                      if (password !== confirmPassword) {
                        setError("Passwords do not match.");
                        return;
                      }
                      setLoading(true);
                      setError(null);
                      try {
                        await userService.changePassword(user.user_id, { password });
                        setEditPassword(false);
                        setPassword("");
                        setConfirmPassword("");
                        toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Password updated successfully', life: 3000 });
                      } catch (err) {
                        const msg = err?.response?.data?.message || "Failed to update password.";
                        setError(msg);
                        toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                      } finally {
                        setLoading(false);
                      }
                    }} aria-label="Save password" />
                    <Button icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => { setEditPassword(false); setPassword(""); setConfirmPassword(""); }} aria-label="Cancel edit password" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
