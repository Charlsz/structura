# Structura

Structura is a web application that takes any GitHub repository URL and generates an interactive 3D force-directed graph representing its architecture. It visualizes folder hierarchies, file relationships, and cross-file dependencies, with syntax-highlighted code previews for individual files.

## Features

- **3D Architecture Graph** -- Interactive force-directed visualization built with Three.js and react-force-graph-3d. Nodes represent files and folders; links represent hierarchy and detected import dependencies.
- **Module Detection** -- Automatically classifies files into module types (API, frontend, database, config, test, docs, lib) based on path patterns and file content. Each module type is color-coded in the graph.
- **Dependency Parsing** -- Parses import statements across JavaScript, TypeScript, Python, Go, Rust, and Java to draw dependency links between files.
- **Code Preview** -- Click any file node to view its source code with syntax highlighting directly in the right panel.
- **Resizable Panels** -- Left panel shows repository stats (file/folder counts, language breakdown, module filters). Right panel shows file details and code preview. Both panels are drag-to-resize with collapse/expand toggles.
- **Image Preview** -- Image files (PNG, JPG, SVG, etc.) are rendered inline instead of showing raw binary content.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4 |
| 3D Rendering | react-force-graph-3d, Three.js |
| Data Fetching | TanStack React Query v5 |
| Validation | Zod |
| Syntax Highlighting | prism-react-renderer |
| UI Primitives | Radix UI (Dialog, Scroll Area, Tooltip) |
| Icons | Lucide React |

## Project Structure

```
src/
  app/
    api/
      repo/[...path]/   -- GitHub API proxy (metadata, tree, raw files)
    layout.tsx
    page.tsx
  components/
    repo-explorer.tsx   -- Main page: landing form + explorer layout
    StructuraGraph.tsx   -- 3D graph visualization component
    StatsPanels.tsx      -- Left sidebar: stats, languages, modules
    FileSidebar.tsx      -- Right sidebar: file preview and code viewer
    ResizeHandle.tsx     -- Resizable panel hook and component
    providers.tsx        -- TanStack Query provider
    error-boundary.tsx   -- Error boundary wrapper
    ui/                  -- Reusable UI primitives (button, card, input, etc.)
  hooks/
    useRepoGraph.ts     -- Data hooks: repo fetching, file content, dependencies
  lib/
    types.ts            -- Zod schemas and TypeScript types
    github-client.ts    -- GitHub API helper functions
    graph-builder.ts    -- Transforms GitHub tree into graph nodes and links
    parser.ts           -- Regex-based import parser (JS/TS/Python/Go/Rust/Java)
    utils.ts            -- URL parsing, module detection, color mapping
  utils/
    cn.ts               -- Tailwind class merge utility (clsx + tailwind-merge)
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A GitHub Personal Access Token (recommended for higher rate limits and private repos)

### Installation

```bash
git clone https://github.com/your-username/structura.git
cd structura
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```
GITHUB_TOKEN=your_github_personal_access_token
```

- `GITHUB_TOKEN` -- Required for private repositories and to avoid GitHub API rate limits.

### Running

```bash
npm run dev
```

Open http://localhost:3000 in your browser. Paste a GitHub repository URL (or just `owner/repo`) and press Enter.

### Build

```bash
npm run build
npm start
```

## Usage

1. Enter a GitHub repository URL or shorthand (e.g. `facebook/react`) on the landing page.
2. The app fetches the repository tree and renders a 3D force-directed graph.
3. Click any node to select it. File nodes automatically load their source code with syntax highlighting in the right panel.
4. Use the left panel to filter by module type or review language statistics.
5. Drag the panel edges to resize them, or click the toggle buttons to collapse/expand.
6. Scroll, drag, and zoom in the 3D view to explore the architecture from any angle.

## License

MIT
