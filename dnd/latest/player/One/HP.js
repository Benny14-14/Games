async function updateHP() {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMg-ZrR1dmJeFH5wGwj_mNDrHCzDc8kw-FEyO1deuV7v9UFzdpQnq5a2c9s5EkEjWJrexa6mwDzGXY/pub?gid=0&single=true&output=csv";
    
    try {
        let response = await fetch(sheetUrl, { cache: "no-store" });
        let text = await response.text();
        let rows = text.trim().split("\n");

        if (rows.length < 2) {
            console.error("Fehler: Nicht genügend Datenzeilen in der Tabelle.");
            return;
        }

        let hpData = rows[1].split(",");

        if (hpData.length < 2) {
            console.error("Fehler: Keine gültigen HP-Werte gefunden.");
            return;
        }

        let currentHP = parseInt(hpData[0].trim());
        let maxHP = parseInt(hpData[1].trim());

        if (!isNaN(currentHP) && !isNaN(maxHP) && maxHP > 0) {
            let hpPercentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
            document.getElementById("hp-bar").style.width = hpPercentage + "%";
            document.getElementById("hp-text").textContent = `${currentHP} / ${maxHP} HP`;
        } else {
            console.error("Fehler: Ungültige HP-Werte.");
        }

    } catch (error) {
        console.error("Fehler beim Laden der HP-Daten:", error);
    }
}

// Button-Klick für HP-Update
document.getElementById("update-hp-btn").addEventListener("click", updateHP);

// Initiales Laden der HP-Daten
updateHP();
