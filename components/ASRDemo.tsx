"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Mic,
  MicOff,
  Plus,
  Trash2,
  Gift,
  Presentation,
  Tag,
  Link2,
  Check,
  AlertCircle,
  Keyboard,
  Radio,
  ShieldAlert,
  ScrollText,
  Hourglass,
  Ticket,
  Coins,
  Dices,
  Smartphone,
  Filter,
  ListChecks,
} from "lucide-react";

import { parseIntentViaLLM, cloudStatus } from "@/lib/cloud";

/* ------------------------------------------------------------------ */
/* Web Speech API 最小类型声明                                         */
/* ------------------------------------------------------------------ */
interface ISpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface ISpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: ISpeechRecognitionResultLike };
}
interface ISpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: ISpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognitionLike;
    webkitSpeechRecognition?: new () => ISpeechRecognitionLike;
  }
}

/* ------------------------------------------------------------------ */
/* 平台原生互动动作                                                    */
/* ------------------------------------------------------------------ */
import type { ActionKey, Command, Slot, Intent, IntentActionType } from "@/lib/intent-types";

const ACTION_META: Record<
  ActionKey,
  { label: string; icon: ReactNode; tint: string; en: string }
> = {
  fudai: { label: "发放福袋", icon: <Gift className="h-4 w-4" />, tint: "text-warn border-warn/30 bg-warn/10", en: "FUDAI" },
  explain: { label: "弹出讲解卡", icon: <Presentation className="h-4 w-4" />, tint: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10", en: "EXPLAIN" },
  list: { label: "上架商品", icon: <Link2 className="h-4 w-4" />, tint: "text-accent-blue border-accent-blue/30 bg-accent-blue/10", en: "LIST" },
  modify: { label: "修改售价", icon: <Tag className="h-4 w-4" />, tint: "text-safe border-safe/30 bg-safe/10", en: "MODIFY" },
  prepare: { label: "准备开价(蓄力)", icon: <Hourglass className="h-4 w-4" />, tint: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10", en: "PREPARE" },
  coupon: { label: "发放优惠券", icon: <Ticket className="h-4 w-4" />, tint: "text-accent-blue border-accent-blue/30 bg-accent-blue/10", en: "COUPON" },
  redpacket: { label: "发放红包", icon: <Coins className="h-4 w-4" />, tint: "text-warn border-warn/30 bg-warn/10", en: "REDPACKET" },
  lottery: { label: "发起抽奖", icon: <Dices className="h-4 w-4" />, tint: "text-safe border-safe/30 bg-safe/10", en: "LOTTERY" },
};

const ACTION_OPTIONS: ActionKey[] = [
  "fudai", "explain", "list", "modify", "prepare", "coupon", "redpacket", "lottery",
];

/* 高危动作：上架 / 改价 强制确认（蓄力动作单独走策略，不在此列） */
const HIGH_RISK: Record<ActionKey, boolean> = {
  fudai: false, explain: false, list: true, modify: true,
  prepare: false, coupon: false, redpacket: false, lottery: false,
};

/* 特定动作口令 */
const ACTION_KEYWORDS: Record<ActionKey, string[]> = {
  fudai: ["发福袋", "上福利", "来个福袋", "发个福袋", "整个福袋"],
  explain: ["讲一下", "讲解", "弹讲解", "讲讲", "讲这款"],
  list: ["上架", "上链接", "弹链接", "上号链接", "上架商品"],
  modify: ["改价", "开价", "降价", "改到"],
  prepare: ["准备开价", "准备上", "准备放", "准备上车", "准备开"],
  coupon: ["优惠券", "发券", "放券", "发优惠券"],
  redpacket: ["红包", "发红包"],
  lottery: ["抽奖", "抽个奖"],
};

const AMBIGUITY_TRIGGERS = ["整点福利", "来点福利", "送点东西", "送福利", "来点惊喜", "整点惊喜", "给点好处", "整点好"];
const SEQUENCE_WORDS = ["先", "再", "然后", "接着", "最后", "顺序", "随后"];

const DEFAULT_COMMANDS: Command[] = [
  { id: "c1", keyword: "上福利", action: "fudai" },
  { id: "c2", keyword: "讲一下", action: "explain" },
  { id: "c3", keyword: "上架", action: "list" },
  { id: "c4", keyword: "改价", action: "modify" },
  { id: "c5", keyword: "准备开价", action: "prepare" },
];

interface QueuedAction {
  uid: string;
  action: ActionKey;
  keyword: string;
  confidence: number;
  highRisk: boolean;
  status: "pending" | "executed" | "cancelled" | "preparing";
  at: number;
}

interface LogEntry {
  id: string;
  ts: string;
  level: "info" | "warn" | "ok" | "err";
  text: string;
}

type DemoState =
  | "IDLE" | "LISTENING" | "ASR_STREAMING" | "INTENT_PARSING"
  | "SEMANTIC_FILTER" | "EXECUTING" | "PREPARE_STATE" | "CANDIDATE_DISPLAY"
  | "PLAN_EXECUTE" | "DONE" | "BLOCKED" | "FAILED";

const SPINE: DemoState[] = [
  "IDLE", "LISTENING", "ASR_STREAMING", "INTENT_PARSING", "SEMANTIC_FILTER",
];

type PrepareStrategy = "fixed" | "command" | "condition" | "manual";
const STRATEGY_META: Record<PrepareStrategy, { label: string; hint: string }> = {
  fixed: { label: "固定延迟", hint: "触发后 6 秒自动开价（演示）" },
  command: { label: "口令触发", hint: "主播说“上车”时开价" },
  condition: { label: "条件触发", hint: "在线人数达标时开价" },
  manual: { label: "手动触发", hint: "点按钮开价" },
};

/* ------------------------------------------------------------------ */
/* 中文数字 / 金额解析（沙盒 Mock，非真实 LLM）                          */
/* ------------------------------------------------------------------ */
const CN: Record<string, number> = {
  零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
function cnToNum(s: string): number {
  if (!s) return 0;
  if (s.includes("十")) {
    const parts = s.split("十");
    const left = parts[0] ? CN[parts[0]] ?? 0 : 1;
    const right = parts[1] ? CN[parts[1]] ?? 0 : 0;
    return left * 10 + right;
  }
  let sum = 0;
  for (const ch of s) sum = sum * 10 + (CN[ch] ?? 0);
  return sum;
}
function parseAmount(text: string): number | null {
  const dm = text.match(/(\d+(?:\.\d+)?)/);
  if (dm) return parseFloat(dm[1]);
  const block = text.match(/([零一二两三四五六七八九十]+)\s*(?:块|元|圆)(?:([零一二两三四五六七八九十]+)\s*(?:毛|角))?/);
  if (block) {
    const intPart = cnToNum(block[1]);
    const dec = block[2] ? cnToNum(block[2]) : 0;
    return intPart + dec / 10;
  }
  const pure = text.match(/([零一二两三四五六七八九十]+)/);
  if (pure) {
    const n = cnToNum(pure[1]);
    if (n >= 1 && n <= 9999) return n;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 语义过滤（沙盒启发式，模拟 LLM 语义理解）                            */
/* ------------------------------------------------------------------ */
function semanticFilter(text: string): { result: "PASS" | "BLOCK"; reason?: string } {
  if (/(不|没|别|勿|不用|不要)(要|用|会|能)?\s*(发|开|上|讲|弹|准备|抽|放|改|降)/.test(text))
    return { result: "BLOCK", reason: "否定句" };
  if (/(如果|假如|假设|一旦|若|当.{0,10}时|等.{0,10}就)/.test(text))
    return { result: "BLOCK", reason: "假设 / 条件句" };
  if (/(上次|比如|例如|听说|那个主播|有个主播|别人家|之前有个|别人)/.test(text))
    return { result: "BLOCK", reason: "举例句 / 回顾句" };
  return { result: "PASS" };
}

function rawDetectActions(text: string): ActionKey[] {
  const found: ActionKey[] = [];
  (Object.keys(ACTION_KEYWORDS) as ActionKey[]).forEach((k) => {
    if (k === "prepare") return; // 蓄力单独处理
    if (ACTION_KEYWORDS[k].some((kw) => text.includes(kw))) found.push(k);
  });
  return found;
}

/* 本地规则（降级 Mock）：语义确认 + 槽位抽取。
   核心安全约束：只有「口令配置」中配置过的动作类型才可触发；
   听起来像指令但未配置 → 明确拦截提示，绝不执行。 */
function runParse(text: string, commands: Command[]): Intent | null {
  const filter = semanticFilter(text);
  const uid = `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const configured = new Set(commands.map((c) => c.action));

  if (filter.result === "BLOCK") {
    return {
      uid, keyword: text.slice(0, 12), action: "fudai", actionType: "NONE",
      semanticFilter: "BLOCK", filterReason: filter.reason, ambiguity: false,
      confidence: 0.99, slots: [], highRisk: false, note: `${filter.reason}：不触发、不弹框、不打扰主播`,
    };
  }

  // 未配置口令拦截：识别到动作语义，但该动作不在口令配置中 → 不执行
  const raw = rawDetectActions(text);
  const prepareWanted = ACTION_KEYWORDS.prepare.some((kw) => text.includes(kw));
  const matchedConfigured = raw.filter((a) => configured.has(a));
  if (
    matchedConfigured.length === 0 &&
    !(prepareWanted && configured.has("prepare")) &&
    (raw.length > 0 || prepareWanted)
  ) {
    const missing: ActionKey = prepareWanted && !configured.has("prepare") ? "prepare" : raw[0];
    return {
      uid, keyword: ACTION_META[missing].label, action: missing, actionType: "NONE",
      semanticFilter: "BLOCK", filterReason: "口令未配置",
      ambiguity: false, confidence: 0.99, slots: [], highRisk: false,
      note: "该动作未在左侧「口令配置」中设置，不会触发；添加口令后即可语音启用",
    };
  }

  // 蓄力动作（仅当 prepare 已配置）
  if (configured.has("prepare") && prepareWanted) {
    const price = parseAmount(text);
    const slots: Slot[] = [];
    if (price != null) slots.push({ key: "price", label: "开价", value: `¥${price}` });
    return {
      uid, keyword: "准备开价", action: "prepare", actionType: "PREPARE",
      semanticFilter: "PASS", ambiguity: false, confidence: 0.94, slots,
      highRisk: false, note: "蓄力动作：不立即执行，按用户预设策略触发",
    };
  }

  // 多步编排（动作全部来自已配置口令）
  const seq = SEQUENCE_WORDS.some((w) => text.includes(w));
  const actions = matchedConfigured;
  if (seq && actions.length >= 2) {
    return {
      uid, keyword: "多步指令", action: actions[0], actionType: "EXECUTE",
      semanticFilter: "PASS", ambiguity: false, confidence: 0.94, slots: [],
      highRisk: false, multiActions: actions, note: `多步编排：${actions.map((a) => ACTION_META[a].label).join(" → ")}`,
    };
  }

  // 模棱两可（候选仅限已配置动作）
  if (AMBIGUITY_TRIGGERS.some((t) => text.includes(t)) && actions.length === 0) {
    const candidates = (["fudai", "coupon", "redpacket", "lottery"] as ActionKey[]).filter((a) => configured.has(a));
    if (!candidates.length) return null;
    return {
      uid, keyword: text.slice(0, 12), action: "fudai", actionType: "AMBIGUOUS",
      semanticFilter: "PASS", ambiguity: true, confidence: 0.72, slots: [],
      highRisk: false, candidates,
      note: "福利类模糊意图：弹出候选，主播选择后执行",
    };
  }

  // 特定动作（用户口令优先；同义词仅在动作已配置时生效）
  let best: { action: ActionKey; kw: string } | null = null;
  for (const c of commands) {
    if (c.keyword.trim() && text.includes(c.keyword.trim())) { best = { action: c.action, kw: c.keyword }; break; }
  }
  if (!best && actions.length > 0) best = { action: actions[0], kw: ACTION_META[actions[0]].label };

  if (!best) return null;

  const action = best.action;
  const slots: Slot[] = [];
  if (action === "modify") {
    const price = parseAmount(text);
    if (price != null) slots.push({ key: "price", label: "改后价格", value: `¥${price}` });
  }
  if (action === "fudai") {
    const thr = parseAmount(text);
    if (thr != null) slots.push({ key: "threshold", label: "福袋门槛", value: `¥${thr}` });
  }
  const pno = text.match(/第?\s*([0-9一二三四五六七八九十]+)\s*号?\s*(?:链接|款|商品|号)/);
  if (pno) slots.push({ key: "productNo", label: "目标商品", value: `${pno[1]}号` });

  const required = action === "modify" ? ["price"] : action === "list" ? ["productNo"] : [];
  const haveRequired = required.every((r) => slots.some((s) => s.key === r));

  let conf = 0.8;
  let note: string | undefined;
  if (haveRequired) conf += 0.15;
  else if (required.length) { conf = 0.62; note = "关键槽位未抽取到，已按默认参数执行"; }
  conf = Math.min(0.99, conf);

  return {
    uid, keyword: best.kw, action, actionType: "EXECUTE",
    semanticFilter: "PASS", ambiguity: false, confidence: Number(conf.toFixed(2)),
    slots, highRisk: HIGH_RISK[action], note,
  };
}

/* 业务流转 8 场景预设 */
const SCENARIOS = [
  { type: "EXECUTE", label: "明确指令", text: "给大家发个福袋，倒计时 3 分钟" },
  { type: "BLOCK", label: "否定句", text: "今天不发福袋了" },
  { type: "BLOCK", label: "条件句", text: "如果在线到一千人，我们就发福袋" },
  { type: "AMBIGUOUS", label: "模棱两可", text: "给家人们整点福利" },
  { type: "PREPARE", label: "蓄力动作", text: "准备开价" },
  { type: "MULTI", label: "多步编排", text: "先弹讲解卡，再发福袋，然后开价" },
  { type: "HIGH_RISK", label: "高危确认", text: "上架 1 号链接" },
  { type: "NONE", label: "未配置口令", text: "发个优惠券" },
];

const STATE_GLOSS: Record<DemoState, string> = {
  IDLE: "空闲", LISTENING: "聆听中", ASR_STREAMING: "流式识别",
  INTENT_PARSING: "意图解析", SEMANTIC_FILTER: "语义过滤", EXECUTING: "执行中",
  PREPARE_STATE: "蓄力中", CANDIDATE_DISPLAY: "候选展示", PLAN_EXECUTE: "多步编排",
  DONE: "已完成", BLOCKED: "已拦截", FAILED: "未识别",
};

export function ASRDemo() {
  const [commands, setCommands] = useState<Command[]>(DEFAULT_COMMANDS);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [asrError, setAsrError] = useState("");

  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const [state, setState] = useState<DemoState>("IDLE");
  const [pending, setPending] = useState<Intent | null>(null);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [prepareStrategy, setPrepareStrategy] = useState<PrepareStrategy>("fixed");

  /* 手机端直播间模拟器状态（展示层） */
  const [live, setLive] = useState<{ fudai: string | null; explain: boolean; price: "idle" | "preparing" | "set"; priceValue: string | null }>({
    fudai: null, explain: false, price: "idle", priceValue: null,
  });

  const recRef = useRef<ISpeechRecognitionLike | null>(null);
  const keepListeningRef = useRef(false);
  const startStampRef = useRef<number>(0);
  const prepareTimerRef = useRef<number | null>(null);

  const logRef = useRef<LogEntry[]>([]);
  const pushLog = useCallback((level: LogEntry["level"], text: string) => {
    const entry: LogEntry = {
      id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      ts: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
      level, text,
    };
    logRef.current = [entry, ...logRef.current].slice(0, 50);
    setLog(logRef.current);
  }, []);

  /* ---- 真正执行一个动作（更新队列 + 模拟器 + 日志） ---- */
  const executeAction = useCallback(
    (action: ActionKey, slots: Slot[], via?: string) => {
      const meta = ACTION_META[action];
      setQueue((q) => [
        { uid: `q-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, action, keyword: meta.label, confidence: 0.96, highRisk: HIGH_RISK[action], status: "executed", at: Date.now() },
        ...q,
      ]);
      setLive((s) => {
        if (action === "fudai") return { ...s, fudai: "发放中 03:00" };
        if (action === "explain") return { ...s, explain: true };
        if (action === "modify" || action === "list") {
          const price = slots.find((x) => x.key === "price")?.value;
          return { ...s, price: "set", priceValue: price ?? "¥99" };
        }
        return s;
      });
      pushLog("ok", `${via ? via + "：" : ""}已执行 ${meta.label}${slots.length ? "（" + slots.map((x) => `${x.label} ${x.value}`).join("，") + "）" : ""}`);
    },
    [pushLog]
  );

  /* 蓄力动作：固定延迟到点触发 */
  const triggerPrepareByTimer = useCallback(() => {
    setLive((s) => ({ ...s, price: "set", priceValue: "¥99" }));
    setQueue((q) => [
      { uid: `q-${Date.now()}-pre`, action: "modify", keyword: "开价", confidence: 0.96, highRisk: false, status: "executed", at: Date.now() },
      ...q,
    ]);
    setPending((p) => (p ? { ...p, resolved: true } : p));
    setState("DONE");
    pushLog("ok", "蓄力动作触发（固定延迟 6s）：开价 → ¥99");
  }, [pushLog]);

  /* ---- 处理一句口令：驱动状态机 ---- */
  const processUtterance = useCallback(
    (text: string) => {
      const now = performance.now();
      setState("INTENT_PARSING");
      pushLog("info", `ASR 识别到：“${text}”`);
      if (startStampRef.current > 0) setLastLatency(Math.round(now - startStampRef.current));

      window.setTimeout(() => {
        void (async () => {
        setState("SEMANTIC_FILTER");
        let intent: Intent | null = await parseIntentViaLLM(text, commands);
        const usedRealLLM = intent !== null;
        const engine = usedRealLLM
          ? `真实大模型语义确认（${cloudStatus.lastModel ?? "LLM"}）`
          : "本地规则降级（Mock）";
        if (!intent) intent = runParse(text, commands);
        if (!intent) {
          setState("FAILED");
          pushLog("err", "未匹配到已配置口令，已忽略 —— 只有左侧「口令配置」中的口令可触发");
          return;
        }
        pushLog("info", `意图解析引擎：${engine}`);
        if (intent.semanticFilter === "BLOCK") {
          setPending(intent);
          setState("BLOCKED");
          pushLog("warn", `语义过滤拦截（${intent.filterReason}）：不触发、不弹框`);
          return;
        }

        setPending(intent);
        pushLog("info", `意图识别：${ACTION_META[intent.action].label}（置信度 ${intent.confidence.toFixed(2)}）`);
        if (intent.note) pushLog("warn", intent.note);
        if (intent.slots.length) pushLog("info", `槽位：${intent.slots.map((s) => `${s.label} ${s.value}`).join("，")}`);

        if (intent.actionType === "PREPARE") {
          setState("PREPARE_STATE");
          setPrepareStrategy("fixed");
          pushLog("warn", "蓄力动作：价格卡片显示“准备中……”，等待触发策略");
          if (prepareTimerRef.current) window.clearTimeout(prepareTimerRef.current);
          prepareTimerRef.current = window.setTimeout(() => triggerPrepareByTimer(), 6000);
          return;
        }

        if (intent.ambiguity && intent.candidates) {
          setState("CANDIDATE_DISPLAY");
          pushLog("warn", "模棱两可：弹出候选卡片，等待主播选择");
          return;
        }

        if (intent.multiActions && intent.multiActions.length >= 2) {
          setState("PLAN_EXECUTE");
          intent.multiActions.forEach((a, i) => {
            window.setTimeout(() => {
              executeAction(a, [], "多步编排");
              if (i === intent.multiActions!.length - 1) { setState("DONE"); pushLog("ok", "多步编排执行完毕"); }
            }, 500 * (i + 1));
          });
          return;
        }

        // 单步 EXECUTE
        setQueue((q) => [
          { uid: intent.uid, action: intent.action, keyword: intent.keyword, confidence: intent.confidence, highRisk: intent.highRisk, status: intent.highRisk ? "pending" : "preparing", at: Date.now() },
          ...q,
        ]);
        if (intent.highRisk) {
          setState("EXECUTING");
          pushLog("warn", `高危动作待确认：${ACTION_META[intent.action].label}`);
        } else {
          setState("EXECUTING");
          window.setTimeout(() => {
            executeAction(intent.action, intent.slots);
            setPending((p) => (p && p.uid === intent.uid ? { ...p, resolved: true } : p));
            setState("DONE");
          }, 360);
        }
        })();
      }, 300);
    },
    [commands, pushLog, executeAction, triggerPrepareByTimer]
  );

  const confirmHighRisk = useCallback(
    (uid: string) => {
      const it = queue.find((x) => x.uid === uid);
      setState("EXECUTING");
      setPending((p) => (p && p.uid === uid ? { ...p, resolved: true } : p));
      window.setTimeout(() => {
        if (it) executeAction(it.action, [], "");
        setState("DONE");
      }, 320);
    },
    [queue, executeAction, pushLog]
  );

  const cancelAction = useCallback(
    (uid: string) => {
      setQueue((q) => q.map((x) => (x.uid === uid ? { ...x, status: "cancelled" } : x)));
      setPending((p) => (p && p.uid === uid ? { ...p, resolved: true, cancelled: true } : p));
      setState("IDLE");
      pushLog("warn", "已取消该动作");
    },
    [pushLog]
  );

  /* 模棱两可：主播选择候选 */
  const pickCandidate = useCallback(
    (action: ActionKey) => {
      setPending((p) => (p ? { ...p, resolved: true } : p));
      setState("EXECUTING");
      window.setTimeout(() => {
        executeAction(action, []);
        setState("DONE");
      }, 320);
    },
    [executeAction, pushLog]
  );

  /* 蓄力动作：非固定策略手动触发 */
  const triggerPrepareManual = useCallback(() => {
    if (prepareStrategy === "fixed") { if (prepareTimerRef.current) window.clearTimeout(prepareTimerRef.current); triggerPrepareByTimer(); return; }
    triggerPrepareByTimer();
  }, [prepareStrategy, triggerPrepareByTimer]);

  /* ---- 语音识别 ---- */
  const stopRec = useCallback(() => {
    keepListeningRef.current = false;
    recRef.current?.stop();
    setListening(false);
    setState("IDLE");
  }, []);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); setManualMode(true); return; }
    setSupported(true); setAsrError("");
    startStampRef.current = performance.now();
    setState("LISTENING");
    const rec = new SR();
    rec.lang = "zh-CN"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: ISpeechRecognitionEventLike) => {
      let finalBuf = ""; let interimBuf = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const res = e.results[i];
        const transcript = res[0]?.transcript ?? "";
        if (res.isFinal) finalBuf += transcript; else interimBuf += transcript;
      }
      if (finalBuf) { setFinalText((prev) => prev + finalBuf); processUtterance(finalBuf.trim()); }
      setInterimText(interimBuf);
      if (interimBuf) setState("ASR_STREAMING");
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setAsrError("麦克风权限被拒绝。请允许麦克风，或用下方“手动模拟”输入框体验。");
        keepListeningRef.current = false; setListening(false); setState("IDLE");
      } else if (e.error !== "no-speech") setAsrError(`语音识别出错：${e.error}`);
    };
    rec.onend = () => {
      if (keepListeningRef.current) { try { rec.start(); } catch { /* 竞态忽略 */ } }
      else setListening(false);
    };
    recRef.current = rec; keepListeningRef.current = true;
    try { rec.start(); setListening(true); } catch { setAsrError("无法启动语音识别，请刷新后重试，或使用手动模拟。"); }
  }, [finalText, processUtterance]);

  useEffect(() => {
    return () => { keepListeningRef.current = false; recRef.current?.stop(); if (prepareTimerRef.current) window.clearTimeout(prepareTimerRef.current); };
  }, []);

  const reset = useCallback(() => {
    keepListeningRef.current = false; recRef.current?.stop();
    if (prepareTimerRef.current) window.clearTimeout(prepareTimerRef.current);
    setListening(false); setFinalText(""); setInterimText(""); setPending(null);
    setQueue([]); setLog([]); logRef.current = []; setLastLatency(null); setManualInput("");
    setLive({ fudai: null, explain: false, price: "idle", priceValue: null });
    setState("IDLE");
  }, []);

  const onManualSubmit = useCallback(
    (text: string) => {
      setFinalText((p) => p + (p ? "，" : "") + text);
      setInterimText(""); setState("ASR_STREAMING");
      processUtterance(text); setManualInput("");
    },
    [finalText, processUtterance]
  );

  const updateCmd = (id: string, patch: Partial<Command>) =>
    setCommands((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCmd = () => setCommands((cs) => [...cs, { id: `c${Date.now()}`, keyword: "新口令", action: "fudai" }]);
  const removeCmd = (id: string) => setCommands((cs) => cs.filter((c) => c.id !== id));

  const combinedText = finalText + interimText;
  const branchLabel =
    state === "BLOCKED" ? "BLOCKED" : state === "PREPARE_STATE" ? "PREPARE_STATE"
    : state === "CANDIDATE_DISPLAY" ? "CANDIDATE_DISPLAY" : state === "PLAN_EXECUTE" ? "PLAN_EXECUTE"
    : state === "DONE" ? "→ DONE" : state === "FAILED" ? "FAILED" : "· 分支";

  return (
    <div className="rounded-card border border-dark-border/10 bg-light-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] font-medium uppercase tracking-wide text-muted-light/70">
          实时演示 · 说一句口令，Agent 自动动一步
        </div>
        <div className="hidden text-[11px] text-muted-light/60 sm:block">
          仅已配置口令可触发 · 意图解析优先调用真实大模型，失败自动降级本地规则
        </div>
      </div>

      {/* 前端状态机 */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {SPINE.map((s, i) => {
          const reached = state !== "IDLE" && SPINE.indexOf(state) >= i;
          const isCurrent = state === s;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-medium transition-colors ${isCurrent ? "bg-accent-blue text-white" : reached ? "bg-accent-blue/12 text-accent-blue" : "bg-dark-bg/5 text-muted-light/60"}`} title={STATE_GLOSS[s]}>{s}</span>
              {i < SPINE.length - 1 && <span className="text-[10px] text-muted-light/40">›</span>}
            </div>
          );
        })}
        <span className={`ml-1 rounded-md px-2 py-1 font-mono text-[10px] font-medium ${state === "BLOCKED" ? "bg-danger/15 text-danger" : state === "FAILED" ? "bg-danger/15 text-danger" : state === "PREPARE_STATE" ? "bg-accent-cyan/15 text-accent-cyan" : state === "CANDIDATE_DISPLAY" ? "bg-warn/15 text-warn" : "bg-dark-bg/5 text-muted-light/60"}`}>
          {branchLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* 左：口令配置 + 场景预设 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-dark-border/10 bg-light-bg p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-light-text">A · 口令配置</div>
              <span className="font-mono text-[11px] text-muted-light/60">口令 → 平台原生动作</span>
            </div>
            <p className="mt-1 text-[12px] leading-[1.5] text-muted-light">只有这里配置过的口令才能触发对应动作；未配置的口播内容会被安全忽略。可自由增删改。</p>
            <div className="mt-3 space-y-2">
              {commands.map((cmd) => (
                <div key={cmd.id} className="flex items-center gap-2">
                  <input value={cmd.keyword} onChange={(e) => updateCmd(cmd.id, { keyword: e.target.value })} className="w-[38%] rounded-lg border border-dark-border/15 bg-light-card px-2.5 py-2 text-[13px] text-light-text outline-none transition focus:border-accent-blue/50" placeholder="口令" />
                  <div className="flex w-[44%] items-center gap-1.5">
                    <span className="text-muted-light/50">→</span>
                    <select value={cmd.action} onChange={(e) => updateCmd(cmd.id, { action: e.target.value as ActionKey })} className="flex-1 rounded-lg border border-dark-border/15 bg-light-card px-2 py-2 text-[13px] text-light-text outline-none transition focus:border-accent-blue/50">
                      {ACTION_OPTIONS.map((k) => (<option key={k} value={k}>{ACTION_META[k].label}</option>))}
                    </select>
                  </div>
                  <button onClick={() => removeCmd(cmd.id)} aria-label="删除口令" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dark-border/15 text-muted-light transition hover:border-danger/40 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
            <button onClick={addCmd} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-dark-border/25 px-3 py-2 text-[13px] font-medium text-muted-light transition hover:border-accent-blue/40 hover:text-accent-blue"><Plus className="h-3.5 w-3.5" /> 添加口令</button>
          </div>

          <div className="rounded-xl border border-dark-border/10 bg-light-bg p-4">
            <div className="text-[13px] font-semibold text-light-text">业务流转 · 8 场景预设</div>
            <p className="mt-1 text-[12px] leading-[1.5] text-muted-light">一键体验：明确指令 / 否定句 / 条件句 / 模棱两可 / 蓄力动作 / 多步编排 / 高危确认 / 未配置口令。</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SCENARIOS.map((sc) => (
                <button key={sc.text} onClick={() => onManualSubmit(sc.text)} className="rounded-lg border border-dark-border/15 bg-light-card px-2.5 py-2 text-left text-[12px] text-muted-light transition hover:border-accent-cyan/40 hover:text-accent-cyan">
                  <span className="mr-1 inline-flex items-center rounded-full bg-accent-blue/12 px-1.5 text-[10px] text-accent-blue">{sc.label}</span>
                  {sc.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右：聆听 + 意图卡片 + 队列 */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-dark-border/10 bg-dark-bg p-4 text-dark-text">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Radio className={`h-4 w-4 ${listening ? "text-danger animate-pulse" : "text-muted-dark"}`} /> B · 实时聆听
                {listening && <span className="text-[11px] font-normal text-muted-dark">识别中…</span>}
              </div>
              {lastLatency !== null && <span className="font-mono text-[11px] text-accent-cyan">末次口令 ≤ {lastLatency}ms</span>}
            </div>
            <div className="mt-3 min-h-[64px] rounded-lg border border-dark-border bg-dark-card p-3 font-mono text-[14px] leading-[1.6] text-dark-text">
              {combinedText ? (<><span>{finalText}</span><span className="text-muted-dark">{interimText}</span>{listening && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-accent-cyan align-middle" />}</>) : <span className="text-muted-dark">点「开始聆听」用麦克风说，或点左侧场景预设 / 手动输入。</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!listening ? (
                <button onClick={startRec} className="inline-flex items-center gap-1.5 rounded-xl bg-accent-blue px-4 py-2.5 text-[14px] font-medium text-white transition hover:opacity-90"><Mic className="h-4 w-4" /> 开始聆听</button>
              ) : (
                <button onClick={stopRec} className="inline-flex items-center gap-1.5 rounded-xl border border-dark-border px-4 py-2.5 text-[14px] font-medium text-dark-text transition hover:bg-dark-border/10"><MicOff className="h-4 w-4" /> 停止</button>
              )}
              <button onClick={reset} className="rounded-xl border border-dark-border px-3 py-2.5 text-[13px] font-medium text-muted-dark transition hover:text-dark-text">重置</button>
            </div>
            {asrError && (<div className="mt-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-[12px] text-danger"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{asrError}</span></div>)}
            {supported === false && (<div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-[12px] text-warn"><Keyboard className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>当前浏览器不支持 Web Speech API。已切换为「手动模拟」：在下方输入你“说”的话即可体验意图解析。</span></div>)}
          </div>

          {(manualMode || supported === false) && (
            <div className="flex gap-2">
              <input value={manualInput} onChange={(e) => setManualInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && manualInput.trim()) onManualSubmit(manualInput.trim()); }} placeholder="手动输入一句口令，回车识别…" className="flex-1 rounded-xl border border-dark-border/15 bg-light-bg px-3 py-2.5 text-[14px] text-light-text outline-none transition focus:border-accent-blue/50" />
              <button onClick={() => manualInput.trim() && onManualSubmit(manualInput.trim())} className="rounded-xl bg-accent-blue px-4 text-[14px] font-medium text-white transition hover:opacity-90">识别</button>
            </div>
          )}

          {/* C · 意图卡片 */}
          <div className="rounded-xl border border-dark-border/10 bg-light-bg p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-light-text">C · 意图卡片</div>
              {pending && pending.semanticFilter === "PASS" && (
                <span className="rounded-full bg-accent-cyan/15 px-2 py-0.5 font-mono text-[11px] text-accent-cyan">置信度 {pending.confidence.toFixed(2)}</span>
              )}
            </div>
            {!pending ? (
              <div className="mt-3 rounded-lg border border-dashed border-dark-border/20 px-3 py-4 text-center text-[12px] text-muted-light">暂无识别到的意图</div>
            ) : pending.semanticFilter === "BLOCK" ? (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-[13px] text-danger">
                <Filter className="mt-0.5 h-4 w-4 shrink-0" />
                <div><div className="font-medium">语义过滤拦截（{pending.filterReason}）</div><div className="mt-1 text-[12px] leading-[1.5] text-muted-light">“{pending.keyword}” 不是执行指令，不触发、不弹框、不打扰主播。</div></div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-dark-border/10 bg-light-card px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md border ${ACTION_META[pending.action].tint}`}>{ACTION_META[pending.action].icon}</span>
                    <div className="text-[13px]">
                      <span className="font-medium text-light-text">{pending.actionType === "AMBIGUOUS" ? "福利类模糊意图" : ACTION_META[pending.action].label}</span>
                      <span className="ml-1.5 text-muted-light/70">口令「{pending.keyword}」</span>
                    </div>
                  </div>
                  {pending.cancelled ? <span className="rounded-full bg-dark-bg/10 px-2 py-0.5 text-[11px] text-muted-light">已取消</span>
                    : pending.resolved ? <span className="inline-flex items-center gap-1 rounded-full bg-safe/10 px-2 py-0.5 text-[11px] text-safe"><Check className="h-3 w-3" /> 已下发</span>
                    : pending.actionType === "PREPARE" ? <span className="inline-flex items-center gap-1 rounded-full bg-accent-cyan/10 px-2 py-0.5 text-[11px] text-accent-cyan"><Hourglass className="h-3 w-3" /> 蓄力</span>
                    : pending.highRisk ? <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] text-danger"><ShieldAlert className="h-3 w-3" /> 高危</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-safe/10 px-2 py-0.5 text-[11px] text-safe">低危</span>}
                </div>

                {pending.slots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pending.slots.map((s) => (<span key={s.key} className="rounded-md border border-dark-border/15 bg-light-bg px-2.5 py-1 text-[12px] text-muted-light">{s.label}：<span className="font-medium text-light-text">{s.value}</span></span>))}
                  </div>
                )}

                {pending.note && (<div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-[12px] text-warn"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{pending.note}</span></div>)}

                {/* 蓄力动作：策略配置 + 触发 */}
                {pending.actionType === "PREPARE" && !pending.resolved && (
                  <div className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 p-3">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-accent-cyan"><Hourglass className="h-4 w-4" /> 蓄力动作 · 准备中……</div>
                    <p className="mt-1 text-[12px] leading-[1.5] text-muted-light">“准备开价”是憋单，不立即执行。选择触发策略：</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {(Object.keys(STRATEGY_META) as PrepareStrategy[]).map((st) => (
                        <button key={st} onClick={() => { setPrepareStrategy(st); if (st === "fixed") { if (prepareTimerRef.current) window.clearTimeout(prepareTimerRef.current); prepareTimerRef.current = window.setTimeout(() => triggerPrepareByTimer(), 6000); } }} className={`rounded-lg border px-2.5 py-1.5 text-[12px] transition ${prepareStrategy === st ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan" : "border-dark-border/15 text-muted-light hover:border-accent-cyan/30"}`}>{STRATEGY_META[st].label}</button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-light/70">{STRATEGY_META[prepareStrategy].hint}</p>
                    {prepareStrategy !== "fixed" && (
                      <button onClick={triggerPrepareManual} className="mt-2 rounded-lg bg-accent-blue px-3 py-1.5 text-[12px] font-medium text-white transition hover:opacity-90">模拟满足触发条件（开价 → ¥99）</button>
                    )}
                  </div>
                )}

                {/* 模棱两可：候选卡片 */}
                {pending.ambiguity && pending.candidates && !pending.resolved && (
                  <div className="rounded-lg border border-warn/30 bg-warn/5 p-3">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-warn"><ListChecks className="h-4 w-4" /> 您想发什么？（模棱两可）</div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {pending.candidates.map((c) => (
                        <button key={c} onClick={() => pickCandidate(c)} className="flex items-center gap-2 rounded-lg border border-dark-border/15 bg-light-card px-3 py-2 text-[13px] text-light-text transition hover:border-accent-cyan/40 hover:text-accent-cyan">
                          <span className={ACTION_META[c].tint.includes("text-") ? "" : ""}>{ACTION_META[c].icon}</span> {ACTION_META[c].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 高危确认框 */}
                {pending.highRisk && !pending.resolved && (
                  <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-danger"><ShieldAlert className="h-4 w-4" /> 高危动作确认</div>
                    <p className="mt-1 text-[12px] leading-[1.5] text-muted-light">上架 / 改价直接影响成交与库存，请确认后再下发。</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => confirmHighRisk(pending.uid)} className="rounded-lg bg-accent-blue px-3 py-1.5 text-[12px] font-medium text-white transition hover:opacity-90">确认执行</button>
                      <button onClick={() => cancelAction(pending.uid)} className="rounded-lg border border-dark-border px-3 py-1.5 text-[12px] font-medium text-muted-light transition hover:text-light-text">取消</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* D · 动作预备队列 */}
          <div className="rounded-xl border border-dark-border/10 bg-light-bg p-4">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-light-text">D · 动作预备队列</div>
              <span className="text-[11px] text-muted-light/60">高危动作待确认</span>
            </div>
            <div className="mt-3 space-y-2">
              {queue.length === 0 ? (
                <div className="rounded-lg border border-dashed border-dark-border/20 px-3 py-4 text-center text-[12px] text-muted-light">暂无触发的动作</div>
              ) : (
                queue.slice(0, 4).map((t) => (
                  <div key={t.uid} className="flex items-center justify-between gap-3 rounded-lg border border-dark-border/10 bg-light-card px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-md border ${ACTION_META[t.action].tint}`}>{ACTION_META[t.action].icon}</span>
                      <div className="text-[13px]"><span className="font-medium text-light-text">{ACTION_META[t.action].label}</span></div>
                    </div>
                    {t.status === "executed" ? <span className="inline-flex items-center gap-1 rounded-full bg-safe/10 px-2.5 py-1 text-[12px] text-safe"><Check className="h-3.5 w-3.5" /> 已下发</span>
                      : t.status === "cancelled" ? <span className="rounded-full bg-dark-bg/10 px-2.5 py-1 text-[12px] text-muted-light">已取消</span>
                      : t.status === "preparing" ? <span className="rounded-full bg-accent-cyan/10 px-2.5 py-1 text-[12px] text-accent-cyan">蓄力中</span>
                      : <button onClick={() => confirmHighRisk(t.uid)} className="rounded-lg bg-accent-blue px-3 py-1.5 text-[12px] font-medium text-white transition hover:opacity-90">确认执行</button>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 手机端直播间模拟器（展示层） */}
      <div className="mt-6 rounded-xl border border-dark-border/10 bg-dark-bg p-5 text-dark-text">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <Smartphone className="h-4 w-4 text-accent-cyan" /> 手机端直播间模拟器 · 主播只看到“发生了什么”
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-dark-border bg-dark-card p-3">
            <div className="text-[11px] text-muted-dark">福袋</div>
            <div className={`mt-1 text-[15px] font-semibold ${live.fudai ? "text-warn" : "text-muted-dark"}`}>{live.fudai ?? "待发放"}</div>
          </div>
          <div className="rounded-lg border border-dark-border bg-dark-card p-3">
            <div className="text-[11px] text-muted-dark">商品讲解</div>
            <div className={`mt-1 text-[15px] font-semibold ${live.explain ? "text-accent-cyan" : "text-muted-dark"}`}>{live.explain ? "讲解中" : "待讲解"}</div>
          </div>
          <div className="rounded-lg border border-dark-border bg-dark-card p-3">
            <div className="text-[11px] text-muted-dark">价格</div>
            <div className={`mt-1 text-[15px] font-semibold ${live.price === "set" ? "text-safe" : live.price === "preparing" ? "text-accent-cyan" : "text-muted-dark"}`}>
              {live.price === "set" ? (live.priceValue ?? "¥99") : live.price === "preparing" ? "准备中……" : "？？？"}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-[1.5] text-muted-dark">置信度、槽位、need_confirm 是内部风控信号，仅用于讲解架构，不出现在产品界面。</p>
      </div>

      {/* F · 执行日志 */}
      <div className="mt-6 rounded-xl border border-dark-border/10 bg-dark-bg p-4 text-dark-text">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <ScrollText className="h-4 w-4 text-accent-cyan" /> F · 执行日志
          <span className="text-[11px] font-normal text-muted-dark">可追溯 · 可复盘 · 可审计</span>
        </div>
        <div className="mt-3 max-h-[180px] space-y-1 overflow-y-auto rounded-lg border border-dark-border bg-dark-card p-3 font-mono text-[12px] leading-[1.6]">
          {log.length === 0 ? <div className="text-muted-dark">日志为空，说一句口令试试。</div> : log.map((e) => (
            <div key={e.id} className="flex gap-2">
              <span className="shrink-0 text-muted-dark">{e.ts}</span>
              <span className={e.level === "ok" ? "text-safe" : e.level === "warn" ? "text-warn" : e.level === "err" ? "text-danger" : "text-dark-text"}>{e.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-[12px] leading-[1.6] text-muted-light/80">
        说明：浏览器端语音识别使用 Web Speech API（Chrome / Edge 支持最佳，需授权麦克风）。
        意图解析<span className="font-medium text-muted-light">优先调用真实大模型</span>做语义确认与槽位抽取（WorkBuddy Cloud LLM，免密钥），
        当且仅当模型调用失败（网络 / 鉴权 / 超时）时自动降级到本地规则 Mock，保证 Demo 永远可跑；
        福袋 / 讲解卡 / 上架 / 改价等动作均为平台原生互动能力，本演示以“预备 + 确认 / 自动下发 / 蓄力触发”模拟执行，并完整记录日志。
      </p>
    </div>
  );
}
