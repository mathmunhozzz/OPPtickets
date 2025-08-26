import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, User, AlertTriangle, Building2 } from 'lucide-react';

interface GroupHeaderProps {
  groupKey: string;
  groupValue: string;
  ticketCount: number;
  groupBy: 'priority' | 'assignee' | 'client';
  isCollapsed: boolean;
  onToggle: () => void;
}

const getGroupIcon = (groupBy: string) => {
  switch (groupBy) {
    case 'priority':
      return <AlertTriangle className="h-4 w-4" />;
    case 'assignee':
      return <User className="h-4 w-4" />;
    case 'client':
      return <Building2 className="h-4 w-4" />;
    default:
      return null;
  }
};

const getGroupColor = (groupBy: string, groupKey: string) => {
  if (groupBy === 'priority') {
    switch (groupKey) {
      case 'alta':
        return 'from-red-500 to-red-600';
      case 'media':
        return 'from-yellow-500 to-yellow-600';
      case 'baixa':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  }
  return 'from-blue-500 to-blue-600';
};

const formatGroupValue = (groupBy: string, groupValue: string, groupKey: string) => {
  if (groupBy === 'priority') {
    switch (groupKey) {
      case 'alta':
        return 'Alta Prioridade';
      case 'media':
        return 'Média Prioridade';
      case 'baixa':
        return 'Baixa Prioridade';
      default:
        return 'Sem Prioridade';
    }
  }
  
  if (groupBy === 'assignee') {
    return groupValue || 'Não Atribuído';
  }
  
  if (groupBy === 'client') {
    return groupValue || 'Sem Cliente';
  }
  
  return groupValue;
};

export const GroupHeader = ({
  groupKey,
  groupValue,
  ticketCount,
  groupBy,
  isCollapsed,
  onToggle
}: GroupHeaderProps) => {
  const color = getGroupColor(groupBy, groupKey);
  const icon = getGroupIcon(groupBy);
  const displayValue = formatGroupValue(groupBy, groupValue, groupKey);

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        className="w-full justify-start p-3 h-auto bg-white/60 backdrop-blur-sm hover:bg-white/80 border border-white/20 rounded-lg"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color} shadow-sm`} />
            
            {icon && (
              <div className="text-muted-foreground">
                {icon}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between w-full">
            <span className="font-medium text-slate-700">{displayValue}</span>
            <Badge variant="secondary" className="ml-auto bg-white/60">
              {ticketCount}
            </Badge>
          </div>
        </div>
      </Button>
    </div>
  );
};