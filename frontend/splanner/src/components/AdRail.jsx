import { useEffect } from "react";

const ADSENSE_CLIENT = "ca-pub-6043327387208916";

// Only one ad unit ("splanner banners") has been created so far — both
// rails point at it until a second slot is made for the right side.
const SLOT_IDS = {
  left: "9311210938",
  right: "9311210938",
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
      } w-[160px] h-[800px] z-0`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: "160px", height: "800px" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT_IDS[side]}
      />
    </div>
  );
};

export default AdRail;
