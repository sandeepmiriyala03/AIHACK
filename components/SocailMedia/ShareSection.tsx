"use client";

export default function ShareSection() {
  const shareData = {
    title: "AksharaTantra – Multilingual OCR & Vedic Engine",
    text: "Try AksharaTantra — Fast, private OCR for Telugu, Sanskrit & 34+ languages.",
    url: typeof window !== "undefined" ? window.location.href : "https://aksharatantra.vercel.app",
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled", err);
      }
    } else {
      alert("Share not supported on this device. Copy link manually!");
    }
  };

  return (
    <div className="mt-16 text-center">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-300">
        Share with Friends 🙌
      </h3>

      <div className="flex items-center justify-center gap-4">

        {/* Native share button */}
        <button
          onClick={handleShare}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition"
        >
          Share Now
        </button>

        {/* Social Links */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            shareData.text + " " + shareData.url
          )}`}
          target="_blank"
          className="text-green-600 text-3xl hover:scale-110 transition"
        >
          🟢
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareData.url
          )}`}
          target="_blank"
          className="text-blue-700 text-3xl hover:scale-110 transition"
        >
          📘
        </a>

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareData.text
          )}&url=${encodeURIComponent(shareData.url)}`}
          target="_blank"
          className="text-sky-500 text-3xl hover:scale-110 transition"
        >
          🐦
        </a>

      </div>
    </div>
  );
}
