

# Plan: Make NoGiftCards Unhinged-Funny Everywhere (No Theme, Just Vibes)

## Overview

Strip out all the "alchemy/quest/potion" fantasy language and replace it with chaotic, irreverent, self-aware humor throughout the entire app. No consistent theme -- just genuinely funny copy, absurd microcopy, and personality in every corner.

## What Changes

### 1. Landing Page (`src/pages/Index.tsx`)
- Hero: "⚗️" becomes a rotating emoji (🚨🎁😤💀🫠)
- Headline: "Stop Giving Gift Cards, You Coward"
- Subhead: "Paste their texts. We'll psychoanalyze them (ethically, probably) and unleash AI agents to find a gift that proves you actually listen."
- CTA: "Fine, I'll Be A Good Friend →"
- Stats become: `{ 😤, 7, "Gift Cards Prevented" }`, `{ 💀, 2,847, "Hours of Panicked Googling Saved" }`, `{ 🫠, 100, "% Chance You'll Cry At How Good These Are" }`
- Features rewritten:
  - "📱 Paste Their Texts (We Won't Judge)" / "We read your friend's unhinged 2am messages so you don't have to summarize their personality yourself."
  - "🤖 Watch An AI Shop For You" / "A real browser agent goes feral across Etsy, Amazon, and weird niche sites. You can literally watch it happen. It's oddly satisfying."
  - "📊 Scored By Science* (*Not Science)" / "Every gift gets a match score. It's based on AI analysis, vibes, and a little bit of audacity."
- Social proof: "Built for people who once gave someone a candle and still think about it at 3am"
- Footer: keep tech credits, add "No gift cards were harmed in the making of this website"

### 2. Profile Page (`src/pages/ProfilePage.tsx`)
- Title: "Recipient Profiler" → "Tell Us About Your Victim"
- Method toggle: "📝 Paste a Conversation" → "📱 Dump Their Texts" / "🔮 Manual Profile" → "🧠 I'll Describe Them Myself (Unreliably)"
- Notes placeholder: "Anything else? Allergies, exes to avoid gifting similarly to, that one time they said they 'don't need anything'..."
- Launch button: "⚗️ Seal the Profile & Launch Quest" → "🚀 Release The Agents (No Turning Back)"
- Launching state: "⚗️ Launching quest..." → "🏃 The agents are putting on pants..."
- AI summary header: "🧠 AI's Read" → "🧠 What We Extracted From Their Soul"
- Toast on launch: "⚗️ Quest launched!" → "🏃 Agents deployed! They're already judging your friend's taste."

### 3. Quest Page (`src/pages/QuestPage.tsx`)
- Title: "Quest Dashboard" → "Mission Control (Very Official)"
- LIVE badge stays, but loading text: "⚗️ The agents are hunting..." → "🏃 An AI is literally browsing the internet for you right now. We live in the future."
- Empty state: "Complete the profile to begin your quest" → "You haven't told us about anyone yet. We can't read minds. Yet."
- Still hunting text: "⚗️ Still hunting for more gifts..." → "🔍 Still digging. The AI just whispered 'ooh what about this one' to itself."
- Share toast: "🔗 Quest link copied!" → "🔗 Link copied! Now your friends can judge your gift-giving process."
- Discoveries header: "🔍 Discoveries" → "🎁 Things That Aren't Gift Cards"
- Shared view text: "This quest was shared with you" → "Someone shared their gift-hunting session with you. You're basically a spectator at this point."

### 4. Agent Thought Stream (`src/components/AgentThoughtStream.tsx`)
- Title: "🧠 Agent Thinks Out Loud" → "🧠 The AI Is Muttering To Itself"

### 5. Adventure Map (`src/components/AdventureMap.tsx`)
- Title: "🗺️ Adventure Map" → "🗺️ Where The AI Has Been (It Gets Around)"

### 6. Gift Battle (`src/components/GiftBattle.tsx`)
- Title: "⚔️ Gift Battle" → "⚔️ THUNDERDOME: Two Gifts Enter, One Gift Leaves"
- Crown button: "Crown this gift 👑" → "This one. This is the one. 👑"
- Eliminated text: "eliminated" → "sent home crying"
- After winner: "Agent is refining your taste profile..." → "Noted. We're updating your permanent file."

### 7. Redirect Bar (`src/components/RedirectBar.tsx`)
- Title: "⚡ Redirect the Agent" → "📢 Yell At The AI"
- Placeholder: "e.g. Focus on handmade items..." → "e.g. No more mugs, try something weird..."
- Button: "Redirect" → "SEND IT"

### 8. Discovery Card (`src/components/DiscoveryCard.tsx`)
- Score toggle: "⚗️ Show/Hide Alchemy Score" → "🔬 Show/Hide Why We Think This Slaps"

### 9. Confirmation Page (`src/pages/ConfirmationPage.tsx`)
- Headline: "Quest Complete, Brave Gifter!" → "You Actually Did It. You Absolute Legend."
- Subtext: "Your quest has been fulfilled" → "You didn't give a gift card. Your ancestors are proud."
- New quest button: "🔮 Start a New Quest" → "🔁 Do It Again (For Someone Else, Hopefully)"
- Click hint: "Click each link to buy directly from the store" → "Click to buy. We don't take a cut. We're just here for the emotional satisfaction."

### 10. Empty State (`src/components/EmptyState.tsx`)
No structural change, just driven by the props from parent pages.

### 11. QuestCart (`src/components/QuestCart.tsx`)
- Checkout button text and any "quest" language → funnier equivalents

### 12. Memory Update (`.lovable/memory/index.md`)
- Update core rule to reflect "no theme, just funny" approach

## Technical Details

- Pure copy/text changes across ~12 files
- No structural, layout, or styling changes
- No new dependencies
- No database changes
- Fonts, colors, and animations stay the same (dark navy + gold still works great for this)

