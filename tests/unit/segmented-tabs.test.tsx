// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";

describe("SegmentedTabs Modular Component", () => {
  const options = [
    { id: "gainers", label: "Gainers", activeClassName: "text-emerald-400" },
    { id: "losers", label: "Losers", activeClassName: "text-rose-400" },
    { id: "active", label: "Active", activeClassName: "text-cyan-400" },
  ];

  it("renders all tab options with appropriate role and aria-selected state", () => {
    const handleChange = vi.fn();
    render(
      <SegmentedTabs
        options={options}
        value="gainers"
        onChange={handleChange}
      />
    );

    const gainersTab = screen.getByRole("tab", { name: "Gainers" });
    const losersTab = screen.getByRole("tab", { name: "Losers" });
    const activeTab = screen.getByRole("tab", { name: "Active" });

    expect(gainersTab).toBeDefined();
    expect(losersTab).toBeDefined();
    expect(activeTab).toBeDefined();

    expect(gainersTab.getAttribute("aria-selected")).toBe("true");
    expect(losersTab.getAttribute("aria-selected")).toBe("false");
    expect(activeTab.getAttribute("aria-selected")).toBe("false");
  });

  it("enforces persistent border and transition-colors to eliminate border flash on deactivation", () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <SegmentedTabs
        options={options}
        value="gainers"
        onChange={handleChange}
      />
    );

    const gainersTab = screen.getByRole("tab", { name: "Gainers" });
    const losersTab = screen.getByRole("tab", { name: "Losers" });

    // Active tab has border-border and transition-colors
    expect(gainersTab.className).toContain("border");
    expect(gainersTab.className).toContain("border-border");
    expect(gainersTab.className).toContain("transition-colors");
    expect(gainersTab.className).not.toContain("transition-all");

    // Inactive tab retains border base class with border-transparent
    expect(losersTab.className).toContain("border");
    expect(losersTab.className).toContain("border-transparent");
    expect(losersTab.className).toContain("transition-colors");
    expect(losersTab.className).not.toContain("transition-all");

    // Switch selection to losers
    rerender(
      <SegmentedTabs options={options} value="losers" onChange={handleChange} />
    );

    // Previously active tab smoothly transitions to border-transparent without losing border base class
    expect(gainersTab.className).toContain("border");
    expect(gainersTab.className).toContain("border-transparent");
    expect(losersTab.className).toContain("border-border");
  });

  it("triggers onChange callback when clicking an inactive tab", () => {
    const handleChange = vi.fn();
    render(
      <SegmentedTabs
        options={options}
        value="gainers"
        onChange={handleChange}
      />
    );

    const losersTab = screen.getByRole("tab", { name: "Losers" });
    fireEvent.click(losersTab);

    expect(handleChange).toHaveBeenCalledWith("losers");
  });
});
