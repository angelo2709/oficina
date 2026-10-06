const state = { view: 'inicio', parts: [], suppliers: [], orders: [], lookups: { categories: [], makers: [] }, orderStatus: '' };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateLabel = value => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
const statusClass = value => `status-${String(value).toLowerCase().replaceAll(' ', '-')}`;
let toastTimer;

function showToast(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Não foi possível completar a operação.');
  return body;
}
function empty(title, detail) { return `<div class="empty-state"><strong>${safe(title)}</strong><p>${safe(detail)}</p></div>`; }

async function loadLookups() { state.lookups = await api('/api/lookups'); }
async function loadDashboard() {
  const data = await api('/api/summary');
  $('#statParts').textContent = Number(data.parts.total).toLocaleString('pt-BR');
  $('#statUnits').textContent = Number(data.parts.units).toLocaleString('pt-BR');
  $('#statActive').textContent = Number(data.orders.active).toLocaleString('pt-BR');
  $('#statOrders').textContent = `${Number(data.orders.total).toLocaleString('pt-BR')} no total`;
  $('#statLow').textContent = Number(data.lowStock).toLocaleString('pt-BR');
  $('#statDone').textContent = Number(data.orders.completed).toLocaleString('pt-BR');
  $('#navStock').textContent = Number(data.parts.total).toLocaleString('pt-BR');
  $('#recentOrders').innerHTML = data.recent.length ? data.recent.map(order => `
    <div class="recent-row"><span class="order-id">#${String(order.os_id).padStart(3, '0')}</span>
      <span><strong class="recent-name">${safe(order.cliente_nome)} · ${safe(order.veiculo_modelo)}</strong><small class="recent-desc">${safe(order.veiculo_placa)} · ${dateLabel(order.data_abertura)}</small></span>
      <span class="status-badge ${statusClass(order.os_status)}">${safe(order.os_status)}</span></div>`).join('') : `<div class="no-data"><strong>Sem ordens por enquanto</strong>Quando abrir uma OS, ela aparecerá aqui.</div>`;
  const low = await api('/api/parts');
  const lowRows = low.filter(p => Number(p.estoque) <= 5).sort((a, b) => Number(a.estoque) - Number(b.estoque)).slice(0, 4);
  $('#lowStockList').innerHTML = lowRows.length ? lowRows.map(p => `<div class="low-row"><div class="low-info"><strong>${safe(p.nome)}</strong><span>${safe(p.sku)} · ${safe(p.categoria)}</span></div><span class="stock-pill">${p.estoque} un.</span></div>`).join('') : `<div class="no-data"><strong>Estoque tranquilo</strong>Nenhuma peça está abaixo de 6 unidades.</div>`;
}
async function loadParts(query = '') {
  state.parts = await api(`/api/parts?q=${encodeURIComponent(query)}`);
  $('#partsCount').textContent = `${state.parts.length} ${state.parts.length === 1 ? 'peça encontrada' : 'peças encontradas'}`;
  $('#partsTable').innerHTML = state.parts.map(p => {
    const stockClass = Number(p.estoque) === 0 ? 'none' : Number(p.estoque) <= 5 ? 'low' : '';
    return `<tr><td><div class="part-cell"><span class="part-thumb">⚙</span><span><strong>${safe(p.nome)}</strong><small>${safe(p.sku)}</small></span></div></td>
      <td>${safe(p.categoria)}</td><td>${safe(p.fabricante)}</td><td class="price-cell">${money(p.preco)}</td>
      <td><span class="stock-level ${stockClass}">${Number(p.estoque)} un.</span></td>
      <td><div class="row-actions"><button class="icon-action" data-action="edit-part" data-id="${p.id}" title="Editar peça">✎</button><button class="icon-action danger" data-action="delete-part" data-id="${p.id}" title="Excluir peça">×</button></div></td></tr>`;
  }).join('');
  $('#partsEmpty').classList.toggle('hidden', state.parts.length > 0);
  $('#navStock').textContent = Number(state.parts.length).toLocaleString('pt-BR');
}
async function loadOrders() {
  const suffix = state.orderStatus ? `?status=${encodeURIComponent(state.orderStatus)}` : '';
  state.orders = await api(`/api/orders${suffix}`);
  $('#ordersCount').textContent = `${state.orders.length} ${state.orders.length === 1 ? 'ordem' : 'ordens'}`;
  const statuses = ['Aberta', 'Em andamento', 'Aguardando peças', 'Concluída', 'Cancelada'];
  $('#ordersList').innerHTML = state.orders.length ? state.orders.map(o => `<article class="order-card"><span class="order-id">#${String(o.id).padStart(3, '0')}</span><div class="order-main"><h3>${safe(o.cliente)} <span class="status-badge ${statusClass(o.status)}">${safe(o.status)}</span></h3><div class="order-meta"><span>▣ ${safe(o.veiculo)}</span><span>⌖ ${safe(o.placa)}</span><span>◷ ${dateLabel(o.abertaEm)}</span>${o.telefone ? `<span>☎ ${safe(o.telefone)}</span>` : ''}</div><p class="order-problem">${safe(o.problema)}</p></div><div class="order-side"><span class="order-price">Mão de obra · ${money(o.maoDeObra)}</span><select class="status-select" data-action="order-status" data-id="${o.id}" aria-label="Alterar status da ordem ${o.id}">${statuses.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div></article>`).join('') : empty('Nenhuma ordem encontrada', 'Cadastre uma ordem de serviço para acompanhar o veículo por aqui.');
}
async function loadSuppliers() {
  state.suppliers = await api('/api/suppliers');
  $('#supplierGrid').innerHTML = state.suppliers.length ? state.suppliers.map(s => `<article class="supplier-card"><div class="supplier-icon">♧</div><h3>${safe(s.nome)}</h3><div class="supplier-cnpj">CNPJ ${safe(s.cnpj)}</div><div class="supplier-details"><span>☎ ${safe(s.telefone || 'Telefone não informado')}</span><span>✉ ${safe(s.email || 'E-mail não informado')}</span></div><span class="supplier-count">▤ ${Number(s.pecas)} ${Number(s.pecas) === 1 ? 'peça vinculada' : 'peças vinculadas'}</span></article>`).join('') : empty('Nenhum fornecedor cadastrado', 'Adicione seu primeiro fornecedor para manter os contatos organizados.');
}
async function refreshCurrent() {
  try {
    if (state.view === 'inicio') await loadDashboard();
    if (state.view === 'estoque') await loadParts($('#partSearch').value);
    if (state.view === 'ordens') await loadOrders();
    if (state.view === 'fornecedores') await loadSuppliers();
  } catch (error) { showToast(error.message, true); }
}
function go(view) {
  const names = { inicio: 'Visão geral', estoque: 'Estoque de peças', ordens: 'Ordens de serviço', fornecedores: 'Fornecedores' };
  if (!names[view]) return;
  state.view = view;
  $$('.view').forEach(el => el.classList.toggle('active', el.id === `view-${view}`));
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  $('#crumb').textContent = names[view];
  $('#sidebar').classList.remove('open');
  refreshCurrent();
}
function field(label, name, type = 'text', options = {}) {
  const full = options.full ? ' full' : '';
  const required = options.required === false ? '' : 'required';
  let input;
  if (type === 'select') input = `<select name="${name}" ${required}>${options.items.map(item => `<option value="${safe(item.value)}" ${item.selected ? 'selected' : ''}>${safe(item.label)}</option>`).join('')}</select>`;
  else if (type === 'textarea') input = `<textarea name="${name}" placeholder="${safe(options.placeholder || '')}" ${required}>${safe(options.value || '')}</textarea>`;
  else input = `<input name="${name}" type="${type}" value="${safe(options.value || '')}" placeholder="${safe(options.placeholder || '')}" ${options.min != null ? `min="${options.min}"` : ''} ${options.step ? `step="${options.step}"` : ''} ${required}>`;
  return `<div class="field${full}"><label>${safe(label)}</label>${input}</div>`;
}
function selectOptions(rows, chosen, labelOf = x => x.nome) { return rows.map(x => ({ value: x.id, label: labelOf(x), selected: String(x.id) === String(chosen) })); }
function openModal(kind, record = null) {
  const editing = Boolean(record);
  let title = '', eyebrow = '', fields = '';
  if (kind === 'part') {
    title = editing ? 'Editar peça' : 'Cadastrar peça'; eyebrow = 'INVENTÁRIO';
    fields = field('Nome da peça', 'nome', 'text', { full: true, value: record?.nome, placeholder: 'Ex.: Pastilha de freio dianteira' })
      + field('Código / SKU', 'sku', 'text', { value: record?.sku, placeholder: 'Ex.: PEC-105' })
      + field('Preço de venda (R$)', 'preco', 'number', { value: record?.preco, min: 0, step: '0.01', placeholder: '0,00' })
      + field('Categoria', 'categoriaId', 'select', { items: selectOptions(state.lookups.categories, record?.categoriaId) })
      + field('Fabricante', 'fabricanteId', 'select', { items: selectOptions(state.lookups.makers, record?.fabricanteId) })
      + field('Quantidade em estoque', 'estoque', 'number', { value: record?.estoque ?? 0, min: 0, step: '1' });
  } else if (kind === 'supplier') {
    title = 'Adicionar fornecedor'; eyebrow = 'PARCEIROS';
    fields = field('Razão social', 'nome', 'text', { full: true, placeholder: 'Nome da empresa' })
      + field('CNPJ', 'cnpj', 'text', { placeholder: '00.000.000/0000-00' })
      + field('Telefone', 'telefone', 'tel', { required: false, placeholder: '(00) 00000-0000' })
      + field('E-mail', 'email', 'email', { full: true, required: false, placeholder: 'contato@empresa.com' });
  } else {
    title = 'Nova ordem de serviço'; eyebrow = 'ATENDIMENTO';
    fields = field('Nome do cliente', 'cliente', 'text', { placeholder: 'Nome completo' })
      + field('Telefone', 'telefone', 'tel', { required: false, placeholder: '(00) 00000-0000' })
      + field('Veículo / modelo', 'veiculo', 'text', { placeholder: 'Ex.: Honda Civic 2018' })
      + field('Placa', 'placa', 'text', { placeholder: 'ABC1D23' })
      + field('Descrição do problema / serviço', 'problema', 'textarea', { full: true, placeholder: 'Descreva o que o cliente relatou ou o serviço solicitado...' })
      + field('Valor da mão de obra (R$)', 'maoDeObra', 'number', { min: 0, step: '0.01', value: '0.00' });
  }
  $('#modalEyebrow').textContent = eyebrow;
  $('#modalTitle').textContent = title;
  $('#modalFields').innerHTML = fields;
  $('#modalSubmit').textContent = editing ? 'Salvar alterações' : kind === 'order' ? 'Abrir ordem de serviço' : kind === 'supplier' ? 'Adicionar fornecedor' : 'Cadastrar peça';
  $('#modalForm').dataset.kind = kind;
  $('#modalForm').dataset.id = record?.id || '';
  $('#modalBackdrop').classList.remove('hidden');
  setTimeout(() => $('#modalFields input')?.focus(), 40);
}
function closeModal() { $('#modalBackdrop').classList.add('hidden'); $('#modalForm').reset(); }
async function handleModalSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const values = Object.fromEntries(form.entries());
  const kind = event.currentTarget.dataset.kind;
  const id = event.currentTarget.dataset.id;
  try {
    if (kind === 'part') {
      const payload = { ...values, categoriaId: Number(values.categoriaId), fabricanteId: Number(values.fabricanteId), preco: Number(values.preco), estoque: Number(values.estoque) };
      await api(id ? `/api/parts/${id}` : '/api/parts', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      showToast(id ? 'Peça atualizada.' : 'Peça cadastrada.');
      closeModal();
      if (state.view === 'inicio') await loadDashboard(); else await loadParts($('#partSearch').value);
    } else if (kind === 'supplier') {
      await api('/api/suppliers', { method: 'POST', body: JSON.stringify(values) });
      showToast('Fornecedor adicionado.'); closeModal(); await loadSuppliers();
    } else {
      const payload = { ...values, maoDeObra: Number(values.maoDeObra) };
      await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Ordem de serviço aberta.'); closeModal();
      if (state.view === 'ordens') await loadOrders(); else go('ordens');
    }
  } catch (error) { showToast(error.message, true); }
}
async function runAction(target) {
  const id = target.dataset.id;
  try {
    if (target.dataset.action === 'edit-part') {
      const p = state.parts.find(item => String(item.id) === String(id));
      if (p) openModal('part', p);
    }
    if (target.dataset.action === 'delete-part') {
      const p = state.parts.find(item => String(item.id) === String(id));
      if (!p || !confirm(`Excluir a peça “${p.nome}”?`)) return;
      await api(`/api/parts/${id}`, { method: 'DELETE' });
      showToast('Peça excluída.'); await loadParts($('#partSearch').value);
    }
    if (target.dataset.action === 'order-status') {
      await api(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: target.value }) });
      showToast('Status da ordem atualizado.');
      if (state.view === 'inicio') await loadDashboard();
    }
  } catch (error) { showToast(error.message, true); if (target.dataset.action === 'order-status') await loadOrders(); }
}

$('#today').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date());
$$('.nav-item').forEach(button => button.addEventListener('click', () => go(button.dataset.view)));
document.addEventListener('click', event => {
  const goButton = event.target.closest('[data-go]');
  const openButton = event.target.closest('[data-open]');
  const action = event.target.closest('[data-action]');
  if (goButton) go(goButton.dataset.go);
  if (openButton) openModal(openButton.dataset.open);
  if (action && action.dataset.action !== 'order-status') runAction(action);
});
$('#modalForm').addEventListener('submit', handleModalSubmit);
$('#modalClose').addEventListener('click', closeModal);
$('#modalCancel').addEventListener('click', closeModal);
$('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
$('#partSearch').addEventListener('input', event => loadParts(event.target.value).catch(err => showToast(err.message, true)));
$('#ordersList').addEventListener('change', event => { if (event.target.matches('[data-action="order-status"]')) runAction(event.target); });
$$('[data-status]').forEach(button => button.addEventListener('click', () => {
  state.orderStatus = button.dataset.status;
  $$('[data-status]').forEach(tab => tab.classList.toggle('active', tab === button));
  loadOrders().catch(err => showToast(err.message, true));
}));
$('#mobileMenu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#logoutButton').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST' }); window.location.replace('/login'); }
  catch (error) { showToast(error.message, true); }
});

(async function start() {
  try {
    const session = await api('/api/session');
    if (!session.authenticated) { window.location.replace('/login'); return; }
    await api('/api/health');
    await loadLookups();
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
    $('#recentOrders').innerHTML = `<div class="no-data"><strong>Não foi possível conectar ao banco</strong>Inicie os serviços pelo terminal e recarregue a página.</div>`;
  }
})();
