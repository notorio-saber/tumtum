// --- PWA Service Worker ---
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.error('Erro de Service Worker:', err));
    });
}

// Detectar prompt de instalação (Android/Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // FREEMIUM UX: Exibir o banner de instalação apenas se não foi dispensado anteriormente
    if (localStorage.getItem('pwa_banner_dismissed') !== 'true') {
        const installBanner = document.getElementById('pwa-install-banner');
        if (installBanner) {
            installBanner.classList.remove('hidden');
        }
    }
});

// Fechar e ignorar banner de instalação do PWA
function dismissPwaBanner() {
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBanner) {
        installBanner.classList.add('hidden');
    }
    localStorage.setItem('pwa_banner_dismissed', 'true');
}
window.dismissPwaBanner = dismissPwaBanner;

// --- Dicas de Saúde da Dra. Layana ---
const HEALTH_TIPS = [
    "<strong>💡 Sal Oculto:</strong> Alimentos ultraprocessados são cheios de sódio escondido. Priorize temperos naturais como limão, alho, cebola e ervas finas nas suas refeições.",
    "<strong>💧 Hidratação é Vida:</strong> Beber água regularmente dilui o sangue e ajuda no bombeamento do coração, facilitando o controle natural da pressão arterial.",
    "<strong>🚶‍♀️ Caminhada Leve:</strong> Fazer 30 minutos de caminhada por dia melhora a elasticidade das artérias, reduzindo a pressão a longo prazo de forma consistente.",
    "<strong>☕ Cafeína sob Controle:</strong> O café acelera o coração e contrai vasos. Tente moderar o consumo e evite beber café 30 minutos antes de aferir sua pressão.",
    "<strong>🧘‍♂️ Respiração Protetora:</strong> Em picos de ansiedade, inspire fundo por 4 segundos, segure por 4 e expire em 6 segundos por 5 vezes. Sua pressão irá relaxar.",
    "<strong>😴 Sono e Cortisol:</strong> Dormir mal eleva o cortisol, o hormônio do estresse, que sobe os batimentos e a pressão. Priorize 7 a 8 horas de repouso por noite."
];

let currentTipIndex = -1;

function randomizeAndShowHealthTip() {
    const tipEl = document.getElementById('health-tip-content');
    if (tipEl) {
        let newIndex = Math.floor(Math.random() * HEALTH_TIPS.length);
        if (HEALTH_TIPS.length > 1 && newIndex === currentTipIndex) {
            newIndex = (newIndex + 1) % HEALTH_TIPS.length;
        }
        currentTipIndex = newIndex;
        tipEl.innerHTML = HEALTH_TIPS[currentTipIndex];
    }
}
window.randomizeAndShowHealthTip = randomizeAndShowHealthTip;
window.showHealthTip = randomizeAndShowHealthTip;

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
    if (profileName) {
        if (user.uid === 'etSpfstGkKSKmTfBploZqVMMVKu2') {
            profileName.innerHTML = `${nameToDisplay} <span class="badge-role-medico" style="font-size: 0.65rem; padding: 2px 8px; border-radius: 6px; margin-left: 8px; vertical-align: middle; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);">👑 Admin</span>`;
        } else {
            profileName.innerText = nameToDisplay;
        }
    }
    
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

    // Garantia redundante de exibição do painel admin para o UID administrador
    if (user.uid === 'etSpfstGkKSKmTfBploZqVMMVKu2') {
        const adminPanelSec = document.getElementById('admin-panel-section');
        if (adminPanelSec) adminPanelSec.classList.remove('hidden');
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
    
    // Configura o SOS Painel de Emergência na Dashboard do Paciente
    const sosWidget = document.getElementById('patient-emergency-widget');
    if (sosWidget) {
        const isPatient = currentUserRole === 'paciente';
        
        if (isPatient) {
            sosWidget.classList.remove('hidden');
            
            // Adicionar tag premium dinâmica ao título se for paciente trial
            const headerTitle = sosWidget.querySelector('h3');
            if (headerTitle) {
                if (!subscriptionActive) {
                    headerTitle.innerHTML = 'SOS • Painel de Emergência <span style="font-size: 0.65rem; background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 6px; border-radius: 8px; margin-left: 6px; border: 1px solid rgba(59, 130, 246, 0.15); font-weight: 700; font-family: \'Plus Jakarta Sans\', sans-serif;">Premium 👑</span>';
                } else {
                    headerTitle.innerHTML = 'SOS • Painel de Emergência';
                }
            }
            
            let emergNome = "Familiar";
            let emergTel = "";
            
            if (data) {
                emergNome = data.emergenciaNome || "Familiar";
                emergTel = data.emergenciaTel || "";
            }
            
            const cleanTel = emergTel.replace(/\D/g, "");
            const callBtn = document.getElementById('btn-widget-call-contact');
            const callLbl = document.getElementById('lbl-widget-call-contact');
            
            if (callBtn) {
                if (!subscriptionActive) {
                    // Direcionar para o Paywall no plano grátis
                    callBtn.href = "javascript:showPaywall()";
                    callBtn.style.opacity = '1';
                    callBtn.style.pointerEvents = 'auto';
                } else if (cleanTel) {
                    callBtn.href = `tel:${cleanTel}`;
                    callBtn.style.opacity = '1';
                    callBtn.style.pointerEvents = 'auto';
                } else {
                    callBtn.href = '#';
                    callBtn.style.opacity = '0.5';
                    callBtn.style.pointerEvents = 'none';
                }
            }
            if (callLbl) {
                callLbl.innerText = emergNome !== "Familiar" ? `Ligar p/ ${emergNome.split(' ')[0]}` : "Ligar Familiar";
            }
            
            // Solicitar permissão de localização preemptivamente ao carregar o dashboard
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log("GPS pré-autorizado com sucesso para fluxos rápidos de SOS.");
                    },
                    (error) => {
                        console.warn("Permissão de GPS recusada preemptivamente ou indisponível:", error);
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 300000
                    }
                );
            }
        } else {
            sosWidget.classList.add('hidden');
        }
    }
    
    // Ocultar dados médicos e botão de edição se o usuário logado for Médico ou Familiar
    const clinicalWrapper = document.getElementById('profile-clinical-wrapper');
    const editAnamneseBtn = document.getElementById('profile-edit-anamnese-btn');
    
    if (currentUserRole === 'paciente') {
        if (clinicalWrapper) clinicalWrapper.classList.remove('hidden');
        if (editAnamneseBtn) editAnamneseBtn.classList.remove('hidden');
    } else {
        if (clinicalWrapper) clinicalWrapper.classList.add('hidden');
        if (editAnamneseBtn) editAnamneseBtn.classList.add('hidden');
    }
    
    // Renderiza a dica de saúde da Dra. Layana na Home se for paciente
    if (currentUserRole === 'paciente') {
        showHealthTip();
    }
    
    // Atualiza/Recria os ícones dinâmicos do Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Função global para enviar localização de emergência via WhatsApp
function sendEmergencyLocation(btn) {
    if (!btn) return;
    
    // FREEMIUM GATING: Bloquear envio de localização no plano grátis
    if (!subscriptionActive) {
        showPaywall();
        return;
    }
    
    const originalHtml = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.disabled = true;
    
    // Exibe feedback de progresso premium
    btn.innerHTML = `<span>🌐 Obtendo GPS...</span>`;
    
    // Timer de fallback de 4 segundos: se o GPS travar ou demorar, abre o WhatsApp sem as coordenadas
    let fallbackTriggered = false;
    const fallbackTimeout = setTimeout(() => {
        fallbackTriggered = true;
        console.warn("Tempo limite de geolocalização atingido. Usando fallback sem GPS.");
        proceedWithLocation(null, null);
    }, 4000);
    
    if (!navigator.geolocation) {
        clearTimeout(fallbackTimeout);
        proceedWithLocation(null, null);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            if (fallbackTriggered) return;
            clearTimeout(fallbackTimeout);
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            proceedWithLocation(lat, lng);
        },
        (error) => {
            if (fallbackTriggered) return;
            clearTimeout(fallbackTimeout);
            console.error("Erro na geolocalização, usando fallback imediato sem GPS:", error);
            proceedWithLocation(null, null);
        },
        {
            enableHighAccuracy: false, // Muito mais rápido e confiável para triangulação interna
            timeout: 3000,             // Tempo limite de resposta da API do navegador
            maximumAge: 300000         // Permite usar coordenadas salvas de até 5 minutos
        }
    );
    
    function proceedWithLocation(lat, lng) {
        const user = window.auth ? window.auth.currentUser : null;
        let data = null;
        if (user) {
            const localData = localStorage.getItem(`anamnese_data_${user.uid}`);
            if (localData) {
                try {
                    data = JSON.parse(localData);
                } catch(e) {}
            }
        }
        
        let emergTel = "";
        let emergNome = "Familiar";
        
        if (data) {
            emergTel = data.emergenciaTel || "";
            emergNome = data.emergenciaNome || "Familiar";
        }
        
        // Fallback: ler do elemento da interface de perfil
        if (!emergTel || emergTel === "--") {
            const emergLinkEl = document.getElementById('p-emerg-tel');
            if (emergLinkEl) {
                const spanEl = emergLinkEl.querySelector('span');
                if (spanEl && spanEl.innerText !== "--") {
                    emergTel = spanEl.innerText;
                }
            }
            const emergNameEl = document.getElementById('p-emerg-nome');
            if (emergNameEl && emergNameEl.innerText !== "--") {
                emergNome = emergNameEl.innerText;
            }
        }
        
        if (!emergTel || emergTel === "--") {
            alert("⚠️ Você não possui um contato de emergência configurado! Por favor, acesse seu Perfil e clique em 'Editar Ficha de Saúde' para preencher o passo 5.");
            resetBtn();
            return;
        }
        
        const cleanTel = emergTel.replace(/\D/g, "");
        const primeNome = emergNome.split(' ')[0];
        
        let message = `🚨 *ALERTA DE SOS - TUMTUM APP*\n\nOlá, ${primeNome}! `;
        
        if (lat && lng) {
            message += `Estou precisando de ajuda agora! Minha localização geográfica em tempo real é:\n📍 Google Maps: https://www.google.com/maps?q=${lat},${lng}\n\n`;
        } else {
            message += `Estou precisando de ajuda urgente agora!\n\n`;
        }
        
        // Adicionar contexto clínico de pressão caso haja registros recentes
        if (mockRecords && mockRecords.length > 0) {
            const lastRec = mockRecords[0];
            const status = getStatus(lastRec.sys, lastRec.dia);
            
            message += `🩺 *Minha última aferição de pressão:*\n`;
            message += `• Pressão: *${lastRec.sys}/${lastRec.dia} mmHg*\n`;
            message += `• Classificação: *${status.label}*\n`;
            message += `• Frequência Cardíaca: ${lastRec.bpm} BPM\n`;
            message += `• Condição: ${lastRec.condicao}\n`;
            message += `• Aferido hoje às ${lastRec.time} (${getPeriodo()}).\n\n`;
        }
        
        message += `Por favor, entre em contato comigo ou venha ao meu encontro o mais rápido possível!`;
        
        // Abrir link do WhatsApp usando redirecionamento local para evitar o Popup Blocker de callbacks assíncronos em navegadores móveis
        const waUrl = `https://wa.me/55${cleanTel}?text=${encodeURIComponent(message)}`;
        window.location.href = waUrl;
        
        resetBtn();
    }
    
    function resetBtn() {
        btn.innerHTML = originalHtml;
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}
window.sendEmergencyLocation = sendEmergencyLocation;

// Dados do histórico do aplicativo (inicia zerado para novas contas de acordo com as regras de negócio)
let mockRecords = [];

// Navegação de Telas e Controle Dinâmico de Abas
function updateNavigationByRole() {
    const navInicio = document.getElementById('nav-inicio');
    const navHistorico = document.getElementById('nav-historico');
    const navAcompanhar = document.getElementById('nav-acompanhar');
    const navPerfil = document.getElementById('nav-perfil');
    
    if (currentUserRole === 'paciente') {
        if (navInicio) navInicio.style.display = '';
        if (navHistorico) navHistorico.style.display = '';
        if (navAcompanhar) navAcompanhar.style.display = '';
        if (navPerfil) navPerfil.style.display = '';
    } else {
        // Familiar ou Médico: NUNCA vê "Início" (Dashboard do paciente)
        if (navInicio) navInicio.style.display = 'none';
        
        // Sempre visíveis para acompanhantes
        if (navHistorico) navHistorico.style.display = '';
        if (navAcompanhar) navAcompanhar.style.display = '';
        if (navPerfil) navPerfil.style.display = '';
    }
}
window.updateNavigationByRole = updateNavigationByRole;

function showScreen(screenId) {
    // FREEMIUM GATING: Bloquear acesso a Histórico ou Acompanhantes no plano grátis
    if (currentUserRole === 'paciente' && !subscriptionActive) {
        if (screenId === 'history-screen' || screenId === 'companions-screen') {
            showPaywall();
            return;
        }
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Resetar navegação inferior
    document.querySelectorAll('.bottom-nav .nav-item').forEach(nav => nav.classList.remove('active'));
    
    // Destaque preciso do botão correspondente de forma index-independente usando IDs
    if (screenId === 'dashboard-screen') {
        const btn = document.getElementById('nav-inicio');
        if (btn) btn.classList.add('active');
        if (currentUserRole === 'paciente') {
            randomizeAndShowHealthTip();
        }
    } else if (screenId === 'history-screen') {
        const btn = document.getElementById('nav-historico');
        if (btn) btn.classList.add('active');
    } else if (screenId === 'companions-screen') {
        const btn = document.getElementById('nav-acompanhar');
        if (btn) btn.classList.add('active');
    } else if (screenId === 'profile-screen') {
        const btn = document.getElementById('nav-perfil');
        if (btn) btn.classList.add('active');
    }
    
    if(screenId === 'history-screen') {
        renderHistory(mockRecords);
        initChart();
    }
    
    window.scrollTo(0, 0);
}

function showModal(modalId) {
    // FREEMIUM CHECK: Se tentar abrir o modal de novo registro e já atingiu o limite grátis de 3 registros
    if (modalId === 'new-record-modal' && currentUserRole === 'paciente' && !subscriptionActive && mockRecords && mockRecords.length >= 3) {
        showPaywall();
        return;
    }
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Funções globais para exibir e ocultar o Paywall Premium
function showPaywall() {
    const paywallOverlay = document.getElementById('paywall-overlay');
    if (!paywallOverlay) return;
    
    paywallOverlay.classList.remove('hidden');
    
    // Atualiza dinamicamente o botão de fechar baseado no estado do trial
    const closeBtn = document.getElementById('btn-paywall-close');
    if (closeBtn) {
        if (currentUserRole === 'paciente' && !subscriptionActive && mockRecords && mockRecords.length >= 3) {
            closeBtn.innerText = "Voltar para o Dashboard (Modo Leitura)";
        } else {
            closeBtn.innerText = "Voltar para o Teste Grátis";
        }
    }
}
window.showPaywall = showPaywall;

function closePaywall() {
    const paywallOverlay = document.getElementById('paywall-overlay');
    if (paywallOverlay) {
        paywallOverlay.classList.add('hidden');
    }
}
window.closePaywall = closePaywall;

function renderHistory(records) {
    const list = document.getElementById('history-list');
    if(!list) return;
    
    list.innerHTML = '';
    
    const filtersWrapper = document.getElementById('history-filters-wrapper');
    const chipsWrapper = document.getElementById('history-chips-wrapper');
    const chartCard = document.getElementById('history-chart-card');
    
    // Se for acompanhante/médico e não tiver paciente ativo
    if (currentUserRole !== 'paciente' && !activePatientUid) {
        if (filtersWrapper) filtersWrapper.style.display = 'none';
        if (chipsWrapper) chipsWrapper.style.display = 'none';
        if (chartCard) chartCard.style.display = 'none';
        
        list.innerHTML = `
            <div class="card-premium glass" style="text-align: center; padding: 32px 20px; border: 1px dashed rgba(15, 23, 42, 0.08); margin-top: 20px; width: 100%;">
                <div class="avatar-circle flex-shrink-0 shadow-glow" style="width: 56px; height: 56px; margin: 0 auto 16px; background: rgba(239, 68, 68, 0.05); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                    <i data-lucide="heart-handshake" style="width: 24px; height: 24px; stroke-width: 2;"></i>
                </div>
                <h3 class="font-bold text-base" style="color: var(--text-main); margin-bottom: 8px; font-weight: 800;">Nenhum Paciente Vinculado</h3>
                <p class="text-sm text-slate-500 mb-6" style="line-height: 1.5; max-width: 280px; margin-left: auto; margin-right: auto;">
                    Por favor, utilize a aba <strong>"Acompanhar"</strong> para buscar e vincular o e-mail ou código do paciente que você deseja monitorar.
                </p>
                <button onclick="showScreen('companions-screen')" class="btn-primary shadow-glow" style="padding: 12px 24px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; width: auto; display: inline-flex; align-items: center; gap: 8px; margin: 0 auto;">
                    <span>Vincular Paciente Agora</span>
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    // Restaura exibição de filtros para usuários com registros válidos
    if (filtersWrapper) filtersWrapper.style.display = '';
    if (chipsWrapper) chipsWrapper.style.display = '';
    if (chartCard) chartCard.style.display = '';
    
    records.forEach(record => {
        const status = getStatus(record.sys, record.dia);
        const card = document.createElement('div');
        card.className = `history-card glass border-l-4 ${status.border}`;
        
        // Exclusivo do Médico: PAM (Pressão Arterial Média) e PP (Pressão de Pulso)
        let medicalDetailHtml = '';
        if (currentUserRole === 'medico') {
            const pam = Math.round((parseInt(record.sys) + 2 * parseInt(record.dia)) / 3);
            const pp = parseInt(record.sys) - parseInt(record.dia);
            medicalDetailHtml = `
                <div style="margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap;">
                    <span class="badge-role-medico" style="font-size: 0.62rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25);">PAM: ${pam} mmHg</span>
                    <span class="badge-role-medico" style="font-size: 0.62rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; background: rgba(148, 163, 184, 0.15); color: #475569; border: 1px solid rgba(148, 163, 184, 0.25);">PP: ${pp} mmHg</span>
                </div>
            `;
        }
        
        const deleteButtonHtml = currentUserRole === 'paciente' ? `
            <button onclick="deleteRecord(${record.id})" style="background: transparent; border: none; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; color: var(--primary); transition: all 0.2s;" title="Excluir Aferição">
                <i data-lucide="trash-2" style="width: 15px; height: 15px; stroke-width: 2.5;"></i>
            </button>
        ` : '';

        card.innerHTML = `
            <div class="history-info">
                <div class="date-time">${formatDate(record.date)} às ${record.time} • ${record.periodo}</div>
                <div class="values">${record.sys} / ${record.dia} <span class="bpm">❤ ${record.bpm} bpm</span></div>
                <div class="text-xs text-slate-500 mt-1">${record.condicao}</div>
                ${medicalDetailHtml}
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 8px;">
                <div class="${status.class}" style="font-size: 0.7rem; padding: 4px 8px;">${status.label}</div>
                ${deleteButtonHtml}
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
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    if (mainChart) mainChart.destroy();

    // Dias da semana fixos de Domingo a Sábado
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const hasData = mockRecords && mockRecords.length > 0;
    
    // Se não houver registros, os arrays de dados ficam vazios para não desenhar nenhuma linha
    const sysData = hasData ? [null, null, null, null, null, null, null] : [];
    const diaData = hasData ? [null, null, null, null, null, null, null] : [];
    
    // Contadores para computar a média caso haja múltiplos registros no mesmo dia
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    if (hasData) {
        // Mapeia registros reais para o dia da semana correspondente
        mockRecords.forEach(r => {
            try {
                const dateParts = r.date.split('-');
                const recordDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                const dayOfWeek = recordDate.getDay(); // 0 = Domingo, 6 = Sábado
                
                if (counts[dayOfWeek] === 0) {
                    // Primeiro registro do dia
                    sysData[dayOfWeek] = r.sys;
                    diaData[dayOfWeek] = r.dia;
                    counts[dayOfWeek] = 1;
                } else {
                    // Acumula média do dia
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
            if (counts[i] > 0) {
                sysData[i] = Math.round(sysData[i]);
                diaData[i] = Math.round(diaData[i]);
            }
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
                pointHoverRadius: 6,
                spanGaps: true
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
                pointHoverRadius: 5,
                spanGaps: true
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
// --- Global Roles & Subscription State ---
let selectedLoginRole = 'paciente';
let selectedInviteRole = 'familiar';
let currentUserRole = 'paciente';
let activePatientUid = null;
let subscriptionActive = true;

// Expor seletores para o HTML
window.selectLoginRole = (role) => {
    selectedLoginRole = role;
    const loginRoleEl = document.getElementById('login-role');
    if (loginRoleEl) loginRoleEl.value = role;
    
    // Switch visual ativo
    document.querySelectorAll('#login-screen .choice-card').forEach(btn => {
        btn.classList.remove('selected');
    });
    const targetBtn = document.getElementById(`role-${role}`);
    if (targetBtn) targetBtn.classList.add('selected');
    
    // Armazena síncronamente como override do Admin para viabilizar seus testes sem interferência de cache antigo
    localStorage.setItem('admin_override_role', role);
};

window.changeUserRole = async (role) => {
    const user = window.auth ? window.auth.currentUser : null;
    if (!user) {
        alert("Você precisa estar logado para alterar seu papel de acesso.");
        return;
    }
    
    // Switch visual ativo imediato localmente
    document.querySelectorAll('[id^="profile-role-"]').forEach(btn => btn.classList.remove('selected'));
    const targetBtn = document.getElementById(`profile-role-${role}`);
    if (targetBtn) targetBtn.classList.add('selected');
    
    try {
        if (targetBtn) {
            targetBtn.style.opacity = '0.7';
        }
        
        if (user.uid === 'etSpfstGkKSKmTfBploZqVMMVKu2') {
            // Conta Admin: Usa override local 100% livre de erros de regras do Firestore!
            localStorage.setItem('admin_override_role', role);
            localStorage.setItem('temp_login_role', role);
        } else {
            // Outros usuários (caso visível): Atualiza via Firestore
            const updates = { role: role };
            if (role === 'paciente') {
                updates.subscriptionActive = false;
            } else {
                updates.subscriptionActive = true;
            }
            if (window.db) {
                await window.db.collection('users').doc(user.uid).update(updates);
            }
            localStorage.setItem('temp_login_role', role);
        }
        
        // Recarrega a página para reiniciar a tela sob as novas regras visuais
        window.location.reload();
    } catch (e) {
        console.error("Erro ao alterar papel de acesso:", e);
        alert("Não foi possível alterar seu papel de acesso: " + e.message);
        window.location.reload();
    }
};

window.selectInviteRole = (role) => {
    selectedInviteRole = role;
    const inviteRoleEl = document.getElementById('invite-role');
    if (inviteRoleEl) inviteRoleEl.value = role;
    
    document.querySelectorAll('#invite-role-familiar-btn, #invite-role-medico-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    if (role === 'familiar') {
        const famBtn = document.getElementById('invite-role-familiar-btn');
        if (famBtn) famBtn.classList.add('selected');
    } else {
        const medBtn = document.getElementById('invite-role-medico-btn');
        if (medBtn) medBtn.classList.add('selected');
    }
};

// Funções de Acompanhamento (Paciente)
window.copyPatientCode = () => {
    const codeSpan = document.getElementById('my-patient-code');
    if (codeSpan) {
        const text = codeSpan.innerText;
        if (text && text !== "Carregando código...") {
            navigator.clipboard.writeText(text)
                .then(() => alert("📋 Código copiado para a área de transferência!"))
                .catch(err => alert("Erro ao copiar código: " + err));
        }
    }
};

window.shareCompanionGmail = () => {
    const user = window.auth.currentUser;
    if (!user) return;
    const code = user.uid;
    const subject = encodeURIComponent("Convite para me acompanhar no TumTum App");
    const body = encodeURIComponent(`Olá! Gostaria de te convidar para acompanhar minhas aferições de pressão no TumTum App.\n\nCódigo do Paciente: ${code}\nInstale o app e adicione meu e-mail (${user.email}) ou meu código na aba Acompanhar!\n\nTumTum App - Saúde em dia, vida tranquila.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
};

window.handleAddCompanion = async () => {
    const emailInput = document.getElementById('invite-email');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
    const role = document.getElementById('invite-role').value;
    
    if (!email) {
        alert("Por favor, digite o e-mail do acompanhante!");
        return;
    }
    
    const user = window.auth.currentUser;
    if (!user) return;
    
    try {
        const snap = await window.db.collection('users').where('email', '==', email).get();
        if (snap.empty) {
            alert("⚠️ Usuário não encontrado! Certifique-se de que o acompanhante já entrou no app pelo menos uma vez com o Google.");
            return;
        }
        
        const targetDoc = snap.docs[0];
        const targetUid = targetDoc.id;
        const targetData = targetDoc.data();
        
        // Atualizar o documento do Paciente (adicionar o acompanhante)
        const myDocRef = window.db.collection('users').doc(user.uid);
        const myDoc = await myDocRef.get();
        const myData = myDoc.data();
        
        const companions = myData.companions || {};
        companions[targetUid] = {
            uid: targetUid,
            name: targetData.nome || targetData.displayName || "Sem Nome",
            email: email,
            role: role
        };
        await myDocRef.update({ companions });
        
        // Atualizar o documento do Acompanhante (adicionar o paciente)
        const targetDocRef = window.db.collection('users').doc(targetUid);
        const targetPatients = targetData.patients || {};
        targetPatients[user.uid] = {
            uid: user.uid,
            name: myData.nome || user.displayName || "Paciente",
            email: user.email
        };
        await targetDocRef.update({ patients: targetPatients, role: role });
        
        alert("✨ Acompanhante vinculado com sucesso!");
        emailInput.value = "";
        window.loadCompanionsPage();
    } catch (e) {
        console.error("Erro ao vincular acompanhante:", e);
        alert("Erro ao vincular: " + e.message);
    }
};

window.handleAddPatient = async () => {
    const inputEl = document.getElementById('target-patient-input');
    const searchVal = inputEl ? inputEl.value.trim() : "";
    
    if (!searchVal) {
        alert("Por favor, digite o e-mail ou código do paciente!");
        return;
    }
    
    const user = window.auth.currentUser;
    if (!user) return;
    
    try {
        let patientUid = "";
        let patientData = null;
        
        if (searchVal.includes('@')) {
            const snap = await window.db.collection('users').where('email', '==', searchVal.toLowerCase()).get();
            if (snap.empty) {
                alert("⚠️ Paciente não encontrado pelo e-mail! Certifique-se de que ele já fez login no app.");
                return;
            }
            patientUid = snap.docs[0].id;
            patientData = snap.docs[0].data();
        } else {
            const doc = await window.db.collection('users').doc(searchVal).get();
            if (!doc.exists) {
                alert("⚠️ Código de paciente não encontrado!");
                return;
            }
            patientUid = doc.id;
            patientData = doc.data();
        }
        
        // Atualizar o documento do paciente (adicionar eu como acompanhante)
        const myDocRef = window.db.collection('users').doc(user.uid);
        const myDoc = await myDocRef.get();
        const myData = myDoc.data();
        const myRole = myData.role || 'familiar';
        
        const targetDocRef = window.db.collection('users').doc(patientUid);
        const companions = patientData.companions || {};
        companions[user.uid] = {
            uid: user.uid,
            name: myData.nome || user.displayName || "Acompanhante",
            email: user.email,
            role: myRole
        };
        await targetDocRef.update({ companions });
        
        // Atualizar meu próprio documento (adicionar o paciente)
        const myPatients = myData.patients || {};
        myPatients[patientUid] = {
            uid: patientUid,
            name: patientData.nome || "Paciente",
            email: patientData.email || ""
        };
        await myDocRef.update({ patients: myPatients });
        
        alert("✨ Paciente vinculado com sucesso!");
        inputEl.value = "";
        
        localStorage.setItem(`active_patient_uid_${user.uid}`, patientUid);
        window.loadCompanionsPage();
        location.reload();
    } catch (e) {
        console.error("Erro ao vincular paciente:", e);
        alert("Erro ao vincular: " + e.message);
    }
};

window.removeCompanion = async (companionUid) => {
    const user = window.auth.currentUser;
    if (!user) return;
    if (!confirm("Deseja realmente desvincular este acompanhante?")) return;
    
    try {
        const myDocRef = window.db.collection('users').doc(user.uid);
        const myDoc = await myDocRef.get();
        const companions = myDoc.data().companions || {};
        delete companions[companionUid];
        await myDocRef.update({ companions });
        
        // Remove no lado do companheiro também
        await window.db.collection('users').doc(companionUid).get().then(async (doc) => {
            if (doc.exists) {
                const p = doc.data().patients || {};
                delete p[user.uid];
                await window.db.collection('users').doc(companionUid).update({ patients: p });
            }
        });
        
        alert("Acompanhante desvinculado com sucesso!");
        window.loadCompanionsPage();
    } catch (e) {
        alert("Erro ao remover: " + e.message);
    }
};

window.removePatient = async (patientUid) => {
    const user = window.auth.currentUser;
    if (!user) return;
    if (!confirm("Deseja realmente desvincular este paciente?")) return;
    
    try {
        const myDocRef = window.db.collection('users').doc(user.uid);
        const myDoc = await myDocRef.get();
        const p = myDoc.data().patients || {};
        delete p[patientUid];
        await myDocRef.update({ patients: p });
        
        // Remove no lado do paciente
        await window.db.collection('users').doc(patientUid).get().then(async (doc) => {
            if (doc.exists) {
                const companions = doc.data().companions || {};
                delete companions[user.uid];
                await window.db.collection('users').doc(patientUid).update({ companions });
            }
        });
        
        if (localStorage.getItem(`active_patient_uid_${user.uid}`) === patientUid) {
            localStorage.removeItem(`active_patient_uid_${user.uid}`);
        }
        
        alert("Paciente desvinculado com sucesso!");
        window.loadCompanionsPage();
        location.reload();
    } catch (e) {
        alert("Erro ao remover: " + e.message);
    }
};

window.setActivePatient = (patientUid) => {
    const user = window.auth.currentUser;
    if (!user) return;
    localStorage.setItem(`active_patient_uid_${user.uid}`, patientUid);
    location.reload();
};

window.loadCompanionsPage = async () => {
    const user = window.auth.currentUser;
    if (!user) return;
    
    // Define o código do paciente IMEDIATAMENTE (sem esperar o Firestore) para evitar travamentos de 'Carregando...'
    const myPatientCodeEl = document.getElementById('my-patient-code');
    if (myPatientCodeEl) myPatientCodeEl.innerText = user.uid;
    
    try {
        const doc = await window.db.collection('users').doc(user.uid).get();
        if (!doc.exists) return;
        
        const data = doc.data();
        const role = data.role || 'paciente';
        
        if (role === 'paciente') {
            document.getElementById('patient-companions-view').classList.remove('hidden');
            document.getElementById('companion-patients-view').classList.add('hidden');
            
            // Código do paciente
            const myPatientCodeEl = document.getElementById('my-patient-code');
            if (myPatientCodeEl) myPatientCodeEl.innerText = user.uid;
            
            // Lista de acompanhantes
            const listContainer = document.getElementById('companions-list');
            if (listContainer) {
                listContainer.innerHTML = "";
                const companions = data.companions || {};
                const keys = Object.keys(companions);
                
                if (keys.length === 0) {
                    listContainer.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">Nenhum acompanhante cadastrado.</p>`;
                } else {
                    keys.forEach(k => {
                        const comp = companions[k];
                        const displayRole = comp.role === 'medico' ? 'Médico' : 'Familiar';
                        const badgeClass = comp.role === 'medico' ? 'badge-role-medico' : 'badge-role-familiar';
                        
                        listContainer.innerHTML += `
                            <div class="admin-user-card" style="padding: 10px 14px;">
                                <div style="text-align: left;">
                                    <h4 class="font-bold text-sm" style="margin: 0;">${comp.name}</h4>
                                    <span class="${badgeClass}" style="margin-top: 4px; display: inline-block;">${displayRole}</span>
                                </div>
                                <button onclick="removeCompanion('${comp.uid}')" style="background: transparent; border: none; cursor: pointer; color: #ef4444;">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        `;
                    });
                }
            }
        } else {
            // Familiar ou Médico
            document.getElementById('patient-companions-view').classList.add('hidden');
            document.getElementById('companion-patients-view').classList.remove('hidden');
            
            const listContainer = document.getElementById('accompanied-patients-list');
            if (listContainer) {
                listContainer.innerHTML = "";
                const patients = data.patients || {};
                const keys = Object.keys(patients);
                const activeId = localStorage.getItem(`active_patient_uid_${user.uid}`);
                
                if (keys.length === 0) {
                    listContainer.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">Você ainda não acompanha nenhum paciente.</p>`;
                } else {
                    keys.forEach(k => {
                        const pat = patients[k];
                        const isActive = pat.uid === activeId;
                        
                        listContainer.innerHTML += `
                            <div class="admin-user-card" style="padding: 12px 14px; border: ${isActive ? '2px solid var(--primary)' : '1px solid rgba(15, 23, 42, 0.06)'}; background: ${isActive ? 'white' : 'rgba(255, 255, 255, 0.6)'};">
                                <div style="text-align: left; cursor: pointer; flex-grow: 1;" onclick="setActivePatient('${pat.uid}')">
                                    <h4 class="font-bold text-sm" style="margin: 0; display: flex; align-items: center; gap: 6px;">
                                        ${pat.name} ${isActive ? '<span style="font-size: 0.6rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">Ativo</span>' : ''}
                                    </h4>
                                    <p class="text-xs text-slate-400" style="margin-top: 2px;">${pat.email}</p>
                                </div>
                                <button onclick="removePatient('${pat.uid}')" style="background: transparent; border: none; cursor: pointer; color: #ef4444; margin-left: 10px;">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        `;
                    });
                }
            }
        }
        lucide.createIcons();
    } catch (e) {
        console.error("Erro ao carregar página de acompanhantes:", e);
    }
};

// Funções de Painel Admin (Dra. Layana - etSpfstGkKSKmTfBploZqVMMVKu2)
window.openAdminModal = () => {
    showModal('admin-users-modal');
    window.loadAdminUsers();
};

window.loadAdminUsers = async () => {
    const container = document.getElementById('admin-users-container');
    if (!container) return;
    
    try {
        container.innerHTML = `<p class="text-sm text-slate-400 text-center py-8">Carregando usuários do banco...</p>`;
        const snap = await window.db.collection('users').get();
        container.innerHTML = "";
        
        snap.forEach(doc => {
            const user = doc.data();
            const userId = doc.id;
            const subActive = user.subscriptionActive !== false; // true por padrão
            const displayRole = user.role || 'paciente';
            
            container.innerHTML += `
                <div class="admin-user-card">
                    <div style="text-align: left; max-width: 60%;">
                        <h4 class="font-bold text-sm" style="margin: 0; color: var(--text-main);">${user.nome || user.displayName || 'Sem Nome'}</h4>
                        <p class="text-xs text-slate-400 truncate" style="margin: 2px 0 0 0;">${user.email || 'Sem e-mail'}</p>
                        <div style="margin-top: 6px;">
                            <span class="badge-role-${displayRole}">${displayRole}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="btn-status-toggle ${subActive ? 'active' : 'inactive'}" onclick="toggleUserSubscription('${userId}', ${subActive})">
                            ${subActive ? 'Ativo' : 'Inativo'}
                        </button>
                        <button class="btn-delete-admin" onclick="deleteUserAccount('${userId}')" title="Excluir Conta">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } catch (e) {
        console.error("Erro ao carregar usuários admin:", e);
        container.innerHTML = `<p class="text-sm text-red-500 text-center py-8">Erro ao carregar: ${e.message}</p>`;
    }
};

window.toggleUserSubscription = async (userId, currentStatus) => {
    try {
        await window.db.collection('users').doc(userId).update({
            subscriptionActive: !currentStatus
        });
        window.loadAdminUsers();
    } catch (e) {
        alert("Erro ao alterar assinatura: " + e.message);
    }
};

window.deleteUserAccount = async (userId) => {
    if (!confirm("Tem certeza de que deseja excluir permanentemente esta conta?")) return;
    try {
        await window.db.collection('users').doc(userId).delete();
        alert("Conta removida com sucesso!");
        window.loadAdminUsers();
    } catch (e) {
        alert("Erro ao excluir conta: " + e.message);
    }
};

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
                // Salva a role selecionada temporariamente para gravar na criação do doc
                localStorage.setItem('temp_login_role', selectedLoginRole);
                await window.auth.signInWithPopup(window.googleProvider);
            } catch (error) {
                console.error("Erro no login:", error);
                alert("Erro ao tentar fazer login: " + error.message);
                loginBtn.innerHTML = originalBtnHtml;
            }
        });
    }

    // Monitorar estado de autenticação
    window.auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Atualiza com dados do Google Auth
            updateUserProfile(user);
            
            try {
                // 1. Verificar/Carregar documento do Usuário no Firestore
                let doc = await window.db.collection('users').doc(user.uid).get();
                
                const tempRole = localStorage.getItem('temp_login_role');
                if (user.uid === 'etSpfstGkKSKmTfBploZqVMMVKu2') {
                    // Conta Admin: 100% blindada contra erros de permissão de escrita do Firestore!
                    if (tempRole) {
                        localStorage.setItem('admin_override_role', tempRole);
                    }
                    if (!doc.exists) {
                        const initialData = {
                            uid: user.uid,
                            email: user.email || "",
                            displayName: user.displayName || "",
                            role: 'paciente',
                            subscriptionActive: true,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        await window.db.collection('users').doc(user.uid).set(initialData, { merge: true });
                        doc = await window.db.collection('users').doc(user.uid).get();
                    }
                } else {
                    // Usuário Comum: Fluxo padrão seguro com Firestore (Bloqueado contra alterações de papel acidentais no login)
                    if (!doc.exists) {
                        const finalRole = tempRole || 'paciente';
                        const initialData = {
                            uid: user.uid,
                            email: user.email || "",
                            displayName: user.displayName || "",
                            role: finalRole,
                            subscriptionActive: finalRole === 'paciente' ? false : true,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        await window.db.collection('users').doc(user.uid).set(initialData, { merge: true });
                        doc = await window.db.collection('users').doc(user.uid).get();
                    }
                }
                localStorage.removeItem('temp_login_role');
                
                const data = doc.data() || {};
                currentUserRole = data.role || 'paciente';
                
                // Salvar o papel de usuário carregado em cache para fallbacks offline/segurança
                localStorage.setItem(`user_role_${user.uid}`, currentUserRole);

                // Exibe alerta amigável de papel de conta conflitante (mismatch)
                if (tempRole && tempRole !== currentUserRole && user.uid !== 'etSpfstGkKSKmTfBploZqVMMVKu2') {
                    const roleNames = {
                        paciente: "Paciente",
                        medico: "Médico",
                        familiar: "Acompanhante"
                    };
                    const selectedName = roleNames[tempRole] || tempRole;
                    const permanentName = roleNames[currentUserRole] || currentUserRole;
                    
                    const modalText = `Você tentou entrar como <strong>${selectedName}</strong>, mas identificamos uma conta de <strong>${permanentName}</strong> vinculada a este e-mail.`;
                    
                    const mismatchTextEl = document.getElementById('mismatch-modal-text');
                    const mismatchBtnEl = document.getElementById('mismatch-modal-btn');
                    
                    if (mismatchTextEl) mismatchTextEl.innerHTML = modalText;
                    if (mismatchBtnEl) {
                        mismatchBtnEl.innerHTML = `Entrar como ${permanentName}`;
                        mismatchBtnEl.onclick = () => {
                            closeModal('role-mismatch-modal');
                        };
                    }
                    
                    showModal('role-mismatch-modal');
                }
                
                // Aplicar override de papel local para o administrador (Dra. Layana) para testes rápidos e sem erro de permissões
                if (user.uid === 'etSpfstGkKSKmTfBploZqVMMVKu2') {
                    const override = localStorage.getItem('admin_override_role');
                    if (override) {
                        currentUserRole = override;
                    }
                    // Exibir o seletor premium de papel apenas para o administrador
                    const roleSelectorWrapper = document.getElementById('profile-role-selector-wrapper');
                    if (roleSelectorWrapper) roleSelectorWrapper.classList.remove('hidden');
                } else {
                    // Ocultar com absoluta certeza para qualquer usuário comum
                    const roleSelectorWrapper = document.getElementById('profile-role-selector-wrapper');
                    if (roleSelectorWrapper) roleSelectorWrapper.classList.add('hidden');
                }

                // Destacar o papel ativo no painel de perfil
                document.querySelectorAll('[id^="profile-role-"]').forEach(btn => btn.classList.remove('selected'));
                const activeProfileRoleBtn = document.getElementById(`profile-role-${currentUserRole}`);
                if (activeProfileRoleBtn) activeProfileRoleBtn.classList.add('selected');

                // Garantia absoluta de controle visual da Ficha de Saúde (Anamnese) no perfil do usuário
                const clinicalWrapper = document.getElementById('profile-clinical-wrapper');
                const editAnamneseBtn = document.getElementById('profile-edit-anamnese-btn');
                if (currentUserRole === 'paciente') {
                    if (clinicalWrapper) clinicalWrapper.classList.remove('hidden');
                    if (editAnamneseBtn) editAnamneseBtn.classList.remove('hidden');
                } else {
                    if (clinicalWrapper) clinicalWrapper.classList.add('hidden');
                    if (editAnamneseBtn) editAnamneseBtn.classList.add('hidden');
                }
                
                // Atualizar o rótulo do menu bottom-nav dinamicamente conforme o papel
                const companionsNavLabel = document.getElementById('companions-nav-label');
                if (companionsNavLabel) {
                    companionsNavLabel.innerText = currentUserRole === 'paciente' ? "Acompanhantes" : "Acompanhar";
                }
                
                // Forçar assinatura ativa definitiva para a Dra. Layana
                if (user.uid === 'etSpfstGkKSKmTfBploZqVMMVKu2') {
                    subscriptionActive = true;
                    // Exibir painel Admin secreto
                    const adminPanelSec = document.getElementById('admin-panel-section');
                    if (adminPanelSec) adminPanelSec.classList.remove('hidden');
                } else {
                    subscriptionActive = data.subscriptionActive !== false;
                }
                
                // Carregar aba de Acompanhamento
                window.loadCompanionsPage();
                
                // Atualizar navegação por papel
                updateNavigationByRole();
                
                if (currentUserRole === 'paciente') {
                    // --- FLUXO DO PACIENTE ---
                    // Restaura controles exclusivos do paciente
                    const giantCardWrapper = document.getElementById('patient-giant-card-wrapper');
                    if (giantCardWrapper) giantCardWrapper.style.display = '';
                    
                    const viewingBanner = document.getElementById('companion-viewing-banner');
                    if (viewingBanner) viewingBanner.classList.add('hidden');
                    
                    const medicalStatsCard = document.getElementById('medical-stats-card');
                    if (medicalStatsCard) medicalStatsCard.classList.add('hidden');
                    
                    // FREEMIUM: Permitir entrada de usuário com assinatura pendente/inativa para período de testes
                    document.getElementById('paywall-overlay').classList.add('hidden');
                    
                    // Dados locais específicos do paciente
                    const localRecords = localStorage.getItem(`records_${user.uid}`);
                    if (localRecords) {
                        try {
                            mockRecords = JSON.parse(localRecords);
                        } catch (e) {
                            console.error("Erro ao carregar registros locais do usuário:", e);
                        }
                    } else {
                        localStorage.setItem(`records_${user.uid}`, JSON.stringify(mockRecords));
                    }
                    
                    // Verifica se completou Anamnese
                    if (data.completedAt) {
                        localStorage.setItem(`anamnese_completed_${user.uid}`, 'true');
                        updateUserProfile(user, data);
                        showScreen('dashboard-screen');
                        initChart();
                    } else {
                        document.getElementById('a-nome').value = user.displayName || "";
                        showScreen('anamnese-screen');
                        currentStep = 1;
                        updateProgress();
                    }
                    
                } else {
                    // --- FLUXO DO ACOMPANHANTE / MÉDICO ---
                    document.getElementById('paywall-overlay').classList.add('hidden');
                    
                    // Checar paciente ativo a acompanhar
                    activePatientUid = localStorage.getItem(`active_patient_uid_${user.uid}`);
                    
                    // Se não tiver UID ativo, pega o primeiro da lista se houver
                    if (!activePatientUid && data.patients) {
                        const keys = Object.keys(data.patients);
                        if (keys.length > 0) {
                            activePatientUid = keys[0];
                            localStorage.setItem(`active_patient_uid_${user.uid}`, activePatientUid);
                        }
                    }
                    
                    // Atualiza a navegação após calcular o activePatientUid do acompanhante
                    updateNavigationByRole();
                    
                    if (activePatientUid) {
                        // Carregar dados do paciente acompanhado
                        const patDoc = await window.db.collection('users').doc(activePatientUid).get();
                        if (patDoc.exists) {
                            const patData = patDoc.data();
                            
                            // Verificar se o paciente acompanhado possui assinatura ativa!
                            const patSubActive = patData.subscriptionActive !== false;
                            
                            if (!patSubActive) {
                                // BLOQUEADO: Acesso Suspenso devido a plano expirado do paciente
                                document.getElementById('companion-lock-screen').classList.remove('hidden');
                                return;
                            } else {
                                document.getElementById('companion-lock-screen').classList.add('hidden');
                            }
                            
                            // Ocultar card de adicionar novas aferições (modo leitura)
                            const giantCardWrapper = document.getElementById('patient-giant-card-wrapper');
                            if (giantCardWrapper) giantCardWrapper.style.display = 'none';
                            
                            // Exibir banner superior de acompanhamento
                            const viewingBanner = document.getElementById('companion-viewing-banner');
                            if (viewingBanner) {
                                viewingBanner.classList.remove('hidden');
                                document.getElementById('companion-banner-role').innerText = currentUserRole === 'medico' ? 'Médico' : 'Familiar';
                                document.getElementById('companion-banner-name').innerText = patData.nome || patData.displayName || "Paciente";
                            }
                            
                            // Atualizar greeting no dashboard para saudar com dados do paciente
                            const greetEl = document.querySelector('.greeting');
                            if (greetEl) {
                                greetEl.innerText = currentUserRole === 'medico' ? 'Paciente:' : 'Acompanhando:';
                            }
                            const nameEl = document.getElementById('display-name');
                            if (nameEl) nameEl.innerText = patData.nome || patData.displayName || "Paciente";
                            
                            // Carrega os registros específicos do paciente
                            const patRecordsSnap = await window.db.collection('users').doc(activePatientUid).collection('records').orderBy('createdAt', 'desc').limit(50).get();
                            mockRecords = [];
                            patRecordsSnap.forEach(rDoc => {
                                const r = rDoc.data();
                                mockRecords.push({
                                    id: rDoc.id,
                                    sys: r.sys,
                                    dia: r.dia,
                                    bpm: r.bpm,
                                    date: r.date || "Hoje",
                                    time: r.time || "00:00",
                                    period: r.period || "Tarde",
                                    condicao: r.condicao || "Repouso"
                                });
                            });
                            
                            // Injetar visualizações exclusivas do Perfil Médico
                            if (currentUserRole === 'medico') {
                                const medStatsCard = document.getElementById('medical-stats-card');
                                if (medStatsCard) {
                                    medStatsCard.classList.remove('hidden');
                                    
                                    const totalCount = mockRecords.length;
                                    document.getElementById('med-total-count').innerText = totalCount;
                                    
                                    if (totalCount > 0) {
                                        // Picos
                                        const sysValues = mockRecords.map(r => parseInt(r.sys) || 0);
                                        const maxSys = Math.max(...sysValues);
                                        document.getElementById('med-max-sys').innerText = `${maxSys} mmHg`;
                                        
                                        // Estabilidade (Registros normais/atenção vs hipertensão)
                                        const stableCount = mockRecords.filter(r => {
                                            const s = parseInt(r.sys) || 0;
                                            const d = parseInt(r.dia) || 0;
                                            return s < 140 && d < 90; // Exclui estágios 1, 2 e crise
                                        }).length;
                                        const stabilityRate = Math.round((stableCount / totalCount) * 100);
                                        document.getElementById('med-stability-rate').innerText = `${stabilityRate}%`;
                                        
                                        // Variabilidade (Desvio Padrão)
                                        const meanSys = sysValues.reduce((a, b) => a + b, 0) / totalCount;
                                        const varianceSys = sysValues.reduce((a, b) => a + Math.pow(b - meanSys, 2), 0) / totalCount;
                                        const stdDevSys = Math.sqrt(varianceSys).toFixed(1);
                                        document.getElementById('med-standard-deviation').innerText = `± ${stdDevSys}`;
                                    }
                                }
                            }
                            
                            if (currentUserRole === 'paciente') {
                                showScreen('dashboard-screen');
                                initChart();
                            } else {
                                showScreen('history-screen');
                            }
                        } else {
                            // Paciente desvinculado ou ausente
                            alert("⚠️ O paciente vinculado não foi encontrado!");
                            showScreen('companions-screen');
                        }
                    } else {
                        // Sem paciente vinculado: força a tela de vincular e oculta widgets clínicos do dashboard
                        const giantCardWrapper = document.getElementById('patient-giant-card-wrapper');
                        if (giantCardWrapper) giantCardWrapper.style.display = 'none';
                        
                        const viewingBanner = document.getElementById('companion-viewing-banner');
                        if (viewingBanner) viewingBanner.classList.add('hidden');
                        
                        const medicalStatsCard = document.getElementById('medical-stats-card');
                        if (medicalStatsCard) medicalStatsCard.classList.add('hidden');
                        
                        // Atualiza o greeting e o display name
                        const greetEl = document.querySelector('.greeting');
                        if (greetEl) {
                            greetEl.innerText = "Nenhum paciente selecionado";
                        }
                        const nameEl = document.getElementById('display-name');
                        if (nameEl) nameEl.innerText = "";
                        
                        // Reseta registros para evitar gráfico fantasma
                        mockRecords = [];
                        
                        showScreen('companions-screen');
                    }
                }
                
            } catch(e) {
                console.error("Erro completo ao verificar perfil no Firestore:", e);
                
                // Tentar recuperar o papel do cache local antes de assumir paciente por padrão
                const cachedRole = localStorage.getItem(`user_role_${user.uid}`) || localStorage.getItem('temp_login_role') || localStorage.getItem('admin_override_role');
                if (cachedRole) {
                    currentUserRole = cachedRole;
                }
                
                // Fallback offline (se já completou anamnese localmente ou se for médico/acompanhante)
                const localCompleted = localStorage.getItem(`anamnese_completed_${user.uid}`);
                if (localCompleted === 'true' || currentUserRole !== 'paciente') {
                    if (currentUserRole === 'paciente') {
                        showScreen('dashboard-screen');
                        initChart();
                    } else {
                        showScreen('history-screen');
                    }
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
            
            // FREEMIUM CHECK: Bloquear salvamento do 4º registro no plano grátis
            if (currentUserRole === 'paciente' && !subscriptionActive && mockRecords && mockRecords.length >= 3) {
                closeModal('new-record-modal');
                recordForm.reset();
                showPaywall();
                return;
            }
            
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

    // Lógica para clique no botão de instalação do Android/Chrome (Login Screen)
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

    // Lógica para clique no botão de instalação do Dashboard (PWA Promo Card)
    const btnDashInstall = document.getElementById('btn-dashboard-install-pwa');
    if (btnDashInstall) {
        btnDashInstall.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA escolha do usuário no Dashboard: ${outcome}`);
            deferredPrompt = null;
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
window.handleLogout = handleLogout;

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

