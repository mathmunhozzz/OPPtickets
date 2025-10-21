
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import SpokenTickets from "./pages/SpokenTickets";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";
import Relatorios from "./pages/Relatorios";
import AguardeAprovacao from "./pages/AguardeAprovacao";

import { AuthGuard } from "./components/auth/AuthGuard";
import { ApprovalGuard } from "./components/auth/ApprovalGuard";
import ClientContacts from "./pages/ClientContacts";
import ClientRegister from "./pages/ClientRegister";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  return (
    <ApprovalGuard>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/chamados-spoken" element={<SpokenTickets />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/client-contacts" element={<ClientContacts />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ApprovalGuard>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/client-register" element={<ClientRegister />} />
        <Route path="/aguarde-aprovacao" element={<AuthGuard><AguardeAprovacao /></AuthGuard>} />
        <Route path="*" element={<AuthGuard><ProtectedRoutes /></AuthGuard>} />
      </Routes>
      <Toaster />
      <SonnerToaster />
    </QueryClientProvider>
  );
}

export default App;
