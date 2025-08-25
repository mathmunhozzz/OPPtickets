import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GroupHeaderProps {
  title: string;
  count: number;
  color?: string;
  bgColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const GroupHeader = ({ 
  title, 
  count, 
  color = 'from-slate-500 to-slate-600', 
  bgColor = 'from-slate-50 to-slate-100',
  children,
  defaultOpen = true
}: GroupHeaderProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto bg-white/60 backdrop-blur-sm border border-white/30 hover:bg-white/80 rounded-lg mb-3"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color} shadow-sm`} />
            <span className="font-semibold text-slate-700">{title}</span>
            <Badge 
              variant="secondary" 
              className="text-xs bg-white/60 text-slate-600"
            >
              {count}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};