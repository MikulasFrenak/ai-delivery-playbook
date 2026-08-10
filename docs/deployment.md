# Deployment

Tool-agnostic, like the rest of this playbook: what follows is the **shape** of a deployment setup and the decisions it forces you to make explicit. The worked example at the end happens to be Cloudflare Workers, because that's what the projects this playbook runs on actually use — but the same shape fills in equally with Azure Pipelines + App Service, AWS (ECS/EKS/Amplify), GitHub Actions + Kubernetes, Vercel, Fly.io, or a self-hosted runner pushing to a VM. Substitute the vendor, keep the questions.

This is a **reference doc, not a skill.** [`lifecycle/release.md`](../lifecycle/release.md) still lists "no merge/deploy skill" as an open gap, and writing this down doesn't close it — an agent can't run a doc. It exists so the decisions below get made deliberately and once, instead of rediscovered per project.

---

## Decide and document these, whatever the vendor

Answer each in your project's own `AGENTS.md`. A deployment setup that hasn't answered them isn't simpler — it's just undocumented.

| Question | Why it matters |
|---|---|
| **What triggers a deploy?** | Push to the default branch, a tag, a manual approval, or a merged PR. This is the single most important line; everything else follows from it |
| **Where does the build run?** | The host's own build system (git-connected) vs. your CI producing an artifact the host just receives. Different failure modes, different debuggability |
| **What's the build's working directory?** | Only obvious in a single-package repo. Monorepos and repos where the deploy config isn't at the root need this stated |
| **Is there a pre-build step?** | Codegen, asset bundling, schema generation. If the repo doesn't build from a clean checkout without it, that's a deploy step, not a local convenience |
| **Build-time vs. runtime configuration** | See below — this is the most common and most confusing failure |
| **Preview/PR environments?** | If yes, they usually need the same build settings as production, configured separately. Easy to set one and forget the other |
| **How do you know a deploy succeeded?** | A green build is not a working site. Name the actual check |
| **How do you roll back?** | Before you need to, not after |

---

## The distinction that trips everyone: build-time vs. runtime config

Most hosting platforms expose **two** separate places to set configuration, and they are not interchangeable:

- **Build environment variables** — present while your build command runs.
- **Runtime variables / secrets** — present to the deployed application when it serves requests.

If your bundler inlines values at build time (Vite's `import.meta.env.VITE_*`, Next's `NEXT_PUBLIC_*`, Create React App's `REACT_APP_*`), those values **must** be set as *build* variables. Setting them as runtime secrets produces a build that silently bakes in `undefined` — the deploy goes green, and the feature is broken in production with no error anywhere in the log.

The general rule, vendor-independent: **anything a client-side bundle needs must exist at build time; anything only the server needs should exist only at runtime.** And a corollary worth stating plainly — a value inlined into a client bundle is public. It ships to every visitor. Restrict such keys by referrer/origin and quota at the provider; never treat "it's in the platform's variables UI" as meaning "it's secret."

---

## Git-connected builds: the recurring failure mode

When the host builds from your repo directly (rather than receiving a pre-built artifact), two settings are almost always wrong on first setup, because the host's defaults assume a single-package repo that builds with no pre-step:

1. **Root directory** — the folder containing the deploy config. Defaults to the repo root; wrong the moment your deployable isn't at the root.
2. **Build command** — must include any generation step the repo doesn't commit. The symptom of getting this wrong is usually *not* "build command failed" but something further downstream and less obvious, like the deploy tool reporting it can't find anything to deploy — because the generated input never appeared.

If the platform supports preview/PR deployments, **these settings are configured separately for previews**, and getting production right doesn't fix previews. Expect to hit the same problem twice.

---

## Worked example — Cloudflare Workers (this ecosystem's actual setup)

Every personal project this playbook runs on (`family-trails-eu`, `review-spa`, this repo's `mcp-server/remote`, ZenSmash) uses the same shape: **GitHub Actions** for cross-repo sync/notify steps, and **Cloudflare's Git integration** for the deploy itself — push to `main` → Cloudflare builds → live. No manual `wrangler deploy` in the normal flow, though it stays available as an escape hatch.

Filling in the table above:

| Question | This ecosystem's answer |
|---|---|
| Trigger | Push to `main` (i.e. PR merge) |
| Build location | Cloudflare's own build system, git-connected |
| Working directory | Repo root for the SPAs; `mcp-server/remote` for the MCP server, since `wrangler.toml` doesn't live at the repo root |
| Pre-build step | `node build.js` for the MCP server — generates a gitignored data module. Without it the deploy fails with *"Could not detect a directory containing static files"*, which does not sound like "your pre-build step didn't run" |
| Build vs. runtime config | `VITE_*` keys are **build**-time. They belong in build environment variables, not "Variables and Secrets" (which is Worker-runtime-only and has no effect on the build) |
| Preview environments | Same settings needed again, separately — this exact issue was hit twice, once for production and once for PR previews |
| Success check | Real request against the live URL, not a green build |

Config lives in `wrangler.jsonc` / `wrangler.toml` and is version-controlled, so the deploy shape is reviewable in a PR rather than living only in a dashboard. That's the part worth copying regardless of vendor: **whatever your host, keep as much deploy configuration in the repo as it will let you.**

Where the details live:

- [`../mcp-server/remote/README.md`](../mcp-server/remote/README.md) — root directory / build command settings, and the failure they cause when missing
- `review-spa/AGENTS.md` — `wrangler.jsonc`, SPA fallback routing, `npm run deploy` as the manual path
- `family-trails-eu/AGENTS.md` — build-time env var handling, plus API-key restriction via hard quota caps (budgets only alert; quotas actually prevent charges)

---

## When this shape doesn't fit

Serverless/edge hosting (Workers, Vercel, Lambda) suits static front ends and small stateless services. It does **not** host a multi-service backend — a message broker, a relational database, a long-running worker process, or anything needing a filesystem.

A project with that shape needs a container target instead (Kubernetes/AKS/EKS, ECS, Fly.io, Railway, or plain Docker Compose on a VM), and will likely end up **split**: front end on the edge host, backend on the container host. That's a normal outcome, not a design failure — but decide it early. Discovering at deploy time that half the stack has nowhere to go is a much worse conversation than choosing two targets up front.

**This ecosystem's own second example, once it ships:** `provenance-check` (Kafka + Postgres + a Python worker doing minutes-long analysis — none of that fits Workers) plans exactly this split, per its own `AGENTS.md`: `/web` on Cloudflare Workers like everything else here, everything else on a single Hetzner VM running `docker compose`, chosen specifically over a managed container platform (see that repo's "Why one VM rather than a PaaS" section for the actual cost comparison behind that call). Not deployed yet — phases 1–5 run local-only on purpose — but it's the concrete counter-example to keep this doc from reading as Cloudflare-only in practice, not just in stated intent. Update this pointer once it's live.
