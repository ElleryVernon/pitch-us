# Pitch:US

**Pitch:US** is an AI-powered presentation generation platform that transforms ideas, documents, and prompts into professional, VC-ready pitch decks. Built with Next.js and designed for US venture capital audiences, it generates presentations following YC and 500 Startups standards with real-time streaming, custom templates, and comprehensive export capabilities.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

Pitch:US is a full-stack web application that automates the creation of investor-ready pitch decks. It combines Large Language Models (LLMs) for content generation, real-time streaming for responsive user experience, and a flexible template system for customizable designs.

### Key Capabilities

- **AI-Powered Content Generation**: Generates presentation outlines and slide content using LLMs via OpenRouter API
- **Real-Time Streaming**: Uses Server-Sent Events (SSE) to stream content generation progress to clients
- **Document Processing**: Extracts and processes content from uploaded PDF, DOCX, and PPTX files
- **Template System**: Supports custom HTML/React templates with JSON schema validation
- **Export Formats**: Generates presentations in PPTX and PDF formats
- **Image Generation**: Integrates with multiple image providers (OpenRouter, Pexels, Pixabay, OpenAI)
- **Database Persistence**: Stores presentations, slides, templates, and assets using PostgreSQL via Prisma ORM

### Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server-Sent Events (SSE)
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **LLM Integration**: OpenRouter API (supports multiple providers)
- **Image Processing**: Sharp, Canvas
- **PDF Generation**: Puppeteer with Chromium
- **PPTX Generation**: Custom PPTX model builder with Puppeteer DOM extraction
- **Storage**: Local filesystem and Supabase Storage (optional)

## Architecture

### System Components

```
┌─────────────────┐
│   Web Client    │
│   (Next.js UI)  │
└────────┬─────────┘
         │ HTTP/SSE
         │
┌────────▼─────────────────────────────────────┐
│         Next.js API Routes                   │
│  ┌──────────────────────────────────────┐   │
│  │  Presentation Handlers               │   │
│  │  - Create/Read/Update/Delete         │   │
│  │  - Stream generation (SSE)           │   │
│  │  - Export (PDF/PPTX)                  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Content Builders                    │   │
│  │  - Outline generation                │   │
│  │  - Slide content generation          │   │
│  │  - Image processing                  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Delta Parsers                       │   │
│  │  - JSON stream parsing               │   │
│  │  - Real-time field extraction        │   │
│  └──────────────────────────────────────┘   │
└────────┬─────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
┌───▼───┐ ┌──▼────┐   ┌─────▼─────┐  ┌────▼────┐
│Prisma │ │OpenRouter│ │  Puppeteer │  │Supabase │
│  ORM  │ │   API    │ │  (PDF/PPTX)│  │ Storage │
└───────┘ └─────────┘ └────────────┘  └─────────┘
```

### Data Flow

1. **Presentation Creation**:
   - User provides prompt or uploads document
   - System creates presentation record in database
   - Returns presentation ID

2. **Outline Generation** (Streaming):
   - Client connects to `/api/v1/outlines/stream/[id]`
   - Server streams outline generation via SSE
   - Outlines saved to database when complete

3. **Layout Selection**:
   - User selects template/layout
   - System prepares presentation with layout structure
   - Structure mapping created (which layout for each slide)

4. **Slide Generation** (Streaming):
   - Client connects to `/api/v1/presentations/stream/[id]`
   - Server generates slides concurrently (bounded concurrency)
   - Real-time updates sent via SSE (deltas, progress, completion)
   - Slides saved to database as they complete

5. **Export**:
   - PDF: Puppeteer renders presentation page, generates PDF
   - PPTX: Puppeteer extracts DOM elements, converts to PPTX model

### Database Schema

The application uses PostgreSQL with the following main entities:

- **Presentation**: Core presentation metadata (content, language, settings, outlines, layout, structure)
- **Slide**: Individual slides with content, layout assignment, and speaker notes
- **Template**: Template definitions with metadata
- **PresentationLayoutCode**: React/TSX component code for layouts
- **ImageAsset**: Generated and uploaded images
- **WebhookSubscription**: Webhook subscriptions for events

## Features

### Core Features

- ✅ **AI Content Generation**: Generates VC-ready outlines and slide content using LLMs
- ✅ **Real-Time Streaming**: SSE-based streaming for responsive user experience
- ✅ **Document Upload**: Process PDF, DOCX, PPTX files to extract content
- ✅ **Template System**: Custom HTML/React templates with JSON schema validation
- ✅ **Slide Editing**: AI-powered slide content editing via natural language prompts
- ✅ **Image Management**: Generate images from prompts or upload custom images
- ✅ **Export Formats**: Export presentations as PPTX or PDF
- ✅ **Font Management**: Upload and use custom fonts in presentations
- ✅ **Icon Library**: Search and use icons from Lucide icon library

### Advanced Features

- ✅ **Concurrent Generation**: Bounded concurrency for efficient slide generation
- ✅ **Delta Parsing**: Incremental JSON parsing for real-time field updates
- ✅ **Image Processing**: Automatic image generation and replacement in slide content
- ✅ **PPTX Model Extraction**: DOM-to-PPTX conversion using Puppeteer
- ✅ **Speaker Notes**: Automatic extraction and management of speaker notes
- ✅ **Webhook Support**: Subscribe to presentation events via webhooks

## Prerequisites

Before installing Pitch:US, ensure you have the following:

- **Node.js**: Version 18.x or higher
- **Bun**: Version 1.x or higher (package manager)
- **PostgreSQL Database**: PostgreSQL 14+ or Supabase PostgreSQL instance
- **OpenRouter API Key**: For LLM access (supports multiple providers)
- **Optional**: Supabase account for cloud storage

### System Requirements

- **Memory**: Minimum 2GB RAM (4GB+ recommended for production)
- **Storage**: At least 1GB free space for app data and temporary files
- **Network**: Internet connection for API calls and image generation

## Installation

### Clone the Repository

```bash
git clone https://github.com/pitch-us/pitch-us-v3.git
cd pitch-us-v3
```

### Install Dependencies

```bash
bun install
```

This will install all Node.js dependencies and generate the Prisma client.

### Database Setup

1. **Create a PostgreSQL database** (or use Supabase):
   ```bash
   # Using Supabase (recommended)
   # Create a new project at https://supabase.com
   # Copy the connection string from project settings
   ```

2. **Configure database connection** in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   DIRECT_URL="postgresql://user:password@host:port/database"
   ```

3. **Run database migrations**:
   ```bash
   bunx prisma migrate deploy
   ```

   Or for development:
   ```bash
   bunx prisma db push
   ```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# OpenRouter API (Required)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4.1-mini
OPENROUTER_OUTLINE_MODEL=mistralai/ministral-8b-2412
OPENROUTER_IMAGE_MODEL=google/gemini-3-pro-image-preview  # Optional: for image generation

# Database (Required)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Image Provider (Optional, defaults to pexels)
IMAGE_PROVIDER=pexels
PEXELS_API_KEY=your_pexels_key
```

See [Configuration](#configuration) for complete environment variable documentation.

### Build and Run

**Development mode**:
```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

**Production build**:
```bash
bun run build
bun run start
```

## Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM access | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Default LLM model for content generation | `openai/gpt-4.1-mini` |
| `OPENROUTER_OUTLINE_MODEL` | LLM model for outline generation | `mistralai/ministral-8b-2412` |
| `OPENROUTER_IMAGE_MODEL` | LLM model for image generation (optional) | `google/gemini-3-pro-image-preview` |
| `DATABASE_URL` | PostgreSQL connection string (pooler) | `postgresql://...` |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) | `postgresql://...` |

#### Optional Variables

**Supabase Storage** (for cloud file storage):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_key
SUPABASE_STORAGE_BUCKET=pitchdecks
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=pitchdecks
```

**Image Provider Configuration**:
```env
# Provider options: openrouter, pexels, pixabay, openai
IMAGE_PROVIDER=pexels

# Pexels (free, recommended)
PEXELS_API_KEY=your_pexels_key

# Pixabay (free alternative)
PIXABAY_API_KEY=your_pixabay_key

# OpenAI (requires separate key)
OPENAI_API_KEY=your_openai_key
```

**OpenRouter Additional Options**:
```env
# Optional: Custom site URL and app name for OpenRouter
OPENROUTER_SITE_URL=https://your-site.com
OPENROUTER_APP_NAME=Pitch:US
```

**Puppeteer/Chromium** (for PDF/PPTX export):
```env
# Custom Chromium executable path (if not using bundled)
PUPPETEER_EXECUTABLE_PATH=/path/to/chromium

# Custom Chromium download URL
CHROMIUM_DOWNLOAD_URL=https://...
```

**Storage Directories**:
```env
# Temporary directory for file processing
TEMP_DIRECTORY=/tmp/pitch-us

# App data directory (defaults to ./app_data)
APP_DATA_DIRECTORY=./app_data
```

**Analytics**:
```env
# Disable anonymous telemetry
DISABLE_ANONYMOUS_TRACKING=true
```

### Configuration Files

- **`prisma/schema.prisma`**: Database schema definition
- **`next.config.mjs`**: Next.js configuration (standalone output, image optimization, etc.)
- **`tailwind.config.ts`**: Tailwind CSS configuration
- **`tsconfig.json`**: TypeScript configuration
- **`components.json`**: shadcn/ui component configuration
- **`cypress.config.ts`**: Cypress E2E test configuration

### Important Notes

- **Standalone Build**: The project uses Next.js standalone output mode for optimized Docker deployments
- **Template Manifest**: Templates are automatically indexed via `generate-templates-manifest.ts` script
- **Legacy API Support**: `/api/v1/ppt/[...path]` provides backward compatibility with legacy API endpoints
- **Runtime**: Most API routes use Node.js runtime for file system access and Puppeteer

## Usage

### Web Interface

1. **Create a Presentation**:
   - Enter a prompt describing your presentation
   - Optionally upload a document (PDF, DOCX, PPTX)
   - Select number of slides and language
   - Click "Generate"

2. **Review Outlines**:
   - System generates slide outlines in real-time
   - Review and edit outlines if needed

3. **Select Template**:
   - Choose a presentation template
   - System prepares presentation structure

4. **Generate Slides**:
   - Slides are generated with real-time progress updates
   - Content appears incrementally as it's generated

5. **Edit and Customize**:
   - Edit slide content using AI-powered editing
   - Add images, icons, and custom graphics
   - Adjust layouts and styling

6. **Export**:
   - Export as PPTX (PowerPoint format)
   - Export as PDF (for sharing)

### API Usage

See [API Documentation](#api-documentation) for detailed API usage examples.

## API Documentation

### Base URL

All API endpoints are prefixed with `/api/v1`.

### Authentication

Currently, the API does not require authentication. In production deployments, implement authentication middleware.

**Note**: Legacy API endpoints are available at `/api/v1/ppt/[...path]` for backward compatibility. New implementations should use the structured endpoints documented below.

### Endpoints

#### Presentations

##### Create Presentation

```http
POST /api/v1/presentations
Content-Type: application/json

{
  "content": "Startup pitch deck about AI-powered healthcare",
  "n_slides": 12,
  "language": "en",
  "tone": "professional",
  "verbosity": "standard",
  "include_table_of_contents": false,
  "include_title_slide": true,
  "web_search": false,
  "document_content": "Optional extracted text from uploaded files",
  "file_metadata": [{"name": "document.pdf", "size": 1024000, "type": "application/pdf"}]
}
```

**Response**:
```json
{
  "id": "uuid",
  "content": "...",
  "n_slides": 12,
  "language": "en",
  ...
}
```

##### Get Presentation

```http
GET /api/v1/presentations/{id}
```

Returns complete presentation with all slides.

##### Update Presentation

```http
PATCH /api/v1/presentations/{id}
Content-Type: application/json

{
  "content": "Updated presentation content",
  "title": "New Title"
}
```

Updates presentation metadata.

##### Delete Presentation

```http
DELETE /api/v1/presentations/{id}
```

Deletes a presentation and all associated slides.

##### Get All Presentations

```http
GET /api/v1/presentations
```

Returns list of all presentations (with optional query parameters for filtering).

##### Get Draft Presentations

```http
GET /api/v1/presentations/drafts
```

Returns list of draft presentations.

##### Stream Slide Generation

```http
GET /api/v1/presentations/stream/{id}
Accept: text/event-stream
```

Returns Server-Sent Events stream with:
- `meta`: Presentation metadata
- `slides_init`: Initial placeholder slides
- `slide_delta`: Incremental content updates
- `slide`: Complete slide objects
- `progress`: Generation progress
- `complete`: Final completion event

**Example Client Code**:
```typescript
const eventSource = new EventSource(`/api/v1/presentations/stream/${presentationId}`);

eventSource.addEventListener('slide_delta', (event) => {
  const data = JSON.parse(event.data);
  // Update UI with incremental content
  updateSlideField(data.index, data.path, data.value);
});

eventSource.addEventListener('slide', (event) => {
  const data = JSON.parse(event.data);
  // Update UI with complete slide
  updateSlide(data.index, data.slide);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  // Handle completion
  eventSource.close();
});
```

##### Stream Outline Generation

```http
GET /api/v1/outlines/stream/{id}
Accept: text/event-stream
```

Returns SSE stream with outline generation progress.

##### Prepare Presentation

```http
POST /api/v1/presentations/{id}/prepare
Content-Type: application/json

{
  "outlines": [
    {"content": "INTRO: Company tagline"},
    {"content": "PROBLEM: Hero $2.3B - Market problem"}
  ],
  "layout": {
    "name": "modern-template",
    "ordered": false,
    "slides": [
      {
        "id": "layout-1",
        "json_schema": {...}
      }
    ]
  }
}
```

Prepares presentation with outlines and layout for slide generation.

##### Export PPTX

```http
POST /api/v1/presentations/{id}/export/pptx
Content-Type: application/json

{
  "slides": [
    {
      "elements": [...],
      "backgroundColor": "#ffffff"
    }
  ]
}
```

#### Documents

##### Read Document

```http
POST /api/v1/documents/read
Content-Type: application/json

{
  "file_path": "/path/to/document.txt"
}
```

Reads text content from uploaded documents (TXT, MD, etc.).

##### Preview Document

```http
POST /api/v1/documents/preview
Content-Type: application/json

{
  "file_path": "/path/to/document.pdf"
}
```

Generates preview images from document files (PDF, DOCX, PPTX).

#### Exports

##### Export PDF

```http
POST /api/v1/exports/pdf
Content-Type: application/json

{
  "slides": [...],
  "options": {
    "format": "A4",
    "landscape": false
  }
}
```

Generates PDF from slide data.

##### Export PPTX Model

```http
GET /api/v1/exports/pptx-model?presentation_id={id}
```

Returns PPTX model data for a presentation.

#### Fonts

##### List Fonts

```http
GET /api/v1/fonts
```

Returns list of available fonts.

##### Upload Font

```http
POST /api/v1/fonts
Content-Type: multipart/form-data

file: [font file]
```

Uploads a custom font file.

##### Delete Font

```http
DELETE /api/v1/fonts/{id}
```

Deletes a font file.

#### Icons

##### Search Icons

```http
GET /api/v1/icons/search?query=search+term
```

Searches for icons from Lucide icon library.

#### Layouts

##### Save Layout

```http
POST /api/v1/layouts
Content-Type: application/json

{
  "layout_name": "custom-layout",
  "components": [
    {
      "slide_number": 0,
      "component_code": "export default function Slide() {...}",
      "component_name": "intro-slide"
    }
  ]
}
```

Saves custom layout components to the file system.

#### Webhooks

##### Subscribe to Webhook

```http
POST /api/v1/webhook
Content-Type: application/json

{
  "url": "https://your-webhook-url.com/events",
  "events": ["presentation.created", "presentation.completed"]
}
```

Subscribes to presentation events.

##### Delete Webhook

```http
DELETE /api/v1/webhook/{id}
```

Removes a webhook subscription.

#### Configuration

##### Get Telemetry Config

```http
GET /api/v1/config/telemetry
```

Returns telemetry configuration status.

#### Images

##### Generate Image

```http
GET /api/v1/images/generate?prompt=a%20sunset%20over%20mountains
```

Returns image URL path.

##### Upload Image

```http
POST /api/v1/images
Content-Type: multipart/form-data

file: [image file]
```

##### List Images

```http
GET /api/v1/images/uploaded
GET /api/v1/images/generated
```

##### Get Image

```http
GET /api/v1/images/{id}
```

Returns image file or metadata.

##### Delete Image

```http
DELETE /api/v1/images/{id}
```

Deletes an image asset.

#### Templates

##### List Templates

```http
GET /api/v1/templates
```

Returns array of available templates.

##### Get Template

```http
GET /api/v1/templates/{id}
```

Returns template with all layout codes.

##### Save Template

```http
POST /api/v1/templates/save
Content-Type: application/json

{
  "layouts": [
    {
      "presentation": "template-id",
      "layout_id": "layout-1",
      "layout_name": "Slide 1",
      "layout_code": "export default function Slide() {...}",
      "fonts": ["Inter", "Roboto"]
    }
  ]
}
```

##### Get Template Summary

```http
GET /api/v1/templates/summary
```

Returns summary of all templates with metadata.

##### Delete Template

```http
DELETE /api/v1/templates/{id}
```

Deletes a template.

#### Slides

##### Edit Slide

```http
POST /api/v1/slides
Content-Type: application/json

{
  "id": "slide-id",
  "prompt": "Change the revenue number to $5M"
}
```

Uses AI to edit slide content based on natural language prompt.

##### Convert Slide to HTML

```http
POST /api/v1/slides/transform/to-html
Content-Type: application/json

{
  "image": "/path/to/slide.png",
  "xml": "<slide>...</slide>"
}
```

##### Convert HTML to React

```http
POST /api/v1/slides/transform/html-to-react
Content-Type: application/json

{
  "html": "<div>...</div>"
}
```

##### Edit HTML Content

```http
POST /api/v1/slides/transform/html-edit
Content-Type: application/json

{
  "html": "<div>...</div>",
  "prompt": "Make the text larger and change color to blue"
}
```

Uses AI to edit HTML content based on natural language prompt.

##### Convert Edit to HTML

```http
POST /api/v1/slides/transform/edit-html
Content-Type: application/json

{
  "slide_id": "slide-id",
  "prompt": "Change the heading to 'Our Solution'"
}
```

Converts slide edits to HTML format.

### Error Responses

All endpoints return errors in a consistent format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

HTTP status codes:
- `400`: Bad Request (invalid input)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server-side error)
- `503`: Service Unavailable (resource not ready)

## Development

### Project Structure

```
pitch-us-v3/
├── src/
│   ├── app/
│   │   ├── api/v1/              # API routes
│   │   │   ├── config/          # Configuration endpoints
│   │   │   ├── documents/       # Document processing (read, preview)
│   │   │   ├── exports/         # Export endpoints (PDF, PPTX model)
│   │   │   ├── fonts/           # Font management
│   │   │   ├── icons/           # Icon search
│   │   │   ├── images/          # Image management
│   │   │   ├── layouts/         # Layout management
│   │   │   ├── outlines/        # Outline generation
│   │   │   ├── ppt/             # Legacy API compatibility layer
│   │   │   │   ├── handlers/    # Business logic handlers
│   │   │   │   ├── utils/       # Utility functions
│   │   │   │   └── types/       # Type definitions
│   │   │   ├── presentations/   # Presentation CRUD endpoints
│   │   │   ├── slides/          # Slide editing and transforms
│   │   │   ├── templates/       # Template management
│   │   │   └── webhook/         # Webhook subscriptions
│   │   └── (presentation-generator)/  # Frontend pages
│   │       ├── components/      # React components
│   │       ├── context/         # React context providers
│   │       ├── hooks/           # Custom React hooks
│   │       ├── outline/         # Outline generation UI
│   │       ├── pdf-maker/       # PDF generation UI
│   │       └── presentation/    # Presentation editor
│   ├── server/                  # Server-side utilities
│   │   ├── db/                  # Database access layer
│   │   ├── llm.ts               # LLM integration
│   │   ├── images.ts            # Image generation
│   │   ├── pptx/                # PPTX export utilities
│   │   ├── storage.ts            # Storage utilities
│   │   └── ...
│   ├── shared/                  # Shared code (client + server)
│   │   ├── components/          # Shared UI components
│   │   ├── lib/                 # Shared utilities
│   │   ├── models/              # Data models
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/                # Shared utility functions
│   ├── stores/                  # Zustand state management
│   └── presentation-templates/  # Built-in templates
│       ├── data-driven/         # Data-driven template
│       ├── minimal-investor/    # Minimal investor template
│       ├── product-narrative/   # Product narrative template
│       └── vision-bold/         # Vision bold template
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── scripts/                      # Build and utility scripts
│   ├── generate-templates-manifest.ts  # Template manifest generator
│   └── delete-recent-presentations.ts  # Utility scripts
├── public/                       # Static assets
└── cypress/                      # E2E tests
```

### Development Workflow

1. **Start Development Server**:
   ```bash
   bun run dev
   ```

2. **Database Changes**:
   ```bash
   # Edit prisma/schema.prisma
   bunx prisma db push          # Apply changes (dev)
   bunx prisma migrate dev      # Create migration (prod)
   ```

3. **Generate Prisma Client**:
   ```bash
   bunx prisma generate
   ```

4. **Run Linter**:
   ```bash
   bun run lint
   ```

5. **Bundle Analysis**:
   ```bash
   bun run analyze
   ```
   Generates bundle size analysis report.

6. **Database Studio**:
   ```bash
   bun run db:studio
   ```
   Opens Prisma Studio for database management UI.

7. **Create Migration**:
   ```bash
   bun run db:migrate
   ```
   Creates a new database migration (for production).

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (via ESLint)
- **Linting**: ESLint with Next.js config
- **Comments**: Google-style JSDoc comments for all public functions

### Testing

```bash
# Run Cypress tests
bunx cypress run
```

### Building Templates

Templates are React/TSX components stored in `src/presentation-templates/`. To add a new template:

1. Create a new directory in `src/presentation-templates/` (e.g., `my-template/`)
2. Add slide components (e.g., `intro-slide.tsx`, `problem-slide.tsx`)
3. Create `settings.json` with template metadata:
   ```json
   {
     "description": "Template description",
     "ordered": false,
     "default": false,
     "layoutOrder": ["intro-slide.tsx", "problem-slide.tsx"]
   }
   ```
4. Run `bun run generate:templates-manifest` to update manifest (automatically runs on `dev` and `build`)

**Template Structure**:
- Each template directory contains slide components (`.tsx` files)
- `settings.json` defines template metadata and layout ordering
- Components receive slide data via props and render using React
- Templates can use shared components from `src/presentation-templates/components/`

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: `PrismaClientInitializationError` or connection timeout

**Solutions**:
- Verify `DATABASE_URL` and `DIRECT_URL` are correctly set
- Ensure database is accessible from your network
- For Supabase: Use pooler URL for `DATABASE_URL` and direct URL for `DIRECT_URL`
- Check if database requires SSL: add `?sslmode=require` to connection string

#### Puppeteer/Chromium Issues

**Problem**: PDF/PPTX export fails or Chromium not found

**Solutions**:
- Install system dependencies: `apt-get install -y chromium-browser` (Linux) or use bundled Chromium
- Set `PUPPETEER_EXECUTABLE_PATH` to point to Chromium executable
- For serverless: Use `@sparticuz/chromium` and configure accordingly
- Increase timeout: Some exports may take longer, adjust `maxDuration` in route handlers

#### Template Manifest Not Generated

**Problem**: Templates not appearing in UI

**Solutions**:
- Run `bun run generate:templates-manifest` manually
- Check that template directories contain valid `.tsx` files
- Verify `settings.json` is valid JSON
- Check console for template generation errors

#### Image Generation Fails

**Problem**: Images not generating or API errors

**Solutions**:
- Verify API keys are set correctly (`PEXELS_API_KEY`, `OPENAI_API_KEY`, etc.)
- Check `IMAGE_PROVIDER` environment variable matches your configured provider
- Verify API rate limits haven't been exceeded
- Check network connectivity to image provider APIs

#### Prisma Client Not Generated

**Problem**: `@prisma/client` import errors

**Solutions**:
- Run `bunx prisma generate` manually
- Ensure `postinstall` script ran successfully: `bun install`
- Check `prisma/schema.prisma` for syntax errors
- Verify Prisma version compatibility

### Performance Optimization

- **Concurrent Generation**: Slide generation uses bounded concurrency (default: 3) to balance speed and resource usage
- **Image Caching**: Generated images are cached to reduce API calls
- **Database Indexing**: Ensure database indexes are created (Prisma handles this automatically)
- **Bundle Size**: Use `bun run analyze` to identify large dependencies

### Debug Mode

Enable verbose logging by setting:
```env
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## Deployment

### Docker Deployment

The application includes Docker support for easy deployment:

```bash
docker build -t pitch-us .
docker run -p 5000:3000 \
  -e OPENROUTER_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  -v ./app_data:/app_data \
  pitch-us
```

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

**Important**: 
- Set `PUPPETEER_EXECUTABLE_PATH` for PDF/PPTX export in serverless environments
- Use `@sparticuz/chromium` for AWS Lambda deployments
- Configure appropriate timeout values for long-running operations (default: 300 seconds)

### Environment-Specific Considerations

**Serverless (Vercel, AWS Lambda)**:
- Use Supabase Storage for file persistence
- Configure Puppeteer with serverless Chromium
- Set appropriate timeout values

**Traditional Server**:
- Can use local filesystem for storage
- Full Puppeteer capabilities available
- Consider using process manager (PM2) for production

### Production Checklist

- [ ] Configure all required environment variables
- [ ] Set up PostgreSQL database with proper backups
- [ ] Configure Supabase Storage (if using cloud storage)
- [ ] Set up monitoring and error tracking
- [ ] Configure CORS if needed for API access
- [ ] Set up rate limiting for API endpoints
- [ ] Configure CDN for static assets
- [ ] Set up SSL/TLS certificates
- [ ] Configure Puppeteer/Chromium for PDF/PPTX export
- [ ] Set appropriate timeout values for long-running operations
- [ ] Enable production optimizations (image optimization, bundle minification)
- [ ] Test template manifest generation
- [ ] Verify all API endpoints are accessible
- [ ] Set up database connection pooling
- [ ] Configure telemetry and analytics (if needed)

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Ensure code follows project style guidelines
6. Commit with descriptive messages
7. Push to your fork
8. Open a Pull Request

### Code Contribution Guidelines

- **Follow TypeScript best practices**: Use proper types, avoid `any`
- **Write comprehensive comments**: All public functions should have JSDoc comments
- **Test your changes**: Ensure existing tests pass, add new tests for new features
- **Follow existing patterns**: Match the code style and architecture of existing code
- **Update documentation**: Update README and code comments as needed

### Reporting Issues

When reporting issues, please include:
- Description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- **Discord**: [Join our community](https://discord.gg/9ZsKKxudNE)
- **X (Twitter)**: [@pitch_us](https://x.com/pitch_us)
- **Issues**: [GitHub Issues](https://github.com/pitch-us/pitch-us-v3/issues)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- LLM access via [OpenRouter](https://openrouter.ai/)
- Database powered by [Prisma](https://www.prisma.io/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Note**: This is an open-source project. For enterprise deployments, custom integrations, or partnership opportunities, please contact the maintainers.
