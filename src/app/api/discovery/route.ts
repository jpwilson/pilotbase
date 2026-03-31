import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { FSP } from "@/lib/fsp";
import { DiscoveryEngine } from "@/lib/engine/discovery";
import { OperatorConfigService } from "@/lib/engine/config";
import { z } from "zod";

const discoveryRequestSchema = z.object({
  prospectName: z.string().min(1),
  prospectEmail: z.string().email().optional(),
  prospectPhone: z.string().optional(),
  preferredDates: z.array(z.string()).optional(),
  notes: z.string().optional(),
  locationId: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();
    const parsed = discoveryRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const db = getSupabaseServerClient(user.operatorId);

    // 1. Store the discovery request
    const { data: discoveryRequest, error: dbError } = await db
      .from("discovery_requests")
      .insert({
        operator_id: user.operatorId,
        prospect_name: parsed.data.prospectName,
        prospect_email: parsed.data.prospectEmail ?? null,
        prospect_phone: parsed.data.prospectPhone ?? null,
        preferred_dates: parsed.data.preferredDates ?? [],
        notes: parsed.data.notes ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (dbError || !discoveryRequest) {
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    const record = discoveryRequest as { id: string; [key: string]: unknown };

    // 2. Trigger the discovery engine to find slots
    const configService = new OperatorConfigService(user.operatorId);
    const engineConfig = await configService.getEngineConfig(parsed.data.locationId);

    const fsp = new FSP({
      baseUrl: process.env.FSP_API_BASE_URL!,
      operatorId: user.operatorId,
    });

    const engine = new DiscoveryEngine(fsp, engineConfig);
    await engine.processRequest(
      {
        type: "discovery_request",
        requestId: record.id,
        prospectName: parsed.data.prospectName,
        detectedAt: new Date().toISOString(),
      },
      {
        prospectName: parsed.data.prospectName,
        prospectEmail: parsed.data.prospectEmail,
        preferredDates: parsed.data.preferredDates,
      }
    );

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const db = getSupabaseServerClient(user.operatorId);

    const { data, error } = await db
      .from("discovery_requests")
      .select()
      .eq("operator_id", user.operatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.name === "AuthError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
