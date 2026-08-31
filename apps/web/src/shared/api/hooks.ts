import type { MeResponse, Papel } from '@odontosys/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';

type Lista<T> = { dados: T[]; paginacao: { pagina: number; tamanho: number; total: number } };

export function useSessao() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<MeResponse>('/auth/me'),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; senha: string }) =>
      api<MeResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData(['me'], null),
  });
}

export function usePacientes(busca: string) {
  const params = new URLSearchParams({ pagina: '1', tamanho: '20' });
  if (busca) params.set('busca', busca);
  return useQuery({
    queryKey: ['pacientes', busca],
    queryFn: () => api<Lista<Record<string, string | boolean>>>(`/pacientes?${params.toString()}`),
  });
}

export function useProfissionais() {
  return useQuery({
    queryKey: ['profissionais'],
    queryFn: () =>
      api<Lista<Record<string, string | boolean>>>('/profissionais?pagina=1&tamanho=50'),
  });
}

export function useProcedimentos() {
  return useQuery({
    queryKey: ['procedimentos'],
    queryFn: () =>
      api<Lista<Record<string, string | number | boolean>>>('/procedimentos?pagina=1&tamanho=50'),
  });
}

export function useAgendamentos(de: string, ate: string) {
  const params = new URLSearchParams({ pagina: '1', tamanho: '50', de, ate });
  return useQuery({
    queryKey: ['agendamentos', de, ate],
    queryFn: () => api<Lista<Record<string, string>>>(`/agendamentos?${params.toString()}`),
  });
}

export function papelPermite(papel: Papel | undefined, permitidos: Papel[]): boolean {
  return papel !== undefined && permitidos.includes(papel);
}
