import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      switch (parsedUser.user_role) {
        case "admin":
          navigate("/admin");
          break;
        case "staff":
          navigate("/staff");
          break;
        case "client":
          navigate("/client");
          break;
        case "contractor":
          navigate("/contractor");
          break;
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  const footer = (
    <div className="p-text-center p-mt-3">
      <small className="p-text-secondary">
        Test Credentials: admin / admin123 | staff / staff123 | client /
        client123 | contractor / contractor123
      </small>
    </div>
  );

  return (
    <div className="surface-ground min-h-screen flex align-items-center justify-content-center p-4">
      <div className="w-full md:w-6 lg:w-4">
        <Card
          title="Project Management System"
          subTitle="Sign in to your account"
          footer={footer}
          className="shadow-5 border-round-xl"
        >
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="field">
              <label htmlFor="username" className="block mb-2">
                Username
              </label>
              <InputText
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={loading}
                className="w-full"
                size="large"
              />
            </div>

            <div className="field mt-4">
              <label htmlFor="password" className="block mb-2">
                Password
              </label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                toggleMask
                feedback={false}
                required
                disabled={loading}
                className="w-full"
                inputClassName="w-full"
              />
            </div>

            {error && (
              <Message severity="error" text={error} className="mt-3" />
            )}

            <div className="flex align-items-center justify-content-between mt-4">
              <div className="flex align-items-center">
                <Checkbox
                  inputId="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.checked)}
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="ml-2">
                  Remember me
                </label>
              </div>
            </div>

            <Button
              type="submit"
              label="Sign In"
              icon="pi pi-sign-in"
              loading={loading}
              disabled={loading}
              className="w-full mt-5 p-button-lg"
            />

            <Divider align="center" className="my-5">
              <span className="p-tag">Quick Access</span>
            </Divider>

            <div className="grid">
              <div className="col-6">
                <Button
                  label="Admin"
                  severity="help"
                  outlined
                  onClick={() => {
                    setUsername("admin");
                    setPassword("admin123");
                  }}
                  className="w-full"
                />
              </div>
              <div className="col-6">
                <Button
                  label="Staff"
                  severity="info"
                  outlined
                  onClick={() => {
                    setUsername("staff");
                    setPassword("staff123");
                  }}
                  className="w-full"
                />
              </div>
              <div className="col-6 mt-2">
                <Button
                  label="Client"
                  severity="success"
                  outlined
                  onClick={() => {
                    setUsername("client");
                    setPassword("client123");
                  }}
                  className="w-full"
                />
              </div>
              <div className="col-6 mt-2">
                <Button
                  label="Contractor"
                  severity="warning"
                  outlined
                  onClick={() => {
                    setUsername("contractor");
                    setPassword("contractor123");
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </form>
        </Card>

        <div className="text-center mt-4">
          <small className="p-text-secondary">
            © 2024 Project Management System. All rights reserved.
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
