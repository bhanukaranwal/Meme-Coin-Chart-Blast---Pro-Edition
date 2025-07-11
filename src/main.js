document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const elements = {
        balanceDisplay: document.getElementById('balance-display'),
        betAmount: document.getElementById('bet-amount'),
        actionButton: document.getElementById('action-button'),
        multiplier: document.getElementById('multiplier'),
        chartSvg: document.getElementById('chart-svg'),
        chartContainer: document.getElementById('chart-container'),
        historyList: document.getElementById('history-list'),
        sessionHash: document.getElementById('session-hash'),
        progressBarInner: document.getElementById('progress-bar-inner'),
        progressText: document.getElementById('progress-text'),
        messageOverlay: document.getElementById('message-overlay'),
        messageText: document.getElementById('message-text'),
        coinSelector: document.getElementById('coin-selector'),
    };

    // --- GAME CONFIG ---
    const COINS = {
        doge: { name: 'Doge', icon: '🐶', crashChance: 0.20, volatility: 1.5 },
        shiba: { name: 'Shiba', icon: '🦊', crashChance: 0.30, volatility: 2.0 },
        pepe: { name: 'Pepe', icon: '🐸', crashChance: 0.45, volatility: 3.5 },
    };
    let selectedCoin = 'doge';

    // --- GAME STATE ---
    let state = {
        balance: 1000,
        gameState: 'IDLE', // IDLE -> WAITING -> RISING -> CRASHED
        currentBet: 0,
        currentMultiplier: 1.0,
        outcomes: [],
        roundIndex: 0,
        intervals: { gameLoop: null, countdown: null },
    };
    
    const ROUND_DURATION_MS = 3000;
    const WAIT_DURATION_MS = 5000;

    // --- SOUNDS ---
    const sounds = {
        tick: new Tone.MembraneSynth().toDestination(),
        bet: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 } }).toDestination(),
        win: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8 } }).toDestination(),
        crash: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.1 } }).toDestination(),
    };
    sounds.crash.volume.value = -10;

    // --- PROVABLY FAIR SIMULATION ---
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function generateOutcomes() {
        const clientSeed = "MemeCoinChartBlastPro" + Date.now();
        const serverSeed = await sha256("stake-like-server-seed-for-memes-v2");
        let combinedSeed = serverSeed + clientSeed;
        state.outcomes = [];
        
        const coinConfig = COINS[selectedCoin];

        for (let i = 0; i < 100; i++) {
            const roundHash = await sha256(combinedSeed + i);
            const hashInt = parseInt(roundHash.substring(0, 8), 16);
            
            if ((hashInt % 100) / 100 < coinConfig.crashChance) {
                state.outcomes.push(0.0);
            } else {
                const r = parseInt(roundHash.substring(8, 16), 16) / 0xFFFFFFFF;
                const multiplier = 1 / Math.pow(1 - r, 1 / coinConfig.volatility);
                state.outcomes.push(Math.min(multiplier, 1500.0));
            }
        }
        const outcomesString = state.outcomes.join(',');
        elements.sessionHash.textContent = (await sha256(outcomesString)).substring(0, 32);
    }

    // --- UI UPDATE FUNCTIONS ---
    function updateBalance() {
        elements.balanceDisplay.innerHTML = `<img src="https://placehold.co/32x32/000000/ffffff?text=${COINS[selectedCoin].icon}" class="w-8 h-8 mr-2 rounded-full" alt="${COINS[selectedCoin].name} Coin"> ${state.balance.toFixed(2)}`;
    }

    function updateActionButton(text, style, disabled = false) {
        const btn = elements.actionButton;
        btn.textContent = text;
        btn.disabled = disabled;
        btn.className = `btn w-full font-pixel text-xl p-4 rounded-lg`; // Reset classes
        if (style === 'bet') btn.classList.add('btn-bet');
        else if (style === 'cashout') btn.classList.add('btn-cashout');
        else btn.classList.add('btn-disabled');
    }

    function updateMultiplierDisplay(multiplier, status) {
        elements.multiplier.textContent = `${multiplier.toFixed(2)}x`;
        elements.multiplier.classList.remove('multiplier-rising', 'multiplier-crashed', 'text-gray-500');
        if (status === 'rising') elements.multiplier.classList.add('multiplier-rising');
        else if (status === 'crashed') elements.multiplier.classList.add('multiplier-crashed');
        else elements.multiplier.classList.add('text-gray-500');
    }

    function addToHistory(multiplier) {
        const item = document.createElement('div');
        item.className = 'history-item flex-shrink-0 font-bold px-4 py-2 rounded-md text-center';
        item.textContent = `${multiplier.toFixed(2)}x`;
        if (multiplier < 1.01) item.classList.add('bg-red-500/50', 'text-red-300');
        else if (multiplier < 10) item.classList.add('bg-blue-500/50', 'text-blue-300');
        else item.classList.add('bg-purple-500/50', 'text-purple-300');
        elements.historyList.prepend(item);
        if (elements.historyList.children.length > 20) elements.historyList.lastChild.remove();
    }
    
    function showMessage(text, duration = 2000) {
        elements.messageText.textContent = text;
        elements.messageOverlay.classList.remove('hidden');
        setTimeout(() => elements.messageOverlay.classList.add('hidden'), duration);
    }

    // --- CHART DRAWING ---
    function drawChart(progress) {
        elements.chartSvg.innerHTML = '';
        const width = 400, height = 200;
        
        const x2 = width * progress;
        const y2 = height - Math.pow(progress, 2.5) * height * 0.9;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M 0 ${height} Q ${x2/2} ${y2} ${x2} ${y2}`);
        path.setAttribute('stroke', '#4ade80');
        path.setAttribute('stroke-width', '5');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        elements.chartSvg.appendChild(path);

        // Add moving icon
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', x2 - 10);
        icon.setAttribute('y', y2 - 10);
        icon.setAttribute('font-size', '24');
        icon.setAttribute('id', 'chart-icon');
        icon.textContent = COINS[selectedCoin].icon;
        elements.chartSvg.appendChild(icon);
    }
    
    function clearChart() { elements.chartSvg.innerHTML = ''; }

    // --- GAME LOGIC ---
    function handleAction() {
        if (Tone.context.state !== 'running') Tone.start();
        if (state.gameState === 'WAITING') placeBet();
        else if (state.gameState === 'RISING') cashOut();
    }

    function placeBet() {
        const bet = parseFloat(elements.betAmount.value);
        if (bet > 0 && bet <= state.balance) {
            sounds.bet.triggerAttackRelease("C5", "8n");
            state.balance -= bet;
            updateBalance();
            state.currentBet = bet;
            updateActionButton('Bet Placed', 'disabled', true);
        } else showMessage("Invalid Bet Amount!");
    }

    function cashOut() {
        const winnings = state.currentBet * state.currentMultiplier;
        sounds.win.triggerAttackRelease("C4", "8n", Tone.now());
        sounds.win.triggerAttackRelease("G4", "8n", Tone.now() + 0.15);
        showMessage(`Cashed out! +${winnings.toFixed(2)}`);
        state.balance += winnings;
        updateBalance();
        state.currentBet = 0;
    }

    function startRound() {
        state.gameState = 'RISING';
        state.currentMultiplier = 1.0;
        const crashMultiplier = state.outcomes[state.roundIndex];
        
        updateActionButton('Cash Out', 'cashout', state.currentBet === 0);
        updateMultiplierDisplay(1.0, 'rising');

        let startTime = Date.now();
        state.intervals.gameLoop = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / ROUND_DURATION_MS, 1);
            
            state.currentMultiplier = Math.pow(1.015, elapsedTime / 50);
            drawChart(progress);
            updateMultiplierDisplay(state.currentMultiplier, 'rising');
            
            if (Math.random() > 0.8) sounds.tick.triggerAttackRelease("C1", "8n");

            if (state.currentMultiplier >= crashMultiplier && crashMultiplier > 0) {
                endRound(crashMultiplier, 'crashed');
            } else if (progress >= 1) {
                endRound(state.currentMultiplier, 'mooned');
            }
        }, 1000 / 60);
    }

    function endRound(finalMultiplier, reason) {
        clearInterval(state.intervals.gameLoop);
        state.gameState = 'CRASHED';
        
        if (reason === 'crashed') {
            sounds.crash.triggerAttackRelease("0.2");
            updateMultiplierDisplay(finalMultiplier, 'crashed');
            showMessage(`CRASHED @ ${finalMultiplier.toFixed(2)}x`);
            state.currentBet = 0;
        } else { // Mooned
            if (state.currentBet > 0) {
                sounds.win.triggerAttackRelease("C5", "4n", Tone.now());
                const winnings = state.currentBet * finalMultiplier;
                showMessage(`MOON SHOT! +${winnings.toFixed(2)}`);
                state.balance += winnings;
                updateBalance();
            } else {
                showMessage(`MOON SHOT! ${finalMultiplier.toFixed(2)}x`);
            }
        }

        updateActionButton('Crashed', 'disabled', true);
        addToHistory(finalMultiplier);
        state.roundIndex = (state.roundIndex + 1) % state.outcomes.length;
        
        setTimeout(waitForNextRound, 2000);
    }

    function waitForNextRound() {
        state.gameState = 'WAITING';
        state.currentBet = 0;
        clearChart();
        updateActionButton('Place Bet', 'bet', false);
        updateMultiplierDisplay(1.00, 'idle');

        let countdown = WAIT_DURATION_MS;
        state.intervals.countdown = setInterval(() => {
            countdown -= 100;
            elements.progressBarInner.style.width = `${(countdown / WAIT_DURATION_MS) * 100}%`;
            elements.progressText.textContent = `Next round in ${(countdown / 1000).toFixed(1)}s`;

            if (countdown <= 0) {
                clearInterval(state.intervals.countdown);
                startRound();
            }
        }, 100);
    }
    
    function handleCoinChange() {
        selectedCoin = elements.coinSelector.value;
        updateBalance();
        generateOutcomes();
        state.roundIndex = 0;
        showMessage(`${COINS[selectedCoin].name} selected! Volatility changed.`);
    }

    // --- INITIALIZATION ---
    async function init() {
        // Populate coin selector
        for (const [key, coin] of Object.entries(COINS)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${coin.icon} ${coin.name}`;
            elements.coinSelector.appendChild(option);
        }
        
        updateActionButton('Loading...', 'disabled', true);
        updateBalance();
        await generateOutcomes();
        
        elements.actionButton.addEventListener('click', handleAction);
        elements.coinSelector.addEventListener('change', handleCoinChange);
        
        waitForNextRound();
    }

    init();
});
