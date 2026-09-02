import { AppError } from '../src/platform/erros';
import {
  calcularFim,
  intervalosSobrepostos,
  limitesDoDia,
  validarBloqueioPorFaltas,
  validarTransicaoStatus,
  validarDuracao,
  validarInicioFuturo,
} from '../src/modules/agendamentos/domain/agendamento';

describe('domínio de agendamento', () => {
  it('calcula o fim a partir da duração do procedimento', () => {
    const inicio = new Date('2026-09-01T12:00:00.000Z');
    const fim = calcularFim(inicio, 45);
    expect(fim.toISOString()).toBe('2026-09-01T12:45:00.000Z');
  });

  it('detecta sobreposição de horários', () => {
    const a = {
      inicio: new Date('2026-09-01T12:00:00.000Z'),
      fim: new Date('2026-09-01T13:00:00.000Z'),
    };
    const b = {
      inicio: new Date('2026-09-01T12:30:00.000Z'),
      fim: new Date('2026-09-01T13:30:00.000Z'),
    };
    expect(intervalosSobrepostos(a, b)).toBe(true);
  });

  it('não detecta intervalos adjacentes como conflito', () => {
    const a = {
      inicio: new Date('2026-09-01T12:00:00.000Z'),
      fim: new Date('2026-09-01T13:00:00.000Z'),
    };
    const b = {
      inicio: new Date('2026-09-01T13:00:00.000Z'),
      fim: new Date('2026-09-01T14:00:00.000Z'),
    };
    expect(intervalosSobrepostos(a, b)).toBe(false);
  });

  it('rejeita início no passado', () => {
    expect(() =>
      validarInicioFuturo(
        new Date('2020-01-01T00:00:00.000Z'),
        new Date('2026-01-01T00:00:00.000Z')
      )
    ).toThrow(AppError);
  });

  it('rejeita duração não positiva ou fracionária', () => {
    expect(() => validarDuracao(0)).toThrow(AppError);
    expect(() => validarDuracao(1.5)).toThrow(AppError);
  });

  it('calcula os limites do dia e valida transições de status', () => {
    const limites = limitesDoDia('2026-09-03');
    expect(limites.de.toISOString()).toBe('2026-09-03T03:00:00.000Z');
    expect(limites.ate.getTime() - limites.de.getTime()).toBe(24 * 60 * 60 * 1_000);
    expect(() => validarTransicaoStatus('AGENDADO', 'CONFIRMADO')).not.toThrow();
    expect(() => validarTransicaoStatus('CONFIRMADO', 'ATENDIDO')).not.toThrow();
    expect(() => validarTransicaoStatus('ATENDIDO', 'FALTOU')).toThrow(AppError);
  });

  it('rejeita uma data de agenda que não existe', () => {
    expect(() => limitesDoDia('2026-02-30')).toThrow(AppError);
  });

  it('bloqueia duas faltas sem justificativa e libera com justificativa', () => {
    expect(() => validarBloqueioPorFaltas(1)).not.toThrow();
    expect(() => validarBloqueioPorFaltas(2)).toThrow(AppError);
    expect(() => validarBloqueioPorFaltas(2, 'Paciente regularizado')).not.toThrow();
  });
});
