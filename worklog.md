# Worklog

## Task 1: Workspace-Centric Architecture Migration (Frontend)

### Date: 2025-06-25

### Context
Migrated the entire frontend from a document-centric to a workspace-centric architecture based on a comprehensive architecture document. The backend is being built separately; this phase focused exclusively on frontend restructuring with mock data.

### Infrastructure Changes

#### Types (`src/types/`)
- **NEW** `workspace.ts`: Workspace, WorkspaceStats, CoverageInfo, WorkspaceTag, WorkspaceTab, CreateWorkspaceRequest, DocumentWithWorkspace, KnowledgeGraphConcept, ConceptTreeNode, ConceptQuestionHistory
- **RENAMED** `skill-graph.ts` → `knowledge-graph.ts` with updated SkillNode types (added 'user' and 'workspace' node types)
- **UPDATED** `index.ts`: AppPage now includes 'workspace' and 'knowledge-graph' (was 'skill-graph')

#### Stores (`src/stores/index.ts`)
- Added `selectedWorkspaceId`, `workspaceTab` (type WorkspaceTab) to UIState
- Changed default locale from 'fa' to 'en' (per spec: English-only content for now)
- Added `setSelectedWorkspaceId()` and `setWorkspaceTab()` actions

#### Mock API Layer
- **NEW** `features/workspaces/api.ts`: getWorkspacesApi, createWorkspaceApi, getWorkspaceStatsApi, getWorkspaceCoverageApi, getWorkspaceTagsApi, getConceptTreeApi, getConceptHistoryApi — all with comprehensive mock data for 4 workspaces (Mathematics, Computer Networks, Databases, Machine Learning)
- **NEW** `features/workspaces/hooks.ts`: React Query hooks for all workspace APIs
- **REWRITTEN** `features/documents/api.ts`: Now workspace-aware (DocumentWithWorkspace type), includes suggestTagsApi for AI tag suggestions
- **NEW** `features/knowledge-graph/api.ts`: Renamed from skill-graph, returns data with user/workspace/concept node hierarchy, supports optional workspaceId filter
- **NEW** `features/knowledge-graph/transform.ts`: Updated transform for user→workspace→concept graph layout

#### i18n Messages (en.json, fa.json, ar.json)
- Complete rewrite with workspace-centric keys
- New sections: `workspace.*` (30+ keys for 4-tab workspace page), `aiProcessing.*` (7 keys for AI processing indicator)
- `nav.skillGraph` → `nav.knowledgeGraph`
- Removed: `nav.documents`, `nav.practice`, `nav.exam`, `nav.careerSimulation` from navigation
- Kept intact: `auth.*`, `settings.*`, `career.*` (for v3), `practice.*`, `exam.*`

### UI Components

#### Header (`src/components/shared/header.tsx`)
- Removed Career Simulation, Practice, Exam, Documents from navigation
- Only 3 nav items remain: Dashboard, Knowledge Graph, Settings
- GitBranch icon for Knowledge Graph (was skill-graph)

#### Dashboard (`src/components/dashboard/dashboard-page.tsx`) — FULLY REWRITTEN
- Welcome bar with user name
- 4 metric cards: Total Answers, Success Rate, Active Workspaces, Questions Today
- Workspace cards grid (responsive 1/2/3 cols) with emoji icon, name, coverage bar, stats
- Click card → navigate to workspace page
- Create Workspace dialog with name input + emoji icon picker (12 emojis)
- Weekly activity CSS bar chart
- Loading skeletons and empty states

#### Workspace Page (`src/components/workspaces/workspace-page.tsx`) — NEW (1257 lines)
- **Tab 1 (Status)**: 3 metric cards, SVG radar/spider chart for concept mastery, weekly activity bars
- **Tab 2 (Practice/Exam)**: Mode selection (Practice/Exam), Difficulty (Easy/Medium/Hard), Scope (Entire/File/Concept), Review mode banner when coverage threshold met
- **Tab 3 (Knowledge Tree)**: Hierarchical list with tree connectors, color-coded mastery, [Filter] button → tab 2, expandable previous questions per concept
- **Tab 4 (Resources)**: Upload zone with dual-source tags (workspace tags | ✨ AI tags), document list with coverage bars and "Practice from this file" buttons

#### Knowledge Graph (`src/components/graph/knowledge-graph-page.tsx`) — NEW
- 3 node types: userNode (central, emerald circle with User icon), workspaceNode (rounded rect), conceptNode (mastery-colored)
- Workspace filter dropdown (All + individual workspaces)
- User node click shows summary popover
- Concept detail side panel on click
- Zoom controls and legend

#### AI Processing Indicator (`src/components/shared/ai-processing-indicator.tsx`) — NEW
- Step-by-step progress display with animated spinner
- Completed/active/pending states with icons
- Progress bar
- Presets: QUESTION_GENERATION_STEPS, FILE_UPLOAD_STEPS

#### Page Router (`src/app/page.tsx`)
- Updated routes: removed 'documents', 'document-detail', 'career-simulation', 'skill-graph'
- Added 'workspace' and 'knowledge-graph'
- Lazy-loaded KnowledgeGraphPage via dynamic import

### Verification
- `bun run lint`: 0 errors, 0 warnings
- `npx next build`: Compiled successfully, all pages generated
- Dev server: `GET / 200 in 5.4s` (compile: 5.2s, render: 236ms)
- All exports are named (no default exports in new components)

### Files NOT Modified (preserved per spec)
- `src/components/auth/login-form.tsx` — unchanged
- `src/components/auth/register-form.tsx` — unchanged
- `src/components/settings/settings-page.tsx` — unchanged
- `src/components/career/career-page.tsx` — kept for v3, no nav link
- `src/features/career/*` — kept for v3
- `src/features/auth/*` — unchanged
- `src/features/questions/api.ts` — unchanged (difficulty param already existed)

### Project Status
- Build: Clean, zero errors
- Lint: Clean, zero warnings
- Architecture: Successfully migrated from document-centric to workspace-centric SPA
- Navigation: 3-item header (Dashboard, Knowledge Graph, Settings) + workspace drill-down
- Ready for: Backend integration (replace mock APIs with real endpoints)