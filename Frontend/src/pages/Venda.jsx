import { useEffect, useState } from "react";

import {
  PageHeader,
  Card,
  Button,
  money,
} from "../components/UI";

import ModalAviso from "../components/ModalAviso";

export default function Venda() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [pesquisaCliente, setPesquisaCliente] = useState("");
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const [modal, setModal] = useState({
    aberto: false,
    tipo: "sucesso",
    titulo: "",
    mensagem: "",
  });

  useEffect(() => {
    const clientesSalvos =
      JSON.parse(localStorage.getItem("clientes")) || [];

    setClientes(clientesSalvos);

    async function buscarProdutos() {
      try {
        const resposta = await fetch(
          "http://localhost:3000/produtos"
        );

        if (!resposta.ok) {
          throw new Error("Erro ao carregar produtos");
        }

        const dados = await resposta.json();

        const produtosAtivos = dados
          .filter((produto) => Number(produto.ativo) === 1)
          .map((produto) => [
            produto.nome_produto,
            Number(produto.valor_unitario),
            produto.id_produto,
            Number(produto.quantidade),
          ]);

        setProducts(produtosAtivos);
      } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
      }
    }

    buscarProdutos();
  }, []);

  const total = cart.reduce(
    (soma, produto) => soma + produto[1],
    0
  );

  const clientesFiltrados = clientes.filter(
    (cliente) => {
      const pesquisa = pesquisaCliente
        .toLowerCase()
        .trim();

      if (!pesquisa) {
        return false;
      }

      const nome = String(
        cliente.nome || ""
      ).toLowerCase();

      const ra = String(
        cliente.ra || ""
      ).toLowerCase();

      const telefone = String(
        cliente.telefone || ""
      ).toLowerCase();

      const tipoCliente = String(
        cliente.tipoCliente || ""
      ).toLowerCase();

      return (
        nome.includes(pesquisa) ||
        ra.includes(pesquisa) ||
        telefone.includes(pesquisa) ||
        tipoCliente.includes(pesquisa)
      );
    }
  );

  const produtosFiltrados = products.filter(
    (produto) =>
      produto[0]
        .toLowerCase()
        .includes(
          pesquisaProduto.toLowerCase().trim()
        )
  );

  function mostrarAviso(
    mensagem,
    tipo,
    titulo
  ) {
    setModal({
      aberto: true,
      tipo: tipo || "sucesso",
      titulo: titulo || "",
      mensagem,
    });
  }

  function fecharAviso() {
    setModal((estadoAtual) => ({
      ...estadoAtual,
      aberto: false,
    }));
  }

  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente);
    setPesquisaCliente("");
  }

  function removerCliente() {
    setClienteSelecionado(null);
    setFormaPagamento("");
  }

  function adicionarProduto(produto) {
    if (produto[3] <= 0) {
      mostrarAviso(
        "Este produto está sem estoque.",
        "aviso",
        "Produto sem estoque"
      );

      return;
    }

    const quantidadeNoCarrinho =
      cart.filter(
        (item) => item[2] === produto[2]
      ).length;

    if (quantidadeNoCarrinho >= produto[3]) {
      mostrarAviso(
        "Não há mais unidades disponíveis deste produto.",
        "aviso",
        "Estoque insuficiente"
      );

      return;
    }

    setCart((carrinhoAtual) => [
      ...carrinhoAtual,
      produto,
    ]);
  }

  function removerProduto(indice) {
    setCart((carrinhoAtual) =>
      carrinhoAtual.filter(
        (produto, indiceProduto) =>
          indiceProduto !== indice
      )
    );
  }

  function limparVenda() {
    setCart([]);
    setFormaPagamento("");
  }

  function finalizarVenda() {
    if (!clienteSelecionado) {
      mostrarAviso(
        "Selecione um cliente antes de finalizar a venda.",
        "aviso",
        "Cliente não selecionado"
      );

      return;
    }

    if (cart.length === 0) {
      mostrarAviso(
        "Adicione pelo menos um produto antes de finalizar a venda.",
        "aviso",
        "Nenhum produto adicionado"
      );

      return;
    }

    if (!formaPagamento) {
      mostrarAviso(
        "Selecione uma forma de pagamento.",
        "aviso",
        "Forma de pagamento"
      );

      return;
    }

    const creditoDisponivel = Number(
      clienteSelecionado.credito || 0
    );

    if (
      formaPagamento === "credito_aluno" &&
      clienteSelecionado.tipoCliente !== "aluno"
    ) {
      mostrarAviso(
        "O pagamento com saldo está disponível somente para alunos.",
        "erro",
        "Pagamento não permitido"
      );

      return;
    }

    if (
      formaPagamento === "credito_aluno" &&
      total > creditoDisponivel
    ) {
      mostrarAviso(
        "O aluno não possui crédito suficiente.",
        "erro",
        "Saldo insuficiente"
      );

      return;
    }

    const vendasSalvas =
      JSON.parse(localStorage.getItem("vendas")) || [];

    const novaVenda = {
      id: Date.now(),
      clienteId: clienteSelecionado.id,
      cliente: clienteSelecionado.nome,
      ra: clienteSelecionado.ra || "",
      produtos: cart.map((produto) => ({
        id_produto: produto[2],
        nome: produto[0],
        valor: produto[1],
        quantidade: 1,
      })),
      formaPagamento,
      total,
      dataVenda: new Date().toISOString(),
    };

    localStorage.setItem(
      "vendas",
      JSON.stringify([
        ...vendasSalvas,
        novaVenda,
      ])
    );

    if (formaPagamento === "credito_aluno") {
      const clientesAtualizados = clientes.map(
        (cliente) => {
          if (
            cliente.id ===
            clienteSelecionado.id
          ) {
            return {
              ...cliente,
              credito:
                Number(cliente.credito || 0) -
                total,
            };
          }

          return cliente;
        }
      );

      localStorage.setItem(
        "clientes",
        JSON.stringify(clientesAtualizados)
      );

      setClientes(clientesAtualizados);

      setClienteSelecionado(
        (clienteAtual) => ({
          ...clienteAtual,
          credito:
            Number(
              clienteAtual.credito || 0
            ) - total,
        })
      );
    }

    const totalFinal = total;

setCart([]);
setClienteSelecionado(null);
setPesquisaCliente("");
setPesquisaProduto("");
setFormaPagamento("");

mostrarAviso(
  `Venda finalizada com sucesso! Total: ${money(
    totalFinal
  )}`,
  "sucesso",
  "Venda realizada!"
);
  }

  return (
    <>
      <PageHeader
        title="Venda"
        subtitle="Selecione o cliente, adicione os produtos e finalize a venda."
      />

      <div className="two-col">
        <Card>
          <h2>Selecionar Cliente</h2>

          <input
            type="search"
            value={pesquisaCliente}
            onChange={(event) =>
              setPesquisaCliente(
                event.target.value
              )
            }
            placeholder="Digite o nome, RA ou telefone..."
          />

          {pesquisaCliente.trim() !== "" && (
            <div className="client-results">
              {clientesFiltrados.map(
                (cliente) => (
                  <button
                    type="button"
                    className="student-result"
                    key={cliente.id}
                    onClick={() =>
                      selecionarCliente(cliente)
                    }
                  >
                    <div className="avatar big">
                      {String(
                        cliente.nome || ""
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <b>{cliente.nome}</b>

                      <small>
                        {cliente.tipoCliente ===
                        "aluno"
                          ? `RA: ${
                              cliente.ra ||
                              "Não informado"
                            }`
                          : `Tipo: ${
                              cliente.tipoCliente ||
                              "Não informado"
                            }`}
                      </small>

                      {cliente.tipoCliente ===
                        "aluno" && (
                        <em>
                          Crédito disponível:{" "}
                          {money(
                            Number(
                              cliente.credito ||
                                0
                            )
                          )}
                        </em>
                      )}
                    </div>
                  </button>
                )
              )}

              {clientesFiltrados.length ===
                0 && (
                <p className="empty-result">
                  Nenhum cliente encontrado.
                </p>
              )}
            </div>
          )}

          {clienteSelecionado && (
            <div className="student-mini selected-client">
              <div className="avatar big">
                {String(
                  clienteSelecionado.nome || ""
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <b>
                  {clienteSelecionado.nome}
                </b>

                <small>
                  {clienteSelecionado.tipoCliente ===
                  "aluno"
                    ? `RA: ${
                        clienteSelecionado.ra ||
                        "Não informado"
                      }`
                    : `Tipo: ${
                        clienteSelecionado.tipoCliente ||
                        "Não informado"
                      }`}
                </small>

                {clienteSelecionado.tipoCliente ===
                  "aluno" && (
                  <em>
                    Crédito disponível:{" "}
                    {money(
                      Number(
                        clienteSelecionado.credito ||
                          0
                      )
                    )}
                  </em>
                )}
              </div>

              <button
                type="button"
                className="remove-client"
                title="Remover cliente"
                onClick={removerCliente}
              >
                ×
              </button>
            </div>
          )}

          <h2>Pesquisar Produto</h2>

          <input
            type="search"
            value={pesquisaProduto}
            onChange={(event) =>
              setPesquisaProduto(
                event.target.value
              )
            }
            placeholder="Pesquisar produto..."
          />

          <table>
            <tbody>
              {produtosFiltrados.map(
                (produto) => (
                  <tr key={produto[2]}>
                    <td>{produto[0]}</td>

                    <td>
                      {money(produto[1])}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() =>
                          adicionarProduto(
                            produto
                          )
                        }
                      >
                        +
                      </button>
                    </td>
                  </tr>
                )
              )}

              {produtosFiltrados.length ===
                0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="empty-table"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="row-between">
            <h2>Itens da Venda</h2>

            <button
              type="button"
              className="link"
              onClick={limparVenda}
            >
              Limpar
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {cart.map(
                (produto, indice) => (
                  <tr key={indice}>
                    <td>{produto[0]}</td>
                    <td>1</td>

                    <td>
                      {money(produto[1])}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="trash"
                        onClick={() =>
                          removerProduto(indice)
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              )}

              {cart.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="empty-table"
                  >
                    Nenhum produto adicionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="checkout">
            <div className="row-between">
              <b>Total da Venda</b>
              <strong>{money(total)}</strong>
            </div>

            <select
              value={formaPagamento}
              onChange={(event) =>
                setFormaPagamento(
                  event.target.value
                )
              }
            >
              <option value="">
                Selecione a forma de pagamento
              </option>

              {clienteSelecionado?.tipoCliente ===
                "aluno" && (
                <option value="credito_aluno">
                  Saldo do Aluno (Crédito)
                </option>
              )}

              <option value="pix">
                PIX
              </option>

              <option value="dinheiro">
                Dinheiro
              </option>

              <option value="debito">
                Cartão de Débito
              </option>

              <option value="credito">
                Cartão de Crédito
              </option>
            </select>

            <Button
              type="button"
              onClick={finalizarVenda}
            >
              Finalizar Venda
            </Button>
          </div>
        </Card>
      </div>

      <ModalAviso
        aberto={modal.aberto}
        tipo={modal.tipo}
        titulo={modal.titulo}
        mensagem={modal.mensagem}
        onFechar={fecharAviso}
      />
    </>
  );
}