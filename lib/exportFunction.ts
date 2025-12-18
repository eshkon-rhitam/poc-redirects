import { RedirectType } from "./features/routeSlice";

type ExportRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
  baseDomain: Brand | undefined;
};
type Brand =
  | "AltusGroup"
  | "Reonomy"
  | "Forbury"
  | "Verifino"
  | "FinanceActive";

const DOMAIN_BRAND_MAP: Record<string, Brand> = {
  "altusgroup.com": "AltusGroup",
  "www.altusgroup.com": "AltusGroup",

  "reonomy.com": "Reonomy",
  "www.reonomy.com": "Reonomy",

  "forbury.com": "Forbury",
  "www.forbury.com": "Forbury",

  "verifino.com": "Verifino",
  "www.verifino.com": "Verifino",

  "financeactive.com": "FinanceActive",
  "www.financeactive.com": "FinanceActive",
};
export const mapUrlToBrand = (urlOrHost: string): Brand | undefined => {
  if (!urlOrHost) return undefined;

  let host = urlOrHost.trim();

  // Allow passing just "reonomy.com" or a full URL
  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    host = `https://${host}`;
  }

  try {
    const hostname = new URL(host).hostname.toLowerCase();

    // direct match first with/without www
    if (DOMAIN_BRAND_MAP[hostname]) {
      return DOMAIN_BRAND_MAP[hostname];
    }

    // normalised match strip leading www.
    const normalised = hostname.replace(/^www\./, "");
    return (
      DOMAIN_BRAND_MAP[normalised] ?? DOMAIN_BRAND_MAP[`www.${normalised}`]
    );
  } catch {
    return undefined;
  }
};
const toPath = (url: string): string => {
  try {
    const u = new URL(url);
    return u.pathname || "/";
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
};

export const buildExportData = (
  mappings: { from: string; to: string; type: RedirectType }[]
): ExportRedirect[] => {
  console.log(mappings);

  if (!Array.isArray(mappings)) return [];
  return mappings.map((m) => {
    return {
      source: toPath(m.from),
      destination: toPath(m.to),
      permanent: m.type === "Permanent",
      baseDomain: mapUrlToBrand(m.from),
    };
  });
};

export const downloadJson = (data: unknown, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
