import { AppError } from '../src/platform/erros';
import {
  calcularFim,
  intervalosSobrepostos,
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
});
