import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";
import type { ExplainabilitySummaryRegression } from "./Explainability";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  value: { label: "Influence", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const TICK_COUNT = 5;
const TOP_K = 30;
const CHART_HEIGHT = 420;
const Y_AXIS_WIDTH = 280;

type Props = { summary: ExplainabilitySummaryRegression };

export default function ExplainabilityRegressionTopDrivers({ summary }: Props) {
  const [grouped, setGrouped] = useState(true);

  const meanAbsParent = summary.global.mean_abs_parent ?? [];
  const meanAbsFeature = summary.global.mean_abs ?? [];

  const parentDataAll = meanAbsParent.map((r) => ({
    label: r.parent,
    value: r.value,
  }));

  // Join meanAbs with feature names
  const featureDataAll = meanAbsFeature.map((r) => {
    const f = summary.features.find((x) => x.fid === r.fid);
    return { label: f?.name ?? `feature ${r.fid}`, value: r.value };
  });

  const barData = grouped ? parentDataAll : featureDataAll;

  const allValues = [...parentDataAll, ...featureDataAll].map((d) => d.value);
  const dataMax = Math.max(0, ...allValues);
  // const parentValues = [...parentDataAll].map((d) => d.value);
  // const featureValues = [...featureDataAll].map((d) => d.value);
  // const dataMax = grouped
  //   ? Math.max(0, ...parentValues)
  //   : Math.max(0, ...featureValues);

  function stepCeil(v: number) {
    // Guard
    if (v <= 0) return 1;
    // Calculate order of magnitude
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    // Calculate step per tick
    const n = v / p;
    const step =
      n <= 1
        ? 1
        : n <= 1.5
          ? 1.5
          : n <= 2
            ? 2
            : n <= 2.5
              ? 2.5
              : n <= 5
                ? 5
                : 10;
    return step * p;
  }

  const fixedMax = stepCeil(dataMax);

  const fixedTicks: number[] = [];

  function round(value: number, decimals: number = 2) {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
  }

  for (let i = 0; i < TICK_COUNT; i++) {
    const value = (fixedMax * i) / (TICK_COUNT - 1);
    fixedTicks.push(round(value, 6));
  }

  const parentCount = Math.min(parentDataAll.length, TOP_K);
  const featureCount = Math.min(featureDataAll.length, TOP_K);

  function barSizeFromCount(count: number): number {
    const MIN_COUNT = 5;
    const MAX_COUNT = 30;
    const MIN_SIZE = 6;
    const MAX_SIZE = 26;
    const STEP = 2;

    if (count <= MIN_COUNT) return MAX_SIZE;
    if (count >= MAX_COUNT) return MIN_SIZE;

    const t = (count - MIN_COUNT) / (MAX_COUNT - MIN_COUNT);
    const size = MAX_SIZE - t * (MAX_SIZE - MIN_SIZE);

    return Math.round(size / STEP) * STEP;
  }

  const barSize = grouped
    ? barSizeFromCount(parentCount)
    : barSizeFromCount(featureCount);

  const animationKey = `${grouped ? "grouped" : "features"}`;

  return (
    <div className="grid gap-4 mt-[60px]">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>
              {grouped
                ? `Top ${parentCount} column influences`
                : `Top ${featureCount} feature influences`}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Higher values indicate a stronger influence on the model output.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              checked={grouped}
              onCheckedChange={(v) => setGrouped(Boolean(v))}
            />
            <Label className="text-sm text-muted-foreground">
              Group by column
            </Label>
          </div>
        </CardHeader>

        <CardContent className="w-full max-w-full min-w-0">
          <ChartContainer
            config={chartConfig}
            className="w-full max-w-full min-w-0"
            style={{ height: CHART_HEIGHT, width: "100%" }}
          >
            <BarChart
              data={barData}
              key={animationKey}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} />

              <XAxis
                type="number"
                domain={[0, fixedMax]}
                ticks={fixedTicks}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                type="category"
                dataKey="label"
                width={Y_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                interval={0}
              />

              <ChartTooltip content={<ChartTooltipContent />} />

              <Bar
                dataKey="value"
                barSize={barSize}
                radius={6}
                fill="var(--color-value)"
                isAnimationActive={true}
                animationDuration={350}
                animationEasing="ease-in-out"
              />
            </BarChart>
          </ChartContainer>

          <div className="mt-2 text-xs text-muted-foreground">
            X: average absolute influence
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
