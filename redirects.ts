export const redirects = [
  {
    source: "/old-blog/post-1",
    destination: "/blog/new-post-1",
    permanent: true,
  },
  {
    source: "/under-construction",
    destination: "/temporary-landing",
    permanent: false,
  },
  {
    source: "/old-users/:slug*",
    destination: "/users/:slug*",
    permanent: true,
  },
];
