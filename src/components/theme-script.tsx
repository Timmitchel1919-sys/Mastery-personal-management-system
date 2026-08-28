import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Runs synchronously before first paint to set `data-theme` on <html>, preventing a
 * flash of the wrong theme. Kept tiny and dependency-free on purpose.
 */
const source = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var s=localStorage.getItem(k);
var t=(s==="light"||s==="dark"||s==="system")?s:"system";
var r=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;
var e=document.documentElement;
e.dataset.theme=r;
e.style.colorScheme=r;
}catch(_){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}
