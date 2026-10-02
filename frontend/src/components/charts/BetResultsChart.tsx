import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { bettingSummary } from '../../data/raceData';

const betResults = [
  { name: 'Won', value: bettingSummary.won, color: '#1e6f5c' },
  { name: 'Lost', value: bettingSummary.lost, color: '#d89a35' },
] as const;

const totalBets = bettingSummary.won + bettingSummary.lost;

export function BetResultsChart() {
  return (
    <article className="chart-card">
      <div className="chart-card-heading">
        <div>
          <p className="dashboard-card-label">Betting record</p>
          <h3>Bet results</h3>
        </div>
        <span>{totalBets} settled</span>
      </div>

      <div
        className="donut-chart"
        role="img"
        aria-label={`Bet outcomes: ${bettingSummary.won} won and ${bettingSummary.lost} lost`}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={betResults}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={66}
              outerRadius={96}
              paddingAngle={3}
              stroke="none"
            >
              {betResults.map((result) => (
                <Cell key={result.name} fill={result.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="donut-total" aria-hidden="true">
          <strong>{totalBets}</strong>
          <span>Total bets</span>
        </div>
      </div>

      <ul className="chart-legend" aria-label="Bet result totals">
        {betResults.map((result) => (
          <li key={result.name}>
            <span
              className="chart-legend-marker"
              style={{ backgroundColor: result.color }}
              aria-hidden="true"
            />
            <span>{result.name}</span>
            <strong>{result.value}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}
