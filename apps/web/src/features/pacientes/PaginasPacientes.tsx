import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { api } from '../../shared/api/client';
import { Button, EmptyState, ErrorState, Input, Spinner, Table } from '../../shared/ui';

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
        `/pacientes?pagina=1&tamanho=20${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`
      ),
  });

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState mensagem="Não foi possível carregar pacientes." />;

  const dados = consulta.data?.dados ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Link to="/pacientes/novo">
          <Button type="button">Novo paciente</Button>
        </Link>
      </div>
      <Input
        placeholder="Buscar por nome"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {dados.length === 0 ? (
        <EmptyState mensagem="Nenhum paciente encontrado." />
      ) : (
        <Table cabecalhos={['Nome', 'Documento', '']}>
          {dados.map((item) => (
            <tr key={item.id} className="border-t border-line">
              <td className="px-3 py-2">{item.nome}</td>
              <td className="px-3 py-2">{item.documento}</td>
              <td className="px-3 py-2">
                <Link className="text-brand-700" to={`/pacientes/${item.id}`}>
                  Editar
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
    <form
      className="max-w-lg space-y-3"
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
      <h1 className="text-2xl font-semibold">{id ? 'Editar paciente' : 'Novo paciente'}</h1>
      <Input
        defaultValue={inicial?.nome}
        placeholder="Nome"
        onChange={(e) => setNome(e.target.value)}
        required={!id}
      />
      <Input
        defaultValue={inicial?.documento}
        placeholder="Documento"
        onChange={(e) => setDocumento(e.target.value)}
        required={!id}
      />
      <Input
        type="date"
        defaultValue={inicial?.nascimento?.slice(0, 10)}
        onChange={(e) => setNascimento(e.target.value)}
        required={!id}
      />
      <Input
        defaultValue={inicial?.observacoes}
        placeholder="Observações"
        onChange={(e) => setObservacoes(e.target.value)}
      />
      {salvar.isError ? <ErrorState mensagem="Não foi possível salvar." /> : null}
      <Button type="submit" disabled={salvar.isPending}>
        Salvar
      </Button>
    </form>
  );
}
