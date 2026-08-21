export interface ProductBasketGroup {
  title: string;
  items: string[];
}

export interface ProductBasketSection {
  title: string;
  groups: ProductBasketGroup[];
}

export interface ProductBasketData {
  description: string;
  sections: ProductBasketSection[];
  title: string;
}

const serviceDefinitions: Record<string, string> = {
  "MTF / T+5 leverage":
    "A funding-based trading facility that gives eligible investors more flexibility in meeting funding requirements for approved equity transactions, subject to margin, interest, settlement, and broker-specific terms.",
  "Attractive pricing":
    "A brokerage or transaction-pricing structure designed to offer transparent and competitive charges based on the selected plan or trading activity.",
  "API trading":
    "A facility that lets approved users or applications connect programmatically with a trading platform for market data, order placement, portfolio information, and other supported functions.",
  "Cash, F&O":
    "Cash trading involves buying and selling shares in the equity market. Futures and Options are derivatives linked to an underlying security or index and may involve leverage and higher risk.",
  "Infinity SubFee":
    "A subscription-based pricing or service plan under which users pay a defined fee to access specified trading, investment, research, or platform features, subject to commercial terms.",
  "IPOs & FPOs":
    "IPOs allow investors to participate in a company’s first public offering of securities, while FPOs are subsequent public offerings by companies that are already listed.",
  "Primary market NCDs":
    "Newly issued non-convertible debentures offered directly by companies to investors for a specified tenure and interest structure.",
  "Listed bonds (secondary market)":
    "Debt securities listed on a recognised stock exchange that may provide periodic interest and can potentially be bought or sold in the secondary market.",
  "Private placement NCDs":
    "Non-convertible debentures issued to a selected group of eligible investors rather than through a public offering.",
  "Corporate FDs":
    "Fixed deposits offered by eligible companies for a defined tenure and interest rate, carrying the credit risk of the issuing company.",
  "RBI bonds":
    "Government-backed or notified savings bonds issued under applicable government or RBI schemes, with defined interest, maturity, and eligibility conditions.",
  "54EC bonds":
    "Specified bonds that eligible investors may use to claim tax benefits on certain long-term capital gains, subject to prevailing tax laws and investment conditions.",
  "InvITs & REITs":
    "InvITs provide investment exposure to infrastructure assets, while REITs provide exposure to income-generating real-estate assets through professionally managed investment vehicles.",
  "Private equity: early, growth and late-stage funds":
    "Alternative Investment Funds that invest in emerging, expanding, or mature private businesses. Each stage has different growth potential, liquidity, and business risk.",
  "Listed: long-only and long-short funds":
    "Long-only strategies primarily buy securities expected to appreciate. Long-short strategies combine long positions with short or hedging positions in securities expected to underperform.",
  "Credit: performing credit, special situations and venture debt":
    "Credit investments can include borrowers meeting repayment obligations, event-driven opportunities such as restructurings, and debt financing for venture-backed or rapidly growing companies.",
  "Commercial real estate and infrastructure":
    "Credit financing for commercial property assets or developments, and for infrastructure businesses or projects such as energy, transport, logistics, and utilities.",
  "PMS: equity, debt and multi-asset":
    "A professionally managed portfolio focused on equity shares, fixed-income instruments, or a mix of permitted asset classes according to the investor’s mandate.",
  "Mutual funds & ETFs":
    "Mutual Funds pool investor money into professionally managed portfolios, while Exchange-Traded Funds are pooled funds whose units trade on stock exchanges.",
  "Structured products":
    "Investment instruments whose returns are linked to predefined conditions or the performance of underlying assets such as equities, indices, or interest rates.",
  "SIF (Specialised Investment Fund)":
    "A specialised regulated investment structure designed to offer more flexible investment strategies than conventional mutual funds, subject to applicable eligibility and investment rules.",
  "Global investing":
    "Investing in eligible securities, funds, or other financial products outside India to gain international diversification and exposure to global businesses and economies.",
  "Term plan":
    "A life-insurance product that provides financial protection for a specified period and pays the applicable death benefit if the insured person dies while the policy is in force, subject to policy terms.",
  "Regular income plan":
    "An insurance plan designed to provide periodic payouts according to the policy schedule while offering the insurance benefits specified in the contract.",
  "Pension plan":
    "A retirement-oriented insurance product designed to help individuals accumulate savings or generate income during retirement.",
  "ULIP plan":
    "A Unit Linked Insurance Plan combines life-insurance protection with market-linked investment, where part of the premium is invested in selected funds.",
  "Health insurance":
    "Insurance that provides financial protection for eligible medical and healthcare expenses, subject to policy limits, waiting periods, exclusions, and other terms.",
  "Vehicle insurance":
    "Insurance that provides financial protection for eligible vehicles against specified risks such as accidents, theft, damage, and third-party liabilities, depending on the policy selected.",
  Credit:
    "A financing solution that may help eligible individuals or businesses access funds, subject to lender eligibility, repayment capacity, pricing, and risk conditions.",
  "ESOP funding":
    "A financing solution that helps eligible employees fund the cost of exercising or acquiring shares granted under an Employee Stock Option Plan, subject to lender eligibility, repayment, and risk conditions.",
};

export function serviceDefinitionFor(service: string) {
  return (
    serviceDefinitions[service] ??
    "Information about this service will be confirmed by the participating provider before you proceed."
  );
}

export function productBasketForCategory(
  slug: string,
): ProductBasketData | null {
  if (slug !== "finance") return null;

  return {
    title: "Finance product basket",
    description:
      "Open an area to understand the finance, insurance and credit services listed by approved providers, then contact a provider directly.",
    sections: [
      {
        title: "Equity",
        groups: [
          {
            title: "Equity services",
            items: [
              "MTF / T+5 leverage",
              "Attractive pricing",
              "API trading",
              "Cash, F&O",
              "Infinity SubFee",
              "IPOs & FPOs",
            ],
          },
        ],
      },
      {
        title: "Fixed income",
        groups: [
          {
            title: "Fixed-income products",
            items: [
              "Primary market NCDs",
              "Listed bonds (secondary market)",
              "Private placement NCDs",
              "Corporate FDs",
              "RBI bonds",
              "54EC bonds",
              "InvITs & REITs",
            ],
          },
        ],
      },
      {
        title: "Managed portfolio",
        groups: [
          {
            title: "AIF (Alternative Investment Fund)",
            items: [
              "Private equity: early, growth and late-stage funds",
              "Listed: long-only and long-short funds",
              "Credit: performing credit, special situations and venture debt",
              "Commercial real estate and infrastructure",
            ],
          },
          {
            title: "Portfolio and managed investments",
            items: [
              "PMS: equity, debt and multi-asset",
              "Mutual funds & ETFs",
              "Structured products",
              "SIF (Specialised Investment Fund)",
              "Global investing",
            ],
          },
        ],
      },
      {
        title: "Insurance",
        groups: [
          {
            title: "Life insurance",
            items: [
              "Term plan",
              "Regular income plan",
              "Pension plan",
              "ULIP plan",
            ],
          },
          {
            title: "General insurance",
            items: ["Health insurance", "Vehicle insurance"],
          },
        ],
      },
      {
        title: "Special opportunities & credit",
        groups: [
          {
            title: "Specialist solutions",
            items: ["Credit", "ESOP funding"],
          },
        ],
      },
    ],
  };
}
