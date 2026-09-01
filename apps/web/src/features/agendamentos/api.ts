import {
  SchemaAgendamentoResponse,
  SchemaAtualizarStatusAgendamento,
  SchemaAgendamentosDiaQuery,
  SchemaAtualizarAgendamento,
  SchemaCriarAgendamento,
  SchemaListaAgendamentos,
  type AtualizarAgendamentoRequest,
  type CriarAgendamentoRequest,
  type StatusAgendamento,
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

export function useAgendamentosDia(data: string, profissionalId: string) {
  const params = new URLSearchParams({ data });
  if (profissionalId) params.set('profissionalId', profissionalId);
  return useQuery({
    queryKey: ['agendamentos-dia', data, profissionalId],
    queryFn: () => {
      SchemaAgendamentosDiaQuery.parse({ data, profissionalId: profissionalId || undefined });
      return api(`/agendamentos/dia?${params.toString()}`, SchemaListaAgendamentos);
    },
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      void queryClient.invalidateQueries({ queryKey: ['agendamentos-dia'] });
    },
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      void queryClient.invalidateQueries({ queryKey: ['agendamentos-dia'] });
    },
  });
}

export function useCancelarAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/agendamentos/${id}`, SchemaAgendamentoResponse, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      void queryClient.invalidateQueries({ queryKey: ['agendamentos-dia'] });
    },
  });
}

export function useAtualizarStatusAgendamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusAgendamento }) =>
      api(`/agendamentos/${id}/status`, SchemaAgendamentoResponse, {
        method: 'PATCH',
        body: JSON.stringify(SchemaAtualizarStatusAgendamento.parse({ status })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      void queryClient.invalidateQueries({ queryKey: ['agendamentos-dia'] });
    },
  });
}
