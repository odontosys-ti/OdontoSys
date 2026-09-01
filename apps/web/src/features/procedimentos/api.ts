import {
  SchemaAtualizarProcedimento,
  SchemaCriarProcedimento,
  SchemaListaProcedimentos,
  SchemaProcedimentoResponse,
  type AtualizarProcedimentoRequest,
  type CriarProcedimentoRequest,
} from '@odontosys/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';

export function useProcedimentos() {
  return useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => api('/procedimentos?pagina=1&tamanho=50', SchemaListaProcedimentos),
  });
}

export function useSalvarProcedimento(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarProcedimentoRequest | AtualizarProcedimentoRequest) => {
      const entrada = id
        ? SchemaAtualizarProcedimento.parse(payload)
        : SchemaCriarProcedimento.parse(payload);
      return api(id ? `/procedimentos/${id}` : '/procedimentos', SchemaProcedimentoResponse, {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(entrada),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedimentos'] }),
  });
}
