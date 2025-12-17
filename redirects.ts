import type { Redirect } from "next/dist/lib/load-custom-routes";

export const redirects: Redirect[] = [
  { source: "/test", destination: "/", permanent: true },
];
