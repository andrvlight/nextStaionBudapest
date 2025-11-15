
// Rules section functionality
const rulesBtn = document.querySelector('.rules-btn');
const rulesSection = document.querySelector('.rules-section');
const closeRulesBtn = document.querySelector('.close-rules-btn');

// Open rules section
rulesBtn.addEventListener('click', () => {
    rulesSection.classList.add('active');
});

// Close rules section
closeRulesBtn.addEventListener('click', () => {
    rulesSection.classList.remove('active');
});

// Close rules section when clicking outside the content
rulesSection.addEventListener('click', (e) => {
    if (e.target === rulesSection) {
        rulesSection.classList.remove('active');
    }
});

// Close rules section with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rulesSection.classList.contains('active')) {
        rulesSection.classList.remove('active');
    }
});

// Start game functionality
const startGameBtn = document.querySelector('.start-game-btn');
const mainMenu = document.querySelector('.main-menu');
const gameSection = document.querySelector('.game');
const playerNameInput = document.querySelector('.input-name');

startGameBtn.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();

    // Optional: Check if player entered a name
    if (!playerName) {
        playerNameInput.style.border = '2px solid red';
        playerNameInput.placeholder = 'Please enter your name!';
        return;
    }

    // Hide main menu
    mainMenu.classList.add('hidden');

    // Show game section
    gameSection.classList.add('active');

    // Optional: Store player name for later use
    localStorage.setItem('playerName', playerName);

    console.log(`Game started! Player: ${playerName}`);

    // Initialize game after starting
    initializeGame();
});

// Reset input border on focus
playerNameInput.addEventListener('focus', () => {
    playerNameInput.style.border = '';
    playerNameInput.placeholder = 'Pls enter your name';
});

// Game State
let stations = [];
let lines = [];
let deck = [];
let currentCard = null;
let currentLineIndex = 0;
let currentLine = null;
let cardsDrawnInRound = 0;
let selectedStation = null;
let gameTimer = 0;
let timerInterval = null;
let lineConnections = {}; // Track connections for each line

// Game initialization
async function loadGameData() {
    try {
        // Load stations
        const stationsResponse = await fetch('stations.json');
        stations = await stationsResponse.json();

        // Load lines
        const linesResponse = await fetch('lines.json');
        lines = await linesResponse.json();

        console.log('Game data loaded:', { stations, lines });
        return true;
    } catch (error) {
        console.error('Error loading game data:', error);
        return false;
    }
}

function createDeck() {
    const cards = [];
    const types = ['A', 'B', 'C', 'D', '?']; // ? is Joker

    // Add cards for each type (multiple copies)
    types.forEach(type => {
        for (let i = 0; i < 10; i++) {
            cards.push({
                type: type,
                isJoker: type === '?'
            });
        }
    });

    // Shuffle deck
    return cards.sort(() => Math.random() - 0.5);
}

function drawCard() {
    if (deck.length === 0) {
        deck = createDeck();
    }

    currentCard = deck.pop();
    cardsDrawnInRound++;

    updateCardDisplay();

    // Check if round should end (8 cards drawn)
    if (cardsDrawnInRound >= 8) {
        setTimeout(() => {
            endRound();
        }, 500);
    }
}

function updateCardDisplay() {
    const cardType = document.querySelector('.card-station-type');
    if (currentCard) {
        cardType.textContent = currentCard.type;
        cardType.style.color = currentCard.isJoker ? '#9b59b6' : '#000';
    }
}

function renderStations() {
    const metroGrid = document.querySelector('.metro-grid');
    const cells = metroGrid.querySelectorAll('.metro-cell');

    // Clear all cells first
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('station', 'train-station');
        cell.removeAttribute('data-station-id');
    });

    // Place stations on the grid
    stations.forEach(station => {
        // Calculate cell index (y * 10 + x for 10x10 grid)
        const cellIndex = station.y * 10 + station.x;
        const cell = cells[cellIndex];

        if (cell) {
            // Add station class
            cell.classList.add('station');

            // Add train station class if applicable
            if (station.train) {
                cell.classList.add('train-station');
            }

            // Store station data
            cell.setAttribute('data-station-id', station.id);
            cell.setAttribute('data-station-type', station.type);

            // Create station marker
            const stationMarker = document.createElement('div');
            stationMarker.className = 'station-marker';
            stationMarker.textContent = station.type;

            // Add train icon if it's a train station
            if (station.train) {
                const trainIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                trainIcon.classList.add('train-icon');
                trainIcon.setAttribute('viewBox', '0 0 24 24');

                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#icon-train');

                trainIcon.appendChild(use);
                cell.appendChild(trainIcon);
            }

            cell.appendChild(stationMarker);

            // Add click handler
            cell.addEventListener('click', () => handleStationClick(station, cell));
        }
    });
}

function handleStationClick(station, cell) {
    if (!currentCard) {
        alert('Draw a card first!');
        return;
    }

    // Check if station matches current card
    const isValidStation = currentCard.isJoker || station.type === currentCard.type;

    if (!isValidStation) {
        alert(`You need to connect to a station of type ${currentCard.type}!`);
        return;
    }

    // First station selection or connection
    if (!selectedStation) {
        // First station in the line or starting a new connection
        if (!lineConnections[currentLine.id]) {
            lineConnections[currentLine.id] = {
                stations: [station.id],
                segments: []
            };
            selectedStation = station;
            cell.classList.add('selected');
            highlightStation(cell, currentLine.color);

            // Draw next card
            drawCard();
        } else {
            // Continue from last station
            const lastStationId = lineConnections[currentLine.id].stations[lineConnections[currentLine.id].stations.length - 1];
            if (station.id === lastStationId) {
                selectedStation = station;
                cell.classList.add('selected');
                return;
            } else {
                alert('You must continue from the last station of your line!');
                return;
            }
        }
    } else {
        // Second station - create connection
        if (station.id === selectedStation.id) {
            // Same station clicked, deselect
            cell.classList.remove('selected');
            selectedStation = null;
            return;
        }

        // Try to create connection
        if (canConnect(selectedStation, station)) {
            createConnection(selectedStation, station);

            // Update line connections
            lineConnections[currentLine.id].stations.push(station.id);
            lineConnections[currentLine.id].segments.push({
                from: selectedStation.id,
                to: station.id
            });

            // Deselect and highlight new station
            document.querySelector('.metro-cell.selected')?.classList.remove('selected');
            selectedStation = station;
            cell.classList.add('selected');
            highlightStation(cell, currentLine.color);

            // Draw next card
            drawCard();
        } else {
            alert('Invalid connection! Check the rules.');
        }
    }
}

function canConnect(station1, station2) {
    // Check if stations are adjacent (horizontally, vertically, or diagonally)
    const dx = Math.abs(station1.x - station2.x);
    const dy = Math.abs(station1.y - station2.y);

    // Must be adjacent
    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
        return false;
    }

    // Check if this connection already exists
    const existingConnection = Object.values(lineConnections).some(line => {
        return line.segments.some(seg =>
            (seg.from === station1.id && seg.to === station2.id) ||
            (seg.from === station2.id && seg.to === station1.id)
        );
    });

    if (existingConnection) {
        return false;
    }

    // Check if station2 is already in current line (no loops)
    if (lineConnections[currentLine.id] &&
        lineConnections[currentLine.id].stations.includes(station2.id)) {
        return false;
    }

    return true;
}

function createConnection(station1, station2) {
    const metroGrid = document.querySelector('.metro-grid');
    const line = document.createElement('div');
    line.className = 'metro-line';
    line.style.backgroundColor = currentLine.color;

    // Calculate position and rotation
    const x1 = station1.x;
    const y1 = station1.y;
    const x2 = station2.x;
    const y2 = station2.y;

    const cellSize = 48; // Approximate cell size
    const startX = x1 * cellSize + cellSize / 2;
    const startY = y1 * cellSize + cellSize / 2;
    const endX = x2 * cellSize + cellSize / 2;
    const endY = y2 * cellSize + cellSize / 2;

    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

    line.style.width = `${length}px`;
    line.style.height = '4px';
    line.style.left = `${startX + 10}px`;
    line.style.top = `${startY + 10}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = '0 0';

    metroGrid.appendChild(line);
}

function highlightStation(cell, color) {
    const marker = cell.querySelector('.station-marker');
    if (marker) {
        marker.style.borderColor = color;
        marker.style.borderWidth = '3px';
    }
}

function endRound() {
    alert(`Round ${currentLineIndex + 1} ended! Starting next line...`);

    cardsDrawnInRound = 0;
    selectedStation = null;
    currentLineIndex++;

    if (currentLineIndex >= lines.length) {
        endGame();
        return;
    }

    currentLine = lines[currentLineIndex];

    // Find starting station for new line
    const startStation = stations.find(s => s.id === currentLine.start);
    if (startStation) {
        const cellIndex = startStation.y * 10 + startStation.x;
        const cells = document.querySelectorAll('.metro-cell');
        const startCell = cells[cellIndex];

        lineConnections[currentLine.id] = {
            stations: [startStation.id],
            segments: []
        };

        highlightStation(startCell, currentLine.color);
        selectedStation = startStation;
        startCell.classList.add('selected');
    }

    drawCard();
}

function endGame() {
    clearInterval(timerInterval);
    alert(`Game Over! Your time: ${formatTime(gameTimer)}`);
    // TODO: Calculate and display final score
}

function startTimer() {
    const timerDisplay = document.querySelector('.timer');
    timerInterval = setInterval(() => {
        gameTimer++;
        timerDisplay.textContent = formatTime(gameTimer);
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function initializeGame() {
    const loaded = await loadGameData();

    if (loaded) {
        renderStations();

        // Initialize game state
        deck = createDeck();
        currentLineIndex = 0;
        currentLine = lines[0];
        cardsDrawnInRound = 0;
        gameTimer = 0;
        lineConnections = {};

        // Start with first line
        const startStation = stations.find(s => s.id === currentLine.start);
        if (startStation) {
            const cellIndex = startStation.y * 10 + startStation.x;
            const cells = document.querySelectorAll('.metro-cell');
            const startCell = cells[cellIndex];

            lineConnections[currentLine.id] = {
                stations: [startStation.id],
                segments: []
            };

            highlightStation(startCell, currentLine.color);
            selectedStation = startStation;
            startCell.classList.add('selected');
        }

        // Draw first card
        drawCard();

        // Start timer
        startTimer();

        console.log('Game initialized successfully!');
    } else {
        console.error('Failed to initialize game');
    }
}