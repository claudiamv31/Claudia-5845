import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { simulatedRaces, snailRoster, snailWinTotals } from '../../data/raceData';

const snailWins = snailRoster.map((snail) => ({
  name: snail.name,
  wins:
    snailWinTotals.find((total) => total.snailId === snail.id)?.wins ?? 0,
}));

const chartDescription = snailWins
  .map((snail) => `${snail.name} ${snail.wins}`)
  .join(', ');

export function SnailWinsChart() {
  return (
    <article className="chart-card">
      <div className="chart-card-heading">
        <div>
          <p className="dashboard-card-label">Race standings</p>
          <h3>Snail victories</h3>
        </div>
        <span>{simulatedRaces.length} races</span>
      </div>

      <div
        className="bar-chart"
        role="img"
        aria-label={`Snail victories: ${chartDescription}`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={snailWins}
            margin={{ top: 24, right: 8, bottom: 4, left: -20 }}
          >
            <CartesianGrid vertical={false} stroke="#dfe8e1" />
            <XAxis
              dataKey="name"
              interval={0}
              height={36}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#60736d', fontSize: 10 }}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, 3]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#60736d', fontSize: 12 }}
            />
            <Tooltip cursor={{ fill: '#eef4ef' }} />
            <Bar dataKey="wins" fill="#1e6f5c" radius={[8, 8, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
