// Placeholder ad rail for desktop margins. Swap the placeholder div's
// children for an AdSense <ins class="adsbygoogle"> unit once a publisher
// ID and slot ID are available — the sizing/positioning here already
// matches a standard 160x600 skyscraper unit.
const AdRail = ({ side }) => (
  <div
    className={`hidden xl:flex fixed top-1/2 -translate-y-1/2 ${
      side === "left" ? "left-6" : "right-6"
    } w-[160px] h-[600px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 text-xs text-gray-400 z-0`}
  >
    Ad placeholder
  </div>
);

export default AdRail;
