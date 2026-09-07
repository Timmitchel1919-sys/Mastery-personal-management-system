/**
 * Ambient looping video behind the module panel — dark theme only. Positioned
 * `absolute` so it fills its container (the `<main>` panel) and never the sidebar.
 */
export function ThemeVideoBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden dark:block"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
        src="/mastery%20video.mp4"
      />
      <div className="bg-background/72 absolute inset-0" />
    </div>
  );
}
