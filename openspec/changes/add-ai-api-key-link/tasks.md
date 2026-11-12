## 1. Implementação do link

- [x] 1.1 Criar constante `AI_API_KEY_LINKS` com as URLs oficiais de OpenAI e Gemini
- [x] 1.2 Adicionar link "Obter chave de API" (nova aba, `rel="noopener noreferrer"`, ícone `ExternalLink`) no `AIConfigForm` em `src/components/Management.tsx`
- [x] 1.3 Garantir que o link atualiza ao trocar o provedor, sem exigir salvar

## 2. Versão e documentação

- [x] 2.1 Atualizar versão para 4.8.4 em `src/constants/app.ts`, `package.json` e `package-lock.json`
- [x] 2.2 Adicionar notas da versão em `src/constants/releases.ts`
- [x] 2.3 Atualizar `README.md` e `CHANGELOG.md`

## 3. Validação

- [x] 3.1 Executar `npm run check:text-ptbr-ui` e `npm run check:text-encoding`
- [x] 3.2 Executar lint e build (`npm run build`)
- [ ] 3.3 Validar manualmente: trocar provedor e conferir destino do link e abertura em nova aba
- [x] 3.4 Gerar resumo das alterações para a descrição do commit (pt-br)
