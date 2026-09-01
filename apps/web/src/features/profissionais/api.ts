import {
  SchemaAtualizarProfissional,
  SchemaCriarProfissional,
  SchemaListaProfissionais,
  SchemaProfissionalResponse,
  type AtualizarProfissionalRequest,
  type CriarProfissionalRequest,
} from '@odontosys/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';

export function useProfissionais() {
  return useQuery({
    queryKey: ['profissionais'],
    queryFn: () => api('/profissionais?pagina=1&tamanho=50', SchemaListaProfissionais),
  });
}

export function useSalvarProfissional(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarProfissionalRequest | AtualizarProfissionalRequest) => {
      const entrada = id
        ? SchemaAtualizarProfissional.parse(payload)
        : SchemaCriarProfissional.parse(payload);
      return api(id ? `/profissionais/${id}` : '/profissionais', SchemaProfissionalResponse, {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(entrada),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profissionais'] }),
  });
}
