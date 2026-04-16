# Victor Pedor v2 — Sidebar, Dashboard, Subtitle Style & Export

**Date:** 2026-04-16
**Status:** Approved

## Context

Victor Pedor is currently a single-page, stateless subtitle generator (Next.js + AssemblyAI + Claude). There is no persistence layer, no navigation, and no video history. The app processes one video at a time with no way to revisit past work.

This redesign transforms it into a proper application with:
- Persistent video history via Vercel Postgres
- Sidebar navigation following Linear.app/Vercel design patterns
- Customizable subtitle styling with real-time preview
- Video export with burned-in subtitles via ffmpeg.wasm

**Visual references:** Linear.app sidebar, Vercel dashboard, [Dribbble AI Video Software](https://dribbble.com/shots/26926200-AI-Video-Creating-Software-Landing-Page)

## Engineering Principles

### Modular Architecture with CLAUDE.md
Every new module (lib or component group) gets its own `CLAUDE.md` containing:
- Purpose and responsibilities
- Public API (exported functions + types)
- Internal/external dependencies
- Business rules and edge cases
- Required tests (TDD)
- Usage examples

### Workflow per Phase
1. GitHub Issue with phase spec
2. Dedicated branch (`feat/fase-X-nome`)
3. TDD: tests first, implementation after
4. CLAUDE.md for each new module
5. PR with detailed description
6. `/code-review` before merge
7. `/security-review` before merge
8. Resolve reviewer comments
9. Frontend review (visual fidelity to references, UX, responsiveness)
10. Squash merge to main

## Architecture

### New Module Map

```
src/
  lib/
    db/                          ← NEW (Phase 1)
      CLAUDE.md
      client.ts                  — connection pool + query helpers
      schema.ts                  — CREATE TABLE SQL + types
      videos.ts                  — CRUD (create, list, getById, update, delete)
      videos.test.ts

    subtitle-style/              ← NEW (Phase 3)
      CLAUDE.md
      types.ts                   — SubtitleStyle interface + Zod schema
      presets.ts                 — curated fonts + default configs
      presets.test.ts

    ffmpeg-export/               ← NEW (Phase 4)
      CLAUDE.md
      client.ts                  — init ffmpeg, burn subtitles, export
      ass-generator.ts           — Subtitle[] + style → ASS format
      ass-generator.test.ts

    thumbnail/                   ← NEW (Phase 5)
      CLAUDE.md
      generator.ts               — captureFrame(video, timestamp) → blob
      generator.test.ts

  components/
    layout/                      ← NEW (Phase 2)
      CLAUDE.md
      Sidebar.tsx
      Sidebar.test.tsx

    dashboard/                   ← NEW (Phase 2)
      CLAUDE.md
      VideoCard.tsx
      VideoCard.test.tsx
      VideoGrid.tsx
      VideoGrid.test.tsx

    editor/                      ← EXISTING (update CLAUDE.md)
      StylePanel.tsx             ← NEW (Phase 3)
      StylePanel.test.tsx
      ExportButton.tsx           ← NEW (Phase 4)
      ExportButton.test.tsx

  hooks/
    useFFmpegExport.ts           ← NEW (Phase 4)
    useSubtitleStyle.ts          ← NEW (Phase 3)
```

### Route Structure

```
/              → redirect to /videos
/videos        → Dashboard (video list)
/videos/[id]   → Video editor (player + subtitles + style)
/videos/new    → Upload new video
```

---

## Phase 1 — Vercel Postgres + Data Layer

**Issue:** #TBD | **Branch:** `feat/fase-1-database`

### Database Schema

```sql
CREATE TABLE videos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  blob_url       TEXT NOT NULL,
  thumbnail_url  TEXT,
  duration_ms    INTEGER,
  status         TEXT NOT NULL DEFAULT 'uploading',
  transcript_id  TEXT,
  subtitles      JSONB,
  subtitle_style JSONB,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
```

**Status enum:** `'uploading' | 'transcribing' | 'correcting' | 'ready' | 'error'`

### New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/videos` | GET | List all videos (ordered by created_at DESC) |
| `/api/videos/[id]` | GET | Get video detail |
| `/api/videos/[id]` | PATCH | Update subtitles, subtitle_style, status |
| `/api/videos/[id]` | DELETE | Delete video + blob |

### Migrations to Existing Routes

- `POST /api/upload` → also creates DB record, returns video `id`
- `POST /api/transcribe` → updates status to `'transcribing'`
- `GET /api/transcription/[id]/status` → on completion, saves subtitles to DB
- `POST /api/correct` → on completion, saves corrected subtitles to DB

### Module: `src/lib/db/`

**CLAUDE.md will document:**
- Connection pool configuration (`@vercel/postgres`)
- Query helper patterns (parameterized queries only)
- Video CRUD functions with Zod validation on inputs
- Error handling for connection failures
- Test strategy: mock `@vercel/postgres` pool

---

## Phase 2 — Sidebar + Dashboard + Routing

**Issue:** #TBD | **Branch:** `feat/fase-2-sidebar-dashboard`

### Sidebar (Narrow, Icon-only)

- Width: 52px fixed
- Icons: Logo (VP), Dashboard, Settings
- Bottom: "+ New Video" button
- Tooltips on hover for each icon
- Active state: accent background on current route icon
- Responsive: hidden on mobile, hamburger menu to toggle

**Design reference:** Linear.app icon sidebar, Vercel navigation

### Dashboard (`/videos`)

- Page title: "Meus Videos" + video count
- Responsive grid: 2-3 columns depending on viewport
- Each card: thumbnail, title, status badge, duration
- Status badges: Pronto (green), Processando (purple), Erro (red)
- Click card → navigate to `/videos/[id]`
- Empty state: illustration + "Upload seu primeiro video" CTA

### Editor Page (`/videos/[id]`)

- Breadcrumb: "← Videos / video-name.mp4"
- Two-column layout: Video player (left) + Subtitle editor (right)
- Action buttons below video: Download SRT, Download Video, Style Editor
- Reuses existing components: VideoPlayer, SubtitleOverlay, SubtitleEditor
- Data fetched from DB via `GET /api/videos/[id]`

### Layout Structure

```
src/app/layout.tsx          → Root layout (dark theme, fonts)
src/app/(app)/layout.tsx    → App layout with Sidebar
src/app/(app)/videos/page.tsx         → Dashboard
src/app/(app)/videos/[id]/page.tsx    → Editor
src/app/(app)/videos/new/page.tsx     → Upload
```

Route group `(app)` shares the sidebar layout.

---

## Phase 3 — Subtitle Style Editor

**Issue:** #TBD | **Branch:** `feat/fase-3-subtitle-style`

### SubtitleStyle Type

```typescript
interface SubtitleStyle {
  fontFamily: string;       // e.g., "Inter", "Montserrat"
  fontSize: number;         // 16-48px
  fontColor: string;        // hex color
  backgroundColor: string;  // hex with alpha
  position: 'top' | 'center' | 'bottom';
}
```

### Curated Font Presets

Inter, Montserrat, Roboto Mono, Playfair Display, Bebas Neue, Open Sans

All loaded via Google Fonts. Each font chosen for subtitle readability.

### StylePanel Component

- Font selector: chip-style buttons for each preset
- Size: slider (16-48px) with current value display
- Position: 3-option toggle (top/center/bottom)
- Text color: preset swatches + optional custom hex input
- Background color: preset swatches (semi-transparent black, solid black, none)
- Real-time preview: SubtitleOverlay updates instantly as user changes settings

### Persistence

- Style saved to DB via `PATCH /api/videos/[id]` with `subtitle_style` JSONB
- Hook `useSubtitleStyle()` manages state + auto-save with debounce

---

## Phase 4 — Video Export with ffmpeg.wasm

**Issue:** #TBD | **Branch:** `feat/fase-4-ffmpeg-export`

### Export Flow

1. User clicks "Download Video with Subtitles"
2. Load ffmpeg.wasm (~25MB, cached after first load)
3. Download video from Vercel Blob to browser memory
4. Generate ASS file from subtitles + style (ass-generator.ts)
5. Run `ffmpeg -i video.mp4 -vf ass=subs.ass output.mp4`
6. Create blob URL and trigger download

### ASS Generator (`ass-generator.ts`)

Converts `Subtitle[]` + `SubtitleStyle` into Advanced SubStation Alpha format:
- Maps fontFamily → ASS font name
- Maps fontSize, fontColor, backgroundColor → ASS style block
- Maps position → ASS alignment codes
- Maps each subtitle → ASS dialogue events with timestamps

### UX

- Export modal with progress stages: Loading FFmpeg → Processing → Done
- Progress percentage during encoding
- Warning for videos >100MB: "Export may take a few minutes"
- Cancel button to abort

### Module: `src/lib/ffmpeg-export/`

**CLAUDE.md will document:**
- ffmpeg.wasm initialization and caching
- ASS format specification subset used
- Font mapping from Google Fonts names to system equivalents
- Memory constraints and file size limits
- Progress tracking via ffmpeg.wasm callbacks

---

## Phase 5 — Thumbnails + Polish

**Issue:** #TBD | **Branch:** `feat/fase-5-thumbnails-polish`

### Thumbnail Generation

- Capture video frame at 1 second via HTML5 canvas
- During upload flow, before sending to server
- Resize to 320x180 (16:9)
- Upload thumbnail image to Vercel Blob
- Save `thumbnail_url` in DB

### Polish Items

- Empty state for dashboard (no videos yet)
- Loading skeletons for VideoCard grid
- Tooltip component for sidebar icons
- Delete confirmation dialog
- Mobile responsiveness: sidebar hidden, single-column layout
- Page transitions / loading states between routes

### Frontend Review

After all phases, a dedicated frontend review validates:
- Visual fidelity to references (Linear.app, Vercel, Dribbble shot)
- Component consistency and design system adherence
- Responsive behavior across breakpoints (mobile, tablet, desktop)
- Accessibility (keyboard navigation, ARIA labels, focus states)
- UX flow completeness (upload → process → edit → download)

---

## Verification Plan

### Per-Phase Verification
1. `npm run typecheck` — zero errors
2. `npm run test` — all tests pass (existing + new)
3. `npm run lint` — no lint errors
4. `npm run dev` — manual testing in browser
5. `/code-review` — automated code review
6. `/security-review` — security audit

### End-to-End Verification (after all phases)
1. Upload a video → appears in dashboard with "Processando" status
2. Wait for transcription + correction → status changes to "Pronto"
3. Open video in editor → subtitles displayed and synced
4. Change subtitle style → preview updates in real-time
5. Download SRT → valid SRT file with correct content
6. Export video with subtitles → video plays with burned-in subtitles
7. Delete video → removed from dashboard and Blob storage
8. Frontend review → visual fidelity, responsiveness, accessibility

### New Env Vars Required
- `POSTGRES_URL` (Vercel Postgres connection string, auto-provisioned)
