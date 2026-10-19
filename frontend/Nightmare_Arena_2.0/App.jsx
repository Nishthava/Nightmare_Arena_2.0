import { useEffect, useRef, useState } from "react";
import { saveRegistration } from "./supabase";
import "./App.css";

/* =====================================================================
   ORGANISER SETTINGS: edit these
   ===================================================================== */
const EVENT_START = new Date("2026-10-30T09:00:00+05:30").getTime();
const ORG = { wa: "91XXXXXXXXXX", mail: "your-email@college.edu" }; // WhatsApp: country code + number, no "+"
// FC 26 format: "solo" (teamSize 1), "duo" (teamSize 2), "squad" (teamSize 3+)
const FC26 = { format: "solo", teamSize: 1, labels: { solo: "SOLO 1v1", duo: "DUO", squad: "SQUAD" } };

const RULES = {
  bgmi: [
    "Squads have four main players plus one optional substitute.",
    "Every player must play on their own account, using the UID registered here.",
    "No cheats, hacks, teaming or third-party tools. Offenders are disqualified.",
    "Be ready in the lobby 15 minutes before your match.",
    "The organisers' decisions are final.",
  ],
  fc26: [
    "The tournament is individual (1v1 knockout) unless the organisers announce a different format.",
    "Play only on the account and platform you registered with.",
    "No cheating, exploits or unsportsmanlike behaviour.",
    "Report to the venue 15 minutes before your match slot.",
    "The organisers' decisions are final.",
  ],
};

const COLORS = ["#ff2433", "#4db3ff", "#ffb23e", "#7dff7d", "#ff6ad5"];
const WALL_ROWS = ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ"];
const WALL_MSGS = ["RUN", "BGMI VS FIFA", "SEE YOU 30 OCT", "JOIN THE PARTY"];
const REGISTRATION_OPEN_KEY = "na2_registration_open";
const FC26_BRACKET_KEY = "na2_fc26_bracket";
const FC26_BRACKET_PUBLISHED_KEY = "na2_fc26_bracket_published";
const BGMI_LEADERBOARD_KEY = "na2_bgmi_leaderboard";
const DEMO_MODE_KEY = "na2_demo_mode";
const DEMO_FC26_BRACKET_KEY = "na2_demo_fc26_bracket";
const DEMO_FC26_BRACKET_PUBLISHED_KEY = "na2_demo_fc26_bracket_published";
const DEMO_BGMI_LEADERBOARD_KEY = "na2_demo_bgmi_leaderboard";
const DEFAULT_PLACEMENT_POINTS = [10, 6, 5, 4, 3, 2, 1, 1];
const SCRAWLS = [
  ["RUN", "12%", "62%", -6],
  ["IT'S COMING", "64%", "16%", 4],
  ["THE GATE IS OPEN", "66%", "80%", -3],
  ["TURN BACK", "6%", "88%", 7],
];
const GAMES = [
  { no: "01", name: "BGMI", c: "#ff2433", image: "/bgmi-horror.jpg", text: "Squad of four. Drop in, loot fast and outlast every team when the lights flicker out.", chips: ["SQUAD / 4", "BATTLE ROYALE", "PRIZE: TBA"] },
  { no: "02", name: "FIFA", c: "#4db3ff", image: "/fifa-haunted-champions.png", text: "One versus one on the virtual pitch. Knockout bracket, no second chances.", chips: ["SOLO / 1v1", "KNOCKOUT", "PRIZE: TBA"] },
];
const TAPES = [
  { name: "TAPE 01", date: "30.10.26", items: [
    ["00:00", "Gates open + opening ceremony", "Check-in and rules briefing"],
    ["01:30", "BGMI + FIFA qualifiers", "First blood"],
    ["05:00", "Costume contest + FIFA knockouts", "Come dressed to scare"],
  ] },
  { name: "TAPE 02", date: "31.10.26", items: [
    ["00:00", "Semi-finals, all games", "Only the strong remain"],
    ["04:00", "Grand finals", "Both champions are decided"],
    ["07:00", "Prize distribution + closing", "Tape ends"],
  ] },
];
const BRIEF = [
  ["WHO CAN PLAY"],
  ["FORMAT", "BGMI in squads of four. FIFA is solo, 1v1 knockout."],
  ["WHAT TO BRING", "Your own device for BGMI. FIFA consoles will be provided."],
  ["ENTRY + PRIZES", "To be announced soon. Watch this space."],
];

const DEMO_REGISTRATIONS = [
  ...[
    ["DEMO-FC26-01", "DEMO · Alex Morgan", "Phantom"],
    ["DEMO-FC26-02", "DEMO · Jamie Lee", "Night Owl"],
    ["DEMO-FC26-03", "DEMO · Riley Chen", "R1OT"],
    ["DEMO-FC26-04", "DEMO · Sam Patel", "Shadow"],
    ["DEMO-FC26-05", "DEMO · Taylor Kim", "T-K"],
    ["DEMO-FC26-06", "DEMO · Jordan Singh", "Ghost"],
    ["DEMO-FC26-07", "DEMO · Casey Rao", "C-Rex"],
    ["DEMO-FC26-08", "DEMO · Morgan Das", "M0"],
  ].map(([id, name, ign], index) => ({
    id, g: "fc26", name, ign, mail: `demo-fc${index + 1}@example.com`,
    ph: `98765432${String(index).padStart(2, "0")}`, fmt: "solo", mates: [], t: new Date().toISOString(),
  })),
  ...[
    ["DEMO-BGMI-01", "DEMO · Phantom Squad"],
    ["DEMO-BGMI-02", "DEMO · Night Raiders"],
    ["DEMO-BGMI-03", "DEMO · Shadow Strike"],
    ["DEMO-BGMI-04", "DEMO · Ghost Protocol"],
  ].map(([id, team], index) => ({
    id, g: "bgmi", team, cap: `Demo Captain ${index + 1}`,
    mail: `demo-bgmi${index + 1}@example.com`, ph: `98765000${String(index).padStart(2, "0")}`,
    pl: [], t: new Date().toISOString(),
  })),
];

/* =====================================================================
   Small helpers
   ===================================================================== */
const pad = (n) => String(n).padStart(2, "0");

function Rv({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`${className} rv${shown ? " in" : ""}`} {...rest}>{children}</Tag>;
}

function useCountdown() {
  const calc = () => {
    let d = Math.max(0, EVENT_START - Date.now());
    return [864e5, 36e5, 6e4, 1e3].map((m) => { const x = Math.floor(d / m); d -= x * m; return pad(x); });
  };
  const [p, setP] = useState(calc);
  useEffect(() => { const id = setInterval(() => setP(calc()), 1000); return () => clearInterval(id); }, []);
  return `${p[0]}D ${p[1]}H ${p[2]}M ${p[3]}S`;
}

function useHash() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => {
    const fn = () => setH(window.location.hash);
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  return h;
}

function useRegistrationStatus() {
  const [status, setStatus] = useState(() => {
    try {
      return { open: localStorage.getItem(REGISTRATION_OPEN_KEY) !== "false", error: "" };
    } catch {
      return { open: true, error: "Could not read registration status from this browser." };
    }
  });

  useEffect(() => {
    const sync = (event) => {
      if (event.key === REGISTRATION_OPEN_KEY || event.key === null) {
        setStatus({ open: event.newValue !== "false", error: "" });
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const setOpen = (open) => {
    try {
      localStorage.setItem(REGISTRATION_OPEN_KEY, String(open));
      setStatus({ open, error: "" });
    } catch {
      setStatus((current) => ({ ...current, error: "Could not save registration status. Check this browser's storage settings." }));
    }
  };

  return { ...status, setOpen };
}

function createSeedOrder(size) {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const nextSize = seeds.length * 2;
    seeds = seeds.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }
  return seeds;
}

function createBracket(registrations) {
  const entrants = registrations
    .filter((registration) => registration.g === "fc26")
    .map((registration) => ({
      id: registration.id,
      name: registration.name + (registration.ign ? ` (${registration.ign})` : ""),
    }));
  if (entrants.length === 0) return null;

  const size = Math.max(2, 2 ** Math.ceil(Math.log2(entrants.length)));
  const seeds = createSeedOrder(size);
  const slots = seeds.map((seed) => entrants[seed - 1]?.id ?? null);
  const rounds = [];

  for (let roundSize = size; roundSize >= 2; roundSize /= 2) {
    const matches = [];
    for (let i = 0; i < roundSize; i += 2) {
      const players = roundSize === size
        ? [slots[i], slots[i + 1]]
        : [null, null];
      matches.push({
        players,
        winnerId: players[0] && !players[1] ? players[0] : null,
      });
    }
    rounds.push({ name: roundName(rounds.length, Math.log2(size)), matches });
  }

  for (let i = 1; i < rounds.length; i += 1) {
    rounds[i].matches = rounds[i].matches.map((match, matchIndex) => ({
      ...match,
      players: [
        rounds[i - 1].matches[matchIndex * 2]?.winnerId ?? null,
        rounds[i - 1].matches[matchIndex * 2 + 1]?.winnerId ?? null,
      ],
    }));
  }
  return { entrants, rounds };
}

function roundName(index, totalRounds) {
  const remaining = totalRounds - index;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semi-finals";
  if (remaining === 3) return "Quarter-finals";
  return `Round ${index + 1}`;
}

function readBracket(demoMode = false) {
  try {
    const raw = localStorage.getItem(demoMode ? DEMO_FC26_BRACKET_KEY : FC26_BRACKET_KEY);
    if (!raw) return { bracket: null, error: "" };
    const bracket = JSON.parse(raw);
    const validEntrants = Array.isArray(bracket.entrants)
      && bracket.entrants.every((entrant) => entrant
        && typeof entrant.id === "string"
        && typeof entrant.name === "string");
    const validRounds = Array.isArray(bracket.rounds)
      && bracket.rounds.every((round) => round
        && typeof round.name === "string"
        && Array.isArray(round.matches)
        && round.matches.every((match) => match
          && Array.isArray(match.players)
          && match.players.length === 2
          && match.players.every((id) => id === null || typeof id === "string")
          && (match.winnerId === null || typeof match.winnerId === "string")));
    if (!validEntrants || !validRounds) {
      return { bracket: null, error: "The saved FC 26 bracket is invalid. Generate a new bracket to replace it." };
    }
    return { bracket, error: "" };
  } catch {
    return { bracket: null, error: "Could not read the FC 26 bracket from this browser." };
  }
}

function readBracketPublished(demoMode = false) {
  try {
    return localStorage.getItem(demoMode ? DEMO_FC26_BRACKET_PUBLISHED_KEY : FC26_BRACKET_PUBLISHED_KEY) === "true";
  } catch {
    return false;
  }
}

function useFc26Bracket(demoMode) {
  const [state, setState] = useState(() => ({
    ...readBracket(demoMode),
    published: readBracketPublished(demoMode),
  }));

  useEffect(() => {
    setState({ ...readBracket(demoMode), published: readBracketPublished(demoMode) });
    const sync = (event) => {
      const bracketKey = demoMode ? DEMO_FC26_BRACKET_KEY : FC26_BRACKET_KEY;
      const publishedKey = demoMode ? DEMO_FC26_BRACKET_PUBLISHED_KEY : FC26_BRACKET_PUBLISHED_KEY;
      if (event.key === bracketKey || event.key === publishedKey || event.key === null) {
        setState({ ...readBracket(demoMode), published: readBracketPublished(demoMode) });
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [demoMode]);

  const saveBracket = (bracket) => {
    try {
      const key = demoMode ? DEMO_FC26_BRACKET_KEY : FC26_BRACKET_KEY;
      if (bracket) localStorage.setItem(key, JSON.stringify(bracket));
      else localStorage.removeItem(key);
      setState((current) => ({ ...current, bracket, error: "" }));
    } catch {
      setState((current) => ({ ...current, error: "Could not save the FC 26 bracket. Check this browser's storage settings." }));
    }
  };

  const setPublished = (published) => {
    try {
      const key = demoMode ? DEMO_FC26_BRACKET_PUBLISHED_KEY : FC26_BRACKET_PUBLISHED_KEY;
      localStorage.setItem(key, String(published));
      setState((current) => ({ ...current, published, error: "" }));
    } catch {
      setState((current) => ({ ...current, error: "Could not update bracket visibility. Check this browser's storage settings." }));
    }
  };

  return { ...state, saveBracket, setPublished };
}

function advanceBracket(bracket, roundIndex, matchIndex, winnerId) {
  const rounds = bracket.rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({ ...match, players: [...match.players] })),
  }));
  const match = rounds[roundIndex]?.matches[matchIndex];
  if (!match || !match.players.includes(winnerId) || !match.players[0] || !match.players[1]) return bracket;
  match.winnerId = winnerId;

  for (let i = roundIndex + 1; i < rounds.length; i += 1) {
    rounds[i].matches = rounds[i].matches.map((nextMatch, nextIndex) => {
      const players = [
        rounds[i - 1].matches[nextIndex * 2]?.winnerId ?? null,
        rounds[i - 1].matches[nextIndex * 2 + 1]?.winnerId ?? null,
      ];
      return {
        ...nextMatch,
        players,
        winnerId: nextMatch.winnerId && players.includes(nextMatch.winnerId) ? nextMatch.winnerId : null,
      };
    });
  }
  return { ...bracket, rounds };
}

function createDemoBracket() {
  let bracket = createBracket(DEMO_REGISTRATIONS);
  ["DEMO-FC26-01", "DEMO-FC26-04", "DEMO-FC26-02", "DEMO-FC26-03"]
    .forEach((winnerId, matchIndex) => { bracket = advanceBracket(bracket, 0, matchIndex, winnerId); });
  bracket = advanceBracket(bracket, 1, 0, "DEMO-FC26-01");
  bracket = advanceBracket(bracket, 1, 1, "DEMO-FC26-03");
  return bracket;
}

function defaultBgmiLeaderboard() {
  return {
    pointsPerKill: 1,
    placementPoints: Array.from({ length: 25 }, (_, index) => DEFAULT_PLACEMENT_POINTS[index] ?? 0),
    matches: [],
  };
}

function isValidBgmiLeaderboard(value) {
  return value
    && Number.isInteger(value.pointsPerKill)
    && value.pointsPerKill >= 0
    && Array.isArray(value.placementPoints)
    && value.placementPoints.every((points) => Number.isInteger(points) && points >= 0)
    && Array.isArray(value.matches)
    && value.matches.every((match) => match
      && typeof match.id === "string"
      && typeof match.name === "string"
      && match.scores
      && typeof match.scores === "object"
      && !Array.isArray(match.scores)
      && Object.values(match.scores).every((score) => score
        && (score.placement === null || (Number.isInteger(score.placement) && score.placement > 0))
        && (score.kills === null || (Number.isInteger(score.kills) && score.kills >= 0))));
}

function readBgmiLeaderboard(demoMode = false) {
  try {
    const raw = localStorage.getItem(demoMode ? DEMO_BGMI_LEADERBOARD_KEY : BGMI_LEADERBOARD_KEY);
    if (!raw) return { leaderboard: defaultBgmiLeaderboard(), error: "" };
    const leaderboard = JSON.parse(raw);
    if (!isValidBgmiLeaderboard(leaderboard)) {
      return { leaderboard: defaultBgmiLeaderboard(), error: "The saved BGMI leaderboard is invalid. Create a new match to replace it." };
    }
    return { leaderboard, error: "" };
  } catch {
    return { leaderboard: defaultBgmiLeaderboard(), error: "Could not read the BGMI leaderboard from this browser." };
  }
}

function useBgmiLeaderboard(demoMode) {
  const [state, setState] = useState(() => readBgmiLeaderboard(demoMode));

  useEffect(() => {
    setState(readBgmiLeaderboard(demoMode));
    const sync = (event) => {
      const key = demoMode ? DEMO_BGMI_LEADERBOARD_KEY : BGMI_LEADERBOARD_KEY;
      if (event.key === key || event.key === null) setState(readBgmiLeaderboard(demoMode));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [demoMode]);

  const saveLeaderboard = (leaderboard) => {
    try {
      const key = demoMode ? DEMO_BGMI_LEADERBOARD_KEY : BGMI_LEADERBOARD_KEY;
      localStorage.setItem(key, JSON.stringify(leaderboard));
      setState({ leaderboard, error: "" });
    } catch {
      setState((current) => ({ ...current, error: "Could not save the BGMI leaderboard. Check this browser's storage settings." }));
    }
  };

  return { ...state, saveLeaderboard };
}

function getBgmiStandings(teams, leaderboard) {
  const standings = teams.map((team) => {
    let kills = 0;
    let placementPoints = 0;
    let matchesPlayed = 0;
    let bestPlacement = Infinity;

    leaderboard.matches.forEach((match) => {
      const score = match.scores[team.id];
      if (!score || score.placement === null || score.kills === null) return;
      matchesPlayed += 1;
      kills += score.kills;
      placementPoints += leaderboard.placementPoints[score.placement - 1] ?? 0;
      bestPlacement = Math.min(bestPlacement, score.placement);
    });

    return {
      ...team,
      kills,
      placementPoints,
      matchesPlayed,
      bestPlacement,
      points: placementPoints + kills * leaderboard.pointsPerKill,
    };
  });

  return standings.sort((a, b) =>
    b.points - a.points
    || b.kills - a.kills
    || a.bestPlacement - b.bestPlacement
    || a.team.localeCompare(b.team));
}

function createDemoBgmiLeaderboard() {
    const placements = [
      [1, 2, 3, 4],
      [3, 1, 4, 2],
      [2, 3, 1, 4],
    ];
    const kills = [
      [7, 4, 2, 1],
      [3, 6, 2, 5],
      [5, 3, 8, 2],
    ];
    const teams = DEMO_REGISTRATIONS.filter((registration) => registration.g === "bgmi");

    return {
      ...defaultBgmiLeaderboard(),
      matches: placements.map((matchPlacements, matchIndex) => ({
        id: `demo-bgmi-match-${matchIndex + 1}`,
        name: `Demo Match ${matchIndex + 1}`,
        scores: Object.fromEntries(teams.map((team, teamIndex) => [
          team.id,
          { placement: matchPlacements[teamIndex], kills: kills[matchIndex][teamIndex] },
        ])),
      })),
    };
}

function seedDemoData() {
    if (localStorage.getItem(DEMO_FC26_BRACKET_KEY) === null) {
      localStorage.setItem(DEMO_FC26_BRACKET_KEY, JSON.stringify(createDemoBracket()));
    }
    if (localStorage.getItem(DEMO_FC26_BRACKET_PUBLISHED_KEY) === null) {
      localStorage.setItem(DEMO_FC26_BRACKET_PUBLISHED_KEY, "true");
    }
    if (localStorage.getItem(DEMO_BGMI_LEADERBOARD_KEY) === null) {
      localStorage.setItem(DEMO_BGMI_LEADERBOARD_KEY, JSON.stringify(createDemoBgmiLeaderboard()));
    }
}

function useDemoMode() {
    const [state, setState] = useState(() => {
      try {
        return { enabled: localStorage.getItem(DEMO_MODE_KEY) === "true", error: "" };
      } catch {
        return { enabled: false, error: "Could not read demo mode from this browser." };
      }
    });

    useEffect(() => {
      const sync = (event) => {
        if (event.key === DEMO_MODE_KEY || event.key === null) {
          setState({ enabled: event.newValue === "true", error: "" });
        }
      };
      window.addEventListener("storage", sync);
      return () => window.removeEventListener("storage", sync);
    }, []);

    const setEnabled = (enabled) => {
      try {
        if (enabled) seedDemoData();
        localStorage.setItem(DEMO_MODE_KEY, String(enabled));
        setState({ enabled, error: "" });
      } catch {
        setState((current) => ({
          ...current,
          error: "Could not start demo mode. Check this browser's storage settings.",
        }));
      }
    };

    return { ...state, setEnabled };
}

/* =====================================================================
     Global overlays: spores, red flash, VHS HUD
   ===================================================================== */
function Spores() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, cc = cv.getContext("2d");
    let W, H, raf, lastFrame = 0;
    const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const P = Array.from({ length: 36 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + 0.5, s: Math.random() * 0.4 + 0.1, a: Math.random(), red: i % 9 === 0 }));
    const draw = (now) => {
      if (document.hidden) { raf = 0; return; }
      if (now - lastFrame < 33) { raf = requestAnimationFrame(draw); return; }
      lastFrame = now;
      cc.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y += p.s; p.x += Math.sin(p.y / 50 + p.a * 6) * 0.35;
        if (p.y > H + 5) { p.y = -5; p.x = Math.random() * W; }
        cc.beginPath();
        cc.fillStyle = p.red ? `rgba(255,36,51,${0.3 + p.a * 0.4})` : `rgba(220,230,255,${0.15 + p.a * 0.35})`;
        cc.arc(p.x, p.y, p.r, 0, 7); cc.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const syncVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      else if (!raf) raf = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", syncVisibility);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas id="sp" ref={ref} />;
}

function RedFlash() {
  const ref = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.55 && ref.current) {
        const f = ref.current;
        f.style.opacity = 0.16;
        setTimeout(() => (f.style.opacity = 0), 100);
        setTimeout(() => { f.style.opacity = 0.08; setTimeout(() => (f.style.opacity = 0), 80); }, 200);
      }
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return <div id="fl" ref={ref} />;
}

function Hud() {
  const [s, setS] = useState(0);
  useEffect(() => { const id = setInterval(() => setS((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const tc = [s / 3600, (s / 60) % 60, s % 60].map((v) => pad(Math.floor(v))).join(":");
  return (
    <>
      <div className="noise" /><div className="vhs" />
      <div className="hud tl"><span className="rec">● REC</span> {tc}</div>
      <div className="hud br">SIGNAL: UPSIDE DOWN<br />OCT 30 2026</div>
    </>
  );
}

function Nav() {
  return (
    <nav>
      <b>NIGHTMARE ARENA 2.0</b>
      <div>
        <a href="#wall">The Wall</a><a href="#games">Games</a><a className="nav-results" href="#results">Results</a><a href="#tapes">Schedule</a>
        <a className="cta" href="#register">Join</a>
        <a href="#/admin" style={{ fontSize: ".75rem", color: "var(--dim)", marginLeft: 14 }}>Admin</a>
      </div>
    </nav>
  );
}

/* =====================================================================
   Hero with flashlight
   ===================================================================== */
function HeroContent({ lit, cd }) {
  const t = lit ? "" : " t";
  return (
    <>
      <div className={"k" + t}>COLLEGE ESPORTS FEST · THE GATE OPENS 30 OCT</div>
      <div className={"frame" + t}><h1><small>THE</small>Nightmare<br />Arena 2.0</h1></div>
      <div className={"date" + t}>30 — 31 OCTOBER 2026 · BGMI / FIFA</div>
      <div className={"cd" + t}>{cd}</div>
      <a className="btn" href="#register">Join the party ▶</a>
    </>
  );
}

function Hero() {
  const ref = useRef(null);
  const cd = useCountdown();

  useEffect(() => {
    const h = ref.current;
    const move = (e) => {
      const r = h.getBoundingClientRect();
      h.style.setProperty("--x", `${e.clientX - r.left}px`);
      h.style.setProperty("--y", `${e.clientY - r.top}px`);
    };
    const reset = () => {
      h.style.setProperty("--x", "50%");
      h.style.setProperty("--y", "50%");
    };
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerleave", reset);
    return () => {
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <header className="hero" ref={ref}>
      <div className="layer dim"><HeroContent cd={cd} /></div>
      <div className="layer lit" aria-hidden="true">
        <HeroContent lit cd={cd} />
        <div className="str">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} className="bulb" style={{ "--c": COLORS[i % 5], "--d": `${(i * 0.37) % 2.4}s` }} />
          ))}
        </div>
        {SCRAWLS.map(([t, x, y, r]) => (
          <div key={t} className="scr" style={{ left: x, top: y, "--rot": `${r}deg` }}>{t}</div>
        ))}
      </div>
      <div className="beam" />
      <div className="hint">FIND THE LIGHT. SOMETHING IS WATCHING.</div>
    </header>
  );
}

/* =====================================================================
   The alphabet wall
   ===================================================================== */
function Wall() {
  const [on, setOn] = useState({});
  const [msg, setMsg] = useState("");

  const light = (ch, ms = 450) => {
    setOn((o) => ({ ...o, [ch]: true }));
    setTimeout(() => setOn((o) => ({ ...o, [ch]: false })), ms);
  };

  useEffect(() => { // auto-spelling loop
    let dead = false;
    const sl = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      let i = 0;
      while (!dead) {
        const m = WALL_MSGS[i++ % WALL_MSGS.length];
        setMsg("");
        for (const ch of m) {
          if (dead) return;
          if (ch === " ") { setMsg((x) => x + " "); await sl(350); continue; }
          setMsg((x) => x + ch);
          setOn((o) => ({ ...o, [ch]: true }));
          await sl(650);
          setOn((o) => ({ ...o, [ch]: false }));
          await sl(120);
        }
        await sl(1600);
      }
    })();
    return () => { dead = true; };
  }, []);

  useEffect(() => { // type on the keyboard
    const fn = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && k >= "A" && k <= "Z") light(k);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <section id="wall">
      <Rv className="k2">// THE WALL</Rv>
      <Rv as="h2">Someone is trying to <span>reach you</span></Rv>
      <Rv className="wall">
        {WALL_ROWS.map((row, ri) => (
          <div className="row" key={row}>
            {[...row].map((ch, i) => (
              <div className="cell" key={ch} onClick={() => light(ch)}>
                <i className={on[ch] ? "on" : ""} style={{ "--c": COLORS[(i + ri) % 5] }} />
                <b>{ch}</b>
              </div>
            ))}
          </div>
        ))}
        <div id="wm">{msg}</div>
      </Rv>
      <p className="note">// type on your keyboard or tap a letter. try it.</p>
    </section>
  );
}

/* =====================================================================
   Home page sections
   ===================================================================== */
function GameSelect() {
  const [active, setActive] = useState(0);
  const canHover = typeof matchMedia !== "undefined" && matchMedia("(hover:hover)").matches;
  return (
    <section id="games">
      <Rv className="k2">// CHOOSE YOUR GATE</Rv>
      <Rv as="h2">Pick your <span>battleground</span></Rv>
      <Rv className="sel">
        {GAMES.map((g, i) => (
          <div key={g.name} className={"p" + (active === i ? " on" : "")} style={{
            "--c": g.c,
            ...(g.image ? {
              backgroundImage: `linear-gradient(0deg, rgba(4,6,12,.78), rgba(4,6,12,.12)), url("${g.image}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}),
          }}
            onMouseEnter={() => canHover && setActive(i)} onClick={() => setActive(i)}>
            <span className="no">{g.no}</span>
            <h3>{g.name}</h3>
            <div className="info">
              <p>{g.text}</p>
              {g.chips.map((c) => <span className="chip" key={c}>{c}</span>)}
            </div>
          </div>
        ))}
      </Rv>
    </section>
  );
}

function BracketBoard({ bracket, onWinner }) {
  const names = new Map(bracket.entrants.map((entrant) => [entrant.id, entrant.name]));
  return (
    <div className="fc-bracket">
      {bracket.rounds.map((round, roundIndex) => (
        <div className="fc-bracket-round" key={round.name}>
          <h3>{round.name}</h3>
          {round.matches.map((match, matchIndex) => (
            <div className="fc-match" key={`${round.name}-${matchIndex}`}>
              <span className="fc-match-label">MATCH {matchIndex + 1}</span>
              {match.players.map((playerId, playerIndex) => {
                const isWinner = playerId && match.winnerId === playerId;
                const playerName = playerId
                  ? names.get(playerId) || "Registration removed"
                  : roundIndex === 0 ? "BYE" : "TBD";
                return (
                  <button
                    className={`fc-match-player${isWinner ? " winner" : ""}`}
                    key={playerId || `empty-${playerIndex}`}
                    type="button"
                    disabled={!onWinner || !playerId || !match.players[0] || !match.players[1]}
                    onClick={() => onWinner?.(roundIndex, matchIndex, playerId)}
                    aria-pressed={Boolean(isWinner)}
                  >
                    <span>{playerName}</span>
                    {isWinner && <b>WINNER</b>}
                  </button>
                );
              })}
              {match.winnerId && (
                <span className="fc-match-advance">
                  {round.name === "Final" ? "Tournament champion" : "Winner advances"}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PublicBracket({ bracket, published, error }) {
  if (!published || (!bracket && !error)) return null;
  return (
    <div className="public-tournament-panel" id="fc26-bracket">
      <Rv className="k2">// FC 26 · KNOCKOUT</Rv>
      <Rv as="h2">Tournament <span>bracket</span></Rv>
      {error
        ? <div className="reg-closed" role="alert">{error}</div>
        : <Rv><BracketBoard bracket={bracket} /></Rv>}
    </div>
  );
}

function PublicBgmiLeaderboard({ teams, leaderboard, error }) {
  if (leaderboard.matches.length === 0 && !error) return null;
  const standings = getBgmiStandings(teams, leaderboard);
  return (
    <div className="public-tournament-panel" id="bgmi-leaderboard">
      <Rv className="k2">// BGMI · LIVE STANDINGS</Rv>
      <Rv as="h2">Battle <span>leaderboard</span></Rv>
      {error ? <div className="reg-closed" role="alert">{error}</div> : (
        <Rv className="bgmi-leaderboard-wrap">
          <p className="bgmi-scoring-note">
            {leaderboard.matches.length} {leaderboard.matches.length === 1 ? "match" : "matches"} recorded
            {" · "}{leaderboard.pointsPerKill} {leaderboard.pointsPerKill === 1 ? "point" : "points"} per kill
          </p>
          {standings.length === 0 ? <p>No registered BGMI teams are available.</p> : (
            <div className="bgmi-table-scroll">
              <table className="bgmi-table">
                <thead>
                  <tr><th>Rank</th><th>Team</th><th>Matches</th><th>Kills</th><th>Placement pts</th><th>Total pts</th></tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr key={team.id}>
                      <td>{index + 1}</td>
                      <td><b>{team.team}</b></td>
                      <td>{team.matchesPlayed}</td>
                      <td>{team.kills}</td>
                      <td>{team.placementPoints}</td>
                      <td><b className="bgmi-total-points">{team.points}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Rv>
      )}
    </div>
  );
}

function BgmiLeaderboardAdmin({ teams, leaderboard, saveLeaderboard, error }) {
  const [pointsPerKill, setPointsPerKill] = useState(leaderboard.pointsPerKill);
  const [placementPoints, setPlacementPoints] = useState(leaderboard.placementPoints);
  const [scoringError, setScoringError] = useState("");

  useEffect(() => {
    setPointsPerKill(leaderboard.pointsPerKill);
    setPlacementPoints(leaderboard.placementPoints);
  }, [leaderboard.pointsPerKill, leaderboard.placementPoints]);

  const visiblePlacements = Math.max(1, teams.length);
  const saveScoringRules = () => {
    const killPoints = Number(pointsPerKill);
    const placements = Array.from({ length: Math.max(25, teams.length) }, (_, index) => Number(placementPoints[index] ?? 0));
    if (!Number.isInteger(killPoints) || killPoints < 0
      || placements.some((points) => !Number.isInteger(points) || points < 0)) {
      setScoringError("Scoring values must be whole numbers of zero or more.");
      return;
    }
    setScoringError("");
    saveLeaderboard({ ...leaderboard, pointsPerKill: killPoints, placementPoints: placements });
  };

  const addMatch = () => {
    if (teams.length === 0) return;
    const match = {
      id: `bgmi-${Date.now().toString(36)}`,
      name: `Match ${leaderboard.matches.length + 1}`,
      scores: Object.fromEntries(teams.map((team) => [team.id, { placement: null, kills: null }])),
    };
    saveLeaderboard({ ...leaderboard, matches: [...leaderboard.matches, match] });
  };

  const updateScore = (matchId, teamId, field, rawValue) => {
    const value = rawValue === "" ? null : Number(rawValue);
    if (value !== null && (!Number.isInteger(value) || value < (field === "placement" ? 1 : 0)
      || (field === "placement" && value > teams.length))) return;
    const matches = leaderboard.matches.map((match) => {
      if (match.id !== matchId) return match;
      const previous = match.scores[teamId] || { placement: null, kills: null };
      return { ...match, scores: { ...match.scores, [teamId]: { ...previous, [field]: value } } };
    });
    saveLeaderboard({ ...leaderboard, matches });
  };

  const removeMatch = (matchId) => {
    if (!window.confirm("Delete this match and its scores?")) return;
    saveLeaderboard({ ...leaderboard, matches: leaderboard.matches.filter((match) => match.id !== matchId) });
  };

  return (
    <section className="adm-bgmi-leaderboard">
      <div className="adm-bgmi-header">
        <div>
          <div className="adm-kicker">// BGMI · MATCH SCORING</div>
          <h3>BGMI leaderboard</h3>
          <p>Enter each squad's placement and kills for every match. The standings update automatically.</p>
        </div>
        <button className="btn" onClick={addMatch} disabled={teams.length === 0}>Add match</button>
      </div>
      {error && <div className="adm-setting-error" role="alert">{error}</div>}

      <div className="adm-bgmi-rules">
        <h4>Scoring rules</h4>
        <label className="adm-points-kill">
          Points per kill
          <input type="number" min="0" step="1" value={pointsPerKill}
            onChange={(event) => setPointsPerKill(event.target.value === "" ? "" : Number(event.target.value))} />
        </label>
        <div className="adm-placement-grid">
          {Array.from({ length: visiblePlacements }, (_, index) => (
            <label key={index}>
              Place {index + 1}
              <input type="number" min="0" step="1" value={placementPoints[index] ?? 0}
                onChange={(event) => {
                  const next = [...placementPoints];
                  next[index] = event.target.value === "" ? "" : Number(event.target.value);
                  setPlacementPoints(next);
                }} />
            </label>
          ))}
        </div>
        {scoringError && <div className="adm-setting-error" role="alert">{scoringError}</div>}
        <button className="btn alt" onClick={saveScoringRules}>Save scoring rules</button>
      </div>

      {teams.length === 0
        ? <div className="adm-empty">Register BGMI squads before adding matches.</div>
        : leaderboard.matches.length === 0
          ? <p className="adm-bracket-entrants">Add a match to start recording results and publish the leaderboard.</p>
          : leaderboard.matches.map((match) => (
            <div className="adm-bgmi-match" key={match.id}>
              <header>
                <h4>{match.name}</h4>
                <button className="adm-del" onClick={() => removeMatch(match.id)}>Delete match</button>
              </header>
              <div className="bgmi-table-scroll">
                <table className="bgmi-table adm-bgmi-table">
                  <thead><tr><th>Team</th><th>Placement</th><th>Kills</th><th>Match points</th></tr></thead>
                  <tbody>
                    {teams.map((team) => {
                      const score = match.scores[team.id] || { placement: null, kills: null };
                      const points = score.placement !== null && score.kills !== null
                        ? (leaderboard.placementPoints[score.placement - 1] ?? 0) + score.kills * leaderboard.pointsPerKill
                        : "—";
                      return (
                        <tr key={team.id}>
                          <td><b>{team.team}</b></td>
                          <td>
                            <input aria-label={`${team.team} placement in ${match.name}`} type="number" min="1" max={teams.length} step="1"
                              value={score.placement ?? ""}
                              onChange={(event) => updateScore(match.id, team.id, "placement", event.target.value)} />
                          </td>
                          <td>
                            <input aria-label={`${team.team} kills in ${match.name}`} type="number" min="0" step="1"
                              value={score.kills ?? ""}
                              onChange={(event) => updateScore(match.id, team.id, "kills", event.target.value)} />
                          </td>
                          <td>{points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
    </section>
  );
}

function Home({ registrationOpen, bracket, bracketPublished, bracketError, bgmiTeams, bgmiLeaderboard, bgmiLeaderboardError, demoMode }) {
  const [openResult, setOpenResult] = useState("");
  return (
    <main>
      {demoMode && <div className="public-demo-banner">DEMO PREVIEW · Sample tournament data shown only in this browser</div>}
      <Hero />
      <Rv className="strip">
        <div><b>2</b><span>GAMES</span></div><div><b>2</b><span>NIGHTS</span></div>
        <div><b>1</b><span>GATE</span></div><div><b>∞</b><span>NIGHTMARES</span></div>
      </Rv>
      <Wall />
      <GameSelect />

      <section id="results">
        <Rv className="k2">// TOURNAMENT HQ</Rv>
        <Rv as="h2">Check the <span>results</span></Rv>
        <Rv className="result-buttons" role="group" aria-label="Tournament results">
          <button
            className={`result-button${openResult === "fc26" ? " active" : ""}`}
            type="button"
            aria-expanded={openResult === "fc26"}
            aria-controls="fc26-result-panel"
            onClick={() => setOpenResult((current) => current === "fc26" ? "" : "fc26")}
          >
            <span>FC 26</span>
            <b>{openResult === "fc26" ? "Hide bracket −" : "View knockout bracket →"}</b>
          </button>
          <button
            className={`result-button${openResult === "bgmi" ? " active" : ""}`}
            type="button"
            aria-expanded={openResult === "bgmi"}
            aria-controls="bgmi-result-panel"
            onClick={() => setOpenResult((current) => current === "bgmi" ? "" : "bgmi")}
          >
            <span>BGMI</span>
            <b>{openResult === "bgmi" ? "Hide leaderboard −" : "View leaderboard →"}</b>
          </button>
        </Rv>
        <div id="fc26-result-panel" className="result-panel" hidden={openResult !== "fc26"}>
          {openResult === "fc26" && (bracketPublished
            ? <PublicBracket bracket={bracket} published={bracketPublished} error={bracketError} />
            : <p className="result-empty">The FC 26 bracket will appear here once the organisers publish it.</p>)}
        </div>
        <div id="bgmi-result-panel" className="result-panel" hidden={openResult !== "bgmi"}>
          {openResult === "bgmi" && (bgmiLeaderboard.matches.length > 0 || bgmiLeaderboardError
            ? <PublicBgmiLeaderboard teams={bgmiTeams} leaderboard={bgmiLeaderboard} error={bgmiLeaderboardError} />
            : <p className="result-empty">The BGMI leaderboard will appear here after the first match is recorded.</p>)}
        </div>
      </section>

      <section id="tapes">
        <Rv className="k2">// RECOVERED TAPES</Rv>
        <Rv as="h2">Two nights. <span>Zero sleep.</span></Rv>
        <Rv className="tapes">
          {TAPES.map((t) => (
            <div className="tape" key={t.name}>
              <header><span>{t.name}</span><span>{t.date}</span></header>
              <ul>
                {t.items.map(([time, title, sub]) => (
                  <li key={time}><time>{time}</time><span>{title}<small>{sub}</small></span></li>
                ))}
              </ul>
            </div>
          ))}
        </Rv>
        <Rv as="p" className="note">// timings are tentative and will be confirmed soon</Rv>
      </section>

      <section id="brief">
        <Rv className="k2">// MISSION BRIEFING</Rv>
        <Rv as="h2">Know before you <span>enter</span></Rv>
        <Rv className="brief">
          {BRIEF.map(([b, p]) => <div className="bc" key={b}><b>{b}</b><p>{p}</p></div>)}
        </Rv>
      </section>

      <section id="register">
        <Rv className="k2">// ENTER THE GATE</Rv>
        {registrationOpen ? (
          <>
            <Rv as="h2">Choose your game. <span>Register.</span></Rv>
            <Rv className="reg2">
              <a className="rc" href="#/bgmi" style={{ "--c": "#ff2433" }}><b>BGMI</b><span>Squad of 4 + 1 optional substitute</span><em>Register your squad ▶</em></a>
              <a className="rc" href="#/fc26" style={{ "--c": "#4db3ff" }}><b>FC 26</b><span>FIFA · individual tournament</span><em>Register as a player ▶</em></a>
            </Rv>
          </>
        ) : (
          <Rv className="reg-closed">
            <b>REGISTRATION IS CLOSED</b>
            <p>Sign-ups are not being accepted right now. Check back later for updates.</p>
          </Rv>
        )}
      </section>

      <Rv className="big">See you in the upside down</Rv>
    </main>
  );
}

function Footer() {
  return (
    <footer>
      THE NIGHTMARE ARENA 2.0 · 30–31 OCT 2026 · {ORG.mail}<br />
      Entry fee, prizes and venue: to be announced.
    </footer>
  );
}

/* =====================================================================
   Registration: shared pieces
   ===================================================================== */
const V = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  phone: (v) => /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")),
  uid: (v) => /^\d{8,12}$/.test(v),
};
const ph10 = (v) => v.replace(/\D/g, "").slice(-10);

// Duplicate checks only see registrations made in THIS browser (localStorage).
// For real cross-device duplicate prevention you need a backend (see README note).
const loadRegs = () => {
  try {
    const registrations = JSON.parse(localStorage.getItem("na2_regs") || "[]");
    return Array.isArray(registrations) ? registrations : [];
  } catch {
    return [];
  }
};
const saveReg = (r) => { try { localStorage.setItem("na2_regs", JSON.stringify([...loadRegs(), r])); } catch { /* ignore */ } };

function Field({ game, id, label, value, onChange, error, type = "text", ph = "", req = true }) {
  return (
    <div>
      <label className="f" htmlFor={`${game}-${id}`}>{label}{req ? " *" : ""}</label>
      <input id={`${game}-${id}`} className={error ? "bad" : ""} type={type} placeholder={ph}
        autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="err">{error}</div>
    </div>
  );
}

function RulesBox({ game, checked, onChange, error, dupMsg }) {
  return (
    <>
      <details className="rl">
        <summary>Tournament rules (tap to read)</summary>
        <ul>{RULES[game].map((r) => <li key={r}>{r}</li>)}</ul>
      </details>
      <label className="ck">
        <input id={`${game}-rules`} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>I have read and accept the tournament rules *</span>
      </label>
      <div className="err">{error}</div>
      <div className="err" style={{ fontSize: ".9rem" }}>{dupMsg}</div>
    </>
  );
}

// form -> review -> done, with duplicate checks at both submit and confirm
function useFlow({ game, pre, title, validate, collect, dup, rows }) {
  const [stage, setStage] = useState("form");
  const [errs, setErrs] = useState({});
  const [dupMsg, setDupMsg] = useState("");
  const [block, setBlock] = useState("");
  const [d, setD] = useState(null);

  const submit = (form) => {
    const e = validate(form);
    setErrs(e); setDupMsg("");
    const keys = Object.keys(e);
    if (keys.length) {
      const el = document.getElementById(`${game}-${keys[0]}`);
      el?.scrollIntoView({ block: "center" }); el?.focus({ preventScroll: true });
      return;
    }
    const x = collect(form), m = dup(x, loadRegs());
    if (m) { setDupMsg(m); return; }
    setD(x); setBlock(""); setStage("review");
  };
  const confirm = async () => {
  const m = dup(d, loadRegs());

  if (m) {
    setBlock(m);
    return;
  }

  const x = {
    ...d,
    id: `${pre}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    t: new Date().toISOString(),
  };

  try {
    await saveRegistration(x);
    setD(x);
    setStage("done");
  } catch (error) {
    setBlock(
      error.message || "Registration failed. Please try again."
    );
  }
};
  const edit = () => { setBlock(""); setStage("form"); };
  const list = d ? rows(d) : [];
  const text = d ? ["THE NIGHTMARE ARENA 2.0 · " + title, ...(d.id ? ["ID: " + d.id] : []), ...list.map(([a, b]) => `${a}: ${b}`)].join("\n") : "";
  return { stage, errs, dupMsg, block, d, list, text, title, submit, confirm, edit };
}

function Review({ flow }) {
  return (
    <div className="sum">
      <h3 className="ab">Review your registration</h3>
      <table><tbody>{flow.list.map(([a, b]) => <tr key={a}><th>{a}</th><td>{b}</td></tr>)}</tbody></table>
      {flow.block && <div className="err" style={{ fontSize: "1rem" }}>{flow.block}</div>}
      <div className="act">
        <button className="btn alt" onClick={flow.edit}>← Edit</button>
        {!flow.block && <button className="btn" onClick={flow.confirm}>Confirm registration ▶</button>}
      </div>
    </div>
  );
}

function Done({ flow }) {
  const [copied, setCopied] = useState("Copy details");
  const copy = () => navigator.clipboard.writeText(flow.text).then(() => setCopied("Copied ✓")).catch(() => setCopied("Copy failed"));
  return (
    <div className="sum">
      <h3 className="ab">You're in. ☠</h3>
      <p>Registration ID: <b>{flow.d.id}</b></p>
      <p className="mut">Saved on this device. Send your details to the organisers below to lock your slot, and keep a screenshot of this screen.</p>
      <div className="act">
        <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${ORG.wa}?text=${encodeURIComponent(flow.text)}`}>Send on WhatsApp</a>
        <a className="btn alt" href={`mailto:${ORG.mail}?subject=${encodeURIComponent(flow.title + " " + flow.d.id)}&body=${encodeURIComponent(flow.text)}`}>Email</a>
        <button className="btn alt" onClick={copy}>{copied}</button>
      </div>
    </div>
  );
}

function PageShell({ kicker, title, badge, badgeRec = true, children }) {
  return (
    <div className="page on">
      <div className="k2">{kicker}</div>
      {title}
      <div className="arc">
        <header><span>{badge[0]}</span><span className={badgeRec ? "rec" : ""}>{badge[1]}</span></header>
        {children}
      </div>
      <a className="back" href="#register">← back to games</a>
    </div>
  );
}

function RegistrationClosedPage({ demoMode = false }) {
  return (
    <PageShell
      kicker={demoMode ? "// DEMO PREVIEW" : "// REGISTRATION"}
      title={<h2>Gate <span>{demoMode ? "preview" : "closed"}</span></h2>}
      badge={["SIGN-UPS", demoMode ? "DEMO MODE" : "CLOSED"]}
      badgeRec={false}
    >
      <div className="reg-closed">
        <b>{demoMode ? "DEMO PREVIEW IS ACTIVE" : "REGISTRATION IS CLOSED"}</b>
        <p>{demoMode
          ? "Registration forms are disabled while the admin previews sample bracket and leaderboard data."
          : "Sign-ups are not being accepted right now. Please check back later."}</p>
      </div>
    </PageShell>
  );
}

/* =====================================================================
   BGMI registration page
   ===================================================================== */
const bgmiValidate = (f) => {
  const e = {};
  ["team", "cap", "mail", "ph"].forEach((k) => { if (!f[k].trim()) e[k] = "Required"; });
  if (f.mail.trim() && !V.email(f.mail.trim())) e.mail = "Enter a valid email address";
  if (f.ph.trim() && !V.phone(f.ph.trim())) e.ph = "Enter a valid 10-digit Indian mobile number";
  const seenU = {}, seenN = {};
  f.pl.forEach((p, i) => {
    const n = p.n.trim(), u = p.u.trim();
    if (i < 4 || n || u) { // players 1-4 required; substitute only if started
      if (!n) e["n" + i] = "Required";
      if (!u) e["u" + i] = "Required";
    }
    if (u && !V.uid(u)) e["u" + i] = "UID must be 8–12 digits";
    else if (u) { if (seenU[u]) e["u" + i] = "Duplicate UID in your squad"; seenU[u] = 1; }
    if (n) { const k = n.toLowerCase(); if (seenN[k]) e["n" + i] = "Duplicate in-game name in your squad"; seenN[k] = 1; }
  });
  if (!f.rules) e.rules = "You must accept the rules to register";
  return e;
};

function BgmiPage() {
  const [f, setF] = useState({ team: "", cap: "", mail: "", ph: "", rules: false, pl: Array.from({ length: 5 }, () => ({ n: "", u: "" })) });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const setP = (i, k) => (v) => setF((x) => ({ ...x, pl: x.pl.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));

  const flow = useFlow({
    game: "bgmi", pre: "BGMI", title: "BGMI REGISTRATION", validate: bgmiValidate,
    collect: (x) => ({ g: "bgmi", team: x.team.trim(), cap: x.cap.trim(), mail: x.mail.trim().toLowerCase(), ph: ph10(x.ph),
      pl: x.pl.map((p) => ({ n: p.n.trim(), u: p.u.trim() })).filter((p) => p.n || p.u) }),
    dup: (d, regs) => {
      for (const r of regs) {
        if (r.g !== "bgmi") continue;
        if (r.team.toLowerCase() === d.team.toLowerCase()) return `A team named "${d.team}" is already registered.`;
        if (r.mail === d.mail || r.ph === d.ph) return "This captain's email or phone is already registered with a team.";
        const hit = d.pl.find((p) => r.pl.some((q) => q.u === p.u));
        if (hit) return `UID ${hit.u} is already registered in another squad.`;
      }
      return "";
    },
    rows: (d) => [["Team", d.team], ["Captain", d.cap], ["Email", d.mail], ["Phone", d.ph],
      ...d.pl.map((p, i) => [i < 4 ? "Player " + (i + 1) : "Substitute", `${p.n} · UID ${p.u}`])],
  });
  const E = flow.errs;

  return (
    <PageShell kicker="// REGISTRATION · BGMI" title={<h2>Squad <span>sign-up</span></h2>} badge={["SQUAD FORM", "4 + 1 SUB"]}>
      {flow.stage === "form" && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); flow.submit(f); }}>
          <div className="stp">Team details</div>
          <div className="g2">
            <Field game="bgmi" id="team" label="Team name" value={f.team} onChange={set("team")} error={E.team} />
            <Field game="bgmi" id="cap" label="Team captain name" value={f.cap} onChange={set("cap")} error={E.cap} />
          </div>
          <div className="g2">
            <Field game="bgmi" id="mail" type="email" ph="name@college.edu" label="Captain's email" value={f.mail} onChange={set("mail")} error={E.mail} />
            <Field game="bgmi" id="ph" type="tel" ph="10-digit mobile" label="Captain's phone" value={f.ph} onChange={set("ph")} error={E.ph} />
          </div>
          <div className="stp">Player details</div>
          {f.pl.map((p, i) => (
            <div key={i}>
              <div className="pl">PLAYER {i + 1}{i === 4 ? " · OPTIONAL SUBSTITUTE" : ""}</div>
              <div className="g2">
                <Field game="bgmi" id={"n" + i} label="In-game name" req={i < 4} value={p.n} onChange={setP(i, "n")} error={E["n" + i]} />
                <Field game="bgmi" id={"u" + i} label="BGMI UID" ph="8–12 digits" req={i < 4} value={p.u} onChange={setP(i, "u")} error={E["u" + i]} />
              </div>
            </div>
          ))}
          <RulesBox game="bgmi" checked={f.rules} onChange={set("rules")} error={E.rules} dupMsg={flow.dupMsg} />
          <button className="btn" style={{ alignSelf: "stretch" }} type="submit">Review registration ▶</button>
        </form>
      )}
      {flow.stage === "review" && <Review flow={flow} />}
      {flow.stage === "done" && <Done flow={flow} />}
    </PageShell>
  );
}

/* =====================================================================
   FC 26 (FIFA) registration page
   ===================================================================== */
const mates = Math.max(0, FC26.teamSize - 1);

const fcValidate = (f) => {
  const e = {};
  ["name", "mail", "ph"].forEach((k) => { if (!f[k].trim()) e[k] = "Required"; });
  if (f.mail.trim() && !V.email(f.mail.trim())) e.mail = "Enter a valid email address";
  if (f.ph.trim() && !V.phone(f.ph.trim())) e.ph = "Enter a valid 10-digit Indian mobile number";
  f.mates.forEach((m, i) => { if (!m.n.trim()) e["pn" + i] = "Required"; });
  if (!f.rules) e.rules = "You must accept the rules to register";
  return e;
};

function Fc26Page() {
  const [f, setF] = useState({ name: "", ign: "", mail: "", ph: "", rules: false, mates: Array.from({ length: mates }, () => ({ n: "", i: "" })) });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const setM = (i, k) => (v) => setF((x) => ({ ...x, mates: x.mates.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }));

  const flow = useFlow({
    game: "fc26", pre: "FC26", title: "FC 26 REGISTRATION", validate: fcValidate,
    collect: (x) => ({ g: "fc26", name: x.name.trim(), ign: x.ign.trim(), mail: x.mail.trim().toLowerCase(), ph: ph10(x.ph),
      fmt: FC26.format, mates: x.mates.map((m) => ({ n: m.n.trim(), i: m.i.trim() })) }),
    dup: (d, regs) => (regs.some((r) => r.g === "fc26" && (r.mail === d.mail || r.ph === d.ph)) ? "This email or phone number is already registered for FC 26." : ""),
    rows: (d) => [["Player", d.name], ["In-game name", d.ign || "—"], ["Email", d.mail], ["Phone", d.ph],
      ["Format", FC26.labels[d.fmt] || d.fmt],
      ...d.mates.map((m, i) => ["Teammate " + (i + 1), m.n + (m.i ? ` (${m.i})` : "")])],
  });
  const E = flow.errs;

  return (
    <PageShell kicker="// REGISTRATION · FC 26 (FIFA)" title={<h2>Player <span>sign-up</span></h2>}
      badge={[FC26.format === "solo" ? "INDIVIDUAL TOURNAMENT" : "TEAM TOURNAMENT", FC26.labels[FC26.format] || FC26.format.toUpperCase()]}>
      {flow.stage === "form" && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); flow.submit(f); }}>
          <div className="stp">Player details</div>
          <div className="g2">
            <Field game="fc26" id="name" label="Player name" value={f.name} onChange={set("name")} error={E.name} />
            <Field game="fc26" id="ign" label="In-game name" ph="optional" req={false} value={f.ign} onChange={set("ign")} />
          </div>
          <div className="g2">
            <Field game="fc26" id="mail" type="email" ph="name@college.edu" label="Email address" value={f.mail} onChange={set("mail")} error={E.mail} />
            <Field game="fc26" id="ph" type="tel" ph="10-digit mobile" label="Phone number" value={f.ph} onChange={set("ph")} error={E.ph} />
          </div>
          {f.mates.map((m, i) => (
            <div key={i}>
              <div className="pl">TEAMMATE {i + 1}</div>
              <div className="g2">
                <Field game="fc26" id={"pn" + i} label="Player name" value={m.n} onChange={setM(i, "n")} error={E["pn" + i]} />
                <Field game="fc26" id={"pi" + i} label="In-game name" ph="optional" req={false} value={m.i} onChange={setM(i, "i")} />
              </div>
            </div>
          ))}
          <RulesBox game="fc26" checked={f.rules} onChange={set("rules")} error={E.rules} dupMsg={flow.dupMsg} />
          <button className="btn" style={{ alignSelf: "stretch" }} type="submit">Review registration ▶</button>
        </form>
      )}
      {flow.stage === "review" && <Review flow={flow} />}
      {flow.stage === "done" && <Done flow={flow} />}
    </PageShell>
  );
}

/* =====================================================================
   Admin panel
   ===================================================================== */
const ADMIN_PASS = "nightmare2026"; // ← change this password

function AdminPage({
  registrationOpen,
  setRegistrationOpen,
  registrationError,
  bracket,
  setBracket,
  bracketPublished,
  setBracketPublished,
  bracketError,
  bgmiLeaderboard,
  setBgmiLeaderboard,
  bgmiLeaderboardError,
  demoMode,
  setDemoMode,
  demoModeError,
}) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("na2_admin") === "1");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [regs, setRegs] = useState([]);
  const [activeSection, setActiveSection] = useState("overview"); // "overview" | "bgmi" | "fc26"
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);    // registration object to show

  // load regs whenever authed changes
  useEffect(() => {
    if (authed) setRegs(demoMode ? DEMO_REGISTRATIONS : loadRegs());
  }, [authed, demoMode]);

  const login = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASS) { sessionStorage.setItem("na2_admin", "1"); setAuthed(true); setErr(""); }
    else { setErr("Wrong password. Try again."); setPw(""); }
  };
  const logout = () => { sessionStorage.removeItem("na2_admin"); setAuthed(false); setRegs([]); };
  const deleteReg = (id) => {
    if (demoMode) return;
    if (!window.confirm("Delete registration " + id + "?")) return;
    const next = regs.filter((r) => r.id !== id);
    localStorage.setItem("na2_regs", JSON.stringify(next));
    setRegs(next);
    if (detail?.id === id) setDetail(null);
  };
  const clearAll = () => {
    if (demoMode) return;
    if (!window.confirm("DELETE ALL registrations? This cannot be undone.")) return;
    localStorage.setItem("na2_regs", "[]");
    setRegs([]); setDetail(null);
  };
  const generateFc26Bracket = () => {
    const entrants = regs.filter((registration) => registration.g === "fc26");
    if (entrants.length === 0) return;
    if (bracket && !window.confirm("Generate a new bracket? This replaces the current bracket and clears all match results.")) return;
    setBracket(createBracket(entrants));
    setBracketPublished(false);
  };
  const chooseFc26Winner = (roundIndex, matchIndex, winnerId) => {
    if (!bracket) return;
    setBracket(advanceBracket(bracket, roundIndex, matchIndex, winnerId));
  };
  const exportCSV = () => {
    const rows = [["ID", "Game", "Name/Team", "Captain/IGN", "Email", "Phone", "Registered at"]];
    regs.forEach((r) => {
      if (r.g === "bgmi") rows.push([r.id, "BGMI", r.team, r.cap, r.mail, r.ph, r.t]);
      if (r.g === "fc26") rows.push([r.id, "FC26", r.name, r.ign || "—", r.mail, r.ph, r.t]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "nightmare_arena_registrations.csv";
    a.click();
  };

  const visible = regs.filter((r) => {
    if (activeSection !== "overview" && r.g !== activeSection) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const haystack = (r.g === "bgmi")
      ? `${r.id} ${r.team} ${r.cap} ${r.mail} ${r.ph}`
      : `${r.id} ${r.name} ${r.ign} ${r.mail} ${r.ph}`;
    return haystack.toLowerCase().includes(q);
  });

  const bgmiCount = regs.filter((r) => r.g === "bgmi").length;
  const fc26Count = regs.filter((r) => r.g === "fc26").length;

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────
  if (!authed) return (
    <div className="adm-wrap">
      <div className="adm-login">
        <div className="adm-login-badge">ADMIN ACCESS</div>
        <h2 className="ab">Command<br /><span>Center</span></h2>
        <p style={{ color: "var(--dim)", marginBottom: 28 }}>Restricted area. Enter your password to proceed.</p>
        <form onSubmit={login}>
          <label className="f" htmlFor="adm-pw">Password</label>
          <input id="adm-pw" type="password" autoFocus autoComplete="current-password"
            value={pw} onChange={(e) => setPw(e.target.value)}
            style={{ width: "100%", background: "none", border: 0, borderBottom: "2px solid var(--dim)", color: "var(--bone)", fontFamily: "inherit", fontSize: "1.2rem", padding: "6px 0 6px", marginBottom: 6 }} />
          {err && <div style={{ color: "var(--red)", fontSize: ".85rem", marginBottom: 10 }}>{err}</div>}
          <button className="btn" type="submit" style={{ width: "100%", marginTop: 14 }}>Enter ▶</button>
        </form>
        <a href="#" style={{ display: "block", marginTop: 20, color: "var(--dim)", fontSize: ".8rem" }}>← Back to site</a>
      </div>
    </div>
  );

  // ── DETAIL MODAL ──────────────────────────────────────────────────────
  const DetailModal = ({ r, onClose }) => {
    const rows = r.g === "bgmi"
      ? [["ID", r.id], ["Game", "BGMI"], ["Team", r.team], ["Captain", r.cap], ["Email", r.mail], ["Phone", r.ph],
          ["Registered", new Date(r.t).toLocaleString()],
          ...( r.pl || []).map((p, i) => [i < 4 ? `Player ${i + 1}` : "Sub", `${p.n} · UID ${p.u}`])]
      : [["ID", r.id], ["Game", "FC 26"], ["Player", r.name], ["In-game", r.ign || "—"], ["Email", r.mail], ["Phone", r.ph],
          ["Format", FC26.labels[r.fmt] || r.fmt], ["Registered", new Date(r.t).toLocaleString()],
          ...(r.mates || []).map((m, i) => [`Teammate ${i + 1}`, m.n + (m.i ? ` (${m.i})` : "")])];
    return (
      <div className="adm-modal-backdrop" onClick={onClose}>
        <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="adm-modal-head">
            <span style={{ color: r.g === "bgmi" ? "#4db3ff" : "var(--red)" }}>{r.g === "bgmi" ? "BGMI" : "FC 26"} · {r.id}</span>
            <button onClick={onClose} style={{ background: "none", border: 0, color: "var(--dim)", fontSize: 1.4 + "rem", cursor: "pointer" }}>✕</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <tbody>
              {rows.map(([a, b]) => (
                <tr key={a}>
                  <th style={{ textAlign: "left", color: "var(--amber)", fontWeight: 400, padding: "6px 12px 6px 0", width: "35%", verticalAlign: "top" }}>{a}</th>
                  <td style={{ padding: "6px 0", borderBottom: "1px dashed var(--line)", wordBreak: "break-word" }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button className="btn alt" style={{ flex: 1 }} onClick={onClose}>Close</button>
            {!demoMode && <button className="btn" style={{ flex: 1, background: "var(--red)" }} onClick={() => { deleteReg(r.id); onClose(); }}>Delete ✕</button>}
          </div>
        </div>
      </div>
    );
  };

  // ── DASHBOARD ─────────────────────────────────────────────────────────
  return (
    <div className="adm-wrap">
      {detail && <DetailModal r={detail} onClose={() => setDetail(null)} />}
      <div className="adm-panel">
        {/* Header */}
        <div className="adm-header">
          <div>
            <div className="adm-kicker">// ADMIN · NIGHTMARE ARENA 2.0</div>
            <h2 className="ab" style={{ margin: "4px 0 0", fontSize: "clamp(1.6rem,4vw,2.6rem)" }}>
              Command <span>Center</span>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className={`btn ${demoMode ? "" : "alt"}`} onClick={() => setDemoMode(!demoMode)}>
              {demoMode ? "Exit demo data" : "Preview with demo data"}
            </button>
            <button className="btn alt" onClick={exportCSV}>Export CSV</button>
            {!demoMode && <button className="btn alt" style={{ borderColor: "var(--red)", color: "var(--red)" }} onClick={clearAll}>Clear All</button>}
            <button className="btn" onClick={logout}>Logout</button>
          </div>
        </div>

        {demoMode && (
          <div className="adm-demo-banner">
            <b>DEMO DATA MODE</b>
            <span>Sample registrations, bracket, and match scores are isolated from real data. The public page in this browser is previewing the demo.</span>
          </div>
        )}
        {demoModeError && <div className="adm-setting-error" role="alert">{demoModeError}</div>}

        <nav className="adm-game-nav" aria-label="Admin sections">
          {[
            { id: "overview", label: "Overview", count: regs.length, color: "var(--amber)" },
            { id: "bgmi", label: "BGMI", count: bgmiCount, color: "#4db3ff" },
            { id: "fc26", label: "FC 26", count: fc26Count, color: "var(--red)" },
          ].map((section) => (
            <button
              key={section.id}
              type="button"
              className={"adm-game-tab" + (activeSection === section.id ? " active" : "")}
              style={{ "--game-color": section.color }}
              aria-pressed={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.label}</span>
              <b>{section.count}</b>
            </button>
          ))}
        </nav>

        {/* Stats */}
        <div className="adm-stats">
          <div className="adm-stat">
            <span>{regs.length}</span>
            <label>Total Registrations</label>
          </div>
          <div className="adm-stat" style={{ "--sc": "#4db3ff" }}>
            <span>{bgmiCount}</span>
            <label>BGMI Teams</label>
          </div>
          <div className="adm-stat" style={{ "--sc": "var(--red)" }}>
            <span>{fc26Count}</span>
            <label>FC 26 Players</label>
          </div>
          <div className="adm-stat" style={{ "--sc": "var(--amber)" }}>
            <span>{bgmiCount * 4}</span>
            <label>Est. BGMI Players</label>
          </div>
        </div>

        {activeSection === "overview" && <section className="adm-registration">
          <div>
            <div className="adm-kicker">// PUBLIC REGISTRATION</div>
            <h3>Registration is <span>{registrationOpen ? "open" : "closed"}</span></h3>
            <p>{registrationOpen
              ? "Players can access and submit the BGMI and FC 26 forms."
              : "The public page is showing that registration is closed, and the forms are blocked."}</p>
            {registrationError && <div className="adm-setting-error" role="alert">{registrationError}</div>}
          </div>
          <button
            className="btn"
            style={registrationOpen ? { background: "var(--red)" } : { background: "#7dff7d" }}
            onClick={() => setRegistrationOpen(!registrationOpen)}
            disabled={demoMode}
          >
            {demoMode ? "Unavailable in demo mode" : registrationOpen ? "Close registration" : "Open registration"}
          </button>
        </section>}

        {activeSection === "fc26" && <section className="adm-fc-bracket">
          <div className="adm-fc-bracket-header">
            <div>
              <div className="adm-kicker">// FC 26 · KNOCKOUT TOURNAMENT</div>
              <h3>FIFA bracket</h3>
              <p>Generate a single-elimination bracket from registered FC 26 players, then select each match winner to advance them.</p>
            </div>
            <button className="btn" onClick={generateFc26Bracket} disabled={fc26Count === 0}>
              {bracket ? "Regenerate bracket" : "Generate bracket"}
            </button>
          </div>
          {bracketError && <div className="adm-setting-error" role="alert">{bracketError}</div>}
          {fc26Count === 0
            ? <div className="adm-empty">Register FC 26 players before generating the bracket.</div>
            : bracket
              ? <>
                <div className="adm-bracket-publish">
                  <p className="adm-bracket-entrants">
                    {bracket.entrants.length} players in this bracket. New registrations are not added automatically. Changing a winner resets affected later results.
                    <strong className={bracketPublished ? "published" : ""}>
                      {bracketPublished ? " · Visible on frontend" : " · Hidden from frontend"}
                    </strong>
                  </p>
                  <button className={`btn ${bracketPublished ? "alt" : ""}`} onClick={() => setBracketPublished(!bracketPublished)}>
                    {bracketPublished ? "Hide from frontend" : "Publish bracket"}
                  </button>
                </div>
                <BracketBoard bracket={bracket} onWinner={chooseFc26Winner} />
              </>
              : <p className="adm-bracket-entrants">No bracket yet. Generate one when you are ready.</p>}
        </section>}

        {activeSection === "bgmi" && <BgmiLeaderboardAdmin
          teams={regs.filter((registration) => registration.g === "bgmi")}
          leaderboard={bgmiLeaderboard}
          saveLeaderboard={setBgmiLeaderboard}
          error={bgmiLeaderboardError}
        />}

        {/* Filters + search */}
        <div className="adm-toolbar">
          <input
            className="adm-search"
            type="search"
            placeholder={`Search ${activeSection === "overview" ? "all registrations" : activeSection === "bgmi" ? "BGMI teams" : "FC 26 players"}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Registration list */}
        <div className="adm-registration-list-heading">
          <div>
            <div className="adm-kicker">// {activeSection === "overview" ? "ALL GAMES" : activeSection === "bgmi" ? "BGMI" : "FC 26"} · REGISTRATIONS</div>
            <h3>{activeSection === "overview" ? "All registrations" : activeSection === "bgmi" ? "BGMI teams" : "FC 26 players"}</h3>
          </div>
          <span>{visible.length} {visible.length === 1 ? "entry" : "entries"}</span>
        </div>
        {visible.length === 0 ? (
          <div className="adm-empty">
            {regs.length === 0 ? "No registrations yet." : "No results match your filter."}
          </div>
        ) : (
          <div className="adm-list">
            {visible.map((r) => {
              const isBgmi = r.g === "bgmi";
              const name = isBgmi ? r.team : r.name;
              const sub = isBgmi ? `Captain: ${r.cap}` : `IGN: ${r.ign || "—"}`;
              const color = isBgmi ? "#4db3ff" : "var(--red)";
              return (
                <div className="adm-row" key={r.id} onClick={() => setDetail(r)}>
                  <div className="adm-row-game" style={{ color }}>
                    {isBgmi ? "BGMI" : "FC26"}
                  </div>
                  <div className="adm-row-main">
                    <b>{name}</b>
                    <span>{sub}</span>
                  </div>
                  <div className="adm-row-meta">
                    <span>{r.mail}</span>
                    <span style={{ color: "var(--dim)", fontSize: ".75rem" }}>{r.id}</span>
                  </div>
                  <div className="adm-row-time">
                    {new Date(r.t).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {!demoMode && <button className="adm-del" title="Delete" onClick={(e) => { e.stopPropagation(); deleteReg(r.id); }}>✕</button>}
                </div>
              );
            })}
          </div>
        )}
        <a href="#" className="back" style={{ display: "block", marginTop: 32 }}>← Back to site</a>
      </div>
    </div>
  );
}

/* =====================================================================
   App: tiny hash router (#/bgmi, #/fc26, #/admin, everything else = home)
   ===================================================================== */
export default function App() {
  const hash = useHash();
  const registrationStatus = useRegistrationStatus();
  const demoMode = useDemoMode();
  const fc26Bracket = useFc26Bracket(demoMode.enabled);
  const bgmiLeaderboard = useBgmiLeaderboard(demoMode.enabled);
  const route = (hash.match(/^#\/(bgmi|fc26|admin)$/) || [])[1];

  useEffect(() => {
    if (route) { window.scrollTo(0, 0); return; }
    if (hash.length > 1) { // returning home to an anchor like #register
      const t = setTimeout(() => { try { document.querySelector(hash)?.scrollIntoView(); } catch { /* ignore */ } }, 60);
      return () => clearTimeout(t);
    }
  }, [route, hash]);

  if (route === "admin") return <><Spores /><RedFlash /><Hud /><Nav /><AdminPage
    registrationOpen={registrationStatus.open}
    setRegistrationOpen={registrationStatus.setOpen}
    registrationError={registrationStatus.error}
    bracket={fc26Bracket.bracket}
    setBracket={fc26Bracket.saveBracket}
    bracketPublished={fc26Bracket.published}
    setBracketPublished={fc26Bracket.setPublished}
    bracketError={fc26Bracket.error}
    bgmiLeaderboard={bgmiLeaderboard.leaderboard}
    setBgmiLeaderboard={bgmiLeaderboard.saveLeaderboard}
    bgmiLeaderboardError={bgmiLeaderboard.error}
    demoMode={demoMode.enabled}
    setDemoMode={demoMode.setEnabled}
    demoModeError={demoMode.error}
  /></>;

  return (
    <>
      <Spores /><RedFlash /><Hud /><Nav />
      {route === "bgmi"
        ? demoMode.enabled ? <RegistrationClosedPage demoMode /> : registrationStatus.open ? <BgmiPage /> : <RegistrationClosedPage />
        : route === "fc26"
          ? demoMode.enabled ? <RegistrationClosedPage demoMode /> : registrationStatus.open ? <Fc26Page /> : <RegistrationClosedPage />
          : <><Home
            registrationOpen={registrationStatus.open}
            bracket={fc26Bracket.bracket}
            bracketPublished={fc26Bracket.published}
            bracketError={fc26Bracket.error}
            bgmiTeams={demoMode.enabled
              ? DEMO_REGISTRATIONS.filter((registration) => registration.g === "bgmi")
              : loadRegs().filter((registration) => registration.g === "bgmi")}
            bgmiLeaderboard={bgmiLeaderboard.leaderboard}
            bgmiLeaderboardError={bgmiLeaderboard.error}
            demoMode={demoMode.enabled}
          /><Footer /></>}
    </>
  );
}
