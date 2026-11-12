import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders a native button with the primary style by default", () => {
    render(<Button>Daftar</Button>);
    const button = screen.getByRole("button", { name: "Daftar" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.className).toContain("bg-primary");
  });

  it("disables and marks busy while loading, keeping the accessible name", () => {
    render(<Button loading>Mengirim</Button>);
    const button = screen.getByRole("button", { name: "Mengirim" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("renders the child element when asChild is set", () => {
    render(
      <Button asChild variant="partner">
        <a href="https://wa.me/6281200000000">Gabung Mitra</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Gabung Mitra" });
    expect(link).toHaveAttribute("href", "https://wa.me/6281200000000");
    expect(link.className).toContain("bg-partner");
  });
});
