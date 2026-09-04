# Deploying Wing Way Connect on Localhost

## Objectives
1. Clone the project to the local environment.
2. Install necessary dependencies via `npm install`.
3. Start the Vite development server via `npm run dev`.

## Inputs
- Repository URL: `https://github.com/shishir360/wing-way-connect.git`
- Operating System: Windows

## Outputs
- Local deployment running on `localhost`.

## Logic Flow
1. Run `git clone https://github.com/shishir360/wing-way-connect.git .`
2. Run `npm install` to download node modules.
3. Run `npm run dev` to serve the website.

## Known Risks and Constraints
- Ensure port 8080 or port 5173 is available, otherwise the server will fail to start.
- `package.json` must be present in the directory before running npm commands.
- **Coolify / Railpack Deployment**:
  - Note: Do not keep `deno.json`, `deno.lock`, or `import_map.json` in the root directory. Railpack detects them and misidentifies the Vite project as a Deno app, causing build failure: `deno cache eslint.config.js: Could not resolve typescript-eslint`.
  - Instead: Keep Deno configs inside `supabase/functions/` and remove root Deno files.
  - Note: Do not leave stale `bun.lockb` in the root when using npm, as Railpack/Nixpacks will prioritize Bun over Node.js.
  - Instead: Remove stale `bun.lockb` and rely on `package-lock.json`.
  - Note: Always ensure `package.json` has a `"start": "vite preview"` script and `railpack.json` specifies the start command so the container can start the web service.

## Rules
- Be deterministic.
- Do not make unrequested changes to the repository code.

