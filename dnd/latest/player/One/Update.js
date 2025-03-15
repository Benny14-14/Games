document.addEventListener("DOMContentLoaded", function () {
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
