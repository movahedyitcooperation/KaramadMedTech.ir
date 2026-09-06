import { ProductGridSkeleton } from "@/components/shop/ProductGridSkeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-20 lg:px-8">
      <div className="km-shimmer mt-3.5 mb-7 h-9 w-[min(360px,60%)] rounded-3 bg-ink/8" />
      <div className="grid items-start gap-9 lg:grid-cols-[268px_1fr]">
        <div className="km-shimmer hidden h-96 rounded-6 border border-ink/9 bg-surface lg:block" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
