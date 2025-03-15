async function updateMP() {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMg-ZrR1dmJeFH5wGwj_mNDrHCzDc8kw-FEyO1deuV7v9UFzdpQnq5a2c9s5EkEjWJrexa6mwDzGXY/pub?gid=0&single=true&output=csv";
    
    try {
        let response = await fetch(sheetUrl, { cache: "no-store" });
        let text = await response.text();
        let rows = text.trim().split("\n");

        if (rows.length < 2) {
            console.error("Fehler: Nicht genügend Datenzeilen in der Tabelle.");
            return;
        }

        let mpData = rows[1].split(",");

        if (mpData.length < 2) {
            console.error("Fehler: Keine gültigen MP-Werte gefunden.");
            return;
        }

        let currentMP = parseInt(mpData[4].trim());
        let maxMP = parseInt(mpData[5].trim());

        if (!isNaN(currentMP) && !isNaN(maxMP) && maxMP > 0) {
            let mpPercentage = Math.max(0, Math.min(100, (currentMP / maxMP) * 100));
            document.getElementById("mp-bar").style.width = mpPercentage + "%";
            document.getElementById("mp-text").textContent = `${currentMP} / ${maxMP} HP`;
        } else {
            console.error("Fehler: Ungültige MP-Werte.");
        }

    } catch (error) {
        console.error("Fehler beim Laden der MP-Daten:", error);
    }
}

// Button-Klick für HP-Update
document.getElementById("update-btn").addEventListener("click", updateMP);

// Initiales Laden der HP-Daten
updateMP();

