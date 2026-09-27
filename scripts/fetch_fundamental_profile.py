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


def load_env():
    for env_file in [".env.local", ".env"]:
        env_path = os.path.join(os.path.dirname(__file__), "..", env_file)
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v

load_env()


def safe_float(val):
    if pd.isna(val) or val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def fetch_massive_financials(ticker_symbol: str, api_key: str):
    import urllib.request
    import ssl
    try:
        import certifi
        ctx = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        ctx = ssl._create_unverified_context()

    url = f"https://api.polygon.io/vX/reference/financials?ticker={ticker_symbol}&timeframe=quarterly&limit=4&apiKey={api_key}"
    try:
        req = urllib.request.urlopen(url, context=ctx, timeout=8)
        data = json.loads(req.read().decode())
        results = data.get("results", [])
        if not results:
            return None

        statements = []
        for r in results:
            inc = r.get("financials", {}).get("income_statement", {})
            stmt = {
                "date": r.get("end_date"),
                "fiscal_period": r.get("fiscal_period"),
                "fiscal_year": r.get("fiscal_year"),
                "Total Revenue": inc.get("revenues", {}).get("value") if "revenues" in inc else None,
                "Gross Profit": inc.get("gross_profit", {}).get("value") if "gross_profit" in inc else None,
                "Operating Income": inc.get("operating_income_loss", {}).get("value") if "operating_income_loss" in inc else None,
                "Net Income": inc.get("net_income_loss", {}).get("value") if "net_income_loss" in inc else None,
                "Diluted EPS": inc.get("diluted_earnings_per_share", {}).get("value") if "diluted_earnings_per_share" in inc else None,
                "Basic EPS": inc.get("basic_earnings_per_share", {}).get("value") if "basic_earnings_per_share" in inc else None,
            }
            statements.append(stmt)

        latest = results[0]
        bs = latest.get("financials", {}).get("balance_sheet", {})
        cf = latest.get("financials", {}).get("cash_flow_statement", {})

        cash = bs.get("cash_and_cash_equivalents", {}).get("value") or 0.0
        st_inv = bs.get("other_current_assets", {}).get("value") or 0.0
        st_debt = bs.get("current_debt", {}).get("value") or 0.0
        lt_debt = bs.get("noncurrent_liabilities", {}).get("value") or 0.0
        total_assets = bs.get("assets", {}).get("value") or 0.0
        total_liab = bs.get("liabilities", {}).get("value") or 0.0
        total_equity = bs.get("equity", {}).get("value") or 0.0

        balance_sheet = {
            "date": latest.get("end_date"),
            "cashAndCashEquivalents": cash,
            "shortTermInvestments": st_inv,
            "totalCash": cash + st_inv,
            "shortTermDebt": st_debt,
            "longTermDebt": lt_debt,
            "totalDebt": total_liab,
            "totalAssets": total_assets,
            "totalLiabilities": total_liab,
            "totalEquity": total_equity,
        }

        ocf = cf.get("net_cash_flow_from_operating_activities", {}).get("value") or 0.0
        capex = cf.get("net_cash_flow_from_investing_activities", {}).get("value") or 0.0

        cash_flow = {
            "date": latest.get("end_date"),
            "operatingCashFlow": ocf,
            "capitalExpenditure": capex,
            "freeCashFlow": ocf - abs(capex) if capex < 0 else ocf - capex,
        }

        return {
            "quarterlyStatements": statements,
            "balanceSheet": balance_sheet,
            "cashFlow": cash_flow,
            "dataSource": "Massive.com (Polygon.io) SEC Financials API vX"
        }
    except Exception as e:
        print(f"Warning fetching Massive financials: {e}", file=sys.stderr)
        return None

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

    # Try Massive.com SEC Financials first
    massive_key = os.environ.get("MASSIVE_API_KEY")
    if massive_key:
        mf = fetch_massive_financials(ticker_symbol, massive_key)
        if mf:
            profile["quarterlyStatements"] = mf["quarterlyStatements"]
            profile["balanceSheet"] = mf["balanceSheet"]
            profile["cashFlow"] = mf["cashFlow"]
            profile["dataSource"] = mf["dataSource"]

    # Fallback to yfinance if Massive statements are missing
    if not profile.get("quarterlyStatements"):
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

    # Fallback for balance sheet
    if not profile.get("balanceSheet"):
        try:
            bs = ticker.quarterly_balance_sheet
            if bs is not None and not bs.empty:
                date = bs.columns[0]
                col = bs[date]
                
                cash = safe_float(col.get("Cash And Cash Equivalents")) or 0.0
                st_investments = safe_float(col.get("Other Short Term Investments")) or 0.0
                
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

    # Fallback for cash flow
    if not profile.get("cashFlow"):
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
