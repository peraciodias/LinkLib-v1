const API = "http://localhost:8000/links";

let todosLinks = [];
let filtroAtual = "todos";
let editandoId = null;

// ─── Carregar e renderizar ────────────────────────────────────────────────────

async function carregarLinks() {
  try {
    const res = await fetch(API);
    todosLinks = await res.json();
    renderizarFiltrosCategorias();
    renderizarLinks(todosLinks);
  } catch (err) {
    document.getElementById("app").innerHTML = "<p class='erro'>Erro ao conectar com o servidor.</p>";
  }
}

function renderizarLinks(links) {
  const app = document.getElementById("app");
  if (links.length === 0) {
    app.innerHTML = "<p class='vazio'>Nenhum link encontrado.</p>";
    return;
  }
  app.innerHTML = `<div class="grid">${links.map(criarCard).join("")}</div>`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function criarCard(link) {
  let dominio = link.dominio;
  if (!dominio || dominio === "null") {
    try { dominio = new URL(link.url).hostname; } catch { dominio = "site.com"; }
  }

  const favicon   = `https://www.google.com/s2/favicons?sz=64&domain=${dominio}`;
  const titulo    = link.titulo || dominio;
  const estrela   = link.favorito ? "estrela ativo" : "estrela";
  const categoria = link.categoria ? `<span class="tag-cat">${link.categoria}</span>` : "";
  const tags      = (link.tags && link.tags.length > 0)
    ? link.tags.map(t => `<span class="tag">${t}</span>`).join("") : "";
  const legenda   = link.legenda ? `<p class="legenda">${link.legenda}</p>` : "";
  const data      = link.criadoEm ? `<p class="data">Adicionado em ${formatarData(link.criadoEm)}</p>` : "";

  return `
    <div class="card">
      <button class="delete-btn" onclick="deletarLink('${link.id}')" title="Remover">🗑</button>
      <button class="${estrela}" onclick="toggleFavorito('${link.id}', ${link.favorito})" title="Favorito">⭐</button>

      <img src="${favicon}" class="favicon" onerror="this.style.display='none'"/>

      <div class="title">${titulo}</div>
      ${categoria}
      <a href="${link.url}" target="_blank">${dominio}</a>
      ${tags ? `<div class="tags">${tags}</div>` : ""}
      ${legenda}
      ${data}
      <button class="edit-btn" onclick="abrirModalEditar('${link.id}')">✏️ Editar</button>
    </div>
  `;
}

function formatarData(isoStr) {
  try { return new Date(isoStr).toLocaleDateString("pt-BR"); } catch { return ""; }
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

function renderizarFiltrosCategorias() {
  const categorias = [...new Set(todosLinks.map(l => l.categoria).filter(Boolean))];
  const container = document.getElementById("filtros-categorias");
  container.innerHTML = categorias.map(c =>
    `<button class="filtro-btn" onclick="filtrar('${c}', this)">${c}</button>`
  ).join("");
}

function filtrar(tipo, btn) {
  document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  filtroAtual = tipo;
  // limpa busca ao trocar filtro
  document.getElementById("buscaInput").value = "";
  aplicarFiltro();
}

function buscar(termo) {
  // ao buscar, reseta o filtro de categoria visualmente mas mantém lógica
  aplicarFiltro(termo);
}

function aplicarFiltro(termoBusca) {
  const termo = (termoBusca ?? document.getElementById("buscaInput").value).toLowerCase().trim();

  let resultado = todosLinks;

  // 1. filtro de categoria/favoritos
  if (filtroAtual === "favoritos") {
    resultado = resultado.filter(l => l.favorito);
  } else if (filtroAtual !== "todos") {
    resultado = resultado.filter(l => l.categoria === filtroAtual);
  }

  // 2. filtro de texto — busca em título, domínio, url, tags e legenda
  if (termo) {
    resultado = resultado.filter(l =>
      (l.titulo   && l.titulo.toLowerCase().includes(termo))   ||
      (l.dominio  && l.dominio.toLowerCase().includes(termo))  ||
      (l.url      && l.url.toLowerCase().includes(termo))      ||
      (l.legenda  && l.legenda.toLowerCase().includes(termo))  ||
      (l.tags     && l.tags.some(t => t.toLowerCase().includes(termo)))
    );
  }

  renderizarLinks(resultado);
}

// ─── Modal Adicionar ──────────────────────────────────────────────────────────

function abrirModalComUrl() {
  const urlInput = document.getElementById("urlInput");
  editandoId = null;
  document.getElementById("modal-titulo").textContent = "Adicionar Link";
  document.getElementById("btnSalvar").textContent = "Salvar";
  document.getElementById("modalUrl").value = urlInput.value.trim();
  document.getElementById("modalUrl").disabled = false;
  document.getElementById("modalTitulo").value = "";
  document.getElementById("modalCategoria").value = "";
  document.getElementById("modalTags").value = "";
  document.getElementById("modalLegenda").value = "";
  document.getElementById("modalFavorito").checked = false;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modalUrl").focus();
  urlInput.value = "";
}

function abrirModalEditar(id) {
  const link = todosLinks.find(l => l.id === id);
  if (!link) return;
  editandoId = id;
  document.getElementById("modal-titulo").textContent = "Editar Link";
  document.getElementById("btnSalvar").textContent = "Atualizar";
  document.getElementById("modalUrl").value = link.url;
  document.getElementById("modalUrl").disabled = true;
  document.getElementById("modalTitulo").value = link.titulo || "";
  document.getElementById("modalCategoria").value = link.categoria || "";
  document.getElementById("modalTags").value = (link.tags || []).join(", ");
  document.getElementById("modalLegenda").value = link.legenda || "";
  document.getElementById("modalFavorito").checked = link.favorito || false;
  document.getElementById("modal").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modalUrl").disabled = false;
  editandoId = null;
}

// ─── Salvar / Atualizar ───────────────────────────────────────────────────────

async function salvarModal() {
  if (editandoId) await atualizarLink();
  else await criarLink();
}

async function criarLink() {
  const url = document.getElementById("modalUrl").value.trim();
  if (!url) { mostrarToast("Informe uma URL!"); return; }
  if (!url.startsWith("http") && !url.includes(".")) { mostrarToast("URL inválida."); return; }

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  if (res.status === 409) { mostrarToast("Esse link já foi salvo!"); return; }
  if (!res.ok) { mostrarToast("Erro ao salvar."); return; }

  const link = await res.json();

  const titulo    = document.getElementById("modalTitulo").value.trim();
  const categoria = document.getElementById("modalCategoria").value.trim();
  const tagsStr   = document.getElementById("modalTags").value.trim();
  const legenda   = document.getElementById("modalLegenda").value.trim();
  const favorito  = document.getElementById("modalFavorito").checked;

  if (titulo || categoria || tagsStr || legenda || favorito) {
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];
    await fetch(`${API}/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: titulo || undefined, categoria: categoria || undefined, tags, legenda: legenda || undefined, favorito })
    });
  }

  fecharModal();
  await carregarLinks();
  mostrarToast("Link salvo!");
}

async function atualizarLink() {
  const titulo    = document.getElementById("modalTitulo").value.trim();
  const categoria = document.getElementById("modalCategoria").value.trim();
  const tagsStr   = document.getElementById("modalTags").value.trim();
  const legenda   = document.getElementById("modalLegenda").value.trim();
  const favorito  = document.getElementById("modalFavorito").checked;
  const tags      = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

  const res = await fetch(`${API}/${editandoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo, categoria, tags, legenda, favorito })
  });

  if (!res.ok) { mostrarToast("Erro ao atualizar."); return; }
  fecharModal();
  await carregarLinks();
  mostrarToast("Link atualizado!");
}

// ─── Ações do card ────────────────────────────────────────────────────────────

async function deletarLink(id) {
  if (!confirm("Deseja remover este link?")) return;
  await fetch(`${API}/${id}`, { method: "DELETE" });
  await carregarLinks();
  mostrarToast("Link removido.");
}

async function toggleFavorito(id, atual) {
  await fetch(`${API}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorito: !atual })
  });
  await carregarLinks();
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
carregarLinks();
