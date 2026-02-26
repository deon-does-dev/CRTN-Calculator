const inputs = document.querySelectorAll('input[type="number"]');
const toggles = document.querySelectorAll('.toggle-input');
const outputs = document.querySelectorAll('.output-box');

let matlabObj = null;

function logDebug(message) {
    // const logger = document.getElementById('debug-log');
    // if(logger) {
    //     const time = new Date().toLocaleTimeString();
    //     logger.innerText = `[${time}] ${message}\n` + logger.innerText; 
    // }
    return; // Disable logging
}

// Catch connection from HTML to MATLAB
function connectToMatlab(htmlComponent) {
    matlabObj = htmlComponent;
    logDebug("SYS -> MATLAB Bridge Connected.");

    matlabObj.addEventListener("DataChanged", function(event) {
        const results = event.Data;
        logDebug("IN <- Received from MATLAB: " + JSON.stringify(results));
        
        if (results.action === "updateOutputs") {
            try {
                document.getElementById('vph').innerText = Number(results.vph).toFixed(0);
                document.getElementById('crtnCalc').innerText = Number(results.crtnCalc).toFixed(2);
                document.getElementById('pctHgv').innerText = Number(results.pctHgv).toFixed(2);
                document.getElementById('corrSpeedHgv').innerText = Number(results.corrSpeedHgv).toFixed(2);
                document.getElementById('angCorr').innerText = Number(results.angCorr).toFixed(2);
                document.getElementById('corrLevel').innerText = Number(results.corrLevel).toFixed(2);
                logDebug("SYS -> UI Updated successfully.");
            } catch (err) {
                logDebug("ERROR -> Failed to update UI: " + err.message);
                document.getElementById('corrLevel').innerText = "ERR";
            }
        }
    });

    validateInputs();
}

function validateInputs() {
    let isValid = true;
    
    const totalVehicles = parseFloat(document.getElementById('totalVehicles').value);
    const hgvCount = parseFloat(document.getElementById('hgvCount').value);
    const timeObserved = parseFloat(document.getElementById('timeObserved').value);
    const velocity = parseFloat(document.getElementById('velocity').value);
    const angle = parseFloat(document.getElementById('angle').value);

    const setInvalid = (id) => {
        document.getElementById(id).classList.add('invalid');
        isValid = false;
    };
    const clearInvalid = (id) => {
        document.getElementById(id).classList.remove('invalid');
    };

    inputs.forEach(input => clearInvalid(input.id));

    if (isNaN(totalVehicles) || totalVehicles < 0) setInvalid('totalVehicles');
    if (isNaN(hgvCount) || hgvCount < 0 || hgvCount > totalVehicles) setInvalid('hgvCount');
    if (isNaN(timeObserved) || timeObserved <= 0) setInvalid('timeObserved');
    if (isNaN(velocity) || velocity <= 0) setInvalid('velocity');
    if (isNaN(angle) || angle <= 0 || angle > 180) setInvalid('angle');

    if (!isValid) {
        outputs.forEach(output => { output.innerText = '----'; });
    } else {
        outputs.forEach(output => {
            if (output.innerText === '----') output.innerText = '0.00'; 
        });
        
        // Send data out to MATLAB
        if (matlabObj !== null) {
            const payload = {
                action: "calculate",
                totalVehicles: totalVehicles,
                hgvCount: hgvCount,
                timeObserved: timeObserved,
                timeUnit: document.querySelector('input[name="timeUnit"]:checked').value,
                velocity: velocity,
                speedUnit: document.querySelector('input[name="speedUnit"]:checked').value,
                angle: angle
            };
            
            logDebug("OUT -> Sending to MATLAB...");
            matlabObj.Data = payload;
        }
    }
}

inputs.forEach(input => { input.addEventListener('input', validateInputs); });
toggles.forEach(toggle => { toggle.addEventListener('change', validateInputs); });