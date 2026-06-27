import { useEffect } from "react";

const ADSENSE_CLIENT = "ca-pub-6043327387208916";

// TODO: replace with real ad unit slot IDs from AdSense (Ads → By ad unit →
// Display ads, sized 160x600) — these placeholders won't serve real ads.
const SLOT_IDS = {
  left: "0000000000",
  right: "0000000001",
};

const AdRail = ({ side }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense script may be blocked (ad blocker) or not loaded yet
    }
  }, []);

  return (
    <div
      className={`hidden xl:block fixed top-1/2 -translate-y-1/2 ${
        side === "left" ? "left-6" : "right-6"
      } w-[160px] h-[600px] z-0`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "160px", height: "600px" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT_IDS[side]}
      />
    </div>
  );
};

export default AdRail;
