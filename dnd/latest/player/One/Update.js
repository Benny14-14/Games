/* document.addEventListener("DOMContentLoaded", function () {
    const updateButton = document.getElementById("update-btn");
    
    if (updateButton) {
        updateButton.addEventListener("click", function () {
            updateHP();
            updateMP();
        });
    } else {
        console.error("Update-Button nicht gefunden!");
    }
});

*/

document.getElementById("update-btn").addEventListener("click", function() {
    document.querySelectorAll("iframe").forEach(iframe => {
        iframe.src = iframe.src; // Setzt die src neu und lädt das Iframe neu
    });
});
