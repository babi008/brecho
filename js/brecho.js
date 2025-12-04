// brecho.js — substitua todo o arquivo atual por este

import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listaAchadinhos = document.getElementById("listaAchadinhos");
const listaNovidades = document.getElementById("listaNovidades");
const galeriaProdutos = document.getElementById("galeriaProdutos");
const filtroSelect = document.getElementById("filtroCategoria");

let sacola = [];

/* ==========================
   Util: normaliza strings
   remove acentos, trim, lowerCase
   ========================== */
function normalizeStr(s) {
  if (!s && s !== "") return "";
  return String(s)
    .normalize("NFD")              // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim();
}

/* ==========================
   Criar card (agora com data-categoria normalizada)
   ========================== */
function criarCard(produto) {
  const preco = Number(produto.precoProduto) || 0;
  const promo = Number(produto.promocao || 0);

  const precoFinal = promo > 0
    ? (preco - (preco * (promo / 100))).toFixed(2)
    : preco.toFixed(2);

  const tiposafe = produto.tipoPeca || produto.tipo || "outros";
  const categoriaNormalized = normalizeStr(tiposafe);

  const imagem = produto.imagem || "imgs/no-image.png";
  const tamanhos = Array.isArray(produto.tamanhos) ? produto.tamanhos.join(", ") : "—";

  // Use template literal com data-categoria normalizada
  return `
    <div class="produto-card" data-categoria="${categoriaNormalized}" data-id="${produto.id || ""}">
      <img src="${imagem}" alt="${tiposafe}">
      <h3>${tiposafe}</h3>
    

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
      
      <p class="tamanhos"><strong>Tamanhos:</strong> ${tamanhos}</p>
      <p class="estoque">Estoque: peça única</p>
      <p><strong>Estado:</strong> ${produto.estadoPeca}</p>



    
      

      <button class="btnComprar"
        onclick='adicionarSacola("${produto.id || ""}", "${tiposafe.replace(/"/g,"'")}", ${Number(precoFinal)})'>
        Reservar
      </button>
    </div>
  `;
}

/* ==========================
   Adicionar à sacola (simples)
   ========================== */
window.adicionarSacola = function(id, nome, preco) {
  preco = parseFloat(preco) || 0;
  sacola.push({ id, nome, preco });
  alert(`Adicionado: ${nome}`);
};

/* ==========================
   Enviar WhatsApp
   ========================== */
document.addEventListener("DOMContentLoaded", () => {
  const btnWpp = document.getElementById("btnEnviarWhatsapp");
  if (!btnWpp) return;

  btnWpp.addEventListener("click", () => {
    if (!sacola.length) {
      alert("Nenhum produto selecionado.");
      return;
    }

    let texto = "Olá! Gostaria de reservar estas peças:%0A%0A";
    let total = 0;

    sacola.forEach(p => {
      texto += `• ${p.nome} - R$ ${p.preco.toFixed(2)}%0A`;
      total += p.preco;
    });

    texto += `%0ATotal: R$ ${total.toFixed(2)}`;

    const numero = "5591980645372";
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  });
});

/* ==========================
   Carregar produtos do Firestore
   ========================== */
async function carregarProdutos() {
  // limpa antes
  galeriaProdutos.innerHTML = "";
  listaAchadinhos.innerHTML = "";
  listaNovidades.innerHTML = "";

  const ref = collection(db, "produtos");
  const snap = await getDocs(ref);

  if (!snap || !snap.docs) {
    console.warn("Nenhum documento retornado de produtos.");
    return;
  }

  // popular arrays para permitir debug
  const produtos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`carregarProdutos: ${produtos.length} produtos encontrados`);

  produtos.forEach(p => {
    console.log("Produto:", p.tipoPeca || p.tipo || "(sem categoria)");
  });

  produtos.forEach(produto => {
    // garante campos sem quebrar
    const p = {
      id: produto.id,
      tipoPeca: produto.tipoPeca || produto.tipo || "",
      precoProduto: produto.precoProduto || produto.preco || 0,
      promocao: produto.promocao || 0,
      secoes: Array.isArray(produto.secoes) ? produto.secoes : (produto.secoes ? [produto.secoes] : []),
      tamanhos: Array.isArray(produto.tamanhos) ? produto.tamanhos : (produto.tamanhos ? [produto.tamanhos] : []),
      imagem: produto.imagem || produto.imagemBase64 || produto.foto || null,
      estadoPeca: produto.estadoPeca || "Não informado"
    };

    // renderiza
    galeriaProdutos.innerHTML += criarCard(p);

    // só adiciona se tiver a seção apropriada (normalizando)
    const secoesNormalized = p.secoes.map(s => normalizeStr(s));
    if (secoesNormalized.includes("achadinhos")) {
      listaAchadinhos.innerHTML += criarCard(p);
    }
    if (secoesNormalized.includes("novidades")) {
      listaNovidades.innerHTML += criarCard(p);
    }
  });

  // depois de renderizar, assegurar que o filtro usa os option values normalizados
  normalizeFilterOptions();
}

/* ==========================
   Normalize opções do select (ajusta valores das <option>)
   ========================== */
function normalizeFilterOptions() {
  if (!filtroSelect) return;

  // transforma cada option.value para versão normalizada (exceto "todos")
  for (let i = 0; i < filtroSelect.options.length; i++) {
    const opt = filtroSelect.options[i];
    const raw = opt.value || opt.text || "";
    if (normalizeStr(raw) === "todos") {
      opt.value = "todos";
    } else {
      opt.value = normalizeStr(raw);
    }
  }
}

/* ==========================
   FILTRO: aplica apenas na seção Achadinhos
   ========================== */
function aplicarFiltroAchadinhos() {
  if (!filtroSelect) return;

  filtroSelect.addEventListener("change", () => {
    const categoriaSelecionada = normalizeStr(filtroSelect.value);
    // pega só cards dentro da lista de achadinhos
    const cards = document.querySelectorAll("#listaAchadinhos .produto-card");

    cards.forEach(card => {
      const categoria = normalizeStr(card.dataset.categoria || "");
      if (categoriaSelecionada === "todos" || categoria === categoriaSelecionada) {
        card.style.display = ""; // visível (restaura)
      } else {
        card.style.display = "none";
      }
    });
  });
}

/* ==========================
   Carrossel scroll helpers
   ========================== */
window.scrollLeft = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: -300, behavior: "smooth" });
};

window.scrollRight = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: 300, behavior: "smooth" });
};

/* ==========================
   Inicialização
   ========================== */
aplicarFiltroAchadinhos();
carregarProdutos();







