import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { registerSSEClient, getQueueSummary } from "@/lib/queue-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { queueId } = await params;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial queue state
      const summary = await getQueueSummary(queueId);
      if (summary) {
        const msg = `data: ${JSON.stringify({ type: "QUEUE_UPDATE", queue: summary })}\n\n`;
        controller.enqueue(new TextEncoder().encode(msg));
      }

      // Register for future updates
      const unregister = registerSSEClient(queueId, controller);

      // Heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unregister();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
