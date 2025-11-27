import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("formProduto");
const lista = document.getElementById("listaProdutos");

// ===============================
// Converter imagem para Base64
// ===============================
function converterParaBase64(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = error => reject(error);
    leitor.readAsDataURL(file);
  });
}

// ===============================
// CADASTRAR PRODUTO
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const tipoPeca = document.getElementById("tipoPeca").value;
    const estadoPeca = document.getElementById("estadoPeca").value;
    const precoProduto = Number(document.getElementById("precoProduto").value);
    const promocao = Number(document.getElementById("promocao").value) || 0;

    const secoes = [...document.querySelectorAll('input[name="secao"]:checked')]
                    .map(s => s.value);

    const tamanhos = [...document.querySelectorAll('input[name="tam"]:checked')]
                    .map(t => t.value);

    const arquivo = document.getElementById("fotoProduto").files[0];
    const imagemBase64 = arquivo ? await converterParaBase64(arquivo) : null;

    await addDoc(collection(db, "produtos"), {
      tipoPeca,
      estadoPeca,
      precoProduto,
      promocao,
      secoes,
      tamanhos,
      imagem: imagemBase64,
      estoque: "Peça única",
      criadoEm: new Date()
    });

    alert("Produto cadastrado com sucesso!");
    form.reset();
    carregarProdutos();

  } catch (erro) {
    console.error("Erro ao salvar:", erro);
    alert("Erro ao salvar o produto.");
  }
});

// ===============================
// LISTAR PRODUTOS NO ADMIN
// ===============================
async function carregarProdutos() {
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "produtos"));

  snap.forEach(docSnap => {
    const p = docSnap.data();
    const id = docSnap.id;

    // Valores seguros (para evitar erro com produtos antigos)
    const precoBase = Number(p.precoProduto) || 0;
    const promo = Number(p.promocao) || 0;

    const precoFinal = promo > 0
      ? (precoBase * (1 - promo / 100)).toFixed(2)
      : precoBase.toFixed(2);

    const tamanhos = p.tamanhos ? p.tamanhos.join(", ") : "—";
    const secoes = p.secoes ? p.secoes.join(", ") : "—";

    lista.innerHTML += `
      <div class="card-admin">

        <div class="img-wrapper">
          <img src="${p.imagem || 'imgs/no-image.png'}" class="miniatura">
          ${promo > 0 ? `<span class="tag-promocao">-${promo}%</span>` : ""}
        </div>

        <h3>${p.tipoPeca || "Sem nome"}</h3>

        <p><strong>Estado:</strong> ${p.estadoPeca || "—"}</p>

        ${
          promo > 0
          ? `<p class="preco">
               <span class="preco-antigo">R$ ${precoBase.toFixed(2)}</span>
               <span class="preco-final">R$ ${precoFinal}</span>
             </p>`
          : `<p class="preco-final">R$ ${precoBase.toFixed(2)}</p>`
        }

        <p><strong>Tamanhos:</strong> ${tamanhos}</p>
        <p><strong>Seções:</strong> ${secoes}</p>
        <p><strong>Estoque:</strong> ${p.estoque || "Peça única"}</p>

        <button class="btn-del" onclick="excluirProduto('${id}')">Excluir</button>
      </div>
    `;
  });
}

carregarProdutos();

// ===============================
// EXCLUIR PRODUTO
// ===============================
window.excluirProduto = async function (id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;

  await deleteDoc(doc(db, "produtos", id));

  alert("Produto removido!");
  carregarProdutos();
};



