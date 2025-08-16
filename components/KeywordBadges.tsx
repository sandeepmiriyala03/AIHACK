// components/KeywordBadges.tsx

interface KeywordBadgesProps {
  keywords: string[];
}

export default function KeywordBadges({ keywords }: KeywordBadgesProps) {
  return (
    <div className="badgesContainer">
      {keywords.map((kw, idx) => (
        <span
          key={`${kw}-${idx}`}
          className="badge"
          title={kw}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}
