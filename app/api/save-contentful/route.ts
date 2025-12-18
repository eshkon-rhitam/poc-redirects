/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { cmaClient } from "@/lib/contentfulClient";

const locale = "en-CA";

export async function POST(request: NextRequest) {
  try {
    const { redirects } = await request.json();

    if (!redirects || !Array.isArray(redirects) || redirects.length === 0) {
      return NextResponse.json(
        { error: "No redirects provided" },
        { status: 400 }
      );
    }

    const space = await cmaClient.getSpace(process.env.CONTENTFUL_SPACE_ID!);
    const environment = await space.getEnvironment(
      process.env.CONTENTFUL_ENVIRONMENT ?? "a4"
    );

    let savedCount = 0;

    for (const mapping of redirects) {
      try {
        const contentfulRedirect = {
          source: mapping.source,
          destination: mapping.destination,
          permanent: mapping.type === "Permanent",
          enabled: true,
          baseDomain: process.env.ACTIVE_DOMAIN ?? "AltusGroup",
        };

        // Check if entry already exists by source + baseDomain
        const existingEntries = await environment.getEntries({
          content_type: "redirect",
          [`fields.source`]: contentfulRedirect.source,
          [`fields.baseDomain`]: contentfulRedirect.baseDomain,
          locale,
        });

        let entry;

        if (existingEntries.items.length > 0) {
          // Update existing entry
          entry = await environment.getEntry(existingEntries.items[0].sys.id);
          entry.fields.source = { [locale]: contentfulRedirect.source };
          entry.fields.destination = {
            [locale]: contentfulRedirect.destination,
          };
          entry.fields.permanent = { [locale]: contentfulRedirect.permanent };
          entry.fields.enabled = { [locale]: contentfulRedirect.enabled };
          entry.fields.baseDomain = { [locale]: contentfulRedirect.baseDomain };

          await entry.update();
        } else {
          // Create new entry
          entry = await environment.createEntry("redirect", {
            fields: {
              source: { [locale]: contentfulRedirect.source },
              destination: { [locale]: contentfulRedirect.destination },
              permanent: { [locale]: contentfulRedirect.permanent },
              enabled: { [locale]: contentfulRedirect.enabled },
              baseDomain: { [locale]: contentfulRedirect.baseDomain },
            },
          });
        }

        await entry.publish();
        savedCount++;
      } catch (entryError) {
        console.error(`Failed to save redirect ${mapping.from}:`, entryError);
      }
    }

    return NextResponse.json({
      saved: savedCount,
      total: redirects.length,
      failed: redirects.length - savedCount,
    });
  } catch (error: any) {
    console.error("Contentful save error:", error);
    return NextResponse.json(
      { error: "Failed to save to Contentful", details: error.message },
      { status: 500 }
    );
  }
}
