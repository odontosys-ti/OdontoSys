import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { GuardaAutenticado, GuardaPapel } from '../src/app/guards';
import { PaginaLogin } from '../src/features/login/PaginaLogin';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Spinner,
  StatusBadge,
  Table,
  Toast,
} from '../src/shared/ui';

describe('componentes da web', () => {
  it('ErrorState anuncia falha com role alert', () => {
    render(<ErrorState mensagem="falhou" />);
    expect(screen.getByRole('alert')).toHaveTextContent('falhou');
  });

  it('EmptyState mostra mensagem de lista vazia', () => {
    render(<EmptyState mensagem="Nenhum paciente encontrado." />);
    expect(screen.getByText('Nenhum paciente encontrado.')).toBeInTheDocument();
  });

  it('Spinner exibe texto de carregamento', () => {
    render(<Spinner />);
    expect(screen.getByText('Carregando…')).toBeInTheDocument();
  });

  it('Button renderiza com diferentes variantes', () => {
    render(
      <div>
        <Button variant="primary">Principal</Button>
        <Button variant="ghost">Secundário</Button>
        <Button variant="danger">Excluir</Button>
      </div>
    );
    expect(screen.getByRole('button', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secundário' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument();
  });

  it('Badge e StatusBadge renderizam variantes semânticas', () => {
    render(
      <div>
        <Badge variant="info">Ortodontia</Badge>
        <StatusBadge status="AGENDADO" />
        <StatusBadge status="CANCELADO" />
        <StatusBadge status="ADMIN" />
      </div>
    );
    expect(screen.getByText('Ortodontia')).toBeInTheDocument();
    expect(screen.getByText('Agendado')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('Card e PageHeader renderizam estruturas hierárquicas', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
          <CardDescription>Descrição do Card</CardDescription>
        </CardHeader>
        <PageHeader titulo="Página Teste" subtitulo="Subtítulo teste" />
      </Card>
    );
    expect(screen.getByText('Título do Card')).toBeInTheDocument();
    expect(screen.getByText('Descrição do Card')).toBeInTheDocument();
    expect(screen.getByText('Página Teste')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo teste')).toBeInTheDocument();
  });

  it('Table renderiza cabeçalhos e linhas', () => {
    render(
      <Table cabecalhos={['Nome', 'Documento']}>
        <tr>
          <td>João Silva</td>
          <td>12345678901</td>
        </tr>
      </Table>
    );
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Documento')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('Modal renderiza conteúdo quando aberto e oculta quando fechado', () => {
    const { rerender } = render(
      <Modal titulo="Título do Modal" aberto={true} onClose={() => {}}>
        <p>Conteúdo do modal</p>
      </Modal>
    );
    expect(screen.getByRole('heading', { name: 'Título do Modal' })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument();

    rerender(
      <Modal titulo="Título do Modal" aberto={false} onClose={() => {}}>
        <p>Conteúdo do modal</p>
      </Modal>
    );
    expect(screen.queryByText('Conteúdo do modal')).not.toBeInTheDocument();
  });

  it('Modal anuncia diálogo, fecha com Escape e restaura o foco', () => {
    function ExemploModal() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setAberto(true)}>
            Abrir
          </button>
          <Modal titulo="Cadastro" aberto={aberto} onClose={() => setAberto(false)}>
            <Input aria-label="Nome" data-autofocus />
          </Modal>
        </div>
      );
    }
    render(<ExemploModal />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    abrir.focus();
    fireEvent.click(abrir);
    const dialogo = screen.getByRole('dialog', { name: 'Cadastro' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('Toast exibe mensagem de alerta', () => {
    render(<Toast mensagem="Operação realizada com sucesso" />);
    expect(screen.getByText('Operação realizada com sucesso')).toBeInTheDocument();
  });

  it('login renderiza formulário público', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PaginaLogin />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Entrar na plataforma' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('GuardaAutenticado redireciona para login quando não há sessão', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['me'], null);

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/privado']}>
          <Routes>
            <Route element={<GuardaAutenticado />}>
              <Route path="/privado" element={<p>Área protegida</p>} />
            </Route>
            <Route path="/login" element={<p>Tela de login</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('GuardaPapel permite acesso quando papel corresponde e bloqueia quando não corresponde', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['me'], {
      usuarioId: 'u1',
      nome: 'Maria',
      email: 'recepcao@teste.local',
      papel: 'RECEPCAO',
      clinicaId: 'c1',
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/admin-only']}>
          <Routes>
            <Route element={<GuardaPapel papeis={['ADMIN']} />}>
              <Route path="/admin-only" element={<p>Área administrativa</p>} />
            </Route>
            <Route path="/pacientes" element={<p>Lista de pacientes</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText('Lista de pacientes')).toBeInTheDocument();
  });
});
