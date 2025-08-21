import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TicketFilters {
  status?: string;
  sector_id?: string;
  created_by?: string;
  priority?: string;
  start_date?: Date;
  end_date?: Date;
  search?: string;
}

const Relatorios = () => {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Buscar setores para o filtro
  const { data: sectors } = useQuery({
    queryKey: ['sectors-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar usuários para o filtro
  const { data: users } = useQuery({
    queryKey: ['users-for-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar tickets com filtros
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          sectors!tickets_sector_id_fkey (
            id,
            name
          ),
          employees!tickets_assigned_to_fkey (
            id,
            name,
            email
          )
        `);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }
      if (filters.sector_id) {
        query = query.eq('sector_id', filters.sector_id);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.start_date) {
        query = query.gte('created_at', format(filters.start_date, 'yyyy-MM-dd'));
      }
      if (filters.end_date) {
        query = query.lte('created_at', format(filters.end_date, 'yyyy-MM-dd'));
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportToCSV = () => {
    if (!tickets?.length) return;
    
    const csvHeaders = [
      'ID',
      'Título',
      'Status',
      'Prioridade',
      'Setor',
      'Responsável',
      'Criado em',
      'Atualizado em'
    ];
    
    const csvRows = tickets.map(ticket => [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority || 'N/A',
      ticket.sectors?.name || 'N/A',
      ticket.employees?.name || 'N/A',
      format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm'),
      format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm')
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: 'secondary',
      'em-andamento': 'default',
      concluido: 'destructive',
      cancelado: 'outline'
    };
    return variants[status] || 'secondary';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      baixa: 'secondary',
      media: 'default',
      alta: 'destructive'
    };
    return variants[priority] || 'secondary';
  };

  return (
    <AdminGuard>
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Relatórios de Tickets
            </h1>
            <p className="text-slate-600 mt-2">
              Analise e exporte dados dos tickets com filtros avançados
            </p>
          </div>

          <div className="grid gap-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>
                      Configure os filtros para refinar sua busca
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                  </Button>
                </div>
              </CardHeader>
              
              {showFilters && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Busca por texto */}
                    <div>
                      <Label htmlFor="search">Buscar</Label>
                      <Input
                        id="search"
                        placeholder="Título ou descrição..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <Label>Status</Label>
                      <Select onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em-andamento">Em andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Prioridade */}
                    <div>
                      <Label>Prioridade</Label>
                      <Select onValueChange={(value) => handleFilterChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as prioridades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as prioridades</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Setor */}
                    <div>
                      <Label>Setor</Label>
                      <Select onValueChange={(value) => handleFilterChange('sector_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os setores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os setores</SelectItem>
                          {sectors?.map(sector => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Criado por */}
                    <div>
                      <Label>Criado por</Label>
                      <Select onValueChange={(value) => handleFilterChange('created_by', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os usuários" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os usuários</SelectItem>
                          {users?.map(user => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Data início */}
                    <div>
                      <Label>Data inicial</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !filters.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.start_date ? format(filters.start_date, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.start_date}
                            onSelect={(date) => handleFilterChange('start_date', date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Data fim */}
                    <div>
                      <Label>Data final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !filters.end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.end_date ? format(filters.end_date, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.end_date}
                            onSelect={(date) => handleFilterChange('end_date', date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                    <Button onClick={exportToCSV} className="gap-2">
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Resultados ({tickets?.length || 0} tickets)
                </CardTitle>
                <CardDescription>
                  Lista de tickets baseada nos filtros selecionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : tickets?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Criado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium max-w-xs truncate">
                              {ticket.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPriorityBadge(ticket.priority || '')}>
                                {ticket.priority || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ticket.sectors?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {ticket.employees?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum ticket encontrado com os filtros selecionados.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AdminGuard>
  );
};

export default Relatorios;