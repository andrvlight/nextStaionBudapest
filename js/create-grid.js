const stationIcons = {
    "A": "img/station_A.svg",
    "B": "img/station_B.svg",
    "C": "img/station_C.svg",
    "D": "img/station_D.svg"
};

// Дунай по маршруту из твоего скрина:
function isDanubeCell(i, j) {
    if (j === 5 && i <= 2) return true;
    if (j === 4 && i >= 4 && i <= 6) return true;
    if (j === 6 && i === 9) return true;
    return false;
}

function renderMetroGrid(stations) {
    const metroGrid = document.querySelector('.metro-grid');
    metroGrid.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.classList.add('metro-cell');
            cell.dataset.x = i;
            cell.dataset.y = j;

            if (isDanubeCell(i, j)) {
                cell.classList.add('danube-cell');
            }

            for (let k = 1; k <= 4; k++) {
                const line = document.createElement('div');
                line.classList.add(`line-${k}`);
                if ((i === 3 && j === 5 && k === 4) ||
                    (i === 7 && j === 5 && k === 3) ||
                    (i === 8 && j === 6 && k === 3))
                {
                    line.style.backgroundColor = '#2890e6';
                }
                cell.appendChild(line);
            }

            const station = stations.find(s => s.x === j && s.y === i);
            if (station) {
                const stationDiv = document.createElement('div');
                stationDiv.classList.add('station');
                if (stationIcons[station.type]) {
                    const img = document.createElement('img');
                    img.src = stationIcons[station.type];
                    img.alt = station.type;
                    img.classList.add('station-icon');
                    stationDiv.appendChild(img);
                }
                if (station.train) stationDiv.classList.add('with-train');
                cell.appendChild(stationDiv);
            }
            metroGrid.appendChild(cell);
        }
    }
}

fetch('data/stations.json')
    .then(response => response.json())
    .then(stations => {
        renderMetroGrid(stations);
    })
    .catch(error => {
        console.error("Error uploading data from json:", error);
    });
