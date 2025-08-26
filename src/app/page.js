export default function Page() {
  return (
    <main className="card">
      <h1 style={{ marginTop: 0 }}>Simulador Educativo</h1>
      <p>
        Esta é uma plataforma <strong>100% educativa</strong> para demonstrar UX
        e fluxos de um app de “simulação de sorteio”. Não há dinheiro real,
        pagamentos ou prêmios.
      </p>
      <hr />
      <p>
        Comece por <a href="/regras">Regras (educativo)</a> ou vá direto para a{" "}
        <a href="/simular">Simulação</a>.
      </p>
      <small className="muted">
        Dica: use a tecla <span className="kbd">R</span> na página “Simular”
        para repetir a última jogada.
      </small>
    </main>
  );
}
