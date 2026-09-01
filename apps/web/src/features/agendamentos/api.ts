import {
  SchemaAgendamentoResponse,
  SchemaAtualizarAgendamento,
  SchemaCriarAgendamento,
  SchemaListaAgendamentos,
  type AtualizarAgendamentoRequest,
  type CriarAgendamentoRequest,
} from '@odontosys/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';

export function useAgendamentos(de: string, ate: string, profissionalId: string) {
  const params = new URLSearchParams({ pagina: '1', tamanho: '50', de, ate });
  if (profissionalId) params.set('profissionalId', profissionalId);
  return useQuery({
    queryKey: ['agendamentos', de, ate, profissionalId],
    queryFn: () => api(`/agendamentos?${params.toString()}`, SchemaListaAgendamentos),
  });
}

export function useCriarAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarAgendamentoRequest) =>
      api('/agendamentos', SchemaAgendamentoResponse, {
        method: 'POST',
        body: JSON.stringify(SchemaCriarAgendamento.parse(payload)),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useReagendarAgendamento(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AtualizarAgendamentoRequest) =>
      api(`/agendamentos/${id}`, SchemaAgendamentoResponse, {
        method: 'PATCH',
        body: JSON.stringify(SchemaAtualizarAgendamento.parse(payload)),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}

export function useCancelarAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/agendamentos/${id}`, SchemaAgendamentoResponse, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agendamentos'] }),
  });
}
