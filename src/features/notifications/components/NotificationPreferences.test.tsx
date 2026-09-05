import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotificationPreferencesPanel } from "./NotificationPreferences";

describe("NotificationPreferencesPanel", () => {
  it("saves the current draft, including a toggled-off category", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<NotificationPreferencesPanel prefs={null} saving={false} onSave={onSave} />);

    // Turn off "Habit reminders"
    const habitRow = screen.getByText("Habit reminders").closest("label")!;
    await userEvent.click(habitRow.querySelector("button")!);

    await userEvent.click(screen.getByRole("button", { name: /save preferences/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.objectContaining({ habits: false, tasks: true }),
        pushEnabled: false,
        milestoneLeadDays: 7,
      }),
    );
    expect(await screen.findByText("Saved.")).toBeInTheDocument();
  });

  it("notes that push is not available yet", () => {
    render(<NotificationPreferencesPanel prefs={null} saving={false} onSave={vi.fn()} />);
    expect(screen.getByText(/Not available in this build yet/i)).toBeInTheDocument();
  });
});
