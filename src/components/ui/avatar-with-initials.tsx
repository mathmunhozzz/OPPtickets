import { forwardRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AvatarWithInitialsProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'assignee' | 'client' | 'creator';
  className?: string;
  showTooltip?: boolean;
}

const getInitials = (name: string) => {
  if (!name || name.trim() === '') return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const sizeStyles = {
  sm: 'h-5 w-5 text-xs',
  md: 'h-6 w-6 text-xs',
  lg: 'h-8 w-8 text-sm'
};

const variantStyles = {
  assignee: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
  client: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white',
  creator: 'bg-gradient-to-br from-green-500 to-green-600 text-white'
};

export const AvatarWithInitials = forwardRef<HTMLDivElement, AvatarWithInitialsProps>(
  ({ name, size = 'md', variant = 'assignee', className, showTooltip = true }, ref) => {
    const initials = getInitials(name);
    
    const avatar = (
      <Avatar 
        ref={ref}
        className={cn(
          sizeStyles[size],
          'font-semibold shadow-sm ring-2 ring-white/50 transition-all duration-200 hover:scale-105',
          className
        )}
      >
        <AvatarFallback className={cn(variantStyles[variant])}>
          {initials}
        </AvatarFallback>
      </Avatar>
    );

    if (!showTooltip) return avatar;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatar}
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

AvatarWithInitials.displayName = 'AvatarWithInitials';