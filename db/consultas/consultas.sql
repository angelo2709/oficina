-- Consultas do projeto de oficina

-- CONSULTA 1
-- LISTAR PECAS COM CATEGORIA E FABRICANTE
-- ============================================================

SELECT
    p.peca_id,
    p.peca_nome,
    p.peca_sku,
    c.categoria_nome AS categoria,
    f.fabricante_nome AS fabricante,
    p.peca_preco_venda,
    p.peca_estoque_atual

FROM pecas p

JOIN categorias c
    ON p.categoria_id = c.categoria_id

JOIN fabricantes f
    ON p.fabricante_id = f.fabricante_id;


-- ============================================================
-- CONSULTA 2
-- FORNECEDORES DE CADA PECA
-- ============================================================

SELECT
    p.peca_nome AS peca,
    f.fornecedor_razao_social AS fornecedor,
    fp.fornecedor_peca_preco_custo AS preco_custo,
    fp.fornecedor_peca_prazo_entrega_dias AS prazo_entrega

FROM fornecedores_pecas fp

JOIN fornecedores f
    ON fp.fornecedor_id = f.fornecedor_id

JOIN pecas p
    ON fp.peca_id = p.peca_id

ORDER BY
    p.peca_nome,
    fp.fornecedor_peca_preco_custo;


-- ============================================================
-- CONSULTA 3
-- PECAS FORNECIDAS POR UM DETERMINADO FORNECEDOR
-- ============================================================

SELECT
    f.fornecedor_razao_social AS fornecedor,
    p.peca_nome AS peca,
    fp.fornecedor_peca_preco_custo AS preco_custo

FROM fornecedores_pecas fp

JOIN fornecedores f
    ON fp.fornecedor_id = f.fornecedor_id

JOIN pecas p
    ON fp.peca_id = p.peca_id

WHERE f.fornecedor_id = 1;


-- ============================================================
-- CONSULTA 4
-- COMPARAR PRECO DE CUSTO E PRECO DE VENDA
-- ============================================================

SELECT
    p.peca_nome AS peca,
    f.fornecedor_razao_social AS fornecedor,
    fp.fornecedor_peca_preco_custo AS preco_custo,
    p.peca_preco_venda AS preco_venda,

    (
        p.peca_preco_venda -
        fp.fornecedor_peca_preco_custo
    ) AS diferenca

FROM fornecedores_pecas fp

JOIN fornecedores f
    ON fp.fornecedor_id = f.fornecedor_id

JOIN pecas p
    ON fp.peca_id = p.peca_id

ORDER BY
    p.peca_nome,
    fp.fornecedor_peca_preco_custo;
