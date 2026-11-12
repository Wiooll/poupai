import { describe, expect, it } from 'vitest';
import { buildCopyrightText, THEME_OPTIONS } from './uiPreferences';

describe('uiPreferences', () => {
  it('mantem tres temas disponiveis com opcao cinza', () => {
    expect(THEME_OPTIONS.map((option) => option.value)).toEqual(['white', 'black', 'gray']);
  });

  it('gera texto padrao de direitos autorais em pt-BR', () => {
    expect(buildCopyrightText('PoupAi', 2026)).toBe(
      '© 2026 PoupAi. Todos os direitos reservados.',
    );
  });
});

