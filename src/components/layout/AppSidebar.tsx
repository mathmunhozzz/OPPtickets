import {
  LayoutDashboard,
  ListChecks,
  Users,
  Activity,
  FileBarGraph,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface AppSidebarProps {
  isCollapsed: boolean;
}

export const AppSidebar = ({ isCollapsed }: AppSidebarProps) => {
  const sidebarItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/tickets",
      icon: ListChecks,
      label: "Tickets",
    },
    {
      path: "/usuarios",
      icon: Users,
      label: "Usuários",
    },
    {
      path: "/client-contacts",
      icon: Users,
      label: "Funcionários",
    },
    {
      path: "/relatorios",
      icon: FileBarGraph,
      label: "Relatórios",
    },
    {
      path: "/activity",
      icon: Activity,
      label: "Activity",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex-1">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900 ${
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-500"
                  }`
                }
              >
                <item.icon
                  className={`shrink-0 h-6 w-6 ${
                    isCollapsed ? "mr-0" : "mr-3"
                  } group-hover:text-gray-600 ${
                    item.path === "/" ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <span className={`${isCollapsed ? "hidden" : "block"}`}>
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
