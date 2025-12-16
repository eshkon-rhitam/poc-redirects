export const redirects = [
  {
    // Redirect an old blog post URL to a new one permanently
    source: "/old-blog/post-1",
    destination: "/blog/new-post-1",
    permanent: true,
  },
  {
    // Temporarily redirect a page that is under maintenance
    source: "/under-construction",
    destination: "/temporary-landing",
    permanent: false,
  },
  {
    // Use wildcards to redirect nested routes
    // e.g., /old-users/123 to /users/123
    source: "/old-users/:slug*",
    destination: "/users/:slug*",
    permanent: true,
  },
];
