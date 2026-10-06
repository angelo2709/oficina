-- Dados de exemplo para praticar

-- DADOS: CATEGORIAS
-- ============================================================

INSERT INTO categorias (
    categoria_nome,
    categoria_descricao
) VALUES
('Sistema de Freios', 'Componentes utilizados no sistema de frenagem'),
('Filtros e Motor', 'Filtros e componentes relacionados ao motor'),
('Transmissao', 'Componentes utilizados em cambio e transmissao'),
('Suspensao', 'Componentes do sistema de suspensao');


-- ============================================================
-- DADOS: FABRICANTES
-- ============================================================

INSERT INTO fabricantes (
    fabricante_nome,
    fabricante_cnpj,
    fabricante_pais
) VALUES
('Brembo', '11.111.111/0001-11', 'Italia'),
('Mahle', '22.222.222/0001-22', 'Alemanha'),
('Motul', '33.333.333/0001-33', 'Franca'),
('Cofap', '44.444.444/0001-44', 'Brasil');


-- ============================================================
-- DADOS: PECAS
-- ============================================================

INSERT INTO pecas (
    categoria_id,
    fabricante_id,
    peca_sku,
    peca_nome,
    peca_preco_venda,
    peca_estoque_atual
) VALUES
(1, 1, 'PEC-101', 'Jogo de Pastilhas de Freio', 320.00, 15),
(2, 2, 'PEC-102', 'Filtro de Oleo do Motor', 55.00, 40),
(3, 3, 'PEC-103', 'Fluido de Cambio Automatico 1L', 145.00, 20),
(4, 4, 'PEC-104', 'Amortecedor Dianteiro', 410.00, 8);


-- ============================================================
-- DADOS: FORNECEDORES
-- ============================================================

INSERT INTO fornecedores (
    fornecedor_razao_social,
    fornecedor_cnpj,
    fornecedor_telefone,
    fornecedor_email
) VALUES
(
    'Distribuidora Auto Pecas Brasil LTDA',
    '55.555.555/0001-55',
    '(11) 98888-7777',
    'vendas@autopecasbr.com'
),
(
    'Atacadao do Mecanico LTDA',
    '66.666.666/0001-66',
    '(19) 97777-6666',
    'contato@atacadomecanico.com'
),
(
    'Pecas Express LTDA',
    '77.777.777/0001-77',
    '(14) 96666-5555',
    'contato@pecasexpress.com'
);


-- ============================================================
-- DADOS: FORNECEDORES X PECAS
-- ============================================================

INSERT INTO fornecedores_pecas (
    fornecedor_id,
    peca_id,
    fornecedor_peca_preco_custo,
    fornecedor_peca_prazo_entrega_dias,
    fornecedor_peca_codigo
) VALUES
(1, 1, 210.00, 2, 'BR-001'),
(2, 1, 198.00, 5, 'AT-120'),
(3, 1, 205.00, 3, 'PE-501'),

(1, 2, 30.00, 1, 'BR-002'),
(2, 2, 32.00, 2, 'AT-121'),

(1, 3, 100.00, 2, 'BR-003'),
(3, 3, 95.00, 4, 'PE-503'),

(2, 4, 285.00, 3, 'AT-124'),
(3, 4, 275.00, 5, 'PE-504');


-- ============================================================
