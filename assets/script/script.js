const inputs = document.querySelectorAll("input[type=\"number\"]");
const toggles = document.querySelectorAll(".toggle-input");
const outputs = document.querySelectorAll(".output-box");

let matlabObj = null;

function logDebug(message) {
    const logger = document.getElementById("debug-log");
    if(logger) {
        const time = new Date().toLocaleTimeString();
        logger.textContent = `[${time}] ${message}\n` + logger.textContent;
    }
    // return; // Disable logging
}

// Catch connection from HTML to MATLAB
function connectToMatlab(htmlComponent) {
    matlabObj = htmlComponent;
    logDebug("✔️ | APP -> MATLAB | Bridge connected.");

    matlabObj.addEventListener("DataChanged", function(event) {
        const results = event.Data;
        logDebug("✔️ | APP <- MATLAB | Received from backend: \n\n" + JSON.stringify(results) + "\n");
        
        if (results.action === "updateOutputs") {
            try {
                document.getElementById("vph").innerText = Number(results.vph).toFixed(0);
                document.getElementById("pctHgv").innerText = Number(results.pctHgv).toFixed(2);
                document.getElementById("corrSpeedHgv").innerText = Number(results.corrSpeedHgv).toFixed(2);
                document.getElementById("crtnCalc").innerText = Number(results.crtnCalc).toFixed(2);

                // Sum all corrections for site & environment correction value
                const envCorr = 
                      results.angCorr + 
                      results.gradCorr + 
                      results.distCorr + 
                      results.surfCorr + 
                      results.groundCorr + 
                      results.barrierCorr;

                document.getElementById("envCorr").innerText = Number(envCorr).toFixed(2);
                
                // Commenting out individual corrections for now to simplify UI, but can be re-enabled if needed
                // document.getElementById("angCorr").innerText = Number(results.angCorr).toFixed(2);
                // document.getElementById("gradCorr").innerText = Number(results.gradCorr).toFixed(2);
                // document.getElementById("distCorr").innerText = Number(results.distCorr).toFixed(2);
                // document.getElementById("surfCorr").innerText = Number(results.surfCorr).toFixed(2);
                // document.getElementById("groundCorr").innerText = Number(results.groundCorr).toFixed(2);
                // document.getElementById("barrierCorr").innerText = Number(results.barrierCorr).toFixed(2);
                
                document.getElementById("corrLevel").innerText = Number(results.corrLevel).toFixed(2);
                logDebug("✔️ | Updated successfully.");
            }catch (err) {
                logDebug("❌ | Failed to update UI: " + err.message);
                document.getElementById("corrLevel").innerText = "Error";
            }
        }
    });

    validateInputs();
}

document.querySelectorAll(".custom-select").forEach(select => {
    const selected = select.querySelector(".select-selected");
    const items = select.querySelector(".select-items");
    const options = select.querySelectorAll(".select-items div");

    // Toggle dropdown
    selected.addEventListener("click", function(e) {
        e.stopPropagation();
        // Close any other open dropdowns first
        document.querySelectorAll(".select-items").forEach(el => {
            if (el !== items) el.classList.add("select-hide");
        });
        items.classList.toggle("select-hide");
    });

    // Handle option click
    options.forEach(option => {
        option.addEventListener("click", function() {
            selected.innerText = this.innerText;
            select.setAttribute("data-value", this.getAttribute("data-val"));
            items.classList.add("select-hide");
            validateInputs(); // Re-calculate when changed
        });
    });
});

// Close dropdowns if clicking outside
document.addEventListener("click", () => {
    document.querySelectorAll(".select-items").forEach(el => el.classList.add("select-hide"));
});

function validateInputs() {
    let isValid = true;
    
    const totalVehicles = parseFloat(document.getElementById("totalVehicles").value);
    const hgvCount = parseFloat(document.getElementById("hgvCount").value);
    const timeObserved = parseFloat(document.getElementById("timeObserved").value);
    const velocity = parseFloat(document.getElementById("velocity").value);
    const angle = parseFloat(document.getElementById("angle").value);
    const distance = parseFloat(document.getElementById("distance").value);
    const gradient = parseFloat(document.getElementById("gradient").value);

    const setInvalid = (id) => {
        document.getElementById(id).classList.add("invalid");
        isValid = false;
    };
    const clearInvalid = (id) => {
        document.getElementById(id).classList.remove("invalid");
    };

    inputs.forEach(input => clearInvalid(input.id));

    // Validation checks
    if (isNaN(totalVehicles) || totalVehicles < 0) setInvalid("totalVehicles");
    if (isNaN(hgvCount) || hgvCount < 0 || hgvCount > totalVehicles) setInvalid("hgvCount");
    if (isNaN(timeObserved) || timeObserved <= 0) setInvalid("timeObserved");
    if (isNaN(velocity) || velocity <= 0) setInvalid("velocity");
    if (isNaN(angle) || angle <= 0 || angle > 180) setInvalid("angle");
    if (isNaN(distance) || distance < 0) setInvalid("distance");
    if (isNaN(gradient) || gradient < 0 || gradient > 100) setInvalid("gradient");

    if (!isValid) {
        outputs.forEach(output => { output.innerText = "----"; });
    } else {
        outputs.forEach(output => {
            if (output.innerText === "----") output.innerText = "0.00"; 
        });
        
        // Send data out to MATLAB
        if (matlabObj !== null) {
            const payload = {
                action: "calculate",
                totalVehicles: totalVehicles,
                hgvCount: hgvCount,
                timeObserved: timeObserved,
                timeUnit: document.querySelector("input[name=\"timeUnit\"]:checked").value,
                velocity: velocity,
                speedUnit: document.querySelector("input[name=\"speedUnit\"]:checked").value,
                angle: angle,
                distance: distance,
                distanceUnit: document.querySelector("input[name=\"distanceUnit\"]:checked").value,
                gradient: gradient,
                barrierCorrection: parseFloat(document.getElementById("barrierSelect").getAttribute("data-value")),
                groundType: parseFloat(document.getElementById("groundSelect").getAttribute("data-value")),
                roadSurface: document.getElementById("surfaceSelect").getAttribute("data-value")
            };
            
            logDebug("✔️ | APP -> MATLAB | Sending to backend...");
            matlabObj.Data = payload;
        }
    }
}

inputs.forEach(input => { input.addEventListener("input", validateInputs); });
toggles.forEach(toggle => { toggle.addEventListener("change", validateInputs); });