import { describe, it, expect, vi } from 'vitest';
import { exportarBackupJSON, downloadCSV } from './backupHelper';

describe('Backup Helper Utils', () => {
  it('exportarBackupJSON formats data properly', () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const mockEstabelecimentos = [{ nome: 'Est 1', cnpj: '123' }];
    const mockLicencas = [{ codigo: 'LIC-01', tipoLicenca: 'alvara' }];

    expect(() => {
      exportarBackupJSON(mockEstabelecimentos, mockLicencas);
    }).not.toThrow();
  });

  it('downloadCSV formats CSV and triggers download', () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-csv-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const mockData = [
      { Nome: 'Clínica A', CNPJ: '00000000000100' },
      { Nome: 'PetShop B', CNPJ: '11111111000111' },
    ];

    expect(() => {
      downloadCSV(mockData, 'test.csv');
    }).not.toThrow();
  });
});
