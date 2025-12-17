/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/save-redirects/route.ts
import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = "master";
const REDIRECTS_PATH = "redirects.ts";

async function createOrUpdateFile(content: string) {
  const baseUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(
    REDIRECTS_PATH
  )}`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "redirect-admin-service",
  };

  // Get SHA if file exists
  let sha: string | undefined;
  const getRes = await fetch(`${baseUrl}?ref=${BRANCH}`, { headers });
  if (getRes.ok) {
    const json = (await getRes.json()) as any;
    sha = json.sha;
  }

  const encodedContent = Buffer.from(content, "utf8").toString("base64");

  const body: any = {
    message: "chore: update redirects from admin UI",
    content: encodedContent,
    branch: BRANCH,
    committer: {
      name: "Redirect Bot",
      email: "redirect-bot@example.com",
    },
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(baseUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`GitHub PUT failed: ${putRes.status} ${text}`);
  }

  return putRes.json();
}

export async function POST(req: NextRequest) {
  try {
    // Optional: auth check (e.g. header, session, etc.)
    const { redirectsText } = await req.json();
    if (typeof redirectsText !== "string" || !redirectsText.trim()) {
      return NextResponse.json(
        { error: "redirectsText required" },
        { status: 400 }
      );
    }

    const result = await createOrUpdateFile(redirectsText);
    return NextResponse.json({ ok: true, commitSha: result.commit.sha });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
