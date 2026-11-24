# Shanaya App — Interactive Frontend Prototype

A responsive Next.js 15 + TypeScript + Tailwind CSS concept for a fictional AI companion app.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Included

- Responsive desktop sidebar and mobile bottom navigation
- Home dashboard with conversation starters, featured Moments, usage summaries
- Chat interface with simulated, deterministic local replies
- Moments gallery with filters, search, favourites, detail modal and demo unlock quotas
- Discover release calendar with locally saved reminder toggles
- Membership comparison with mock plan switching (no payment processing)
- Profile preferences, local data persistence, and reset
- Keyboard focus styles, accessible controls, reduced-motion support

## Important limitations

**This is a frontend prototype, not a production service.** No real AI provider, authentication, server database, media streaming, push notifications, or payments are connected. All interactions are local to your browser and stored in localStorage. The sample imagery comes from Unsplash URLs and is illustrative, **not a consistent depiction of Shanaya** or cleared production character assets. Some media labels are mock data. No exclusive or restricted content is bundled. Replace the placeholder imagery with properly licensed, authorized assets before production use.

Quota usage is a simplified browser-local demonstration and does not reset monthly. Production unlocks and subscription entitlements must be verified server-side with transactional, concurrency-safe controls. Production content releases must be enforced on the backend, not by client dates. Add suitable age assurance, privacy disclosures, moderation, consent and rights management before launch.

## Structure

- `app/page.tsx` — interactive prototype and screens
- `app/globals.css` — global styles and component classes
- `lib/data.ts` — sample media, release dates and plan tiers
- `tailwind.config.ts` — design tokens

## Suggested next steps

1. Split each screen and shared component into dedicated modules.
2. Replace placeholders with authorized Shanaya character assets.
3. Add real authentication and backend APIs.
4. Implement server-enforced media entitlements and secure delivery.
5. Integrate an approved payment processor and subscription webhooks.
6. Connect an AI inference provider, user-controlled memory, and safety controls.
