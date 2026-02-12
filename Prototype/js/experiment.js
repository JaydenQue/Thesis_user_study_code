
const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
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
        on_load: function() {
            const startTime = performance.now();
            const display = document.getElementById('loading-content');

            function animate() {
                const now = performance.now();
                const elapsed = now - startTime;

                if (elapsed >= TOTAL_DURATION) return;

                // COUNTDOWN
                if (conditionType === 'countdown') {
                    let numberToShow = "";

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
            jsPsych.data.get().last(1).values()[0].start_time = startTime; // Startzeit für logs
        },
        on_finish: function(data) {
            const endTime = performance.now();
            data.actual_duration = endTime - data.start_time;
        }
    };
}

// Survey TODO: Noch Messung implementen
const survey_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "Wie lange hat sich die Wartezeit angefühlt?",
    choices: ['Sehr kurz', 'Kurz', 'Mittel', 'Lang', 'Sehr lang'],
    margin_vertical: '10px'
};

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
timeline.push(survey_trial);

timeline.push(fixation);
timeline.push(createWaitingTrial(condition_order[1]));
timeline.push(survey_trial);

timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h1>Vielen Dank!</h1><p>Ihre Ergebnisse wurden gespeichert gespeichert.</p>",
    choices: ['Daten anzeigen']
});

jsPsych.run(timeline);
