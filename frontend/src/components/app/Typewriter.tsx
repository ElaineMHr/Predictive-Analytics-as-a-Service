import { useEffect, useState } from "react";

type Props = {
  text: string;
  speed?: number;
  reverse?: boolean;
  onDone?: () => void;
  keepCursor?: boolean;
};

export function TypewriterText({
  text,
  speed = 80,
  reverse = false,
  onDone,
  keepCursor = false,
}: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    let i = reverse ? text.length : 0;
    const id = setInterval(() => {
      if (!reverse) {
        // typing: 0 -> text.length
        i++;
        setValue(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(id);
          onDone?.();
        }
      } else {
        // deleting: text.length -> 0
        i--;
        setValue(text.slice(0, i));
        if (i <= 0) {
          clearInterval(id);
          onDone?.();
        }
      }
    }, speed);

    return () => clearInterval(id);
  }, [text, speed, reverse, onDone]);

  const isAnimating = reverse ? value.length > 0 : value.length < text.length;

  return (
    <span className="whitespace-pre">
      {value}
      {(keepCursor || isAnimating) && (
        <span className="ml-0.5 animate-pulse">▍</span>
      )}
    </span>
  );
}
