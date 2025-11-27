import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ELEMENTOS DO HTML
const listaAchadinhos = document.getElementById("listaAchadinhos");
const listaNovidades = document.getElementById("listaNovidades");
const galeriaProdutos = document.getElementById("galeriaProdutos");

// FUNÇÃO PARA MONTAR CARD DO PRODUTO
function criarCard(produto) {
  return `
    <div class="produto-card">
      <img src="${produto.imagem}" alt="Produto">
      <h3>${produto.tipo}</h3>
      <p class="preco">R$ ${produto.preco}</p>
      <p class="estado">Estado: ${produto.estado}</p>
      <button class="btnComprar">Reservar</button>
    </div>
  `;
}

// CARREGAR PRODUTOS DO FIRESTORE
async function carregarProdutos() {
  const ref = collection(db, "produtos");
  const snap = await getDocs(ref);

  snap.forEach(doc => {
    const produto = doc.data();

    // Adiciona em TODAS as peças
    galeriaProdutos.innerHTML += criarCard(produto);

    // Adiciona na seção escolhida
    if (produto.secoes.includes("achadinhos")) {
      listaAchadinhos.innerHTML += criarCard(produto);
    }
    if (produto.secoes.includes("novidades")) {
      listaNovidades.innerHTML += criarCard(produto);
    }
  });
}

carregarProdutos();