export function ThemeVideoBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden dark:block">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
        src="/mastery%20video.mp4"
      />
      <div className="bg-background/70 absolute inset-0" />
    </div>
  );
}
