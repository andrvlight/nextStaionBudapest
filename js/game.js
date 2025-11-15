let gameState = {
    playerName: '',
    startTime: null,
    timer: 0,
    currentRound: 0,
    linesOrder: [],
    currentLineIndex: 0,
    cardsDrawn: 0,
    currentCard: null,
    deck: [],
    stations: [],
    lines: [],
    metroLines: [],
    segments: [],
    railwayCount: 0,
    roundScores: [],
    totalScore: 0,
    selectedStation: null,
    timerInterval: null
};

const CARD_DECK = [
    { letter: 'A', platform: 'side' },
    { letter: 'B', platform: 'side' },
    { letter: 'C', platform: 'side' },
    { letter: 'D', platform: 'side' },
    { letter: 'Joker', platform: 'side' },
    { letter: 'A', platform: 'center' },
    { letter: 'B', platform: 'center' },
    { letter: 'C', platform: 'center' },
    { letter: 'D', platform: 'center' },
    { letter: 'Joker', platform: 'center' }
];

Promise.all([
    fetch('data/stations.json').then(r => r.json()),
    fetch('data/lines.json').then(r => r.json())
]).then(([stations, lines]) => {
    gameState.stations = stations;
    gameState.lines = lines;
    gameState.metroLines = lines.map(line => ({
        id: line.id,
        stations: [line.start],
        segments: []
    }));
    initGame();
});

function initGame() {
    const startBtn = document.querySelector('.start-game-btn');
    startBtn.addEventListener('click', () => {
        const name = document.querySelector('.input-name').value.trim();
        if (!name) {
            showModal('Please enter your name!');
            return;
        }
        gameState.playerName = name;
        startGame();
    });
}

function showModal(message, onConfirm = null, showCancel = false) {
    const existingModal = document.querySelector('.game-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = 'font-size: 1.2em; margin-bottom: 20px; color: #333;';
    modalContent.appendChild(messageEl);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = onConfirm ? 'Yes' : 'OK';
    confirmBtn.style.cssText = `
        padding: 10px 25px;
        font-size: 1.1em;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    `;
    confirmBtn.addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });
    btnContainer.appendChild(confirmBtn);

    if (showCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'No';
        cancelBtn.style.cssText = `
            padding: 10px 25px;
            font-size: 1.1em;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        `;
        cancelBtn.addEventListener('click', () => modal.remove());
        btnContainer.appendChild(cancelBtn);
    }

    modalContent.appendChild(btnContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function startGame() {
    gameState.startTime = Date.now();
    startTimer();
    createDeck();
    setupStationHandlers();
    updateUI();
    addGameControls();
}

function startTimer() {
    gameState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.querySelector('.timer').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function createDeck() {
    gameState.deck = [...CARD_DECK];
    shuffleArray(gameState.deck);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function addGameControls() {
    const cardSection = document.querySelector('.card-section');

    if (!document.querySelector('.draw-card-btn')) {
        const drawBtn = document.createElement('button');
        drawBtn.className = 'draw-card-btn';
        drawBtn.textContent = 'Draw Card';
        drawBtn.style.cssText = 'margin-top: 15px; padding: 12px; font-size: 1.1em; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;';
        drawBtn.addEventListener('click', drawCard);
        cardSection.appendChild(drawBtn);
    }

    if (!document.querySelector('.current-line-display')) {
        const lineDisplay = document.createElement('div');
        lineDisplay.className = 'current-line-display';
        lineDisplay.style.cssText = 'margin-top: 20px; padding: 15px; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
        lineDisplay.innerHTML = `
            <h3 style="margin-bottom: 10px;">Current Line</h3>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="line-color-indicator" style="width: 50px; height: 50px; border-radius: 8px; border: 2px solid #333;"></div>
                <div>
                    <div class="line-name-display" style="font-size: 1.5em; font-weight: bold;"></div>
                    <div class="cards-count-display" style="color: #666; font-size: 0.9em;"></div>
                </div>
            </div>
        `;
        cardSection.parentElement.insertBefore(lineDisplay, cardSection);
    }
}

function setupStationHandlers() {
    const stations = document.querySelectorAll('.station');
    stations.forEach((stationEl, index) => {
        stationEl.dataset.stationId = gameState.stations[index].id;
        stationEl.style.cursor = 'pointer';
        stationEl.addEventListener('click', () => {
            const stationId = parseInt(stationEl.dataset.stationId);
            handleStationClick(stationId);
        });
    });
}

function drawCard() {
    if (gameState.cardsDrawn >= 8) {
        showModal('Round complete! Start next metro line?', () => endRound(), true);
        return;
    }

    if (gameState.deck.length === 0) {
        createDeck();
    }

    const card = gameState.deck.pop();
    gameState.currentCard = card.letter;
    gameState.cardsDrawn++;

    updateUI();
    updateClickableStations();

    if (gameState.cardsDrawn >= 8) {
        setTimeout(() => {
            showModal('Round complete! Start next metro line?', () => endRound(), true);
        }, 500);
    }
}

function handleStationClick(stationId) {
    if (!gameState.currentCard) {
        showModal('Please draw a card first!');
        return;
    }

    const currentLine = gameState.metroLines[gameState.currentLineIndex];
    const lastStation = currentLine.stations[currentLine.stations.length - 1];

    if (!gameState.selectedStation) {
        if (stationId !== lastStation) {
            showModal('You must start from the end of your current line!');
            return;
        }
        gameState.selectedStation = stationId;
        updateClickableStations();
    } else {
        if (canConnect(gameState.selectedStation, stationId)) {
            connectStations(gameState.selectedStation, stationId);
            gameState.selectedStation = null;
            gameState.currentCard = null;
            updateUI();
            updateClickableStations();
        } else {
            showModal('Invalid connection! Check: no intersections, no loops, no passing through stations.');
            gameState.selectedStation = null;
            updateClickableStations();
        }
    }
}

function canConnect(fromId, toId) {
    const from = gameState.stations.find(s => s.id === fromId);
    const to = gameState.stations.find(s => s.id === toId);

    if (!from || !to) return false;

    const currentLine = gameState.metroLines[gameState.currentLineIndex];

    if (currentLine.stations.includes(toId)) return false;

    if (gameState.currentCard !== 'Joker' && to.type !== gameState.currentCard) {
        return false;
    }

    if (!isValidAngle(from, to)) return false;
    if (wouldIntersect(from, to)) return false;
    if (passesThrough(from, to)) return false;
    if (segmentExists(fromId, toId)) return false;
    return true;
}

function isValidAngle(from, to) {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const is90 = (dx === 0 || dy === 0) && (dx + dy > 0);
    const is45 = dx === dy && dx > 0;
    return is90 || is45;
}

function wouldIntersect(from, to) {
    for (let line of gameState.metroLines) {
        for (let seg of line.segments) {
            const segFrom = gameState.stations.find(s => s.id === seg.from);
            const segTo = gameState.stations.find(s => s.id === seg.to);

            if (segmentsIntersect(from, to, segFrom, segTo)) {
                if (!(from.id === seg.from || from.id === seg.to ||
                    to.id === seg.from || to.id === seg.to)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function segmentsIntersect(p1, p2, p3, p4) {
    const ccw = (A, B, C) => {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

function passesThrough(from, to) {
    for (let station of gameState.stations) {
        if (station.id === from.id || station.id === to.id) continue;

        const minX = Math.min(from.x, to.x);
        const maxX = Math.max(from.x, to.x);
        const minY = Math.min(from.y, to.y);
        const maxY = Math.max(from.y, to.y);

        if (station.x >= minX && station.x <= maxX &&
            station.y >= minY && station.y <= maxY) {

            const dx = to.x - from.x;
            const dy = to.y - from.y;

            if (dx === 0) {
                if (station.x === from.x) return true;
            } else if (dy === 0) {
                if (station.y === from.y) return true;
            } else {
                const t = (station.x - from.x) / dx;
                const expectedY = from.y + t * dy;
                if (Math.abs(expectedY - station.y) < 0.01 && t > 0 && t < 1) {
                    return true;
                }
            }
        }
    }
    return false;
}

function segmentExists(id1, id2) {
    for (let line of gameState.metroLines) {
        for (let seg of line.segments) {
            if ((seg.from === id1 && seg.to === id2) ||
                (seg.from === id2 && seg.to === id1)) {
                return true;
            }
        }
    }
    return false;
}

function connectStations(fromId, toId) {
    const currentLine = gameState.metroLines[gameState.currentLineIndex];
    currentLine.stations.push(toId);
    currentLine.segments.push({ from: fromId, to: toId });

    drawMetroLine(fromId, toId);
}

function drawMetroLine(fromId, toId) {
    const from = gameState.stations.find(s => s.id === fromId);
    const to = gameState.stations.find(s => s.id === toId);
    const color = gameState.lines[gameState.currentLineIndex].color;

    const grid = document.querySelector('.metro-grid');
    const cellSize = 48;
    const padding = 10;

    const x1 = from.x * cellSize + cellSize / 2 + padding;
    const y1 = from.y * cellSize + cellSize / 2 + padding;
    const x2 = to.x * cellSize + cellSize / 2 + padding;
    const y2 = to.y * cellSize + cellSize / 2 + padding;

    const line = document.createElement('div');
    line.className = 'metro-line';

    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    line.style.cssText = `
        position: absolute;
        width: ${length}px;
        height: 6px;
        background-color: ${color};
        left: ${x1 + cellSize/2 -    2}px;
        top: ${y1 + cellSize/2 - 2}px;
        transform: rotate(${angle}deg);
        transform-origin: 0 0;
        z-index: 1;
        border-radius: 3px;
        pointer-events: none;
    `;

    grid.appendChild(line);
}

function updateClickableStations() {
    document.querySelectorAll('.station').forEach(el => {
        el.style.opacity = '0.5';
        el.style.cursor = 'default';
    });

    if (!gameState.currentCard) return;

    const currentLine = gameState.metroLines[gameState.currentLineIndex];
    const lastStation = currentLine.stations[currentLine.stations.length - 1];

    if (!gameState.selectedStation) {
        const startEl = document.querySelector(`[data-station-id="${lastStation}"]`);
        if (startEl) {
            startEl.style.opacity = '1';
            startEl.style.cursor = 'pointer';
        }
    } else {
        gameState.stations.forEach(station => {
            if (canConnect(gameState.selectedStation, station.id)) {
                const el = document.querySelector(`[data-station-id="${station.id}"]`);
                if (el) {
                    el.style.opacity = '1';
                    el.style.cursor = 'pointer';
                }
            }
        });
    }
}

function updateUI() {
    const currentLine = gameState.lines[gameState.currentLineIndex];

    const lineColorEl = document.querySelector('.line-color-indicator');
    const lineNameEl = document.querySelector('.line-name-display');
    const cardsCountEl = document.querySelector('.cards-count-display');

    if (lineColorEl) lineColorEl.style.backgroundColor = currentLine.color;
    if (lineNameEl) lineNameEl.textContent = currentLine.name;
    if (cardsCountEl) cardsCountEl.textContent = `Cards: ${gameState.cardsDrawn}/8`;

    const cardContent = document.querySelector('.card-content');
    if (cardContent) {
        if (gameState.currentCard === 'Joker') {
            cardContent.innerHTML = `<div style="font-size: 3em;">🃏</div>`;
        } else if (gameState.currentCard) {
            cardContent.innerHTML = `
                <div class="card-station-type" style="font-size: 4em; font-weight: bold;">${gameState.currentCard}</div>
            `;
        } else {
            cardContent.innerHTML = `<div style="font-size: 4em; color: #999;">?</div>`;
        }
    }

    updateScoring();
}

function updateScoring() {
    const scoringBoard = document.querySelector('.scoring-board');
    if (!scoringBoard) return;

    const lineRows = scoringBoard.querySelectorAll('.line-row');
    gameState.roundScores.forEach((score, idx) => {
        if (lineRows[idx]) {
            const totalBox = lineRows[idx].querySelector('.total-box');
            if (totalBox) totalBox.textContent = score;
        }
    });
}

function endRound() {
    const roundScore = calculateRoundScore();
    gameState.roundScores.push(roundScore);
    gameState.totalScore += roundScore;

    gameState.currentLineIndex++;

    if (gameState.currentLineIndex >= gameState.lines.length) {
        endGame();
        return;
    }

    gameState.cardsDrawn = 0;
    gameState.currentCard = null;
    gameState.selectedStation = null;

    updateUI();
    updateClickableStations();
}

function calculateRoundScore() {
    const currentLine = gameState.metroLines[gameState.currentLineIndex];
    const visitedDistricts = new Set();
    const districtCounts = {};
    let danubeCrossings = 0;

    currentLine.stations.forEach(stationId => {
        const station = gameState.stations.find(s => s.id === stationId);
        if (station) {
            visitedDistricts.add(station.district);
            districtCounts[station.district] = (districtCounts[station.district] || 0) + 1;
        }
    });

    currentLine.segments.forEach(segment => {
        const from = gameState.stations.find(s => s.id === segment.from);
        const to = gameState.stations.find(s => s.id === segment.to);
        if (from && to && from.side !== to.side) {
            danubeCrossings++;
        }
    });

    const numDistricts = visitedDistricts.size;
    const maxInDistrict = Math.max(...Object.values(districtCounts), 0);

    return (numDistricts * maxInDistrict) + danubeCrossings;
}

function endGame() {
    clearInterval(gameState.timerInterval);

    const junctionBonus = calculateJunctionBonus();
    gameState.totalScore += junctionBonus;

    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const modal = document.createElement('div');
    modal.className = 'game-over-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        max-width: 600px;
        text-align: center;
        box-shadow: 0 4px 30px rgba(0,0,0,0.5);
    `;

    const title = document.createElement('h2');
    title.textContent = '🎉 Game Complete!';
    title.style.cssText = 'font-size: 2.5em; color: #4CAF50; margin-bottom: 30px;';
    content.appendChild(title);

    const stats = document.createElement('div');
    stats.style.cssText = 'text-align: left; margin: 20px 0;';
    stats.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; font-size: 1.1em;">
            <span><strong>Player:</strong></span>
            <span>${gameState.playerName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; font-size: 1.1em;">
            <span><strong>Time:</strong></span>
            <span>${timeStr}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; font-size: 1.1em;">
            <span><strong>Final Score:</strong></span>
            <span style="color: #4CAF50; font-weight: bold;">${gameState.totalScore}</span>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 10px;">
            <h3 style="margin-bottom: 10px;">Round Scores:</h3>
            ${gameState.roundScores.map((s, i) => `
                <div style="display: flex; justify-content: space-between; padding: 5px;">
                    <span>${gameState.lines[i].name}:</span>
                    <span>${s}</span>
                </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding: 5px; margin-top: 10px; border-top: 2px solid #ddd; font-weight: bold;">
                <span>Junction Bonus:</span>
                <span>+${junctionBonus}</span>
            </div>
        </div>
    `;
    content.appendChild(stats);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 15px; justify-content: center; margin-top: 30px;';

    const playAgainBtn = document.createElement('button');
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.style.cssText = `
        padding: 15px 30px;
        font-size: 1.2em;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
    `;
    playAgainBtn.addEventListener('click', () => location.reload());
    btnContainer.appendChild(playAgainBtn);

    const menuBtn = document.createElement('button');
    menuBtn.textContent = 'Main Menu';
    menuBtn.style.cssText = `
        padding: 15px 30px;
        font-size: 1.2em;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
    `;
    menuBtn.addEventListener('click', () => location.reload());
    btnContainer.appendChild(menuBtn);

    content.appendChild(btnContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function calculateJunctionBonus() {
    const stationLineCount = {};

    gameState.metroLines.forEach(line => {
        line.stations.forEach(stationId => {
            stationLineCount[stationId] = (stationLineCount[stationId] || 0) + 1;
        });
    });

    let bonus = 0;
    Object.values(stationLineCount).forEach(count => {
        if (count === 2) bonus += 2;
        else if (count === 3) bonus += 5;
        else if (count === 4) bonus += 9;
    });

    return bonus;
}