/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getEntitiesByCanonical } from "@/lib/entities";
import { cmaClient } from "@/lib/contentfulClient";

export const maxDuration = 60; // Increase timeout for bulk operations

// Utility function to process in batches with concurrency limit
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}

async function updateEntity(
  entityId: string,
  changeCanonical: string,
  spaceId: string,
  environmentId: string
) {
  try {
    console.log(`Attempting to update entity ${entityId}`);

    // Get the space and environment
    const space = await cmaClient.getSpace(spaceId);
    const environment = await space.getEnvironment(environmentId);

    // Get the current entry
    const entry = await environment.getEntry(entityId);

    console.log(`Current entry fields:`, Object.keys(entry.fields || {}));

    // Check if canonical field exists
    if (!entry.fields.canonical) {
      console.error(`Entity ${entityId} does not have a canonical field`);
      return {
        id: entityId,
        success: false,
        error: "Canonical field not found in entry",
      };
    }

    // Get the locale from the canonical field
    const locales = Object.keys(entry.fields.canonical);
    console.log(`Available locales:`, locales);

    // Update canonical for all
    locales.forEach((locale) => {
      entry.fields.canonical[locale] = changeCanonical;
    });

    // Update the entry
    const updatedEntry = await entry.update();
    console.log(`Entity ${entityId} updated successfully`);

    // Publish the entry
    await updatedEntry.publish();
    console.log(`Entity ${entityId} published successfully`);

    return {
      id: entityId,
      success: true,
      published: true,
      locales: locales,
    };
  } catch (err: any) {
    console.error(`Error updating entity ${entityId}:`, err);

    // Handle Contentful errors
    if (err && typeof err === "object" && "sys" in err) {
      const contentfulError = err as {
        sys?: { id?: string };
        message?: string;
      };
      return {
        id: entityId,
        success: false,
        error: contentfulError.message || "Contentful API error",
        details: contentfulError.sys?.id,
      };
    }

    return {
      id: entityId,
      success: false,
      error: err.message || "Unknown error",
    };
  }
}

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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch entities", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const canonical = searchParams.get("canonical");
  const changeCanonical = searchParams.get("changeCanonical");

  if (!canonical || !changeCanonical) {
    return NextResponse.json(
      { error: "Both canonical and changeCanonical parameters are required" },
      { status: 400 }
    );
  }
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "a4";

  if (!spaceId) {
    return NextResponse.json(
      { error: "Missing CONTENTFUL_SPACE_ID environment variable" },
      { status: 500 }
    );
  }

  console.log(`Starting update: ${canonical} to ${changeCanonical}`);
  console.log(`Space: ${spaceId}, Environment: ${environmentId}`);

  try {
    const entities = await getEntitiesByCanonical(canonical);
    console.log(`Found ${entities.items?.length || 0} entities`);

    if (!entities.items?.length) {
      return NextResponse.json(
        {
          message: "No entities found with the specified canonical",
          updated: 0,
        },
        { status: 200 }
      );
    }

    // Process in batches of 5 concurrent requests
    const results = await processBatch(
      entities.items,
      (entity) =>
        updateEntity(entity.sys.id, changeCanonical, spaceId, environmentId),
      5
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      message: `Updated ${successful.length} of ${entities.items.length} entities`,
      updated: successful.length,
      failed: failed.length,
      totalFound: entities.items.length,
      successfulIds: successful.map((r) => r.id),
      failedIds: failed.map((r) => ({ id: r.id, error: r.error })),
      oldCanonical: canonical,
      newCanonical: changeCanonical,
    });
  } catch (error: any) {
    console.error("Bulk update error:", error);

    // Handle Contentful errors
    if (error && typeof error === "object" && "sys" in error) {
      const contentfulError = error as {
        sys?: { id?: string };
        message?: string;
      };
      return NextResponse.json(
        {
          error: contentfulError.message || "Contentful API error",
          details: contentfulError.sys?.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update entities", details: error.message },
      { status: 500 }
    );
  }
}
