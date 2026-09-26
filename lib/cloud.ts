// 声控场 Agent —— WorkBuddy Cloud Service 接入层（免密钥大模型调用）
//
// 配置来源：.env.local（已被 .gitignore 忽略，不进版本库）。
// 通过 NEXT_PUBLIC_* 在「构建时」内联进前端包。该值为 publishableKey，是
// WorkBuddy Cloud 允许内置前端的公开值（不携带权限，服务端按 Origin 精确匹配）。
// 切勿在此写入任何 secret key / 用户令牌——密钥只存在于 .env.local 与构建产物，
// 不在源码与 git 仓库中。
//
// 行为：意图解析“优先调用真实大模型”做语义确认与槽位抽取，任何失败（网络 /
// 鉴权 / 超时 / 解析异常 / 未配置密钥）一律返回 null，由调用方降级到本地规则
// Mock，保证 Demo 永远可跑。

import type { Intent, ActionKey, Command, Slot } from "@/lib/intent-types";

// 构建时由 Next.js 注入（来自 .env.local 的 NEXT_PUBLIC_*）。
// 运行时在浏览器中已是内联字面量；若构建期未配置则留空 → 自动降级本地 Mock。
const WB_ENDPOINT = process.env.NEXT_PUBLIC_WORKBUDDY_ENDPOINT ?? "";
const WB_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_WORKBUDDY_PUBLISHABLE_KEY ?? "";

const ACTION_KEYSET: ActionKey[] = [
  "fudai",
  "explain",
  "list",
  "modify",
  "prepare",
  "coupon",
  "redpacket",
  "lottery",
];

// 高危动作（与 ASRDemo 中 HIGH_RISK 保持一致）：上架 / 改价 强制确认
const HIGH_RISK: Record<ActionKey, boolean> = {
  fudai: false,
  explain: false,
  list: true,
  modify: true,
  prepare: false,
  coupon: false,
  redpacket: false,
  lottery: false,
};

type CloudClient = {
  llm: {
    models: {
      list: () => Promise<
        Array<{ id: string; name?: string; disabled?: boolean; onlyReasoning?: boolean }>
      >;
    };
    chat: { completions: { create: (args: Record<string, unknown>) => AsyncIterable<Record<string, any>> } };
  };
};

// 实时语音场控对延迟极敏感：优先选「非推理 / 低延迟」模型，避免默认 auto 路由到
// 推理大模型（会先吐一大段 reasoning_content，慢且贵）。hunyuan-chat 实测 4s 内
// 返回 schema 合规 JSON，最适合在线意图解析。
const FAST_MODEL_PREFERENCE = ["hunyuan-chat", "hunyuan-turbos", "default"];

let clientPromise: Promise<CloudClient> | null = null;

// 懒加载 SDK：仅在浏览器、且仅在首次调用时发生，避免静态导出预渲染阶段触碰浏览器全局。
async function getCloud(): Promise<CloudClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const mod = (await import("@tencent-ai/workbuddy-cloud-sdk")) as unknown as {
        createWorkBuddyCloud: (opts: {
          endpoint: string;
          publishableKey: string;
        }) => CloudClient;
      };
      return mod.createWorkBuddyCloud({
        endpoint: WB_ENDPOINT,
        publishableKey: WB_PUBLISHABLE_KEY,
      });
    })();
  }
  return clientPromise;
}

let modelId: string | null = null;

async function getModelId(cloud: CloudClient): Promise<string | null> {
  if (modelId) return modelId;
  const models = await cloud.llm.models.list();
  const usable = (models ?? []).filter((m) => m.disabled !== true);
  if (!usable.length) return null;
  // 1) 优先命中人工挑选的低延迟非推理模型
  const preferred = usable.find((m) => FAST_MODEL_PREFERENCE.includes(m.id));
  if (preferred) {
    modelId = preferred.id;
    return modelId;
  }
  // 2) 否则挑第一个明确「非仅推理」的模型，避开推理大模型
  const nonReasoning = usable.find((m) => m.onlyReasoning !== true);
  if (nonReasoning) {
    modelId = nonReasoning.id;
    return modelId;
  }
  // 3) 兜底：随便一个可用模型（仍会工作，只是可能偏慢）
  modelId = usable[0].id;
  return modelId;
}

// 暴露最近一次实际选用的模型，供 UI 日志展示（证明货真价实调用了哪个模型）。
export const cloudStatus: { lastModel: string | null } = { lastModel: null };

function uid(): string {
  return `llm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function validKey(s: unknown): ActionKey | null {
  return typeof s === "string" && (ACTION_KEYSET as string[]).includes(s)
    ? (s as ActionKey)
    : null;
}

const SYSTEM_PROMPT = `你是直播场景下的动作意图理解 Agent。你的职责是：
1) 理解主播真实意图；
2) 过滤否定句 / 假设句 / 条件句 / 举例句 / 回顾句；
3) 分类为 明确指令 / 模棱两可 / 蓄力动作 / 无动作。
只输出 JSON，不要任何解释文字。

用户自填口令（keyword → action）：
__COMMANDS__

硬性安全约束：只有上面列出的口令 / 动作类型才允许触发。如果说话内容涉及未配置的动作（例如没有配置优惠券口令，主播却说"发个优惠券"），一律 action="NONE"、semantic_filter="BLOCK"，reason 写明"口令未配置，未触发"。

约束：
- 否定句（“今天不发福袋了”）、假设 / 条件句（“如果在线到一千人就发福袋”）、举例 / 回顾句（“上次有个主播说发福袋”）：action="NONE"，semantic_filter="BLOCK"；
- 蓄力动作（“准备开价”“准备上链接”等憋单表达）：action="prepare"，action_type="PREPARE"；
- 模棱两可（“整点福利”“来点东西”“送点福利”等福利类模糊表达）：action_type="AMBIGUOUS"，candidates 给出 2–4 个候选 action（从 fudai / coupon / redpacket / lottery 中选）；
- 多步指令（含“先…再…然后…接着…最后”等顺序词且包含 ≥2 个动作）：action_type="EXECUTE"，actions 给出有序动作数组；
- 明确指令：action_type="EXECUTE"，semantic_filter="PASS"，confidence ≥ 0.9；
- action 只能取「用户自填口令」映射中出现过的 action 之一，或 NONE；candidates（模棱两可候选）同样只能从已配置动作中选择，绝不可输出未配置的动作。

输出严格 JSON，字段如下：
{
  "action": "fudai",
  "action_type": "EXECUTE",
  "semantic_filter": "PASS",
  "ambiguity": false,
  "confidence": 0.96,
  "candidates": [],
  "actions": [],
  "slots": [{ "key": "price", "label": "开价", "value": "¥99" }],
  "reason": "主播明确说发福袋，非否定/假设句，高置信直接执行"
}`;

/**
 * 调用真实大模型做意图解析。成功返回 Intent；任何失败返回 null（调用方降级本地 Mock）。
 */
export async function parseIntentViaLLM(
  text: string,
  commands: Command[]
): Promise<Intent | null> {
  try {
    // 未配置云端密钥（构建期无 .env.local）→ 直接降级本地规则，不发起请求
    if (!WB_PUBLISHABLE_KEY || !WB_ENDPOINT) return null;

    const cloud = await getCloud();
    const model = await getModelId(cloud);
    if (!model) return null;
    cloudStatus.lastModel = model;

    const system = SYSTEM_PROMPT.replace(
      "__COMMANDS__",
      commands.map((c) => `- "${c.keyword}" => ${c.action}`).join("\n")
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    let answer = "";
    try {
      const stream = cloud.llm.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `ASR 文本：${text}` },
        ],
        stream: true,
        response_format: { type: "json_object" },
        signal: controller.signal,
      });
      for await (const chunk of stream) {
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") answer += delta;
      }
    } finally {
      clearTimeout(timer);
    }

    const parsed = JSON.parse(answer) as Record<string, unknown>;
    const action = validKey(parsed.action);

    // 硬闸：只放行「口令配置」中出现过的动作。模型幻觉输出未配置动作时，
    // 一律降级 null，由调用方走本地规则（本地同样只认已配置口令）。
    const allowed = new Set(commands.map((c) => c.action));

    // 拦截 / 无动作
    if (parsed.semantic_filter === "BLOCK" || parsed.action === "NONE" || !action) {
      if (parsed.semantic_filter === "BLOCK" || parsed.action === "NONE") {
        return {
          uid: uid(),
          keyword: text.slice(0, 12),
          action: "fudai",
          actionType: "NONE",
          semanticFilter: "BLOCK",
          filterReason: typeof parsed.reason === "string" ? parsed.reason : "语义过滤拦截",
          ambiguity: false,
          confidence: 0.99,
          slots: [],
          highRisk: false,
          note: "语义过滤拦截：不触发、不弹框、不打扰主播",
        };
      }
      return null; // action 非法 → 降级
    }

    const actionType = (parsed.action_type as Intent["actionType"]) ?? "EXECUTE";
    const ambiguity = Boolean(parsed.ambiguity) || actionType === "AMBIGUOUS";
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(0.99, parsed.confidence))
        : 0.9;

    const slots: Slot[] = Array.isArray(parsed.slots)
      ? (parsed.slots as Array<{ key?: unknown; label?: unknown; value?: unknown }>)
          .filter((s) => s && (s.key || s.label))
          .map((s) => ({
            key: String(s.key ?? ""),
            label: String(s.label ?? s.key ?? ""),
            value: String(s.value ?? ""),
          }))
      : [];

    // 多步编排
    if (actionType === "EXECUTE" && Array.isArray(parsed.actions)) {
      const multi = (parsed.actions as unknown[])
        .map(validKey)
        .filter((x): x is ActionKey => x !== null && allowed.has(x));
      if (multi.length >= 2) {
        return {
          uid: uid(),
          keyword: "多步指令",
          action: multi[0],
          actionType: "EXECUTE",
          semanticFilter: "PASS",
          ambiguity: false,
          confidence,
          slots: [],
          highRisk: false,
          multiActions: multi,
          note: `多步编排：${multi.map((a) => ACTION_LABEL[a]).join(" → ")}`,
        };
      }
    }

    // 模棱两可候选兜底（旧行为会硬编码全量福利列表，现已收紧为已配置动作）
    if (ambiguity) {
      const candidates = Array.isArray(parsed.candidates)
        ? (parsed.candidates as unknown[])
            .map(validKey)
            .filter((x): x is ActionKey => x !== null && allowed.has(x))
        : [];
      if (!candidates.length) return null; // 候选里没有已配置动作 → 降级本地
      return {
        uid: uid(),
        keyword: text.slice(0, 12),
        action: action ?? "fudai",
        actionType: "AMBIGUOUS",
        semanticFilter: "PASS",
        ambiguity: true,
        confidence,
        slots,
        highRisk: false,
        candidates: candidates,
        note: "福利类模糊意图：弹出候选，主播选择后执行",
      };
    }

    // 单步执行 / 蓄力（未配置动作在此拦截）
    if (!allowed.has(action)) return null;
    return {
      uid: uid(),
      keyword: text.slice(0, 12),
      action,
      actionType,
      semanticFilter: "PASS",
      ambiguity: false,
      confidence,
      slots,
      highRisk: HIGH_RISK[action],
      note: typeof parsed.reason === "string" ? parsed.reason : undefined,
    };
  } catch {
    return null; // 任何异常（网络 / 鉴权 / 超时 / JSON 解析）→ 降级本地 Mock
  }
}

const ACTION_LABEL: Record<ActionKey, string> = {
  fudai: "发放福袋",
  explain: "弹出讲解卡",
  list: "上架商品",
  modify: "修改售价",
  prepare: "准备开价(蓄力)",
  coupon: "发放优惠券",
  redpacket: "发放红包",
  lottery: "发起抽奖",
};
