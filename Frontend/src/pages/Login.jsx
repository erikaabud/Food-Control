import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  function entrar(event) {
    event.preventDefault();

    const usuarioDigitado = usuario
      .trim()
      .toLowerCase();

    if (
      usuarioDigitado === "admin" &&
      senha === "1234"
    ) {
      const admin = {
        id: 1,
        nome: "Admin",
        usuario: "admin",
        tipo: "admin",
      };

      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(admin)
      );

      setErro("");
      navigate("/venda");
      return;
    }

    const usuariosCadastrados =
      JSON.parse(
        localStorage.getItem(
          "usuariosFoodControl"
        )
      ) || [];

    const usuarioEncontrado =
      usuariosCadastrados.find(
        (item) =>
          (
            item.usuario === usuarioDigitado ||
            item.email === usuarioDigitado
          ) &&
          item.senha === senha
      );

    if (!usuarioEncontrado) {
      setErro(
        "Usuário ou senha incorretos."
      );
      return;
    }

    const usuarioLogado = {
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      usuario: usuarioEncontrado.usuario,
      email: usuarioEncontrado.email,
      tipo: "usuario",
    };

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify(usuarioLogado)
    );

    setErro("");
    navigate("/venda");
  }

  return (
    <main className="login-page">
      <form onSubmit={entrar}>
        <div className="form-group">
          <label htmlFor="usuario">
            Usuário
          </label>

          <div className="input-container">
            <UserRound size={24} />

            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(event) =>
                setUsuario(
                  event.target.value
                )
              }
              placeholder="Digite seu usuário"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="senha">
            Senha
          </label>

          <div className="input-container">
            <LockKeyhole size={24} />

            <input
              id="senha"
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
              placeholder="Digite sua senha"
              required
            />

            <button
              className="show-password"
              type="button"
              onClick={() =>
                setMostrarSenha(
                  !mostrarSenha
                )
              }
            >
              {mostrarSenha ? (
                <EyeOff size={24} />
              ) : (
                <Eye size={24} />
              )}
            </button>
          </div>
        </div>

        {erro && (
          <p className="login-error">
            {erro}
          </p>
        )}

        <button
          className="login-button"
          type="submit"
        >
          Entrar
          <ArrowRight size={25} />
        </button>
      </form>
    </main>
  );
}