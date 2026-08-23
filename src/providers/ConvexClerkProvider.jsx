import React from "react";
import { ConvexProvider } from "convex/react";
import { convex } from "../lib/convex";

export function ConvexClerkProvider({ children }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
