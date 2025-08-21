
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";
import Relatorios from "./pages/Relatorios";

import { AuthGuard } from "./components/auth/AuthGuard";
import ClientContacts from "./pages/ClientContacts";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tickets" element={<Tickets />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/client-contacts" element={<ClientContacts />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="*" element={<AuthGuard><ProtectedRoutes /></AuthGuard>} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
