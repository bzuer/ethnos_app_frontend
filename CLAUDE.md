# CLAUDE.md - Diário Técnico do Projeto

## INSTRUÇÕES
Consultar este arquivo no início e atualizá-lo ao final de cada tarefa.

### Filosofia do Projeto
- **Simplicidade**: Mantenha o projeto limpo, direto e funcional
- **Limpeza**: Organize código, remove redundâncias, estruture logicamente
- **Funcionalidade**: Priorize performance, usabilidade e acessibilidade
- **Consistência**: Siga padrões estabelecidos no design e código

### Exigências Técnicas
- **CSS**: Antes de adicionar novas categorias, verifique existência de categorias anteriores
- **Design**: Consulte sempre docs/DESIGN_GUIDE.md para manter consistência visual
- **Templates**: Mantenha estrutura semântica e ARIA para acessibilidade
- **JavaScript**: Use arquivos .dev para desenvolvimento, .min para produção
- **Build**: Execute build profissional antes de qualquer deploy (npm run build)

### Estrutura Obrigatória
- **Documentação**: Em docs/ (não criar .md sem solicitação explícita)
- **Scripts**: Em scripts/ (build.sh, deploy, etc.)
- **Backups**: Em backup/ (manter separado do código principal)
- **Assets**: static/ com separação dev/min clara

### Workflow de Desenvolvimento
1. **Leia documentação**: Consulte docs/DESIGN_GUIDE.md e CLAUDE.md
2. **Desenvolva**: Edite arquivos .dev (CSS/JS)
3. **Build**: Execute npm run build ou scripts/build.sh
4. **Teste**: Verifique funcionamento e performance
5. **Documente**: Atualize CLAUDE.md ao final

### Regras Rígidas
- Criar arquivos .md apenas quando explicitamente solicitado
- Manter organização e limpeza absoluta no projeto
- Remover completamente funcionalidades substituídas (protocolo de substituição)
- Atualizar este arquivo no início e ao final de cada sessão
- Uso exclusivo para continuidade técnica
- Jamais quebrar a estrutura organizacional estabelecida


### Protocolo de Substituição de Funcionalidades
1. Documentar funcionalidade removida em "Funcionalidades Removidas"
2. Identificar arquivos e configurações afetados
3. Implementar nova funcionalidade
4. Remover arquivos, código e configurações obsoletos
5. Verificar ausência de referências à funcionalidade antiga
6. Atualizar documentação

## Status
- **Estado**: PRODUÇÃO
- **Última Atualização**: 2025-09-05
- **Sistema**: Frontend Flask com servidor Flask em produção

## Resumo do Sistema
Sistema frontend Flask para busca acadêmica integrado à API Ethnos, com:
- Interface de busca com autocomplete
- Navegação por obras, autores, instituições e periódicos
- Sistema PPGAS com páginas de instructors e courses simplificadas
- Build profissional com Node.js/Terser/cssnano
- Estrutura organizacional completa (docs/, scripts/, backup/)

## Arquitetura Técnica
- **Backend**: Flask 3.0.3, Jinja2, Requests, Gunicorn
- **Build Tools**: Node.js 22.18.0, npm 10.9.3, Terser, cssnano, PostCSS
- **API**: https://api.ethnos.app (produção)
- **Portas**: 8000 (dev), 8888 (prod)

## Comandos Essenciais
```bash
# Desenvolvimento
source venv/bin/activate && export FLASK_ENV=development && export API_BASE_URL=https://api.ethnos.app && export PORT=8000 && python app.py

# Produção  
source venv/bin/activate && export FLASK_ENV=production && export API_BASE_URL=https://api.ethnos.app && export PORT=8888 && python app.py

# Build
npm run build
```

## Funcionalidades Principais
- Homepage com estatísticas e obras recentes
- Sistema de busca com autocomplete
- Detalhamento de obras, autores, instituições e periódicos  
- Páginas PPGAS simplificadas (instructors e courses)
- Links inteligentes entre autores e suas obras

## Funcionalidades Removidas (Histórico)
- Script Python de minificação (substituído por ferramentas profissionais)
- Página individual de cursos do instrutor (simplificação)
- Arquivos duplicados e não utilizados

---
Consultar este arquivo no início e ao final de cada tarefa.  
*Documento técnico para continuidade do projeto.*
