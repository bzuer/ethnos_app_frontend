### **Guia de Design e Construção da ethnos_app**

**Versão 1.1**  
**Objetivo:** Este documento é a referência única e definitiva para a construção do front-end do projeto ethnos_app. Ele detalha a filosofia, a estrutura de ficheiros, o sistema de design e as preferências visuais, utilizando os protótipos funcionais como exemplos concretos.

#### **1\. Filosofia e Princípios Fundamentais**

Antes de escrever qualquer linha de código, é crucial compreender a visão do projeto.

* **Conceito Central: "Brutalismo Elegante"**  
  * **O que é:** Um design funcionalista por princípio. A nossa inspiração não vem de outros websites, mas de artefactos onde a forma segue rigorosamente a função: formulários técnicos, manuais de engenharia e o Estilo Tipográfico Internacional (Suíço).  
  * **Posicionamento:** "Formulário de biblioteca dos anos 70, digitalizado com elegância."  
* **Princípios Inegociáveis:**  
  1. **Funcionalidade Acima de Tudo:** Cada elemento deve ter um propósito claro. Não há espaço para decoração.  
  2. **Honestidade Estrutural:** A estrutura da página (bordas, tabelas, secções) é exposta para revelar como a informação está organizada.  
  3. **Tipografia como Interface:** A hierarquia e a clareza são alcançadas primariamente através da tipografia e do espaçamento.  
  4. **Sem Ornamentos:** Zero cantos arredondados, zero sombras, zero gradientes. O feedback visual é subtil e funcional.

#### **2\. Estrutura do Projeto**

A organização dos ficheiros foi desenhada para ser modular, lógica e escalável. Os exemplos HTML funcionais estão localizados na pasta examples/ para servirem como guias visuais.  
site_v2/  
├── app.py                     \# Aplicação Flask principal  
├── config.py                  \# Configurações da aplicação  
├── requirements.txt           \# Dependências Python  
├── venv/                      \# Ambiente virtual Python  
├── templates/                 \# Templates Jinja2  
│   ├── base.html              \# Template base com \<head\>, \<body\>, header e footer globais  
│   ├── pages/                 \# Templates para cada página completa do site  
│   │   ├── index.html         \# O "Painel Informativo"  
│   │   ├── advanced-search.html\# O formulário de busca avançada  
│   │   ├── results.html       \# A página de resultados de busca  
│   │   ├── item-detail.html   \# A "ficha catalográfica" de uma obra  
│   │   ├── my-list.html       \# A página de lista pessoal do utilizador  
│   │   ├── author-detail.html \# Detalhes do autor  
│   │   ├── organization-detail.html \# Detalhes da organização  
│   │   ├── journal-detail.html\# Detalhes do periódico  
│   │   ├── journals.html      \# Lista de periódicos  
│   │   └── ppgas*.html        \# Páginas específicas do PPGAS  
│   ├── components/            \# Componentes reutilizáveis (parciais)  
│   │   ├── global-header.html \# O cabeçalho principal com título e navegação  
│   │   └── footer.html        \# O rodapé padrão  
│   └── errors/                \# Páginas de erro  
│       ├── 404.html           \# Página não encontrada  
│       └── 500.html           \# Erro interno do servidor  
│  
├── static/                    \# Ficheiros estáticos servidos pelo Flask  
│   ├── css/  
│   │   └── styles.min.css     \# CSS minificado para produção  
│   └── js/                    \# JavaScript minificado para produção  
│       ├── app.min.js         \# Script principal  
│       ├── homepage.min.js    \# Lógica da página inicial  
│       ├── search.min.js      \# Funcionalidade de busca  
│       ├── my-list.min.js     \# Lógica para lista pessoal  
│       └── [outros].min.js    \# Scripts específicos por página  
│  
├── src/                       \# Código fonte para desenvolvimento  
│   ├── css/  
│   │   └── styles.css         \# CSS fonte para desenvolvimento  
│   └── js/                    \# JavaScript fonte para desenvolvimento  
│       ├── app.js             \# Script principal  
│       ├── api-client.js      \# Cliente da API Ethnos  
│       └── [outros].js        \# Scripts específicos por página  
│  
└── examples/                  \# Protótipos HTML funcionais para referência  
    ├── index.html             \# Exemplo da página inicial  
    ├── busca-avancada.html    \# Exemplo da busca avançada  
    ├── resultados.html        \# Exemplo dos resultados  
    ├── item-detail.html       \# Exemplo da ficha catalográfica  
    ├── minha-lista.html       \# Exemplo da lista pessoal  
    ├── visualizador-redes.html\# Exemplo do visualizador de redes  
    └── modelo.css             \# CSS modelo de referência

#### **3\. O Sistema de Design (Detalhado)**

O ficheiro src/css/styles.css é a única fonte de verdade para o design em desenvolvimento, sendo minificado para static/css/styles.min.css em produção. Ele implementa as seguintes regras, que devem ser observadas e replicadas.  
**3.1. Layout e Grid**

* **Estrutura:** Todas as páginas utilizam um **layout de coluna única e centralizada**, com exceção do visualizador-redes.html. A informação é apresentada sequencialmente, de cima para baixo.  
* **Alinhamento:** O \<div class="container"\> está sempre centrado na janela de visualização.  
* **Fundo:** O fundo de "papel milimetrado" é aplicado a todo o \<body\>.  
* **Largura do Contentor:** max-width: 800px para páginas de texto e 960px para visualizações.

3.2. Sistema de Cores  
A paleta é restrita e funcional. As cores primárias (--primary-red, \--primary-blue) são usadas exclusivamente para elementos de ação e interatividade.  
**3.3. Tipografia**

* **Fontes:**  
  * **Sans-serif (--sans):** Para títulos e descrições.  
  * **Monoespaçada (--mono):** Para **todo o resto**: navegação, dados, labels, metadados, legendas.  
* **Hierarquia:** O tamanho da fonte é a principal ferramenta de hierarquia, variando de 48px (.title-primary) a 12px (dados e metadados).

**3.4. Componentes Visuais e Interatividade**

* **Tabelas (.data-table):** Sempre com bordas completas, cabeçalho (\<th\>) diferenciado e hover nas linhas.  
* **Formulários:** Inputs com fundo \--document-white e :focus com borda \--primary-red.  
* **Botões:** Sem cantos arredondados. Feedback de clique (:active) com transform: translateY(1px).  
* **Links de Ação (.action-link):** Sempre na cor \--primary-blue e com hover sublinhado.

#### **4\. Guia de Implementação por Página**

Cada ficheiro em examples/ serve como um protótipo funcional e um guia visual para a construção dos ficheiros correspondentes em templates/pages/.

* **examples/index.html (Painel Informativo):**  
  * **Observe:** A disposição sequencial das secções (.figure-plate seguida pelas .data-table).  
  * **Replique:** A estrutura de secções com \<h2 class="title-section"\> para todos os blocos de conteúdo futuros no templates/pages/index.html.  
* **examples/busca-avancada.html:**  
  * **Observe:** O uso de um grid para alinhar labels e inputs. O fieldset para agrupar campos relacionados.  
  * **Replique:** Esta estrutura de formulário no templates/pages/advanced-search.html para qualquer página futura que exija a entrada de dados complexos.  
* **examples/resultados.html:**  
  * **Observe:** A estrutura da lista (\<ol class="results-list"\>) e a hierarquia dentro de cada item (.result-title \> .result-subtitle \> .result-meta).  
  * **Replique:** Esta estrutura de lista no templates/pages/results.html e para qualquer página que apresente uma coleção de itens (ex: página de autor, periódicos).  
* **examples/item-detail.html:**  
  * **Observe:** O uso de múltiplas tabelas para separar diferentes tipos de dados. A secção "Ferramentas" com fieldset para agrupar ações.  
  * **Replique:** O uso de tabelas para apresentar pares de chave-valor (label/dado) é o padrão para exibir metadados no templates/pages/item-detail.html, author-detail.html, organization-detail.html e journal-detail.html.  
* **examples/minha-lista.html:**  
  * **Observe:** A combinação de uma tabela de gestão com um painel de ferramentas (.export-tools). A diferenciação de botões (.btn-primary, .btn-secondary, .btn-danger).  
  * **Replique:** Este padrão de "lista \+ ferramentas" no templates/pages/my-list.html e para funcionalidades futuras que envolvam coleções criadas pelo utilizador.  
* **examples/visualizador-redes.html:**  
  * **Observe:** O uso de um contentor mais largo e um layout de duas colunas para acomodar a visualização e um painel informativo.  
  * **Replique:** Este layout de visualização \+ painel para qualquer página futura que apresente dados interativos complexos.
