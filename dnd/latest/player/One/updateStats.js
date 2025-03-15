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

        let data = rows[1].split(",");  // Zeile 2 aus der Tabelle (Index 1)

        if (data.length < 8) {
            console.error("Fehler: Nicht genügend Werte in der Zeile.");
            return;
        }

        let currentHP = parseInt(data[0].trim());
        let maxHP = parseInt(data[1].trim());
        let currentMP = parseInt(data[3].trim());
        let maxMP = parseInt(data[4].trim());
        let currentEP = parseInt(data[6].trim());
        let maxEP = parseInt(data[7].trim());

        // HP aktualisieren
        updateBar("hp-bar", "hp-text", currentHP, maxHP, "HP");

        // MP aktualisieren
        updateBar("mp-bar", "mp-text", currentMP, maxMP, "MP");

        // EP aktualisieren
        updateBar("ep-bar", "ep-text", currentEP, maxEP, "EP");

    } catch (error) {
        console.error("Fehler beim Laden der Stat-Daten:", error);
    }
}

function updateBar(barId, textId, current, max, label) {
    if (!isNaN(current) && !isNaN(max) && max > 0) {
        let percentage = Math.max(0, Math.min(100, (current / max) * 100));
        document.getElementById(barId).style.width = percentage + "%";
        document.getElementById(textId).textContent = `${current} / ${max} ${label}`;
    } else {
        console.error(`Fehler: Ungültige Werte für ${label}.`);
    }
}

// Button-Klick-Event hinzufügen
document.getElementById("update-btn").addEventListener("click", function() {
    updateHP();
    updateMP();
    updateEP();
});

// Initiales Laden der Werte
updateStats();
