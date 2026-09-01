import type { ProcedimentoResponse } from '@odontosys/contracts';
import { useState, type ReactElement } from 'react';

import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  MobileCard,
  Modal,
  PageHeader,
  Spinner,
  Table,
  useToast,
} from '../../shared/ui';
import { useProcedimentos, useSalvarProcedimento } from './api';

type Formulario = { nome: string; duracao: string };
const formularioVazio: Formulario = { nome: '', duracao: '30' };

export function PaginaProcedimentos(): ReactElement {
  const consulta = useProcedimentos();
  const toast = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ProcedimentoResponse>();
  const [formulario, setFormulario] = useState<Formulario>(formularioVazio);
  const salvar = useSalvarProcedimento(editando?.id);

  const abrir = (item?: ProcedimentoResponse) => {
    setEditando(item);
    setFormulario(
      item ? { nome: item.nome, duracao: String(item.duracaoMinutos) } : formularioVazio
    );
    setModalAberto(true);
  };
  const fechar = () => {
    setModalAberto(false);
    setEditando(undefined);
    setFormulario(formularioVazio);
    salvar.reset();
  };

  if (consulta.isLoading) return <Spinner texto="Carregando procedimentos…" />;
  if (consulta.isError) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar o catálogo de procedimentos."
        onRetry={() => void consulta.refetch()}
      />
    );
  }

  const procedimentos = consulta.data?.dados ?? [];
  return (
    <section className="space-y-5">
      <PageHeader
        contexto="Configuração clínica"
        titulo="Procedimentos"
        subtitulo="Serviços oferecidos e duração padrão usada no agendamento simples."
        acao={<Button onClick={() => abrir()}>＋ Novo procedimento</Button>}
      />
      {procedimentos.length === 0 ? (
        <EmptyState
          mensagem="Nenhum procedimento cadastrado"
          subtitulo="Cadastre o primeiro serviço para habilitar novos agendamentos."
          acao={
            <Button variant="outline" onClick={() => abrir()}>
              Cadastrar procedimento
            </Button>
          }
        />
      ) : (
        <Table
          cabecalhos={['Procedimento', 'Duração', 'Ações']}
          mobile={procedimentos.map((item) => (
            <MobileCard key={item.id} titulo={item.nome} meta={`${item.duracaoMinutos} minutos`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => abrir(item)}
                aria-label={`Editar ${item.nome}`}
              >
                Editar
              </Button>
            </MobileCard>
          ))}
        >
          {procedimentos.map((item) => (
            <tr key={item.id} className="hover:bg-brand-50/35">
              <td className="px-4 py-3.5 font-semibold text-ink-900">{item.nome}</td>
              <td className="px-4 py-3.5">
                <Badge>{item.duracaoMinutos} minutos</Badge>
              </td>
              <td className="px-4 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => abrir(item)}
                  aria-label={`Editar ${item.nome}`}
                >
                  Editar
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        titulo={editando ? 'Editar procedimento' : 'Novo procedimento'}
        descricao="Defina um nome claro e a duração padrão do serviço."
        aberto={modalAberto}
        onClose={fechar}
      >
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            salvar.mutate(
              { nome: formulario.nome, duracaoMinutos: Number(formulario.duracao) },
              {
                onSuccess: () => {
                  toast.mostrar(editando ? 'Procedimento atualizado.' : 'Procedimento cadastrado.');
                  fechar();
                },
              }
            );
          }}
        >
          <Field label="Nome do procedimento">
            <Input
              data-autofocus
              value={formulario.nome}
              onChange={(evento) =>
                setFormulario((atual) => ({ ...atual, nome: evento.target.value }))
              }
              required
            />
          </Field>
          <Field label="Duração estimada (minutos)">
            <Input
              type="number"
              min={1}
              step={1}
              value={formulario.duracao}
              onChange={(evento) =>
                setFormulario((atual) => ({ ...atual, duracao: evento.target.value }))
              }
              required
            />
          </Field>
          {salvar.isError ? (
            <ErrorState
              mensagem="Não foi possível salvar o procedimento."
              detalhe="Revise o nome e a duração."
            />
          ) : null}
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button type="button" variant="ghost" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : 'Salvar procedimento'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
