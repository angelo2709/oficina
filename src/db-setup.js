const schema = [
  `CREATE TABLE IF NOT EXISTS categorias (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_nome VARCHAR(50) NOT NULL UNIQUE,
    categoria_descricao VARCHAR(150)
  )`,
  `CREATE TABLE IF NOT EXISTS fabricantes (
    fabricante_id INT AUTO_INCREMENT PRIMARY KEY,
    fabricante_nome VARCHAR(50) NOT NULL UNIQUE,
    fabricante_cnpj VARCHAR(20) UNIQUE,
    fabricante_pais VARCHAR(50)
  )`,
  `CREATE TABLE IF NOT EXISTS pecas (
    peca_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    fabricante_id INT NOT NULL,
    peca_sku VARCHAR(30) NOT NULL UNIQUE,
    peca_nome VARCHAR(100) NOT NULL,
    peca_preco_venda DECIMAL(10,2) NOT NULL,
    peca_estoque_atual INT NOT NULL DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id) ON DELETE RESTRICT,
    FOREIGN KEY (fabricante_id) REFERENCES fabricantes(fabricante_id) ON DELETE RESTRICT
  )`,
  `CREATE TABLE IF NOT EXISTS fornecedores (
    fornecedor_id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_razao_social VARCHAR(100) NOT NULL,
    fornecedor_cnpj VARCHAR(20) NOT NULL UNIQUE,
    fornecedor_telefone VARCHAR(20),
    fornecedor_email VARCHAR(100)
  )`,
  `CREATE TABLE IF NOT EXISTS fornecedores_pecas (
    fornecedor_peca_id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT NOT NULL,
    peca_id INT NOT NULL,
    fornecedor_peca_preco_custo DECIMAL(10,2) NOT NULL,
    fornecedor_peca_prazo_entrega_dias INT DEFAULT 1,
    fornecedor_peca_codigo VARCHAR(50),
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(fornecedor_id) ON DELETE RESTRICT,
    FOREIGN KEY (peca_id) REFERENCES pecas(peca_id) ON DELETE RESTRICT,
    UNIQUE (fornecedor_id, peca_id)
  )`,
  `CREATE TABLE IF NOT EXISTS ordens_servico (
    os_id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_telefone VARCHAR(25),
    veiculo_placa VARCHAR(10) NOT NULL,
    veiculo_modelo VARCHAR(100) NOT NULL,
    problema TEXT NOT NULL,
    os_status ENUM('Aberta', 'Em andamento', 'Aguardando peças', 'Concluída', 'Cancelada') NOT NULL DEFAULT 'Aberta',
    valor_mao_obra DECIMAL(10,2) NOT NULL DEFAULT 0,
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
];

async function setupDatabase(pool) {
  for (const statement of schema) await pool.query(statement);

  const categorySeeds = [
    ['Sistema de Freios', 'Componentes utilizados no sistema de frenagem'],
    ['Filtros e Motor', 'Filtros e componentes relacionados ao motor'],
    ['Transmissao', 'Componentes utilizados em cambio e transmissao'],
    ['Suspensao', 'Componentes do sistema de suspensao']
  ];
  for (const row of categorySeeds) await pool.query('INSERT IGNORE INTO categorias (categoria_nome, categoria_descricao) VALUES (?, ?)', row);

  const makerSeeds = [
    ['Brembo', '11.111.111/0001-11', 'Italia'],
    ['Mahle', '22.222.222/0001-22', 'Alemanha'],
    ['Motul', '33.333.333/0001-33', 'Franca'],
    ['Cofap', '44.444.444/0001-44', 'Brasil']
  ];
  for (const row of makerSeeds) await pool.query('INSERT IGNORE INTO fabricantes (fabricante_nome, fabricante_cnpj, fabricante_pais) VALUES (?, ?, ?)', row);

  const supplierSeeds = [
    ['Distribuidora Auto Pecas Brasil LTDA', '55.555.555/0001-55', '(11) 98888-7777', 'vendas@autopecasbr.com'],
    ['Atacadao do Mecanico LTDA', '66.666.666/0001-66', '(19) 97777-6666', 'contato@atacadomecanico.com'],
    ['Pecas Express LTDA', '77.777.777/0001-77', '(14) 96666-5555', 'contato@pecasexpress.com']
  ];
  for (const row of supplierSeeds) await pool.query('INSERT IGNORE INTO fornecedores (fornecedor_razao_social, fornecedor_cnpj, fornecedor_telefone, fornecedor_email) VALUES (?, ?, ?, ?)', row);

  const [categories] = await pool.query('SELECT categoria_id, categoria_nome FROM categorias');
  const [makers] = await pool.query('SELECT fabricante_id, fabricante_nome FROM fabricantes');
  const categoryIds = new Map(categories.map(row => [row.categoria_nome, row.categoria_id]));
  const makerIds = new Map(makers.map(row => [row.fabricante_nome, row.fabricante_id]));
  const partSeeds = [
    ['Sistema de Freios', 'Brembo', 'PEC-101', 'Jogo de Pastilhas de Freio', 320, 15],
    ['Filtros e Motor', 'Mahle', 'PEC-102', 'Filtro de Oleo do Motor', 55, 40],
    ['Transmissao', 'Motul', 'PEC-103', 'Fluido de Cambio Automatico 1L', 145, 20],
    ['Suspensao', 'Cofap', 'PEC-104', 'Amortecedor Dianteiro', 410, 8]
  ];
  for (const [category, maker, sku, name, price, stock] of partSeeds) {
    await pool.query('INSERT IGNORE INTO pecas (categoria_id, fabricante_id, peca_sku, peca_nome, peca_preco_venda, peca_estoque_atual) VALUES (?, ?, ?, ?, ?, ?)', [categoryIds.get(category), makerIds.get(maker), sku, name, price, stock]);
  }

  const [suppliers] = await pool.query('SELECT fornecedor_id, fornecedor_cnpj FROM fornecedores');
  const [parts] = await pool.query('SELECT peca_id, peca_sku FROM pecas');
  const supplierIds = new Map(suppliers.map(row => [row.fornecedor_cnpj, row.fornecedor_id]));
  const partIds = new Map(parts.map(row => [row.peca_sku, row.peca_id]));
  const linkSeeds = [
    ['55.555.555/0001-55', 'PEC-101', 210, 2, 'BR-001'], ['66.666.666/0001-66', 'PEC-101', 198, 5, 'AT-120'], ['77.777.777/0001-77', 'PEC-101', 205, 3, 'PE-501'],
    ['55.555.555/0001-55', 'PEC-102', 30, 1, 'BR-002'], ['66.666.666/0001-66', 'PEC-102', 32, 2, 'AT-121'],
    ['55.555.555/0001-55', 'PEC-103', 100, 2, 'BR-003'], ['77.777.777/0001-77', 'PEC-103', 95, 4, 'PE-503'],
    ['66.666.666/0001-66', 'PEC-104', 285, 3, 'AT-124'], ['77.777.777/0001-77', 'PEC-104', 275, 5, 'PE-504']
  ];
  for (const [cnpj, sku, cost, days, code] of linkSeeds) {
    await pool.query('INSERT IGNORE INTO fornecedores_pecas (fornecedor_id, peca_id, fornecedor_peca_preco_custo, fornecedor_peca_prazo_entrega_dias, fornecedor_peca_codigo) VALUES (?, ?, ?, ?, ?)', [supplierIds.get(cnpj), partIds.get(sku), cost, days, code]);
  }
}

module.exports = setupDatabase;
