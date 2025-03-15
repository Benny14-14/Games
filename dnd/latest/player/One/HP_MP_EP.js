async function updateStats() {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMg-ZrR1dmJeFH5wGwj_mNDrHCzDc8kw-FEyO1deuV7v9UFzdpQnq5a2c9s5EkEjWJrexa6mwDzGXY/pub?gid=0&single=true&output=csv";
    
    try {
        let response = await fetch(sheetUrl, { cache: "no-store" });
        let text = await response.text();
        let rows = text.trim().split("\n");

        if (rows.length < 2) {
            console.error("Fehler: Nicht genügend Datenzeilen in der Tabelle.");
            return;
        }

        let data = rows[1].split(","); // Zeile 2 (Index 1)

        if (data.length < 8) {
            console.error("Fehler: Nicht genügend Spalten für HP, MP und EP.");
            return;
        }

        // HP aus Spalten A (0) und B (1)
        let currentHP = parseInt(data[0].trim());
        let maxHP = parseInt(data[1].trim());

        if (!isNaN(currentHP) && !isNaN(maxHP) && maxHP > 0) {
            let hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
            document.getElementById("hp-bar").style.width = hpPercentage + "%";
            document.getElementById("hp-text").textContent = `${currentHP} / ${maxHP} HP`;
        } else {
            console.error("Fehler: Ungültige HP-Werte.");
        }

        // MP aus Spalten D (3) und E (4)
        let currentMP = parseInt(data[3].trim());
        let maxMP = parseInt(data[4].trim());

        if (!isNaN(currentMP) && !isNaN(maxMP) && maxMP > 0) {
            let mpPercentage = Math.max(0, Math.min(100, (currentMP / maxMP) * 100));
            document.getElementById("mp-bar").style.width = mpPercentage + "%";
            document.getElementById("mp-text").textContent = `${currentMP} / ${maxMP} MP`;
        } else {
            console.error("Fehler: Ungültige MP-Werte.");
        }

        // EP aus Spalten G (6) und H (7)
        let currentEP = parseInt(data[6].trim());
        let maxEP = parseInt(data[7].trim());

        if (!isNaN(currentEP) && !isNaN(maxEP) && maxEP > 0) {
            let epPercentage = Math.max(0, Math.min(100, (currentEP / maxEP) * 100));
            document.getElementById("ep-bar").style.width = epPercentage + "%";
            document.getElementById("ep-text").textContent = `${currentEP} / ${maxEP} EP`;
        } else {
            console.error("Fehler: Ungültige EP-Werte.");
        }

    } catch (error) {
        console.error("Fehler beim Laden der HP-, MP- und EP-Daten:", error);
    }
}

// Button-Klick für HP, MP & EP Update
document.addEventListener("DOMContentLoaded", function () {
    const updateButton = document.getElementById("update-btn");
    if (updateButton) {
        updateButton.addEventListener("click", updateStats);
    } else {
        console.error("Fehler: Der Update-Button wurde nicht gefunden!");
    }
});

// Initiales Laden der Daten
updateStats();
