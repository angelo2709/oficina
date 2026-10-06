-- Estrutura do banco de dados oficina

CREATE TABLE categorias (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_nome VARCHAR(50) NOT NULL UNIQUE,
    categoria_descricao VARCHAR(150)
);

CREATE TABLE fabricantes (
    fabricante_id INT AUTO_INCREMENT PRIMARY KEY,
    fabricante_nome VARCHAR(50) NOT NULL UNIQUE,
    fabricante_cnpj VARCHAR(20) UNIQUE,
    fabricante_pais VARCHAR(50)
);

CREATE TABLE pecas (
    peca_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    fabricante_id INT NOT NULL,
    peca_sku VARCHAR(30) NOT NULL UNIQUE,
    peca_nome VARCHAR(100) NOT NULL,
    peca_preco_venda DECIMAL(10,2) NOT NULL,
    peca_estoque_atual INT NOT NULL DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(categoria_id) ON DELETE RESTRICT,
    FOREIGN KEY (fabricante_id) REFERENCES fabricantes(fabricante_id) ON DELETE RESTRICT
);

CREATE TABLE fornecedores (
    fornecedor_id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_razao_social VARCHAR(100) NOT NULL,
    fornecedor_cnpj VARCHAR(20) NOT NULL UNIQUE,
    fornecedor_telefone VARCHAR(20),
    fornecedor_email VARCHAR(100)
);

CREATE TABLE fornecedores_pecas (
    fornecedor_peca_id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor_id INT NOT NULL,
    peca_id INT NOT NULL,
    fornecedor_peca_preco_custo DECIMAL(10,2) NOT NULL,
    fornecedor_peca_prazo_entrega_dias INT DEFAULT 1,
    fornecedor_peca_codigo VARCHAR(50),
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(fornecedor_id) ON DELETE RESTRICT,
    FOREIGN KEY (peca_id) REFERENCES pecas(peca_id) ON DELETE RESTRICT,
    UNIQUE (fornecedor_id, peca_id)
);

-- Cada OS guarda os dados do cliente e do veículo no momento da abertura.
CREATE TABLE ordens_servico (
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
);
