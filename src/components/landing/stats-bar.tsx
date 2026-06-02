"use client";

import { useEffect, useState } from "react";

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!target) return;
    let frame: number;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * target));
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return count;
}

interface StatsBarProps {
  productCount: number;
  userCount: number;
  categoryCount: number;
}

export function StatsBar({ productCount, userCount, categoryCount }: StatsBarProps) {
  const products   = useCountUp(productCount);
  const makers     = useCountUp(userCount);
  const categories = useCountUp(categoryCount);

  return (
    <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
      <div>
        <div className="text-2xl font-bold">{products}+</div>
        <div className="text-xs text-muted-foreground mt-0.5">Products</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{makers}+</div>
        <div className="text-xs text-muted-foreground mt-0.5">Makers</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{categories}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Categories</div>
      </div>
    </div>
  );
}