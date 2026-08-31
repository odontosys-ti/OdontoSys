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

type Item = { id: string; nome: string; cro: string; especialidade: string; usuarioId: string };

export function PaginaProfissionais(): ReactElement {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);

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
      setModalAberto(false);
      setNome('');
      setCro('');
      setEspecialidade('');
      setUsuarioId('');
    },
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError)
    return <ErrorState mensagem="Não foi possível carregar o cadastro de profissionais." />;

  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        titulo="Profissionais"
        subtitulo="Corpo clínico, dentistas e especialistas cadastrados"
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
            Novo profissional
          </Button>
        }
      />

      {dados.length === 0 ? (
        <EmptyState
          mensagem="Nenhum profissional cadastrado"
          subtitulo="Cadastre dentistas e especialistas para liberar a agenda da clínica."
          acao={
            <Button variant="outline" size="sm" onClick={() => setModalAberto(true)}>
              Cadastrar profissional
            </Button>
          }
        />
      ) : (
        <Table cabecalhos={['Profissional', 'CRO', 'Especialidade']}>
          {dados.map((item) => (
            <tr key={item.id} className="hover:bg-black/[0.015] transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                    {item.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-ink-900">{item.nome}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-ink-700">CRO {item.cro}</td>
              <td className="px-4 py-3.5">
                <Badge variant="info">{item.especialidade}</Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Modal Novo Profissional */}
      <Modal
        titulo="Novo Profissional"
        descricao="Preencha os dados do dentista ou especialista"
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
            <label className="block text-xs font-semibold text-ink-700">Nome completo</label>
            <Input
              placeholder="Ex: Dr. Carlos Mendes"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">Número do CRO</label>
              <Input
                placeholder="Ex: 12345"
                value={cro}
                onChange={(e) => setCro(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">Especialidade</label>
              <Input
                placeholder="Ex: Ortodontia, Clínica Geral"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">
              ID do Usuário de Sistema (UUID)
            </label>
            <Input
              placeholder="UUID do usuário vinculado"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              required
            />
          </div>

          {criar.isError ? (
            <ErrorState mensagem="Não foi possível cadastrar o profissional. Verifique os dados." />
          ) : null}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/5">
            <Button variant="ghost" type="button" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? 'Salvando…' : 'Cadastrar profissional'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
