/**
 * 站点配置（你主要改这里）
 * - kind: cn(国内) | global(国外) | sg(国网/内网/专项)
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
    id: "sg",
    title: "国网 AI（可自定义）",
    hint: "放你们内部/国网相关的 AI 入口（如需要内网访问）",
    kind: "sg",
    sites: [
      {
        name: "国网 AI 入口（示例）",
        url: "https://example.com/",
        desc: "把这里改成你的“国网 AI”实际网址",
        tags: ["国网", "内网", "SGCC", "专项"],
      },
    ],
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
