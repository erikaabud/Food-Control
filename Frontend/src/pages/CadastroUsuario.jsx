import { useEffect, useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import "./CadastroUsuario.css";

export default function CadastroUsuario() {
  const [nome, setNome] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefone, setTelefone] =
    useState("");

  const [usuario, setUsuario] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    mostrarSenha,
    setMostrarSenha,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const navigate =
    useNavigate();

  const usuarioLogado =
    JSON.parse(
      localStorage.getItem(
        "usuarioLogado"
      ) || "null"
    );

  const ehAdministrador =
    usuarioLogado?.tipo ===
    "admin";

  useEffect(() => {
    if (!ehAdministrador) {
      navigate(
        "/venda",
        {
          replace: true,
        }
      );
    }
  }, [
    ehAdministrador,
    navigate,
  ]);

  if (!ehAdministrador) {
    return null;
  }

  function cadastrar(event) {
    event.preventDefault();

    if (
      senha !== confirmarSenha
    ) {
      setErro(
        "As senhas não coincidem."
      );
      return;
    }

    const usuarioFormatado =
      usuario
        .trim()
        .toLowerCase();

    const emailFormatado =
      email
        .trim()
        .toLowerCase();

    if (
      usuarioFormatado === "admin"
    ) {
      setErro(
        "Este nome de usuário não está disponível."
      );
      return;
    }

    const usuariosCadastrados =
      JSON.parse(
        localStorage.getItem(
          "usuariosFoodControl"
        )
      ) || [];

    const cadastroExistente =
      usuariosCadastrados.some(
        (item) =>
          item.usuario ===
            usuarioFormatado ||
          item.email ===
            emailFormatado
      );

    if (cadastroExistente) {
      setErro(
        "Esse usuário ou e-mail já está cadastrado."
      );
      return;
    }

    usuariosCadastrados.push({
      id: Date.now(),
      nome: nome.trim(),
      email: emailFormatado,
      telefone:
        telefone.trim(),
      usuario:
        usuarioFormatado,
      senha,
      tipo: "usuario",
    });

    localStorage.setItem(
      "usuariosFoodControl",
      JSON.stringify(
        usuariosCadastrados
      )
    );

    setErro("");

    navigate(
      "/venda"
    );
  }

  return (
    <main className="user-register-page">
      <aside className="user-register-panel">
        <div className="user-register-panel-content">
          <h1>
            Food<span>Control</span>
          </h1>

          <div className="user-register-line"></div>

          <p>
            Mais organização
            <br />
            para a sua cantina.
          </p>
        </div>

        <div className="user-register-message">
          Comida boa gera grandes histórias!
        </div>
      </aside>

      <section className="user-register-content">
        <form
          className="user-register-card"
          onSubmit={cadastrar}
        >
          <header className="user-register-header">
            <h2>
              Food<span>Control</span>
            </h2>

            <div className="user-register-title-line"></div>

            <h3>
              Criar novo usuário
            </h3>

            <p>
              Cadastre um novo usuário para acessar o sistema.
            </p>
          </header>

          <div className="user-register-grid">
            <label className="user-register-field user-register-full">
              <span className="user-register-label">
                Nome completo <b>*</b>
              </span>

              <span className="user-register-input">
                <UserRound
                  size={20}
                />

                <input
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(
                      event.target.value
                    )
                  }
                  placeholder="Digite o nome completo"
                  required
                />
              </span>
            </label>

            <label className="user-register-field">
              <span className="user-register-label">
                E-mail <b>*</b>
              </span>

              <span className="user-register-input">
                <Mail size={20} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="Digite o e-mail"
                  required
                />
              </span>
            </label>

            <label className="user-register-field">
              <span className="user-register-label">
                Telefone (opcional)
              </span>

              <span className="user-register-input">
                <Phone size={20} />

                <input
                  type="tel"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(
                      event.target.value
                    )
                  }
                  placeholder="(11) 91234-5678"
                />
              </span>
            </label>

            <label className="user-register-field">
              <span className="user-register-label">
                Nome de usuário <b>*</b>
              </span>

              <span className="user-register-input">
                <UserRound
                  size={20}
                />

                <input
                  type="text"
                  value={usuario}
                  onChange={(event) =>
                    setUsuario(
                      event.target.value
                    )
                  }
                  placeholder="Escolha um nome de usuário"
                  required
                />
              </span>
            </label>

            <label className="user-register-field">
              <span className="user-register-label">
                Senha <b>*</b>
              </span>

              <span className="user-register-input">
                <LockKeyhole
                  size={20}
                />

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={senha}
                  onChange={(event) =>
                    setSenha(
                      event.target.value
                    )
                  }
                  placeholder="Digite a senha"
                  minLength={4}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                  aria-label="Mostrar ou ocultar senha"
                >
                  {mostrarSenha ? (
                    <EyeOff
                      size={20}
                    />
                  ) : (
                    <Eye
                      size={20}
                    />
                  )}
                </button>
              </span>
            </label>

            <label className="user-register-field user-register-full">
              <span className="user-register-label">
                Confirmar senha <b>*</b>
              </span>

              <span className="user-register-input">
                <LockKeyhole
                  size={20}
                />

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmarSenha
                  }
                  onChange={(event) =>
                    setConfirmarSenha(
                      event.target.value
                    )
                  }
                  placeholder="Confirme a senha"
                  minLength={4}
                  required
                />
              </span>
            </label>
          </div>

          {erro && (
            <p className="user-register-error">
              {erro}
            </p>
          )}

          <button
            className="user-register-submit"
            type="submit"
          >
            Criar usuário
            <ArrowRight
              size={20}
            />
          </button>

          <div className="user-register-login-bottom">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/venda"
                )
              }
            >
              Voltar ao sistema
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}