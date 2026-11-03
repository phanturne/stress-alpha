import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getReportRepository } from "@/lib/repository";

async function handleRevalidation(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const providedSecret = bearer || querySecret;

  const expectedSecret =
    process.env.REVALIDATION_SECRET || process.env.CRON_SECRET;

  if (expectedSecret && providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tag = searchParams.get("tag") || "reports";
    const slug = searchParams.get("slug");

    // 1. Purge Next.js Data Cache tags
    revalidateTag(tag, "max");
    if (tag !== "reports") {
      revalidateTag("reports", "max");
    }

    // 2. Revalidate affected routes
    revalidatePath("/api/reports");
    revalidatePath("/");
    revalidatePath("/screener");
    if (slug) {
      revalidatePath(`/api/reports/${slug}`);
    }

    // 3. Clear repository in-memory warm cache
    const repo = getReportRepository();
    repo.clearCache?.();

    return NextResponse.json({
      revalidated: true,
      tag,
      slug: slug || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      {
        error: "Failed to revalidate",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export { handleRevalidation as GET, handleRevalidation as POST };
