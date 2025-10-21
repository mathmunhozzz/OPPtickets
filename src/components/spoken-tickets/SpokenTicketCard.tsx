import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Calendar, User, Users, Building } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SpokenTicketCardProps {
  ticket: any;
  onClick: () => void;
}

const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  em_analise: 'bg-blue-100 text-blue-800 border-blue-300',
  em_andamento: 'bg-purple-100 text-purple-800 border-purple-300',
  aguardando_resposta: 'bg-orange-100 text-orange-800 border-orange-300',
  resolvido: 'bg-green-100 text-green-800 border-green-300',
  fechado: 'bg-gray-100 text-gray-800 border-gray-300',
};

const priorityColors = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
};

export function SpokenTicketCard({ ticket, onClick }: SpokenTicketCardProps) {
  const statusColor = statusColors[ticket.status as keyof typeof statusColors] || statusColors.pendente;
  const priorityColor = priorityColors[ticket.priority as keyof typeof priorityColors] || priorityColors.media;

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-purple-200 bg-gradient-to-br from-white/90 to-purple-50/30 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-200 hover:scale-[1.02]"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {ticket.title}
            </h3>
          </div>
          <Badge className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1 shrink-0">
            <Radio className="h-3 w-3" />
            Spoken #{ticket.request_number}
          </Badge>
        </div>

        {/* Status e Prioridade */}
        <div className="flex gap-2 mt-2">
          <Badge className={statusColor}>
            {ticket.status?.replace('_', ' ')}
          </Badge>
          <Badge className={priorityColor}>
            {ticket.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Descrição resumida */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {ticket.description}
        </p>

        {/* Informações */}
        <div className="space-y-2 text-sm">
          {/* Atendente */}
          {ticket.employees && (
            <div className="flex items-center gap-2 text-purple-700">
              <User className="h-4 w-4" />
              <span className="font-medium">{ticket.employees.name}</span>
              {ticket.employees.cpf && (
                <span className="text-xs text-purple-500">
                  CPF: {ticket.employees.cpf}
                </span>
              )}
            </div>
          )}

          {/* Cliente */}
          {ticket.funcionarios_clientes && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{ticket.funcionarios_clientes.name}</span>
              {ticket.funcionarios_clientes.clients && (
                <span className="text-xs text-gray-500">
                  ({ticket.funcionarios_clientes.clients.name})
                </span>
              )}
            </div>
          )}

          {/* Setor */}
          {ticket.sectors && (
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="h-4 w-4" />
              <span>{ticket.sectors.name}</span>
            </div>
          )}

          {/* Data de criação */}
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Calendar className="h-3 w-3" />
            <span>
              Importado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
