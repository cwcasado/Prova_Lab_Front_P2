import { Link } from 'react-router-dom';

export function NaoEncontrada() {
  return (
    <section className="cartao nao-encontrado">
      <h1>Página não encontrada</h1>
      <p>O endereço que você abriu não existe.</p>
      <Link to="/" className="btn btn-primario">Ir para o Painel</Link>
    </section>
  );
}
