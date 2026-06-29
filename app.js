const SITE_GROUPS = window.SITE_GROUPS || [];
const $ = (sel) => document.querySelector(sel);
const app = $("#app");
const empty = $("#empty");
const count = $("#count");
const q = $("#q");
const toggleCompact = $("#toggleCompact");
const openFirst = $("#openFirst");
const RATE_API = "https://open.er-api.com/v6/latest/CNY";
const PLUS_PRICE_API = "https://fronted.familypro.io/familypro/resource/triple/price/ChatGPT_config_updated.json";
const RATE_REFRESH_MS = 5 * 60 * 1000;
const PLUS_PRICE_REFRESH_MS = 30 * 60 * 1000;
const RATE_LABELS = {
  USD: "美元",
  EUR: "欧元",
  JPY: "日元",
  HKD: "港币",
  GBP: "英镑",
  SGD: "新加坡元",
  KRW: "韩元",
};

let compact = false;
let lastRender = { matched: 0, total: 0, firstUrl: null };
let rateState = {
  status: "idle",
  data: null,
  error: "",
  loadedAt: null,
};
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
  if (kind === "rates") return "汇率";
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

  const liveRates = rateState.data?.rates || {};
  const liveRate = liveRates[code];
  if (Number.isFinite(liveRate) && liveRate > 0) {
    return 1 / liveRate;
  }

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

function buildRateCards(group) {
  const cards = document.createElement("div");
  cards.className = "rateCards";

  if (rateState.status === "loading" || rateState.status === "idle") {
    const codes = group.symbols || [];
    for (const code of codes) {
      const card = document.createElement("div");
      card.className = "rateCard rateSkeleton";
      card.innerHTML = `
        <div class="rateTop">
          <div>
            <div class="rateCode">${escapeHtml(code)}</div>
            <div class="rateLabel">${escapeHtml(currencyLabel(code))}</div>
          </div>
          <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
        </div>
        <div class="rateValue">--</div>
        <div class="rateMeta">正在获取最新数据</div>
      `;
      cards.appendChild(card);
    }
    return cards;
  }

  if (rateState.status === "error") {
    const card = document.createElement("div");
    card.className = "rateCard rateError";
    card.innerHTML = `
      <div class="rateTop">
        <div>
          <div class="rateCode">汇率加载失败</div>
          <div class="rateLabel">请稍后重试</div>
        </div>
        <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
      </div>
      <div class="rateErrorText">${escapeHtml(rateState.error || "无法获取汇率数据")}</div>
    `;
    cards.appendChild(card);
    return cards;
  }

  const data = rateState.data || {};
  const base = data.base_code || group.base || "CNY";
  const rates = data.rates || {};
  for (const code of group.symbols || []) {
    const rate = rates[code];
    const card = document.createElement("div");
    card.className = "rateCard";
    card.innerHTML = `
      <div class="rateTop">
        <div>
          <div class="rateCode">${escapeHtml(code)}</div>
          <div class="rateLabel">${escapeHtml(currencyLabel(code))}</div>
        </div>
        <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
      </div>
      <div class="rateValue">1 ${escapeHtml(base)} = ${escapeHtml(formatRateValue(rate))} ${escapeHtml(code)}</div>
      <div class="rateMeta">${escapeHtml(base)} 作为基准自动换算</div>
    `;
    cards.appendChild(card);
  }

  return cards;
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
          <div class="priceCountry">${escapeHtml(item.country)}</div>
          <div class="priceRegion">${escapeHtml(item.currency)} · ChatGPT Plus</div>
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

function buildRatesSection(group) {
  const section = document.createElement("section");
  section.className = "section";
  section.dataset.groupId = group.id;

  const head = document.createElement("div");
  head.className = "sectionHead";

  const title = document.createElement("div");
  title.className = "sectionTitle";

  const updatedText = rateState.loadedAt
    ? new Date(rateState.loadedAt).toLocaleString("zh-CN", { hour12: false })
    : "未更新";
  const statusText =
    rateState.status === "loading" ? "加载中" :
    rateState.status === "error" ? "失败" :
    rateState.status === "loaded" ? "已更新" :
    "待加载";

  title.innerHTML = getPriceLabel(group, statusText, updatedText);

  const actions = document.createElement("div");
  actions.className = "sectionActions";

  const refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.className = "linkBtn";
  refreshBtn.textContent = "刷新数据";
  refreshBtn.title = "重新拉取实时汇率和 GPT Plus 地区价格";
  refreshBtn.addEventListener("click", () => {
    refreshPricing(true);
  });

  actions.appendChild(refreshBtn);
  head.appendChild(title);
  head.appendChild(actions);
  section.appendChild(head);

  const moduleWrap = document.createElement("div");
  moduleWrap.className = "moduleWrap";

  const fxBlock = document.createElement("div");
  fxBlock.className = "moduleBlock";
  fxBlock.innerHTML = `
    <div class="moduleBlockHead">
      <div>
        <div class="moduleTitle">实时汇率</div>
        <div class="moduleMeta">以 CNY 为基准，供下方价格换算使用</div>
      </div>
      <span class="chip kind-rates">${escapeHtml(kindLabel(group.kind))}</span>
    </div>
  `;
  fxBlock.appendChild(buildRateCards(group));

  const priceHead = document.createElement("div");
  priceHead.className = "moduleBlockHead moduleBlockHeadCompact";
  const priceUpdatedText = plusPriceState.loadedAt
    ? new Date(plusPriceState.loadedAt).toLocaleString("zh-CN", { hour12: false })
    : "未更新";
  const priceStatusText =
    plusPriceState.status === "loading" ? "加载中" :
    plusPriceState.status === "error" ? "失败" :
    plusPriceState.status === "loaded" ? "已更新" :
    "待加载";
  priceHead.innerHTML = `
    <div>
      <div class="moduleTitle">ChatGPT Plus 地区价格</div>
      <div class="moduleMeta">公开价格配置 + 当前实时汇率，结果按人民币约值排序</div>
    </div>
    <span class="badge">${escapeHtml(priceStatusText)} · ${escapeHtml(priceUpdatedText)}</span>
  `;

  const priceBlock = document.createElement("div");
  priceBlock.className = "moduleBlock";
  priceBlock.appendChild(priceHead);
  priceBlock.appendChild(buildPlusPriceCards(group));

  moduleWrap.appendChild(fxBlock);
  moduleWrap.appendChild(priceBlock);
  section.appendChild(moduleWrap);
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
    const built = group.kind === "rates"
      ? buildRatesSection(group)
      : buildSection(group, query);
    app.appendChild(built.section);
    matched += built.matched;
    total += built.total;
    if (!firstUrl && built.firstUrl) firstUrl = built.firstUrl;
  }

  lastRender = { matched, total, firstUrl };
  empty.style.display = "none";
  count.textContent = `共 ${matched} / ${total} 个站点 · 1 个实时汇率模块`;
}

function openFirstResult() {
  if (lastRender.firstUrl) {
    window.open(lastRender.firstUrl, "_blank", "noopener,noreferrer");
  }
}

async function loadRates(silent = false) {
  if (!silent) {
    rateState = { ...rateState, status: "loading", error: "" };
    render();
  } else {
    rateState = { ...rateState, status: "loading", error: "" };
  }

  try {
    const response = await fetch(RATE_API, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.result !== "success") {
      throw new Error(data["error-type"] || "汇率接口返回异常");
    }

    rateState = {
      status: "loaded",
      data,
      error: "",
      loadedAt: Date.now(),
    };
  } catch (error) {
    rateState = {
      status: "error",
      data: null,
      error: error instanceof Error ? error.message : "无法获取汇率数据",
      loadedAt: rateState.loadedAt,
    };
  }

  render();
}

async function loadPlusPrices(silent = false) {
  if (!silent) {
    plusPriceState = { ...plusPriceState, status: "loading", error: "" };
    render();
  } else {
    plusPriceState = { ...plusPriceState, status: "loading", error: "" };
  }

  try {
    const response = await fetch(PLUS_PRICE_API, { cache: "no-store" });
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
    plusPriceState = {
      status: "error",
      data: null,
      error: error instanceof Error ? error.message : "无法获取地区价格数据",
      loadedAt: plusPriceState.loadedAt,
    };
  }

  render();
}

function refreshPricing(silent = false) {
  loadRates(silent);
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
refreshPricing();
setInterval(() => loadRates(true), RATE_REFRESH_MS);
setInterval(() => loadPlusPrices(true), PLUS_PRICE_REFRESH_MS);
