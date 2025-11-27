import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listaAchadinhos = document.getElementById("listaAchadinhos");
const listaNovidades = document.getElementById("listaNovidades");
const galeriaProdutos = document.getElementById("galeriaProdutos");

let sacola = [];


// ==========================
// 🧩 CRIA O CARD DO PRODUTO
// ==========================
function criarCard(produto) {
  const preco = Number(produto.precoProduto);
  const promo = Number(produto.promocao || 0);

  // calcula preço final
  const precoFinal = promo > 0
    ? (preco - (preco * (promo / 100))).toFixed(2)
    : preco.toFixed(2);

  return `
    <div class="produto-card">

      <img src="${produto.imagem}" alt="${produto.tipoPeca}">

      <h3>${produto.tipoPeca}</h3>

      <div class="precos">
        ${promo > 0
          ? `
            <p class="preco-antigo">R$ ${preco.toFixed(2)}</p>
            <p class="preco-promo">R$ ${precoFinal}</p>
            <span class="tag-desconto">-${promo}%</span>
          `
          : `<p class="preco-normal">R$ ${preco.toFixed(2)}</p>`
        }
      </div>

      <p class="tamanhos"><strong>Tamanhos:</strong> ${produto.tamanhos.join(", ")}</p>
      <p class="estoque">Estoque: peça única</p>

      <button class="btnComprar"
        onclick='adicionarSacola("${produto.id}", "${produto.tipoPeca}", ${Number(precoFinal)})'>
        Reservar
      </button>

    </div>
  `;
}

// ======= ADICIONAR À SACOLA =======
window.adicionarSacola = function (index) {
  const produto = produtos[index];

  const select = document.getElementById(`tam${index}`);
  const tamanho = select.value;

  if (!tamanho) {
    alert("Escolha um tamanho antes de adicionar!");
    return;
  }

  if (produto.estoque <= 0) {
    alert("Este produto está esgotado!");
    return;
  }

  sacola.push({
    ...produto,
    tamanhoSelecionado: tamanho
  });

  alert(`Adicionado à sacola (Tamanho: ${tamanho})`);
};

// ======= ATUALIZAR ESTOQUE REAL NO FIRESTORE =======
async function atualizarEstoque() {
  for (const item of sacola) {
    const ref = doc(db, "produtos", item.id);
    await updateDoc(ref, { estoque: item.estoque - 1 });
  }
}
// ==========================
// 🛍 ADICIONAR À SACOLA
// ==========================
window.adicionarSacola = function(id, nome, preco) {
  preco = parseFloat(preco); // força número

  sacola.push({ id, nome, preco });
  alert(`Adicionado: ${nome}`);
};


// ==========================
// 📲 ENVIAR WHATSAPP
// ==========================
document.addEventListener("DOMContentLoaded", () => {

  const btnWpp = document.getElementById("btnEnviarWhatsapp");

  if (!btnWpp) {
    console.error("Botão WhatsApp não encontrado!");
    return;
  }

  btnWpp.addEventListener("click", () => {

    if (!sacola || sacola.length === 0) {
      alert("Nenhum produto selecionado.");
      return;
    }

    let texto = "Olá! Gostaria de reservar estas peças:\n\n";
    let total = 0;

    sacola.forEach(p => {
      texto += `• ${p.nome} - R$ ${p.preco.toFixed(2)}\n`;
      total += p.preco;
    });

    texto += `\nTotal: R$ ${total.toFixed(2)}`;

    const numero = "5591980645372";

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

    window.open(url, "_blank");
  });

});



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

window.reservarProduto = function (id, nome, preco) {
  sacola.push({ id, nome, preco });
  alert(`Você reservou: ${nome}`);
};

window.scrollLeft = function(id) {
  document.getElementById(id).scrollBy({
    left: -300,
    behavior: "smooth"
  });
};

window.scrollRight = function(id) {
  document.getElementById(id).scrollBy({
    left: 300,
    behavior: "smooth"
  });
};







