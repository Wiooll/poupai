import { describe, expect, it } from 'vitest';
import { suggestExpenseFromReceiptPhoto, validateReceiptPhotoFile } from './receiptPhoto';

const createFile = (name: string, type: string, bytes: number) =>
  new File([new Uint8Array(bytes)], name, { type });

describe('receiptPhoto', () => {
  it('valida formato e tamanho de imagem', () => {
    const ok = createFile('nota.png', 'image/png', 1024);
    const badType = createFile('nota.pdf', 'application/pdf', 1024);
    const tooBig = createFile('nota.jpg', 'image/jpeg', 6 * 1024 * 1024);

    expect(validateReceiptPhotoFile(ok)).toBe('');
    expect(validateReceiptPhotoFile(badType)).toContain('Formato inválido');
    expect(validateReceiptPhotoFile(tooBig)).toContain('5MB');
  });

  it('sugere campos de gasto a partir do nome do arquivo', async () => {
    const file = createFile('mercado_20260415_123,45.jpg', 'image/jpeg', 2048);
    const suggestion = await suggestExpenseFromReceiptPhoto(file);

    expect(suggestion.data).toBe('2026-04-15');
    expect(suggestion.valor).toBe(123.45);
    expect(suggestion.descricao.toLowerCase()).toContain('nota fiscal');
    expect(suggestion.estabelecimento.toLowerCase()).toContain('mercado');
  });
});

