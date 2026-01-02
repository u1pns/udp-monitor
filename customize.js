/**
 * customize.js
 * Provides Project-specific status parsing and status light rendering helpers.
 * Exports a factory that returns { getStatusLights, detectStatus } bound to the core UI.
 */

// Factory that accepts PaintButton and returns status helpers
function createCustomStatus(paintButton) {
    let currentStatus = 0;

    // Builds the status bar segment with four lights (ACTIVE, INTER, NONE, IDLE)
    function getStatusLights() {
        return [
            paintButton(" ACTIVE ", currentStatus === 0),
            paintButton(" INTER ", currentStatus === 1),
            paintButton(" NONE ", currentStatus === 2),
            paintButton(" IDLE ", currentStatus === 3)
        ].join(" | ");
    }

    // Parses incoming log lines and updates the WorkMeter status state
    function detectStatus(line) {
        try {
            const logLine = `${line}`;
            const regex = /\[.*-(\d{3,6})\]/;
            const match = logLine.match(regex);

            if (match) {
                const extractedNumber = Number(match[1]);
                if (extractedNumber < 2) currentStatus = 0;
                else if (extractedNumber < 70) currentStatus = 1;
            }

            if (logLine.indexOf("starting-none") > -1)
                currentStatus = 2;
            else if (logLine.indexOf("node2idle") > -1)
                currentStatus = 3;
        } catch (error) {
            console.log(error);
        }
    }

    return { getStatusLights, detectStatus };
}

module.exports = createCustomStatus;
