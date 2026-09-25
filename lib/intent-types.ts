// 声控场 Agent —— 共享类型定义（被 ASRDemo 与 lib/cloud 复用）
// 抽离到独立模块，避免 ASRDemo ↔ cloud 之间的类型循环引用。

export type ActionKey =
  | "fudai"
  | "explain"
  | "list"
  | "modify"
  | "prepare"
  | "coupon"
  | "redpacket"
  | "lottery";

export interface Command {
  id: string;
  keyword: string;
  action: ActionKey;
}

export interface Slot {
  key: string;
  label: string;
  value: string;
}

export type IntentActionType = "EXECUTE" | "PREPARE" | "AMBIGUOUS" | "NONE";

export interface Intent {
  uid: string;
  keyword: string;
  action: ActionKey;
  actionType: IntentActionType;
  semanticFilter: "PASS" | "BLOCK";
  filterReason?: string;
  ambiguity: boolean;
  confidence: number;
  slots: Slot[];
  highRisk: boolean;
  candidates?: ActionKey[];
  multiActions?: ActionKey[];
  resolved?: boolean;
  cancelled?: boolean;
  note?: string;
}
