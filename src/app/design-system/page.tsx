"use client";

import { useState } from "react";
import { Bell, Plus, Settings } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FormField,
  IconButton,
  Input,
  Kbd,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";

const COLOR_TOKENS = [
  "background",
  "surface",
  "surface-raised",
  "foreground",
  "muted",
  "border",
  "primary",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-subtle">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const [email, setEmail] = useState("");
  const emailError = email.length > 0 && !email.includes("@") ? "Enter a valid email." : undefined;

  return (
    <PageContainer size="wide" className="space-y-10">
      <PageHeader
        title="Mastery Design System"
        description="Tokens and reusable components. Toggle the theme to check both palettes."
        actions={<ThemeToggle />}
      />

      <Section title="Color tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="space-y-1.5">
              <div
                className="border-border h-14 w-full rounded-md border"
                style={{ backgroundColor: `var(--color-${token})` }}
              />
              <p className="text-muted text-xs">{token}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Plus />
            With icon
          </Button>
          <IconButton aria-label="Settings" icon={<Settings />} />
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-md gap-4">
          <FormField label="Email" description="Used for account recovery." error={emailError}>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField label="Notes" optional>
            <Textarea placeholder="Anything worth remembering…" />
          </FormField>
          <FormField label="Focus area" htmlFor="ds-pillar">
            <Select>
              <SelectTrigger id="ds-pillar">
                <SelectValue placeholder="Choose a pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spiritual">Spiritual</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="societal">Societal</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> Remember this device
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked /> Weekly summary emails
          </label>
          <RadioGroup defaultValue="week" className="text-sm">
            <label className="flex items-center gap-2">
              <RadioGroupItem value="day" /> Daily review
            </label>
            <label className="flex items-center gap-2">
              <RadioGroupItem value="week" /> Weekly review
            </label>
          </RadioGroup>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s focus</CardTitle>
              <CardDescription>Three priorities keep momentum.</CardDescription>
            </CardHeader>
            <CardContent className="text-muted text-sm">No priorities set yet.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Loading example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Alerts">
        <div className="grid gap-3">
          <Alert variant="info">
            <Bell />
            <div>
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>Your weekly summary is ready to review.</AlertDescription>
            </div>
          </Alert>
          <Alert variant="danger">
            <Bell />
            <div>
              <AlertTitle>Action needed</AlertTitle>
              <AlertDescription>Two tasks are overdue.</AlertDescription>
            </div>
          </Alert>
        </div>
      </Section>

      <Section title="Overlays & navigation">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archive this goal?</DialogTitle>
                <DialogDescription>You can restore it later from the archive.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="danger">Archive</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              Press {""}
              <Kbd>?</Kbd> for shortcuts
            </TooltipContent>
          </Tooltip>

          <Avatar>
            <AvatarFallback>MB</AvatarFallback>
          </Avatar>
        </div>

        <Tabs defaultValue="plan" className="max-w-md">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="focus">Focus</TabsTrigger>
            <TabsTrigger value="act">Act</TabsTrigger>
          </TabsList>
          <TabsContent value="plan" className="text-muted text-sm">
            Define direction, plans, and goals.
          </TabsContent>
          <TabsContent value="focus" className="text-muted text-sm">
            Allocate time, attention, and energy.
          </TabsContent>
          <TabsContent value="act" className="text-muted text-sm">
            Execute tasks, routines, and habits.
          </TabsContent>
        </Tabs>

        <Separator />
      </Section>
    </PageContainer>
  );
}
