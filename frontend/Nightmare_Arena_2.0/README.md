# The Nightmare Arena 2.0 (React)

    npm create vite@latest nightmare-arena -- --template react
    cd nightmare-arena
    # copy src/App.jsx and src/App.css from this folder over the generated ones
    # (src/main.jsx can keep importing ./index.css, or remove that import)
    npm install
    npm run dev

For the frontend Supabase client, copy `.env.example` to `.env.local` and set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Only publishable keys
belong in Vite variables; never place a Supabase secret key in frontend code or
any `VITE_*` variable. The Node API setup is documented in [`../../backend/README.md`](../../backend/README.md).

Organiser settings are at the top of `src/App.jsx`: event date, WhatsApp number, email, FC 26 format.

Note: duplicate-registration checks use localStorage, so they only see registrations made in the same browser.
For real cross-device checks and collecting registrations, connect the forms to a backend (Google Sheets via Apps Script, Supabase, Firebase, etc.).

The admin registration open/closed setting is also stored in localStorage. It updates the public page and registration forms in this browser (and other tabs on the same origin); it is not shared with other visitors or devices. Use a shared backend to control registration status across the deployed site.

The FC 26 admin bracket is generated from the current browser's registered FC 26 players and saved in localStorage. Admins select match winners to advance players, reset a selected match if needed, and explicitly publish or hide the bracket; it stays hidden from the public page until published. Resetting or changing a winner clears affected later results. Visitors can open the published bracket from the FC 26 button in the Results section. Visibility and bracket updates sync in this browser and other tabs on the same origin. Regenerating replaces the bracket, clears match results, and hides it until published again. A shared backend is needed to publish bracket changes to other visitors and devices.

The BGMI admin leaderboard uses the currently registered squads. Add a match, enter each squad's placement and kills, and configure placement points and points per kill; total standings are calculated automatically. Visitors can open standings from the BGMI button in the Results section. Match scores and rules are saved in localStorage and sync across tabs on the same origin, but not to other visitors or devices without a shared backend.

Use **Preview with demo data** in admin to preview a sample FC 26 bracket and BGMI leaderboard without changing real registrations, bracket results, or scores. Demo controls and data use separate localStorage keys; the public page in this browser shows a demo-preview banner, and registration forms are disabled until demo mode is exited.
