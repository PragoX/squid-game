// Game State
const gameState = {
    betAmount: 0,
    currentLevel: 1,
    multiplier: 1.2,
    isGameActive: false,
    isAnimating: false,
    safePanel: null // 'left' or 'right'
};

// Multiplier progression for each level
const multipliers = [
    1.2, 1.4, 1.7, 2.1, 2.6, 3.2, 4.0, 5.0, 6.3, 7.8, 9.0, 10.0
];

// Probability for each level (survival chance)
const getSurvivalProbability = (level) => {
    if (level === 1) return 1.0;      // 100% safe
    if (level >= 2 && level <= 4) return 0.7;   // 70%
    if (level >= 5 && level <= 8) return 0.55;  // 55%
    if (level >= 9 && level <= 11) return 0.4;  // 40%
    if (level === 12) return 0.3;   // 30%
    return 0.3;
};

// DOM Elements
const betScreen = document.getElementById('betScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');

const betAmountInput = document.getElementById('betAmount');
const startGameBtn = document.getElementById('startGame');
const betError = document.getElementById('betError');

const currentBetDisplay = document.getElementById('currentBet');
const currentLevelDisplay = document.getElementById('currentLevel');
const currentMultiplierDisplay = document.getElementById('currentMultiplier');
const potentialPayoutDisplay = document.getElementById('potentialPayout');
const levelDisplay = document.getElementById('levelDisplay');
const levelBar = document.getElementById('levelBar');
const statusMessage = document.getElementById('statusMessage');

const leftPanel = document.getElementById('leftPanel');
const rightPanel = document.getElementById('rightPanel');
const actionButtons = document.getElementById('actionButtons');
const cashOutBtn = document.getElementById('cashOutBtn');
const continueBtn = document.getElementById('continueBtn');

const playAgainBtn = document.getElementById('playAgainBtn');
const playAgainWinBtn = document.getElementById('playAgainWinBtn');
const lostAmountDisplay = document.getElementById('lostAmount');
const wonAmountDisplay = document.getElementById('wonAmount');

// Initialize game
function init() {
    resetGame();
    setupEventListeners();
}

// Reset game state
function resetGame() {
    gameState.betAmount = 0;
    gameState.currentLevel = 1;
    gameState.multiplier = 1.2;
    gameState.isGameActive = false;
    gameState.isAnimating = false;
    gameState.safePanel = null;
    
    showScreen('betScreen');
    betAmountInput.value = '';
    betError.textContent = '';
    actionButtons.style.display = 'none';
}

// Show specific screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
    startGameBtn.addEventListener('click', startGame);
    betAmountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startGame();
    });
    
    leftPanel.addEventListener('click', () => selectPanel('left'));
    rightPanel.addEventListener('click', () => selectPanel('right'));
    
    cashOutBtn.addEventListener('click', cashOut);
    continueBtn.addEventListener('click', continueToNextLevel);
    
    playAgainBtn.addEventListener('click', resetGame);
    playAgainWinBtn.addEventListener('click', resetGame);
}

// Start game
function startGame() {
    const bet = parseFloat(betAmountInput.value);
    
    if (!bet || bet <= 0 || isNaN(bet)) {
        betError.textContent = 'Please enter a valid bet amount';
        return;
    }
    
    gameState.betAmount = bet;
    gameState.currentLevel = 1;
    gameState.multiplier = multipliers[0];
    gameState.isGameActive = true;
    
    showScreen('gameScreen');
    updateDisplay();
    setupLevel();
}

// Setup level
function setupLevel() {
    gameState.isAnimating = false;
    actionButtons.style.display = 'none';
    
    // Reset panels
    leftPanel.classList.remove('selected', 'safe', 'breaking', 'disabled');
    rightPanel.classList.remove('selected', 'safe', 'breaking', 'disabled');
    
    // Randomly assign safe panel (50/50 chance)
    gameState.safePanel = Math.random() < 0.5 ? 'left' : 'right';
    
    if (gameState.currentLevel === 1) {
        // Level 1: both are safe (guaranteed win)
        statusMessage.textContent = 'Level 1 - Both paths are safe! Choose wisely...';
    } else {
        statusMessage.textContent = `Level ${gameState.currentLevel} - Choose your path carefully...`;
    }
    
    // Enable panels
    leftPanel.style.pointerEvents = 'auto';
    rightPanel.style.pointerEvents = 'auto';
}

// Select panel
function selectPanel(side) {
    if (gameState.isAnimating || !gameState.isGameActive) return;
    
    gameState.isAnimating = true;
    
    // Disable panels
    leftPanel.style.pointerEvents = 'none';
    rightPanel.style.pointerEvents = 'none';
    
    // Mark selected panel
    if (side === 'left') {
        leftPanel.classList.add('selected');
    } else {
        rightPanel.classList.add('selected');
    }
    
    // Check if selected panel is safe
    const isSafe = (side === gameState.safePanel);
    
    setTimeout(() => {
        if (gameState.currentLevel === 1) {
            // Level 1: both are safe
            handleSafeSelection(side);
        } else if (isSafe) {
            // Selected the safe panel - apply survival probability
            const survivalProb = getSurvivalProbability(gameState.currentLevel);
            const randomRoll = Math.random();
            
            if (randomRoll < survivalProb) {
                // Survived
                handleSafeSelection(side);
            } else {
                // Even the safe panel broke (bad luck)
                handleFakeSelection(side);
            }
        } else {
            // Selected fake panel - always breaks
            handleFakeSelection(side);
        }
    }, 500);
}

// Handle safe selection
function handleSafeSelection(side) {
    const panel = side === 'left' ? leftPanel : rightPanel;
    panel.classList.add('safe');
    
    statusMessage.textContent = 'Safe! You made it across.';
    
    // Update multiplier
    if (gameState.currentLevel < multipliers.length) {
        gameState.multiplier = multipliers[gameState.currentLevel];
    }
    
    updateDisplay();
    
    // Show action buttons after animation
    setTimeout(() => {
        actionButtons.style.display = 'flex';
        gameState.isAnimating = false;
    }, 1000);
}

// Handle fake selection
function handleFakeSelection(side) {
    const panel = side === 'left' ? leftPanel : rightPanel;
    panel.classList.add('breaking');
    
    statusMessage.textContent = 'The glass breaks beneath you!';
    
    // Game over after animation
    setTimeout(() => {
        gameState.isGameActive = false;
        lostAmountDisplay.textContent = gameState.betAmount.toFixed(2);
        showScreen('gameOverScreen');
    }, 1500);
}

// Cash out
function cashOut() {
    if (gameState.isAnimating || !gameState.isGameActive) return;
    
    gameState.isGameActive = false;
    const payout = gameState.betAmount * gameState.multiplier;
    
    wonAmountDisplay.textContent = payout.toFixed(2);
    showScreen('winScreen');
}

// Continue to next level
function continueToNextLevel() {
    if (gameState.isAnimating || !gameState.isGameActive) return;
    
    gameState.currentLevel++;
    
    if (gameState.currentLevel > 12) {
        // Completed all levels
        cashOut();
        return;
    }
    
    updateDisplay();
    setupLevel();
}

// Update display
function updateDisplay() {
    currentBetDisplay.textContent = gameState.betAmount.toFixed(2);
    currentLevelDisplay.textContent = gameState.currentLevel;
    currentMultiplierDisplay.textContent = gameState.multiplier.toFixed(2) + 'x';
    potentialPayoutDisplay.textContent = (gameState.betAmount * gameState.multiplier).toFixed(2);
    levelDisplay.textContent = gameState.currentLevel;
    
    // Update progress bar
    const progress = (gameState.currentLevel / 12) * 100;
    levelBar.style.width = progress + '%';
}

// Initialize on load
init();

