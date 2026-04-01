import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operatorId = searchParams.get("operator_id") || "1";
  try {
    const db = getClient();
    const { data, error } = await db
      .from("students")
      .select("*")
      .eq("operator_id", operatorId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getClient();
    const { data, error } = await db
      .from("students")
      .insert({ ...body, operator_id: body.operator_id || "1" })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
