// experiment.js

const jsPsych = initJsPsych({
    on_finish: function() {
        const lastTrialData = jsPsych.data.get().last(1).values()[0];
        if (lastTrialData.response === 0) {
            downloadCSV();
            document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>Download gestartet.</h1><p>Sie können das Fenster nun schließen.</p></div>';
        }
        else if (lastTrialData.response === 1) {
            downloadJSON();
            document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>Download gestartet.</h1><p>Sie können das Fenster nun schließen.</p></div>';
        }
    }
});

const TOTAL_DURATION = 5000; // 5000ms (600 + 4*1100)

function createWaitingTrial(conditionType) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
            <div class="video-container">
                <div class="ad-overlay">
                    <div id="loading-content" class="ad-content"></div>
                </div>
            </div>
        `,
        choices: "NO_KEYS",
        trial_duration: TOTAL_DURATION,
        data: {
            condition_type: conditionType
        },
        on_load: function() {
            const startTime = performance.now();
            const display = document.getElementById('loading-content');

            function animate() {
                const now = performance.now();
                const elapsed = now - startTime;

                if (elapsed >= TOTAL_DURATION) return;

                // COUNTDOWN
                if (conditionType === 'countdown') {
                    let numberToShow;

                    if (elapsed < 600) {
                        numberToShow = "5"; // 600ms
                    }
                    else if (elapsed < 1700) {
                        numberToShow = "4"; // 600 + 1100
                    }
                    else if (elapsed < 2800) {
                        numberToShow = "3"; // 1700 + 1100
                    }
                    else if (elapsed < 3900) {
                        numberToShow = "2"; // 2800 + 1100
                    }
                    else {
                        numberToShow = "1"; // rest bis 5000
                    }
                    display.innerText = `Video in ${numberToShow}...`;
                }

                // LADEBALKEN
                else {
                    const progress = elapsed / TOTAL_DURATION;
                    const percent = Math.floor(progress * 100);

                    display.innerHTML = `
                        <div style="width: 100%; height: 10px; background: #555; border-radius: 2px;">
                            <div style="width: ${percent}%; height: 100%; background: #fcba03;"></div>
                        </div>
                    `;
                }

                requestAnimationFrame(animate);
            }

            requestAnimationFrame(animate);
            jsPsych.data.get().last(1).values()[0].start_time = startTime;
        },
        on_finish: function(data) {
            const endTime = performance.now();
            data.actual_duration = endTime - data.start_time;
        }
    };
}

// Takt Reproduktion
function createTactReproduction() {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
            <div style="text-align: center; padding: 50px;">
                <h2>Takt-Reproduktion</h2>
                <div id="countdown-display" style="font-size: 80px; font-weight: bold; color: #fcba03; margin: 40px 0;">
                    5
                </div>
                <div id="instruction-phase">
                    <p>Klicken Sie mit der <strong>linken Maustaste</strong>, um den Countdown zu starten.</p>
                    <p>Klicken Sie dann <strong>im Takt des Countdowns</strong>.</p>
                    <p style="margin-top: 30px; font-size: 18px; color: #fcba03;">
                        Bereit? Klicken Sie zum Starten!
                    </p>
                </div>
                <div id="click-feedback" style="font-size: 20px; color: #666; display: none;">
                    Klicks: <span id="click-count">1</span> / 6
                </div>
            </div>
        `,
        choices: "NO_KEYS",
        trial_duration: null,
        data: {
            task: 'timing_measurement',
            measurement_type: 'tact_reproduction'
        },
        on_load: function() {
            const instructionPhase = document.getElementById('instruction-phase');
            const countdownDisplay = document.getElementById('countdown-display');
            const clickFeedback = document.getElementById('click-feedback');
            const clickCountDisplay = document.getElementById('click-count');

            const clickTimes = [];
            const TOTAL_CLICKS = 6;
            let countdownStarted = false;
            let countdownStartTime = null;
            let handlerRemoved = false;

            function updateCountdown() {
                if (!countdownStarted) return;

                const elapsed = performance.now() - countdownStartTime;

                let numberToShow;
                if (elapsed < 600) {
                    numberToShow = "5";
                } else if (elapsed < 1700) {
                    numberToShow = "4";
                } else if (elapsed < 2800) {
                    numberToShow = "3";
                } else if (elapsed < 3900) {
                    numberToShow = "2";
                } else if (elapsed < 5000) {
                    numberToShow = "1";
                } else {
                    numberToShow = "0";
                }

                countdownDisplay.textContent = numberToShow;

                if (elapsed < 5000) {
                    requestAnimationFrame(updateCountdown);
                }
            }

            function handleClick(e) {
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                    return;
                }

                if (e.button === 0 && !handlerRemoved) {
                    const clickTime = performance.now();
                    clickTimes.push(clickTime);

                    if (clickTimes.length === 1) {
                        instructionPhase.style.display = 'none';
                        clickFeedback.style.display = 'block';
                        countdownStarted = true;
                        countdownStartTime = clickTime;
                        requestAnimationFrame(updateCountdown);
                    } else {
                        clickCountDisplay.textContent = clickTimes.length;

                        countdownDisplay.style.transform = 'scale(1.1)';
                        setTimeout(() => {
                            countdownDisplay.style.transform = 'scale(1)';
                        }, 100);
                    }

                    if (clickTimes.length >= TOTAL_CLICKS && !handlerRemoved) {
                        handlerRemoved = true;
                        document.removeEventListener('mousedown', handleClick);

                        const intervals = [];
                        for (let i = 1; i < clickTimes.length; i++) {
                            intervals.push(clickTimes[i] - clickTimes[i-1]);
                        }

                        const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

                        setTimeout(() => {
                            jsPsych.finishTrial({
                                click_times: clickTimes,
                                intervals: intervals,
                                mean_interval: meanInterval,
                                countdown_start_time: countdownStartTime
                            });
                        }, 500);
                    }
                }
            }

            document.addEventListener('mousedown', handleClick);
        }
    };
}

// Zeitschätzung für Ladebalken
function createDurationEstimation() {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align: center; padding: 50px;">
                <h2>Zeitschätzung</h2>
                <p>Wie lange hat die Wartezeit mit dem Ladebalken gedauert?</p>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                </p>
            </div>
        `,
        choices: ['Kürzer als 5 Sekunden', 'Exakt 5 Sekunden', 'Länger als 5 Sekunden'],
        margin_vertical: '15px',
        data: {
            task: 'timing_measurement',
            measurement_type: 'duration_estimation'
        },
        on_finish: function(data) {
            const responses = ['shorter', 'exact', 'longer'];
            data.time_perception = responses[data.response];
        }
    };
}

// Ergebnisse für Takt Reproduktion
function createTactResults() {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const allData = jsPsych.data.get().filter({measurement_type: 'tact_reproduction'});
            const lastData = allData.values()[allData.count() - 1];

            const intervals = lastData.intervals;
            const meanInterval = lastData.mean_interval;
            let html = `
                <div style="text-align: center; padding: 30px;">
                    <h2>Ihre Messergebnisse (Countdown)</h2>
                    <p>Sie haben <strong>6 Klicks</strong> gemacht (1 Start + 5 im Takt).</p>
                    <p>Hier sind die <strong>5 Intervalle</strong> zwischen Ihren Takt-Klicks:</p>
                    <div style="margin: 20px 0; font-size: 18px;">
            `;

            intervals.forEach((interval, index) => {
                html += `<div>Intervall ${index + 1}: ${interval.toFixed(0)} ms</div>`;
            });

            html += `
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 5px; display: inline-block;">
                        <strong>Durchschnitt:</strong> ${meanInterval.toFixed(0)} ms<br>
                    </div>
                    <p style="margin-top: 20px; color: #666;">
                    </p>
                </div>
            `;

            return html;
        },
        choices: ['Erneut versuchen', 'Weiter'],
        margin_vertical: '10px',
        data: {
            screen: 'tact_results'
        },
        on_finish: function(data) {
            data.retry_requested = (data.response === 0);
        }
    };
}

// Ergebnisse für Zeitschätzung
function createEstimationResults() {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const allData = jsPsych.data.get().filter({measurement_type: 'duration_estimation'});
            const lastData = allData.values()[allData.count() - 1];

            const perceptionMap = {
                'shorter': 'kürzer als 5 Sekunden',
                'exact': 'exakt 5 Sekunden',
                'longer': 'länger als 5 Sekunden'
            };

            const perceptionText = perceptionMap[lastData.time_perception];

            return `
                <div style="text-align: center; padding: 30px;">
                    <h2>Ihre Zeitwahrnehmung (Ladebalken)</h2>
                    <div style="margin: 30px 0; padding: 30px; background: #f0f0f0; border-radius: 5px; display: inline-block;">
                        <p style="font-size: 18px; margin: 0;">Sie haben eingeschätzt, dass die Wartezeit</p>
                        <p style="font-size: 24px; font-weight: bold; color: #fcba03; margin: 15px 0;">
                            ${perceptionText}
                        </p>
                        <p style="font-size: 16px; margin: 0;">war.</p>
                    </div>
                    <p style="margin-top: 20px; color: #666;">
                    </p>
                </div>
            `;
        },
        choices: ['Weiter'],
        margin_vertical: '10px'
    };
}

function downloadCSV() {
    const relevantData = jsPsych.data.get().filterCustom(function(t){
        return t.ignore_in_analysis !== true;
    });

    const cleanData = relevantData.ignore(['stimulus', 'internal_node_id', 'trial_type', 'trial_index', 'time_elapsed']);

    cleanData.localSave('csv', `experiment_data_${Date.now()}.csv`);
}

function downloadJSON() {
    const relevantData = jsPsych.data.get().filterCustom(function(t){
        return t.ignore_in_analysis !== true;
    });

    relevantData.localSave('json', `experiment_data_${Date.now()}.json`);
}

function showDataSummary() {
    const allData = jsPsych.data.get();

    const countdownData = allData.filterCustom(function(trial){
        return trial.measurement_type === 'tact_reproduction' && trial.ignore_in_analysis !== true;
    });

    const barData = allData.filter({
        measurement_type: 'duration_estimation'
    });

    let summary = '<div style="text-align: left; max-width: 800px; margin: 0 auto; padding: 30px;">';
    summary += '<h2>Daten-Zusammenfassung</h2>';

    // COUNTDOWN Data
    if (countdownData.count() > 0) {
        summary += '<h3>Countdown (Takt-Reproduktion):</h3>';
        const trials = countdownData.values();

        for(let i = 0; i < trials.length; i++) {
            const trial = trials[i];
            summary += `<div style="margin: 15px 0; padding: 15px; background: #f0f0f0; border-radius: 5px;">`;
            summary += `<strong>Versuch ${i + 1}:</strong><br>`;
            summary += `Durchschnittliches Intervall: ${Math.round(trial.mean_interval)} ms<br>`;
            if(trial.intervals && Array.isArray(trial.intervals)){
                summary += `Intervalle: ${trial.intervals.map(n => Math.round(n)).join(', ')} ms`;
            }
            summary += `</div>`;
        }
    } else {
        summary += '<p>Keine gültigen Countdown-Daten gefunden.</p>';
    }

    // LADEBALKEN Data
    if (barData.count() > 0) {
        summary += '<h3>Ladebalken (Zeitschätzung):</h3>';
        const trials = barData.values();
        for(let i = 0; i < trials.length; i++) {
            const trial = trials[i];
            const perceptionMap = {
                'shorter': 'kürzer als 5 Sekunden',
                'exact': 'exakt 5 Sekunden',
                'longer': 'länger als 5 Sekunden'
            };
            summary += `<div style="margin: 15px 0; padding: 15px; background: #f0f0f0; border-radius: 5px;">`;
            summary += `<strong>Einschätzung:</strong> ${perceptionMap[trial.time_perception]}`;
            summary += `</div>`;
        }
    }

    summary += '</div>';
    return summary;
}

// Fixation Kreuz
const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<div style='font-size:30px;'>+</div>",
    choices: "NO_KEYS",
    trial_duration: 1000
};

// Randomizer
let condition_order = jsPsych.randomization.shuffle(['countdown', 'bar']);

let timeline = [];

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h1>Willkommen</h1><p>Drücken Sie Start für das Experiment.</p>",
    choices: ['Start']
});

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order[0]));

// Wenn Countdown: Loop für wiederholbare Takt-Reproduktion
if (condition_order[0] === 'countdown') {
    const countdown_loop = {
        timeline: [createTactReproduction(), createTactResults()],
        loop_function: function() {
            const lastResult = jsPsych.data.get().filter({screen: 'tact_results'}).last(1).values()[0];

            if (lastResult.retry_requested) {
                const allData = jsPsych.data.get();
                const tactData = allData.filter({measurement_type: 'tact_reproduction'});
                const resultData = allData.filter({screen: 'tact_results'});

                tactData.values().forEach((trial, index) => {
                    if (index < tactData.count() - 1) {
                        trial.ignore_in_analysis = true;
                    }
                });

                resultData.values().forEach((trial, index) => {
                    if (index < resultData.count() - 1) {
                        trial.ignore_in_analysis = true;
                    }
                });

                return true;
            }
            return false;
        }
    };
    timeline.push(countdown_loop);
} else {
    timeline.push(createDurationEstimation());
    timeline.push(createEstimationResults());
}

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order[1]));

if (condition_order[1] === 'countdown') {
    const countdown_loop = {
        timeline: [createTactReproduction(), createTactResults()],
        loop_function: function() {
            const lastResult = jsPsych.data.get().filter({screen: 'tact_results'}).last(1).values()[0];

            if (lastResult.retry_requested) {
                const allData = jsPsych.data.get();
                const tactData = allData.filter({measurement_type: 'tact_reproduction'});
                const resultData = allData.filter({screen: 'tact_results'});

                tactData.values().forEach((trial, index) => {
                    if (index < tactData.count() - 1) {
                        trial.ignore_in_analysis = true;
                    }
                });

                resultData.values().forEach((trial, index) => {
                    if (index < resultData.count() - 1) {
                        trial.ignore_in_analysis = true;
                    }
                });

                return true;
            }
            return false;
        }
    };
    timeline.push(countdown_loop);
} else {
    timeline.push(createDurationEstimation());
    timeline.push(createEstimationResults());
}

// Endscreen mit Download?
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return `
            <div style="text-align: center; padding: 30px;">
                <h1>Vielen Dank!</h1>
                <p>Das Experiment ist abgeschlossen.</p>
                ${showDataSummary()}
                <div style="margin-top: 30px;">
                    <p><strong>Wählen Sie eine Option zum Speichern der Daten:</strong></p>
                </div>
            </div>
        `;
    },
    choices: ['CSV herunterladen', 'JSON herunterladen'],
    margin_vertical: '10px',
    data: {
        screen: 'final_choice'
    }
});

jsPsych.run(timeline);