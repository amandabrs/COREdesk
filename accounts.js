// Módulo opcional de contas fictícias. Tudo ocorre neste navegador: não existe envio real de convite,
// sincronização entre notebooks ou autenticação segura. Uma aplicação real precisa de servidor e banco de dados.
const accountsKey = 'novara_staff_demo_v1';
// JSON.parse lê as contas salvas como texto JSON; se a chave não existir, utiliza lista vazia.
const readAccounts = () => JSON.parse(localStorage.getItem(accountsKey) || '[]');
const writeAccounts = (accounts) => localStorage.setItem(accountsKey, JSON.stringify(accounts));
profiles.admin = {
  name: 'Amanda Barros',
  email: 'admin@novarati.com',
  role: 'Administrador de TI',
};
// Insere o funcionário no objeto profiles para que a interface conheça seu nome, e-mail e papel.
function registerProfile(account) {
  profiles[account.email] = { name: account.name, email: account.email, role: 'Colaborador' };
}
readAccounts()
  .filter((account) => account.hash)
  .forEach(registerProfile);
function enterAccount(id) {
  activeProfile = id;
  sessionStorage.setItem(PROFILE_KEY, id);
  setUserInfo();
  showPage('app');
  openView('dashboard');
}
// PBKDF2 com SHA-256 deriva um hash da senha e um salt; não guarda a senha cadastrada em texto puro.
// Apesar disso, a validação inteiramente no cliente NÃO oferece autenticação real nem proteção dos dados.
async function derivePassword(password, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', iterations: 600000, salt: encoder.encode(salt) },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (v) => v.toString(16).padStart(2, '0')).join('');
}
// Reconstrói a lista visual dos funcionários, identificando contas ativas, pendentes ou expiradas.
function updateDirectory() {
  $('#staffList').replaceChildren(
    ...readAccounts().map((account) => {
      const row = document.createElement('li');
      row.textContent =
        account.name +
        ' · ' +
        account.email +
        ' · ' +
        (account.hash
          ? 'Ativo'
          : account.expires > Date.now()
            ? 'Convite pendente'
            : 'Convite expirado');
      return row;
    }),
  );
}
// Executa os controles de administração quando a estrutura HTML já foi carregada.
document.addEventListener('DOMContentLoaded', () => {
  $('#adminDemo').onclick = () => {
    enterAccount('admin');
    openView('users');
    updateDirectory();
  };
  $('#usersNav').addEventListener('click', updateDirectory);
  // O administrador cria um convite fictício por token com duração de 24 horas, salvo localmente.
  $('#inviteForm').onsubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (activeProfile !== 'admin' || !validateCompanyEmail(form.elements.email)) return;
    const email = form.elements.email.value.trim().toLowerCase();
    const name = form.elements.employee.value.trim();
    if (!name) return;
    const accounts = readAccounts();
    if (Object.values(profiles).some((profile) => profile.email === email)) {
      notify('Este e-mail já está cadastrado.');
      return;
    }
    const token = crypto.randomUUID();
    writeAccounts([
      ...accounts.filter((account) => account.email !== email),
      { email, name, token, expires: Date.now() + 86400000 },
    ]);
    const link = $('#invitationLink');
    link.href = '#convite=' + token;
    link.hidden = false;
    form.reset();
    updateDirectory();
  };
  // Confere o token na URL (#convite=...) e abre o cadastro inicial se houver convite local válido.
  function openInvite() {
    const token = location.hash.slice('#convite='.length);
    if (!location.hash.startsWith('#convite=')) return;
    const account = readAccounts().find((a) => a.token === token && a.expires > Date.now());
    if (!account) {
      notify('Convite expirado ou já utilizado.');
      return;
    }
    activeProfile = null;
    sessionStorage.setItem(PROFILE_KEY, 'login');
    showPage('login');
    $('#activateForm').classList.remove('hidden');
    $('#inviteIdentity').textContent = account.name + ' · ' + account.email;
    $('#activateForm').scrollIntoView();
  }
  window.addEventListener('hashchange', openInvite);
  openInvite();
  // Na ativação, cria o hash, marca a conta como ativa e inicia a sessão demonstrativa.
  $('#activateForm').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const token = location.hash.slice('#convite='.length);
    const salt = crypto.randomUUID();
    const hash = await derivePassword(form.elements.password.value, salt);
    const accounts = readAccounts();
    const account = accounts.find((a) => a.token === token && a.expires > Date.now());
    if (!account) {
      notify('Convite expirado ou já utilizado.');
      return;
    }
    Object.assign(account, { salt, hash });
    delete account.token;
    delete account.expires;
    writeAccounts(accounts);
    registerProfile(account);
    form.reset();
    form.classList.add('hidden');
    history.replaceState(null, '', location.href.split('#')[0]);
    enterAccount(account.email);
  };
  // Login de funcionário cadastrado: compara o hash local, sem contato com qualquer servidor.
  $('#staffLogin').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateCompanyEmail(form.elements.email)) return;
    const account = readAccounts().find(
      (a) => a.email === form.elements.email.value.trim().toLowerCase(),
    );
    if (
      !account?.hash ||
      (await derivePassword(form.elements.password.value, account.salt)) !== account.hash
    ) {
      notify('E-mail ou senha incorretos.');
      return;
    }
    registerProfile(account);
    form.reset();
    enterAccount(account.email);
  };
});
