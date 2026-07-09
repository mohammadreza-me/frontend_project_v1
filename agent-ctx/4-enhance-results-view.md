# Task 4: Enhance Practice/Exam Results View

## Date: 2025-01-01

## Files Modified
- `src/messages/en.json` — Added 3 translation keys to `dashboard` section
- `src/messages/fa.json` — Added 3 translation keys to `dashboard` section
- `src/messages/ar.json` — Added 3 translation keys to `dashboard` section
- `src/components/question/question-page.tsx` — Enhanced results phase rendering

## Summary

### 1. Translation Keys Added (all 3 locales)
- `dashboard.conceptPerformance`: "Concept Performance" / "عملکرد مفاهیم" / "أداء المفاهيم"
- `dashboard.backToDashboard`: "Back to Dashboard" / "بازگشت به داشبورد" / "العودة إلى لوحة التحكم"
- `dashboard.timeSpent`: "Time Spent" / "زمان صرف شده" / "الوقت المستغرق"

### 2. Practice Results Enhancements
- **Score Donut Chart**: Added a Recharts `PieChart` with `Pie` + `Cell` + `ResponsiveContainer` showing emerald (correct) and red (incorrect) segments. Center text shows percentage via absolute overlay.
- **Score text with trophy**: Moved below donut chart, compact format `X/Y — Score`.
- **Concept Performance Summary**: Added `useMemo` computation grouping submitted answers by `concept_name`. Each concept shows a labeled horizontal progress bar with color coding: emerald ≥70%, amber ≥40%, red <40%. Uses `BarChart3` icon header.

### 3. Exam Results Enhancements
- **Donut Chart with amber accent**: Same Recharts structure but uses amber (#d97706) for correct answers instead of emerald.
- **Improved stats layout**: 3-column grid with Score, Trophy/Success Rate, and Time (with Clock icon).
- **Prominent Time display**: Amber banner with Clock icon showing formatted time as "Xm Ys" using locale-aware translation strings.
- **Back to Dashboard button**: Replaced plain outline button with amber-styled button using `t.dashboard.backToDashboard`.

### 4. Technical Details
- Added `useMemo` import from React and `PieChart, Pie, Cell, ResponsiveContainer` from recharts
- `useMemo` for concept performance placed before any conditional returns (Rules of Hooks compliance)
- `renderCustomLabel` is a noop since center text is rendered via absolute overlay div
- `formatTimeLong` helper formats seconds as "Xm Ys" using `t.exam.minutes` and `t.exam.seconds`
- Responsive donut sizes: `size-40 sm:size-48`
- All text from translation files via `useTranslation()`
- RTL-aware with logical properties (`pe-2`, `ps-4`, etc.)
- No blue/indigo colors used
- ESLint passes with 0 errors