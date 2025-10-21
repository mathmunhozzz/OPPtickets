import { useState } from "react";
import { 
  Home, 
  Calendar, 
  Users, 
  Settings, 
  FileText, 
  Ticket, 
  UserCheck, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Radio
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Tickets", url: "/tickets", icon: Ticket },
  { title: "Chamados Spoken", url: "/chamados-spoken", icon: Radio },
  { title: "Viagens", url: "/viagens", icon: Calendar },
];

const clientsItems = [
  { title: "Funcionários dos Clientes", url: "/client-contacts", icon: UserCheck },
];

const adminItems = [
  { title: "Usuários", url: "/usuarios", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
];

export function AppSidebar() {
  // ✅ useSidebar retorna { state }, então criamos "collapsed" manualmente
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: userRole } = useUserRole();
  const currentPath = location.pathname;

  const [clientsExpanded, setClientsExpanded] = useState(
    clientsItems.some(item => currentPath === item.url)
  );
  const [adminExpanded, setAdminExpanded] = useState(
    adminItems.some(item => currentPath === item.url)
  );

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50";

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout");
      console.error("Logout error:", error);
    }
  };

  const canAccessAdmin = userRole === 'admin' || userRole === 'manager';

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Clients Section */}
        <SidebarGroup>
          <SidebarGroupLabel 
            className="flex items-center cursor-pointer"
            onClick={() => setClientsExpanded(!clientsExpanded)}
          >
            <span className="flex-1">Clientes</span>
            {!collapsed && (
              clientsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </SidebarGroupLabel>
          {(clientsExpanded || collapsed) && (
            <SidebarGroupContent>
              <SidebarMenu>
                {clientsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Admin Section */}
        {canAccessAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel 
              className="flex items-center cursor-pointer"
              onClick={() => setAdminExpanded(!adminExpanded)}
            >
              <span className="flex-1">Administração</span>
              {!collapsed && (
                adminExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </SidebarGroupLabel>
            {(adminExpanded || collapsed) && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout} 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
