import RankBadge from '../RankBadge';

export default function RankBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <RankBadge rank={255} />
      <RankBadge rank={240} />
      <RankBadge rank={220} />
      <RankBadge rank={200} />
      <RankBadge rank={180} />
      <RankBadge rank={160} />
      <RankBadge rank={140} />
      <RankBadge rank={100} />
    </div>
  );
}
