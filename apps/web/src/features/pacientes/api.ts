import {
  SchemaAtualizarPaciente,
  SchemaCriarPaciente,
  SchemaListaPacientes,
  SchemaPacienteResponse,
  type AtualizarPacienteRequest,
  type CriarPacienteRequest,
} from '@odontosys/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';

export function usePacientes(busca: string) {
  const params = new URLSearchParams({ pagina: '1', tamanho: '50' });
  if (busca.trim()) params.set('busca', busca.trim());
  return useQuery({
    queryKey: ['pacientes', busca.trim()],
    queryFn: () => api(`/pacientes?${params.toString()}`, SchemaListaPacientes),
  });
}

export function usePaciente(id: string | undefined) {
  return useQuery({
    queryKey: ['paciente', id],
    enabled: id !== undefined,
    queryFn: () => api(`/pacientes/${id}`, SchemaPacienteResponse),
  });
}

export function useSalvarPaciente(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarPacienteRequest | AtualizarPacienteRequest) => {
      const entrada = id
        ? SchemaAtualizarPaciente.parse(payload)
        : SchemaCriarPaciente.parse(payload);
      return api(id ? `/pacientes/${id}` : '/pacientes', SchemaPacienteResponse, {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(entrada),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pacientes'] }),
        queryClient.invalidateQueries({ queryKey: ['paciente', id] }),
      ]);
    },
  });
}
