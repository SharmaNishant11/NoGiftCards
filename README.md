# NoGiftCards

> **DiamondHacks 2026** — Built by Sachin Ramanathan, Sujal Gour & Nishant Sharma

An AI-powered gift discovery platform that deploys autonomous browser agents to find genuinely thoughtful, personalized gifts — instead of yet another gift card.

---

## Motivation (or: Why We Built This Instead of Sleeping)

Picture this: it's your best friend's birthday. You open Amazon. You stare at the search bar. You type "gift." You buy a $50 gift card. You tell yourself you'll do better next year. You don't.

We've all been there. The gift card is the white flag of gift-giving — a declaration to the recipient that you thought of them *exactly* as much as it took to open a new tab. And yet, finding a good gift is genuinely hard. You need to know the person, scour dozens of stores, and somehow land on something that says "I know you" rather than "I panicked."

So we built **NoGiftCards** — an app that:
1. Reads your texts/DMs with the person and psychoanalyzes them (ethically, we promise)
2. Sends autonomous AI browser agents across the internet to hunt down gifts
3. Returns a curated, scored shortlist of things they'll actually want

You go from "ugh, what do I get them" to "wow I'm a thoughtful person" in under 20 minutes. No gift cards harmed in the making.

---

## What It Does

**NoGiftCards** turns gift-giving into an adventure. Here's the flow:

### 1. Profile Your Recipient
Two ways to tell us about the person:
- **Paste their messages** — drop in a conversation (WhatsApp, iMessage, etc.) and our AI extracts their personality, hobbies, quirks, and vibe
- **Manual wizard** — use the multi-step trait selector to describe them yourself

This produces a **Gift DNA** profile: a 5-dimensional radar of `Sentimental | Practical | Adventurous | Luxurious | Quirky` scores.

### 2. Release the Agents
Hit the big button and watch the magic:
- An autonomous Browser Use agent spins up and starts navigating real websites
- It visits UncommonGoods, Etsy, Amazon, and niche specialty stores
- An **Adventure Map** shows live quest progress across locations
- A **Live Agent Thought Stream** shows what the AI is thinking in real time
- You can even watch the agent browse via a live browser embed

### 3. Collect Discoveries
As the agent finds gifts, they appear on your board with:
- **Alchemy Score** (0–100%) — how well the gift matches the recipient
- Sub-scores: personality match, uniqueness, budget fit, surprise factor
- Direct purchase link — one click to buy

### 4. Checkout
Add favorites to your cart, get direct links to purchase on the original sites. Done. You're a hero. Take the credit.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18.3, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui (Radix UI), custom keyframe animations |
| **State / Data** | TanStack React Query 5, React Hook Form + Zod |
| **Visualization** | Recharts (radar chart), Embla Carousel |
| **Backend** | Supabase (PostgreSQL + Edge Functions in Deno/TypeScript) |
| **AI / LLM** | Google Gemini Flash (personality extraction, gift scoring) |
| **Browser Automation** | Browser Use API v3 (autonomous shopping agents) |
| **Notifications** | Sonner |
| **Testing** | Vitest 3, @testing-library/react, Playwright (E2E) |
| **Tooling** | ESLint 9, Bun, npm |

---

## Architecture

The app is split into a React SPA frontend and 5 Supabase Edge Functions:

```
Browser (React SPA)
     │
     ├── /profile        → ConversationAnalyzer or RecipientWizard
     │        │
     │        └──► analyze-profile (Edge Fn) ──► Gemini Flash API
     │                                              └── returns Gift DNA profile
     │
     ├── /quest          → QuestPage (main hub)
     │        │
     │        ├──► launch-quest (Edge Fn) ──► Browser Use API v3
     │        │                                  └── spawns autonomous agent session
     │        │                                  └── returns questId + live_url
     │        │
     │        ├──► quest-status (Edge Fn) ◄── polls every 3s
     │        │         └── reads: quests, discoveries, quest_messages tables
     │        │
     │        └──► redirect-quest (Edge Fn) ──► Browser Use send_message
     │                                           └── mid-quest agent redirection
     │
     └── /confirmation   → gift links + checkout
```

**Database tables (PostgreSQL via Supabase):**
- `quests` — session state, profile JSON, live_url, status
- `discoveries` — gift results with scores stored as JSONB
- `quest_messages` — agent thought stream for live UI updates

---

## Technical Highlights

### Real-Time Browser Automation
We use the [Browser Use API](https://browser-use.com) to spawn fully autonomous browser agents. The agent receives a task prompt (built from the recipient's Gift DNA profile) and independently navigates real retail websites, extracts gift candidates, and emits `GIFT_FOUND` markers that we parse and stream to the UI incrementally. Users can also watch the agent browse live via an embedded iframe.

### LLM Personality Extraction
Pasted conversations go through Gemini Flash with a structured tools call. The model extracts:
- Personality traits, quirks, hobbies
- A natural-language "Gift DNA summary"
- Numeric scores across 5 personality dimensions

The result drives both the radar chart visualization and the browser agent's shopping task prompt.

### Incremental Gift Discovery
Rather than waiting for all gifts to be found, discoveries are written to the DB as they happen and polled every 3 seconds. Cards animate onto the board as they arrive — the UI gives the feeling of gifts being "discovered" in real time.

### Mid-Quest Agent Redirection
While the agent is running, users can send custom instructions (e.g., "focus on Etsy, keep it under $40") via the `redirect-quest` function, which forwards the message to the live Browser Use session via their send_message API.

### 5D Gift DNA Radar
A Recharts `RadarChart` visualizes the recipient's personality across five axes. The chart updates live as users adjust traits in the manual wizard, giving instant visual feedback on the profile.

### Type-Safe Full Stack
- Frontend: strict TypeScript, Zod schema validation on all forms
- Backend: Deno/TypeScript Edge Functions
- DB: auto-generated Supabase TypeScript types (`Database` interface)
- Shared domain types: `RecipientProfile`, `GiftDNA`, `Discovery`, `QuestStatusResponse`

---

## Running Locally

### Prerequisites
- Node.js 18+ or Bun
- A Supabase project (for backend features)
- Browser Use API key (for live agent functionality)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd gift-alchemy-quest
npm install         # or: bun install

# Start dev server (localhost:8080)
npm run dev
```

### Available Scripts

```bash
npm run dev          # Dev server with HMR on :8080
npm run build        # Production build
npm run build:dev    # Dev mode build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run test         # Run Vitest tests once
npm run test:watch   # Run Vitest in watch mode
```

### Environment Variables

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

Server-side variables (set in Supabase dashboard → Edge Functions → Secrets):

```
BROWSER_USE_API_KEY=<browser-use-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
LOVABLE_API_KEY=<gemini-gateway-key>
```

### Deploying Supabase Functions

```bash
# Requires Supabase CLI
supabase login
supabase link --project-ref <project-id>
supabase functions deploy
```

### Demo Mode

No API keys? No problem. Use `questId=mock` in the URL or let the app fall back automatically. Mock profiles, gifts, and thought streams are available in [src/data/mockData.ts](src/data/mockData.ts).

---

## Project Structure

```
gift-alchemy-quest/
├── src/
│   ├── pages/              # Index, ProfilePage, QuestPage, ConfirmationPage
│   ├── components/         # 22 components (AdventureMap, GiftDNARadar, etc.)
│   │   └── ui/             # shadcn/ui primitives
│   ├── hooks/              # useQuestPolling, use-mobile, use-toast
│   ├── integrations/
│   │   └── supabase/       # Client setup + auto-generated types
│   ├── types/              # Domain TypeScript interfaces
│   └── data/               # Mock data for offline/demo mode
├── supabase/
│   ├── functions/          # 5 Deno edge functions
│   │   ├── launch-quest/
│   │   ├── analyze-profile/
│   │   ├── quest-status/
│   │   ├── redirect-quest/
│   │   └── get-discoveries/
│   └── migrations/         # DB schema
├── public/                 # Static assets
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

*Stop giving gift cards. You're better than that.*
