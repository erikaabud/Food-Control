const { pool } = require('../config/db');

module.exports = {
  // ==========================================
  // RESUMO GERAL DE VENDAS
  // ==========================================
  async resumoVendas(inicio, fim) {
    const sql = `
      SELECT 
        COUNT(DISTINCT v.id_venda) AS total_vendas,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS faturamento_total,
        COALESCE(
          SUM(iv.quantidade * iv.valor_unitario) / NULLIF(COUNT(DISTINCT v.id_venda), 0), 
          0
        ) AS ticket_medio
      FROM Venda v
      LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND v.status = 'Concluída'
    `;
    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows[0];
  },

  // ==========================================
  // VENDAS POR DIA
  // ==========================================
  async vendasPorDia(inicio, fim) {
    const sql = `
      SELECT 
        DATE(v.data_venda) AS dia,
        COUNT(DISTINCT v.id_venda) AS total_vendas,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS faturamento
      FROM Venda v
      LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND v.status = 'Concluída'
      GROUP BY DATE(v.data_venda)
      ORDER BY dia DESC
    `;
    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows;
  },

  // ==========================================
  // PRODUTOS MAIS VENDIDOS
  // ==========================================
  async produtosMaisVendidos(limite) {
    const sql = `
      SELECT 
        p.id_produto,
        p.nome_produto,
        SUM(iv.quantidade) AS quantidade_vendida,
        SUM(iv.quantidade * iv.valor_unitario) AS receita
      FROM Item_venda iv
      JOIN Produto p ON p.id_produto = iv.id_produto
      JOIN Venda v ON v.id_venda = iv.id_venda
      WHERE v.status = 'Concluída'
      GROUP BY p.id_produto, p.nome_produto
      ORDER BY quantidade_vendida DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [limite]);
    return rows;
  },

  // ==========================================
  // FORMAS DE PAGAMENTO
  // ==========================================
  async formasPagamento(inicio, fim) {
    const sql = `
      SELECT 
        fp.nome_forma AS forma_pagamento,
        COUNT(p.id_pagamento) AS quantidade,
        COALESCE(SUM(p.valor), 0) AS valor_total
      FROM Pagamento p
      JOIN Forma_pagamento fp ON fp.id_forma_pagamento = p.id_forma_pagamento
      JOIN Venda v ON v.id_venda = p.id_venda
      WHERE DATE(v.data_venda) BETWEEN ? AND ?
        AND p.status = 'Confirmado'
      GROUP BY fp.nome_forma
      ORDER BY valor_total DESC
    `;
    const [rows] = await pool.query(sql, [inicio, fim]);
    return rows;
  },

  // ==========================================
  // ESTOQUE BAIXO
  // ==========================================
  async estoqueBaixo(minimo) {
    const sql = `
      SELECT 
        p.id_produto AS id,
        p.nome_produto AS nome,
        e.quantidade,
        e.estoque_minimo,
        p.valor_unitario AS preco
      FROM Estoque e
      JOIN Produto p ON p.id_produto = e.id_produto
      WHERE e.quantidade <= ?
      ORDER BY e.quantidade ASC
    `;
    const [rows] = await pool.query(sql, [minimo]);
    return rows;
  },

  // ==========================================
  // DASHBOARD
  // ==========================================
  async dashboard() {
    const hoje = new Date().toISOString().split('T')[0];

    const [vendasHoje] = await pool.query(`
      SELECT 
        COUNT(DISTINCT v.id_venda) AS quantidade,
        COALESCE(SUM(iv.quantidade * iv.valor_unitario), 0) AS total
      FROM Venda v
      LEFT JOIN Item_venda iv ON iv.id_venda = v.id_venda
      WHERE DATE(v.data_venda) = ?
        AND v.status = 'Concluída'
    `, [hoje]);

    const [produtos] = await pool.query('SELECT COUNT(*) AS total FROM Produto WHERE ativo = TRUE');
    const [clientes] = await pool.query('SELECT COUNT(*) AS total FROM Cliente WHERE ativo = TRUE');
    const [estoque] = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM Estoque 
      WHERE quantidade <= estoque_minimo
    `);

    return {
      vendasHoje: {
        quantidade: Number(vendasHoje[0].quantidade),
        total: Number(vendasHoje[0].total)
      },
      totalProdutos: Number(produtos[0].total),
      totalClientes: Number(clientes[0].total),
      produtosEstoqueBaixo: Number(estoque[0].total)
    };
  }
};