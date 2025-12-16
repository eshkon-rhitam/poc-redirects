import { RedirectType } from "./features/routeSlice";

type ExportRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
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
  if (!Array.isArray(mappings)) return [];
  return mappings.map((m) => ({
    source: toPath(m.from),
    destination: toPath(m.to),
    permanent: m.type === "Permanent",
  }));
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
