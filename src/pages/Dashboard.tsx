
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';

const Dashboard = () => {
  // Estatísticas dos tickets
  const { data: ticketStats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        pendente: data.filter(t => t.status === 'pendente').length,
        em_analise: data.filter(t => t.status === 'em_analise').length,
        corrigido: data.filter(t => t.status === 'corrigido').length,
        negado: data.filter(t => t.status === 'negado').length,
      };
      
      return stats;
    }
  });

  const stats = [
    {
      title: 'Total de Tickets',
      value: ticketStats?.total || 0,
      icon: Ticket,
      color: 'text-blue-600',
    },
    {
      title: 'Em Análise',
      value: ticketStats?.em_analise || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Corrigidos',
      value: ticketStats?.corrigido || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Negados',
      value: ticketStats?.negado || 0,
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de tickets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao OPPTickets</CardTitle>
            <CardDescription>
              Sistema de gerenciamento de tickets de ordem e serviço por setores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use o menu lateral para navegar entre as diferentes seções do sistema.
              Você pode visualizar e gerenciar tickets do seu setor através da página de Tickets.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
