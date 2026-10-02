import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  PageHeader,
  Card,
  Button,
  money,
} from "../components/UI";

const tiposRelatorio = {
  vendas: "Valor de Vendas",
  contas_receber: "Contas a Receber",
  produtos: "Produtos Mais Vendidos",
  credito_aluno: "Crédito dos Alunos",
  fiado: "Vendas no Fiado",
};

const periodos = {
  dia: "Diário",
  semanal: "Semanal",
  quinzenal: "15 em 15 dias",
  semestral: "Semestral",
  anual: "Anual",
};

function converterData(valor) {
  if (!valor) {
    return null;
  }

  if (valor.includes("/")) {
    const [dia, mes, ano] = valor.split("/");
    return new Date(`${ano}-${mes}-${dia}T12:00:00`);
  }

  return new Date(valor);
}

function obterDataInicial(periodo) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "dia") {
    return inicio;
  }

  if (periodo === "semanal") {
    inicio.setDate(inicio.getDate() - 7);
  }

  if (periodo === "quinzenal") {
    inicio.setDate(inicio.getDate() - 15);
  }

  if (periodo === "semestral") {
    inicio.setMonth(inicio.getMonth() - 6);
  }

  if (periodo === "anual") {
    inicio.setFullYear(inicio.getFullYear() - 1);
  }

  return inicio;
}

function formatarData(valor) {
  const data = converterData(valor);

  if (!data || Number.isNaN(data.getTime())) {
    return "—";
  }

  return data.toLocaleDateString("pt-BR");
}

function estaNoPeriodo(valorData, periodo) {
  const data = converterData(valorData);

  if (!data || Number.isNaN(data.getTime())) {
    return false;
  }

  return data >= obterDataInicial(periodo);
}

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] =
    useState("vendas");

  const [periodo, setPeriodo] = useState("semanal");
  const [relatorio, setRelatorio] = useState(null);
  const [mensagem, setMensagem] = useState("");

  function mostrarMensagem(texto) {
    setMensagem(texto);

    setTimeout(() => {
      setMensagem("");
    }, 3000);
  }

  function carregarDados() {
    return {
      vendas:
        JSON.parse(localStorage.getItem("vendas")) || [],

      clientes:
        JSON.parse(localStorage.getItem("clientes")) || [],

      movimentacoes:
        JSON.parse(
          localStorage.getItem("movimentacoesCredito")
        ) || [],
    };
  }

  function gerarRelatorio() {
    const { vendas, clientes, movimentacoes } =
      carregarDados();

    const vendasPeriodo = vendas.filter((venda) =>
      estaNoPeriodo(venda.dataVenda, periodo)
    );

    const movimentacoesPeriodo = movimentacoes.filter(
      (movimentacao) =>
        estaNoPeriodo(movimentacao.data, periodo)
    );

    let colunas = [];
    let linhas = [];
    let dadosExcel = [];

    if (tipoRelatorio === "vendas") {
      colunas = [
        "Data",
        "Cliente",
        "Pagamento",
        "Itens",
        "Total",
      ];

      dadosExcel = vendasPeriodo.map((venda) => ({
        Data: formatarData(venda.dataVenda),
        Cliente:
          venda.cliente?.nome ||
          venda.cliente ||
          "Não informado",
        Pagamento:
          venda.formaPagamento || "Não informado",
        Itens: venda.produtos?.length || 0,
        Total: Number(venda.total || 0),
      }));

      linhas = dadosExcel.map((item) => [
        item.Data,
        item.Cliente,
        item.Pagamento,
        item.Itens,
        money(item.Total),
      ]);
    }

    if (tipoRelatorio === "contas_receber") {
      const contas = vendasPeriodo.filter(
        (venda) =>
          ["conta_receber", "fiado"].includes(
            venda.formaPagamento
          ) && venda.status !== "pago"
      );

      colunas = [
        "Data",
        "Cliente",
        "Descrição",
        "Vencimento",
        "Valor",
      ];

      dadosExcel = contas.map((venda) => ({
        Data: formatarData(venda.dataVenda),
        Cliente:
          venda.cliente?.nome ||
          venda.cliente ||
          "Não informado",
        Descrição: "Venda pendente",
        Vencimento: formatarData(venda.vencimento),
        Valor: Number(venda.total || 0),
      }));

      linhas = dadosExcel.map((item) => [
        item.Data,
        item.Cliente,
        item.Descrição,
        item.Vencimento,
        money(item.Valor),
      ]);
    }

    if (tipoRelatorio === "produtos") {
      const produtosAgrupados = {};

      vendasPeriodo.forEach((venda) => {
        venda.produtos?.forEach((produto) => {
          const nome = produto.nome || produto[0];
          const valor = Number(
            produto.valor ?? produto[1] ?? 0
          );

          const quantidade = Number(
            produto.quantidade || 1
          );

          if (!produtosAgrupados[nome]) {
            produtosAgrupados[nome] = {
              nome,
              quantidade: 0,
              total: 0,
            };
          }

          produtosAgrupados[nome].quantidade +=
            quantidade;

          produtosAgrupados[nome].total +=
            valor * quantidade;
        });
      });

      dadosExcel = Object.values(produtosAgrupados)
        .sort((a, b) => b.quantidade - a.quantidade)
        .map((produto) => ({
          Produto: produto.nome,
          "Quantidade Vendida": produto.quantidade,
          "Valor Total": produto.total,
        }));

      colunas = [
        "Produto",
        "Quantidade Vendida",
        "Valor Total",
      ];

      linhas = dadosExcel.map((produto) => [
        produto.Produto,
        produto["Quantidade Vendida"],
        money(produto["Valor Total"]),
      ]);
    }

    if (tipoRelatorio === "credito_aluno") {
      const alunos = clientes.filter(
        (cliente) => cliente.tipoCliente === "aluno"
      );

      colunas = [
        "Aluno",
        "RA",
        "Responsável",
        "Telefone",
        "Saldo",
      ];

      dadosExcel = alunos.map((aluno) => ({
        Aluno: aluno.nome,
        RA: aluno.ra || "Não informado",
        Responsável:
          aluno.responsavel || "Não informado",
        Telefone: aluno.telefone || "Não informado",
        Saldo: Number(aluno.credito || 0),
      }));

      linhas = dadosExcel.map((aluno) => [
        aluno.Aluno,
        aluno.RA,
        aluno.Responsável,
        aluno.Telefone,
        money(aluno.Saldo),
      ]);
    }

    if (tipoRelatorio === "fiado") {
      const vendasFiado = vendasPeriodo.filter(
        (venda) => venda.formaPagamento === "fiado"
      );

      colunas = [
        "Data",
        "Cliente",
        "Status",
        "Vencimento",
        "Valor",
      ];

      dadosExcel = vendasFiado.map((venda) => ({
        Data: formatarData(venda.dataVenda),
        Cliente:
          venda.cliente?.nome ||
          venda.cliente ||
          "Não informado",
        Status:
          venda.status === "pago"
            ? "Pago"
            : "Pendente",
        Vencimento: formatarData(venda.vencimento),
        Valor: Number(venda.total || 0),
      }));

      linhas = dadosExcel.map((venda) => [
        venda.Data,
        venda.Cliente,
        venda.Status,
        venda.Vencimento,
        money(venda.Valor),
      ]);
    }

    const totalVendas = vendasPeriodo.reduce(
      (soma, venda) =>
        soma + Number(venda.total || 0),
      0
    );

    const totalItens = vendasPeriodo.reduce(
      (soma, venda) =>
        soma +
        (venda.produtos?.reduce(
          (subtotal, produto) =>
            subtotal +
            Number(produto.quantidade || 1),
          0
        ) || 0),
      0
    );

    const alunosAtendidos = new Set(
      vendasPeriodo.map(
        (venda) =>
          venda.clienteId ||
          venda.cliente?.id ||
          venda.cliente
      )
    ).size;

    const ticketMedio =
      vendasPeriodo.length > 0
        ? totalVendas / vendasPeriodo.length
        : 0;

    setRelatorio({
      titulo: tiposRelatorio[tipoRelatorio],
      periodo: periodos[periodo],
      colunas,
      linhas,
      dadosExcel,
      totalVendas,
      totalItens,
      alunosAtendidos,
      ticketMedio,
      totalMovimentacoes:
        movimentacoesPeriodo.length,
    });

    mostrarMensagem("Relatório gerado com sucesso!");
  }

  function exportarPDF() {
    if (!relatorio) {
      mostrarMensagem(
        "Gere o relatório antes de exportar."
      );
      return;
    }

    const documento = new jsPDF({
      orientation: "landscape",
    });

    documento.setFontSize(18);
    documento.text(
      `FoodControl - ${relatorio.titulo}`,
      14,
      18
    );

    documento.setFontSize(11);
    documento.text(
      `Período: ${relatorio.periodo}`,
      14,
      27
    );

    documento.text(
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      14,
      34
    );

    autoTable(documento, {
      startY: 42,
      head: [relatorio.colunas],
      body: relatorio.linhas,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [84, 36, 238],
      },
    });

    documento.save(
      `relatorio-${tipoRelatorio}-${periodo}.pdf`
    );
  }

  function exportarExcel() {
    if (!relatorio) {
      mostrarMensagem(
        "Gere o relatório antes de exportar."
      );
      return;
    }

    if (relatorio.dadosExcel.length === 0) {
      mostrarMensagem(
        "O relatório não possui dados para exportar."
      );
      return;
    }

    const planilha = XLSX.utils.json_to_sheet(
      relatorio.dadosExcel
    );

    const arquivo = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      arquivo,
      planilha,
      "Relatório"
    );

    XLSX.writeFile(
      arquivo,
      `relatorio-${tipoRelatorio}-${periodo}.xlsx`
    );
  }

  const alturasGrafico = relatorio
    ? relatorio.linhas
        .slice(0, 9)
        .map((_, indice) => {
          const alturas = [
            28, 42, 65, 35, 82, 48, 70, 45, 86,
          ];

          return alturas[indice];
        })
    : [28, 42, 65, 35, 82, 48, 70, 45, 86];

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Acompanhe o desempenho da cantina."
        action={
          <Button
            type="button"
            onClick={gerarRelatorio}
          >
            Gerar Relatório
          </Button>
        }
      />

      {mensagem && (
        <div className="form-message success">
          {mensagem}
        </div>
      )}

      <Card>
        <h2>Configuração do Relatório</h2>

        <div className="report-filters">
          <label className="field">
            Tipo de relatório

            <select
              value={tipoRelatorio}
              onChange={(event) =>
                setTipoRelatorio(event.target.value)
              }
            >
              <option value="vendas">
                Valor de Vendas
              </option>

              <option value="contas_receber">
                Contas a Receber
              </option>

              <option value="produtos">
                Produtos Mais Vendidos
              </option>

              <option value="credito_aluno">
                Crédito dos Alunos
              </option>

              <option value="fiado">
                Fiado
              </option>
            </select>
          </label>

          <label className="field">
            Período

            <select
              value={periodo}
              onChange={(event) =>
                setPeriodo(event.target.value)
              }
            >
              <option value="dia">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">
                15 em 15 dias
              </option>
              <option value="semestral">
                Semestral
              </option>
              <option value="anual">Anual</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="stats">
        <Card>
          <small>Total de Vendas</small>

          <strong>
            {money(relatorio?.totalVendas || 0)}
          </strong>
        </Card>

        <Card>
          <small>Total de Itens</small>

          <strong>{relatorio?.totalItens || 0}</strong>
        </Card>

        <Card>
          <small>Alunos Atendidos</small>

          <strong>
            {relatorio?.alunosAtendidos || 0}
          </strong>
        </Card>

        <Card>
          <small>Ticket Médio</small>

          <strong>
            {money(relatorio?.ticketMedio || 0)}
          </strong>
        </Card>
      </div>

      <div className="report-grid">
        <Card>
          <h2>
            {relatorio
              ? `${relatorio.titulo} — ${relatorio.periodo}`
              : "Vendas por Dia"}
          </h2>

          <div className="chart">
            {alturasGrafico.map((altura, indice) => (
              <i
                key={indice}
                style={{ height: `${altura}%` }}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2>Vendas por Categoria</h2>

          <div className="donut"></div>

          <div className="legend">
            ● Salgados 38% &nbsp; ● Bebidas 27%
            <br />
            ● Doces 18% &nbsp; ● Lanches 12%
          </div>
        </Card>
      </div>

      {relatorio && (
        <Card>
          <h2>
            Resultado: {relatorio.titulo}
          </h2>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {relatorio.colunas.map((coluna) => (
                    <th key={coluna}>{coluna}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {relatorio.linhas.map(
                  (linha, indiceLinha) => (
                    <tr key={indiceLinha}>
                      {linha.map(
                        (valor, indiceColuna) => (
                          <td key={indiceColuna}>
                            {valor}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )}

                {relatorio.linhas.length === 0 && (
                  <tr>
                    <td
                      colSpan={relatorio.colunas.length}
                      className="empty-table"
                    >
                      Nenhum registro encontrado no período
                      selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="actions left">
        <Button
          secondary
          type="button"
          onClick={exportarPDF}
        >
          Exportar PDF
        </Button>

        <Button
          secondary
          type="button"
          onClick={exportarExcel}
        >
          Exportar Excel
        </Button>
      </div>
    </>
  );
}