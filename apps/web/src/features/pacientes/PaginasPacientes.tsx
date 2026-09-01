import { useEffect, useState, type ReactElement } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';

import { papelPermite, useSessao } from '../../shared/api/hooks';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  MobileCard,
  PageHeader,
  Spinner,
  Table,
  Textarea,
  useToast,
} from '../../shared/ui';
import { usePaciente, usePacientes, useSalvarPaciente } from './api';

function formatarNascimento(valor: string): string {
  return new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function Documento({ valor }: { valor: string }): ReactElement {
  return <span className="font-mono text-xs text-ink-700">{valor}</span>;
}

export function PaginaPacientes(): ReactElement {
  const [busca, setBusca] = useState('');
  const sessao = useSessao();
  const consulta = usePacientes(busca);
  const podeEditar = papelPermite(sessao.data?.papel, ['RECEPCAO', 'ADMIN']);

  if (consulta.isLoading) return <Spinner texto="Carregando pacientes…" />;
  if (consulta.isError) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar os pacientes."
        onRetry={() => void consulta.refetch()}
      />
    );
  }

  const pacientes = consulta.data?.dados ?? [];
  const botaoNovo = podeEditar ? (
    <Link to="/pacientes/novo">
      <Button type="button">＋ Novo paciente</Button>
    </Link>
  ) : undefined;

  return (
    <section className="space-y-5">
      <PageHeader
        contexto="Cadastro clínico"
        titulo="Pacientes"
        subtitulo="Dados cadastrais essenciais, organizados para consulta rápida e segura."
        acao={botaoNovo}
      />

      <div className="flex items-center justify-between gap-3">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Buscar paciente por nome</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-ink-400"
          >
            ⌕
          </span>
          <Input
            type="search"
            placeholder="Buscar paciente por nome…"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            className="pl-10"
          />
        </label>
        <span className="hidden text-xs font-medium text-ink-500 sm:block">
          {consulta.data?.paginacao.total ?? 0} cadastrados
        </span>
      </div>

      {pacientes.length === 0 ? (
        <EmptyState
          mensagem="Nenhum paciente encontrado"
          subtitulo={
            busca ? 'Revise o nome informado.' : 'A clínica ainda não possui pacientes ativos.'
          }
          acao={!busca ? botaoNovo : undefined}
        />
      ) : (
        <Table
          cabecalhos={['Paciente', 'Documento', 'Nascimento', ...(podeEditar ? ['Ações'] : [])]}
          mobile={pacientes.map((paciente) => (
            <MobileCard
              key={paciente.id}
              titulo={paciente.nome}
              meta={`Nascimento: ${formatarNascimento(paciente.nascimento)}`}
            >
              <div className="flex items-center justify-between gap-3">
                <Documento valor={paciente.documento} />
                {podeEditar ? (
                  <Link to={`/pacientes/${paciente.id}`} aria-label={`Editar ${paciente.nome}`}>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </Link>
                ) : null}
              </div>
            </MobileCard>
          ))}
        >
          {pacientes.map((paciente) => (
            <tr key={paciente.id} className="transition-colors hover:bg-brand-50/35">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700"
                  >
                    {paciente.nome.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="block font-semibold text-ink-900">{paciente.nome}</span>
                    {paciente.observacoes ? (
                      <span className="block max-w-xs truncate text-xs text-ink-400">
                        {paciente.observacoes}
                      </span>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <Documento valor={paciente.documento} />
              </td>
              <td className="px-4 py-3.5 text-sm text-ink-600">
                {formatarNascimento(paciente.nascimento)}
              </td>
              {podeEditar ? (
                <td className="px-4 py-3.5">
                  <Link to={`/pacientes/${paciente.id}`} aria-label={`Editar ${paciente.nome}`}>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </Link>
                </td>
              ) : null}
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
  const sessao = useSessao();
  const consulta = usePaciente(id);
  const salvar = useSalvarPaciente(id);
  const toast = useToast();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!consulta.data) return;
    setNome(consulta.data.nome);
    setDocumento(consulta.data.documento);
    setNascimento(consulta.data.nascimento.slice(0, 10));
    setObservacoes(consulta.data.observacoes);
  }, [consulta.data]);

  if (sessao.data && !papelPermite(sessao.data.papel, ['RECEPCAO', 'ADMIN'])) {
    return <Navigate to="/pacientes" replace />;
  }
  if (id && consulta.isLoading) return <Spinner texto="Carregando cadastro…" />;
  if (id && consulta.isError) {
    return (
      <ErrorState mensagem="Paciente não encontrado." onRetry={() => void consulta.refetch()} />
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/pacientes"
        className="inline-flex text-sm font-semibold text-brand-700 hover:underline"
      >
        ← Voltar aos pacientes
      </Link>
      <PageHeader
        contexto="Cadastro clínico"
        titulo={id ? 'Editar paciente' : 'Novo paciente'}
        subtitulo="Mantenha somente as informações essenciais e revise os dados antes de salvar."
      />
      <Card>
        <form
          className="space-y-5"
          onSubmit={(evento) => {
            evento.preventDefault();
            salvar.mutate(
              {
                nome,
                documento,
                nascimento: new Date(`${nascimento}T00:00:00.000Z`).toISOString(),
                observacoes,
              },
              {
                onSuccess: () => {
                  toast.mostrar(id ? 'Paciente atualizado.' : 'Paciente cadastrado.');
                  navigate('/pacientes');
                },
              }
            );
          }}
        >
          <Field label="Nome completo">
            <Input
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              autoComplete="name"
              required
              data-autofocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Documento">
              <Input
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
                inputMode="numeric"
                minLength={11}
                required
              />
            </Field>
            <Field label="Data de nascimento">
              <Input
                type="date"
                value={nascimento}
                onChange={(evento) => setNascimento(evento.target.value)}
                required
              />
            </Field>
          </div>
          <Field
            label="Observações gerais"
            dica="Não registre informações além do necessário para o cadastro base."
          >
            <Textarea
              value={observacoes}
              onChange={(evento) => setObservacoes(evento.target.value)}
            />
          </Field>
          {salvar.isError ? (
            <ErrorState
              mensagem="Não foi possível salvar o paciente."
              detalhe="Revise os campos e tente novamente."
            />
          ) : null}
          <div className="flex flex-col-reverse gap-2 border-t border-black/[0.06] pt-5 sm:flex-row sm:justify-end">
            <Link to="/pacientes">
              <Button variant="ghost" type="button" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={salvar.isPending} className="w-full sm:w-auto">
              {salvar.isPending ? 'Salvando…' : id ? 'Salvar alterações' : 'Cadastrar paciente'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
