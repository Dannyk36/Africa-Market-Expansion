# Africa Market Expansion Roadmap

Created for the current product direction and codebase state.

## Product Goal

Build the most trusted and useful platform for evaluating African market expansion opportunities.

The product should help a user:

- understand which countries are attractive and why
- see what changed recently
- compare quantitative signals with qualitative policy and trade developments
- ask an AI advisor questions grounded in real evidence
- return regularly because the platform remembers their company, watchlist, and prior work

## Product Positioning

This platform should not compete as a generic AI chat tool.

It should compete as:

- an explainable African market intelligence platform
- a trusted decision-support workspace
- a place where hard data and official-source developments are combined into one view

## Why A User Comes Back

The strongest retention loops for this product are:

- saved company workspaces
- trusted-source updates and country alerts
- rankings that change when the world changes
- AI answers with visible evidence and memory
- weekly or daily briefings on watched countries or sectors

Without those loops, the product is useful once but not habit-forming.

## What Builds Trust

To be trusted over other dashboards or AI tools, the product needs:

- primary and official sources
- clear dates and recency labels
- methodology users can inspect
- confidence scoring
- evidence attached to every important insight
- separation between facts, model inference, and assumptions

## Current Strengths

- strong product direction
- broad market dataset for 54 countries
- AI advisor foundation
- trusted-source ingestion foundation
- onboarding and settings now exist
- ability to attach website and document context

## Current Weak Points

- public refresh/config routes create cost and abuse risk
- trusted-source extraction is still based on generic page scraping
- several provider options are surfaced before they are truly wired
- the UI says "heat map" but there is no actual Africa choropleth yet
- company/workspace memory is not first-class
- evidence and methodology are not visible enough to users
- personalization logic is still shallow

## Phase 1: Stabilize

Goal: make the product safe, honest, and operationally reliable.

Ship first:

- lock trusted-data refresh and schedule edits behind admin or authenticated access
- add SSRF protection and URL validation to website scraping
- make unsupported provider auth modes clearly `Coming Soon`
- add real error states instead of generic failures
- add document parsing for PDF and DOCX
- make rankings and advisor answers show `updated at` timestamps
- add a visible source/methodology notice on ranking and AI views

Success for this phase:

- no public endpoint can trigger expensive refresh jobs
- no misleading provider claims remain in the UI
- uploaded files match what the user expects the AI to read

## Phase 2: Trust And Clarity

Goal: make the product feel evidence-backed and visually credible.

Ship first:

- add an Africa heat map page with choropleth coloring by score
- add a country detail page with:
  - score breakdown
  - recent trusted events
  - reasons for current rank
  - neighboring-country comparison
- add a Sources & Methodology page
- add citations and evidence blocks to AI responses
- add confidence and recency badges across rankings and insights

Success for this phase:

- users can answer "why is this country ranked here?" without guessing
- users can visually scan Africa instead of reading only tables
- AI output is tied to visible evidence

## Phase 3: Retention

Goal: make users return because the product tracks their work and what changed.

Ship first:

- saved company workspaces
- watchlist for countries, sectors, and regions
- update feed showing what changed since the last visit
- advisor memory tied to a workspace
- saved reports and briefing history
- email or in-app digest workflow

Success for this phase:

- users revisit to check watched markets
- users continue an earlier analysis instead of starting from zero
- the platform feels like a workspace, not a one-time dashboard

## Phase 4: Premium Intelligence

Goal: make the product differentiated and difficult to replace.

Ship first:

- scenario planning and "what changed if..." simulation
- sector-specific ranking overlays
- event-weight tuning by industry
- portfolio or multi-country expansion planning
- AI-generated investment committee briefs
- benchmark competitors or peers in the same market

Success for this phase:

- the product supports higher-value decisions
- it moves beyond country ranking into strategy execution

## Best New Pages To Add

These add a lot of value without making the project too complex.

### 1. Heat Map

Highest ROI visualization.

Include:

- Africa choropleth map
- toggle between base score, adjusted score, GDP growth, business readiness, digital readiness, and risk
- click a country to open details
- filter by region

### 2. Country Intelligence

One page per country.

Include:

- current score
- score breakdown
- trend direction
- recent policy/trade/treaty events
- strengths, risks, and validation checklist
- similar countries

### 3. Watchlist

Simple and sticky.

Include:

- saved countries
- saved sectors
- latest updates
- alert severity

### 4. Sources & Methodology

Critical for trust.

Include:

- source list
- scoring formula
- update frequency
- confidence logic
- qualitative event handling rules

### 5. Workspace

Should be added once DB-backed flows are stable.

Include:

- company profile
- uploaded documents
- saved AI conversations
- market shortlist
- decision notes

## What Should Probably Be Dropped Or Deferred

These are not useless, but they are low ROI right now compared with the core trust and visualization work.

- plain text report download until reports are structured and cited
- outcome-tracking toggles until there is a real outcome workflow
- broad auth-provider dropdowns before actual provider-specific flows exist
- too many AI provider options if only a few are truly stable

## What Should Be Kept

- AI Advisor
- trusted-source ingestion concept
- comparison charts
- onboarding
- settings
- market rankings core

These are part of the right long-term product shape.

## Better Visualizations To Add

- Africa choropleth heat map
- country trend sparkline
- factor breakdown stacked bar
- region comparison radar or matrix
- event timeline by country
- confidence-over-time indicator
- "what changed" delta cards

The heat map is the clear first choice.

## AI Improvements That Matter

- answer with citations and evidence blocks
- explicitly label facts vs inference vs assumptions
- use workspace memory, not just raw chat history
- let users ask "what changed since last week?"
- let the AI compare two or three countries side by side
- let the AI generate a validation checklist before market entry
- let the AI explain ranking movement from new events

## What Is Still Missing Conceptually

- no visible methodology page
- no visible trust model
- no event review workflow
- no analyst review state for extracted events
- no source freshness scoring
- no true country timeline
- no recurring update loop for the user beyond manual refresh

## Recommended Build Order

1. Secure the backend and remove misleading UI states.
2. Add the heat map and country detail pages.
3. Add evidence and methodology views.
4. Add workspaces and watchlists.
5. Add recurring update digests and scenario planning.

## One-Sentence Product North Star

Make African market expansion decisions easier by combining trusted data, official developments, and explainable AI into one evidence-backed workspace.
