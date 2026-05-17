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

const CLINICAL_MESSAGES = {
    crisis: [
        "ATENÇÃO: Valores extremamente elevados com risco imediato! Procure ajuda especializada agora!",
        "Alerta de emergência! Sente-se imediatamente, tente manter a calma e acione o SAMU 192 de imediato.",
        "Sua pressão atingiu um patamar crítico. Por favor, evite esforços e acione o suporte médico com urgência."
    ],
    danger: [
        "Sua pressão está significativamente elevada (Estágio 2). É recomendável deitar-se em local calmo e avisar alguém próximo.",
        "Alerta importante: reduza qualquer agitação agora. Se houver sintomas como dor de cabeça forte ou falta de ar, busque atendimento.",
        "Aferição preocupante. Repouse por 15 minutos em silêncio absoluto e faça uma nova medição para controle."
    ],
    coral: [
        "Sua pressão está alta (Estágio 1). Procure sentar-se de forma confortável, relaxe os ombros e respire profundamente.",
        "Alerta de cuidado: tente desacelerar o ritmo do seu dia hoje. Considere repetir a aferição em repouso mais tarde.",
        "Valores moderadamente elevados. Fique atento à sua hidratação, evite estresses desnecessários e descanse um pouco."
    ],
    warning: [
        "Sua pressão está levemente elevada (Atenção). Que tal beber um copo de água gelada e repousar por 10 minutos?",
        "Um sinal amarelo para a rotina de hoje: reduza o consumo de sal e dê preferência a alimentos leves e naturais.",
        "Leitura com ligeira elevação. Tire um momento para alongar o pescoço, controle a respiração e evite cafeína por agora."
    ],
    success: [
        "Tudo sob controle! Seu coração está batendo no ritmo ideal. Mantenha os seus ótimos hábitos!",
        "Excelente resultado! Sua dedicação com a alimentação e exercícios está se refletindo no painel.",
        "Pressão perfeita dentro da faixa segura de saúde! Continue assim e mantenha seu registro em dia."
    ]
};

const getStatus = (sys, dia) => {
    sys = parseInt(sys) || 0;
    dia = parseInt(dia) || 0;
    
    const getRandomMsg = (list) => list[Math.floor(Math.random() * list.length)];
    
    if (sys >= 180 || dia >= 120) {
        return {
            label: 'Crise Hipertensiva',
            class: 'badge-crisis',
            border: 'border-crisis',
            message: getRandomMsg(CLINICAL_MESSAGES.crisis),
            risk: 'Muito Alto',
            action: 'Acione socorro médico imediatamente!'
        };
    }
    if (sys >= 160 || dia >= 100) {
        return {
            label: 'Hipertensão Estágio 2',
            class: 'badge-danger',
            border: 'border-danger',
            message: getRandomMsg(CLINICAL_MESSAGES.danger),
            risk: 'Alto',
            action: 'Descanse em repouso e monitore os sintomas.'
        };
    }
    if (sys >= 140 || dia >= 90) {
        return {
            label: 'Hipertensão Estágio 1',
            class: 'badge-coral',
            border: 'border-coral',
            message: getRandomMsg(CLINICAL_MESSAGES.coral),
            risk: 'Moderado',
            action: 'Evite esforços e meça novamente em 20 min.'
        };
    }
    if (sys >= 120 || dia >= 80) {
        return {
            label: 'Elevada / Atenção',
            class: 'badge-warning',
            border: 'border-warning',
            message: getRandomMsg(CLINICAL_MESSAGES.warning),
            risk: 'Leve/Moderado',
            action: 'Evite sal/gordura e beba bastante água.'
        };
    }
    return {
        label: 'Normal',
        class: 'badge-success',
        border: 'border-success',
        message: getRandomMsg(CLINICAL_MESSAGES.success),
        risk: 'Baixo',
        action: 'Excelente! Mantenha seus bons hábitos de vida.'
    };
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
    
    // Fallback: Se data for nulo, tenta carregar do localStorage
    if (!data) {
        const localData = localStorage.getItem(`anamnese_data_${user.uid}`);
        if (localData) {
            try {
                data = JSON.parse(localData);
            } catch (e) {
                console.error("Erro ao fazer parse dos dados locais:", e);
            }
        }
    }
    
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

    // 4. Preenchimento da Tela de Perfil
    const profileName = document.getElementById('profile-name');
    if (profileName) profileName.innerText = nameToDisplay;
    
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) profileEmail.innerText = user.email || "";
    
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
        if (user.photoURL) {
            profileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${nameToDisplay}" onerror="this.style.display='none'; this.parentElement.innerText='${getInitials(nameToDisplay)}';">`;
        } else {
            profileAvatar.innerText = getInitials(nameToDisplay);
        }
    }
    
    if (data) {
        // Dados Clínicos
        if (document.getElementById('p-idade')) document.getElementById('p-idade').innerText = data.idade ? `${data.idade} anos` : '-- anos';
        if (document.getElementById('p-sexo')) document.getElementById('p-sexo').innerText = data.sexo || '--';
        if (document.getElementById('p-peso')) document.getElementById('p-peso').innerText = data.peso ? `${data.peso} kg` : '-- kg';
        if (document.getElementById('p-altura')) document.getElementById('p-altura').innerText = data.altura ? `${data.altura} cm` : '-- cm';
        if (document.getElementById('p-situacao')) document.getElementById('p-situacao').innerText = data.situacaoPressao || '--';
        
        // Cardiovascular & Tratamento
        if (document.getElementById('p-hiper')) document.getElementById('p-hiper').innerText = data.hipertensao || '--';
        if (document.getElementById('p-med')) document.getElementById('p-med').innerText = data.usaMedicamento || '--';
        
        const medWrapper = document.getElementById('p-med-details-wrapper');
        if (medWrapper) {
            if (data.usaMedicamento === 'Sim') {
                medWrapper.classList.remove('hidden');
                if (document.getElementById('p-med-nome')) document.getElementById('p-med-nome').innerText = data.medicamentoNome || '--';
                if (document.getElementById('p-med-freq')) document.getElementById('p-med-freq').innerText = data.medicamentoFreq ? `${data.medicamentoFreq} horários` : '-- horários';
            } else {
                medWrapper.classList.add('hidden');
            }
        }
        
        // Hábitos
        const habits = data.habitos || {};
        if (document.getElementById('p-hab-fisica')) document.getElementById('p-hab-fisica').innerText = habits.fisica || '--';
        if (document.getElementById('p-hab-fuma')) document.getElementById('p-hab-fuma').innerText = habits.fuma || '--';
        if (document.getElementById('p-hab-alcool')) document.getElementById('p-hab-alcool').innerText = habits.alcool || '--';
        if (document.getElementById('p-hab-sal')) document.getElementById('p-hab-sal').innerText = habits.sal || '--';
        if (document.getElementById('p-hab-diabetes')) document.getElementById('p-hab-diabetes').innerText = habits.diabetes || '--';
        if (document.getElementById('p-hab-colesterol')) document.getElementById('p-hab-colesterol').innerText = habits.colesterol || '--';
        
        // Histórico & Sintomas (Doenças prévias e sintomas selecionados)
        const histPills = document.getElementById('p-historico-pills');
        if (histPills) {
            if (data.historico && data.historico.length > 0) {
                histPills.innerHTML = data.historico.map(h => `<span class="profile-pill-item profile-pill-history">${h}</span>`).join('');
            } else {
                histPills.innerHTML = `<span style="font-size: 0.82rem; color: #94a3b8; font-style: italic;">Nenhum histórico selecionado</span>`;
            }
        }
        
        const sintPills = document.getElementById('p-sintomas-pills');
        if (sintPills) {
            if (data.sintomas && data.sintomas.length > 0) {
                sintPills.innerHTML = data.sintomas.map(s => `<span class="profile-pill-item profile-pill-symptom">${s}</span>`).join('');
            } else {
                sintPills.innerHTML = `<span style="font-size: 0.82rem; color: #94a3b8; font-style: italic;">Nenhum sintoma selecionado</span>`;
            }
        }
        
        // Emergência
        if (document.getElementById('p-emerg-nome')) document.getElementById('p-emerg-nome').innerText = data.emergenciaNome || '--';
        
        const emergTel = document.getElementById('p-emerg-tel');
        if (emergTel) {
            if (data.emergenciaTel) {
                emergTel.href = `tel:${data.emergenciaTel.replace(/\D/g, '')}`;
                emergTel.querySelector('span').innerText = data.emergenciaTel;
                emergTel.style.display = 'flex';
            } else {
                emergTel.href = '#';
                emergTel.querySelector('span').innerText = '--';
                emergTel.style.display = 'none';
            }
        }
    }
    
    // Atualiza/Recria os ícones dinâmicos do Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Dados Mockados para histórico
let mockRecords = [
    { id: 1, date: '2026-05-16', time: '08:20', sys: 120, dia: 80, bpm: 72, periodo: 'Manhã', condicao: 'Em repouso' },
    { id: 2, date: '2026-05-15', time: '19:45', sys: 125, dia: 82, bpm: 75, periodo: 'Noite', condicao: 'Após estresse' },
    { id: 3, date: '2026-05-14', time: '07:30', sys: 118, dia: 78, bpm: 68, periodo: 'Manhã', condicao: 'Antes do medicamento' },
    { id: 4, date: '2026-05-13', time: '14:10', sys: 130, dia: 85, bpm: 80, periodo: 'Tarde', condicao: 'Após café' }
];

// Navegação de Telas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Resetar navegação inferior (3 itens)
    document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => nav.classList.remove('active'));
    if(screenId === 'dashboard-screen') document.querySelectorAll('.bottom-nav .nav-item')[0].classList.add('active');
    if(screenId === 'history-screen') document.querySelectorAll('.bottom-nav .nav-item')[1].classList.add('active');
    if(screenId === 'profile-screen') document.querySelectorAll('.bottom-nav .nav-item')[2].classList.add('active');
    
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
            <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 8px;">
                <div class="${status.class}" style="font-size: 0.7rem; padding: 4px 8px;">${status.label}</div>
                <button onclick="deleteRecord(${record.id})" style="background: transparent; border: none; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; color: var(--primary); transition: all 0.2s;" title="Excluir Aferição">
                    <i data-lucide="trash-2" style="width: 15px; height: 15px; stroke-width: 2.5;"></i>
                </button>
            </div>
        `;
        list.appendChild(card);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
}

async function deleteRecord(id) {
    if (confirm("Tem certeza que deseja excluir esta aferição do seu histórico?")) {
        // Filtra e remove do array local
        mockRecords = mockRecords.filter(r => r.id !== id);
        
        const user = window.auth ? window.auth.currentUser : null;
        if (user) {
            // Salva offline localmente de imediato
            localStorage.setItem(`records_${user.uid}`, JSON.stringify(mockRecords));
            
            // Salva no Firestore assincronamente em background
            window.db.collection('users').doc(user.uid).collection('records').doc(id.toString()).delete()
                .catch(err => console.warn("Firestore offline. Exclusão de registro mantida localmente."));
        } else {
            localStorage.setItem('records_guest', JSON.stringify(mockRecords));
        }
        
        // Re-inicializa gráficos e renderiza a tela atualizada
        initChart();
        
        const historyScreen = document.getElementById('history-screen');
        if (historyScreen && historyScreen.classList.contains('active')) {
            renderHistory(mockRecords);
        }
    }
}

function showBiomedicalAlert(sys, dia) {
    const status = getStatus(sys, dia);
    
    // Atualiza elementos do modal de forma segura
    const valSys = document.getElementById('alert-val-sys');
    if (valSys) valSys.innerText = sys;
    
    const valDia = document.getElementById('alert-val-dia');
    if (valDia) valDia.innerText = dia;
    
    const conversion = document.getElementById('alert-val-conversion');
    if (conversion) {
        const sysConv = Math.round(sys / 10);
        const diaConv = Math.round(dia / 10);
        conversion.innerText = `Leitura popular: equivale a ${sysConv} por ${diaConv}`;
    }
    
    const badge = document.getElementById('alert-badge');
    if (badge) {
        badge.innerText = status.label;
        badge.className = status.class; // badge-success, badge-warning, etc.
    }
    
    const msg = document.getElementById('alert-message');
    if (msg) msg.innerText = status.message;
    
    const risk = document.getElementById('alert-risk');
    if (risk) risk.innerText = status.risk;
    
    const action = document.getElementById('alert-action');
    if (action) action.innerText = status.action;
    
    // Lógica da Zona de Emergência Dinâmica (Exibida em Coral, Vermelho e Crise)
    const emergencyZone = document.getElementById('alert-emergency-zone');
    if (emergencyZone) {
        const isEmergency = ['Hipertensão Estágio 1', 'Hipertensão Estágio 2', 'Crise Hipertensiva'].includes(status.label);
        
        if (isEmergency) {
            emergencyZone.style.display = 'flex';
            
            // Tenta obter o número do contato de emergência do usuário
            let emergTel = "";
            let emergNome = "Contato";
            
            const user = window.auth ? window.auth.currentUser : null;
            if (user) {
                const localAnamnese = localStorage.getItem(`anamnese_data_${user.uid}`);
                if (localAnamnese) {
                    try {
                        const data = JSON.parse(localAnamnese);
                        emergTel = data.emergenciaTel || "";
                        emergNome = data.emergenciaNome || "Contato";
                    } catch(e) {}
                }
            }
            
            // Fallback para ler do elemento renderizado na tela de perfil se necessário
            const emergLinkEl = document.getElementById('p-emerg-tel');
            if (emergLinkEl && (!emergTel || emergTel === "--")) {
                const spanEl = emergLinkEl.querySelector('span');
                if (spanEl && spanEl.innerText !== "--") {
                    emergTel = spanEl.innerText;
                }
                const nameEl = document.getElementById('p-emerg-nome');
                if (nameEl && nameEl.innerText !== "--") {
                    emergNome = nameEl.innerText;
                }
            }
            
            // Higieniza o telefone (deixa apenas números para o protocolo tel:)
            const cleanTel = emergTel.replace(/\D/g, "");
            
            const callBtn = document.getElementById('btn-alert-call-contact');
            const callLbl = document.getElementById('lbl-alert-call-contact');
            
            if (callBtn) {
                if (cleanTel) {
                    callBtn.href = `tel:${cleanTel}`;
                    callBtn.style.opacity = '1';
                    callBtn.style.pointerEvents = 'auto';
                } else {
                    callBtn.href = "#";
                    callBtn.style.opacity = '0.5';
                    callBtn.style.pointerEvents = 'none'; // Desativa se não configurado
                }
            }
            if (callLbl) {
                callLbl.innerText = emergNome !== "Contato" ? `Ligar para ${emergNome.split(' ')[0]}` : "Chamar Contato";
            }
        } else {
            emergencyZone.style.display = 'none';
        }
    }

    // Inicializa Lucide no modal dinâmico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Exibe o modal
    showModal('biomedical-alert-modal');
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

function updateAverages() {
    const avg7dEl = document.getElementById('avg-7d');
    const avg30dEl = document.getElementById('avg-30d');
    
    if (!mockRecords || mockRecords.length === 0) {
        if (avg7dEl) avg7dEl.innerText = '--/--';
        if (avg30dEl) avg30dEl.innerText = '--/--';
        return;
    }
    
    // Média de 7 dias (ou registros da semana)
    const recent7 = mockRecords.slice(0, 7);
    const avgSys7 = Math.round(recent7.reduce((sum, r) => sum + r.sys, 0) / recent7.length);
    const avgDia7 = Math.round(recent7.reduce((sum, r) => sum + r.dia, 0) / recent7.length);
    
    // Média de 30 dias (ou total se menor)
    const recent30 = mockRecords.slice(0, 30);
    const avgSys30 = Math.round(recent30.reduce((sum, r) => sum + r.sys, 0) / recent30.length);
    const avgDia30 = Math.round(recent30.reduce((sum, r) => sum + r.dia, 0) / recent30.length);
    
    if (avg7dEl) avg7dEl.innerText = `${avgSys7}/${avgDia7}`;
    if (avg30dEl) avg30dEl.innerText = `${avgSys30}/${avgDia30}`;
}

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    if (mainChart) mainChart.destroy();

    // Dias da semana fixos de Domingo a Sábado
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const hasData = mockRecords && mockRecords.length > 0;
    
    // Se não houver registros, os arrays de dados ficam vazios para não desenhar nenhuma linha
    const sysData = hasData ? [120, 122, 118, 124, 120, 119, 121] : [];
    const diaData = hasData ? [80, 81, 78, 83, 80, 79, 81] : [];
    
    // Contadores para computar a média caso haja múltiplos registros no mesmo dia
    const counts = [1, 1, 1, 1, 1, 1, 1];
    
    if (hasData) {
        // Mapeia registros reais para o dia da semana correspondente
        mockRecords.forEach(r => {
            try {
                const dateParts = r.date.split('-');
                const recordDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                const dayOfWeek = recordDate.getDay(); // 0 = Domingo, 6 = Sábado
                
                if (counts[dayOfWeek] === 1 && sysData[dayOfWeek] === 120 && diaData[dayOfWeek] === 80) {
                    // Substitui valor default pelo real
                    sysData[dayOfWeek] = r.sys;
                    diaData[dayOfWeek] = r.dia;
                } else {
                    // Acumula média
                    sysData[dayOfWeek] = ((sysData[dayOfWeek] * counts[dayOfWeek]) + r.sys) / (counts[dayOfWeek] + 1);
                    diaData[dayOfWeek] = ((diaData[dayOfWeek] * counts[dayOfWeek]) + r.dia) / (counts[dayOfWeek] + 1);
                    counts[dayOfWeek]++;
                }
            } catch (e) {
                console.error("Erro ao mapear dia da semana no gráfico:", e);
            }
        });

        // Arredonda valores finais das médias dos dias
        for (let i = 0; i < 7; i++) {
            sysData[i] = Math.round(sysData[i]);
            diaData[i] = Math.round(diaData[i]);
        }
    }

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sistólica',
                data: sysData,
                borderColor: '#ef4444',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: gradient,
                pointBackgroundColor: '#ef4444',
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Diastólica',
                data: diaData,
                borderColor: '#fca5a5',
                borderWidth: 2.5,
                tension: 0.4,
                fill: false,
                borderDash: [5, 5],
                pointBackgroundColor: '#fca5a5',
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }
            },
            scales: {
                y: { 
                    display: true,
                    grid: { 
                        color: 'rgba(15, 23, 42, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 9, weight: 'bold' }
                    }
                },
                x: { 
                    grid: { display: false },
                    ticks: { 
                        color: '#475569',
                        font: { size: 10, weight: '800' } 
                    }
                }
            }
        }
    });
    
    // Atualiza os painéis de médias 7d e 30d
    updateAverages();
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
    if (currentStep === 5) {
        const emergNomeEl = document.getElementById('a-emerg-nome');
        const emergTelEl = document.getElementById('a-emerg-tel');
        const nome = emergNomeEl ? emergNomeEl.value.trim() : "";
        const tel = emergTelEl ? emergTelEl.value.trim() : "";
        
        if (!nome || !tel) {
            alert("⚠️ Por favor, preencha o Nome e o Telefone do seu contato de emergência. Ele é obrigatório para a sua segurança!");
            return;
        }
    }
    
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
    if (btn) {
        btn.innerText = "Salvando...";
        btn.disabled = true;
    }
    
    try {
        // Validação estrita do contato de emergência (obrigatório)
        const emergNomeEl = document.getElementById('a-emerg-nome');
        const emergTelEl = document.getElementById('a-emerg-tel');
        const emergNome = emergNomeEl ? emergNomeEl.value.trim() : "";
        const emergTel = emergTelEl ? emergTelEl.value.trim() : "";
        
        if (!emergNome || !emergTel) {
            alert("⚠️ O contato de emergência é obrigatório para sua segurança. Por favor, preencha os dados no Passo 5!");
            if (btn) {
                btn.innerText = "Concluir";
                btn.disabled = false;
            }
            // Retorna ao passo 5 visualmente
            document.getElementById(`step-${currentStep}`).classList.remove('active');
            currentStep = 5;
            document.getElementById(`step-${currentStep}`).classList.add('active');
            updateProgress();
            return;
        }
        
        // Obter elementos com segurança e usar fallbacks
        const nomeEl = document.getElementById('a-nome');
        const sexoEl = document.getElementById('a-sexo');
        const idadeEl = document.getElementById('a-idade');
        const pesoEl = document.getElementById('a-peso');
        const alturaEl = document.getElementById('a-altura');
        
        const hiperEl = document.getElementById('a-hiper');
        const medEl = document.getElementById('a-med');
        const medNomeEl = document.getElementById('a-med-nome');
        const medFreqEl = document.getElementById('a-med-freq');
        
        const habFisicaEl = document.getElementById('a-hab-fisica');
        const habFumaEl = document.getElementById('a-hab-fuma');
        const habAlcoolEl = document.getElementById('a-hab-alcool');
        const habSalEl = document.getElementById('a-hab-sal');
        const habDiabetesEl = document.getElementById('a-hab-diabetes');
        const habColesterolEl = document.getElementById('a-hab-colesterol');
        
        const emergEl = document.getElementById('a-emergencia');
        const emergNomeEl = document.getElementById('a-emerg-nome');
        const emergTelEl = document.getElementById('a-emerg-tel');
        
        const situacaoEl = document.getElementById('a-situacao');
        
        const anamneseData = {
            nome: nomeEl ? nomeEl.value : "",
            sexo: sexoEl ? sexoEl.value : "",
            idade: idadeEl ? (parseInt(idadeEl.value) || 0) : 0,
            peso: pesoEl ? (parseInt(pesoEl.value) || 0) : 0,
            altura: alturaEl ? (parseInt(alturaEl.value) || 0) : 0,
            
            hipertensao: hiperEl ? hiperEl.value : "",
            usaMedicamento: medEl ? medEl.value : "",
            medicamentoNome: medNomeEl ? medNomeEl.value : "",
            medicamentoFreq: medFreqEl ? (parseInt(medFreqEl.value) || 0) : 0,
            
            // Multiples
            historico: Array.from(document.querySelectorAll('#step-3 .choice-card.multi.selected')).map(b => b.innerText.trim()),
            sintomas:  Array.from(document.querySelectorAll('#step-3 .choice-card.multi.selected')).map(b => b.innerText.trim()),
            
            habitos: {
                fisica: habFisicaEl ? habFisicaEl.value : "",
                fuma: habFumaEl ? habFumaEl.value : "",
                alcool: habAlcoolEl ? habAlcoolEl.value : "",
                sal: habSalEl ? habSalEl.value : "",
                diabetes: habDiabetesEl ? habDiabetesEl.value : "",
                colesterol: habColesterolEl ? habColesterolEl.value : ""
            },
            
            emergenciaFamiliar: emergEl ? emergEl.value : "",
            emergenciaNome: emergNomeEl ? emergNomeEl.value : "",
            emergenciaTel: emergTelEl ? emergTelEl.value : "",
            
            situacaoPressao: situacaoEl ? situacaoEl.value : ""
        };

        // Adiciona completedAt com fallback robusto
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            anamneseData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
        } else {
            anamneseData.completedAt = new Date().toISOString();
        }
        
        // Verifica autenticação
        const user = window.auth ? window.auth.currentUser : null;
        if (!user) {
            throw new Error("Sua sessão expirou ou você não está logado. Faça login novamente.");
        }
        
        // 1. Salva localmente de imediato (Garante velocidade instantânea e resiliência offline)
        localStorage.setItem(`anamnese_completed_${user.uid}`, 'true');
        localStorage.setItem(`anamnese_data_${user.uid}`, JSON.stringify(anamneseData));
        
        // 2. Atualiza a interface do usuário com os dados recém-preenchidos
        updateUserProfile(user, anamneseData);
        
        // 3. Sincroniza em segundo plano no Firestore (Sem await para evitar Promises travadas por falta de rede ou regras)
        if (window.db) {
            window.db.collection('users').doc(user.uid).set(anamneseData, { merge: true })
                .then(() => {
                    console.log("Anamnese sincronizada com o Firestore com sucesso!");
                })
                .catch(err => {
                    console.error("Erro em segundo plano ao salvar no Firestore:", err);
                    // Dica amigável no console para o desenvolvedor
                    if (err.message && (err.message.includes("permissions") || err.message.includes("permission") || err.message.includes("denied"))) {
                        console.warn("DICA TUMTUM: As regras do Firestore estão bloqueando escrita. Ajuste-as no painel do Firebase.");
                    }
                });
        } else {
            console.warn("Firestore offline ou indisponível. Dados salvos localmente.");
        }
        
        // 4. Redireciona imediatamente para a tela principal
        showScreen('dashboard-screen');
        
        // 5. Inicializa o gráfico de tendência semanal
        initChart();
        
    } catch (error) {
        console.error("Erro completo ao salvar anamnese:", error);
        alert("Ops! Houve um erro ao salvar suas informações: " + (error.message || error));
        if (btn) {
            btn.innerText = "Concluir";
            btn.disabled = false;
        }
    }
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    // Carrega registros de convidado (guest) se existirem
    const guestRecords = localStorage.getItem('records_guest');
    if (guestRecords) {
        try {
            mockRecords = JSON.parse(guestRecords);
        } catch (e) {
            console.error("Erro ao fazer parse dos registros de convidado:", e);
        }
    }

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
            
            // Carrega os registros salvos localmente específicos para este usuário logado
            const localRecords = localStorage.getItem(`records_${user.uid}`);
            if (localRecords) {
                try {
                    mockRecords = JSON.parse(localRecords);
                } catch (e) {
                    console.error("Erro ao carregar registros locais do usuário:", e);
                }
            } else {
                // Se for o primeiro acesso e não houver histórico, cria o default local
                localStorage.setItem(`records_${user.uid}`, JSON.stringify(mockRecords));
            }
            
            try {
                const doc = await window.db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().completedAt) {
                    // Salva sinalizador local e carrega o painel
                    localStorage.setItem(`anamnese_completed_${user.uid}`, 'true');
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
                // Se falhar a conexão com o Firestore, tentamos checar localmente se já preencheu.
                // Se não houver registro local de conclusão, abrimos a anamnese por segurança!
                const localCompleted = localStorage.getItem(`anamnese_completed_${user.uid}`);
                if (localCompleted === 'true') {
                    updateUserProfile(user);
                    showScreen('dashboard-screen');
                    initChart();
                } else {
                    document.getElementById('a-nome').value = user.displayName || "";
                    showScreen('anamnese-screen');
                    currentStep = 1;
                    updateProgress();
                }
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
            
            // Atualiza Dashboard com o novo valor de forma segura (se existirem os elementos na tela)
            const sysEl = document.getElementById('last-sys');
            if (sysEl) sysEl.innerText = sys;
            const diaEl = document.getElementById('last-dia');
            if (diaEl) diaEl.innerText = dia;
            const timeEl = document.getElementById('last-time');
            if (timeEl) timeEl.innerText = `Hoje, ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
            
            const status = getStatus(sys, dia);
            
            // Atualiza o pill de status no botão gigante se ele ainda existir
            const giantReading = document.getElementById('giant-last-reading');
            if (giantReading) {
                if (status.label === 'Normal') {
                    giantReading.style.background = 'rgba(16, 185, 129, 0.1)';
                    giantReading.style.color = '#065f46';
                    giantReading.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                } else if (status.label === 'Atenção') {
                    giantReading.style.background = 'rgba(245, 158, 11, 0.1)';
                    giantReading.style.color = '#92400e';
                    giantReading.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                } else {
                    giantReading.style.background = 'rgba(239, 68, 68, 0.1)';
                    giantReading.style.color = '#991b1b';
                    giantReading.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                }
            }
            
            // Adiciona no mock e re-renderiza
            const newRecord = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
                sys: parseInt(sys),
                dia: parseInt(dia),
                bpm: bpm || '--',
                periodo: getPeriodo(),
                condicao: condicao
            };
            
            mockRecords.unshift(newRecord);
            
            const user = window.auth ? window.auth.currentUser : null;
            if (user) {
                // Salva offline localmente de imediato
                localStorage.setItem(`records_${user.uid}`, JSON.stringify(mockRecords));
                
                // Salva no Firestore de forma assíncrona em background
                window.db.collection('users').doc(user.uid).collection('records').doc(newRecord.id.toString()).set(newRecord)
                    .catch(err => console.warn("Firestore offline. Registro mantido localmente."));
            } else {
                localStorage.setItem('records_guest', JSON.stringify(mockRecords));
            }
            
            initChart();
            if(document.getElementById('history-screen').classList.contains('active')){
                renderHistory(mockRecords);
            }

            closeModal('new-record-modal');
            recordForm.reset();
            
            // Exibe o modal dinâmico com orientações da Biomédica
            showBiomedicalAlert(newRecord.sys, newRecord.dia);
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

// Função para Logout Seguro
async function handleLogout() {
    if (confirm("Deseja mesmo sair da sua conta?")) {
        try {
            await window.auth.signOut();
            // Limpa o local storage de segurança
            localStorage.clear();
            // Recarrega a página para resetar todos os estados
            window.location.reload();
        } catch (error) {
            console.error("Erro ao sair:", error);
            alert("Erro ao tentar deslogar: " + error.message);
        }
    }
}

// Função para Iniciar Edição da Ficha de Saúde (Anamnese)
function startEditAnamnese() {
    const user = window.auth ? window.auth.currentUser : null;
    if (!user) {
        alert("Usuário não está autenticado.");
        return;
    }
    
    const localData = localStorage.getItem(`anamnese_data_${user.uid}`);
    if (localData) {
        try {
            const data = JSON.parse(localData);
            
            // 1. Preenche Passo 1 (Dados Principais)
            if (document.getElementById('a-nome')) document.getElementById('a-nome').value = data.nome || "";
            
            // Sexo
            if (data.sexo) {
                const sexBtn = Array.from(document.querySelectorAll('#step-1 button.choice-card')).find(b => b.innerText.trim().startsWith(data.sexo === 'M' ? 'Masculino' : 'Feminino'));
                if (sexBtn) selectChoice(sexBtn, 'a-sexo', data.sexo);
            }
            
            if (document.getElementById('a-idade')) document.getElementById('a-idade').value = data.idade || 60;
            if (document.getElementById('a-peso')) document.getElementById('a-peso').value = data.peso || 70;
            if (document.getElementById('a-altura')) document.getElementById('a-altura').value = data.altura || 160;
            
            // 2. Preenche Passo 2 (Cardiovascular)
            if (data.hipertensao) {
                const hiperBtn = Array.from(document.querySelectorAll('#step-2 button.choice-card')).find(b => b.innerText.trim() === data.hipertensao);
                if (hiperBtn) selectChoice(hiperBtn, 'a-hiper', data.hipertensao);
            }
            
            if (data.usaMedicamento) {
                const medBtn = Array.from(document.querySelectorAll('#step-2 button.choice-card')).find(b => b.innerText.trim() === data.usaMedicamento);
                if (medBtn) {
                    selectChoice(medBtn, 'a-med', data.usaMedicamento);
                    const medDetailsEl = document.getElementById('med-details');
                    if (medDetailsEl) {
                        if (data.usaMedicamento === 'Sim') {
                            medDetailsEl.classList.remove('hidden');
                        } else {
                            medDetailsEl.classList.add('hidden');
                        }
                    }
                }
            }
            
            if (document.getElementById('a-med-nome')) document.getElementById('a-med-nome').value = data.medicamentoNome || "";
            if (document.getElementById('a-med-freq')) document.getElementById('a-med-freq').value = data.medicamentoFreq || 1;
            
            // 3. Preenche Passo 3 (Histórico e Sintomas - Multiseletores)
            // Reseta seleções prévias do passo 3
            document.querySelectorAll('#step-3 .choice-card.multi').forEach(b => b.classList.remove('selected'));
            
            const selectedPills = [...(data.historico || []), ...(data.sintomas || [])];
            if (selectedPills.length > 0) {
                selectedPills.forEach(item => {
                    const btn = Array.from(document.querySelectorAll('#step-3 .choice-card.multi')).find(b => b.innerText.trim() === item);
                    if (btn) btn.classList.add('selected');
                });
            }
            
            // 4. Preenche Passo 4 (Hábitos)
            const habits = data.habitos || {};
            ['fisica', 'fuma', 'alcool', 'sal', 'diabetes', 'colesterol'].forEach(field => {
                const val = habits[field];
                if (val) {
                    const btn = Array.from(document.querySelectorAll(`#step-4 button.choice-card`)).find(b => {
                        const clickAttr = b.getAttribute('onclick');
                        return clickAttr && clickAttr.includes(`'a-hab-${field}'`) && b.innerText.trim() === val;
                    });
                    if (btn) selectChoice(btn, `a-hab-${field}`, val);
                }
            });
            
            // 5. Preenche Passo 5 (Emergência)
            if (data.emergenciaFamiliar) {
                const emergBtn = Array.from(document.querySelectorAll('#step-5 button.choice-card')).find(b => b.innerText.trim() === data.emergenciaFamiliar);
                if (emergBtn) {
                    selectChoice(emergBtn, 'a-emergencia', data.emergenciaFamiliar);
                    const emergDetailsEl = document.getElementById('emergencia-details');
                    if (emergDetailsEl) {
                        if (data.emergenciaFamiliar === 'Sim') {
                            emergDetailsEl.classList.remove('hidden');
                        } else {
                            emergDetailsEl.classList.add('hidden');
                        }
                    }
                }
            }
            if (document.getElementById('a-emerg-nome')) document.getElementById('a-emerg-nome').value = data.emergenciaNome || "";
            if (document.getElementById('a-emerg-tel')) document.getElementById('a-emerg-tel').value = data.emergenciaTel || "";
            
            // 6. Preenche Passo 6 (Situação)
            if (data.situacaoPressao) {
                const sitBtn = Array.from(document.querySelectorAll('#step-6 button.choice-card')).find(b => b.innerText.trim().endsWith(data.situacaoPressao));
                if (sitBtn) selectChoice(sitBtn, 'a-situacao', data.situacaoPressao);
            }
            
        } catch (e) {
            console.error("Erro ao fazer parse dos dados de anamnese para edição:", e);
        }
    } else {
        // Fallback: Se não houver dados salvos, limpa o formulário de anamnese para valores padrão
        if (document.getElementById('a-nome')) document.getElementById('a-nome').value = user.displayName || "";
        document.querySelectorAll('#anamnese-screen .choice-card').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('#anamnese-screen input[type="hidden"]').forEach(inp => inp.value = "");
        if (document.getElementById('a-idade')) document.getElementById('a-idade').value = 60;
        if (document.getElementById('a-peso')) document.getElementById('a-peso').value = 70;
        if (document.getElementById('a-altura')) document.getElementById('a-altura').value = 160;
        if (document.getElementById('med-details')) document.getElementById('med-details').classList.add('hidden');
        if (document.getElementById('emergencia-details')) document.getElementById('emergencia-details').classList.add('hidden');
    }
    
    // Inicia a tela de Anamnese no Passo 1
    showScreen('anamnese-screen');
    currentStep = 1;
    updateProgress();
}

// Expor funções globalmente para o HTML
window.showScreen = showScreen;
window.showModal = showModal;
window.closeModal = closeModal;
window.filtrarHistorico = filtrarHistorico;
window.exportarCSV = exportarCSV;
window.handleLogout = handleLogout;
window.startEditAnamnese = startEditAnamnese;

