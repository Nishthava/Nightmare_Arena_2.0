import { createServer } from "node:http";
import { fromSupabaseUrl, withSupabase } from "@supabase/server";

const port = Number(process.env.PORT ?? 3000);
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required.");
}

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const cors = {
  headers: {
    "Access-Control-Allow-Origin": frontendOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  },
};

const currentUser = withSupabase(
  {
    auth: "user",
    issuer: fromSupabaseUrl(supabaseUrl),
    cors,
  },
  async (_request, { userClaims }) => Response.json({ user: userClaims }),
);

const server = createServer((incoming, outgoing) => {
  void handleRequest(incoming, outgoing).catch((error) => {
    console.error("Backend request failed:", error);
    if (outgoing.headersSent) {
      outgoing.destroy();
      return;
    }
    outgoing.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    outgoing.end(JSON.stringify({ error: "Internal server error" }));
  });
});

async function handleRequest(incoming, outgoing) {
  const url = new URL(incoming.url ?? "/", "http://localhost");

  if (url.pathname === "/health" && incoming.method === "GET") {
    outgoing.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    outgoing.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (url.pathname !== "/api/me") {
    outgoing.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    outgoing.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (incoming.method !== "GET" && incoming.method !== "OPTIONS") {
    incoming.resume();
    outgoing.writeHead(405, { allow: "GET, OPTIONS", "content-type": "application/json; charset=utf-8" });
    outgoing.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const headers = new Headers();
  for (const name of ["accept", "authorization", "apikey", "content-type", "origin"]) {
    const value = incoming.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }

  const request = new Request(url, { method: incoming.method, headers });
  const response = await currentUser(request);
  const responseHeaders = Object.fromEntries(response.headers);
  const body = Buffer.from(await response.arrayBuffer());
  outgoing.writeHead(response.status, responseHeaders);
  outgoing.end(body);
}

server.listen(port, () => {
  console.log(`Nightmare Arena API listening on http://localhost:${port}`);
});
