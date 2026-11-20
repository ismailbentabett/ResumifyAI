# Contributing to ResumifyAI

Thanks for your interest in improving ResumifyAI. This guide explains how to propose changes and what reviewers look for.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** using the [bug report form](https://github.com/ismailbentabett/ResumifyAI/issues/new?template=bug_report.yml).
- **Suggest a feature** using the [feature request form](https://github.com/ismailbentabett/ResumifyAI/issues/new?template=feature_request.yml).
- **Improve the docs**: typos, clarifications and missing setup steps are always welcome.
- **Submit code**: pick an open issue or a [roadmap](README.md#-roadmap) item, or open an issue first to discuss larger changes.

Security problems should **not** be reported in public issues. See [SECURITY.md](SECURITY.md).

## Development setup

1. Install Node.js 18+ and npm.
2. Install dependencies: `npm install`
3. Copy `.example.env` to `.env.local` and fill in your own development values (`OPENAI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). See [Configuration](README.md#%EF%B8%8F-configuration). Never commit `.env` files or real keys.
4. Start the dev server: `npm run dev` and open http://localhost:3000.

Each analysis makes two GPT-4o requests, so use a key with a spending limit while developing.

## Workflow

1. Fork the repository and create a branch from `main`:
   `git checkout -b feat/short-description`
2. Make focused commits. Keep unrelated refactors out of feature or fix PRs.
3. Run the checks below before pushing.
4. Open a pull request and fill in the template. Link the issue it resolves (`Closes #123`).

### Branch names

| Prefix      | Use for                                                |
|-------------|--------------------------------------------------------|
| `feat/`     | New features                                           |
| `fix/`      | Bug fixes                                              |
| `docs/`     | Documentation only                                     |
| `refactor/` | Code changes that neither fix a bug nor add a feature  |
| `chore/`    | Tooling, dependencies, configuration                   |

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(analyze): return zod-validated JSON from the analysis route
fix(upload): reject files larger than 3 MB on the client
docs: document required environment variables
```

## Before you open a pull request

- `npm run lint` passes.
- `npm run build` succeeds.
- You exercised the upload flow locally with at least one real PDF resume and one non-resume PDF.
- No secrets, API keys, uploaded resumes or other personal data in the diff (check `public/uploads`).
- Documentation and `.example.env` are updated when behaviour or configuration changes.

## Project conventions

- **Server code** stays in `app/api/**/route.ts`; the OpenAI key is only ever read on the server.
- **UI primitives** come from shadcn/ui in `components/ui`; add new ones with the shadcn CLI rather than hand-writing them.
- **Feature components** live in `components/`, shared helpers in `lib/`.
- **Styling** uses Tailwind utility classes and the theme tokens in `app/globals.css` / `tailwind.config.ts`.
- **Types**: keep TypeScript strict and avoid `any` for data crossing the API boundary.

## Review process

A maintainer will review your pull request, may ask for changes, and will merge it once it is ready. Small, well-described PRs are reviewed fastest.

## Questions

Open an [issue](https://github.com/ismailbentabett/ResumifyAI/issues) or reach the maintainer via [GitHub](https://github.com/ismailbentabett).
