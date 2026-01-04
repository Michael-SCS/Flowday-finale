// @ts-nocheck
// Supabase Edge Function: check-email
// Returns whether an email is registered in the app's database.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.3";

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

function corsHeaders(origin?: string | null) {
  const allowOrigin = origin && origin !== "null" ? origin : "*";
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
  };
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405, headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        error:
          "Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for this function.",
      },
      { status: 500, headers: cors },
    );
  }

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const email = normalizeEmail(payload?.email);

  // Always return a boolean (never throw) to keep the client UX simple.
  if (!email || !email.includes("@")) {
    return json({ ok: true, exists: false }, { status: 200, headers: cors });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (error) {
    // Don't leak internal details.
    return json({ ok: false, exists: false }, { status: 200, headers: cors });
  }

  return json({ ok: true, exists: Array.isArray(data) && data.length > 0 }, { status: 200, headers: cors });
});
