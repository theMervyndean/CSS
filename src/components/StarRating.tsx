import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/utils";

export function StarRating({ rating = 0, onRatingChange, maxStars = 5, disabled = false, testid }: any) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex gap-1" data-testid={testid}>
      {Array.from({ length: maxStars }).map((_, idx) => {
        const starValue = idx + 1;
        const isFilled = starValue <= displayRating;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            onMouseLeave={() => !disabled && setHoverRating(null)}
            onClick={() => !disabled && onRatingChange && onRatingChange(starValue)}
            className={cn(
              "p-0.5 rounded transition-transform duration-100 hover:scale-110 disabled:scale-100 outline-none select-none",
              disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            )}
            style={{ color: isFilled ? "#FFB800" : "#cbd5e1" }}
          >
            <Star className="w-4 h-4 fill-current transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
export default StarRating;
