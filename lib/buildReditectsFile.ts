import { RedirectType } from "@/lib/features/routeSlice";

type Mapping = { from: string; to: string; type: RedirectType };

export function buildRedirectsFile(mappings: Mapping[]): string {
  const lines = mappings.map((m) => {
    const source = new URL(m.from).pathname || "/";
    const destination = new URL(m.to).pathname || "/";
    const permanent = m.type === "Permanent";
    return `  { source: "${source}", destination: "${destination}", permanent: ${permanent} },`;
  });

  return `import type { Redirect } from "next/dist/lib/load-custom-routes";

export const redirects: Redirect[] = [
${lines.join("\n")}
];
`;
}
