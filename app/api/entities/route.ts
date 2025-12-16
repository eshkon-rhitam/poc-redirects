// app/api/entities/canonical/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEntitiesByCanonical } from "@/lib/entities";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const canonical = searchParams.get("canonical");

  if (!canonical) {
    return NextResponse.json(
      { error: "Canonical parameter is required" },
      { status: 400 }
    );
  }

  try {
    const entities = await getEntitiesByCanonical(canonical);
    return NextResponse.json(entities);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch entities" },
      { status: 500 }
    );
  }
}
