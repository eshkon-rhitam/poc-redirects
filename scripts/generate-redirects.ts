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

  const response = await env.getEntries({
    content_type: "redirect",
    "fields.enabled": true,
  });

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
