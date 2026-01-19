import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProgressSpinner } from "primereact/progressspinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="surface-ground flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <ProgressSpinner style={{ width: "50px", height: "50px" }} />
          <p className="mt-3 text-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.user_role)) {
    let userDashboard = "/login";
    switch (user.user_role) {
      case "admin":
        userDashboard = "/admin";
        break;
      case "staff":
        userDashboard = "/staff";
        break;
      case "client":
        userDashboard = "/client";
        break;
      case "contractor":
        userDashboard = "/contractor";
        break;
    }
    return <Navigate to={userDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;
