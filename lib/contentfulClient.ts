import dotenv from "dotenv";
dotenv.config();

import { createClient } from "contentful-management";
export const cmaClient = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
});
