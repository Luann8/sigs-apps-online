import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const { type, data } = payload;

    if (type === "user.created" || type === "user.updated") {
      console.log("[Convex] Clerk user event:", type, data.id);
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
