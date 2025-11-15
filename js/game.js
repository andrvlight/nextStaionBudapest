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
    segments: [],
    railwayCount: 0,
    roundScores: [],
    totalScore: 0,
    selectedStation: null
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

