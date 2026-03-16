import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReactQueryProvider } from "../lib/react-query/provider";

describe("ReactQueryProvider", () => {
  it("renders children in jsdom", () => {
    render(
      <ReactQueryProvider>
        <div>provider-child</div>
      </ReactQueryProvider>
    );

    expect(screen.getByText("provider-child")).toBeInTheDocument();
  });
});
