import { useEffect, useState } from "react";

import {
    Pencil,
    Trash2,
    Power,
    X,
} from "lucide-react";

import {
    PageHeader,
    Card,
    Status,
    money,
    Field,
    Button,
} from "../components/UI";

import ModalAviso from "../components/ModalAviso";

const formularioInicial = {
    id: null,
    nome: "",
    tipoCliente: "",
    ra: "",
    turma: "",
    responsavel: "",
    telefone: "",
    telefoneResponsavel: "",
    emailResponsavel: "",
    observacoes: "",
};

export default function ListaClientes() {
    const [clientes, setClientes] = useState([]);
    const [pesquisa, setPesquisa] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [editando, setEditando] = useState(false);

    const [formulario, setFormulario] =
        useState(formularioInicial);

    const [modal, setModal] = useState({
        aberto: false,
        tipo: "sucesso",
        titulo: "",
        mensagem: "",
    });

    useEffect(() => {
        carregarClientes();
    }, []);

    function mostrarAviso(
        mensagem,
        tipo = "sucesso",
        titulo = ""
    ) {
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

    async function carregarClientes() {
        try {
            setCarregando(true);

            const resposta = await fetch(
                "http://localhost:3000/clientes"
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    "Não foi possível carregar os clientes."
                );
            }

            const clientesFormatados = dados.map(
                (cliente) => ({
                    id: cliente.id_cliente,
                    nome: cliente.nome,

                    tipoCliente:
                        cliente.tipo_cliente,

                    ra:
                        cliente.matricula || "",

                    turma:
                        cliente.turma || "",

                    responsavel:
                        cliente.responsavel || "",

                    telefone:
                        cliente.telefone || "",

                    telefoneResponsavel:
                        cliente.telefone_responsavel ||
                        "",

                    emailResponsavel:
                        cliente.email_responsavel ||
                        "",

                    observacoes:
                        cliente.observacoes || "",

                    credito: Number(
                        cliente.credito || 0
                    ),

                    ativo: Boolean(
                        Number(cliente.ativo)
                    ),
                })
            );

            setClientes(clientesFormatados);
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao carregar clientes"
            );
        } finally {
            setCarregando(false);
        }
    }

    const clientesFiltrados =
        clientes.filter((cliente) => {
            const texto =
                pesquisa.toLowerCase().trim();

            return (
                cliente.nome
                    ?.toLowerCase()
                    .includes(texto) ||

                cliente.ra
                    ?.toLowerCase()
                    .includes(texto) ||

                cliente.telefone
                    ?.toLowerCase()
                    .includes(texto) ||

                cliente.tipoCliente
                    ?.toLowerCase()
                    .includes(texto) ||

                cliente.responsavel
                    ?.toLowerCase()
                    .includes(texto)
            );
        });

    async function alterarStatus(cliente) {
        const acao = cliente.ativo
            ? "desativar"
            : "ativar";

        const confirmar = window.confirm(
            `Deseja realmente ${acao} o cliente ${cliente.nome}?`
        );

        if (!confirmar) {
            return;
        }

        try {
            const resposta = await fetch(
                `http://localhost:3000/clientes/${cliente.id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        ativo: !cliente.ativo,
                    }),
                }
            );

            const dados =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    "Não foi possível alterar o status."
                );
            }

            await carregarClientes();

            mostrarAviso(
                dados.mensagem,
                "sucesso",
                cliente.ativo
                    ? "Cliente desativado"
                    : "Cliente ativado"
            );
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao alterar status"
            );
        }
    }

    async function editarCliente(cliente) {
        try {
            setCarregando(true);

            const resposta = await fetch(
                `http://localhost:3000/clientes/${cliente.id}`
            );

            const dados =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    "Não foi possível carregar o cliente."
                );
            }

            setFormulario({
                id: dados.id_cliente,

                nome:
                    dados.nome || "",

                tipoCliente:
                    dados.tipo_cliente || "",

                ra:
                    dados.matricula || "",

                turma:
                    dados.turma || "",

                responsavel:
                    dados.responsavel || "",

                telefone:
                    dados.telefone || "",

                telefoneResponsavel:
                    dados.telefone_responsavel ||
                    "",

                emailResponsavel:
                    dados.email_responsavel ||
                    "",

                observacoes:
                    dados.observacoes || "",
            });

            setEditando(true);
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao editar cliente"
            );
        } finally {
            setCarregando(false);
        }
    }

    function atualizarCampo(event) {
        const { name, value } =
            event.target;

        setFormulario(
            (dadosAnteriores) => ({
                ...dadosAnteriores,
                [name]: value,
            })
        );
    }

    function alterarTipoCliente(event) {
        const tipoCliente =
            event.target.value;

        setFormulario(
            (dadosAnteriores) => ({
                ...dadosAnteriores,

                tipoCliente,

                ra:
                    tipoCliente === "Aluno"
                        ? dadosAnteriores.ra
                        : "",

                turma:
                    tipoCliente === "Aluno"
                        ? dadosAnteriores.turma
                        : "",

                responsavel:
                    tipoCliente === "Aluno"
                        ? dadosAnteriores.responsavel
                        : "",

                telefoneResponsavel:
                    tipoCliente === "Aluno"
                        ? dadosAnteriores.telefoneResponsavel
                        : "",

                emailResponsavel:
                    tipoCliente === "Aluno"
                        ? dadosAnteriores.emailResponsavel
                        : "",
            })
        );
    }

    function fecharEdicao() {
        if (salvando) {
            return;
        }

        setEditando(false);
        setFormulario(formularioInicial);
    }

    async function salvarEdicao(event) {
        event.preventDefault();

        if (!formulario.nome.trim()) {
            mostrarAviso(
                "Informe o nome do cliente.",
                "erro",
                "Campo obrigatório"
            );

            return;
        }

        if (!formulario.tipoCliente) {
            mostrarAviso(
                "Selecione o tipo do cliente.",
                "erro",
                "Campo obrigatório"
            );

            return;
        }

        if (
            formulario.tipoCliente ===
                "Aluno" &&
            !formulario.ra.trim()
        ) {
            mostrarAviso(
                "Informe o RA do aluno.",
                "erro",
                "Campo obrigatório"
            );

            return;
        }

        if (
            formulario.tipoCliente ===
                "Aluno" &&
            !formulario.responsavel.trim()
        ) {
            mostrarAviso(
                "Informe o responsável do aluno.",
                "erro",
                "Campo obrigatório"
            );

            return;
        }

        try {
            setSalvando(true);

            const resposta = await fetch(
                `http://localhost:3000/clientes/${formulario.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        nome:
                            formulario.nome.trim(),

                        tipoCliente:
                            formulario.tipoCliente,

                        telefone:
                            formulario.telefone.trim(),

                        observacoes:
                            formulario.observacoes.trim(),

                        ra:
                            formulario.tipoCliente ===
                            "Aluno"
                                ? formulario.ra.trim()
                                : null,

                        turma:
                            formulario.tipoCliente ===
                            "Aluno"
                                ? formulario.turma.trim()
                                : null,

                        responsavel:
                            formulario.tipoCliente ===
                            "Aluno"
                                ? formulario.responsavel.trim()
                                : null,

                        telefone_responsavel:
                            formulario.tipoCliente ===
                            "Aluno"
                                ? formulario.telefoneResponsavel.trim()
                                : null,

                        email_responsavel:
                            formulario.tipoCliente ===
                            "Aluno"
                                ? formulario.emailResponsavel.trim()
                                : null,
                    }),
                }
            );

            const dados =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    "Não foi possível atualizar o cliente."
                );
            }

            setEditando(false);
            setFormulario(formularioInicial);

            await carregarClientes();

            mostrarAviso(
                dados.mensagem ||
                "Cliente atualizado com sucesso!",
                "sucesso",
                "Cliente atualizado"
            );
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao atualizar cliente"
            );
        } finally {
            setSalvando(false);
        }
    }

    async function excluirCliente(cliente) {
        const confirmar = window.confirm(
            `Deseja realmente EXCLUIR definitivamente o cliente ${cliente.nome}?\n\nEssa ação não poderá ser desfeita.`
        );

        if (!confirmar) {
            return;
        }

        try {
            const resposta = await fetch(
                `http://localhost:3000/clientes/${cliente.id}`,
                {
                    method: "DELETE",
                }
            );

            const dados =
                await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    "Não foi possível excluir o cliente."
                );
            }

            await carregarClientes();

            mostrarAviso(
                dados.mensagem ||
                "Cliente excluído com sucesso!",
                "sucesso",
                "Cliente excluído"
            );
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Não foi possível excluir"
            );
        }
    }

    return (
        <>
            <PageHeader
                title="Lista de Clientes"
                subtitle="Consulte e gerencie os clientes cadastrados."
            />

            <Card>
                <div className="toolbar">
                    <input
                        type="search"
                        value={pesquisa}
                        onChange={(event) =>
                            setPesquisa(
                                event.target.value
                            )
                        }
                        placeholder="Pesquisar por nome, RA ou telefone..."
                    />
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Tipo</th>
                                <th>RA</th>
                                <th>Responsável</th>
                                <th>Telefone</th>
                                <th>Crédito</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {clientesFiltrados.map(
                                (cliente) => (
                                    <tr
                                        key={
                                            cliente.id
                                        }
                                    >
                                        <td>
                                            {
                                                cliente.nome
                                            }
                                        </td>

                                        <td>
                                            <Status type="ok">
                                                {
                                                    cliente.tipoCliente
                                                }
                                            </Status>
                                        </td>

                                        <td>
                                            {cliente.ra ||
                                                "—"}
                                        </td>

                                        <td>
                                            {cliente.responsavel ||
                                                "—"}
                                        </td>

                                        <td>
                                            {cliente.telefone ||
                                                "—"}
                                        </td>

                                        <td>
                                            {cliente.tipoCliente ===
                                            "Aluno"
                                                ? money(
                                                      cliente.credito
                                                  )
                                                : "—"}
                                        </td>

                                        <td>
                                            <Status
                                                type={
                                                    cliente.ativo
                                                        ? "ok"
                                                        : "bad"
                                                }
                                            >
                                                {cliente.ativo
                                                    ? "Ativo"
                                                    : "Inativo"}
                                            </Status>
                                        </td>

                                        <td>
                                            <div className="table-actions">

                                                <button
                                                    type="button"
                                                    className="action-button edit"
                                                    title="Editar cliente"
                                                    onClick={() =>
                                                        editarCliente(
                                                            cliente
                                                        )
                                                    }
                                                >
                                                    <Pencil
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="action-button"
                                                    title={
                                                        cliente.ativo
                                                            ? "Desativar cliente"
                                                            : "Ativar cliente"
                                                    }
                                                    onClick={() =>
                                                        alterarStatus(
                                                            cliente
                                                        )
                                                    }
                                                >
                                                    <Power
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="action-button delete"
                                                    title="Excluir cliente"
                                                    onClick={() =>
                                                        excluirCliente(
                                                            cliente
                                                        )
                                                    }
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}

                            {!carregando &&
                                clientesFiltrados.length ===
                                    0 && (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="empty-table"
                                        >
                                            Nenhum
                                            cliente
                                            encontrado.
                                        </td>
                                    </tr>
                                )}

                            {carregando && (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="empty-table"
                                    >
                                        Carregando
                                        clientes...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {editando && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background:
                            "rgba(0, 0, 0, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            width: "100%",
                            maxWidth: "650px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            borderRadius: "16px",
                            padding: "28px",
                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.25)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "24px",
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    Editar Cliente
                                </h2>

                                <p
                                    style={{
                                        margin:
                                            "6px 0 0",
                                        color: "#666",
                                    }}
                                >
                                    Altere os dados
                                    do cliente e
                                    salve.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    fecharEdicao
                                }
                                disabled={
                                    salvando
                                }
                                style={{
                                    border: "none",
                                    background:
                                        "transparent",
                                    cursor:
                                        "pointer",
                                    padding: "6px",
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                salvarEdicao
                            }
                        >
                            <div className="form-grid">

                                <Field
                                    label="Nome completo"
                                    required
                                >
                                    <input
                                        type="text"
                                        name="nome"
                                        value={
                                            formulario.nome
                                        }
                                        onChange={
                                            atualizarCampo
                                        }
                                        required
                                    />
                                </Field>

                                <Field
                                    label="Categoria do cliente"
                                    required
                                >
                                    <select
                                        name="tipoCliente"
                                        value={
                                            formulario.tipoCliente
                                        }
                                        onChange={
                                            alterarTipoCliente
                                        }
                                        required
                                    >
                                        <option value="">
                                            Selecione
                                        </option>

                                        <option value="Aluno">
                                            Aluno
                                        </option>

                                        <option value="Professor">
                                            Professor
                                        </option>

                                        <option value="Funcionário">
                                            Funcionário
                                        </option>

                                        <option value="Visitante">
                                            Visitante
                                        </option>
                                    </select>
                                </Field>

                                <Field label="Telefone">
                                    <input
                                        type="tel"
                                        name="telefone"
                                        value={
                                            formulario.telefone
                                        }
                                        onChange={
                                            atualizarCampo
                                        }
                                        placeholder="(11) 91234-5678"
                                    />
                                </Field>

                                {formulario.tipoCliente ===
                                    "Aluno" && (
                                    <>
                                        <Field
                                            label="RA"
                                            required
                                        >
                                            <input
                                                type="text"
                                                name="ra"
                                                value={
                                                    formulario.ra
                                                }
                                                onChange={
                                                    atualizarCampo
                                                }
                                                required
                                            />
                                        </Field>

                                        <Field label="Turma">
                                            <input
                                                type="text"
                                                name="turma"
                                                value={
                                                    formulario.turma
                                                }
                                                onChange={
                                                    atualizarCampo
                                                }
                                            />
                                        </Field>

                                        <Field
                                            label="Responsável"
                                            required
                                        >
                                            <input
                                                type="text"
                                                name="responsavel"
                                                value={
                                                    formulario.responsavel
                                                }
                                                onChange={
                                                    atualizarCampo
                                                }
                                                required
                                            />
                                        </Field>

                                        <Field label="Telefone do responsável">
                                            <input
                                                type="tel"
                                                name="telefoneResponsavel"
                                                value={
                                                    formulario.telefoneResponsavel
                                                }
                                                onChange={
                                                    atualizarCampo
                                                }
                                            />
                                        </Field>

                                        <Field label="E-mail do responsável">
                                            <input
                                                type="email"
                                                name="emailResponsavel"
                                                value={
                                                    formulario.emailResponsavel
                                                }
                                                onChange={
                                                    atualizarCampo
                                                }
                                            />
                                        </Field>
                                    </>
                                )}

                                <Field label="Observações">
                                    <textarea
                                        name="observacoes"
                                        value={
                                            formulario.observacoes
                                        }
                                        onChange={
                                            atualizarCampo
                                        }
                                        placeholder="Digite informações adicionais..."
                                    />
                                </Field>

                            </div>

                            <div
                                className="actions"
                                style={{
                                    marginTop:
                                        "24px",
                                }}
                            >
                                <Button
                                    secondary
                                    type="button"
                                    onClick={
                                        fecharEdicao
                                    }
                                    disabled={
                                        salvando
                                    }
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={
                                        salvando
                                    }
                                >
                                    {salvando
                                        ? "Salvando..."
                                        : "Salvar alterações"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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