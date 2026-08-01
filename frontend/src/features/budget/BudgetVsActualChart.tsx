import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetItem } from "./types";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  notation: "compact",
  maximumFractionDigits: 1,
});

function truncateLabel(label: string, max = 28) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

interface ChartDatum {
  id: string;
  label: string;
  fullLabel: string;
  budgetedAmount: number;
  spentAmount: number;
  overBudget: boolean;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartDatum }[] }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const datum = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-md">
      <p className="mb-2 font-medium text-foreground">{datum.fullLabel}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: "var(--viz-budgeted)" }} />
            Presupuestado
          </span>
          <span className="font-semibold tabular-nums">{currency.format(datum.budgetedAmount)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ backgroundColor: datum.overBudget ? "var(--viz-critical)" : "var(--viz-spent)" }}
            />
            Gastado
          </span>
          <span className="font-semibold tabular-nums">{currency.format(datum.spentAmount)}</span>
        </div>
      </div>
      {datum.overBudget && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: "var(--viz-critical)" }}>
          ⚠ Sobre presupuesto
        </p>
      )}
    </div>
  );
}

export function BudgetVsActualChart({ items }: { items: BudgetItem[] }) {
  const data: ChartDatum[] = items.map((item) => ({
    id: item.id,
    label: truncateLabel(item.description),
    fullLabel: item.description,
    budgetedAmount: item.budgetedAmount,
    spentAmount: item.spentAmount,
    overBudget: item.spentAmount > item.budgetedAmount,
  }));

  const height = Math.max(data.length * 64 + 40, 160);
  const hasOverBudget = data.some((d) => d.overBudget);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" barGap={2} barCategoryGap="30%" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} vertical stroke="var(--viz-gridline)" />
          <XAxis
            type="number"
            tickFormatter={(value: number) => compactCurrency.format(value)}
            tick={{ fill: "var(--viz-axis)", fontSize: 12 }}
            axisLine={{ stroke: "var(--viz-gridline)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tick={{ fill: "var(--viz-axis)", fontSize: 12 }}
            axisLine={{ stroke: "var(--viz-gridline)" }}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--viz-cursor)" }} />
          <Legend
            formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            iconType="plainline"
          />
          <Bar dataKey="budgetedAmount" name="Presupuestado" fill="var(--viz-budgeted)" radius={[0, 4, 4, 0]} maxBarSize={24} />
          <Bar dataKey="spentAmount" name="Gastado" fill="var(--viz-spent)" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.overBudget ? "var(--viz-critical)" : "var(--viz-spent)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasOverBudget && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "var(--viz-critical)" }} />
          ⚠ Ítems sobre presupuesto
        </p>
      )}
    </div>
  );
}
