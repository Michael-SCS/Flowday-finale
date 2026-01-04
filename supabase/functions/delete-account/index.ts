// @ts-nocheck
// Supabase Edge Function: delete-account
// Deletes the authenticated user's data and auth user (admin) securely.

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
  // Keep it permissive by default; lock this down in production if needed.
  const allowOrigin = origin && origin !== "null" ? origin : "*";
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
  };
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

  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : "";

  if (!jwt) {
    return json({ error: "Missing Authorization bearer token" }, { status: 401, headers: cors });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Validate the caller using their JWT.
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
  const user = userData?.user ?? null;
  if (userError || !user) {
    return json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  // Best-effort deletes of user-owned data.
  // Add more table deletes here if you store additional per-user rows.
  const results: Record<string, unknown> = {};

  const delOnboarding = await supabaseAdmin
    .from("user_onboarding")
    .delete()
    .eq("user_id", user.id);
  results.user_onboarding = delOnboarding.error ? { error: delOnboarding.error.message } : { ok: true };

  const delProfile = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", user.id);
  results.profiles = delProfile.error ? { error: delProfile.error.message } : { ok: true };

  // Finally, delete the Auth user.
  const delAuth = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (delAuth.error) {
    return json(
      { error: "Failed to delete auth user", details: delAuth.error.message, results },
      { status: 500, headers: cors },
    );
  }

  return json({ ok: true, results }, { status: 200, headers: cors });
});
