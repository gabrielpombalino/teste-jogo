"use client";

import { useAuth } from "@/context/auth";

export default function RequireAuth({ children, fallback }) {
  const { user, busy } = useAuth();

  if (busy) {
    return (
      <div className="card" style={{ marginTop: 12 }}>
        Verificando login...
      </div>
    );
  }

  if (!user) {
    // usa o fallback customizado se enviado; senão, um padrão
    return (
      fallback ?? (
        <div
          className="card"
          style={{ marginTop: 12, borderColor: "var(--warning)" }}
        >
          <strong>Você precisa estar logado para jogar.</strong>
          <p className="label">
            Use o botão “Entrar” no topo para acessar sua conta.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
