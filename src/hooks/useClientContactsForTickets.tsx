import { useState, useEffect } from 'react';

export const useClientContactsForTickets = (sectorId?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulação temporária para resolver erro TypeScript
    // TODO: Implementar query real quando resolver problemas de tipos
    setIsLoading(false);
    setData([]);
  }, [sectorId]);

  return { data, isLoading, error };
};