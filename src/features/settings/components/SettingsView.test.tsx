import type { ReactElement } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/intl";
import { localeStore } from "@/i18n/locale-store";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Locale } from "@/i18n/locales";

const render = (ui: ReactElement, opts?: { locale?: Locale }) =>
  renderWithIntl(<ThemeProvider>{ui}</ThemeProvider>, opts);

vi.mock("next/navigation", () => ({ usePathname: () => "/settings" }));
vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    profile: { displayName: "Sam Rivera", email: "sam@example.com" },
    user: null,
  }),
}));

import { SettingsView } from "./SettingsView";

afterEach(() => {
  window.localStorage.clear();
  localeStore.setLocale("en");
});

describe("SettingsView", () => {
  it("renders the language and theme controls and the profile", () => {
    render(<SettingsView />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Install")).toBeInTheDocument();
    expect(screen.getByText("Sam Rivera")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
  });

  it("switches the app locale when a new language is picked", async () => {
    render(<SettingsView />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Nederlands" }));
    expect(localeStore.getSnapshot()).toBe("nl");
  });

  it("shows Dutch copy when rendered in the nl locale", () => {
    render(<SettingsView />, { locale: "nl" });
    expect(screen.getByRole("heading", { name: "Instellingen" })).toBeInTheDocument();
    expect(screen.getByText("Taal")).toBeInTheDocument();
    expect(screen.getByText("Thema")).toBeInTheDocument();
  });

  it("links to the notifications page for reminder preferences", () => {
    render(<SettingsView />);
    const link = screen.getByRole("link", { name: /open notifications/i });
    expect(link).toHaveAttribute("href", "/notifications");
    within(link).getByText(/open notifications/i);
  });
});
