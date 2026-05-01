// 感情タグの固定プリセット（要件 §FR-1.2）
// 4 カテゴリ、合計 41 タグ。ユーザー追加は不可（v1 スコープ）。

export type TagCategory = 'negative' | 'positive' | 'state' | 'thought';

export interface TagPreset {
  category: TagCategory;
  name: string;
}

export const TAG_CATEGORY_LABEL: Record<TagCategory, string> = {
  negative: 'ネガティブ感情',
  positive: 'ポジティブ感情',
  state: '状態',
  thought: '行動・思考',
};

const NEGATIVE: readonly string[] = [
  '不安',
  '怒り',
  'イライラ',
  '寂しさ',
  '無力感',
  '悲しみ',
  '罪悪感',
  '焦り',
  '恥ずかしい',
  '空虚',
  '退屈',
  '物足りない',
];

const POSITIVE: readonly string[] = [
  '楽しい',
  '嬉しい',
  '穏やか',
  '感謝',
  '達成感',
  'リラックス',
  '充実',
  '希望',
  '自信',
  '楽',
];

const STATE: readonly string[] = [
  '鬱',
  'メンタルダウン',
  'ストレス',
  'オーバーワーク',
  '疲れ',
  '感情のコントロール不能',
  '涙もろい',
  '憂鬱',
  '集中できない',
  '軽躁',
  '軽鬱',
  '躁',
  'フラット',
  'アイデアが駆け巡る',
  '過活動',
];

const THOUGHT: readonly string[] = [
  '「自分は無能だ」',
  '「誰も分かってくれない」',
  '「逃げたい」',
  '「動けない」',
];

function build(category: TagCategory, names: readonly string[]): TagPreset[] {
  return names.map((name) => ({ category, name }));
}

export const TAG_PRESETS: readonly TagPreset[] = [
  ...build('negative', NEGATIVE),
  ...build('positive', POSITIVE),
  ...build('state', STATE),
  ...build('thought', THOUGHT),
];

export const TAG_NAMES: readonly string[] = TAG_PRESETS.map((t) => t.name);

export function isValidTagName(name: string): boolean {
  return TAG_NAMES.includes(name);
}

export function getTagsByCategory(category: TagCategory): TagPreset[] {
  return TAG_PRESETS.filter((t) => t.category === category);
}
