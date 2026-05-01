# デザインシステム詳細

## 1. カラー

### セマンティックカラー（ライトモード）
| トークン | 値 | 用途 |
|---------|-----|------|
| `bg.primary` | `#FFFFFF` | 画面背景 |
| `bg.secondary` | `#F5F5F7` | カード・セクション背景 |
| `bg.elevated` | `#FFFFFF` | モーダル、ポップアップ |
| `text.primary` | `#1A1A1A` | 本文 |
| `text.secondary` | `#666666` | 補助テキスト |
| `text.disabled` | `#AAAAAA` | 無効状態 |
| `border` | `#E0E0E0` | 罫線 |
| `chart.mood` | `#4CAF50` | 気分（緑） |
| `chart.sleep` | `#1E88E5` | 睡眠時間（青） |
| `chart.sleepRange` | `#E53935` | 睡眠時間帯（赤） |
| `accent` | `#5B7FFF` | プライマリアクション |
| `danger` | `#D32F2F` | 削除・エラー |

### ダークモード
ライトの反転に近いが、彩度を抑えてコントラスト調整:
- `bg.primary`: `#000000`
- `text.primary`: `#F5F5F7`
- chart 系: 彩度を下げ、明度を上げる（背景黒対応）

実装: `src/theme/tokens.ts` で `light` / `dark` の2セットをエクスポート、`useColorScheme()` で切替。

## 2. タイポグラフィ

```typescript
export const typography = {
  largeTitle: { size: 32, weight: "700", lineHeight: 40 },
  title:      { size: 22, weight: "600", lineHeight: 28 },
  headline:   { size: 17, weight: "600", lineHeight: 22 },
  body:       { size: 17, weight: "400", lineHeight: 22 },
  callout:    { size: 16, weight: "400", lineHeight: 21 },
  subhead:    { size: 15, weight: "400", lineHeight: 20 },
  footnote:   { size: 13, weight: "400", lineHeight: 18 },
  caption:    { size: 12, weight: "400", lineHeight: 16 },
} as const;
```

iOS HIG / Material Design の中間。フォントは OS 標準（San Francisco / Roboto）。
ダイナミックタイプ対応（`PixelRatio.getFontScale()` で倍率追従）。

## 3. スペーシング

8pt グリッド:

```typescript
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;
```

## 4. 角丸

```typescript
export const radius = {
  sm: 4, md: 8, lg: 16, full: 9999,
} as const;
```

## 5. シャドウ

```typescript
export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modal: { /* ... 強め */ },
};
```

## 6. コンポーネントライブラリ

`src/components/ui/` に最小プリミティブを置く:

| コンポーネント | 概要 |
|---------------|------|
| `Button` | primary / secondary / danger / ghost、サイズ sm/md/lg |
| `Card` | 背景 + 角丸 + シャドウ |
| `Modal` | フェード+スケールアニメ、背景タップで閉じる |
| `Toast` | 上から降りてくる短時間メッセージ |
| `IconButton` | 44pt ヒット領域、SF Symbols / Material Icons |
| `Tabs` | セグメント風 |
| `EmojiButton` | 気分5段階の選択ボタン |

### Button 例
```tsx
<Button variant="primary" size="md" onPress={save}>保存</Button>
<Button variant="danger" onPress={confirmDelete}>削除</Button>
```

## 7. 気分絵文字マッピング

```typescript
export const MOOD_EMOJI = {
  [-2]: "😢",
  [-1]: "🙁",
  [ 0]: "😐",
  [ 1]: "🙂",
  [ 2]: "😄",
} as const;

export const MOOD_LABEL = {
  [-2]: "とても悪い",
  [-1]: "悪い",
  [ 0]: "普通",
  [ 1]: "良い",
  [ 2]: "とても良い",
} as const;
```

## 8. アイコン

`@expo/vector-icons` の Ionicons / MaterialCommunityIcons を使用。
カスタムアイコンが必要になるまで自作しない。

## 9. アニメーション

| 用途 | 仕様 |
|------|------|
| 画面遷移 | expo-router 標準（横スライド） |
| モーダル登場 | fade + scale 200ms ease-out |
| トースト | 上から滑り込み 250ms、3秒表示、fadeout 200ms |
| ドラッグハンドル触覚 | `Haptics.selectionAsync()` 10分ごと |
| ボタン押下 | `activeOpacity 0.7` または scale 0.98 |

## 10. アクセシビリティ規約

- すべての操作可能要素に `accessibilityLabel`
- 状態変化は `accessibilityState`（selected/disabled/expanded）
- アイコンのみのボタンには必ずラベル
- カラーコントラスト WCAG AA 以上（`text.primary` on `bg.primary` で 16:1）
- フォーカス順序が論理的（ヘッダー → コンテンツ → CTA）

## 11. デザイントークン適用例

```tsx
// src/theme/index.ts
export const useTheme = () => {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTokens : lightTokens;
};

// 使用側
const t = useTheme();
<View style={{ backgroundColor: t.bg.primary, padding: spacing.md }}>
  <Text style={{ color: t.text.primary, ...typography.body }}>...</Text>
</View>
```
