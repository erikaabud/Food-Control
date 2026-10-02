import { useState } from "react";
import { PageHeader, Card, Field, Button } from "../components/UI";
import ModalAviso from "../components/ModalAviso";

const formularioInicial = {
    nome: "",
    tipoCliente: "",
    ra: "",
    responsavel: "",
    telefone: "",
    observacoes: "",
};

export default function CadastrarCliente() {
    const [formulario, setFormulario] = useState(formularioInicial);

    const [modal, setModal] = useState({
        aberto: false,
        tipo: "sucesso",
        titulo: "",
        mensagem: "",
    });

    const [salvando, setSalvando] = useState(false);

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

    function atualizarCampo(event) {
        const { name, value } = event.target;

        setFormulario((dadosAnteriores) => ({
            ...dadosAnteriores,
            [name]: value,
        }));
    }

    function alterarTipoCliente(event) {
        const novoTipo = event.target.value;

        setFormulario((dadosAnteriores) => ({
            ...dadosAnteriores,
            tipoCliente: novoTipo,
            ra: novoTipo === "aluno" ? dadosAnteriores.ra : "",
            responsavel:
                novoTipo === "aluno"
                    ? dadosAnteriores.responsavel
                    : "",
        }));
    }

    function limparFormulario() {
        setFormulario(formularioInicial);
    }

    async function salvarCliente(event) {
        event.preventDefault();

        if (
            formulario.tipoCliente === "aluno" &&
            (!formulario.ra.trim() ||
                !formulario.responsavel.trim())
        ) {
            mostrarAviso(
                "Preencha o RA e o responsável do aluno.",
                "aviso",
                "Dados incompletos"
            );
            return;
        }

        setSalvando(true);

        try {
            const resposta = await fetch(
                "http://localhost:3000/clientes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nome: formulario.nome.trim(),
                        tipoCliente: formulario.tipoCliente,
                        ra:
                            formulario.tipoCliente === "aluno"
                                ? formulario.ra.trim()
                                : null,
                        responsavel:
                            formulario.tipoCliente === "aluno"
                                ? formulario.responsavel.trim()
                                : null,
                        telefone: formulario.telefone.trim(),
                        observacoes: formulario.observacoes.trim(),
                    }),
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                        "Não foi possível cadastrar o cliente."
                );
            }

            setFormulario(formularioInicial);

            mostrarAviso(
                "Cliente cadastrado com sucesso!",
                "sucesso",
                "Cliente cadastrado"
            );
        } catch (error) {
            mostrarAviso(
                error.message,
                "erro",
                "Erro ao cadastrar cliente"
            );
        } finally {
            setSalvando(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Cadastrar Cliente"
                subtitle="Preencha os dados para cadastrar um novo cliente."
            />

            <Card>
                <form onSubmit={salvarCliente}>
                    <div className="form-grid">
                        <Field label="Nome completo" required>
                            <input
                                type="text"
                                name="nome"
                                value={formulario.nome}
                                onChange={atualizarCampo}
                                placeholder="Digite o nome completo"
                                required
                            />
                        </Field>

                        <Field label="Categoria do cliente" required>
                            <select
                                name="tipoCliente"
                                value={formulario.tipoCliente}
                                onChange={alterarTipoCliente}
                                required
                            >
                                <option value="">
                                    Selecione o tipo
                                </option>

                                <option value="aluno">
                                    Aluno
                                </option>

                                <option value="professor">
                                    Professor
                                </option>

                                <option value="funcionario">
                                    Funcionário
                                </option>

                                <option value="visitante">
                                    Visitante
                                </option>
                            </select>
                        </Field>

                        {formulario.tipoCliente === "aluno" && (
                            <>
                                <Field label="RA" required>
                                    <input
                                        type="text"
                                        name="ra"
                                        value={formulario.ra}
                                        onChange={atualizarCampo}
                                        placeholder="Digite o RA"
                                        required
                                    />
                                </Field>

                                <Field label="Responsável" required>
                                    <input
                                        type="text"
                                        name="responsavel"
                                        value={formulario.responsavel}
                                        onChange={atualizarCampo}
                                        placeholder="Nome do responsável"
                                        required
                                    />
                                </Field>
                            </>
                        )}

                        <Field label="Telefone" required>
                            <input
                                type="tel"
                                name="telefone"
                                value={formulario.telefone}
                                onChange={atualizarCampo}
                                placeholder="(11) 91234-5678"
                                required
                            />
                        </Field>

                        <Field label="Observações">
                            <textarea
                                name="observacoes"
                                value={formulario.observacoes}
                                onChange={atualizarCampo}
                                placeholder="Digite informações adicionais..."
                            />
                        </Field>
                    </div>

                    <div className="actions">
                        <Button
                            secondary
                            type="button"
                            onClick={limparFormulario}
                            disabled={salvando}
                        >
                            Limpar
                        </Button>

                        <Button
                            type="submit"
                            disabled={salvando}
                        >
                            {salvando
                                ? "Salvando..."
                                : "Salvar"}
                        </Button>
                    </div>
                </form>
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