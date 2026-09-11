// 内容来自原站 index.html 的只读快照；本文件独立维护，不会改动原站存档。
export const CONTENT = {
  name: "小欧",
  tagline: "把想法变成产品",
  about: "AI 产品经理，探索 AI、理解用户，把想法变成产品。\n关注 AI 产品、Agent 与人机协作，偶尔写点思考。",
  avatar: "./assets/personal/portrait.jpeg",
  github: "https://github.com/xiaoou-waou",
  footer: "© 2026 小欧 · 把想法变成产品",

  stats: [
    { num: "5", title: "文章", sub: "AI 与产品思考 · 持续更新" },
    { num: "11", title: "项目", sub: "Side Projects · 持续更新" },
    { num: "∞", title: "GitHub", sub: "xiaoou-waou" }
  ],

  articles: [
    {
      title: "自进化 Agent 的核心不是会反思，而是会治理经验",
      date: "2026-09-04",
      category: "Agent",
      excerpt: "反思能写出下一次怎么做，但只有被验证的变化，才有资格进入下一个版本。反思负责提出候选经验，治理决定它能不能成为版本。",
      href: "https://mp.weixin.qq.com/s/_6t4f7V0cfjEF6ZFMlYQAQ"
    },
    {
      title: "Codex 开放 Harness 后，AI 产品经理要重新设计什么",
      date: "2026-08-22",
      category: "AI 产品",
      excerpt: "Agent 的难点，正在从回答问题转向把任务送到可验收的终点。执行循环可以复用之后，产品差异化会落在哪里？",
      href: "https://mp.weixin.qq.com/s/WzW-iNLE9gJ2_YgepniEKA"
    },
    {
      title: "真正成熟的 AI 产品，都能在设计什么时候交还给人",
      date: "2026-08-14",
      category: "AI 产品",
      excerpt: "过去两年，AI 产品最明显的变化，是从「帮我想」逐渐走向「替我做」。聊天模型负责回答问题，Agent 则开始浏览网页、读取文件、调用工具，把一个多步骤任务从头推进到尾。真正成熟的 AI 产品，都懂得在什么时候把控制权交还给人。",
      href: "https://www.woshipm.com/ai/6447314.html"
    },
    {
      title: "从复制一个人，到逐步理解一个人，两款产品的AI分身实践",
      date: "2026-08-08",
      category: "AI 分身",
      excerpt: "AI 分身真正的产品难题，不是一次性生成一个「像你」的角色，而是把人的经历、偏好和表达转成可调用的资产。这篇拆解两款产品的 AI 分身实践。",
      href: "https://mp.weixin.qq.com/s/FfPVYSTr5G8jLy0ScwjR6w"
    },
    {
      title: "Second Me 的难题，不是 AI 社交，而是 AI 能不能代表你",
      date: "2026-08-06",
      category: "AI 社交",
      excerpt: "从 AI Tinder 到分身服务，个人 AI 要先解决的不是「像不像你」，而是用户为什么愿意把代表权交给它。",
      href: "https://mp.weixin.qq.com/s/dbTVLOAoK1h6k39IW7S0ug"
    }
  ],

  projects: [
    { name: "xhs-sanhuamao-writer", desc: "小红书原创图文写作与生图提示词生成 Skill", href: "https://github.com/xiaoou-waou/xhs-sanhuamao-writer" },
    { name: "zhaopianfengge-skill", desc: "AI 图片风格转换 Skill：把真实照片重组为艺术海报", href: "https://github.com/xiaoou-waou/zhaopianfengge-skill" },
    { name: "xiaoou-cinematic-video-prompt", desc: "把完整脚本拆成电影化、逐场景的视频生成提示词", href: "https://github.com/xiaoou-waou/xiaoou-cinematic-video-prompt" },
    { name: "xiaoou-material-illustrator", desc: "AI 材质插画生成 Skill", href: "https://github.com/xiaoou-waou/xiaoou-material-illustrator" },
    { name: "xiaoou-gzh-layout", desc: "公众号排版 Skill：Markdown / Word / PDF 一键排版进公众号", href: "https://github.com/xiaoou-waou/xiaoou-gzh-layout" },
    { name: "xiaoou-ai-article-writer", desc: "文章写作 Skill", href: "https://github.com/xiaoou-waou/xiaoou-ai-article-writer" },
    { name: "agent-reach", desc: "给 AI Agent 一键装上互联网能力", href: "https://github.com/xiaoou-waou/agent-reach" },
    { name: "image-recon", desc: "参考图逆向分析 Skill：场景拓扑、复刻优先级与构图拆解", href: "https://github.com/xiaoou-waou/image-recon" },
    { name: "Snaploom", desc: "在 Mac 上捕捉、标注、录制、创作的桌面工具", href: "https://github.com/xiaoou-waou/Snaploom" },
    { name: "ui-devtool", desc: "确定性 UI 设计质量检测器：专查 AI 生成页面的廉价信号", href: "https://github.com/xiaoou-waou/ui-devtool" },
    { name: "personal-homepage", desc: "这个网站本身，纯手工打造", href: "https://github.com/xiaoou-waou/personal-homepage" }
  ],

  links: [
    { text: "GitHub", href: "https://github.com/xiaoou-waou" },
    { text: "人人都是产品经理", href: "https://www.woshipm.com/u/1685328" }
  ]
};

// 展示文案仅从原简介、文章主题和已有项目提炼；不增加履历、服务或成绩。
export const PROFILE = {
  englishName: "XIAOOU",
  entry: {
    eyebrow: "FROM IDEAS TO PRODUCTS",
    welcome: "欢迎你，",
    title: "一起把想法变成产品",
    description: "我是小欧，关注 AI、Agent 与人机协作。"
  },
  portrait: { width: 896, height: 1195, alt: "小欧的个人照片" },
  role: "AI 产品 / Agent / 人机协作",
  heroLines: ["把想法", "变成产品。"],
  heroDescription: "探索 AI，理解用户。关注 AI 产品、Agent 与人机协作。",
  aboutLines: ["我是小欧。", "一个保持好奇的", "AI 产品经理。"],
  aboutDescription: "探索 AI、理解用户，把想法变成产品。这里记录我的产品思考，也分享正在做的项目。",
  dimensions: [
    {
      title: "AI 产品",
      description: "理解用户，探索 AI 能力如何成为产品，记录关于产品设计的思考。"
    },
    {
      title: "Agent",
      description: "关注 Agent 的任务执行、经验治理，以及从回答问题到完成任务的变化。"
    },
    {
      title: "人机协作",
      description: "思考 AI 何时行动、何时交还控制权，以及个人 AI 如何获得用户的信任。"
    }
  ],
  sections: {
    writing: { eyebrow: "SELECTED WRITING", title: "最近在写" },
    projects: { eyebrow: "SKILLS & TOOLS", title: "我的项目" }
  }
};
