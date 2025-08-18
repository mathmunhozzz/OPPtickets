import { Home, Ticket, LogOut, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter } from '@/components/ui/sidebar';
const menuItems = [{
  title: 'Dashboard',
  url: '/',
  icon: Home
}, {
  title: 'Tickets',
  url: '/tickets',
  icon: Ticket
}];
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signOut
  } = useAuth();
  const {
    data: userRole
  } = useUserRole();
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  const isActive = (url: string) => location.pathname === url;
  const canViewUsers = userRole === 'admin' || userRole === 'manager';
  return <Sidebar className="border-r border-white/20 bg-white/70 backdrop-blur-lg">
      <SidebarHeader className="border-b border-white/20 px-6 py-4">
        <div className="flex items-center gap-2">
          
          <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            OPPTickets
          </h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`transition-all duration-200 ${isActive(item.url) ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-sm' : 'hover:bg-white/50'}`}>
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              
              {canViewUsers && <SidebarMenuItem>
                  <SidebarMenuButton asChild className={`transition-all duration-200 ${isActive('/usuarios') ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-sm' : 'hover:bg-white/50'}`}>
                    <a href="/usuarios" className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Usuários</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/20 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>;
}