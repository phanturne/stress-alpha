import sys
import os
import json
import argparse
from datetime import datetime
import pandas as pd
import numpy as np

try:
    import certifi
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

try:
    import yfinance as yf
except ImportError:
    print("Error: yfinance is required. Install via: pip install yfinance", file=sys.stderr)
    sys.exit(1)

def safe_float(val):
    if pd.isna(val) or val is None:
        return None
    return float(val)

def fetch_fundamental_profile(ticker_symbol: str):
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info or {}

    profile = {
        "ticker": ticker_symbol,
        "shortName": info.get("shortName"),
        "longName": info.get("longName"),
        "currentPrice": info.get("currentPrice") or info.get("regularMarketPrice"),
        "marketCap": info.get("marketCap"),
        "trailingPE": info.get("trailingPE"),
        "forwardPE": info.get("forwardPE"),
        "trailingEps": info.get("trailingEps"),
        "forwardEps": info.get("forwardEps"),
        "sharesOutstanding": info.get("sharesOutstanding"),
        "targetLowPrice": info.get("targetLowPrice"),
        "targetMeanPrice": info.get("targetMeanPrice"),
        "targetHighPrice": info.get("targetHighPrice"),
        "recommendationKey": info.get("recommendationKey"),
        "numberOfAnalystOpinions": info.get("numberOfAnalystOpinions"),
        "quarterlyStatements": [],
        "balanceSheet": None,
        "cashFlow": None
    }

    # Fetch income statements
    try:
        inc = ticker.quarterly_income_stmt
        if inc is not None and not inc.empty:
            for date, col in inc.items():
                stmt = {
                    "date": date.strftime("%Y-%m-%d") if hasattr(date, "strftime") else str(date)[:10],
                    "Total Revenue": safe_float(col.get("Total Revenue")),
                    "Gross Profit": safe_float(col.get("Gross Profit")),
                    "Operating Income": safe_float(col.get("Operating Income")),
                    "Net Income": safe_float(col.get("Net Income")),
                    "Diluted EPS": safe_float(col.get("Diluted EPS")),
                    "Basic EPS": safe_float(col.get("Basic EPS")),
                    "Diluted Average Shares": safe_float(col.get("Diluted Average Shares"))
                }
                profile["quarterlyStatements"].append(stmt)
    except Exception as e:
        print(f"Warning fetching income statement: {e}", file=sys.stderr)

    # Fetch balance sheet
    try:
        bs = ticker.quarterly_balance_sheet
        if bs is not None and not bs.empty:
            date = bs.columns[0]
            col = bs[date]
            
            cash = safe_float(col.get("Cash And Cash Equivalents")) or 0.0
            st_investments = safe_float(col.get("Other Short Term Investments")) or 0.0
            
            # yfinance returns exact keys, we try to safely fetch them
            profile["balanceSheet"] = {
                "date": date.strftime("%Y-%m-%d") if hasattr(date, "strftime") else str(date)[:10],
                "cashAndCashEquivalents": cash,
                "shortTermInvestments": st_investments,
                "totalCash": cash + st_investments,
                "shortTermDebt": safe_float(col.get("Current Debt")),
                "longTermDebt": safe_float(col.get("Long Term Debt")),
                "totalDebt": safe_float(col.get("Total Debt")),
                "totalAssets": safe_float(col.get("Total Assets")),
                "totalLiabilities": safe_float(col.get("Total Liabilities Net Minority Interest")) or safe_float(col.get("Total Liabilities")),
                "totalEquity": safe_float(col.get("Stockholders Equity")) or safe_float(col.get("Total Equity Gross Minority Interest"))
            }
    except Exception as e:
        print(f"Warning fetching balance sheet: {e}", file=sys.stderr)

    # Fetch cash flow
    try:
        cf = ticker.quarterly_cashflow
        if cf is not None and not cf.empty:
            date = cf.columns[0]
            col = cf[date]
            
            ocf = safe_float(col.get("Operating Cash Flow")) or safe_float(col.get("Cash Flow From Continuing Operating Activities")) or 0.0
            capex = safe_float(col.get("Capital Expenditure")) or 0.0
            
            profile["cashFlow"] = {
                "date": date.strftime("%Y-%m-%d") if hasattr(date, "strftime") else str(date)[:10],
                "operatingCashFlow": ocf,
                "capitalExpenditure": capex,
                "freeCashFlow": safe_float(col.get("Free Cash Flow")) or (ocf - abs(capex) if capex < 0 else ocf - capex)
            }
    except Exception as e:
        print(f"Warning fetching cash flow: {e}", file=sys.stderr)

    return profile

def main():
    parser = argparse.ArgumentParser(description="Fetch fundamental profile including balance sheet and cash flow")
    parser.add_argument("ticker", type=str)
    parser.add_argument("report_dir", type=str, nargs="?", default=None)
    args = parser.parse_args()

    ticker = args.ticker.upper()
    print(f"Fetching fundamental data for {ticker}...")
    profile = fetch_fundamental_profile(ticker)

    if args.report_dir:
        os.makedirs(args.report_dir, exist_ok=True)
        out_path = os.path.join(args.report_dir, "fundamental_profile.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(profile, f, indent=2, ensure_ascii=False)
        print(f"Written fundamental profile to {out_path}")
    else:
        print(json.dumps(profile, indent=2))

if __name__ == "__main__":
    main()
