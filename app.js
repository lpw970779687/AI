const SITE_GROUPS = window.SITE_GROUPS || [];
const $ = (sel) => document.querySelector(sel);
const app = $("#app");
const empty = $("#empty");
const count = $("#count");
const q = $("#q");
const toggleCompact = $("#toggleCompact");
const openFirst = $("#openFirst");

let compact = false;
let lastRender = { matched: 0, total: 0, firstUrl: null };

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

function siteText(site) {
  return normalize([
    site.name,
    site.desc,
    (site.tags || []).join(" "),
    site.url,
  ].join(" "));
}

function kindLabel(kind) {
  if (kind === "cn") return "国内";
  if (kind === "global") return "国外";
  if (kind === "material") return "素材";
  return "其他";
}

function kindChipClass(kind) {
  if (kind === "cn") return "kind-cn";
  if (kind === "global") return "kind-global";
  if (kind === "material") return "kind-material";
  return "";
}

function faviconUrl(url) {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function buildSection(group, query) {
  const sites = group.sites || [];
  const filtered = query
    ? sites.filter((s) => siteText(s).includes(query))
    : sites.slice();

  const section = document.createElement("section");
  section.className = "section";
  section.dataset.groupId = group.id;

  const head = document.createElement("div");
  head.className = "sectionHead";

  const title = document.createElement("div");
  title.className = "sectionTitle";
  title.innerHTML = `
    <h2>${escapeHtml(group.title)}</h2>
    <span class="badge" title="${escapeAttr(group.hint || "")}">${filtered.length}/${sites.length}</span>
  `;

  const actions = document.createElement("div");
  actions.className = "sectionActions";

  const collapseBtn = document.createElement("button");
  collapseBtn.type = "button";
  collapseBtn.className = "linkBtn";
  collapseBtn.textContent = "折叠/展开";

  const openAllBtn = document.createElement("button");
  openAllBtn.type = "button";
  openAllBtn.className = "linkBtn";
  openAllBtn.textContent = "全部打开";
  openAllBtn.title = "可能会触发浏览器拦截弹窗";

  actions.appendChild(openAllBtn);
  actions.appendChild(collapseBtn);

  head.appendChild(title);
  head.appendChild(actions);
  section.appendChild(head);

  const cards = document.createElement("div");
  cards.className = "cards";

  for (const site of filtered) {
    const a = document.createElement("a");
    a.className = "card";
    if (compact) a.classList.add("card-compact");
    a.href = site.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.dataset.url = site.url;

    const f = faviconUrl(site.url);

    a.innerHTML = `
      <div class="cardTop">
        <div class="cardBody">
          <div class="row">
            <img class="favicon" alt="" src="${escapeAttr(f)}" onerror="this.classList.add('is-hidden')" />
            <div class="name" title="${escapeAttr(site.name)}">${escapeHtml(site.name)}</div>
          </div>
          <p class="desc">${escapeHtml(site.desc || "")}</p>
        </div>
        <div class="meta" aria-hidden="true">
          <span class="chip ${kindChipClass(group.kind)}">${kindLabel(group.kind)}</span>
        </div>
      </div>
      <div class="meta">
        ${(site.tags || []).slice(0, 6).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}
      </div>
    `;

    cards.appendChild(a);
  }

  section.appendChild(cards);

  let collapsed = false;
  collapseBtn.addEventListener("click", () => {
    collapsed = !collapsed;
    cards.style.display = collapsed ? "none" : "grid";
  });

  openAllBtn.addEventListener("click", () => {
    for (const s of filtered) window.open(s.url, "_blank", "noopener,noreferrer");
  });

  return { section, matched: filtered.length, total: sites.length, firstUrl: filtered[0]?.url ?? null };
}

function render() {
  const query = normalize(q.value);
  app.innerHTML = "";

  let matched = 0;
  let total = 0;
  let firstUrl = null;

  for (const group of SITE_GROUPS) {
    const built = buildSection(group, query);
    app.appendChild(built.section);
    matched += built.matched;
    total += built.total;
    if (!firstUrl && built.firstUrl) firstUrl = built.firstUrl;
  }

  lastRender = { matched, total, firstUrl };
  empty.style.display = matched === 0 ? "block" : "none";
  count.textContent = `共 ${matched} / ${total} 个站点`;
}

function openFirstResult() {
  if (lastRender.firstUrl) {
    window.open(lastRender.firstUrl, "_blank", "noopener,noreferrer");
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", " ");
}

q.addEventListener("input", render);
toggleCompact.addEventListener("click", () => {
  compact = !compact;
  toggleCompact.setAttribute("aria-pressed", compact ? "true" : "false");
  render();
});
openFirst.addEventListener("click", openFirstResult);

window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== q) {
    e.preventDefault();
    q.focus();
    q.select();
  }
  if (e.key === "Escape") {
    if (document.activeElement === q || q.value) {
      q.value = "";
      render();
      q.blur();
    }
  }
  if (e.key === "Enter" && document.activeElement === q) {
    e.preventDefault();
    openFirstResult();
  }
});

render();
