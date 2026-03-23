import * as React from "react";

type FoxWatermarkProps = Omit<React.SVGProps<SVGSVGElement>, "color"> & {
  size?: number | string;
  strokeColor?: string;
  nodeFill?: string;
  strokeWidth?: number | string;
  nodeRadius?: number;
};

export const Fox = React.forwardRef<SVGSVGElement, FoxWatermarkProps>(
  (
    {
      size = 256,
      strokeColor = "currentColor",
      nodeFill = "var(--sidebar-accent)",
      strokeWidth = 7,
      nodeRadius = 15,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="-16 -16 977.10736 919.10468"
        fill="none"
        className={className}
        {...props}
      >
        {/* Lines */}
        <g stroke={strokeColor} strokeWidth={strokeWidth}>
          {/* Outer Lines */}
          <line x1="42.5" y1="0" x2="402.5" y2="239.75" />
          <line x1="402.5" y1="239.75" x2="542.5" y2="239.75" />
          <line x1="542.5" y1="239.75" x2="902.5" y2="0" />
          <line x1="902.5" y1="0" x2="875" y2="450" />
          <line x1="875" y1="450" x2="945" y2="600" />
          <line x1="945" y1="600" x2="472.5" y2="885" />
          <line x1="472.5" y1="885" x2="0" y2="600" />
          <line x1="0" y1="600" x2="70" y2="450" />
          <line x1="70" y1="450" x2="42.5" y2="0" />

          {/* Inner Lines */}
          <line x1="70" y1="450" x2="402.5" y2="239.75" />
          <line x1="220" y1="118.5" x2="472.5" y2="885" />
          <line x1="472.5" y1="885" x2="725" y2="118.5" />
          <line x1="542.5" y1="239.75" x2="875" y2="450" />
          <line x1="70" y1="450" x2="220" y2="118.5" />
          <line x1="875" y1="450" x2="725" y2="118.5" />
          <line x1="0" y1="600" x2="433" y2="763" />
          <line x1="512" y1="763" x2="945" y2="600" />
          <line x1="70" y1="450" x2="433" y2="763" />
          <line x1="512" y1="763" x2="875" y2="450" />
          <line x1="433" y1="763" x2="512" y2="763" />
        </g>

        {/* Nodes */}
        <g fill={nodeFill} stroke="none">
          <circle cx="42.5" cy="0" r={nodeRadius} />
          <circle cx="902.5" cy="0" r={nodeRadius} />
          <circle cx="472.5" cy="885" r={nodeRadius} />
          <circle cx="402.5" cy="239.75" r={nodeRadius} />
          <circle cx="542.5" cy="239.75" r={nodeRadius} />
          <circle cx="945" cy="600" r={nodeRadius} />
          <circle cx="0" cy="600" r={nodeRadius} />
          <circle cx="875" cy="450" r={nodeRadius} />
          <circle cx="70" cy="450" r={nodeRadius} />
          <circle cx="220" cy="118.5" r={nodeRadius} />
          <circle cx="725" cy="118.5" r={nodeRadius} />
          <circle cx="433" cy="763" r={nodeRadius} />
          <circle cx="512" cy="763" r={nodeRadius} />
        </g>
      </svg>
    );
  },
);

Fox.displayName = "Fox";
