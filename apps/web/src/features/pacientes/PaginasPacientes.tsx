import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { api } from '../../shared/api/client';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Spinner,
  Table,
} from '../../shared/ui';

type Paciente = {
  id: string;
  nome: string;
  documento: string;
  nascimento: string;
  observacoes: string;
};

export function PaginaPacientes(): ReactElement {
  const [busca, setBusca] = useState('');
  const consulta = useQuery({
    queryKey: ['pacientes', busca],
    queryFn: () =>
      api<{ dados: Paciente[] }>(
        `/pacientes?pagina=1&tamanho=50${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`
      ),
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState mensagem="Não foi possível carregar os pacientes." />;

  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        titulo="Pacientes"
        subtitulo="Gestão cadastral de prontuários e pacientes da clínica"
        acao={
          <Link to="/pacientes/novo">
            <Button type="button">
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Novo paciente
            </Button>
          </Link>
        }
      />

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Input
          placeholder="Buscar paciente por nome…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {dados.length === 0 ? (
        <EmptyState
          mensagem="Nenhum paciente encontrado"
          subtitulo={
            busca
              ? 'Tente ajustar os termos da sua busca.'
              : 'Comece adicionando o primeiro paciente da sua clínica.'
          }
          acao={
            !busca ? (
              <Link to="/pacientes/novo">
                <Button variant="outline" size="sm">
                  Cadastrar paciente
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <Table cabecalhos={['Paciente', 'Documento', 'Data de Nascimento', 'Ações']}>
          {dados.map((item) => (
            <tr key={item.id} className="hover:bg-black/[0.015] transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-100">
                    {item.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-ink-900 block">{item.nome}</span>
                    {item.observacoes ? (
                      <span className="text-xs text-ink-400 block truncate max-w-xs">
                        {item.observacoes}
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs text-ink-700">{item.documento}</td>
              <td className="px-4 py-3.5 text-xs text-ink-600">
                {item.nascimento
                  ? new Date(item.nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                  : '—'}
              </td>
              <td className="px-4 py-3.5">
                <Link to={`/pacientes/${item.id}`}>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}

export function PaginaPacienteFormulario(): ReactElement {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const existente = useQuery({
    queryKey: ['paciente', id],
    enabled: Boolean(id),
    queryFn: () => api<Paciente>(`/pacientes/${id}`),
  });

  const salvar = useMutation({
    mutationFn: (payload: {
      nome: string;
      documento: string;
      nascimento: string;
      observacoes: string;
    }) =>
      api(id ? `/pacientes/${id}` : '/pacientes', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      navigate('/pacientes');
    },
  });

  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  if (id && existente.isLoading) return <Spinner />;
  if (id && existente.isError) return <ErrorState mensagem="Paciente não encontrado." />;

  const inicial = existente.data;

  return (
    <section className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/pacientes">
          <Button variant="ghost" size="sm">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar
          </Button>
        </Link>
      </div>

      <PageHeader
        titulo={id ? 'Editar paciente' : 'Novo paciente'}
        subtitulo={
          id
            ? 'Atualize os dados cadastrais do paciente'
            : 'Preencha as informações básicas para abrir o prontuário'
        }
      />

      <Card>
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            salvar.mutate({
              nome: nome || inicial?.nome || '',
              documento: documento || inicial?.documento || '',
              nascimento: nascimento || inicial?.nascimento || '',
              observacoes: observacoes || inicial?.observacoes || '',
            });
          }}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">Nome completo</label>
            <Input
              defaultValue={inicial?.nome}
              placeholder="Ex: João da Silva"
              onChange={(e) => setNome(e.target.value)}
              required={!id}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">
                Documento (CPF / RG)
              </label>
              <Input
                defaultValue={inicial?.documento}
                placeholder="Ex: 12345678900"
                onChange={(e) => setDocumento(e.target.value)}
                required={!id}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink-700">Data de nascimento</label>
              <Input
                type="date"
                defaultValue={inicial?.nascimento?.slice(0, 10)}
                onChange={(e) => setNascimento(e.target.value)}
                required={!id}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink-700">
              Observações clínicas gerais
            </label>
            <Input
              defaultValue={inicial?.observacoes}
              placeholder="Alergias, observações ou notas de atendimento"
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          {salvar.isError ? (
            <ErrorState mensagem="Não foi possível salvar os dados do paciente. Verifique os campos." />
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
            <Link to="/pacientes">
              <Button variant="ghost" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : id ? 'Salvar alterações' : 'Cadastrar paciente'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
