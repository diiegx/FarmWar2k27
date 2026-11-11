const startDate = new Date(2026, 10, 13);
const endDate = new Date(2027, 5, 1);
const initialCapital = 40000000;
const targetCapital = 300000000;
const dailyNetProfit = 2063832;

let days = [];
let curr = new Date(startDate);
let dayIndex = 0;
while (curr <= endDate) {
    days.push({
        id: dayIndex++,
        date: new Date(curr),
        completed: false
    });
    curr.setDate(curr.getDate() + 1);
}

let expenses = [];
let accounts = []; // { id, name, lastFinishedTime: timestamp }
let currentWeekIndex = 0;
let weeks = [];
for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
}

const weekdaysEs = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const ctx = document.getElementById('growthChart').getContext('2d');
const growthChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Capital Real Acumulado ($)',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af', maxTicksLimit: 10 }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { 
                    color: '#9ca3af',
                    callback: function(value) { return '$' + (value / 1000000).toFixed(0) + 'M'; }
                }
            }
        }
    }
});

function formatMoney(amount) {
    return '$' + amount.toLocaleString('en-US');
}

function changeWeek(direction) {
    currentWeekIndex += direction;
    if (currentWeekIndex < 0) currentWeekIndex = 0;
    if (currentWeekIndex >= weeks.length) currentWeekIndex = weeks.length - 1;
    renderWeek();
}

function toggleDay(globalId) {
    const day = days.find(d => d.id === globalId);
    if (day) {
        day.completed = !day.completed;
        if (day.completed) {
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
        updateDashboard();
        renderWeek();
    }
}

function addExpense() {
    const descInput = document.getElementById('expense-desc');
    const amountInput = document.getElementById('expense-amount');
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!desc || isNaN(amount) || amount <= 0) {
        alert('Por favor introduce un concepto y un monto válido.');
        return;
    }

    expenses.push({ id: Date.now(), desc, amount });
    descInput.value = '';
    amountInput.value = '';

    updateDashboard();
    renderExpenses();
}

function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    updateDashboard();
    renderExpenses();
}

function renderExpenses() {
    const listEl = document.getElementById('expense-list');
    listEl.innerHTML = '';
    if (expenses.length === 0) {
        listEl.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 1rem; font-size: 0.9rem;">No hay gastos registrados.</div>';
        return;
    }
    expenses.forEach(exp => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
            <span class="desc">${exp.desc}</span>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="amount">-${formatMoney(exp.amount)}</span>
                <button class="delete-btn" onclick="deleteExpense(${exp.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        listEl.appendChild(item);
    });
}

// Account Cooldown Management
const COOLDOWN_HOURS = 18;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

function addAccount() {
    const nameInput = document.getElementById('account-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Por favor introduce un nombre para la cuenta.');
        return;
    }

    accounts.push({
        id: Date.now(),
        name: name,
        lastFinishedTime: null
    });

    nameInput.value = '';
    renderAccounts();
}

function deleteAccount(id) {
    accounts = accounts.filter(a => a.id !== id);
    renderAccounts();
}

function finishAccountFarm(id) {
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        acc.lastFinishedTime = Date.now();
        renderAccounts();
    }
}

function renderAccounts() {
    const gridEl = document.getElementById('accounts-grid');
    gridEl.innerHTML = '';

    if (accounts.length === 0) {
        gridEl.innerHTML = '<div style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 1rem; font-size: 0.9rem;">No hay cuentas añadidas todavía.</div>';
        return;
    }

    accounts.forEach(acc => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.id = `acc-card-${acc.id}`;
        
        gridEl.appendChild(card);
    });
    updateAccountTimers();
}

function updateAccountTimers() {
    const now = Date.now();
    accounts.forEach(acc => {
        const card = document.getElementById(`acc-card-${acc.id}`);
        if (!card) return;

        let statusText = 'Sin registrar farmeo';
        let timerText = '--:--:--';
        let btnText = 'Registrar Fin de Farmeo';
        let isReady = true;

        if (acc.lastFinishedTime) {
            const elapsed = now - acc.lastFinishedTime;
            const remaining = COOLDOWN_MS - elapsed;

            if (remaining > 0) {
                isReady = false;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                
                timerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                const finishedDate = new Date(acc.lastFinishedTime);
                statusText = `Terminado a las ${finishedDate.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}`;
                btnText = 'En Cooldown...';
            } else {
                isReady = true;
                timerText = '¡Listo para farmear!';
                statusText = 'Cooldown completado';
                btnText = 'Volver a Registrar Fin';
            }
        }

        card.innerHTML = `
            <div class="account-header">
                <span class="account-title"><i class="fa-solid fa-user-gear"></i> ${acc.name}</span>
                <button class="account-delete" onclick="deleteAccount(${acc.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="account-status">${statusText}</div>
            <div class="account-timer" style="color: ${isReady ? 'var(--accent-green)' : '#60a5fa'}">${timerText}</div>
            <button class="account-btn ${isReady ? 'ready' : ''}" onclick="finishAccountFarm(${acc.id})">
                <i class="fa-solid fa-stopwatch"></i> ${btnText}
            </button>
        `;
    });
}

// Run timer every second
setInterval(updateAccountTimers, 1000);

function renderWeek() {
    const weekDays = weeks[currentWeekIndex];
    const container = document.getElementById('week-days-container');
    container.innerHTML = '';

    const startDateStr = weekDays[0].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endDateStr = weekDays[weekDays.length - 1].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    document.getElementById('week-title-display').textContent = `Semana ${currentWeekIndex + 1} (${startDateStr} - ${endDateStr})`;

    document.getElementById('prev-week-btn').disabled = currentWeekIndex === 0;
    document.getElementById('next-week-btn').disabled = currentWeekIndex === weeks.length - 1;

    weekDays.forEach(day => {
        let jsDay = day.date.getDay();
        let esDayIndex = jsDay === 0 ? 6 : jsDay - 1;
        let dayName = weekdaysEs[esDayIndex];
        let dateFormatted = day.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const row = document.createElement('div');
        row.className = 'day-row';
        row.innerHTML = `
            <div class="day-info">
                <span class="day-name">${dayName}</span>
                <span class="day-date">${dateFormatted}</span>
            </div>
            <div class="day-actions">
                <span class="day-profit">${day.completed ? '+ ' + formatMoney(dailyNetProfit) : '$0'}</span>
                <button class="toggle-btn ${day.completed ? 'completed' : ''}" onclick="toggleDay(${day.id})">
                    ${day.completed ? '<i class="fa-solid fa-check"></i> SÍ' : 'NO'}
                </button>
            </div>
        `;
        container.appendChild(row);
    });
}

function updateDashboard() {
    const completedDaysCount = days.filter(d => d.completed).length;
    const totalFarmProfit = completedDaysCount * dailyNetProfit;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentCapital = initialCapital + totalFarmProfit - totalExpenses;
    
    let progressPct = (currentCapital / targetCapital) * 100;
    if (progressPct > 100) progressPct = 100;
    if (progressPct < 0) progressPct = 0;

    document.getElementById('stat-capital').textContent = formatMoney(currentCapital);
    document.getElementById('stat-farm-profit').textContent = formatMoney(totalFarmProfit);
    document.getElementById('stat-expenses').textContent = formatMoney(totalExpenses);
    document.getElementById('stat-progress').textContent = progressPct.toFixed(1) + '%';

    document.getElementById('progress-text').textContent = progressPct.toFixed(1) + '% Completado';
    document.getElementById('progress-fill').style.width = progressPct + '%';

    let runningCapital = initialCapital;
    let chartLabels = [];
    let chartData = [];

    days.forEach((day) => {
        let dayProfit = day.completed ? dailyNetProfit : 0;
        runningCapital += dayProfit;
        chartLabels.push(day.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
        chartData.push(runningCapital);
    });

    growthChart.data.labels = chartLabels;
    growthChart.data.datasets[0].data = chartData;
    growthChart.update();
}

renderWeek();
renderExpenses();
renderAccounts();
updateDashboard();
