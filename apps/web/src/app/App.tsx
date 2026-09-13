import './app.css';

const mealPeriods = [
  { title: 'Bữa sáng', icon: '☀️' },
  { title: 'Bữa trưa', icon: '🍲' },
  { title: 'Bữa tối', icon: '🌙' },
];

export function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Choose Dish</p>
        <h1>Chọn món hôm nay</h1>
        <p className="hero-copy">Để mỗi bữa ăn bớt phải suy nghĩ.</p>
      </header>

      <section className="meal-grid" aria-label="Các bữa ăn hôm nay">
        {mealPeriods.map((period) => (
          <article className="meal-card" key={period.title}>
            <span className="meal-icon" aria-hidden="true">
              {period.icon}
            </span>
            <div>
              <h2>{period.title}</h2>
              <p>Chưa chọn món</p>
            </div>
            <button type="button">Chọn món</button>
          </article>
        ))}
      </section>
    </main>
  );
}
