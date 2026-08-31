import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { api } from '../../shared/api/client';
import { Button, EmptyState, ErrorState, Input, Spinner, Table } from '../../shared/ui';

type Item = { id: string; nome: string; duracaoMinutos: number };

export function PaginaProcedimentos(): ReactElement {
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () => api<{ dados: Item[] }>('/procedimentos?pagina=1&tamanho=50'),
  });
  const [nome, setNome] = useState('');
  const [duracao, setDuracao] = useState('30');
  const criar = useMutation({
    mutationFn: () =>
      api('/procedimentos', {
        method: 'POST',
        body: JSON.stringify({ nome, duracaoMinutos: Number(duracao) }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['procedimentos'] });
      setNome('');
    },
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState mensagem="Não foi possível carregar procedimentos." />;
  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Procedimentos</h1>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(evento) => {
          evento.preventDefault();
          criar.mutate();
        }}
      >
        <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input
          type="number"
          min={1}
          value={duracao}
          onChange={(e) => setDuracao(e.target.value)}
          aria-label="Duração em minutos"
        />
        <Button type="submit">Cadastrar</Button>
      </form>
      {criar.isError ? <ErrorState mensagem="Não foi possível cadastrar." /> : null}
      {dados.length === 0 ? (
        <EmptyState mensagem="Nenhum procedimento cadastrado." />
      ) : (
        <Table cabecalhos={['Nome', 'Duração (min)']}>
          {dados.map((item) => (
            <tr key={item.id} className="border-t border-line">
              <td className="px-3 py-2">{item.nome}</td>
              <td className="px-3 py-2">{item.duracaoMinutos}</td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}
