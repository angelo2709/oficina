require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cookieSession = require('cookie-session');
const setupDatabase = require('./db-setup');

const app = express();
const port = Number(process.env.PORT || process.env.APP_PORT || 3000);
const publicDir = path.join(__dirname, '..', 'public');
const authEnabled = Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
if (process.env.NODE_ENV === 'production' && (!authEnabled || !process.env.SESSION_SECRET)) {
  throw new Error('Configure ADMIN_USER, ADMIN_PASSWORD e SESSION_SECRET antes de publicar.');
}
app.set('trust proxy', 1);
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'oficina_user',
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || 'oficina123',
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'oficina',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  ssl: process.env.DB_SSL_CA
    ? {
        ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'),
        rejectUnauthorized: true
      }
    : undefined
});

app.use(express.json());
app.use(cookieSession({
  name: 'oficina_session',
  keys: [process.env.SESSION_SECRET || 'local-only-demo-session-key'],
  maxAge: 8 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}));

app.get('/api/session', (req, res) => res.json({
  authEnabled,
  authenticated: !authEnabled || Boolean(req.session?.authenticated)
}));
app.post('/api/login', (req, res) => {
  if (!authEnabled) return res.json({ ok: true });
  if (req.body.username !== process.env.ADMIN_USER || req.body.password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }
  req.session = { authenticated: true };
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });
app.use('/api', (req, res, next) => {
  if (!authEnabled || req.session?.authenticated) return next();
  res.status(401).json({ error: 'Faça login para acessar o sistema.' });
});
app.use(express.static(publicDir, { index: false }));
app.get('/login', (_req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get('/', (req, res) => {
  if (authEnabled && !req.session?.authenticated) return res.redirect('/login');
  res.sendFile(path.join(publicDir, 'index.html'));
});

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
function validId(value) { return Number.isInteger(Number(value)) && Number(value) > 0; }

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

app.get('/api/summary', asyncRoute(async (_req, res) => {
  const [[parts]] = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(peca_estoque_atual), 0) AS units FROM pecas');
  const [[low]] = await pool.query('SELECT COUNT(*) AS total FROM pecas WHERE peca_estoque_atual <= 5');
  const [[orders]] = await pool.query("SELECT COUNT(*) AS total, COALESCE(SUM(os_status IN ('Aberta','Em andamento','Aguardando peças')), 0) AS active, COALESCE(SUM(os_status = 'Concluída'), 0) AS completed FROM ordens_servico");
  const [recent] = await pool.query('SELECT os_id, cliente_nome, veiculo_modelo, veiculo_placa, os_status, valor_mao_obra, data_abertura FROM ordens_servico ORDER BY data_abertura DESC LIMIT 5');
  res.json({ parts, lowStock: low.total, orders, recent });
}));

app.get('/api/lookups', asyncRoute(async (_req, res) => {
  const [categories] = await pool.query('SELECT categoria_id AS id, categoria_nome AS nome FROM categorias ORDER BY categoria_nome');
  const [makers] = await pool.query('SELECT fabricante_id AS id, fabricante_nome AS nome FROM fabricantes ORDER BY fabricante_nome');
  res.json({ categories, makers });
}));

app.get('/api/parts', asyncRoute(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const [rows] = await pool.query(
    `SELECT p.peca_id AS id, p.peca_sku AS sku, p.peca_nome AS nome,
      p.peca_preco_venda AS preco, p.peca_estoque_atual AS estoque,
      c.categoria_nome AS categoria, c.categoria_id AS categoriaId,
      f.fabricante_nome AS fabricante, f.fabricante_id AS fabricanteId
     FROM pecas p JOIN categorias c ON c.categoria_id=p.categoria_id
     JOIN fabricantes f ON f.fabricante_id=p.fabricante_id
     WHERE ? = '' OR p.peca_nome LIKE CONCAT('%', ?, '%') OR p.peca_sku LIKE CONCAT('%', ?, '%')
     ORDER BY p.peca_nome`, [q, q, q]);
  res.json(rows);
}));

app.post('/api/parts', asyncRoute(async (req, res) => {
  const { sku, nome, categoriaId, fabricanteId } = req.body;
  const preco = Number(req.body.preco);
  const estoque = Number(req.body.estoque);
  if (!sku || !nome || !validId(categoriaId) || !validId(fabricanteId) || !Number.isFinite(preco) || preco < 0 || !Number.isInteger(estoque) || estoque < 0) {
    return res.status(400).json({ error: 'Confira o código, nome, categoria, fabricante, preço e estoque.' });
  }
  const [result] = await pool.query('INSERT INTO pecas (categoria_id, fabricante_id, peca_sku, peca_nome, peca_preco_venda, peca_estoque_atual) VALUES (?, ?, ?, ?, ?, ?)', [categoriaId, fabricanteId, sku.trim(), nome.trim(), preco, estoque]);
  res.status(201).json({ id: result.insertId });
}));

app.put('/api/parts/:id', asyncRoute(async (req, res) => {
  const { sku, nome, categoriaId, fabricanteId } = req.body;
  const preco = Number(req.body.preco);
  const estoque = Number(req.body.estoque);
  if (!validId(req.params.id) || !sku || !nome || !validId(categoriaId) || !validId(fabricanteId) || !Number.isFinite(preco) || preco < 0 || !Number.isInteger(estoque) || estoque < 0) {
    return res.status(400).json({ error: 'Confira os dados da peça.' });
  }
  const [result] = await pool.query('UPDATE pecas SET categoria_id=?, fabricante_id=?, peca_sku=?, peca_nome=?, peca_preco_venda=?, peca_estoque_atual=? WHERE peca_id=?', [categoriaId, fabricanteId, sku.trim(), nome.trim(), preco, estoque, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Peça não encontrada.' });
  res.json({ ok: true });
}));

app.delete('/api/parts/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Código de peça inválido.' });
  const [result] = await pool.query('DELETE FROM pecas WHERE peca_id=?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Peça não encontrada.' });
  res.json({ ok: true });
}));

app.get('/api/suppliers', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`SELECT f.fornecedor_id AS id, f.fornecedor_razao_social AS nome,
    f.fornecedor_cnpj AS cnpj, f.fornecedor_telefone AS telefone, f.fornecedor_email AS email,
    COUNT(fp.peca_id) AS pecas FROM fornecedores f LEFT JOIN fornecedores_pecas fp ON fp.fornecedor_id=f.fornecedor_id
    GROUP BY f.fornecedor_id ORDER BY f.fornecedor_razao_social`);
  res.json(rows);
}));

app.post('/api/suppliers', asyncRoute(async (req, res) => {
  const nome = String(req.body.nome || '').trim();
  const cnpj = String(req.body.cnpj || '').trim();
  const telefone = String(req.body.telefone || '').trim();
  const email = String(req.body.email || '').trim();
  if (!nome || !cnpj) return res.status(400).json({ error: 'Informe a razão social e o CNPJ.' });
  const [result] = await pool.query('INSERT INTO fornecedores (fornecedor_razao_social, fornecedor_cnpj, fornecedor_telefone, fornecedor_email) VALUES (?, ?, ?, ?)', [nome, cnpj, telefone || null, email || null]);
  res.status(201).json({ id: result.insertId });
}));

app.get('/api/orders', asyncRoute(async (req, res) => {
  const status = String(req.query.status || '').trim();
  const allowed = ['Aberta', 'Em andamento', 'Aguardando peças', 'Concluída', 'Cancelada'];
  const [rows] = await pool.query(`SELECT os_id AS id, cliente_nome AS cliente, cliente_telefone AS telefone,
    veiculo_placa AS placa, veiculo_modelo AS veiculo, problema, os_status AS status,
    valor_mao_obra AS maoDeObra, data_abertura AS abertaEm FROM ordens_servico
    WHERE ? = '' OR os_status = ? ORDER BY data_abertura DESC`, [allowed.includes(status) ? status : '', status]);
  res.json(rows);
}));

app.post('/api/orders', asyncRoute(async (req, res) => {
  const cliente = String(req.body.cliente || '').trim();
  const telefone = String(req.body.telefone || '').trim();
  const placa = String(req.body.placa || '').trim().toUpperCase();
  const veiculo = String(req.body.veiculo || '').trim();
  const problema = String(req.body.problema || '').trim();
  const valor = Number(req.body.maoDeObra || 0);
  if (!cliente || !placa || !veiculo || !problema || !Number.isFinite(valor) || valor < 0) {
    return res.status(400).json({ error: 'Preencha cliente, placa, veículo, descrição do problema e um valor válido.' });
  }
  const [result] = await pool.query(`INSERT INTO ordens_servico
    (cliente_nome, cliente_telefone, veiculo_placa, veiculo_modelo, problema, valor_mao_obra)
    VALUES (?, ?, ?, ?, ?, ?)`, [cliente, telefone || null, placa, veiculo, problema, valor]);
  res.status(201).json({ id: result.insertId });
}));

app.patch('/api/orders/:id/status', asyncRoute(async (req, res) => {
  const allowed = ['Aberta', 'Em andamento', 'Aguardando peças', 'Concluída', 'Cancelada'];
  if (!validId(req.params.id) || !allowed.includes(req.body.status)) return res.status(400).json({ error: 'Status inválido.' });
  const [result] = await pool.query('UPDATE ordens_servico SET os_status=? WHERE os_id=?', [req.body.status, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Ordem de serviço não encontrada.' });
  res.json({ ok: true });
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Já existe um registro com esse código ou CNPJ.' });
  if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Este registro está ligado a outro dado e não pode ser removido.' });
  res.status(500).json({ error: 'Ocorreu um erro no servidor. Confira se o banco está iniciado.' });
});

async function start() {
  try {
    await setupDatabase(pool);
    app.listen(port, '0.0.0.0', () => console.log(`Oficina Web pronta na porta ${port}`));
  } catch (error) {
    console.error('Não foi possível iniciar. Confira o banco de dados:', error.message);
    process.exit(1);
  }
}
start();
