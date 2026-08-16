import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const META_API_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

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
    const { login, password, server, name, riskPlanId } = body;

    if (!login || !password || !server || !riskPlanId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: planData, error: planErr } = await supabase
      .from("risk_plans")
      .select("id")
      .eq("id", riskPlanId)
      .maybeSingle();
    if (planErr || !planData) {
      return new Response(
        JSON.stringify({ error: "Risk plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transactionId = crypto.randomUUID().replace(/-/g, "");
    const payload = {
      login: String(login),
      password: String(password),
      name: name || `MT5-${login}`,
      server: String(server),
      platform: "mt5",
      magic: 0,
      manualTrades: false,
    };

    const doCreate = async () => {
      return await fetch(`${META_API_BASE}/users/current/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "auth-token": metaApiToken,
          "transaction-id": transactionId,
        },
        body: JSON.stringify(payload),
      });
    };

    let createRes = await doCreate();

    if (createRes.status === 202) {
      await new Promise((r) => setTimeout(r, 5000));
      createRes = await doCreate();
    }

    const createBody = await createRes.json();

    if (!createRes.ok) {
      return new Response(
        JSON.stringify({ error: createBody.message || createBody.error || "Failed to connect to MT5 account" }),
        { status: createRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accountId = createBody.id;

    const { error: insertErr } = await supabase
      .from("mt5_accounts")
      .insert({
        user_id: userId,
        risk_plan_id: riskPlanId,
        metaapi_account_id: accountId,
        mt5_login: String(login),
        mt5_server: String(server),
        account_name: name || null,
      });
    if (insertErr) {
      return new Response(
        JSON.stringify({ error: "Failed to save account: " + insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, accountId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
