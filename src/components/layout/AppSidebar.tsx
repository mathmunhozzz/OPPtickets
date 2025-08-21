
import React from 'react';
import { Home, Ticket, Users, BarChart3, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export interface AppSidebarProps {
  isCollapsed?: boolean;
}

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Tickets',
    url: '/tickets',
    icon: Ticket,
  },
  {
    title: 'Usuários',
    url: '/usuarios',
    icon: Users,
  },
  {
    title: 'Funcionários dos Clientes',
    url: '/client-contacts',
    icon: UserCheck,
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: BarChart3,
  },
];

export function AppSidebar({ isCollapsed = false }: AppSidebarProps) {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-200 font-semibold text-lg px-3 py-4">
            OPPTickets
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        transition-all duration-200 hover:bg-slate-700/50 hover:text-white
                        ${isActive 
                          ? 'bg-blue-600/20 text-blue-200 border-r-2 border-blue-400' 
                          : 'text-slate-300'
                        }
                      `}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
