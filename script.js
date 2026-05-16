// Utilitários
const getPeriodo = (date = new Date()) => {
    const hora = date.getHours();
    if (hora >= 0 && hora < 6) return "Madrugada";
    if (hora >= 6 && hora < 12) return "Manhã";
    if (hora >= 12 && hora < 18) return "Tarde";
    return "Noite";
};

const getStatus = (sys, dia) => {
    if (sys < 130 && dia < 85) return { label: 'Normal', class: 'badge-success', border: 'border-success' };
    if (sys < 140 && dia < 90) return { label: 'Atenção', class: 'badge-warning', border: 'border-warning' };
    return { label: 'Elevada', class: 'badge-danger', border: 'border-danger' };
};

// Dados Mockados para histórico
const mockRecords = [
    { id: 1, date: '2026-05-16', time: '08:20', sys: 120, dia: 80, bpm: 72, periodo: 'Manhã', condicao: 'Em repouso' },
    { id: 2, date: '2026-05-15', time: '19:45', sys: 125, dia: 82, bpm: 75, periodo: 'Noite', condicao: 'Após estresse' },
    { id: 3, date: '2026-05-14', time: '07:30', sys: 118, dia: 78, bpm: 68, periodo: 'Manhã', condicao: 'Antes do medicamento' },
    { id: 4, date: '2026-05-13', time: '14:10', sys: 130, dia: 85, bpm: 80, periodo: 'Tarde', condicao: 'Após café' }
];

// Navegação de Telas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Resetar navegação inferior
    document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => nav.classList.remove('active'));
    if(screenId === 'dashboard-screen') document.querySelectorAll('.bottom-nav .nav-item')[0].classList.add('active');
    if(screenId === 'history-screen') document.querySelectorAll('.bottom-nav .nav-item')[1].classList.add('active');
    // Adicionar outros se necessário
    
    if(screenId === 'history-screen') {
        renderHistory(mockRecords);
    }
    
    window.scrollTo(0, 0);
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function renderHistory(records) {
    const list = document.getElementById('history-list');
    if(!list) return;
    
    list.innerHTML = '';
    
    records.forEach(record => {
        const status = getStatus(record.sys, record.dia);
        const card = document.createElement('div');
        card.className = `history-card glass border-l-4 ${status.border}`;
        card.innerHTML = `
            <div class="history-info">
                <div class="date-time">${formatDate(record.date)} às ${record.time} • ${record.periodo}</div>
                <div class="values">${record.sys} / ${record.dia} <span class="bpm">❤ ${record.bpm} bpm</span></div>
                <div class="text-xs text-slate-500 mt-1">${record.condicao}</div>
            </div>
            <div class="${status.class}" style="font-size: 0.7rem; padding: 4px 8px;">${status.label}</div>
        `;
        list.appendChild(card);
    });
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
}

function filtrarHistorico(filtro) {
    document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filtered = mockRecords;
    if(filtro === 'manha') filtered = mockRecords.filter(r => r.periodo === 'Manhã');
    if(filtro === 'noite') filtered = mockRecords.filter(r => r.periodo === 'Noite');
    
    renderHistory(filtered);
}

function exportarCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Hora,Período,Sistólica,Diastólica,BPM,Condição\n";
    
    mockRecords.forEach(row => {
        const rowData = `${row.date},${row.time},${row.periodo},${row.sys},${row.dia},${row.bpm},${row.condicao}`;
        csvContent += rowData + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_pressao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicialização do Gráfico
let mainChart;
function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(10, 38, 71, 0.2)');
    gradient.addColorStop(1, 'rgba(10, 38, 71, 0)');

    if (mainChart) mainChart.destroy();

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mockRecords.map(r => formatDate(r.date)).reverse(),
            datasets: [{
                label: 'Sistólica',
                data: mockRecords.map(r => r.sys).reverse(),
                borderColor: '#0A2647',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: gradient,
                pointBackgroundColor: '#0A2647'
            },
            {
                label: 'Diastólica',
                data: mockRecords.map(r => r.dia).reverse(),
                borderColor: '#2C74B3',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                borderDash: [5, 5],
                pointBackgroundColor: '#2C74B3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false } }
            }
        }
    });
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    // Mock Login
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginBtn.innerHTML = "Entrando...";
            setTimeout(() => {
                const displayName = document.getElementById('display-name');
                if(displayName) displayName.innerText = "João Silva";
                showScreen('dashboard-screen');
                initChart();
            }, 1500);
        });
    }

    // Form Submissão
    const recordForm = document.getElementById('record-form');
    if (recordForm) {
        recordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const sys = document.getElementById('reg-sys').value;
            const dia = document.getElementById('reg-dia').value;
            const bpm = document.getElementById('reg-bpm').value;
            const condicao = document.getElementById('reg-condicao').options[document.getElementById('reg-condicao').selectedIndex].text;
            
            // Atualiza Dashboard com o novo valor
            document.getElementById('last-sys').innerText = sys;
            document.getElementById('last-dia').innerText = dia;
            document.getElementById('last-time').innerText = `Hoje, ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
            
            const status = getStatus(sys, dia);
            const card = document.getElementById('status-card');
            const badge = document.getElementById('status-badge');
            
            card.className = `card-premium glass border-l-8 ${status.border}`;
            badge.className = `${status.class} mt-4`;
            badge.innerText = `Pressão ${status.label}`;
            
            // Adiciona no mock e re-renderiza
            mockRecords.unshift({
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
                sys: parseInt(sys),
                dia: parseInt(dia),
                bpm: bpm || '--',
                periodo: getPeriodo(),
                condicao: condicao
            });
            
            initChart();
            if(document.getElementById('history-screen').classList.contains('active')){
                renderHistory(mockRecords);
            }

            closeModal('new-record-modal');
            recordForm.reset();
        });
    }
});

// Expor funções globalmente para o HTML
window.showScreen = showScreen;
window.showModal = showModal;
window.closeModal = closeModal;
window.filtrarHistorico = filtrarHistorico;
window.exportarCSV = exportarCSV;

