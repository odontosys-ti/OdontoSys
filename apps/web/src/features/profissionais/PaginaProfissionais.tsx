import type { ProfissionalResponse } from '@odontosys/contracts';
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
import { useProfissionais, useSalvarProfissional } from './api';

type Formulario = { nome: string; cro: string; especialidade: string; usuarioId: string };
const vazio: Formulario = { nome: '', cro: '', especialidade: '', usuarioId: '' };

export function PaginaProfissionais(): ReactElement {
  const consulta = useProfissionais();
  const toast = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ProfissionalResponse>();
  const [formulario, setFormulario] = useState<Formulario>(vazio);
  const salvar = useSalvarProfissional(editando?.id);

  const abrir = (item?: ProfissionalResponse) => {
    setEditando(item);
    setFormulario(
      item
        ? {
            nome: item.nome,
            cro: item.cro,
            especialidade: item.especialidade,
            usuarioId: item.usuarioId,
          }
        : vazio
    );
    setModalAberto(true);
  };
  const fechar = () => {
    setModalAberto(false);
    setEditando(undefined);
    setFormulario(vazio);
    salvar.reset();
  };

  if (consulta.isLoading) return <Spinner texto="Carregando profissionais…" />;
  if (consulta.isError) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar os profissionais."
        onRetry={() => void consulta.refetch()}
      />
    );
  }

  const profissionais = consulta.data?.dados ?? [];
  return (
    <section className="space-y-5">
      <PageHeader
        contexto="Equipe da clínica"
        titulo="Profissionais"
        subtitulo="Vínculos do corpo clínico, registro profissional e especialidade."
        acao={<Button onClick={() => abrir()}>＋ Novo profissional</Button>}
      />
      {profissionais.length === 0 ? (
        <EmptyState
          mensagem="Nenhum profissional cadastrado"
          subtitulo="Cadastre o corpo clínico antes de criar agendamentos."
          acao={
            <Button variant="outline" onClick={() => abrir()}>
              Cadastrar profissional
            </Button>
          }
        />
      ) : (
        <Table
          cabecalhos={['Profissional', 'CRO', 'Especialidade', 'Ações']}
          mobile={profissionais.map((item) => (
            <MobileCard key={item.id} titulo={item.nome} meta={`CRO ${item.cro}`}>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="info">{item.especialidade}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrir(item)}
                  aria-label={`Editar ${item.nome}`}
                >
                  Editar
                </Button>
              </div>
            </MobileCard>
          ))}
        >
          {profissionais.map((item) => (
            <tr key={item.id} className="hover:bg-brand-50/35">
              <td className="px-4 py-3.5 font-semibold text-ink-900">{item.nome}</td>
              <td className="px-4 py-3.5 font-mono text-xs text-ink-700">CRO {item.cro}</td>
              <td className="px-4 py-3.5">
                <Badge variant="info">{item.especialidade}</Badge>
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
        titulo={editando ? 'Editar profissional' : 'Novo profissional'}
        descricao="Associe o cadastro clínico ao usuário de acesso correspondente."
        aberto={modalAberto}
        onClose={fechar}
      >
        <form
          className="space-y-4"
          onSubmit={(evento) => {
            evento.preventDefault();
            salvar.mutate(formulario, {
              onSuccess: () => {
                toast.mostrar(editando ? 'Profissional atualizado.' : 'Profissional cadastrado.');
                fechar();
              },
            });
          }}
        >
          <Field label="Nome completo">
            <Input
              data-autofocus
              value={formulario.nome}
              onChange={(evento) =>
                setFormulario((atual) => ({ ...atual, nome: evento.target.value }))
              }
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Número do CRO">
              <Input
                value={formulario.cro}
                onChange={(evento) =>
                  setFormulario((atual) => ({ ...atual, cro: evento.target.value }))
                }
                required
              />
            </Field>
            <Field label="Especialidade">
              <Input
                value={formulario.especialidade}
                onChange={(evento) =>
                  setFormulario((atual) => ({ ...atual, especialidade: evento.target.value }))
                }
                required
              />
            </Field>
          </div>
          <Field label="ID do usuário vinculado" dica="UUID do usuário que acessa o sistema.">
            <Input
              value={formulario.usuarioId}
              onChange={(evento) =>
                setFormulario((atual) => ({ ...atual, usuarioId: evento.target.value }))
              }
              required
            />
          </Field>
          {salvar.isError ? (
            <ErrorState
              mensagem="Não foi possível salvar o profissional."
              detalhe="Confira o UUID e os demais campos."
            />
          ) : null}
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button type="button" variant="ghost" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : 'Salvar profissional'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
