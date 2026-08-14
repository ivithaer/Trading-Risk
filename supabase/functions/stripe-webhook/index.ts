import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const stripeSignature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stripeSignature) {
      return new Response(JSON.stringify({ error: "Missing Stripe signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();

    // Verify Stripe webhook signature
    const isValid = await verifyStripeSignature(rawBody, stripeSignature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);

    // Only handle checkout.session.completed and customer.subscription.* events
    const relevantTypes = [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ];

    if (!relevantTypes.includes(event.type)) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let email: string | null = null;
    let stripeCustomerId: string | null = null;
    let isActive = true;

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      email = session?.customer_email ?? session?.customer_details?.email ?? null;
      stripeCustomerId = session?.customer ?? null;
      isActive = true;
    } else {
      const subscription = event.data?.object;
      stripeCustomerId = subscription?.customer ?? null;
      email = subscription?.customer_email ?? null;
      isActive = event.type !== "customer.subscription.deleted";
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "No email in event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert premium subscriber using service_role key (bypasses RLS)
    const { error } = await supabase
      .from("premium_subscribers")
      .upsert(
        {
          email: normalizedEmail,
          stripe_customer_id: stripeCustomerId,
          is_active: isActive,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

    if (error) {
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Verify a Stripe webhook signature using the Stripe SDK.
 * Uses Stripe's official library for secure signature verification.
 */
async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    // Parse the Stripe-Signature header
    const parts = signatureHeader.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.split("=")[1];
    const signature = signaturePart.split("=")[1];

    if (!timestamp || !signature) return false;

    // Reject if timestamp is more than 5 minutes old
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (age > 300) return false;

    // Compute HMAC-SHA256 of "timestamp.payload" using the webhook secret
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const expectedSig = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload),
    );

    const expectedHex = Array.from(new Uint8Array(expectedSig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Timing-safe comparison
    if (expectedHex.length !== signature.length) return false;

    let diff = 0;
    for (let i = 0; i < signature.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return diff === 0;
  } catch {
    return false;
  }
}
