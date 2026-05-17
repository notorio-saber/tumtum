// --- PWA Service Worker ---
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.error('Erro de Service Worker:', err));
    });
}

// Detectar prompt de instalação (Android)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBanner) {
        installBanner.classList.remove('hidden');
    }
});

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

function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
}

function updateUserProfile(user, data = null) {
    if (!user) return;
    
    // 1. Saudação baseada no horário
    const period = getPeriodo();
    let greetingText = "Olá,";
    if (period === "Manhã") greetingText = "Bom dia,";
    else if (period === "Tarde") greetingText = "Boa tarde,";
    else if (period === "Noite" || period === "Madrugada") greetingText = "Boa noite,";
    
    const greetingEl = document.querySelector('.greeting');
    if (greetingEl) greetingEl.innerText = greetingText;
    
    // 2. Nome do Usuário
    const nameToDisplay = (data && data.nome) || user.displayName || "Usuário";
    const displayName = document.getElementById('display-name');
    if (displayName) displayName.innerText = nameToDisplay;
    
    // 3. Avatar (Foto do Google ou Iniciais)
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
        if (user.photoURL) {
            avatarElement.innerHTML = `<img src="${user.photoURL}" alt="${nameToDisplay}" onerror="this.style.display='none'; this.parentElement.innerText='${getInitials(nameToDisplay)}';">`;
        } else {
            avatarElement.innerText = getInitials(nameToDisplay);
        }
    }
}

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

// --- Anamnese Logic ---
let currentStep = 1;
const totalSteps = 6;

function selectChoice(btn, inputId, value) {
    const parent = btn.closest('.grid-1') || btn.closest('.grid-2');
    parent.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById(inputId).value = value;
}

function toggleMulti(btn, inputId) {
    btn.classList.toggle('selected');
    // Multi logic can just check selected class later, or we can use hidden inputs.
    // For simplicity, we'll just read the classes on finish.
}

function stepNumber(inputId, change) {
    const input = document.getElementById(inputId);
    let val = parseInt(input.value) || 0;
    val += change;
    if (val < 0) val = 0;
    input.value = val;
}

function updateProgress() {
    document.getElementById('current-step-display').innerText = currentStep;
    document.getElementById('anamnese-progress').style.width = `${(currentStep / totalSteps) * 100}%`;
    
    document.getElementById('btn-prev-step').classList.toggle('hidden', currentStep === 1);
    const nextBtn = document.getElementById('btn-next-step');
    
    if (currentStep === totalSteps) {
        nextBtn.innerText = "Concluir";
        nextBtn.onclick = finishAnamnese;
    } else {
        nextBtn.innerText = "Avançar";
        nextBtn.onclick = nextStep;
    }
}

function nextStep() {
    if (currentStep < totalSteps) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep++;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateProgress();
    }
}

function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`step-${currentStep}`).classList.remove('active');
        currentStep--;
        document.getElementById(`step-${currentStep}`).classList.add('active');
        updateProgress();
    }
}

async function finishAnamnese() {
    const btn = document.getElementById('btn-next-step');
    btn.innerText = "Salvando...";
    btn.disabled = true;
    
    // Gathers data
    const anamneseData = {
        nome: document.getElementById('a-nome').value,
        sexo: document.getElementById('a-sexo').value,
        idade: parseInt(document.getElementById('a-idade').value),
        peso: parseInt(document.getElementById('a-peso').value),
        altura: parseInt(document.getElementById('a-altura').value),
        
        hipertensao: document.getElementById('a-hiper').value,
        usaMedicamento: document.getElementById('a-med').value,
        medicamentoNome: document.getElementById('a-med-nome').value,
        medicamentoFreq: document.getElementById('a-med-freq').value,
        
        // Multiples
        historico: Array.from(document.querySelectorAll('#step-3 .choice-card.multi.selected')).filter(b => b.innerText.includes('Infarto') || b.innerText.includes('AVC') || b.innerText.includes('Arritmia') || b.innerText.includes('Cardíaca') || b.innerText.includes('Cardiopatia')).map(b => b.innerText),
        sintomas:  Array.from(document.querySelectorAll('#step-3 .choice-card.multi.selected')).filter(b => b.innerText.includes('Dor') || b.innerText.includes('Falta') || b.innerText.includes('Tontura') || b.innerText.includes('Palpitação') || b.innerText.includes('Inchaço')).map(b => b.innerText),
        
        habitos: {
            fisica: document.getElementById('a-hab-fisica').value,
            fuma: document.getElementById('a-hab-fuma').value,
            alcool: document.getElementById('a-hab-alcool').value,
            sal: document.getElementById('a-hab-sal').value,
            diabetes: document.getElementById('a-hab-diabetes').value,
            colesterol: document.getElementById('a-hab-colesterol').value
        },
        
        emergenciaFamiliar: document.getElementById('a-emergencia').value,
        emergenciaNome: document.getElementById('a-emerg-nome').value,
        emergenciaTel: document.getElementById('a-emerg-tel').value,
        
        situacaoPressao: document.getElementById('a-situacao').value,
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const user = window.auth.currentUser;
    if (user) {
        try {
            await window.db.collection('users').doc(user.uid).set(anamneseData, { merge: true });
            updateUserProfile(user, anamneseData);
            
            showScreen('dashboard-screen');
            initChart();
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Houve um erro ao salvar seu perfil. Tente novamente.");
            btn.innerText = "Concluir";
            btn.disabled = false;
        }
    }
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    // Real Firebase Auth Login
    const loginBtn = document.getElementById('btn-login-google');
    const originalBtnHtml = loginBtn ? loginBtn.innerHTML : "Entrar com Google";
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            loginBtn.innerHTML = "Entrando...";
            try {
                await window.auth.signInWithPopup(window.googleProvider);
                // A navegação será feita pelo onAuthStateChanged
            } catch (error) {
                console.error("Erro no login:", error);
                alert("Erro ao tentar fazer login: " + error.message);
                loginBtn.innerHTML = originalBtnHtml; // Reset button
            }
        });
    }

    // Monitorar estado de autenticação
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Atualiza de imediato com dados disponíveis do Google Auth (evita exibir "Carregando...")
            updateUserProfile(user);
            
            try {
                const doc = await window.db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().completedAt) {
                    // Já preencheu a anamnese
                    const data = doc.data();
                    updateUserProfile(user, data);
                    
                    showScreen('dashboard-screen');
                    initChart();
                } else {
                    // Novo usuário, precisa preencher
                    document.getElementById('a-nome').value = user.displayName || "";
                    showScreen('anamnese-screen');
                    currentStep = 1;
                    updateProgress();
                }
            } catch(e) {
                console.error("Erro ao verificar perfil", e);
                // Se o firestore falhar, mostra dashboard fallback com o que temos
                updateUserProfile(user);
                showScreen('dashboard-screen');
                initChart();
            }
        } else {
            showScreen('login-screen');
        }
    });

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

    // Lógica para clique no botão de instalação do Android/Chrome
    const btnInstall = document.getElementById('btn-install-pwa');
    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            // Mostra o prompt nativo
            deferredPrompt.prompt();
            // Espera pela resposta do usuário
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA escolha do usuário: ${outcome}`);
            deferredPrompt = null;
            // Esconde o card
            const installBanner = document.getElementById('pwa-install-banner');
            if (installBanner) installBanner.classList.add('hidden');
        });
    }

    // Detectar iOS para exibir tutorial amigável
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isIos && !isStandalone) {
        // Mostra o modal amigável de instalação para usuários do iPhone no Safari
        setTimeout(() => {
            showModal('ios-pwa-modal');
        }, 2000); // 2 segundos após carregar o login, surge o tutorial didático
    }
});

// Expor funções globalmente para o HTML
window.showScreen = showScreen;
window.showModal = showModal;
window.closeModal = closeModal;
window.filtrarHistorico = filtrarHistorico;
window.exportarCSV = exportarCSV;

