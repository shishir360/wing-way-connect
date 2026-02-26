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

## Rules
- Be deterministic.
- Do not make unrequested changes to the repository code.
