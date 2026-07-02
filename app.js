const SITE_GROUPS = window.SITE_GROUPS || [];
const $ = (sel) => document.querySelector(sel);
const app = $("#app");
const empty = $("#empty");
const count = $("#count");
const q = $("#q");
const toggleCompact = $("#toggleCompact");
const openFirst = $("#openFirst");
const openAll = $("#openAll");
const collapseAll = $("#collapseAll");
const PLUS_PRICE_API = "https://fronted.familypro.io/familypro/resource/triple/price/ChatGPT_config_updated.json";
const RATE_LABELS = {
  USD: "美元",
  EUR: "欧元",
  JPY: "日元",
  HKD: "港币",
  GBP: "英镑",
  SGD: "新加坡元",
  KRW: "韩元",
};
const COUNTRY_LABELS = {
  America: "美国",
  Malaysia: "马来西亚",
  French: "法国",
  England: "英国",
  Australia: "澳大利亚",
  Pakistan: "巴基斯坦",
  Philippines: "菲律宾",
  Canada: "加拿大",
  Turkey: "土耳其",
  India: "印度",
  Nigeria: "尼日利亚",
  Brazil: "巴西",
  Japan: "日本",
  Germany: "德国",
  Italy: "意大利",
  "South Korea": "韩国",
  Afghanistan: "阿富汗",
  Algeria: "阿尔及利亚",
  Angola: "安哥拉",
  Argentina: "阿根廷",
  Austria: "奥地利",
  Azerbaijan: "阿塞拜疆",
  Belgium: "比利时",
  Bolivia: "玻利维亚",
  Cambodia: "柬埔寨",
  Chile: "智利",
  Danmark: "丹麦",
  "Czech Republic": "捷克",
  Cyprus: "塞浦路斯",
  Nicuador: "厄瓜多尔",
  Egypt: "埃及",
  Finland: "芬兰",
  Greece: "希腊",
  Ghana: "加纳",
  Hungary: "匈牙利",
  Indonesia: "印度尼西亚",
  Iraq: "伊拉克",
  Ireland: "爱尔兰",
  Israel: "以色列",
  Kazakhstan: "哈萨克斯坦",
  Kenya: "肯尼亚",
  lebanon: "黎巴嫩",
  Libya: "利比亚",
  Mexico: "墨西哥",
  Myanmar: "缅甸",
  Netherlands: "荷兰",
  "New Zealand": "新西兰",
  Norway: "挪威",
  Panama: "巴拿马",
  Poland: "波兰",
  Portugal: "葡萄牙",
  Qatar: "卡塔尔",
  Romania: "罗马尼亚",
  "Saudi Arabia": "沙特阿拉伯",
  Singapore: "新加坡",
  "South Africa": "南非",
  Spain: "西班牙",
  Sweden: "瑞典",
  Switzerland: "瑞士",
  Taiwan: "中国台湾",
  Thailand: "泰国",
  Ukraine: "乌克兰",
  "United Arab Emirates": "阿联酋",
  Vietnam: "越南",
};

let compact = false;
let lastRender = { matched: 0, total: 0, firstUrl: null };
let collapsedSections = new Set();
let plusPriceState = {
  status: "idle",
  data: null,
  error: "",
  loadedAt: null,
};

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
  if (kind === "rates") return "价格";
  return "其他";
}

function kindChipClass(kind) {
  if (kind === "cn") return "kind-cn";
  if (kind === "global") return "kind-global";
  if (kind === "material") return "kind-material";
  if (kind === "rates") return "kind-rates";
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

function currencyLabel(code) {
  return RATE_LABELS[code] || code;
}

function countryLabel(name) {
  return COUNTRY_LABELS[name] || name;
}

function formatRateValue(value) {
  if (!Number.isFinite(value)) return "-";
  if (value >= 100) return value.toFixed(2);
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

function formatMoney(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getCnyPerCurrency(currencyCode) {
  const code = String(currencyCode || "").toUpperCase();
  if (!code || code === "CNY") return 1;

  const fallbackRates = plusPriceState.data?.exchange_rates || {};
  const fallback = fallbackRates[`CNY_PER_${code}`];
  if (Number.isFinite(fallback) && fallback > 0) {
    return fallback;
  }

  return NaN;
}

function convertToCny(price, currencyCode) {
  const cnyPerUnit = getCnyPerCurrency(currencyCode);
  if (!Number.isFinite(cnyPerUnit)) return NaN;
  return price * cnyPerUnit;
}

function getPriceLabel(group, statusText, updatedText) {
  return `
    <h2>${escapeHtml(group.title)}</h2>
    <span class="badge" title="${escapeAttr(group.hint || "")}">${escapeHtml(statusText)} · ${escapeHtml(updatedText)}</span>
  `;
}

function buildPlusPriceCards(group) {
  const cards = document.createElement("div");
  cards.className = "priceCards";

  if (plusPriceState.status === "loading" || plusPriceState.status === "idle") {
    const skeletonCount = 8;
    for (let i = 0; i < skeletonCount; i += 1) {
      const card = document.createElement("div");
      card.className = "priceCard rateSkeleton";
      card.innerHTML = `
        <div class="priceTop">
          <div>
            <div class="priceCountry">ChatGPT Plus</div>
            <div class="priceRegion">正在获取地区价格</div>
          </div>
          <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
        </div>
        <div class="priceLine">--</div>
        <div class="priceLine muted">--</div>
      `;
      cards.appendChild(card);
    }
    return cards;
  }

  if (plusPriceState.status === "error") {
    const card = document.createElement("div");
    card.className = "priceCard priceError";
    card.innerHTML = `
      <div class="priceTop">
        <div>
          <div class="priceCountry">地区价格加载失败</div>
          <div class="priceRegion">请稍后重试</div>
        </div>
        <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
      </div>
      <div class="rateErrorText">${escapeHtml(plusPriceState.error || "无法获取地区价格数据")}</div>
    `;
    cards.appendChild(card);
    return cards;
  }

  const countryConfig = plusPriceState.data?.country_config || {};
  const regions = Object.entries(countryConfig)
    .map(([country, cfg]) => {
      const plusPlan = (cfg.price_list || []).find((item) => item.plan_name === "ChatGPT Plus");
      const localPrice = Number(plusPlan?.price);
      const cnyPrice = convertToCny(localPrice, cfg.currency);
      const cnyPerUnit = getCnyPerCurrency(cfg.currency);
      return {
        country,
        currency: cfg.currency || "",
        symbol: cfg.symbol || "",
        localPrice,
        cnyPrice,
        cnyPerUnit,
      };
    })
    .filter((item) => Number.isFinite(item.localPrice))
    .sort((a, b) => {
      const av = Number.isFinite(a.cnyPrice) ? a.cnyPrice : Number.POSITIVE_INFINITY;
      const bv = Number.isFinite(b.cnyPrice) ? b.cnyPrice : Number.POSITIVE_INFINITY;
      return av - bv;
    });

  for (const item of regions) {
    const card = document.createElement("div");
    card.className = "priceCard";
    const localText = `${item.symbol || ""}${formatMoney(item.localPrice, item.localPrice >= 100 ? 0 : 2)}`;
    const cnyText = Number.isFinite(item.cnyPrice)
      ? `≈ ￥${formatMoney(item.cnyPrice, item.cnyPrice >= 100 ? 0 : 2)}`
      : "人民币换算失败";
    const fxText = Number.isFinite(item.cnyPerUnit)
      ? `1 ${item.currency} ≈ ￥${formatMoney(item.cnyPerUnit, item.cnyPerUnit >= 10 ? 2 : 4)}`
      : "汇率不可用";
    card.innerHTML = `
      <div class="priceTop">
        <div>
          <div class="priceCountry">${escapeHtml(countryLabel(item.country))}</div>
          <div class="priceRegion">${escapeHtml(item.country)} · ${escapeHtml(item.currency)} · ChatGPT Plus</div>
        </div>
        <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
      </div>
      <div class="priceLine">${escapeHtml(localText)}</div>
      <div class="priceLine muted">${escapeHtml(cnyText)}</div>
      <div class="priceMeta">${escapeHtml(fxText)}</div>
    `;
    cards.appendChild(card);
  }

  return cards;
}

function buildPlusPriceSection(group) {
  const section = document.createElement("section");
  section.className = "section";
  section.dataset.groupId = group.id;

  const head = document.createElement("div");
  head.className = "sectionHead";

  const title = document.createElement("div");
  title.className = "sectionTitle";

  const updatedText = plusPriceState.loadedAt
    ? new Date(plusPriceState.loadedAt).toLocaleString("zh-CN", { hour12: false })
    : "未更新";
  const statusText =
    plusPriceState.status === "loading" ? "加载中" :
    plusPriceState.status === "error" ? "失败" :
    plusPriceState.status === "loaded" ? "已更新" :
    "待加载";

  title.innerHTML = getPriceLabel(group, statusText, updatedText);

  const actions = document.createElement("div");
  actions.className = "sectionActions";

  const collapseBtn = document.createElement("button");
  collapseBtn.type = "button";
  collapseBtn.className = "linkBtn";
  collapseBtn.textContent = "折叠/展开";
  collapseBtn.dataset.action = "collapse";
  collapseBtn.addEventListener("click", () => {
    setSectionCollapsed(section, !section.classList.contains("is-collapsed"));
  });

  const refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.className = "linkBtn";
  refreshBtn.textContent = "刷新价格";
  refreshBtn.title = "重新拉取 ChatGPT Plus 地区价格";
  refreshBtn.addEventListener("click", () => {
    loadPlusPrices(true);
  });

  actions.appendChild(refreshBtn);
  actions.appendChild(collapseBtn);
  head.appendChild(title);
  head.appendChild(actions);
  section.appendChild(head);

  const priceUpdatedText = plusPriceState.loadedAt
    ? new Date(plusPriceState.loadedAt).toLocaleString("zh-CN", { hour12: false })
    : "未更新";
  const priceStatusText =
    plusPriceState.status === "loading" ? "加载中" :
    plusPriceState.status === "error" ? "失败" :
    plusPriceState.status === "loaded" ? "已更新" :
    "待加载";
  const priceHead = document.createElement("div");
  priceHead.className = "sectionSubhead";
  priceHead.innerHTML = `
    <div>
      <div class="moduleTitle">ChatGPT Plus 地区价格</div>
      <div class="moduleMeta">公开价格配置，按人民币约值排序</div>
    </div>
    <span class="badge">${escapeHtml(priceStatusText)} · ${escapeHtml(priceUpdatedText)}</span>
  `;
  section.appendChild(priceHead);
  section.appendChild(buildPlusPriceCards(group));
  setSectionCollapsed(section, collapsedSections.has(group.id));
  return { section, matched: 0, total: 0, firstUrl: null };
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
  collapseBtn.dataset.action = "collapse";
  collapseBtn.addEventListener("click", () => {
    setSectionCollapsed(section, !section.classList.contains("is-collapsed"));
  });

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

  openAllBtn.addEventListener("click", () => {
    for (const s of filtered) window.open(s.url, "_blank", "noopener,noreferrer");
  });

  setSectionCollapsed(section, collapsedSections.has(group.id));

  return { section, matched: filtered.length, total: sites.length, firstUrl: filtered[0]?.url ?? null };
}

function render() {
  const query = normalize(q.value);
  app.innerHTML = "";

  let matched = 0;
  let total = 0;
  let firstUrl = null;

  for (const group of SITE_GROUPS) {
    const built = group.kind === "rates"
      ? buildPlusPriceSection(group)
      : buildSection(group, query);
    app.appendChild(built.section);
    matched += built.matched;
    total += built.total;
    if (!firstUrl && built.firstUrl) firstUrl = built.firstUrl;
  }

  lastRender = { matched, total, firstUrl };
  empty.style.display = "none";
  count.textContent = `共 ${matched} / ${total} 个站点 · 1 个 ChatGPT Plus 价格模块`;
  syncCollapseAllButton();
}

function openFirstResult() {
  if (lastRender.firstUrl) {
    window.open(lastRender.firstUrl, "_blank", "noopener,noreferrer");
  }
}

async function loadPlusPrices(silent = false) {
  if (!silent) {
    plusPriceState = { ...plusPriceState, status: "loading", error: "" };
    render();
  } else {
    plusPriceState = { ...plusPriceState, status: "loading", error: "" };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(PLUS_PRICE_API, { cache: "no-store", signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.country_config) {
      throw new Error("价格配置格式异常");
    }

    plusPriceState = {
      status: "loaded",
      data,
      error: "",
      loadedAt: Date.now(),
    };
  } catch (error) {
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "请求超时"
      : error instanceof Error
        ? error.message
        : "无法获取地区价格数据";
    plusPriceState = {
      status: "error",
      data: null,
      error: message,
      loadedAt: plusPriceState.loadedAt,
    };
  } finally {
    window.clearTimeout(timer);
  }

  render();
}

function refreshPricing(silent = false) {
  loadPlusPrices(silent);
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

function setSectionCollapsed(section, collapsed) {
  const isCollapsed = Boolean(collapsed);
  section.classList.toggle("is-collapsed", isCollapsed);
  section.dataset.collapsed = isCollapsed ? "true" : "false";

  const bodyNodes = Array.from(section.children).slice(1);
  for (const node of bodyNodes) {
    node.hidden = isCollapsed;
  }

  const collapseBtn = section.querySelector('[data-action="collapse"]');
  if (collapseBtn) {
    collapseBtn.textContent = isCollapsed ? "展开" : "折叠/展开";
  }

  const groupId = section.dataset.groupId;
  if (!groupId) return;
  if (isCollapsed) {
    collapsedSections.add(groupId);
  } else {
    collapsedSections.delete(groupId);
  }
  syncCollapseAllButton();
}

function syncCollapseAllButton() {
  if (!collapseAll) return;
  const sections = Array.from(document.querySelectorAll(".section"));
  const shouldCollapse = sections.some((section) => !section.classList.contains("is-collapsed"));
  collapseAll.textContent = shouldCollapse ? "全部折叠" : "全部展开";
}

q.addEventListener("input", render);
toggleCompact.addEventListener("click", () => {
  compact = !compact;
  toggleCompact.setAttribute("aria-pressed", compact ? "true" : "false");
  render();
});
openFirst.addEventListener("click", openFirstResult);
openAll.addEventListener("click", () => {
  for (const card of document.querySelectorAll(".card")) {
    const url = card.dataset.url;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }
});
collapseAll.addEventListener("click", () => {
  const sections = Array.from(document.querySelectorAll(".section"));
  const collapse = sections.some((section) => !section.classList.contains("is-collapsed"));
  for (const section of sections) {
    setSectionCollapsed(section, collapse);
  }
});

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
refreshPricing();
