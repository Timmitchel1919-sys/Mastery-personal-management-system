import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toAuthError } from "../auth-errors";

const replace = vi.fn();
const signIn = vi.fn();
const signInWithGoogle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ signIn, signInWithGoogle }),
}));

import { SignInForm } from "./SignInForm";

beforeEach(() => {
  replace.mockReset();
  signIn.mockReset();
  signInWithGoogle.mockReset();
});

describe("SignInForm", () => {
  it("renders the fields and sign-in options", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("shows validation errors and does not submit when empty", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("submits valid credentials and redirects", async () => {
    signIn.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "sup3rsecret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "sup3rsecret",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("surfaces a normalized auth error", async () => {
    signIn.mockRejectedValueOnce(toAuthError({ code: "auth/invalid-credential" }));
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("The email or password is incorrect.")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
