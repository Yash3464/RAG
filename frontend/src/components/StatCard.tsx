type Props = {
  title: string;
  value: number;
};

export default function StatCard({
  title,
  value,
}: Props) {
  return (
    <div
      className="
      bg-[#12184A]
      rounded-2xl
      p-6
      border
      border-white/10
      "
    >
      <p className="text-white/60">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>
    </div>
  );
}