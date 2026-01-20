# Eywa

A smart note-taking application that helps you make better decisions by surfacing relevant information at the right time.

## Philosophy

Life is a continuous series of judgments and decisions. The quality of these decisions depends on the quality and accessibility of information we have at the moment of decision-making. Eywa helps by:

- Recommending related notes while you write
- Using semantic analysis with transformer models for deep content understanding
- Supporting multiple signals for ranking (semantic similarity, tags, recent views, relations, engagement)
- Organizing information at the heading level for precise context
- Managing multiple workspaces with custom settings

## Architecture

Eywa is built as a monorepo with three main packages:

### Core (`@eywa/core`)

The brain of Eywa. Contains all business logic and algorithms:

- **Semantic Analysis**: Uses transformer models (@xenova/transformers) for generating text embeddings
- **Recommendation Engine**: Multi-signal ranking algorithm combining:
  - Semantic similarity (cosine similarity of embeddings)
  - Tag matching
  - Recent viewing history
  - Explicit note relations
  - User engagement metrics
- **Heading Extraction**: Markdown parsing and chunking at heading level
- **Workspace Management**: Configuration and settings per workspace

### Web (`@eywa/web`)

Web application built with:
- React + TypeScript
- Vite for fast development
- Dexie for IndexedDB storage
- Local-first architecture

### Desktop (`@eywa/desktop`)

Native desktop application using:
- Tauri for cross-platform native apps
- Same React web UI wrapped in native shell
- File system access for workspace management
- Better performance with native APIs

## Key Features

### 1. Markdown File Loading from Folders

Load existing markdown files from your local file system:
- Select a folder and automatically import all `.md` files
- Recursive scanning of subdirectories
- Automatic title extraction from `# headings`
- Tag extraction from `#hashtags`
- Smart synchronization (only updates modified files)

See [WORKSPACE_GUIDE.md](./WORKSPACE_GUIDE.md) for detailed instructions.

### 2. Semantic Analysis with Embeddings

Instead of simple keyword matching, Eywa uses transformer models to understand the meaning of your notes:

```typescript
// Generate semantic embeddings
const embedding = await generateEmbedding(noteContent);

// Compare notes by meaning, not just words
const similarity = calculateCosineSimilarity(embedding1, embedding2);
```

### 3. Multi-Signal Recommendation

Combines multiple factors for intelligent recommendations:
- **40%** Semantic similarity (meaning)
- **20%** Tag matching (explicit categorization)
- **20%** Recent views (recency bias)
- **15%** Relations (explicit links)
- **5%** Engagement (thumbs up/down)

### 4. Heading-Level Chunking

Notes are automatically split at markdown headings for precise recommendations:

```markdown
# Main Topic
Content for main topic...

## Subtopic A
Content for subtopic A...

## Subtopic B
Content for subtopic B...
```

Each heading becomes a searchable chunk with its own embedding.

### 5. Workspace Management

Organize notes into workspaces with custom settings:
- Embedding model selection
- Max recommendations
- Semantic threshold
- Auto-save delay

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build core package
npm run build:core
```

### Run Web App

```bash
npm run dev:web
```

Open http://localhost:5173

### Run Desktop App

Requires Rust: https://www.rust-lang.org/tools/install

```bash
npm run dev:desktop
```

## Project Structure

```
eywa/
├── packages/
│   ├── core/              # Business logic and algorithms
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── embeddingService.ts      # Semantic analysis
│   │   │   │   ├── recommendationService.ts  # Ranking algorithm
│   │   │   │   ├── headingService.ts        # Markdown parsing
│   │   │   │   └── workspaceService.ts      # Workspace management
│   │   │   └── types/
│   │   │       └── note.ts                   # Type definitions
│   │   └── package.json
│   ├── web/               # Web application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── services/    # Web-specific services
│   │   │   ├── db/          # IndexedDB setup
│   │   │   └── App.tsx
│   │   └── package.json
│   └── desktop/           # Desktop application
│       ├── src-tauri/     # Rust/Tauri backend
│       └── package.json
└── package.json           # Root workspace config
```

## Tech Stack

### Core
- TypeScript
- @xenova/transformers (for embeddings)
- nanoid (ID generation)

### Web
- React 18
- Vite
- Dexie (IndexedDB)
- date-fns

### Desktop
- Tauri 1.5
- Rust
- Same web frontend

## Development

The project uses npm workspaces for monorepo management.

```bash
# Install all dependencies
npm install

# Build core package
npm run build:core

# Run web app
npm run dev:web

# Build web app
npm run build:web

# Run desktop app (requires Rust)
npm run dev:desktop

# Build desktop app
npm run build:desktop
```

## How Semantic Analysis Works

1. **Text to Embeddings**: When you write, the text is converted into a high-dimensional vector (embedding) using a transformer model

2. **Similarity Calculation**: Eywa compares embeddings using cosine similarity to find semantically related notes

3. **Multi-Signal Scoring**: Semantic similarity is combined with other signals for final ranking

4. **Real-time Recommendations**: As you type, recommendations update automatically with debouncing

## Extending Eywa

### Adding New Recommendation Signals

Edit `packages/core/src/services/recommendationService.ts` to add new scoring factors.

### Using Different Embedding Models

Configure in workspace settings. Any model from Hugging Face compatible with @xenova/transformers works.

### Custom Storage Backends

The core package is storage-agnostic. Implement your own storage layer in the web/desktop packages.

## License

MIT
