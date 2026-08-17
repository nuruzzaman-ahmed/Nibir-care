import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQueueSummary } from "@/lib/queue-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 401 });
  }

  const { queueId } = await params;
  const queue = await getQueueSummary(queueId);

  if (!queue) {
    return NextResponse.json({ error: "কিউ পাওয়া যায়নি" }, { status: 404 });
  }

  return NextResponse.json({ queue });
}
