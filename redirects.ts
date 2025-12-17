import type { Redirect } from "next/dist/lib/load-custom-routes";

export const redirects: Redirect[] = [
  { source: "/Default.aspx", destination: "/", permanent: false },
  { source: "/Default.aspx", destination: "/", permanent: false },
  { source: "/realestatematt", destination: "/", permanent: false },
  { source: "/4-top-cre-performers-for-2016/", destination: "/resources/", permanent: false },
  { source: "/how-michael-bull-juggles-cre-business-radio-show/", destination: "/resources/", permanent: false },
  { source: "/miamirealtors", destination: "/", permanent: false },
  { source: "/new-york-city/", destination: "/", permanent: false },
  { source: "/augmenting-dropwizard-with-swagger/", destination: "/", permanent: false },
  { source: "/home/", destination: "/", permanent: false },
  { source: "/privacy", destination: "/legal/privacy-policy/", permanent: false },
  { source: "/solutions", destination: "/solutions/web-application/", permanent: false },
  { source: "/the-game-of-loans/", destination: "/", permanent: false },
  { source: "/tou", destination: "/", permanent: false },
  { source: "/webinars/julystateofcre", destination: "/", permanent: false },
  { source: "/wp-content/uploads/2019/10/High-Rise-Apartment-Building.jpeg", destination: "/webinars/", permanent: false },
  { source: "/", destination: "/test", permanent: true },
];
