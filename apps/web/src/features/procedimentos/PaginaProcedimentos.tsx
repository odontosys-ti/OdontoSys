import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { api } from '../../shared/api/client';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Spinner,
  Table,
} from '../../shared/ui';

type Item = { id: string; nome: string; duracaoMinutos: number };

export function PaginaProcedimentos(): ReactElement {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);

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
      setModalAberto(false);
      setNome('');
      setDuracao('30');
    },
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError)
    return <ErrorState mensagem="Não foi possível carregar o catálogo de procedimentos." />;

  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        titulo="Procedimentos"
        subtitulo="Catálogo de procedimentos odontológicos e tempos padrão de duração"
        acao={
          <Button type="button" onClick={() => setModalAberto(true)}>
            <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Novo procedimento
          </Button>
        }
      />

      {dados.length === 0 ? (
        <EmptyState
          mensagem="Nenhum procedimento cadastrado"
          subtitulo="Cadastre os serviços e durações da sua clínica para uso nos agendamentos."
          acao={
            <Button variant="outline" size="sm" onClick={() => setModalAberto(true)}>
              Cadastrar procedimento
            </Button>
          }
        />
      ) : (
        <Table cabecalhos={['Procedimento', 'Duração Estimada']}>
          {dados.map((item) => (
            <tr key={item.id} className="hover:bg-black/[0.015] transition-colors">
              <td className="px-4 py-3.5">
                <span className="font-semibold text-ink-900">{item.nome}</span>
              </td>
              <td className="px-4 py-3.5">
                <Badge variant="neutral">
                  <svg
                    className="h-3 w-3 text-ink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {item.duracaoMinutos} minutos
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Modal Novo Procedimento */}
      <Modal
        titulo="Novo Procedimento"
        descricao="Defina o nome do serviço e a duração padrão em minutos"
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
      >
        <form
          className="space-y-4 pt-2"
          onSubmit={(evento) => {
            evento.preventDefault();
            criar.mutate();
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">Nome do procedimento</label>
            <Input
              placeholder="Ex: Limpeza Dental, Restauração em Resina"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">
              Duração estimada (minutos)
            </label>
            <Input
              type="number"
              min={1}
              step={5}
              placeholder="Ex: 30, 45, 60"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              required
            />
          </div>

          {criar.isError ? (
            <ErrorState mensagem="Não foi possível cadastrar o procedimento. Verifique os campos." />
          ) : null}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/5">
            <Button variant="ghost" type="button" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? 'Salvando…' : 'Cadastrar procedimento'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
