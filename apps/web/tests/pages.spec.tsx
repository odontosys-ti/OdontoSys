import type { MeResponse } from '@odontosys/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Layout } from '../src/app/layout';
import { PaginaAgendamentos } from '../src/features/agendamentos/PaginaAgendamentos';
import { PaginaLogin } from '../src/features/login/PaginaLogin';
import {
  PaginaPacienteFormulario,
  PaginaPacientes,
} from '../src/features/pacientes/PaginasPacientes';
import { PaginaProcedimentos } from '../src/features/procedimentos/PaginaProcedimentos';
import { PaginaProfissionais } from '../src/features/profissionais/PaginaProfissionais';
import { ToastProvider } from '../src/shared/ui';

const id = {
  paciente: '01900000-0000-7000-8000-000000000001',
  profissional: '01900000-0000-7000-8000-000000000002',
  procedimento: '01900000-0000-7000-8000-000000000003',
  agendamento: '01900000-0000-7000-8000-000000000004',
};
const paginacao = { pagina: 1, tamanho: 50, total: 1 };
const dataBase = {
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-01T10:00:00.000Z',
};
const paciente = {
  id: id.paciente,
  nome: 'Ana Lima',
  documento: '12345678901',
  nascimento: '1990-01-01T00:00:00.000Z',
  observacoes: '',
  ...dataBase,
};
const procedimento = {
  id: id.procedimento,
  nome: 'Profilaxia',
  duracaoMinutos: 30,
  ...dataBase,
};
const profissional = {
  id: id.profissional,
  usuarioId: '01900000-0000-7000-8000-000000000012',
  nome: 'Dra. Bia',
  cro: '1234',
  especialidade: 'Clínico geral',
  ...dataBase,
};
const agendamento = {
  id: id.agendamento,
  pacienteId: id.paciente,
  profissionalId: id.profissional,
  procedimentoId: id.procedimento,
  inicio: '2026-09-03T13:00:00.000Z',
  fim: '2026-09-03T13:30:00.000Z',
  status: 'AGENDADO',
  criadoEm: dataBase.criadoEm,
  atualizadoEm: dataBase.atualizadoEm,
};

function sessao(papel: MeResponse['papel']): MeResponse {
  return {
    usuarioId: '01900000-0000-7000-8000-000000000010',
    clinicaId: '01900000-0000-7000-8000-000000000011',
    nome: 'Pessoa Teste',
    email: 'pessoa@teste.local',
    papel,
  };
}

function renderizar(elemento: ReactElement, papel: MeResponse['papel']) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(['me'], sessao(papel));
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>{elemento}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

function resposta(dados: unknown): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(dados), { status: 200 }));
}

function fetchRecursos(entrada: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = String(entrada);
  if (['POST', 'PATCH', 'DELETE'].includes(init?.method ?? '')) {
    if (url.includes('profissionais')) return resposta(profissional);
    if (url.includes('procedimentos')) return resposta(procedimento);
    return resposta(agendamento);
  }
  if (url.includes('/agendamentos?')) return resposta({ dados: [agendamento], paginacao });
  if (url.includes('/pacientes?')) return resposta({ dados: [paciente], paginacao });
  if (url.includes('/profissionais?')) return resposta({ dados: [profissional], paginacao });
  return resposta({ dados: [procedimento], paginacao });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('páginas da base', () => {
  it('dentista consulta pacientes sem receber controles de escrita', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => resposta({ dados: [paciente], paginacao }))
    );
    renderizar(<PaginaPacientes />, 'DENTISTA');
    expect((await screen.findAllByText('Ana Lima')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /novo paciente/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /editar/i })).not.toBeInTheDocument();
  });

  it('admin consegue iniciar a edição de procedimento existente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => resposta({ dados: [procedimento], paginacao }))
    );
    renderizar(<PaginaProcedimentos />, 'ADMIN');
    const botoesEditar = await screen.findAllByRole('button', { name: /editar profilaxia/i });
    fireEvent.click(botoesEditar[0]);
    expect(screen.getByRole('dialog', { name: 'Editar procedimento' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Profilaxia')).toBeInTheDocument();
  });

  it('recepção pode reagendar e cancelar; dentista apenas consulta', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchRecursos));
    const recepcao = renderizar(<PaginaAgendamentos />, 'RECEPCAO');
    expect((await screen.findAllByRole('button', { name: /reagendar/i })).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByRole('button', { name: /cancelar agendamento/i }).length).toBeGreaterThan(
      0
    );
    recepcao.unmount();

    renderizar(<PaginaAgendamentos />, 'DENTISTA');
    expect((await screen.findAllByText('Ana Lima')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /reagendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar agendamento/i })).not.toBeInTheDocument();
  });

  it('salva um novo paciente com campos controlados', async () => {
    const requisicao = vi.fn((_entrada: string | URL | Request, init?: RequestInit) =>
      init?.method === 'POST' ? resposta(paciente) : resposta({ dados: [paciente], paginacao })
    );
    vi.stubGlobal('fetch', requisicao);
    renderizar(<PaginaPacienteFormulario />, 'RECEPCAO');

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Ana Lima' } });
    fireEvent.change(screen.getByLabelText('Documento'), { target: { value: '12345678901' } });
    fireEvent.change(screen.getByLabelText('Data de nascimento'), {
      target: { value: '1990-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Observações gerais'), { target: { value: 'Retorno' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar paciente' }));

    expect(await screen.findByText('Paciente cadastrado.')).toBeInTheDocument();
    expect(requisicao).toHaveBeenCalledWith(
      expect.stringContaining('/pacientes'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('edita profissional e procedimento usando os contratos da base', async () => {
    const requisicao = vi.fn(fetchRecursos);
    vi.stubGlobal('fetch', requisicao);

    const telaProfissional = renderizar(<PaginaProfissionais />, 'ADMIN');
    fireEvent.click((await screen.findAllByRole('button', { name: /editar dra. bia/i }))[0]);
    fireEvent.change(screen.getByLabelText('Especialidade'), { target: { value: 'Ortodontia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar profissional' }));
    expect(await screen.findByText('Profissional atualizado.')).toBeInTheDocument();
    telaProfissional.unmount();

    renderizar(<PaginaProcedimentos />, 'ADMIN');
    fireEvent.click((await screen.findAllByRole('button', { name: /editar profilaxia/i }))[0]);
    fireEvent.change(screen.getByLabelText('Duração estimada (minutos)'), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar procedimento' }));
    expect(await screen.findByText('Procedimento atualizado.')).toBeInTheDocument();
  });

  it('cadastra profissional e procedimento pelos formulários administrativos', async () => {
    const requisicao = vi.fn(fetchRecursos);
    vi.stubGlobal('fetch', requisicao);

    const telaProfissional = renderizar(<PaginaProfissionais />, 'ADMIN');
    fireEvent.click(await screen.findByRole('button', { name: /novo profissional/i }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Dra. Bia' } });
    fireEvent.change(screen.getByLabelText('Número do CRO'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('Especialidade'), {
      target: { value: 'Clínico geral' },
    });
    fireEvent.change(screen.getByLabelText('ID do usuário vinculado'), {
      target: { value: profissional.usuarioId },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar profissional' }));
    expect(await screen.findByText('Profissional cadastrado.')).toBeInTheDocument();
    telaProfissional.unmount();

    renderizar(<PaginaProcedimentos />, 'ADMIN');
    fireEvent.click(await screen.findByRole('button', { name: /novo procedimento/i }));
    fireEvent.change(screen.getByLabelText('Nome do procedimento'), {
      target: { value: 'Profilaxia' },
    });
    fireEvent.change(screen.getByLabelText('Duração estimada (minutos)'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar procedimento' }));
    expect(await screen.findByText('Procedimento cadastrado.')).toBeInTheDocument();

    expect(requisicao).toHaveBeenCalledWith(
      expect.stringContaining('/procedimentos'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('mostra estados vazios úteis nas listas da base', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => resposta({ dados: [], paginacao: { ...paginacao, total: 0 } }))
    );

    const pacientes = renderizar(<PaginaPacientes />, 'RECEPCAO');
    expect(await screen.findByText('Nenhum paciente encontrado')).toBeInTheDocument();
    pacientes.unmount();

    const profissionais = renderizar(<PaginaProfissionais />, 'ADMIN');
    expect(await screen.findByText('Nenhum profissional cadastrado')).toBeInTheDocument();
    profissionais.unmount();

    const procedimentos = renderizar(<PaginaProcedimentos />, 'ADMIN');
    expect(await screen.findByText('Nenhum procedimento cadastrado')).toBeInTheDocument();
    procedimentos.unmount();

    renderizar(<PaginaAgendamentos />, 'RECEPCAO');
    expect(await screen.findByText('Nenhum agendamento neste período')).toBeInTheDocument();
  });

  it('executa reagendamento e cancelamento por confirmação', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchRecursos));
    renderizar(<PaginaAgendamentos />, 'RECEPCAO');

    fireEvent.click((await screen.findAllByRole('button', { name: 'Reagendar' }))[0]);
    fireEvent.change(screen.getByLabelText('Novo início'), {
      target: { value: '2026-09-04T11:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo horário' }));
    expect(await screen.findByText('Agendamento reagendado.')).toBeInTheDocument();

    fireEvent.click((await screen.findAllByRole('button', { name: /cancelar agendamento/i }))[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));
    expect(await screen.findByText('Agendamento cancelado.')).toBeInTheDocument();
  });

  it('renderiza navegação administrativa e envia login', async () => {
    const requisicao = vi.fn((entrada: string | URL | Request) => {
      const url = String(entrada);
      if (url.includes('/auth/login')) return resposta(sessao('ADMIN'));
      if (url.includes('/auth/me')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Sessão ausente', detalhes: [] },
              requestId: 'req-1',
            }),
            { status: 401 }
          )
        );
      }
      return resposta({ ok: true });
    });
    vi.stubGlobal('fetch', requisicao);

    const layout = renderizar(<Layout />, 'ADMIN');
    expect(screen.getAllByText('Profissionais').length).toBeGreaterThan(0);
    const menu = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    layout.unmount();

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PaginaLogin />
        </MemoryRouter>
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText('E-mail profissional'), {
      target: { value: 'admin@teste.local' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() =>
      expect(requisicao).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({ method: 'POST' })
      )
    );
  });
});
