# Bug Lab backend

Optional Express API. The frontend works without it.

```bash
npm install
cp .env.example .env     # add ANTHROPIC_API_KEY to enable the tutor
npm run dev              # http://localhost:4000
npm test
```

| Route | Purpose |
|-------|---------|
| `GET /api/health` | `{ status: "ok", ai: boolean }` |
| `POST /api/tutor` | Explains the student's current execution state. `503` when no key is set. |
