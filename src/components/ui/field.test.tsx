import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("links the label, description and error to the control", () => {
    render(
      <Field label="Nomor WhatsApp" description="Format 08xx" error="Wajib diisi" required>
        {(control) => <Input {...control} />}
      </Field>,
    );

    const input = screen.getByLabelText(/Nomor WhatsApp/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAccessibleDescription("Format 08xx Wajib diisi");
    expect(screen.getByRole("alert")).toHaveTextContent("Wajib diisi");
  });

  it("does not mark a valid optional field", () => {
    render(<Field label="Email">{(control) => <Input {...control} />}</Field>);

    const input = screen.getByLabelText("Email");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });
});
