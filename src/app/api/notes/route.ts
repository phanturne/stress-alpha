import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { userNotesTable } from "@/db/schema";
import { formatSafeErrorDetails, normalizeTicker } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ authenticated: false, notes: {} });
    }

    const { searchParams } = new URL(request.url);
    const tickerParam = searchParams.get("ticker");
    const db = getDb();
    const userId = session.user.id;

    if (tickerParam) {
      const symbol = normalizeTicker(tickerParam);
      if (!symbol) {
        return NextResponse.json({ authenticated: true, note: null });
      }

      const rows = await db
        .select()
        .from(userNotesTable)
        .where(
          and(
            eq(userNotesTable.userId, userId),
            eq(userNotesTable.ticker, symbol)
          )
        )
        .limit(1);

      const row = rows[0];
      return NextResponse.json({
        authenticated: true,
        ticker: symbol,
        note: row
          ? {
              content: row.content,
              updatedAt: row.updatedAt.toISOString(),
            }
          : null,
      });
    }

    const rows = await db
      .select()
      .from(userNotesTable)
      .where(eq(userNotesTable.userId, userId))
      .orderBy(desc(userNotesTable.updatedAt));

    const notes: Record<string, { content: string; updatedAt: string }> = {};
    for (const r of rows) {
      notes[r.ticker] = {
        content: r.content,
        updatedAt: r.updatedAt.toISOString(),
      };
    }

    return NextResponse.json({ authenticated: true, notes });
  } catch (err: unknown) {
    console.error("Failed to fetch user stock notes:", err);
    return NextResponse.json(
      { error: "Internal server error", details: formatSafeErrorDetails(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required to sync notes to cloud" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, ticker, content, notes } = body;
    const db = getDb();
    const userId = session.user.id;

    // Batch sync from local storage
    if (action === "sync" && notes && typeof notes === "object") {
      const entries = Object.entries(notes);
      for (const [rawSymbol, item] of entries) {
        const symbol = normalizeTicker(rawSymbol);
        if (!symbol) continue;

        const noteContent =
          typeof item === "string"
            ? item
            : typeof item === "object" && item !== null && "content" in item
              ? String(item.content)
              : "";

        const updatedAt =
          typeof item === "object" &&
          item !== null &&
          "updatedAt" in item &&
          typeof item.updatedAt === "string"
            ? new Date(item.updatedAt)
            : new Date();

        const id = `${userId}_${symbol}`;

        await db
          .insert(userNotesTable)
          .values({
            id,
            userId,
            ticker: symbol,
            content: noteContent,
            updatedAt,
          })
          .onConflictDoUpdate({
            target: [userNotesTable.userId, userNotesTable.ticker],
            set: {
              content: noteContent,
              updatedAt,
            },
          });
      }

      // Return refreshed notes map
      const rows = await db
        .select()
        .from(userNotesTable)
        .where(eq(userNotesTable.userId, userId))
        .orderBy(desc(userNotesTable.updatedAt));

      const updatedMap: Record<string, { content: string; updatedAt: string }> =
        {};
      for (const r of rows) {
        updatedMap[r.ticker] = {
          content: r.content,
          updatedAt: r.updatedAt.toISOString(),
        };
      }

      return NextResponse.json({ success: true, notes: updatedMap });
    }

    // Single note save
    const symbol = normalizeTicker(ticker);
    if (!symbol) {
      return NextResponse.json(
        { error: "Invalid ticker symbol" },
        { status: 400 }
      );
    }

    const noteContent = typeof content === "string" ? content : "";
    const id = `${userId}_${symbol}`;
    const now = new Date();

    await db
      .insert(userNotesTable)
      .values({
        id,
        userId,
        ticker: symbol,
        content: noteContent,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userNotesTable.userId, userNotesTable.ticker],
        set: {
          content: noteContent,
          updatedAt: now,
        },
      });

    return NextResponse.json({
      success: true,
      note: {
        ticker: symbol,
        content: noteContent,
        updatedAt: now.toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error("Failed to save stock note:", err);
    return NextResponse.json(
      { error: "Internal server error", details: formatSafeErrorDetails(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required to modify notes" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tickerParam = searchParams.get("ticker");
    if (!tickerParam) {
      return NextResponse.json(
        { error: "Ticker parameter is required" },
        { status: 400 }
      );
    }

    const symbol = normalizeTicker(tickerParam);
    const db = getDb();
    const userId = session.user.id;

    await db
      .delete(userNotesTable)
      .where(
        and(
          eq(userNotesTable.userId, userId),
          eq(userNotesTable.ticker, symbol)
        )
      );

    return NextResponse.json({ success: true, ticker: symbol });
  } catch (err: unknown) {
    console.error("Failed to delete stock note:", err);
    return NextResponse.json(
      { error: "Internal server error", details: formatSafeErrorDetails(err) },
      { status: 500 }
    );
  }
}
