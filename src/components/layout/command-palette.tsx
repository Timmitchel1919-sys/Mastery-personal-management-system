"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { LogOut, Monitor, Moon, Search, Sparkles, Sun } from "lucide-react";
import { ALL_NAV_ITEMS } from "@/config/navigation";
import { COMMAND_CATALOG } from "@/features/command";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import { useShell } from "./shell-context";

const ITEM_CLASS =
  "flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none " +
  "data-[selected=true]:bg-surface data-[disabled=true]:opacity-50";

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useShell();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { signOut } = useAuth();

  const run = (action: () => void) => {
    setCommandOpen(false);
    action();
  };

  return (
    <Command.Dialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      label="Command menu"
      className="flex max-h-[70vh] flex-col overflow-hidden [&_[cmdk-group-heading]]:text-subtle [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
      contentClassName="border-border bg-surface-raised fixed top-[14vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border shadow-lg"
      overlayClassName="bg-overlay fixed inset-0 z-50"
    >
      <div className="border-border flex items-center gap-2 border-b px-3">
        <Search className="text-muted size-4 shrink-0" aria-hidden="true" />
        <Command.Input
          placeholder="Search or jump to…"
          className="placeholder:text-subtle h-11 w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Command.List className="overflow-y-auto p-1.5">
        <Command.Empty className="text-muted px-3 py-6 text-center text-sm">
          No results.
        </Command.Empty>

        <Command.Group heading="Ask MASTERY">
          {COMMAND_CATALOG.map((command) => (
            <Command.Item
              key={command.id}
              value={`${command.label} ${command.phrases.join(" ")} ${command.description}`}
              onSelect={() => run(() => router.push(command.href))}
              className={ITEM_CLASS}
            >
              <Sparkles className="text-muted size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{command.label}</span>
              <span className="text-subtle hidden text-xs sm:inline">{command.description}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Navigate">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Command.Item
                key={item.href}
                value={`${item.label} ${item.href} ${item.description ?? ""}`}
                onSelect={() => run(() => router.push(item.href))}
                className={ITEM_CLASS}
              >
                <Icon className="text-muted size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.description ? (
                  <span className="text-subtle hidden text-xs sm:inline">{item.description}</span>
                ) : null}
              </Command.Item>
            );
          })}
        </Command.Group>

        <Command.Group heading="Actions">
          <Command.Item
            value="theme light mode"
            onSelect={() => run(() => setTheme("light"))}
            className={ITEM_CLASS}
          >
            <Sun className="text-muted size-4" aria-hidden="true" />
            Light theme
          </Command.Item>
          <Command.Item
            value="theme dark mode"
            onSelect={() => run(() => setTheme("dark"))}
            className={ITEM_CLASS}
          >
            <Moon className="text-muted size-4" aria-hidden="true" />
            Dark theme
          </Command.Item>
          <Command.Item
            value="theme system mode"
            onSelect={() => run(() => setTheme("system"))}
            className={ITEM_CLASS}
          >
            <Monitor className="text-muted size-4" aria-hidden="true" />
            System theme
          </Command.Item>
          <Command.Item
            value="sign out log out"
            onSelect={() =>
              run(() => {
                void signOut();
                router.replace("/login");
              })
            }
            className={ITEM_CLASS}
          >
            <LogOut className="text-muted size-4" aria-hidden="true" />
            Sign out
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
