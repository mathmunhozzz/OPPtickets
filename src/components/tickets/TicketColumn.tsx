
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketCard } from './TicketCard';

interface TicketColumnProps {
  status: string;
  title: string;
  tickets: any[];
  color: string;
  onRefetch: () => void;
}

export const TicketColumn = ({ status, title, tickets, color, onRefetch }: TicketColumnProps) => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          {title}
          <span className="ml-auto text-xs text-muted-foreground">
            {tickets.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onRefetch={onRefetch}
          />
        ))}
      </CardContent>
    </Card>
  );
};
