import { useAuth } from '../context/AuthContext';
import { formatUsd } from '../utils/currency';

export function DashboardPage() {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Snail Racing</span>
          <h1>Welcome, {user.fullName}</h1>
          <p>Track your balance and racing performance in one place.</p>
        </div>

        <button className="dashboard-logout" type="button" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="dashboard-content" aria-label="Account overview">
        <article className="balance-card" aria-labelledby="balance-title">
          <div>
            <p className="dashboard-card-label" id="balance-title">
              Available balance
            </p>
            <p className="balance-amount">
              {formatUsd(user.balance)}
            </p>
          </div>

          <div className="balance-action">
            <button type="button" disabled title="Available in a later module">
              Add funds
            </button>
            <small>SnailPay integration coming next</small>
          </div>
        </article>

        <section
          className="performance-section"
          aria-labelledby="performance-title"
        >
          <div className="dashboard-section-heading">
            <div>
              <span className="eyebrow">Race insights</span>
              <h2 id="performance-title">Performance</h2>
            </div>
            <p>Analytics will appear after racing data is added.</p>
          </div>

          <div className="performance-grid">
            <article className="dashboard-empty-panel">
              <div className="dashboard-empty-panel-icon" aria-hidden="true">
                <span />
              </div>
              <div>
                <h3>Bet results</h3>
                <p>No betting history yet.</p>
              </div>
            </article>

            <article className="dashboard-empty-panel">
              <div
                className="dashboard-empty-panel-icon bars"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </div>
              <div>
                <h3>Snail victories</h3>
                <p>Race results will appear here.</p>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
