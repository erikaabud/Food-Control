const relatorioInfrastructure = require('../infrastructure/relatorioInfrastructure');

module.exports = {
  async vendasPorPeriodo(inicio, fim) {
    if (!inicio || !fim) throw new Error('Informe as datas de início e fim');

    const resumo = await relatorioInfrastructure.resumoVendas(inicio, fim);
    const porDia = await relatorioInfrastructure.vendasPorDia(inicio, fim);

    return { resumo, porDia };
  },

  async produtosMaisVendidos(limite) {
    return relatorioInfrastructure.produtosMaisVendidos(limite);
  },

  async formasPagamento(inicio, fim) {
    return relatorioInfrastructure.formasPagamento(inicio, fim);
  },

  async estoqueBaixo(minimo) {
    return relatorioInfrastructure.estoqueBaixo(minimo);
  },

  async dashboard() {
    return relatorioInfrastructure.dashboard();
  }
};