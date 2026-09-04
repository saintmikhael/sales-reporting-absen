import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { GlobalStyle, COLOR } from "./ui";
import Login from "./pages/Login";
import SalesTestEntry from "./pages/SalesTestEntry";
import OwnerDashboard from "./pages/owner/OwnerDashboard";

function Gate() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLOR.muted }}>Memuat\u2026</div>;
  }
  if (!session) return <Login />;
  if (!profile) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLOR.muted }}>Menyiapkan akun\u2026</div>;
  }
  return profile.role === "owner" ? <OwnerDashboard /> : <SalesTestEntry />;
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalStyle />
      <Gate />
    </AuthProvider>
  );
}
