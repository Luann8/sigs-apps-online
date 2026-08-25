import { describe, it, expect } from 'vitest';
import {
  formatCNPJ,
  unmaskCNPJ,
  validarCNPJ,
  maskTelefone,
  unmaskTelefone,
  formatDate,
  getDaysUntilExpiry,
  isExpiringSoon,
  getStatusConfig,
  getTipoConfig,
  getTipoLicencaConfig,
  generateCodigo,
} from './formatters';

describe('Formatters Utils', () => {
  it('formatCNPJ should format valid 14-digit CNPJ correctly', () => {
    expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95');
    expect(formatCNPJ('12.345.678/0001-95')).toBe('12.345.678/0001-95');
    expect(formatCNPJ('')).toBe('');
  });

  it('unmaskCNPJ and validarCNPJ should work properly', () => {
    expect(unmaskCNPJ('12.345.678/0001-95')).toBe('12345678000195');
    expect(validarCNPJ('11.111.111/1111-11')).toBe(false);
    expect(validarCNPJ('')).toBe(false);
  });

  it('maskTelefone and unmaskTelefone should format phones correctly', () => {
    expect(maskTelefone('11987654321')).toBe('(11) 98765-4321');
    expect(maskTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(unmaskTelefone('(11) 98765-4321')).toBe('11987654321');
    expect(maskTelefone('')).toBe('');
  });

  it('formatDate should format ISO date strings to pt-BR format', () => {
    expect(formatDate('2026-08-23')).toBe('23/08/2026');
    expect(formatDate('')).toBe('');
  });

  it('getDaysUntilExpiry and isExpiringSoon should calculate properly', () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const days = getDaysUntilExpiry(futureDate);
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
    expect(isExpiringSoon(futureDate)).toBe(true);
  });

  it('getTipoLicencaConfig should return proper label and icon', () => {
    const config = getTipoLicencaConfig('alvara_sanitario');
    expect(config.label).toBe('Licença ou Alvará Sanitário');
    expect(config.icon).toBeDefined();

    const fallback = getTipoLicencaConfig('tipo_desconhecido');
    expect(fallback.label).toBe('tipo_desconhecido');
  });

  it('getStatusConfig and getTipoConfig should return color configurations', () => {
    expect(getStatusConfig('ativa').label).toBe('Ativa');
    expect(getTipoConfig('sanitaria').label).toBe('Sanitária');
  });

  it('generateCodigo should pad numbers to 3 digits with L prefix', () => {
    expect(generateCodigo(1)).toBe('L001');
    expect(generateCodigo(25)).toBe('L025');
  });
});
