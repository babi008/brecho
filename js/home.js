// home.js – Firestore + Tamanhos + Tema + Estoque Real
import { db } from "./firebase.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let produtos = [];
let sacola = [];

// ======= CARREGAR PRODUTOS DO FIRESTORE =======
async function carregarProdutos() {
  const snap = await getDocs(collection(db, "produtos"));
  produtos = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  aplicarTema();
  renderizar();
}

// ======= CÁLCULO DO DESCONTO =======
function calcPromo(preco, promo) {
  return preco - (preco * promo / 100);
}

// ======= APLICA TEMA DE ACORDO COM A COLEÇÃO MAIS FREQUENTE =======
function aplicarTema() {
  if (produtos.length === 0) return;

  const contagem = produtos.reduce((acc, p) => {
    acc[p.colecao] = (acc[p.colecao] || 0) + 1;
    return acc;
  }, {});

  const dominante = Object.keys(contagem).reduce((a, b) =>
    contagem[a] > contagem[b] ? a : b
  );

  document.body.classList.forEach(cls => {
    if (cls.startsWith("tema-")) document.body.classList.remove(cls);
  });

  document.body.classList.add(`tema-${dominante}`);

  const nomeColecao = {
    verao: "Coleção Verão",
    inverno: "Coleção Inverno",
    outono: "Coleção Outono",
    primavera: "Coleção Primavera",
    fimdeano: "Coleção de Fim de Ano",
    surpresa: "Coleção Surpresa"
  };

  document.getElementById("tituloColecao").textContent = nomeColecao[dominante];
  document.getElementById("subTituloColecao").textContent = "Peças selecionadas para você";
}

// ======= RENDERIZAR GALERIA =======
function renderizar() {
  const galeria = document.getElementById("galeriaProdutos");
  galeria.innerHTML = "";

  produtos.forEach((p, index) => {
    const precoFinal = calcPromo(p.preco, p.promocao);

    const tamanhosSelect = p.tamanhos?.length
      ? `<select id="tam${index}" class="select-tamanho">
          <option value="">Selecione o tamanho</option>
          ${p.tamanhos.map(t => `<option value="${t}">${t}</option>`).join("")}
        </select>`
      : "<p>Sem tamanhos cadastrados</p>";

    galeria.insertAdjacentHTML("beforeend", `
      <article class="card-produto">
        ${p.promocao > 0 ? `<span class="etiqueta-promocao">-${p.promocao}%</span>` : ""}

        <img src="${p.foto}">
        <h3>${p.nome}</h3>

       <p class="precos">
      ${p.promocao > 0 
        ? `<span class="preco-antigo">De: R$ ${p.preco.toFixed(2)}</span>
           <br>
           <span class="preco-novo">Por: R$ ${precoFinal.toFixed(2)}</span>`
        : `<strong>R$ ${p.preco.toFixed(2)}</strong>`
      }
       </p>
        <label><strong>Tamanho:</strong></label>
        ${tamanhosSelect}

        <p><strong>Estoque:</strong> 
          ${p.estoque > 0 ? p.estoque : "❌ ESGOTADO"}
        </p>

        <button class="btn-add" onclick="adicionarSacola(${index})"
          ${p.estoque === 0 ? "disabled" : ""}>
          ${p.estoque === 0 ? "Esgotado" : "Adicionar à sacola"}
        </button>
      </article>
    `);
  });
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

// ======= BOTÃO WHATSAPP =======
document.getElementById("btnEnviarWhatsapp").addEventListener("click", async () => {
  if (sacola.length === 0) {
    alert("Você não selecionou nenhum produto.");
    return;
  }

  let texto = "Olá, gostaria de comprar estas peças:%0A%0A";
  let total = 0;

  sacola.forEach(p => {
    const precoFinal = calcPromo(p.preco, p.promocao);
    total += precoFinal;

    texto += `• ${p.nome} (Tam: ${p.tamanhoSelecionado}) - R$ ${precoFinal.toFixed(2)}%0A`;
  });

  texto += `%0ATotal: R$ ${total.toFixed(2)}`;

  await atualizarEstoque();
  await carregarProdutos();

  const numero = "5591996130056";

  window.open(`https://wa.me/${numero}?text=${texto}`);
});

// ======= BOTÃO INSTAGRAM =======
document.getElementById("btnEnviarInsta").addEventListener("click", () => {
  if (sacola.length === 0) {
    alert("Nenhum produto selecionado.");
    return;
  }

  let texto = "Pedido:%0A";

  sacola.forEach(item => {
    texto += `• ${item.nome} - Tam: ${item.tamanhoSelecionado}%0A`;
  });

  window.open(`https://www.instagram.com/direct/inbox/?text=${texto}`, "_blank");
});

// ======= INICIAR =======
carregarProdutos();
