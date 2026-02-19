// experiment.js
const jsPsych = initJsPsych({
    on_finish: function() {
        const lastTrialData = jsPsych.data.get().last(1).values()[0];
        if (lastTrialData && lastTrialData.response === 0) {
            downloadCSV();
            document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>Download gestartet.</h1><p>Sie können das Fenster nun schließen.</p></div>';
        }
        else if (lastTrialData && lastTrialData.response === 1) {
            downloadJSON();
            document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>Download gestartet.</h1><p>Sie können das Fenster nun schließen.</p></div>';
        }
    }
});

const TOTAL_DURATION = 5000; // 5000ms

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
        data: { condition_type: conditionType },
        on_load: function() {
            const startTime = performance.now();
            const display = document.getElementById('loading-content');

            function animate() {
                const now = performance.now();
                const elapsed = now - startTime;
                if (elapsed >= TOTAL_DURATION) return;

                if (conditionType === 'countdown_irregular') {
                    let numberToShow;
                    if (elapsed < 600) numberToShow = "5";
                    else if (elapsed < 1700) numberToShow = "4";
                    else if (elapsed < 2800) numberToShow = "3";
                    else if (elapsed < 3900) numberToShow = "2";
                    else numberToShow = "1";
                    display.innerText = `Video in ${numberToShow}...`;
                }
                else if (conditionType === 'countdown_regular') {
                    let numberToShow;
                    if (elapsed < 1000) numberToShow = "5";
                    else if (elapsed < 2000) numberToShow = "4";
                    else if (elapsed < 3000) numberToShow = "3";
                    else if (elapsed < 4000) numberToShow = "2";
                    else numberToShow = "1";
                    display.innerText = `Video in ${numberToShow}...`;
                }
                else if (conditionType === 'bar') {
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
            data.actual_duration = performance.now() - data.start_time;
        }
    };
}

function createTactReproduction(countdownType, displayTitle) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
            <div style="text-align: center; padding: 50px;">
                <h2>${displayTitle}</h2>
                <div id="countdown-display" style="font-size: 80px; font-weight: bold; color: #fcba03; margin: 40px 0;">5</div>
                <div id="instruction-phase">
                    <p>Klicken Sie mit der <strong>linken Maustaste</strong>, um den Countdown zu starten.</p>
                    <p>Klicken Sie dann <strong>im Takt dieses Countdowns</strong>.</p>
                    <p id="ready-text" style="margin-top: 30px; font-size: 18px; color: #ccc; transition: color 0.3s;">Einen Moment bitte ...</p>
                </div>
                <div id="click-feedback" style="font-size: 20px; color: #666; display: none;">
                    Klicks: <span id="click-count">1</span> / 6
                </div>
            </div>
        `,
        choices: "NO_KEYS",
        data: { task: 'timing_measurement', measurement_type: 'tact_reproduction', countdown_type: countdownType },
        on_load: function() {
            const instructionPhase = document.getElementById('instruction-phase');
            const countdownDisplay = document.getElementById('countdown-display');
            const clickFeedback = document.getElementById('click-feedback');
            const clickCountDisplay = document.getElementById('click-count');
            const readyText = document.getElementById('ready-text');

            const clickTimes = [];
            const TOTAL_CLICKS = 6;
            let countdownStarted = false;
            let countdownStartTime = null;
            let handlerRemoved = false;
            let isClickable = false;

            setTimeout(() => {
                isClickable = true;
                readyText.style.color = '#fcba03';
                readyText.innerText = "Bereit? Klicken Sie zum Starten!";
            }, 1000);

            function updateCountdown() {
                if (!countdownStarted) return;
                const elapsed = performance.now() - countdownStartTime;
                let numberToShow;

                if (countdownType === 'countdown_irregular') {
                    if (elapsed < 600) numberToShow = "5";
                    else if (elapsed < 1700) numberToShow = "4";
                    else if (elapsed < 2800) numberToShow = "3";
                    else if (elapsed < 3900) numberToShow = "2";
                    else if (elapsed < 5000) numberToShow = "1";
                    else numberToShow = "0";
                } else {
                    if (elapsed < 1000) numberToShow = "5";
                    else if (elapsed < 2000) numberToShow = "4";
                    else if (elapsed < 3000) numberToShow = "3";
                    else if (elapsed < 4000) numberToShow = "2";
                    else if (elapsed < 5000) numberToShow = "1";
                    else numberToShow = "0";
                }

                countdownDisplay.textContent = numberToShow;
                if (elapsed < 5000) requestAnimationFrame(updateCountdown);
            }

            function handleClick(e) {
                if (!isClickable) return;
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;

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
                        setTimeout(() => countdownDisplay.style.transform = 'scale(1)', 100);
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

function createTactResults(countdownType, displayTitle) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const allData = jsPsych.data.get().filter({measurement_type: 'tact_reproduction', countdown_type: countdownType});
            const lastData = allData.values()[allData.count() - 1];
            const intervals = lastData.intervals;
            const meanInterval = lastData.mean_interval;
            let html = `
                <div style="text-align: center; padding: 30px;">
                    <h2>Ergebnisse: ${displayTitle}</h2>
                    <p>Hier sind die <strong>5 Intervalle</strong> zwischen Ihren Klicks:</p>
                    <div style="margin: 20px 0; font-size: 18px;">
            `;
            intervals.forEach((interval, index) => {
                html += `<div>Intervall ${index + 1}: ${interval.toFixed(0)} ms</div>`;
            });
            html += `
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 5px; display: inline-block;">
                        <strong>Durchschnitt:</strong> ${meanInterval.toFixed(0)} ms
                    </div>
                </div>
            `;
            return html;
        },
        choices: ['Erneut versuchen', 'Weiter'],
        margin_vertical: '10px',
        data: { screen: 'tact_results' },
        on_finish: function(data) {
            data.retry_requested = (data.response === 0);
        }
    };
}

function downloadCSV() {
    const relevantData = jsPsych.data.get().filterCustom(function(t){ return t.ignore_in_analysis !== true; });
    relevantData.ignore(['stimulus', 'internal_node_id', 'trial_type', 'trial_index', 'time_elapsed']).localSave('csv', `experiment_data_${Date.now()}.csv`);
}

function downloadJSON() {
    const relevantData = jsPsych.data.get().filterCustom(function(t){ return t.ignore_in_analysis !== true; });
    relevantData.localSave('json', `experiment_data_${Date.now()}.json`);
}

function showDataSummary() {
    const allData = jsPsych.data.get();

    const irregularTact = allData.filterCustom(t => t.measurement_type === 'tact_reproduction' && t.countdown_type === 'countdown_irregular' && t.ignore_in_analysis !== true);
    const regularTact = allData.filterCustom(t => t.measurement_type === 'tact_reproduction' && t.countdown_type === 'countdown_regular' && t.ignore_in_analysis !== true);
    const comp1 = allData.filter({ measurement_type: 'direct_comparison_1' });
    const comp2 = allData.filter({ measurement_type: 'direct_comparison_2' });

    let summary = '<div style="text-align: left; max-width: 800px; margin: 0 auto; padding: 30px;"><h2>Zusammenfassung Ihrer Daten</h2>';

    summary += '<h3>Vergleiche:</h3>';
    if (comp1.count() > 0) {
        const c1 = comp1.values()[0].comparison_choice;
        const mapComp1 = {
            'countdown_irregular': 'Countdown',
            'bar': 'Ladebalken',
            'equal': 'Gleich lang'
        };
        summary += `<div style="margin: 5px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;"><strong>Teil 1 (Countdown vs Ladebalken) als länger empfunden:</strong> ${mapComp1[c1] || c1}</div>`;
    }
    if (comp2.count() > 0) {
        const c2 = comp2.values()[0].chosen_condition;
        const mapComp2 = {
            'countdown_irregular': 'Unregelmäßiger Countdown',
            'countdown_regular': 'Regelmäßiger Countdown',
            'equal': 'Gleich lang'
        };
        summary += `<div style="margin: 5px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;"><strong>Teil 2 (Zwei Countdowns) als länger empfunden:</strong> ${mapComp2[c2] || c2}</div>`;
    }

    summary += '<h3>Takt Reproduktionen (Durchschnitte):</h3>';
    if (irregularTact.count() > 0) {
        summary += `<div style="margin: 5px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;"><strong>Unregelmäßig:</strong> ${Math.round(irregularTact.values()[irregularTact.count()-1].mean_interval)} ms</div>`;
    }
    if (regularTact.count() > 0) {
        summary += `<div style="margin: 5px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;"><strong>Regelmäßig:</strong> ${Math.round(regularTact.values()[regularTact.count()-1].mean_interval)} ms</div>`;
    }

    return summary + '</div>';
}

const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<div style='font-size:30px;'>+</div>",
    choices: "NO_KEYS",
    trial_duration: 1000
};

let timeline = [];

let condition_order_1 = jsPsych.randomization.shuffle(['countdown_irregular', 'bar']);

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h1>Willkommen (Teil 1)</h1><p>Sie werden nun nacheinander zwei verschiedene Videos sehen. Bitte beobachten Sie diese aufmerksam.</p><p>Drücken Sie Start für das Experiment.</p>",
    choices: ['Start']
});

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order_1[0]));

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align: center; padding: 50px;">
            <h2>Video 1 abgeschlossen</h2>
            <p>Klicken Sie auf 'Weiter', um das <strong>zweite Video</strong> zu starten.</p>
        </div>
    `,
    choices: ['Weiter']
});

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order_1[1]));

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align: center; padding: 50px;">
            <h2>Vergleich (Teil 1)</h2>
            <p>Sie haben nun beide Varianten gesehen.</p>
            <p><strong>Welches der beiden Videos hat Ihrer Meinung nach länger geladen?</strong></p>
        </div>
    `,
    choices: ['Das Video mit dem Countdown', 'Das Video mit dem Ladebalken', 'Beide wirkten gleich lang'],
    margin_vertical: '15px',
    data: { task: 'timing_measurement', measurement_type: 'direct_comparison_1' },
    on_finish: function(data) {
        const responses = ['countdown_irregular', 'bar', 'equal'];
        data.comparison_choice = responses[data.response];
    }
});

let condition_order_2 = jsPsych.randomization.shuffle(['countdown_irregular', 'countdown_regular']);

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align: center; padding: 50px;">
            <h2>Teil 2</h2>
            <p>Sie werden nun zwei verschiedene Videos sehen.</p>
            <p>Bitte beobachten Sie auch diese wieder aufmerksam.</p>
        </div>
    `,
    choices: ['Start Teil 2']
});

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order_2[0]));

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align: center; padding: 50px;">
            <h2>Erstes Video abgeschlossen</h2>
            <p>Klicken Sie auf 'Weiter', um das <strong>zweite Video</strong> zu starten.</p>
        </div>
    `,
    choices: ['Weiter']
});

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order_2[1]));

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align: center; padding: 50px;">
            <h2>Vergleich (Teil 2)</h2>
            <p>Sie haben nun zwei verschiedene Videos gesehen.</p>
            <p><strong>Welcher der beiden Countdowns hat Ihrer Meinung nach länger gedauert?</strong></p>
        </div>
    `,
    choices: ['Der erste Countdown', 'Der zweite Countdown', 'Beide wirkten gleich lang'],
    margin_vertical: '15px',
    data: { task: 'timing_measurement', measurement_type: 'direct_comparison_2', condition_order: condition_order_2 },
    on_finish: function(data) {
        if (data.response === 0) data.chosen_condition = condition_order_2[0];
        else if (data.response === 1) data.chosen_condition = condition_order_2[1];
        else data.chosen_condition = 'equal';
    }
});

let tact_order = jsPsych.randomization.shuffle(['countdown_irregular', 'countdown_regular']);

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="text-align: center; padding: 50px;">
            <h2>Videos abgeschlossen</h2>
            <p>Jetzt folgen noch zwei kurze Aufgaben zu den Videos, die Sie gesehen haben.</p>
            <p>Sie sollen den Takt der beiden Countdowns aus dem Gedächtnis reproduzieren.</p>
        </div>
    `,
    choices: ['Zu den Aufgaben'],
    data: { task: 'timing_measurement', measurement_type: 'tact_instructions', tact_reproduction_order: tact_order }
});

tact_order.forEach((condition, index) => {

    let conditionName = condition === 'countdown_irregular' ? 'unregelmäßigen Countdown' : 'regelmäßigen Countdown';
    let displayTitle = condition === 'countdown_irregular' ? 'Takt Reproduktion: Unregelmäßiger Countdown' : 'Takt Reproduktion: Regelmäßiger Countdown';
    let resultTitle = condition === 'countdown_irregular' ? 'Unregelmäßiger Countdown' : 'Regelmäßiger Countdown';

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align: center; padding: 50px;">
                <h2>Aufgabe ${index + 1} von 2</h2>
                <p>Erinnern Sie sich an den <strong>${conditionName}</strong>?</p>
                <p>Bitte reproduzieren Sie nun dessen Takt.</p>
            </div>
        `,
        choices: ['Starten']
    });

    const tact_loop = {
        timeline: [
            createTactReproduction(condition, displayTitle),
            createTactResults(condition, resultTitle)
        ],
        loop_function: function(data) {
            const lastData = data.last(1).values()[0];
            return lastData.retry_requested === true;
        }
    };
    timeline.push(tact_loop);
});

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
    data: { screen: 'final_choice' }
});

jsPsych.run(timeline);