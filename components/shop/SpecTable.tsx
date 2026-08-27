import type { ProductSpec } from "@/lib/types/product";

export function SpecTable({ specs }: { specs: ProductSpec[] }) {
  const groups = new Map<string, ProductSpec[]>();
  for (const spec of specs) {
    const list = groups.get(spec.group) ?? [];
    list.push(spec);
    groups.set(spec.group, list);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-900">
            <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
            {group}
          </h3>
          <table className="w-full overflow-hidden rounded-card border border-line text-sm">
            <tbody>
              {items.map((spec, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-bg" : "bg-surface"}>
                  <th scope="row" className="w-1/3 px-4 py-3 text-start font-medium text-ink-500">
                    {spec.key}
                  </th>
                  <td className="px-4 py-3 text-ink-900">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
