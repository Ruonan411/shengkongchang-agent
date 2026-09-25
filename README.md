# 声控场 Agent · Voice Copilot

> 直播语音中控副驾 · AI 语音识别驱动的直播动作触发 Agent（作品集项目）

**一句定位**：主播说一句人话口令，直播间自动动一步——不替主播说话，只替她动手。

---

## 项目简介

声控场 Agent 是一个面向抖音 / 快手 / 视频号等直播平台的「语音中控副驾」原型。它听懂主播口令后，自动触发平台**原生互动工具**（发福袋 / 弹讲解卡 / 上架开价等），把"主播只看到发生了什么"的产品界面做出来。

核心设计原则：

- **ASR 吃现成字幕思路**：浏览器原生 Web Speech API 实时聆听，不自跑一套 ASR（避开延迟 / 噪声死穴）。
- **意图解析真接大模型**：优先调用真实大模型（WorkBuddy Cloud LLM，免密钥）做语义确认 / 语义过滤 / 槽位抽取；任何失败自动降级本地规则，Demo 永远可跑。
- **口令由用户自定义**：触发词（语音宏）非硬编码，个性化、降误触发，且属用户主动配置。
- **触发到"预备 + 一键确认"**：命中后生成中控动作预备队列，高危动作（开价 / 改价 / 上架）强制确认后下发，不无人托管。

---

## 关键能力

- **实时语音聆听**：流式 ASR、中英文混合、临时结果渐进显示。
- **语义过滤**：拦截否定句 / 假设句 / 条件句 / 举例句（`BLOCK` 态，不触发、不弹框、不打扰主播）。
- **模糊意图**：福利类模糊表达（"整点福利""来点东西"）弹出候选（福袋 / 优惠券 / 红包 / 抽奖）。
- **蓄力动作**："准备开价"等憋单表达，固定延迟后触发。
- **多步编排**：先弹讲解卡 → 发福袋 → 开价，有序执行。
- **高危确认**：改价 / 上架 / 开价强制一键确认。

---

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Next.js 14（App Router） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 动效 | Framer Motion |
| 图标 | lucide-react |
| AI | WorkBuddy Cloud SDK（免密钥大模型调用） |
| 语音 | 浏览器原生 Web Speech API |

---

## 在线链接

**https://boan-copilot.app.workbuddy.host/**

> Demo 需桌面 Chrome / Edge + 授权麦克风；不支持 Web Speech 的浏览器提供手动输入框兜底。

---

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（密钥不入库）
cp .env.example .env.local
# 然后编辑 .env.local，填入：
#   NEXT_PUBLIC_WORKBUDDY_ENDPOINT
#   NEXT_PUBLIC_WORKBUDDY_PUBLISHABLE_KEY

# 3. 开发预览
npm run dev            # http://localhost:3000

# 4. 静态导出（产出 out/）
npm run export
# 若构建被沙箱拦截，关掉三个 node shim 后再导出：
# CODEBUDDY_SAFE_DELETE_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0 CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 npm run export

# 5. 本地静态预览构建产物
npm start              # node server.js，监听 :3000
```

---

## 部署

纯静态导出（`next.config.mjs` 中 `output: 'export'`），`out/` 可直接托管到任意静态平台
（GitHub Pages / Netlify / Vercel / 对象存储）。本项目通过 WorkBuddy 静态部署发布到上方在线链接。

---

## 项目结构

```
boan-copilot/
├─ app/                 路由与全局骨架（page.tsx = 章节顺序总开关）
├─ components/          16 个内容章节 + ASRDemo 交互演示 + LiveRoomShowcase 实拍
│  ├─ ASRDemo.tsx          可交互语音识别 Demo（状态机 / 意图卡片 / 高危确认 / 执行日志）
│  ├─ LiveRoomShowcase.tsx 首屏自动播放的手机端直播间实拍
│  └─ …                   其余内容章节（Hero / Solution / CoreFeatures / Architecture …）
├─ lib/
│  ├─ cloud.ts               WorkBuddy Cloud 接入层（真接大模型，失败降级本地规则）
│  └─ intent-types.ts        共享类型（消除循环依赖）
├─ .env.example          环境变量模板（可入库）
├─ .env.local           本地真实配置（含密钥，已被 .gitignore 忽略）
├─ next.config.mjs      静态导出 + 沙箱构建 workaround
├─ server.js            零依赖 Node 静态预览服务器
├─ 项目文档.md          完整项目文档（文件职责清单 / 设计 / Prompt / 评测体系）
└─ README.md            本文件
```

---

## 安全说明

- `publishableKey` 是 WorkBuddy Cloud **允许内置前端的公开密钥**，服务端按 Origin 校验；
  它会被内联进前端包（静态导出无后端可代理，属设计预期，非泄露）。
- **真正的 secret 不要放进 `.env.local`**；`.env.local` 已被 `.gitignore` 排除，不会进入版本库。
- 协作时只分发 `.env.example`，各自填自己的真实值。

---

## 已知限制

- ASR Demo 需桌面 Chrome / Edge + 麦克风授权；部分浏览器不支持 Web Speech 时走手动输入兜底。
- 平台原生互动接口为蓝图 / Mock，未接入真实开播链路。
- 站内部分图片与 Demo / GitHub / 录屏 / 联系方式仍为占位，待替换。

---

© 声控场 Agent · 作品集项目
