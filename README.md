# COREdesk — Central Inteligente de Chamados de TI

Protótipo acadêmico front-end para registro e gerenciamento de chamados de suporte técnico, desenvolvido com HTML, CSS e JavaScript puro.

## Objetivo

Demonstrar conceitos de desenvolvimento de interfaces, responsividade, navegação, formulários, indicadores, persistência no navegador e boas práticas de acessibilidade.

## Tecnologias

- HTML5 semântico
- CSS3 (variáveis, Flexbox, Grid e media queries)
- JavaScript (DOM, eventos, arrays, objetos e `localStorage`)
- Google Fonts opcionais (com fallback local)

Não utiliza backend, banco de dados ou IA. O acesso é demonstrativo e não oferece autenticação ou segregação segura de dados.

## Arquivos

```text
COREdesk/
├── index.html
├── style.css
├── script.js
├── assets/
│   └── fluxo-suporte.svg
└── README.md
```

## Funcionalidades

- Página institucional com carrossel, cards, imagem SVG de fluxo, ilustrações em CSS, formulário de contato e rodapé.
- Login demonstrativo com perfis Colaborador e Técnico.
- Dashboard com indicadores de chamados e gráficos calculados a partir dos dados.
- Cadastro de chamados com validação de formulário e identificador único.
- Pesquisa e filtros por status, prioridade e categoria.
- Detalhes em modal; Técnico pode alterar status ou excluir chamados.
- Relatórios por categoria, prioridade, status e taxa de resolução.
- Preferências de modo claro/escuro e ajuste de tamanho da fonte salvas no navegador.
- Dados demonstrativos iniciais e persistência usando `localStorage`.

## Como executar

Abra o arquivo `index.html` em um navegador moderno, ou use uma extensão de servidor local como Live Server no VS Code. É um site estático.

### Acesso demonstrativo

**Colaborador:** `colaborador@demo.com` / `demo123`

**Técnico:** `tecnico@demo.com` / `demo123`

Os dados e credenciais são fictícios. Não digite credenciais reais. O controle de perfil é apenas uma simulação na interface, não uma proteção de informações.

## Armazenamento

Na primeira utilização, o navegador cria 12 chamados fictícios em `localStorage`. Novos chamados, alterações e exclusões permanecem no mesmo navegador. Chamados não são sincronizados entre dispositivos. A sessão demonstrativa é armazenada em `sessionStorage` e desaparece ao encerrar a sessão do navegador.

Para testar os dados de fábrica novamente, remova a chave `coredesk_tickets_v1` no armazenamento local do navegador e recarregue a página.

## Cores e decisões de design

| Papel | Cor |
|---|---|
| Fundo principal | `#F8F6F3` |
| Superfície | `#FFFFFF` |
| Vinho (identidade e ação) | `#68263C` |
| Dourado (detalhes) | `#B18C57` |
| Grafite (texto) | `#27252B` |

O vinho comunica uma identidade visual sofisticada, enquanto os fundos claros facilitam a leitura e a organização da informação. O dourado é usado de forma comedida para não comprometer a legibilidade. Essas associações são escolhas de comunicação visual, não significados universais.

## Acessibilidade

Inclui HTML semântico, labels de formulários, foco visível, textos nos status além de cores, navegação por teclado, controle de tamanho da fonte, tema claro/escuro, respeito a `prefers-reduced-motion` e modal com tecla Escape e ciclo básico de foco. São práticas alinhadas à WCAG 2.2, mas **não constituem certificação de conformidade AA**. Recomenda-se verificar contraste, navegação por teclado e leitores de tela com ferramentas e testes manuais.

## Limitações

- Não há autenticação real, controle de acesso seguro ou servidor.
- Formulário de contato apenas valida os dados; não envia mensagens.
- Ações de Técnico e Colaborador são simulações baseadas em dados locais.
- Sem anexos, notificações remotas ou integração externa.
- IA não foi implementada e pode ser adicionada futuramente de forma independente.

## GitHub Pages

1. Crie um repositório com os arquivos na raiz.
2. Abra **Settings > Pages** no GitHub.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch `main` e a pasta `/ (root)`.
5. Salve e acesse a URL publicada quando estiver disponível.

## Referências para pesquisa e verificação

- W3C — WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MDN — HTML: https://developer.mozilla.org/pt-BR/docs/Web/HTML
- MDN — CSS: https://developer.mozilla.org/pt-BR/docs/Web/CSS
- MDN — JavaScript: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript
- MDN — Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- Referência visual informada no enunciado do projeto: *Support Ticket System Software UI UX*, Muhammad Salim / Sadax Studio (Dribbble). Inspiração visual, sem cópia integral.

O relatório pessoal exigido pela disciplina, incluindo a redação que o professor determina que seja feita sem IA, deve ser produzido pelo estudante.

## Testes realizados no protótipo

A navegação principal e os fluxos demonstrativos foram exercitados em Chromium com teste automatizado da interface: login de Colaborador e Técnico, abertura de chamado, busca, detalhes, atualização do status, relatórios e modo escuro. O console não apresentou exceções JavaScript durante esses testes. Isso não equivale a auditoria completa de acessibilidade, segurança ou publicação no GitHub Pages.

O arquivo `Relatorio_COREdesk_BASE.docx`, incluído no ZIP acadêmico, contém um documento-base acadêmico com capturas de tela. A Parte C é reservada para a redação individual exigida pelo professor, sem uso de IA.
