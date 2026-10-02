import { useCallback, useRef, useState } from 'react';
import { AddFundsModal } from '../components/AddFundsModal';
import { BetResultsChart } from '../components/charts/BetResultsChart';
import { SnailWinsChart } from '../components/charts/SnailWinsChart';
import { useAuth } from '../context/AuthContext';
import { formatUsd } from '../utils/currency';

export function DashboardPage() {
  const { addFunds, logout, user } = useAuth();
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const addFundsButtonRef = useRef<HTMLButtonElement>(null);

  const closeAddFunds = useCallback(() => {
    setIsAddFundsOpen(false);
    window.setTimeout(() => addFundsButtonRef.current?.focus(), 0);
  }, []);

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
            <button
              ref={addFundsButtonRef}
              type="button"
              onClick={() => setIsAddFundsOpen(true)}
            >
              Add funds
            </button>
            <small>Secure payments powered by SnailPay</small>
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
            <p>Stable results from six simulated races.</p>
          </div>

          <div className="performance-grid">
            <BetResultsChart />

            <SnailWinsChart />
          </div>
        </section>
      </section>

      {isAddFundsOpen ? (
        <AddFundsModal
          user={user}
          onClose={closeAddFunds}
          onApproved={addFunds}
        />
      ) : null}
    </main>
  );
}
