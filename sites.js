/**
 * 站点配置（你主要改这里）
 * - kind: cn(国内) | global(国外) | material(素材网) | rates(价格模块)
 * - tags: 用于搜索的关键词
 */
window.SITE_GROUPS = [
  {
    id: "cn",
    title: "国内 AI",
    hint: "国内常用 AI / 大模型 / 办公助手",
    kind: "cn",
    sites: [
      { name: "通义千问", url: "https://tongyi.aliyun.com/", desc: "阿里通义 - 对话/写作/代码", tags: ["阿里", "通义", "写作", "代码"] },
      { name: "文心一言", url: "https://yiyan.baidu.com/", desc: "百度文心 - 对话/创作/知识问答", tags: ["百度", "文心", "创作"] },
      { name: "Kimi", url: "https://kimi.moonshot.cn/", desc: "长文本/总结/检索与写作", tags: ["长文本", "总结", "Moonshot"] },
      { name: "智谱清言", url: "https://chatglm.cn/", desc: "GLM 系列对话与工具", tags: ["智谱", "GLM", "对话"] },
      { name: "讯飞星火", url: "https://xinghuo.xfyun.cn/", desc: "讯飞 - 写作/知识/办公", tags: ["讯飞", "星火", "办公"] },
      { name: "腾讯元宝", url: "https://yuanbao.tencent.com/", desc: "腾讯 - 对话/写作/工具", tags: ["腾讯", "元宝"] },
    ],
  },
  {
    id: "material",
    title: "素材网",
    hint: "常用素材站点合集",
    kind: "material",
    sites: [
      { name: "花雕素材网", url: "http://www.huadiaosucai.com/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "肉包素材网", url: "http://roubaokr.com/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "中二日记素材网", url: "https://www.zrscw.com/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "小鑫素材网", url: "https://www.xiaoxinsc.com/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "沙雕江湖素材网", url: "https://xhlmr.cn/blogs/article", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "无限素材网", url: "https://www.wuxiansucai.com/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "钰钰素材网", url: "https://www.yuyusucai.com/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
      { name: "早班车素材网", url: "https://zbcsucai.cn/", desc: "素材资源集合站点", tags: ["素材", "设计", "资源"] },
    ],
  },
  {
    id: "rates",
    title: "ChatGPT Plus 地区价格",
    hint: "展示 ChatGPT Plus 各地区价格",
    kind: "rates",
    base: "CNY",
    symbols: ["USD", "EUR", "JPY", "HKD", "GBP", "SGD", "KRW"],
  },
  {
    id: "global",
    title: "国外 AI",
    hint: "海外 AI / 工具（可能需要网络条件）",
    kind: "global",
    sites: [
      { name: "ChatGPT", url: "https://chat.openai.com/", desc: "通用对话/写作/代码", tags: ["OpenAI", "对话", "代码"] },
      { name: "Claude", url: "https://claude.ai/", desc: "写作与长文档处理强", tags: ["Anthropic", "长文档", "写作"] },
      { name: "Gemini", url: "https://gemini.google.com/", desc: "Google AI 助手", tags: ["Google", "Gemini"] },
      { name: "Perplexity", url: "https://www.perplexity.ai/", desc: "AI 搜索与问答", tags: ["搜索", "问答"] },
    ],
  },
];
