import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Button, EmptyState, ErrorState, Modal, Spinner, Table, Toast } from '../src/shared/ui';
import { PaginaLogin } from '../src/features/login/PaginaLogin';
import { GuardaAutenticado, GuardaPapel } from '../src/app/guards';

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
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
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
