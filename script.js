'use strict';
// Portal Novara: protótipo front-end. Todos os dados são locais e demonstrativos.
// Atalhos do DOM: $ procura um elemento; $ (abaixo) devolve uma lista de elementos.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// Chaves de armazenamento identificam dados no navegador. localStorage mantém chamados/tema/fonte;
// sessionStorage guarda o perfil apenas durante a sessão da aba. As listas padronizam status, prioridade e categoria.
const STORAGE_KEY = 'coredesk_tickets_v1';
const THEME_KEY = 'coredesk_theme_v1';
const FONT_KEY = 'coredesk_font_v1';
const COMPANY_DOMAIN = 'novarati.com';
const PROFILE_KEY = 'coredesk_demo_profile_v1';
const statusList = ['Aberto', 'Em andamento', 'Aguardando retorno', 'Resolvido', 'Fechado'];
const priorityList = ['Baixa', 'Média', 'Alta', 'Crítica'];
const categoryList = ['Hardware', 'Software', 'Rede', 'E-mail', 'Acesso', 'Impressora', 'Outros'];
const profiles = {
  colaborador: {
    name: 'Marina Costa',
    email: 'colaborador@' + COMPANY_DOMAIN,
    role: 'Colaborador',
    password: 'demo123',
  },
  tecnico: {
    name: 'Lucas Ferreira',
    email: 'tecnico@' + COMPANY_DOMAIN,
    role: 'Técnico de TI',
    password: 'demo123',
  },
};

// Doze exemplos permitem demonstrar dashboard e filtros antes do primeiro cadastro.
// Não são novos dados a cada atualização: loadTickets reutiliza o que já existe no navegador.
const samples = [
  [
    'Notebook não liga',
    'Hardware',
    'Marina Costa',
    'colaborador@novarati.com',
    'Alta',
    'Aberto',
    1,
  ],
  [
    'Atualização do ERP',
    'Software',
    'Carlos Lima',
    'carlos@novarati.com',
    'Média',
    'Em andamento',
    2,
  ],
  [
    'Wi-Fi instável no escritório',
    'Rede',
    'Ana Souza',
    'ana@novarati.com',
    'Crítica',
    'Aguardando retorno',
    3,
  ],
  [
    'Erro no envio de mensagens',
    'E-mail',
    'Marina Costa',
    'colaborador@novarati.com',
    'Alta',
    'Resolvido',
    4,
  ],
  ['Desbloqueio de conta', 'Acesso', 'Bruno Melo', 'bruno@novarati.com', 'Média', 'Fechado', 5],
  [
    'Impressora sem conexão',
    'Impressora',
    'Juliana Alves',
    'juliana@novarati.com',
    'Baixa',
    'Aberto',
    6,
  ],
  [
    'Computador lento',
    'Hardware',
    'Marina Costa',
    'colaborador@novarati.com',
    'Média',
    'Em andamento',
    7,
  ],
  [
    'Instalação de antivírus',
    'Software',
    'Paulo Reis',
    'paulo@novarati.com',
    'Baixa',
    'Resolvido',
    8,
  ],
  ['VPN não conecta', 'Rede', 'Fernanda Dias', 'fernanda@novarati.com', 'Alta', 'Em andamento', 9],
  [
    'Redefinição de senha',
    'Acesso',
    'Marina Costa',
    'colaborador@novarati.com',
    'Baixa',
    'Fechado',
    10,
  ],
  [
    'Caixa postal cheia',
    'E-mail',
    'Rafael Gomes',
    'rafael@novarati.com',
    'Média',
    'Aguardando retorno',
    11,
  ],
  [
    'Instalação de certificado',
    'Outros',
    'Beatriz Rocha',
    'beatriz@novarati.com',
    'Média',
    'Resolvido',
    12,
  ],
];
// Transforma cada linha resumida de samples em um objeto de chamado com ID, datas e responsável.
function createSamples() {
  return samples.map(([title, category, requester, email, priority, status, day], index) => {
    const opened = new Date();
    opened.setDate(opened.getDate() - day);
    return {
      id: `CD-${String(index + 1).padStart(4, '0')}`,
      title,
      category,
      requester,
      email,
      priority,
      status,
      department: 'Administrativo',
      description: `Solicitação demonstrativa de suporte: ${title.toLowerCase()}. Favor analisar e orientar o solicitante.`,
      createdAt: opened.toISOString(),
      resolvedAt: ['Resolvido', 'Fechado'].includes(status)
        ? new Date(opened.getTime() + 86400000).toISOString()
        : null,
      owner: ['Resolvido', 'Fechado', 'Em andamento'].includes(status) ? 'Lucas Ferreira' : null,
    };
  });
}

// Atualiza endereços de demonstração salvos antes da adoção do domínio corporativo.
function migrateDemoEmail(email) {
  return email?.replace(/@demo\.com$/i, '@' + COMPANY_DOMAIN);
}

// Lê o JSON salvo e converte em array (JSON.parse). Só usa os exemplos se não houver dados válidos;
// assim novos registros e alterações permanecem após recarregar a página.
function loadTickets() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing !== null) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        return parsed.map((ticket) => ({
          ...ticket,
          email: migrateDemoEmail(ticket.email),
          createdBy: migrateDemoEmail(ticket.createdBy),
        }));
      }
    }
  } catch (error) {
    console.warn('Não foi possível ler dados locais.', error);
  }
  const initial = createSamples();
  saveTickets(initial);
  return initial;
}

// Estado em memória: tickets é o array atual; activeProfile define a visualização e currentView a tela ativa.
// let é usado porque esses valores são atualizados durante a navegação.
let tickets = loadTickets();
let activeProfile = null;
let loginChoice = 'colaborador';
let currentView = 'dashboard';
let focusedBeforeModal = null;
let activeTicketId = null;
let toastTimer;
const counts = (list, key, labels) =>
  labels.map((label) => ({ label, value: list.filter((t) => t[key] === label).length }));

// JSON.stringify converte o array em texto para o localStorage. O try/catch trata falhas de gravação;
// retornar true/false permite desfazer a alteração se o salvamento falhar.
function saveTickets(list = tickets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error(error);
    notify('Não foi possível salvar no navegador. Verifique o armazenamento disponível.');
    return false;
  }
}

// Atualiza a região de status anunciada por leitores de tela.
function notify(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3800);
}
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
}
function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
function textElement(tag, value, className = '') {
  const node = document.createElement(tag);
  node.textContent = String(value);
  if (className) node.className = className;
  return node;
}

// A classe CSS hidden oculta as seções não selecionadas. As telas continuam no mesmo index.html.
function showPage(which) {
  $('#home').classList.toggle('hidden', which !== 'home');
  $('#loginPage').classList.toggle('hidden', which !== 'login');
  $('#appPage').classList.toggle('hidden', which !== 'app');
  $('.public-header').classList.toggle('hidden', which !== 'home');
  $('#publicFooter').classList.toggle('hidden', which !== 'home');
  window.scrollTo(0, 0);
}

// Preenche as credenciais fictícias do perfil selecionado.
function setProfileChoice(role) {
  loginChoice = role;
  $$('.profile-choice').forEach((button) =>
    button.classList.toggle('selected', button.dataset.profile === role),
  );
  const p = profiles[role];
  $('#loginEmail').value = p.email;
  $('#loginPassword').value = p.password;
  $('#demoHint').textContent = `Demonstração: ${p.email} / ${p.password}`;
}
function validateCompanyEmail(field) {
  const email = field.value.trim().toLowerCase();
  const [mailbox, domain, extra] = email.split('@');
  if (mailbox && domain === COMPANY_DOMAIN && extra === undefined) return true;

  notify('Use um e-mail corporativo com @' + COMPANY_DOMAIN + '.');
  field.focus();
  return false;
}

function login(event) {
  event.preventDefault();
  if (!validateCompanyEmail($('#loginEmail'))) return;
  const profile = profiles[loginChoice];
  if (
    $('#loginEmail').value.trim().toLowerCase() !== profile.email ||
    $('#loginPassword').value !== profile.password
  ) {
    notify('Dados inválidos para o perfil escolhido. Utilize as credenciais de demonstração.');
    return;
  }
  activeProfile = loginChoice;
  sessionStorage.setItem(PROFILE_KEY, activeProfile);
  setUserInfo();
  showPage('app');
  openView('dashboard');
  notify(`Bem-vindo(a), ${profile.name}!`);
}
function setUserInfo() {
  if (!activeProfile) return;
  const p = profiles[activeProfile];
  $('#usersNav').classList.toggle('hidden', activeProfile !== 'admin');
  $('#userName').textContent = p.name;
  $('#userRole').textContent = p.role;
  const personal = JSON.parse(localStorage.getItem('novara_profile_' + p.email) || '{}');
  const fields = $('#profileForm').elements;
  $('#profileForm').reset();
  fields.displayName.value = personal.name || p.name;
  fields.phone.value = personal.phone || '';
  fields.extension.value = personal.extension || '';
  $('#userName').textContent = fields.displayName.value;
  $('#dashboardUserName').textContent = fields.displayName.value;
  const avatar = $('#avatar');
  avatar.textContent = fields.displayName.value.charAt(0);
  if (personal.photo) {
    const image = document.createElement('img');
    image.alt = '';
    image.src = personal.photo;
    avatar.replaceChildren(image);
  }
  $('#requesterInput').value = p.name;
  $('#requesterEmail').value = p.email;
}
function logout() {
  sessionStorage.setItem(PROFILE_KEY, 'login');
  activeProfile = null;
  showPage('login');
  $('#loginHeading').setAttribute('tabindex', '-1');
  $('#loginHeading').focus();
}

// Este filtro simula diferenças entre perfis na interface; não é controle de acesso seguro, pois os dados ficam no navegador.
function visibleTickets() {
  return ['tecnico', 'admin'].includes(activeProfile)
    ? tickets
    : tickets.filter(
        (ticket) =>
          (ticket.createdBy ?? ticket.email.toLowerCase()) === profiles[activeProfile].email,
      );
}
function openView(name) {
  if (!activeProfile) {
    showPage('login');
    return;
  }
  currentView = name;
  $$('.app-view').forEach((view) => view.classList.toggle('hidden', view.id !== `view-${name}`));
  $$('.nav-item[data-view]').forEach((button) =>
    button.classList.toggle('active', button.dataset.view === name),
  );
  $('#breadcrumb').textContent = {
    dashboard: 'Visão geral',
    tickets: 'Chamados',
    new: 'Novo chamado',
    reports: 'Relatórios',
    settings: 'Configurações',
    profile: 'Meu perfil',
    users: 'Funcionários',
  }[name];
  $('#sidebar').classList.remove('open');
  if (name === 'dashboard') renderDashboard();
  if (name === 'tickets') renderTickets();
  if (name === 'reports') renderReports();
  window.scrollTo(0, 0);
}
function statusClass(status) {
  return (
    {
      Aberto: 'open',
      'Em andamento': 'progress',
      'Aguardando retorno': 'waiting',
      Resolvido: 'resolved',
      Fechado: 'closed',
    }[status] || 'neutral'
  );
}
function priorityClass(priority) {
  return (
    { Baixa: 'low', Média: 'medium', Alta: 'high', Crítica: 'critical' }[priority] || 'neutral'
  );
}
function pill(value, type) {
  const el = textElement(
    'span',
    value,
    `pill ${type === 'status' ? statusClass(value) : priorityClass(value)}`,
  );
  return el;
}
function countCard(label, value, icon) {
  const card = document.createElement('article');
  card.className = 'kpi-card';
  const i = textElement('span', icon, 'kpi-icon');
  card.append(i, textElement('small', label), textElement('strong', value));
  return card;
}

// filter(...).length conta os tickets de cada status. Em seguida o DOM é atualizado com replaceChildren;
// os gráficos usam os mesmos tickets que a tabela, sem números fixos.
function renderDashboard() {
  const list = visibleTickets();
  const metrics = [
    ['Total de chamados', list.length, '▣'],
    ['Chamados abertos', list.filter((t) => t.status === 'Aberto').length, '◷'],
    ['Em andamento', list.filter((t) => t.status === 'Em andamento').length, '◉'],
    ['Resolvidos', list.filter((t) => t.status === 'Resolvido').length, '✓'],
  ];
  $('#kpiGrid').replaceChildren(...metrics.map((m) => countCard(...m)));
  const data = counts(list, 'status', statusList),
    maximum = Math.max(1, ...data.map((d) => d.value));
  const chart = $('#statusChart');
  chart.replaceChildren();
  data.forEach((d) => {
    const item = document.createElement('div');
    item.className = 'bar-item';
    item.append(textElement('b', d.value));
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${Math.max(5, (d.value / maximum) * 125)}px`;
    item.append(bar, textElement('span', d.label));
    chart.append(item);
  });
  chart.setAttribute('aria-label', data.map((d) => `${d.label}: ${d.value}`).join('; '));
  renderHorizontal($('#priorityChart'), counts(list, 'priority', priorityList), 'priority-row');
  const recent = $('#recentTickets');
  recent.replaceChildren();
  const sorted = [...list]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  sorted.forEach((ticket) => recent.append(ticketRow(ticket, true)));
  if (!sorted.length) recent.append(emptyRow(6));
}
function emptyRow(cols) {
  const tr = document.createElement('tr'),
    td = textElement('td', 'Nenhum chamado disponível.');
  td.colSpan = cols;
  tr.append(td);
  return tr;
}
function ticketRow(ticket, short = false) {
  const tr = document.createElement('tr');
  const vals = short
    ? [ticket.id, ticket.title]
    : [ticket.id, ticket.title, ticket.category, ticket.requester];
  vals.forEach((v, i) => tr.append(textElement('td', v, i === 0 ? 'ticket-id' : '')));
  const ptd = document.createElement('td');
  ptd.append(pill(ticket.priority, 'priority'));
  const std = document.createElement('td');
  std.append(pill(ticket.status, 'status'));
  tr.append(ptd, std, textElement('td', formatDate(ticket.createdAt)));
  const action = document.createElement('td'),
    button = textElement('button', 'Detalhes →', 'link-button');
  button.type = 'button';
  button.addEventListener('click', () => openTicketModal(ticket.id));
  action.append(button);
  tr.append(action);
  return tr;
}

// .filter() seleciona registros que satisfazem TODAS as opções preenchidas (operador &&).
// Se um campo não foi preenchido, a condição !campo permite ignorar aquele filtro.
function renderTickets() {
  const term = $('#ticketSearch').value.trim().toLocaleLowerCase('pt-BR'),
    status = $('#filterStatus').value,
    priority = $('#filterPriority').value,
    category = $('#filterCategory').value;
  const result = visibleTickets()
    .filter(
      (t) =>
        (!term ||
          [t.id, t.title, t.requester].some((v) =>
            String(v).toLocaleLowerCase('pt-BR').includes(term),
          )) &&
        (!status || t.status === status) &&
        (!priority || t.priority === priority) &&
        (!category || t.category === category),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const body = $('#allTickets');
  body.replaceChildren(...result.map((t) => ticketRow(t)));
  $('#emptyTickets').classList.toggle('hidden', result.length !== 0);
  $('#ticketCount').textContent = `${result.length} chamado(s) encontrado(s)`;
}
function renderHorizontal(target, data, rowClass = 'horizontal-row') {
  const max = Math.max(1, ...data.map((item) => item.value));
  target.replaceChildren();
  data.forEach((item) => {
    const row = document.createElement('div');
    row.className = rowClass;
    row.append(textElement('span', item.label));
    const track = document.createElement('div');
    track.className = 'track';
    track.setAttribute('role', 'img');
    track.setAttribute('aria-label', `${item.label}: ${item.value} chamados`);
    const fill = document.createElement('i');
    fill.style.width = `${(item.value / max) * 100}%`;
    track.append(fill);
    row.append(track, textElement('strong', item.value));
    target.append(row);
  });
}

// A taxa de resolução é (Resolvido + Fechado) / Total * 100; a condição evita divisão por zero.
// Os gráficos são preenchidos dinamicamente com a contagem de categorias, status e prioridades.
function renderReports() {
  const list = visibleTickets();
  const resolved = list.filter((t) => ['Resolvido', 'Fechado'].includes(t.status)).length;
  const rate = list.length ? Math.round((resolved / list.length) * 100) : 0;
  const report = $('#reportSummary');
  report.replaceChildren(
    countCard('Total de chamados', list.length, '▣'),
    countCard('Resolvidos ou fechados', resolved, '✓'),
    countCard('Pendentes', list.length - resolved, '◴'),
    countCard('Taxa de resolução', `${rate}%`, '◌'),
  );
  renderHorizontal($('#categoryReport'), counts(list, 'category', categoryList));
  renderHorizontal($('#statusReport'), counts(list, 'status', statusList));
  renderHorizontal($('#priorityReport'), counts(list, 'priority', priorityList));
  const circle = document.createElement('div');
  circle.className = 'resolution-circle';
  circle.style.background = `conic-gradient(var(--brand) ${rate}%, var(--surface2) ${rate}%)`;
  circle.setAttribute('role', 'img');
  circle.setAttribute('aria-label', `${rate}% de chamados resolvidos ou fechados`);
  const content = document.createElement('div');
  content.append(textElement('strong', `${rate}%`), textElement('span', 'Resolvidos ou fechados'));
  circle.append(content);
  $('#resolutionReport').replaceChildren(circle);
}

// Exemplo: CD-0013. padStart completa com zeros; usar o maior ID atual evita repetir IDs existentes,
// embora seja apenas uma estratégia local e não um identificador global de banco de dados.
function nextId() {
  return `CD-${String(Math.max(0, ...tickets.map((t) => Number(t.id.replace(/\D/g, '')) || 0)) + 1).padStart(4, '0')}`;
}
// Recebe o submit do formulário: evita recarregar a página, valida campos, monta o objeto,
// adiciona com unshift() no começo do array e tenta salvar antes de atualizar a interface.
function createTicket(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  if (!validateCompanyEmail(form.elements.email)) return;
  values.email = values.email.trim().toLowerCase();
  values.title = values.title.trim();
  values.description = values.description.trim();
  values.requester = values.requester.trim();
  if (values.title.length < 3 || values.description.length < 10 || !values.requester) {
    notify('Confira o título, o nome e a descrição (mínimo 10 caracteres).');
    return;
  }
  const entry = {
    id: nextId(),
    ...values,
    createdBy: profiles[activeProfile].email,
    status: 'Aberto',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    owner: null,
  };
  tickets.unshift(entry);
  if (!saveTickets()) {
    tickets.shift();
    return;
  }
  form.reset();
  setUserInfo();
  openView('tickets');
  notify(`Chamado ${entry.id} registrado com sucesso!`);
}

// O modal mostra atributos do ticket selecionado. Apenas perfis técnicos/admin veem opções de status e exclusão;
// é uma regra demonstrativa da interface, sem autorização em servidor.
function openTicketModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;
  activeTicketId = id;
  focusedBeforeModal = document.activeElement;
  $('#modalTitle').textContent = `${ticket.id} · ${ticket.title}`;
  const body = $('#modalContent');
  body.replaceChildren();
  const grid = document.createElement('div');
  grid.className = 'detail-grid';
  const attributes = [
    ['Solicitante', ticket.requester],
    ['E-mail', ticket.email],
    ['Categoria', ticket.category],
    ['Prioridade', ticket.priority],
    ['Setor', ticket.department],
    ['Status', ticket.status],
    ['Aberto em', formatDateTime(ticket.createdAt)],
    ['Resolvido em', formatDateTime(ticket.resolvedAt)],
    ['Responsável', ticket.owner || 'Não atribuído'],
  ];
  attributes.forEach(([label, value]) => {
    const cell = document.createElement('p');
    cell.append(textElement('strong', label), textElement('span', value || '—'));
    grid.append(cell);
  });
  body.append(grid);
  const desc = document.createElement('p');
  desc.className = 'modal-description';
  desc.append(textElement('strong', 'Descrição'), textElement('span', ticket.description));
  body.append(desc);
  const actions = $('#modalActions');
  actions.replaceChildren();
  if (['tecnico', 'admin'].includes(activeProfile)) {
    const label = textElement('label', 'Alterar status');
    const select = document.createElement('select');
    select.id = 'ticketModalStatus';
    statusList.forEach((s) => {
      const opt = new Option(s, s, s === ticket.status, s === ticket.status);
      select.add(opt);
    });
    label.append(select);
    actions.append(label);
    const save = textElement('button', 'Salvar status', 'btn primary');
    save.type = 'button';
    save.addEventListener('click', () => {
      const before = { status: ticket.status, resolvedAt: ticket.resolvedAt, owner: ticket.owner };
      ticket.status = select.value;
      if (['Resolvido', 'Fechado'].includes(ticket.status)) {
        ticket.resolvedAt = ticket.resolvedAt || new Date().toISOString();
        ticket.owner = profiles.tecnico.name;
      } else {
        ticket.resolvedAt = null;
        if (before.status === 'Aberto' && ticket.status === 'Em andamento')
          ticket.owner = profiles.tecnico.name;
      }
      if (!saveTickets()) {
        Object.assign(ticket, before);
        return;
      }
      closeModal();
      refreshCurrentView();
      notify('Status atualizado com sucesso.');
    });
    actions.append(save);
    const remove = textElement('button', 'Excluir', 'btn danger');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      if (!window.confirm(`Excluir o chamado ${ticket.id}? Esta ação não pode ser desfeita.`))
        return;
      const original = tickets;
      tickets = tickets.filter((t) => t.id !== id);
      if (!saveTickets()) {
        tickets = original;
        return;
      }
      closeModal();
      refreshCurrentView();
      notify('Chamado excluído.');
    });
    actions.append(remove);
  } else {
    actions.append(textElement('p', 'Para alterar o status, acesse o perfil Técnico.', 'hint'));
  }
  $('#modalBackdrop').classList.remove('hidden');
  $('#closeModal').focus();
}

// Devolve o foco ao controle que abriu a janela de detalhes.
function closeModal() {
  if ($('#modalBackdrop').classList.contains('hidden')) return;
  $('#modalBackdrop').classList.add('hidden');
  activeTicketId = null;
  if (focusedBeforeModal && document.contains(focusedBeforeModal)) focusedBeforeModal.focus();
}
function refreshCurrentView() {
  if (currentView === 'dashboard') renderDashboard();
  else if (currentView === 'tickets') renderTickets();
  else if (currentView === 'reports') renderReports();
}

// O tema altera data-theme no elemento html, ativando variáveis do CSS. A fonte muda --scale;
// ambas as preferências são persistidas no localStorage.
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  $('#quickTheme').textContent = theme === 'dark' ? '☀' : '◐';
}
function applyFont(value) {
  const size = Math.min(1.25, Math.max(0.9, Number(value) || 1));
  document.documentElement.style.setProperty('--scale', size);
  localStorage.setItem(FONT_KEY, String(size));
}

// Conteúdo e controles do carrossel institucional.
const slides = [
  [
    'Tudo em um só lugar',
    'Encontre solicitações e informações sem perder tempo entre diferentes canais.',
    '◈',
  ],
  ['Acompanhe cada etapa', 'Uma visão clara dos atendimentos, do registro à resolução.', '◷'],
  [
    'Decisões baseadas em dados',
    'Indicadores reais ajudam a identificar prioridades e acompanhar o suporte.',
    '▥',
  ],
];
let slideIndex = 0;
function renderSlide() {
  const [title, text, icon] = slides[slideIndex];
  $('#slideTitle').textContent = title;
  $('#slideText').textContent = text;
  $('#slideIcon').textContent = icon;
  $('#slideNumber').textContent = `${String(slideIndex + 1).padStart(2, '0')} / 03`;
  const dots = $('#slideDots');
  dots.replaceChildren();
  slides.forEach((slide, index) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ir para slide ${index + 1}`);
    b.setAttribute('aria-current', String(index === slideIndex));
    b.addEventListener('click', () => {
      slideIndex = index;
      renderSlide();
    });
    dots.append(b);
  });
}

// addEventListener associa cliques, alterações de filtros e envios de formulário às funções.
// Também gerencia Escape/Tab do modal, botão de tema, tamanho da fonte e menu móvel.
async function savePersonalProfile(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const key = 'novara_profile_' + profiles[activeProfile].email;
  const previous = JSON.parse(localStorage.getItem(key) || '{}');
  let photo = form.elements.removePhoto.checked ? '' : previous.photo;
  const file = form.elements.photo.files[0];
  try {
    if (file && !form.elements.removePhoto.checked) {
      if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 1024 * 1024) {
        notify('Escolha uma foto JPG ou PNG de até 1 MB.');
        return;
      }
      photo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    const name = form.elements.displayName.value.trim();
    if (!name) {
      notify('Preencha o nome de exibição.');
      return;
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        name,
        phone: form.elements.phone.value.trim(),
        extension: form.elements.extension.value.trim(),
        photo,
      }),
    );
    setUserInfo();
    notify('Perfil atualizado.');
  } catch {
    notify('Não foi possível salvar o perfil neste navegador.');
  }
}

function wireEvents() {
  $('#profileForm').addEventListener('submit', savePersonalProfile);
  $$('[data-action=login]').forEach((b) => b.addEventListener('click', () => showPage('login')));
  $$('[data-action=home]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('home');
    }),
  );
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => openView(b.dataset.view)));
  $$('.profile-choice').forEach((b) =>
    b.addEventListener('click', () => setProfileChoice(b.dataset.profile)),
  );
  $('#loginForm').addEventListener('submit', login);
  $('#logout').addEventListener('click', logout);
  $('#togglePassword').addEventListener('click', () => {
    const field = $('#loginPassword');
    const show = field.type === 'password';
    field.type = show ? 'text' : 'password';
    $('#togglePassword').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  });
  $('#ticketForm').addEventListener('submit', createTicket);
  ['ticketSearch', 'filterStatus', 'filterPriority', 'filterCategory'].forEach((id) =>
    $('#' + id).addEventListener(id === 'ticketSearch' ? 'input' : 'change', renderTickets),
  );
  $('#contactForm').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (!validateCompanyEmail(event.currentTarget.elements.email)) return;
    notify('Formulário validado! Esta é uma demonstração: nenhuma mensagem foi enviada.');
    event.currentTarget.reset();
  });
  $('#prevSlide').addEventListener('click', () => {
    slideIndex = (slideIndex + slides.length - 1) % slides.length;
    renderSlide();
  });
  $('#nextSlide').addEventListener('click', () => {
    slideIndex = (slideIndex + 1) % slides.length;
    renderSlide();
  });
  $('#closeModal').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', (event) => {
    if (event.target === $('#modalBackdrop')) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab' && !$('#modalBackdrop').classList.contains('hidden')) {
      const focusables = $$('button,select,input,[href]', $('.modal')).filter((el) => !el.disabled);
      if (focusables.length) {
        const first = focusables[0],
          last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  });
  $('#quickTheme').addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'),
  );
  $('#themeLight').addEventListener('click', () => applyTheme('light'));
  $('#themeDark').addEventListener('click', () => applyTheme('dark'));
  $('#fontIncrease').addEventListener('click', () =>
    applyFont((parseFloat(localStorage.getItem(FONT_KEY)) || 1) + 0.1),
  );
  $('#fontDecrease').addEventListener('click', () =>
    applyFont((parseFloat(localStorage.getItem(FONT_KEY)) || 1) - 0.1),
  );
  $('#fontReset').addEventListener('click', () => applyFont(1));
  $('#openMenu').addEventListener('click', () => {
    $('#sidebar').classList.add('open');
    $('#closeMenu').focus();
  });
  $('#closeMenu').addEventListener('click', () => {
    $('#sidebar').classList.remove('open');
    $('#openMenu').focus();
  });
}

// init executa após DOMContentLoaded, quando o HTML já está disponível para querySelector.
// Liga eventos, restaura tema/fonte, recupera sessão e abre a tela inicial.
function init() {
  wireEvents();
  renderSlide();
  applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
  applyFont(parseFloat(localStorage.getItem(FONT_KEY)) || 1);
  const saved = sessionStorage.getItem(PROFILE_KEY);
  if (saved === 'login') {
    showPage('login');
    return;
  }

  // A demonstração começa na área interna com a visão completa da equipe de TI.
  activeProfile = Object.hasOwn(profiles, saved) ? saved : 'tecnico';
  setUserInfo();
  showPage('app');
  openView('dashboard');
}
document.addEventListener('DOMContentLoaded', init);
