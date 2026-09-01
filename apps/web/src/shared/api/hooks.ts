import {
  SchemaLogin,
  SchemaLoginResponse,
  SchemaMeResponse,
  SchemaOk,
  type Papel,
} from '@odontosys/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';

export function useSessao() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api('/auth/me', SchemaMeResponse),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; senha: string }) => {
      const entrada = SchemaLogin.parse(payload);
      return api('/auth/login', SchemaLoginResponse, {
        method: 'POST',
        body: JSON.stringify(entrada),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/auth/logout', SchemaOk, { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData(['me'], null),
  });
}

export function papelPermite(papel: Papel | undefined, permitidos: Papel[]): boolean {
  return papel !== undefined && permitidos.includes(papel);
}
