const startDate = new Date(2026, 10, 13);
const endDate = new Date(2027, 5, 1);
const initialCapital = 40000000;
const targetCapital = 300000000;
const dailyNetProfit = 2063832;

// Claves para localStorage
const STORAGE_KEYS = {
    COMPLETED_DAYS: 'pokemmo_completed_days_v2',
    EXPENSES: 'pokemmo_expenses_v2',
    INCOMES: 'pokemmo_incomes_v2',
    ACCOUNTS: 'pokemmo_accounts_v2',
    CURRENT_WEEK: 'pokemmo_current_week_v2'
};

// Cargar estado guardado
let savedCompletedIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_DAYS)) || [];
let expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || [];
let incomes = JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOMES)) || [];
let accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) || [];
let currentWeekIndex = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_WEEK)) || 0;

function saveData() {
    const completedIds = days.filter(d => d.completed).map(d => d.id);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_DAYS, JSON.stringify(completedIds));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    localStorage.setItem(STORAGE_KEYS.CURRENT_WEEK, currentWeekIndex.toString());
}

let days = [];
let curr = new Date(startDate);
let dayIndex = 0;
while (curr <= endDate) {
    const id = dayIndex++;
    days.push({
        id: id,
        date: new Date(curr),
        completed: savedCompletedIds.includes(id)
    });
    curr.setDate(curr.getDate() + 1);
}

let weeks = [];
for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
}

if (currentWeekIndex < 0 || currentWeekIndex >= weeks.length) {
    currentWeekIndex = 0;
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
    saveData();
    renderWeek();
}

function toggleDay(globalId) {
    const day = days.find(d => d.id === globalId);
    if (day) {
        day.completed = !day.completed;
        if (day.completed) {
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
        saveData();
        updateDashboard();
        renderWeek();
    }
}

// Gastos
function addExpense() {
    const descInput = document.getElementById('expense-desc');
    const amountInput = document.getElementById('expense-amount');
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!desc || isNaN(amount) || amount <= 0) {
        alert('Por favor introduce un concepto y un monto válido.');
        return;
    }

    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    expenses.push({ id: Date.now(), desc, amount, date: dateStr });
    descInput.value = '';
    amountInput.value = '';

    saveData();
    updateDashboard();
    renderExpenses();
}

function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
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
            <div>
                <span class="desc" style="display: block; font-weight: 500;">${exp.desc}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${exp.date || ''}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="amount" style="color: var(--danger-red);">-${formatMoney(exp.amount)}</span>
                <button class="delete-btn" onclick="deleteExpense(${exp.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        listEl.appendChild(item);
    });
}

// Ingresos Extra
function addIncome() {
    const descInput = document.getElementById('income-desc');
    const amountInput = document.getElementById('income-amount');
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!desc || isNaN(amount) || amount <= 0) {
        alert('Por favor introduce un concepto y un monto válido para el ingreso.');
        return;
    }

    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    incomes.push({ id: Date.now(), desc, amount, date: dateStr });
    descInput.value = '';
    amountInput.value = '';

    saveData();
    updateDashboard();
    renderIncomes();
}

function deleteIncome(id) {
    incomes = incomes.filter(i => i.id !== id);
    saveData();
    updateDashboard();
    renderIncomes();
}

function renderIncomes() {
    const listEl = document.getElementById('income-list');
    listEl.innerHTML = '';
    if (incomes.length === 0) {
        listEl.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 1rem; font-size: 0.9rem;">No hay ingresos extra registrados.</div>';
        return;
    }
    incomes.forEach(inc => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
            <div>
                <span class="desc" style="display: block; font-weight: 500;">${inc.desc}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${inc.date || ''}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="amount" style="color: var(--accent-green);">+${formatMoney(inc.amount)}</span>
                <button class="delete-btn" onclick="deleteIncome(${inc.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        listEl.appendChild(item);
    });
}

// Account Cooldown Management & Drag and Drop
const COOLDOWN_HOURS = 18;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;
let draggedCardId = null;

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
    saveData();
    renderAccounts();
}

function deleteAccount(id) {
    accounts = accounts.filter(a => a.id !== id);
    saveData();
    renderAccounts();
}

function finishAccountFarm(id) {
    const acc = accounts.find(a => a.id === id);
    if (acc) {
        acc.lastFinishedTime = Date.now();
        saveData();
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
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-id', acc.id);
        card.id = `acc-card-${acc.id}`;
        
        card.addEventListener('dragstart', (e) => {
            draggedCardId = acc.id.toString();
            card.style.opacity = '0.4';
        });

        card.addEventListener('dragend', (e) => {
            card.style.opacity = '1';
            draggedCardId = null;
            document.querySelectorAll('.account-card').forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        card.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (acc.id.toString() !== draggedCardId) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', (e) => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            const targetId = acc.id.toString();
            if (draggedCardId && targetId && draggedCardId !== targetId) {
                reorderAccounts(draggedCardId, targetId);
            }
        });

        gridEl.appendChild(card);
    });
    updateAccountTimers();
}

function reorderAccounts(sourceId, targetId) {
    const sourceIdx = accounts.findIndex(a => a.id.toString() === sourceId);
    const targetIdx = accounts.findIndex(a => a.id.toString() === targetId);
    
    if (sourceIdx !== -1 && targetIdx !== -1) {
        const [movedItem] = accounts.splice(sourceIdx, 1);
        accounts.splice(targetIdx, 0, movedItem);
        saveData();
        renderAccounts();
    }
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
                <span class="account-title"><i class="fa-solid fa-grip-vertical drag-handle" title="Arrastrar para ordenar"></i> <i class="fa-solid fa-user-gear"></i> ${acc.name}</span>
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
    const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Capital total = Base (40M) + Farmeo + Ingresos Extra - Gastos
    const currentCapital = initialCapital + totalFarmProfit + totalIncomes - totalExpenses;
    
    let progressPct = (currentCapital / targetCapital) * 100;
    if (progressPct > 100) progressPct = 100;
    if (progressPct < 0) progressPct = 0;

    document.getElementById('stat-capital').textContent = formatMoney(currentCapital);
    document.getElementById('stat-farm-profit').textContent = formatMoney(totalFarmProfit);
    document.getElementById('stat-incomes').textContent = formatMoney(totalIncomes);
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
renderIncomes();
renderAccounts();
updateDashboard();
