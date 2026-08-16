import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const META_API_BASE = "https://mt-client-api-v1.agiliumtrade.ai";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const metaApiToken = Deno.env.get("METAAPI_TOKEN");
    if (!metaApiToken) {
      return new Response(
        JSON.stringify({ error: "MetaApi token not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "Missing accountId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: accountRow, error: accountErr } = await supabase
      .from("mt5_accounts")
      .select("id, user_id")
      .eq("metaapi_account_id", accountId)
      .maybeSingle();
    if (accountErr || !accountRow) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (accountRow.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const infoRes = await fetch(
      `${META_API_BASE}/users/current/accounts/${accountId}/account-information`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "auth-token": metaApiToken,
        },
      },
    );

    if (!infoRes.ok) {
      const errBody = await infoRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: errBody.message || errBody.error || `MetaApi error (${infoRes.status})` }),
        { status: infoRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const info = await infoRes.json();

    return new Response(
      JSON.stringify({
        balance: info.balance ?? 0,
        equity: info.equity ?? 0,
        margin: info.margin ?? 0,
        freeMargin: info.freeMargin ?? 0,
        openPositions: info.openPositions ?? (info.positions ? info.positions.length : 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
