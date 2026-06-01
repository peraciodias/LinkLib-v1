const API = "http://localhost:8080/links";

let todosLinks  = [];
let filtroAtual = { tipo: "todos", valor: null };
let editandoId  = null;
let treeAberta  = false;

// ─── Tema ─────────────────────────────────────────────────────────────────────

function toggleTema() {
  const atual = document.documentElement.getAttribute("data-theme");
  const novo = atual === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", novo);
  localStorage.setItem("tema", novo);
}

function carregarTema() {
  const salvo = localStorage.getItem("tema") || "light";
  document.documentElement.setAttribute("data-theme", salvo);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function carregarLinks() {
  carregarTema();
  try {
    const res = await fetch(API);
    todosLinks = await res.json();
    renderizarTree();
    aplicarFiltro();
  } catch {
    document.getElementById("app").innerHTML = "<p class='erro'>Erro ao conectar com o servidor.</p>";
  }
}

// ─── Tree ─────────────────────────────────────────────────────────────────────

function renderizarTree() {
  const tree = document.getElementById("tree");

  const totalFav  = todosLinks.filter(l => l.favorito).length;
  const total     = todosLinks.length;

  // agrupa por categoria
  const categorias = {};
  todosLinks.forEach(l => {
    const cat = l.categoria || "__sem__";
    if (!categorias[cat]) categorias[cat] = { links: [], tags: {} };
    categorias[cat].links.push(l);
    (l.tags || []).forEach(t => {
      if (!categorias[cat].tags[t]) categorias[cat].tags[t] = 0;
      categorias[cat].tags[t]++;
    });
  });

  // todas as tags globais
  const tagsGlobais = {};
  todosLinks.forEach(l => (l.tags || []).forEach(t => {
    tagsGlobais[t] = (tagsGlobais[t] || 0) + 1;
  }));

  tree.innerHTML = `
    ${noPai("todos", null, "🗂 Todos os links", total)}
    ${noPai("favoritos", null, "⭐ Favoritos", totalFav)}
    ${noSecao("Tags", Object.entries(tagsGlobais).sort().map(([t, c]) =>
      noPai("tag", t, `🏷 ${t}`, c)
    ).join(""))}
    ${noSecao("Categorias", Object.entries(categorias)
      .filter(([k]) => k !== "__sem__")
      .sort()
      .map(([cat, dados]) => {
        const tagsDaCat = Object.entries(dados.tags).sort();
        const filhos = tagsDaCat.map(([t, c]) =>
          `<li class="tree-node tree-filho" onclick="selecionarNo('tag-cat','${t}|${cat}',this)">
            <span class="tree-node-label">🏷 ${t}<span class="badge">${c}</span></span>
          </li>`
        ).join("");
        return `
          <li class="tree-node tree-pai" id="cat-${cat}">
            <div class="tree-node-label" onclick="toggleFilhos('cat-${cat}'); selecionarNo('categoria','${cat}',this)">
              <span class="chevron">${tagsDaCat.length ? "▸" : " "}</span>
              📁 ${cat}<span class="badge">${dados.links.length}</span>
            </div>
            ${filhos ? `<ul class="tree-filhos hidden">${filhos}</ul>` : ""}
          </li>`;
      }).join("")
    )}
  `;
}

function noPai(tipo, valor, label, count) {
  const v = valor ? `'${valor}'` : "null";
  return `<li class="tree-node tree-pai ${tipo === "todos" ? "ativo" : ""}"
    onclick="selecionarNo('${tipo}',${v},this)">
    <span class="tree-node-label">${label}<span class="badge">${count}</span></span>
  </li>`;
}

function noSecao(titulo, conteudo) {
  if (!conteudo) return "";
  return `<li class="tree-secao">${titulo}</li>${conteudo}`;
}

function toggleFilhos(id) {
  const pai = document.getElementById(id);
  if (!pai) return;
  const ul  = pai.querySelector(".tree-filhos");
  const ch  = pai.querySelector(".chevron");
  if (!ul) return;
  ul.classList.toggle("hidden");
  if (ch) ch.textContent = ul.classList.contains("hidden") ? "▸" : "▾";
}

function selecionarNo(tipo, valor, el) {
  document.querySelectorAll(".tree-node").forEach(n => n.classList.remove("ativo"));
  el.closest(".tree-node").classList.add("ativo");

  filtroAtual = { tipo, valor };
  document.getElementById("buscaInput").value = "";

  const labels = {
    todos:    "Todos os links",
    favoritos:"⭐ Favoritos",
    tag:      `🏷 ${valor}`,
    categoria:`📁 ${valor}`,
    "tag-cat":`🏷 ${valor?.split("|")[0]} em 📁 ${valor?.split("|")[1]}`,
  };
  document.getElementById("contexto-label").textContent = labels[tipo] || valor;

  aplicarFiltro();
  fecharTree();
}

function toggleTree() {
  treeAberta = !treeAberta;
  document.getElementById("treePanel").classList.toggle("hidden", !treeAberta);
  document.querySelector(".tree-toggle-icon").textContent = treeAberta ? "▴" : "▾";
}

function fecharTree() {
  treeAberta = false;
  document.getElementById("treePanel").classList.add("hidden");
  document.querySelector(".tree-toggle-icon").textContent = "▾";
}

// Fechar tree ao clicar fora
document.addEventListener("click", e => {
  const wrap = document.getElementById("treeWrap");
  if (wrap && !wrap.contains(e.target)) fecharTree();
});

// ─── Filtro + Busca ───────────────────────────────────────────────────────────

function aplicarFiltro() {
  const termo = document.getElementById("buscaInput").value.toLowerCase().trim();
  const { tipo, valor } = filtroAtual;

  let resultado = [...todosLinks];

  if (tipo === "favoritos") {
    resultado = resultado.filter(l => l.favorito);
  } else if (tipo === "categoria") {
    resultado = resultado.filter(l => l.categoria === valor);
  } else if (tipo === "tag") {
    resultado = resultado.filter(l => (l.tags || []).includes(valor));
  } else if (tipo === "tag-cat") {
    const [tag, cat] = valor.split("|");
    resultado = resultado.filter(l => l.categoria === cat && (l.tags || []).includes(tag));
  }

  if (termo) {
    resultado = resultado.filter(l =>
      (l.titulo  && l.titulo.toLowerCase().includes(termo))  ||
      (l.dominio && l.dominio.toLowerCase().includes(termo)) ||
      (l.url     && l.url.toLowerCase().includes(termo))     ||
      (l.legenda && l.legenda.toLowerCase().includes(termo)) ||
      (l.tags    && l.tags.some(t => t.toLowerCase().includes(termo)))
    );
  }

  renderizarLinks(resultado);
}

// ─── Renderizar cards ─────────────────────────────────────────────────────────

function renderizarLinks(links) {
  const app = document.getElementById("app");
  if (links.length === 0) {
    app.innerHTML = "<p class='vazio'>Nenhum link encontrado.</p>";
    return;
  }
  app.innerHTML = `<div class="grid">${links.map(criarCard).join("")}</div>`;
}

function criarCard(link) {
  let dominio = link.dominio;
  if (!dominio || dominio === "null") {
    try { dominio = new URL(link.url).hostname; } catch { dominio = "site.com"; }
  }

  const favicon = link.faviconPath 
    ? `http://localhost:8080/favicons/${link.faviconPath}`
    : `https://www.google.com/s2/favicons?sz=64&domain=${dominio}`;
  
  const titulo    = link.titulo || dominio;
  const estrela   = link.favorito ? "estrela ativo" : "estrela";
  const categoria = link.categoria ? `<span class="tag-cat" onclick="selecionarCategoria('${link.categoria}')">${link.categoria}</span>` : "";
  const tags      = (link.tags && link.tags.length > 0)
    ? link.tags.map(t => `<span class="tag" onclick="selecionarTag('${t}')">${t}</span>`).join("") : "";
  const legenda   = link.legenda ? `<p class="legenda">${link.legenda}</p>` : "";
  const data      = link.criadoEm ? `<p class="data">${formatarData(link.criadoEm)}</p>` : "";

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

// Clicar em tag/categoria no card filtra direto
function selecionarTag(tag) {
  filtroAtual = { tipo: "tag", valor: tag };
  document.getElementById("contexto-label").textContent = `🏷 ${tag}`;
  document.getElementById("buscaInput").value = "";
  renderizarTree();
  aplicarFiltro();
}

function selecionarCategoria(cat) {
  filtroAtual = { tipo: "categoria", valor: cat };
  document.getElementById("contexto-label").textContent = `📁 ${cat}`;
  document.getElementById("buscaInput").value = "";
  renderizarTree();
  aplicarFiltro();
}

function formatarData(isoStr) {
  try { return new Date(isoStr).toLocaleDateString("pt-BR"); } catch { return ""; }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

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

carregarLinks();
