import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || import.meta.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error(
    "[SIGS] VITE_CONVEX_URL não definido. " +
    "Execute 'npx convex dev' para gerar a URL e crie o arquivo .env.local."
  );
}

export const convex = new ConvexReactClient(convexUrl ?? "https://artful-cod-498.convex.cloud");
