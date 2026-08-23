import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const META_API_BASE = "https://mt-client-api-v1.agiliumtrade.ai";

interface MetaApiDeal {
  id: string;
  type: string;
  entryType?: string;
  symbol?: string;
  time: string;
  brokerTime?: string;
  volume?: number;
  price?: number;
  commission?: number;
  swap?: number;
  profit: number;
  positionId?: string;
  orderId?: string;
  platform?: string;
  stopLoss?: number;
  takeProfit?: number;
}

interface TradeHistoryRow {
  user_id: string;
  mt5_account_id: string;
  metaapi_deal_id: string;
  open_time: string | null;
  close_time: string;
  lot_size: number;
  trade_type: string;
  profit: number;
  has_stop_loss: boolean;
  has_take_profit: boolean;
}

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

    const mt5AccountId = accountRow.id;

    // Fetch closed deals for the last 90 days
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 90 * 24 * 60 * 60 * 1000);
    const startTimeStr = startTime.toISOString().replace(/\.\d{3}Z$/, "Z");
    const endTimeStr = endTime.toISOString().replace(/\.\d{3}Z$/, "Z");

    const dealsRes = await fetch(
      `${META_API_BASE}/users/current/accounts/${accountId}/history-deals/time/${startTimeStr}/${endTimeStr}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "auth-token": metaApiToken,
        },
      },
    );

    if (!dealsRes.ok) {
      const errBody = await dealsRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: errBody.message || errBody.error || `MetaApi error (${dealsRes.status})` }),
        { status: dealsRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dealsBody = await dealsRes.json();
    const deals: MetaApiDeal[] = dealsBody.deals || [];

    // Filter to only entry-out deals (closed trades) with BUY or SELL type
    const closedTrades = deals.filter(
      (d) =>
        (d.type === "DEAL_TYPE_BUY" || d.type === "DEAL_TYPE_SELL") &&
        d.entryType === "DEAL_ENTRY_OUT",
    );

    // Delete existing history for this account before inserting fresh data
    await supabase
      .from("mt5_trade_history")
      .delete()
      .eq("mt5_account_id", mt5AccountId);

    // Build rows for insertion
    const rows: TradeHistoryRow[] = closedTrades.map((deal) => {
      const tradeType = deal.type === "DEAL_TYPE_BUY" ? "buy" : "sell";
      return {
        user_id: userId,
        mt5_account_id: mt5AccountId,
        metaapi_deal_id: deal.id,
        open_time: null, // Will be enriched later from the corresponding entry-in deal
        close_time: deal.time,
        lot_size: deal.volume ?? 0,
        trade_type: tradeType,
        profit: deal.profit ?? 0,
        has_stop_loss: deal.stopLoss != null && deal.stopLoss !== 0,
        has_take_profit: deal.takeProfit != null && deal.takeProfit !== 0,
      };
    });

    // Try to find matching entry-in deals to get open times
    const entryInDeals = deals.filter((d) => d.entryType === "DEAL_ENTRY_IN");
    const entryByPosition = new Map<string, string>();
    for (const ed of entryInDeals) {
      if (ed.positionId && ed.time) {
        entryByPosition.set(ed.positionId, ed.time);
      }
    }
    for (const row of rows) {
      const matchingDeal = closedTrades.find((d) => d.id === row.metaapi_deal_id);
      if (matchingDeal?.positionId && entryByPosition.has(matchingDeal.positionId)) {
        row.open_time = entryByPosition.get(matchingDeal.positionId)!;
      }
    }

    let insertedCount = 0;
    if (rows.length > 0) {
      const { error: insertErr } = await supabase
        .from("mt5_trade_history")
        .insert(rows);
      if (insertErr) {
        return new Response(
          JSON.stringify({ error: "Failed to save trade history: " + insertErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      insertedCount = rows.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalDealsFetched: deals.length,
        closedTradesSynced: insertedCount,
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
