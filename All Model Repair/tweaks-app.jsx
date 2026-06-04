// tweaks-app.jsx — mounts the Tweaks panel and applies values to the page.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#F2922E",
  "displayFont": "Saira"
}/*EDITMODE-END*/;

const ACCENTS = ["#F2922E", "#FE9222", "#E1382A", "#2f7de1", "#19a06b"];
const FONTS = ["Saira", "Barlow Condensed", "Oswald", "Archivo"];

// remove any stray hero-dim overlay left by older versions
(function cleanup(){
  document.querySelectorAll(".hero-extra-dim").forEach(function(e){ e.remove(); });
})();

// make sure alternate display fonts are available
(function ensureFonts() {
  if (document.getElementById("tweak-fonts")) return;
  const l = document.createElement("link");
  l.id = "tweak-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Archivo:wght@600;700;800&display=swap";
  document.head.appendChild(l);
})();

function AmrTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    // accent
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-hover", `color-mix(in srgb, ${t.accent} 78%, #ffffff)`);
    // pick legible ink (dark on light/bright accents, white on dark accents)
    const hex = String(t.accent).replace('#', '');
    const rr = parseInt(hex.slice(0,2),16)/255, gg = parseInt(hex.slice(2,4),16)/255, bb = parseInt(hex.slice(4,6),16)/255;
    const lin = (v)=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    const L = 0.2126*lin(rr)+0.7152*lin(gg)+0.0722*lin(bb);
    root.style.setProperty("--accent-ink", L > 0.4 ? "#1C1D20" : "#ffffff");
    // display font
    const stack = `"${t.displayFont}", "Saira", "Barlow Condensed", sans-serif`;
    root.style.setProperty("--font-display", stack);
  }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="Brand" />
      <TweakColor label="Accent color" value={t.accent} options={ACCENTS}
        onChange={(v) => setTweak("accent", v)} />
      <TweakSection label="Typography" />
      <TweakSelect label="Headline font" value={t.displayFont} options={FONTS}
        onChange={(v) => setTweak("displayFont", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<AmrTweaks />);
