const rulesBtn = document.querySelector('.rules-btn');
const rulesSection = document.querySelector('.rules-section');
const closeRulesBtn = document.querySelector('.close-rules-btn');

rulesBtn.addEventListener('click', () => {
    rulesSection.classList.add('active');
});

closeRulesBtn.addEventListener('click', () => {
    rulesSection.classList.remove('active');
});

rulesSection.addEventListener('click', (e) => {
    if (e.target === rulesSection) {
        rulesSection.classList.remove('active');
    }
});

const startBtn = document.querySelector('.start-game-btn');
const mainMenu = document.querySelector('.main-menu');
const gameScreen = document.querySelector('.game');
const nameInput = document.querySelector('.input-name');
const nameError = document.querySelector('.name-error');

startBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();

    if (!name) {
        nameError.textContent = 'Please enter your name!';
        nameError.style.display = 'block';
        nameInput.focus();
        nameInput.classList.add('input-error');
        return;
    }

    // если всё ок — убираем ошибку
    nameError.textContent = '';
    nameError.style.display = 'none';
    nameInput.classList.remove('input-error');

    mainMenu.style.display = 'none';
    gameScreen.style.display = 'block';
});
