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

// =======================================
// REDUZIR IMAGEM DO CELULAR
// =======================================
async function reduzirImagem(file, qualidade = 0.6) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const MAX_WIDTH = 900;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const comprimida = canvas.toDataURL("image/jpeg", qualidade);
      resolve(comprimida);
    };

    reader.readAsDataURL(file);
  });
}

// =======================================
// CADASTRAR PRODUTO
// =======================================
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

    // IMAGEM COMPACTADA
    const arquivo = document.getElementById("fotoProduto").files[0];
    const imagemBase64 = arquivo ? await reduzirImagem(arquivo, 0.6) : null;

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

// =======================================
// LISTAR PRODUTOS NO ADMIN
// =======================================
async function carregarProdutos() {
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "produtos"));

  snap.forEach(docSnap => {
    const p = docSnap.data();
    const id = docSnap.id;

    const precoFinal = p.promocao > 0
      ? (p.precoProduto * (1 - p.promocao / 100)).toFixed(2)
      : p.precoProduto.toFixed(2);

    lista.innerHTML += `
      <div class="card-admin">

        <div class="img-wrapper">
          <img src="${p.imagem || 'imgs/no-image.png'}" class="miniatura">
          ${p.promocao > 0 ? `<span class="tag-promocao">-${p.promocao}%</span>` : ""}
        </div>

        <h3>${p.tipoPeca}</h3>

        <p><strong>Estado:</strong> ${p.estadoPeca}</p>

        ${
          p.promocao > 0
          ? `<p class="preco">
               <span class="preco-antigo">R$ ${p.precoProduto.toFixed(2)}</span>
               <span class="preco-final">R$ ${precoFinal}</span>
             </p>`
          : `<p class="preco-final">R$ ${p.precoProduto.toFixed(2)}</p>`
        }

        <p><strong>Tamanhos:</strong> ${p.tamanhos.join(", ")}</p>
        <p><strong>Seções:</strong> ${p.secoes.join(", ")}</p>
        <p><strong>Estoque:</strong> ${p.estoque}</p>

        <button class="btn-del" onclick="excluirProduto('${id}')">Excluir</button>
      </div>
    `;
  });
}

carregarProdutos();

// =======================================
// EXCLUIR PRODUTO
// =======================================
window.excluirProduto = async function (id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;

  await deleteDoc(doc(db, "produtos", id));

  alert("Produto removido!");
  carregarProdutos();
};

