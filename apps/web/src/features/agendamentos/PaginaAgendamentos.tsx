import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactElement } from 'react';

import { api } from '../../shared/api/client';
import { Button, EmptyState, ErrorState, Input, Select, Spinner, Table } from '../../shared/ui';

type Agendamento = {
  id: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  inicio: string;
  fim: string;
  status: string;
};

export function PaginaAgendamentos(): ReactElement {
  const agora = useMemo(() => new Date(), []);
  const dePadrao = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const atePadrao = new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const [de, setDe] = useState(dePadrao.slice(0, 16));
  const [ate, setAte] = useState(atePadrao.slice(0, 16));
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ['agendamentos', de, ate],
    queryFn: () =>
      api<{ dados: Agendamento[] }>(
        `/agendamentos?pagina=1&tamanho=50&de=${new Date(de).toISOString()}&ate=${new Date(ate).toISOString()}`
      ),
  });
  const profissionais = useQuery({
    queryKey: ['profissionais'],
    queryFn: () =>
      api<{ dados: Array<{ id: string; nome: string }> }>('/profissionais?pagina=1&tamanho=50'),
  });
  const pacientes = useQuery({
    queryKey: ['pacientes', ''],
    queryFn: () =>
      api<{ dados: Array<{ id: string; nome: string }> }>('/pacientes?pagina=1&tamanho=50'),
  });
  const procedimentos = useQuery({
    queryKey: ['procedimentos'],
    queryFn: () =>
      api<{ dados: Array<{ id: string; nome: string }> }>('/procedimentos?pagina=1&tamanho=50'),
  });

  const [pacienteId, setPacienteId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [procedimentoId, setProcedimentoId] = useState('');
  const [inicio, setInicio] = useState('');

  const criar = useMutation({
    mutationFn: () =>
      api('/agendamentos', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId,
          profissionalId,
          procedimentoId,
          inicio: new Date(inicio).toISOString(),
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  const cancelar = useMutation({
    mutationFn: (id: string) => api(`/agendamentos/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState mensagem="Não foi possível carregar agendamentos." />;
  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Agendamentos</h1>
      <p className="text-sm text-ink-600">Lista cronológica por período — não é a agenda do dia.</p>
      <div className="flex flex-wrap gap-2">
        <Input type="datetime-local" value={de} onChange={(e) => setDe(e.target.value)} />
        <Input type="datetime-local" value={ate} onChange={(e) => setAte(e.target.value)} />
      </div>
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(evento) => {
          evento.preventDefault();
          criar.mutate();
        }}
      >
        <Select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required>
          <option value="">Paciente</option>
          {(pacientes.data?.dados ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Select value={profissionalId} onChange={(e) => setProfissionalId(e.target.value)} required>
          <option value="">Profissional</option>
          {(profissionais.data?.dados ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Select value={procedimentoId} onChange={(e) => setProcedimentoId(e.target.value)} required>
          <option value="">Procedimento</option>
          {(procedimentos.data?.dados ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Select>
        <Input
          type="datetime-local"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          required
        />
        <Button type="submit">Agendar</Button>
      </form>
      {criar.isError ? (
        <ErrorState mensagem="Não foi possível agendar. Verifique conflito ou horário." />
      ) : null}
      {dados.length === 0 ? (
        <EmptyState mensagem="Nenhum agendamento no período." />
      ) : (
        <Table cabecalhos={['Início', 'Fim', 'Status', '']}>
          {dados.map((item) => (
            <tr key={item.id} className="border-t border-line">
              <td className="px-3 py-2">{new Date(item.inicio).toLocaleString('pt-BR')}</td>
              <td className="px-3 py-2">{new Date(item.fim).toLocaleString('pt-BR')}</td>
              <td className="px-3 py-2">{item.status}</td>
              <td className="px-3 py-2">
                {item.status === 'AGENDADO' ? (
                  <Button variant="danger" type="button" onClick={() => cancelar.mutate(item.id)}>
                    Cancelar
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}
