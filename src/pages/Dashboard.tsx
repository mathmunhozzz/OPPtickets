
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  // Estatísticas dos tickets
  const { data: ticketStats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      // Use direct query instead of RPC for now
      const { data, error } = await supabase
        .from('tickets')
        .select('*');
      
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
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
    },
    {
      title: 'Em Análise',
      value: ticketStats?.em_analise || 0,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-50 to-yellow-100',
    },
    {
      title: 'Corrigidos',
      value: ticketStats?.corrigido || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
    },
    {
      title: 'Negados',
      value: ticketStats?.negado || 0,
      icon: XCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100',
    },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground">Visão geral do sistema de tickets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={stat.title} 
                className="backdrop-blur-sm bg-white/70 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="backdrop-blur-sm bg-white/70 border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Bem-vindo ao OPPTickets
              </CardTitle>
              <CardDescription className="text-base">
                Sistema de gerenciamento de tickets de ordem e serviço por setores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Use o menu lateral para navegar entre as diferentes seções do sistema.
                Você pode visualizar e gerenciar tickets do seu setor através da página de Tickets.
                {ticketStats && (
                  <>
                    <br /><br />
                    <strong>Resumo atual:</strong> Você tem acesso a {ticketStats.total} tickets, 
                    sendo {ticketStats.pendente} pendentes, {ticketStats.em_analise} em análise, {' '}
                    {ticketStats.corrigido} corrigidos e {ticketStats.negado} negados.
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default Dashboard;
