# BondLayer Shopper

A shopper-facing local proof of concept for BondLayer. It looks and behaves
like a consumer shopping product rather than a technical dashboard.

## What you can try

- Browse three simulated retailer storefronts and mock products.
- Ask for an iPhone, headphones, or running shoes in a ChatGPT-style chat.
- Compare delivered cash price with your relationship-adjusted cost.
- Give consent for one simulated Northstar private member offer.
- Change how strongly points and free returns affect your recommendation.
- Optionally connect OpenAI, Gemini, or Claude for live public-web research.

All catalogue prices, product availability, membership records, offers, and
checkout screens are simulated. Live-provider results are shown separately
with their sources and are not silently mixed into the mock catalogue.

## Recommended Windows setup

Use **Node.js 22 LTS** or **Node.js 24 LTS**. Odd-numbered Node releases such as
Node 23 are short-lived and some development dependencies may print engine
warnings.

In PowerShell:

```powershell
npm install
npm run dev
```

Then open the local URL printed by Vite, normally `http://localhost:5173`.

No WSL, Bash, Docker, or global Vinext installation is required for these two
commands.

To create and run a production build:

```powershell
npm run build
npm run start
```

## Optional real shopping-agent providers

The local demo works without any API key. To enable live web research, copy
`.env.example` to `.env.local` and add one or more keys:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

The keys are read only by the server route. They are never sent to the browser.
Do not prefix secrets with `VITE_`, and do not commit `.env.local`.

Restart `npm run dev` after changing the file. The provider menu in the chat
will display `ready` beside configured providers.

## Suggested presentation flow

1. Open **Stores**, choose Northstar, and browse the iPhone product.
2. Click **Ask agent**.
3. Send “Find me the best deal on an unlocked 256GB iPhone.”
4. Show that a competitor initially wins.
5. Click **Ask Northstar for my member offer** and approve the privacy notice.
6. Show Northstar moving to first place after the governed offer.
7. Open **My BondLayer** and change the points and returns preferences.
8. Optionally switch the chat from **Local demo** to a configured live provider.

## Folder guide

```text
app/shopper-app.tsx      shopper interface and interaction flow
app/api/agent/route.ts   optional server-side provider adapters
lib/catalog.ts           mock retailers, products, offers, and matching
public/products/         original simulated product imagery
```

If the hidden `.openai` folder is absent after copying the project, local
development still starts. That folder is used for optional Sites hosting, not
for the shopper demo itself.
