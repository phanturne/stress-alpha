import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { userWatchlistsTable } from "@/db/schema";
import { normalizeTicker } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ authenticated: false, watchlist: [] });
    }

    const db = getDb();
    const rows = await db
      .select({ ticker: userWatchlistsTable.ticker })
      .from(userWatchlistsTable)
      .where(eq(userWatchlistsTable.userId, session.user.id))
      .orderBy(desc(userWatchlistsTable.createdAt));

    const watchlist = rows.map((r) => r.ticker);
    return NextResponse.json({ authenticated: true, watchlist });
  } catch (err: any) {
    console.error("Failed to fetch user watchlist:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
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
        { error: "Authentication required to sync watchlist to cloud" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, ticker, tickers } = body;
    const db = getDb();
    const userId = session.user.id;

    if (action === "sync" && Array.isArray(tickers)) {
      const cleaned = Array.from(
        new Set(
          tickers
            .filter((t): t is string => typeof t === "string")
            .map(normalizeTicker)
            .filter(Boolean)
        )
      );

      if (cleaned.length > 0) {
        const records = cleaned.map((symbol) => ({
          id: `${userId}_${symbol}`,
          userId,
          ticker: symbol,
        }));
        await db
          .insert(userWatchlistsTable)
          .values(records)
          .onConflictDoNothing();
      }

      const rows = await db
        .select({ ticker: userWatchlistsTable.ticker })
        .from(userWatchlistsTable)
        .where(eq(userWatchlistsTable.userId, userId))
        .orderBy(desc(userWatchlistsTable.createdAt));

      return NextResponse.json({
        success: true,
        watchlist: rows.map((r) => r.ticker),
      });
    }

    if (action === "add" && typeof ticker === "string") {
      const symbol = normalizeTicker(ticker);
      if (!symbol) {
        return NextResponse.json(
          { error: "Invalid ticker symbol" },
          { status: 400 }
        );
      }

      await db
        .insert(userWatchlistsTable)
        .values({
          id: `${userId}_${symbol}`,
          userId,
          ticker: symbol,
        })
        .onConflictDoNothing();

      const rows = await db
        .select({ ticker: userWatchlistsTable.ticker })
        .from(userWatchlistsTable)
        .where(eq(userWatchlistsTable.userId, userId))
        .orderBy(desc(userWatchlistsTable.createdAt));

      return NextResponse.json({
        success: true,
        added: true,
        watchlist: rows.map((r) => r.ticker),
      });
    }

    if (action === "remove" && typeof ticker === "string") {
      const symbol = normalizeTicker(ticker);
      if (!symbol) {
        return NextResponse.json(
          { error: "Invalid ticker symbol" },
          { status: 400 }
        );
      }

      await db
        .delete(userWatchlistsTable)
        .where(
          and(
            eq(userWatchlistsTable.userId, userId),
            eq(userWatchlistsTable.ticker, symbol)
          )
        );

      const rows = await db
        .select({ ticker: userWatchlistsTable.ticker })
        .from(userWatchlistsTable)
        .where(eq(userWatchlistsTable.userId, userId))
        .orderBy(desc(userWatchlistsTable.createdAt));

      return NextResponse.json({
        success: true,
        removed: true,
        watchlist: rows.map((r) => r.ticker),
      });
    }

    if (action === "toggle" && typeof ticker === "string") {
      const symbol = normalizeTicker(ticker);
      if (!symbol) {
        return NextResponse.json(
          { error: "Invalid ticker symbol" },
          { status: 400 }
        );
      }

      const existing = await db
        .select()
        .from(userWatchlistsTable)
        .where(
          and(
            eq(userWatchlistsTable.userId, userId),
            eq(userWatchlistsTable.ticker, symbol)
          )
        )
        .limit(1);

      let added = false;
      if (existing.length > 0) {
        await db
          .delete(userWatchlistsTable)
          .where(
            and(
              eq(userWatchlistsTable.userId, userId),
              eq(userWatchlistsTable.ticker, symbol)
            )
          );
        added = false;
      } else {
        await db.insert(userWatchlistsTable).values({
          id: `${userId}_${symbol}`,
          userId,
          ticker: symbol,
        });
        added = true;
      }

      const rows = await db
        .select({ ticker: userWatchlistsTable.ticker })
        .from(userWatchlistsTable)
        .where(eq(userWatchlistsTable.userId, userId))
        .orderBy(desc(userWatchlistsTable.createdAt));

      return NextResponse.json({
        success: true,
        added,
        watchlist: rows.map((r) => r.ticker),
      });
    }

    return NextResponse.json(
      { error: "Invalid action or parameters" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Failed to mutate user watchlist:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    await db
      .delete(userWatchlistsTable)
      .where(eq(userWatchlistsTable.userId, session.user.id));

    return NextResponse.json({ success: true, watchlist: [] });
  } catch (err: any) {
    console.error("Failed to clear user watchlist:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}
