import { useState } from "react";
import {
    PageHeader,
    Card,
    Button,
    Status,
    money,
} from "../components/UI";
import ModalAviso from "../components/ModalAviso";

export default function CreditoAluno() {
    const [pesquisa, setPesquisa] = useState("");
    const [resultados, setResultados] = useState([]);
    const [alunoSelecionado, setAlunoSelecionado] = useState(null);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const [modal, setModal] = useState({
        aberto: false,
        tipo: "sucesso",
        titulo: "",
        mensagem: "",
    });

    function mostrarAviso(mensagem, tipo = "sucesso", titulo = "") {
        setModal({
            aberto: true,
            tipo,
            titulo,
            mensagem,
        });
    }

    function fecharAviso() {
        setModal((estadoAtual) => ({
            ...estadoAtual,
            aberto: false,
        }));
    }

    async function buscarAluno() {
        const texto = pesquisa.trim();

        if (!texto) {
            setResultados([]);

            mostrarAviso(
                "Digite o nome, RA ou turma do aluno.",
                "aviso",
                "Pesquisa"
            );

            return;
        }

        try {
            setCarregando(true);

            const resposta = await fetch(
                `http://localhost:3000/credito/alunos?pesquisa=${encodeURIComponent(
                    texto
                )}`
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        "Não foi possível buscar o aluno."
                );
            }

            const alunosFormatados = dados.map((aluno) => ({
                id: aluno.id_aluno,
                idAluno: aluno.id_aluno,
                idCliente: aluno.id_cliente,
                idContaCredito: aluno.id_conta_credito,
                nome: aluno.nome,
                ra: aluno.matricula || "",
                turma: aluno.turma || "",
                telefone: aluno.telefone || "",
                credito: Number(aluno.saldo || 0),
                ativo: Boolean(Number(aluno.ativo)),
            }));

            setResultados(alunosFormatados);

            if (alunosFormatados.length === 0) {
                mostrarAviso(
                    "Nenhum aluno encontrado.",
                    "aviso",
                    "Pesquisa"
                );
            }
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao buscar aluno"
            );
        } finally {
            setCarregando(false);
        }
    }

    async function carregarConta(idAluno) {
        const resposta = await fetch(
            `http://localhost:3000/credito/aluno/${idAluno}`
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem ||
                    "Não foi possível carregar a conta de crédito."
            );
        }

        return {
            id: dados.id_aluno,
            idAluno: dados.id_aluno,
            idCliente: dados.id_cliente,
            idContaCredito: dados.id_conta_credito,
            nome: dados.nome,
            ra: dados.matricula || "",
            turma: dados.turma || "",
            credito: Number(dados.saldo || 0),
            ativo: Boolean(Number(dados.ativo)),
        };
    }

    async function carregarMovimentacoes(idAluno) {
        const resposta = await fetch(
            `http://localhost:3000/credito/aluno/${idAluno}/movimentacoes`
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.mensagem ||
                    "Não foi possível carregar as movimentações."
            );
        }

        setMovimentacoes(dados);
    }

    async function selecionarAluno(aluno) {
        try {
            setCarregando(true);

            const conta = await carregarConta(aluno.idAluno);

            setAlunoSelecionado(conta);

            await carregarMovimentacoes(aluno.idAluno);

            setResultados([]);
            setPesquisa("");
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao selecionar aluno"
            );
        } finally {
            setCarregando(false);
        }
    }

    async function atualizarAlunoSelecionado() {
        if (!alunoSelecionado) {
            return;
        }

        const conta = await carregarConta(
            alunoSelecionado.idAluno
        );

        setAlunoSelecionado(conta);

        await carregarMovimentacoes(
            alunoSelecionado.idAluno
        );
    }

    async function adicionarCredito() {
        if (!alunoSelecionado) {
            mostrarAviso(
                "Busque e selecione um aluno primeiro.",
                "aviso",
                "Selecione um aluno"
            );

            return;
        }

        if (!alunoSelecionado.ativo) {
            mostrarAviso(
                "Não é possível adicionar crédito a um aluno inativo.",
                "erro",
                "Aluno inativo"
            );

            return;
        }

        const valorDigitado = window.prompt(
            "Digite o valor que deseja adicionar:"
        );

        if (valorDigitado === null) {
            return;
        }

        const valor = Number(
            valorDigitado.replace(",", ".")
        );

        if (Number.isNaN(valor) || valor <= 0) {
            mostrarAviso(
                "Digite um valor válido.",
                "erro",
                "Valor inválido"
            );

            return;
        }

        try {
            setCarregando(true);

            const resposta = await fetch(
                `http://localhost:3000/credito/aluno/${alunoSelecionado.idAluno}/adicionar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        valor,
                        observacao: "Recarga via Cantina",
                        id_usuario: null,
                    }),
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        "Não foi possível adicionar o crédito."
                );
            }

            await atualizarAlunoSelecionado();

            mostrarAviso(
                "Crédito adicionado com sucesso!",
                "sucesso",
                "Crédito adicionado"
            );
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao adicionar crédito"
            );
        } finally {
            setCarregando(false);
        }
    }

    async function removerCredito() {
        if (!alunoSelecionado) {
            mostrarAviso(
                "Busque e selecione um aluno primeiro.",
                "aviso",
                "Selecione um aluno"
            );

            return;
        }

        if (!alunoSelecionado.ativo) {
            mostrarAviso(
                "Não é possível alterar o crédito de um aluno inativo.",
                "erro",
                "Aluno inativo"
            );

            return;
        }

        const valorDigitado = window.prompt(
            "Digite o valor que deseja remover:"
        );

        if (valorDigitado === null) {
            return;
        }

        const valor = Number(
            valorDigitado.replace(",", ".")
        );

        if (Number.isNaN(valor) || valor <= 0) {
            mostrarAviso(
                "Digite um valor válido.",
                "erro",
                "Valor inválido"
            );

            return;
        }

        if (valor > Number(alunoSelecionado.credito)) {
            mostrarAviso(
                "O aluno não possui saldo suficiente.",
                "erro",
                "Saldo insuficiente"
            );

            return;
        }

        try {
            setCarregando(true);

            const resposta = await fetch(
                `http://localhost:3000/credito/aluno/${alunoSelecionado.idAluno}/remover`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        valor,
                        observacao: "Remoção de crédito",
                        id_usuario: null,
                    }),
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        "Não foi possível remover o crédito."
                );
            }

            await atualizarAlunoSelecionado();

            mostrarAviso(
                "Crédito removido com sucesso!",
                "sucesso",
                "Crédito removido"
            );
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao remover crédito"
            );
        } finally {
            setCarregando(false);
        }
    }

    function formatarData(data) {
        if (!data) {
            return "—";
        }

        return new Date(data).toLocaleString("pt-BR");
    }

    function tipoMovimentacao(tipo) {
        if (tipo === "Compra") {
            return "debito";
        }

        if (tipo === "Ajuste") {
            return "debito";
        }

        return "credito";
    }

    return (
        <>
            <PageHeader
                title="Crédito do Aluno"
                subtitle="Adicione, remova ou consulte o saldo de crédito do aluno."
            />

            <Card>
                <div className="toolbar">
                    <input
                        type="search"
                        value={pesquisa}
                        onChange={(event) =>
                            setPesquisa(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                buscarAluno();
                            }
                        }}
                        placeholder="Digite o nome, RA ou turma..."
                    />

                    <Button
                        type="button"
                        onClick={buscarAluno}
                        disabled={carregando}
                    >
                        {carregando ? "Carregando..." : "Buscar"}
                    </Button>
                </div>

                {resultados.length > 0 && (
                    <div className="credit-search-results">
                        {resultados.map((aluno) => (
                            <button
                                type="button"
                                className="student-result"
                                key={aluno.idAluno}
                                onClick={() =>
                                    selecionarAluno(aluno)
                                }
                            >
                                <div className="avatar big">
                                    {aluno.nome
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <b>{aluno.nome}</b>

                                    <small>
                                        RA:{" "}
                                        {aluno.ra ||
                                            "Não informado"}

                                        {aluno.turma
                                            ? ` | ${aluno.turma}`
                                            : ""}
                                    </small>

                                    <em>
                                        Saldo:{" "}
                                        {money(
                                            Number(
                                                aluno.credito ||
                                                    0
                                            )
                                        )}
                                    </em>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {alunoSelecionado ? (
                    <>
                        <div className="credit-box">
                            <div>
                                <h2>
                                    {alunoSelecionado.nome}
                                </h2>

                                <p>
                                    RA:{" "}
                                    {alunoSelecionado.ra ||
                                        "Não informado"}

                                    {alunoSelecionado.turma
                                        ? ` | ${alunoSelecionado.turma}`
                                        : ""}
                                </p>

                                <Status
                                    type={
                                        alunoSelecionado.ativo
                                            ? "ok"
                                            : "bad"
                                    }
                                >
                                    {alunoSelecionado.ativo
                                        ? "Aluno ativo"
                                        : "Aluno inativo"}
                                </Status>
                            </div>

                            <div>
                                <small>Saldo Atual</small>

                                <strong>
                                    {money(
                                        Number(
                                            alunoSelecionado.credito ||
                                                0
                                        )
                                    )}
                                </strong>
                            </div>
                        </div>

                        <div className="actions left">
                            <Button
                                type="button"
                                onClick={adicionarCredito}
                                disabled={carregando}
                            >
                                + Adicionar Crédito
                            </Button>

                            <Button
                                danger
                                type="button"
                                onClick={removerCredito}
                                disabled={carregando}
                            >
                                − Remover Crédito
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="credit-empty">
                        Busque e selecione um aluno para consultar
                        o saldo.
                    </div>
                )}
            </Card>

            <Card>
                <h2>Histórico de Movimentações</h2>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>

                        <tbody>
                            {movimentacoes.map((movimentacao) => {
                                const natureza =
                                    tipoMovimentacao(
                                        movimentacao.tipo
                                    );

                                return (
                                    <tr
                                        key={
                                            movimentacao.id_movimentacao
                                        }
                                    >
                                        <td>
                                            {formatarData(
                                                movimentacao.data_movimentacao
                                            )}
                                        </td>

                                        <td>
                                            {movimentacao.observacao ||
                                                "—"}
                                        </td>

                                        <td>
                                            <Status
                                                type={
                                                    natureza ===
                                                    "debito"
                                                        ? "bad"
                                                        : "ok"
                                                }
                                            >
                                                {
                                                    movimentacao.tipo
                                                }
                                            </Status>
                                        </td>

                                        <td>
                                            {natureza ===
                                            "debito"
                                                ? "− "
                                                : "+ "}

                                            {money(
                                                Number(
                                                    movimentacao.valor ||
                                                        0
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {!alunoSelecionado && (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="empty-table"
                                    >
                                        Selecione um aluno para
                                        visualizar o histórico.
                                    </td>
                                </tr>
                            )}

                            {alunoSelecionado &&
                                movimentacoes.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="empty-table"
                                        >
                                            Nenhuma movimentação
                                            encontrada.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </Card>

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