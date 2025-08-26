import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Clock, Trash2, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Absence {
  id: string;
  employee_id: string;
  start_date: string;
  end_date?: string;
  reason: string;
  status: string;
  admin_observation?: string;
  created_at: string;
  employees: {
    name: string;
    email?: string;
  };
}

export const EmployeeAbsencesManager = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const queryClient = useQueryClient();

  const { data: absences, isLoading } = useQuery({
    queryKey: ['employee-absences'],
    queryFn: async () => {
      // Primeiro buscar as ausências
      const { data: absencesData, error: absencesError } = await supabase
        .from('employee_absences')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (absencesError) throw absencesError;
      if (!absencesData?.length) return [];

      // Buscar dados dos funcionários
      const employeeIds = [...new Set(absencesData.map(absence => absence.employee_id))];
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, email')
        .in('id', employeeIds);
      
      if (employeesError) throw employeesError;

      // Criar map de funcionários
      const employeesMap = new Map(employeesData?.map(emp => [emp.id, emp]) || []);

      // Combinar dados
      return absencesData.map(absence => ({
        ...absence,
        employees: employeesMap.get(absence.employee_id) || { name: 'Funcionário não encontrado', email: undefined }
      })) as Absence[];
    }
  });

  const deleteAbsenceMutation = useMutation({
    mutationFn: async (absenceId: string) => {
      const { error } = await supabase
        .from('employee_absences')
        .delete()
        .eq('id', absenceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ausência excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['employee-absences'] });
      setDeleteDialogOpen(false);
      setSelectedAbsence(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir ausência:', error);
      toast.error('Erro ao excluir ausência');
    }
  });

  const handleDeleteClick = (absence: Absence) => {
    setSelectedAbsence(absence);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Gerenciar Ausências dos Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {absences && absences.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map((absence) => (
                    <TableRow key={absence.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{absence.employees.name}</div>
                          {absence.employees.email && (
                            <div className="text-sm text-muted-foreground">{absence.employees.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(absence.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                            {absence.end_date && (
                              <> até {format(new Date(absence.end_date), 'dd/MM/yyyy', { locale: ptBR })}</>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{absence.reason}</span>
                        {absence.admin_observation && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Obs: {absence.admin_observation}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(absence.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(absence.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(absence)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ausência registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ausência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ausência de <strong>{selectedAbsence?.employees.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAbsence && deleteAbsenceMutation.mutate(selectedAbsence.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAbsenceMutation.isPending}
            >
              {deleteAbsenceMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};