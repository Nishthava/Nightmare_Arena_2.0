# The Nightmare Arena 2.0 (React)

    npm create vite@latest nightmare-arena -- --template react
    cd nightmare-arena
    # copy src/App.jsx and src/App.css from this folder over the generated ones
    # (src/main.jsx can keep importing ./index.css, or remove that import)
    npm install
    npm run dev

Organiser settings are at the top of `src/App.jsx`: event date, WhatsApp number, email, FC 26 format.

Note: duplicate-registration checks use localStorage, so they only see registrations made in the same browser.
For real cross-device checks and collecting registrations, connect the forms to a backend (Google Sheets via Apps Script, Supabase, Firebase, etc.).
