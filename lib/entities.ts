/* eslint-disable @typescript-eslint/no-explicit-any */
const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const CONTENTFUL_ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT;
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN!;

const CONTENTFUL_GRAPHQL_ENDPOINT = `https://graphql.contentful.com/content/v1/spaces/${CONTENTFUL_SPACE_ID}/environments/${CONTENTFUL_ENVIRONMENT}`;

const ENTITY_BY_CANONICAL_QUERY = `
  query GetEntitiesByCanonical($canonical: String!, $limit: Int = 10) {
    entityCollection(where: { canonical: $canonical }, limit: $limit) {
      total
      items {
        sys { id }
        internalName
        domain
        entityType
        title(locale: "en-CA")
        publishedDate
        canonical
      }
    }
  }
`;

export async function getEntitiesByCanonical(canonical: string) {
  const res = await fetch(CONTENTFUL_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONTENTFUL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: ENTITY_BY_CANONICAL_QUERY,
      variables: { canonical, limit: 10 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Contentful error: ${res.status} ${res.statusText}`);
  }

  const { data, errors } = await res.json();

  if (errors?.length) {
    throw new Error(errors.map((e: any) => e.message).join(", "));
  }

  return data.entityCollection;
}
