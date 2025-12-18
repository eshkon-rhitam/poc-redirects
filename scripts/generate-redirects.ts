/* eslint-disable @typescript-eslint/no-explicit-any */
import { cmaClient } from "../lib/contentfulClient";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
const locale = "en-CA";

async function main() {
  const space = await cmaClient.getSpace(process.env.CONTENTFUL_SPACE_ID!);
  const env = await space.getEnvironment(
    process.env.CONTENTFUL_ENVIRONMENT ?? "a4"
  );
  const activeDomain = process.env.ACTIVE_DOMAIN ?? "AltusGroup";
  if (!activeDomain) {
    console.error("ACTIVE_DOMAIN env var is required");
    process.exit(1);
  }
  const response = await env.getEntries({
    content_type: "redirect",
    locale,
    "fields.enabled": true,
    "fields.baseDomain": activeDomain,
  });

  if (response.items.length === 0) {
    console.warn("No redirect entries found in Contentful");
    // empty file
    const filePath = resolve(process.cwd(), "redirects.ts");
    const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT.
export type RedirectRule = {
  source: string;
  destination: string;
  permanent: boolean;
};

export const redirects: RedirectRule[] = [];
`;
    writeFileSync(filePath, fileContent, "utf8");
    console.log(`Wrote 0 redirects to ${filePath}`);
    return;
  }
  const redirects = response.items.map((item: any) => ({
    source: item.fields.source[locale],
    destination: item.fields.destination[locale],
    permanent:
      item.fields.permanent?.[locale] !== undefined
        ? item.fields.permanent[locale]
        : true,
  }));

  const filePath = resolve(process.cwd(), "redirects.ts");
  const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT.
export type RedirectRule = {
  source: string;
  destination: string;
  permanent: boolean;
};;

export const redirects: RedirectRule[] = ${JSON.stringify(redirects, null, 2)};
`;
  writeFileSync(filePath, fileContent, "utf8");
  console.log(`Wrote ${redirects.length} redirects to ${filePath}`);
}

main().catch((err) => {
  console.error("Failed to generate redirects from Contentful", err);
  process.exit(1);
});
