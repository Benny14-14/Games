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

        let data = rows[1].split(",");

        if (data.length < 8) {
            console.error("Fehler: Nicht genügend Werte in der Tabelle.");
            return;
        }

        // HP
        updateBar("hp-bar", "hp-text", parseInt(data[0]), parseInt(data[1]), "HP");

        // MP
        updateBar("mp-bar", "mp-text", parseInt(data[3]), parseInt(data[4]), "MP");

        // EP
        updateBar("ep-bar", "ep-text", parseInt(data[6]), parseInt(data[7]), "EP");

    } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
    }
}

// Funktion zum Updaten der Balken
function updateBar(barId, textId, current, max, label) {
    if (!isNaN(current) && !isNaN(max) && max > 0) {
        let percentage = Math.max(0, Math.min(100, (current / max) * 100));
        document.getElementById(barId).style.width = percentage + "%";
        document.getElementById(textId).textContent = `${current} / ${max} ${label}`;
    } else {
        console.error(`Fehler: Ungültige Werte für ${label}`);
    }
}

// Button-Klick zum Aktualisieren
document.getElementById("update-btn").addEventListener("click", updateStats);

// Initiales Laden der Daten
updateStats();
