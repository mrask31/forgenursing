import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CRON_SECRET = process.env.CRON_SECRET!;
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/fn-send-emails`;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });
    const data = await res.json();
    console.log("[cron/process-emails]", data);
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("[cron/process-emails] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
