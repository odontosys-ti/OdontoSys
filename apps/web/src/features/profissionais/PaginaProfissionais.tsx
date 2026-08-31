import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { api } from '../../shared/api/client';
import { Button, EmptyState, ErrorState, Input, Spinner, Table } from '../../shared/ui';

type Item = { id: string; nome: string; cro: string; especialidade: string; usuarioId: string };

export function PaginaProfissionais(): ReactElement {
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => api<{ dados: Item[] }>('/profissionais?pagina=1&tamanho=50'),
  });
  const [nome, setNome] = useState('');
  const [cro, setCro] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [usuarioId, setUsuarioId] = useState('');

  const criar = useMutation({
    mutationFn: () =>
      api('/profissionais', {
        method: 'POST',
        body: JSON.stringify({ nome, cro, especialidade, usuarioId }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      setNome('');
      setCro('');
      setEspecialidade('');
    },
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState mensagem="Não foi possível carregar profissionais." />;
  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Profissionais</h1>
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(evento) => {
          evento.preventDefault();
          criar.mutate();
        }}
      >
        <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <Input placeholder="CRO" value={cro} onChange={(e) => setCro(e.target.value)} required />
        <Input
          placeholder="Especialidade"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          required
        />
        <Input
          placeholder="ID do usuário"
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
          required
        />
        <Button type="submit">Cadastrar</Button>
      </form>
      {criar.isError ? <ErrorState mensagem="Não foi possível cadastrar." /> : null}
      {dados.length === 0 ? (
        <EmptyState mensagem="Nenhum profissional cadastrado." />
      ) : (
        <Table cabecalhos={['Nome', 'CRO', 'Especialidade']}>
          {dados.map((item) => (
            <tr key={item.id} className="border-t border-line">
              <td className="px-3 py-2">{item.nome}</td>
              <td className="px-3 py-2">{item.cro}</td>
              <td className="px-3 py-2">{item.especialidade}</td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}
