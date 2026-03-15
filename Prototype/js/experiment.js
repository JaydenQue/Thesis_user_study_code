const jsPsych = initJsPsych({
    on_finish: function() {
        document.body.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <h1>Experiment beendet. Vielen Dank!</h1>
                <p>Klicken Sie unten, um Ihre Daten zu speichern.</p>
                <button id="btn-csv" style="padding: 10px 20px; font-size: 16px; margin: 10px; cursor: pointer;">CSV Herunterladen</button>
                <button id="btn-json" style="padding: 10px 20px; font-size: 16px; margin: 10px; cursor: pointer;">JSON Herunterladen</button>
            </div>
        `;
        document.getElementById('btn-csv').addEventListener('click', () => {
            jsPsych.data.get().localSave('csv', `experiment_data_${Date.now()}.csv`);
        });
        document.getElementById('btn-json').addEventListener('click', () => {
            jsPsych.data.get().localSave('json', `experiment_data_${Date.now()}.json`);
        });
    }
});

// --- GLOBALE EINSTELLUNGEN ---
const TOTAL_DURATION = 5000; // Dauer der Wartebildschirme (5000ms)

const colorDefinitions = [
    { name: 'ROT', hex: '#ff4d4d', idx: 0 },
    { name: 'GELB', hex: '#fffa65', idx: 1 },
    { name: 'BLAU', hex: '#1e90ff', idx: 2 },
    { name: 'GRÜN', hex: '#32ff7e', idx: 3 }
];

// --- CSS INJEKTION ---
function injectTaskStyles() {
    const styleString = `
        body { user-select: none; -webkit-user-select: none; background-color: #f9f9f9; }
        
        #color-matching-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Container für Countdown, Ladebalken oder Wort in der Mitte */
        #central-stimulus {
            z-index: 10;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 400px;
            height: 100px;
        }

        .color-box {
            position: absolute;
            width: 40vw;  
            height: 35vh; 
            cursor: pointer;
            border: 8px solid white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            transition: transform 0.1s, box-shadow 0.1s;
            border-radius: 20px;
        }

        .color-box:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
        .color-box:active { transform: scale(0.98); box-shadow: 0 2px 10px rgba(0,0,0,0.15); }

        .box-rot { top: 20px; left: 20px; background-color: ${colorDefinitions[0].hex}; }
        .box-gelb { top: 20px; right: 20px; background-color: ${colorDefinitions[1].hex}; }
        .box-blau { bottom: 20px; left: 20px; background-color: ${colorDefinitions[2].hex}; }
        .box-gruen { bottom: 20px; right: 20px; background-color: ${colorDefinitions[3].hex}; }
        
        .jspsych-content-wrapper { padding: 0 !important; }
    `;
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styleString;
    document.head.appendChild(styleTag);
}
injectTaskStyles();

// --- WAITING TRIAL FÜR TEIL 3 & 4 (Ohne schwarzes Rechteck) ---
function createWaitingTrial(conditionType, phaseLabel) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<div id="central-stimulus" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>`,
        choices: "NO_KEYS",
        trial_duration: TOTAL_DURATION,
        data: { condition_type: conditionType, phase: phaseLabel },
        on_load: function() {
            const startTime = performance.now();
            const display = document.getElementById('central-stimulus');

            function animate() {
                const now = performance.now();
                const elapsed = now - startTime;
                if (elapsed >= TOTAL_DURATION) return;

                if (conditionType === 'countdown_irregular') {
                    let num = elapsed < 600 ? "5" : elapsed < 1700 ? "4" : elapsed < 2800 ? "3" : elapsed < 3900 ? "2" : "1";
                    display.innerHTML = `<span style="font-size: 40px; color: #555; font-weight: bold;">Laden... ${num}</span>`;
                }
                else if (conditionType === 'countdown_regular') {
                    let num = elapsed < 1000 ? "5" : elapsed < 2000 ? "4" : elapsed < 3000 ? "3" : elapsed < 4000 ? "2" : "1";
                    display.innerHTML = `<span style="font-size: 40px; color: #555; font-weight: bold;">Laden... ${num}</span>`;
                }
                else if (conditionType === 'bar_regular') {
                    const pct = Math.floor((elapsed / TOTAL_DURATION) * 100);
                    display.innerHTML = `
                        <div style="width: 300px; height: 16px; background: #ddd; border-radius: 8px; overflow: hidden; border: 2px solid #aaa;">
                            <div style="width: ${pct}%; height: 100%; background: #fcba03;"></div>
                        </div>
                    `;
                }
                else if (conditionType === 'bar_irregular') {
                    let pct = elapsed < 600 ? (elapsed / 600) * 20 : 20 + ((elapsed - 600) / 4400) * 80;
                    display.innerHTML = `
                        <div style="width: 300px; height: 16px; background: #ddd; border-radius: 8px; overflow: hidden; border: 2px solid #aaa;">
                            <div style="width: ${Math.floor(pct)}%; height: 100%; background: #fcba03;"></div>
                        </div>
                    `;
                }
                requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        }
    };
}

const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<div style='font-size:50px; color: #888;'>+</div>",
    choices: "NO_KEYS",
    trial_duration: 1000
};

let timeline = [];

// --- EINLEITUNG ---
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h1>Willkommen zum Experiment</h1><p>Vielen Dank für Ihre Teilnahme.<br>Dieses Experiment besteht aus drei kurzen Teilen. Bitte folgen Sie den Anweisungen auf dem Bildschirm.</p>",
    choices: ['Starten']
});

// ==========================================
// TEIL 1: REAKTIONSZEIT (Kombinierter Trial)
// ==========================================
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Teil 1: Reaktionsaufgabe</h2>
        <p>Sie sehen in der Mitte des Bildschirms einen Ladebildschirm. In den 4 Ecken sind bereits Farbfelder sichtbar.</p>
        <p><strong>Sobald der Ladebildschirm verschwindet</strong>, erscheint in der Mitte ein Farbname (z.B. "ROT") in <strong>schwarzer Schrift</strong>.</p>
        <p>Klicken Sie so schnell wie möglich auf das Farbfeld, das zum geschriebenen Wort passt.</p>
        
        <div style="background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 25px auto; max-width: 600px; text-align: left; border-radius: 4px;">
            <strong>WICHTIG FÜR DIE MESSUNG:</strong><br>
            Bitte lassen Sie Ihren Mauszeiger während des gesamten Ladebildschirms <strong>in der Mitte des Bildschirms</strong> ruhen. Bewegen Sie die Maus erst, wenn das Wort erscheint!
        </div>
    `,
    choices: ['Verstanden, Aufgabe starten']
});

const rt_conditions = jsPsych.randomization.shuffle(['countdown_regular', 'countdown_irregular', 'bar_regular', 'bar_irregular']);

rt_conditions.forEach(condition => {
    timeline.push(fixation);

    // Nahtloser Trial: Wartezeit + Reaktionszeit in einem Screen
    timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        choices: "NO_KEYS",
        stimulus: `
            <div id="color-matching-container">
                <div id="central-stimulus"></div>
                <div class="color-box box-rot" data-color-idx="0"></div>
                <div class="color-box box-gelb" data-color-idx="1"></div>
                <div class="color-box box-blau" data-color-idx="2"></div>
                <div class="color-box box-gruen" data-color-idx="3"></div>
            </div>
        `,
        data: { task: 'reaction_time_measurement', preceding_condition: condition },
        on_load: function() {
            const centralDisplay = document.getElementById('central-stimulus');
            const boxes = document.querySelectorAll('.color-box');

            // Random Wort vorbereiten
            const targetColorIdx = Math.floor(Math.random() * 4);
            const targetWord = colorDefinitions[targetColorIdx].name;
            const correctIdx = colorDefinitions[targetColorIdx].idx;

            const animStartTime = performance.now();
            let rtStartTime = null;
            let phase = 'waiting'; // 'waiting' -> 'reacting' -> 'done'

            // Animation Loop (5s)
            function animate() {
                const now = performance.now();
                const elapsed = now - animStartTime;

                // Sobald 5 Sekunden um sind: Ladebalken/Countdown durch Wort ersetzen
                if (elapsed >= TOTAL_DURATION) {
                    phase = 'reacting';
                    centralDisplay.innerHTML = `<span style="font-size: 72px; font-weight: bold; color: black; text-transform: uppercase;">${targetWord}</span>`;
                    rtStartTime = performance.now(); // Start der Zeitmessung!
                    return;
                }

                // Während der 5 Sekunden: Zeichnen des Countdowns oder Balkens
                if (condition === 'countdown_irregular') {
                    let num = elapsed < 600 ? "5" : elapsed < 1700 ? "4" : elapsed < 2800 ? "3" : elapsed < 3900 ? "2" : "1";
                    centralDisplay.innerHTML = `<span style="font-size: 40px; color: #555; font-weight: bold;">Laden... ${num}</span>`;
                }
                else if (condition === 'countdown_regular') {
                    let num = elapsed < 1000 ? "5" : elapsed < 2000 ? "4" : elapsed < 3000 ? "3" : elapsed < 4000 ? "2" : "1";
                    centralDisplay.innerHTML = `<span style="font-size: 40px; color: #555; font-weight: bold;">Laden... ${num}</span>`;
                }
                else if (condition === 'bar_regular') {
                    const pct = Math.floor((elapsed / TOTAL_DURATION) * 100);
                    centralDisplay.innerHTML = `
                        <div style="width: 300px; height: 16px; background: #ddd; border-radius: 8px; overflow: hidden; border: 2px solid #aaa;">
                            <div style="width: ${pct}%; height: 100%; background: #fcba03;"></div>
                        </div>
                    `;
                }
                else if (condition === 'bar_irregular') {
                    let pct = elapsed < 600 ? (elapsed / 600) * 20 : 20 + ((elapsed - 600) / 4400) * 80;
                    centralDisplay.innerHTML = `
                        <div style="width: 300px; height: 16px; background: #ddd; border-radius: 8px; overflow: hidden; border: 2px solid #aaa;">
                            <div style="width: ${Math.floor(pct)}%; height: 100%; background: #fcba03;"></div>
                        </div>
                    `;
                }
                requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);

            // Klick-Logik
            boxes.forEach(box => {
                box.addEventListener('click', function() {
                    if (phase !== 'reacting') return; // Klicks während des Countdowns ignorieren
                    phase = 'done';

                    const clickTime = performance.now();
                    const rt = clickTime - rtStartTime;
                    const clickedIdx = parseInt(this.getAttribute('data-color-idx'));
                    const isCorrect = (clickedIdx === correctIdx);

                    if(isCorrect) this.style.borderColor = "#2ed573";
                    else this.style.borderColor = "#ff4757";

                    setTimeout(() => {
                        jsPsych.finishTrial({
                            rt: rt,
                            response: clickedIdx,
                            target_word: targetWord,
                            correct_choice_idx: correctIdx,
                            correct: isCorrect
                        });
                    }, 200);
                });
            });
        }
    });
});

// ==========================================
// TEIL 2: DIREKTER VERGLEICH (2-AFC)
// ==========================================
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Teil 2: Direkter Vergleich</h2>
        <p>Sie werden nun jeweils <strong>zwei Ladebildschirme nacheinander</strong> sehen.</p>
        <p>Bitte entscheiden Sie danach, welcher der beiden Ladevorgänge sich für Sie <strong>länger</strong> angefühlt hat.</p>
    `,
    choices: ['Verstanden']
});

// Die 5 Vergleiche (werden für jeden User zufällig gemischt)
const comparisons = jsPsych.randomization.shuffle([
    { pair: ['countdown_regular', 'countdown_irregular'], id: 'compare_countdowns' },
    { pair: ['bar_regular', 'bar_irregular'], id: 'compare_bars' },
    { pair: ['countdown_irregular', 'bar_irregular'], id: 'compare_irregular_formats' },
    // NEU: Die beiden Kreuz-Vergleiche
    { pair: ['countdown_irregular', 'bar_regular'], id: 'compare_cd_irreg_vs_bar_reg' },
    { pair: ['countdown_regular', 'bar_irregular'], id: 'compare_cd_reg_vs_bar_irreg' }
]);

comparisons.forEach((comp, index) => {
    // Die Reihenfolge von Video 1 und Video 2 innerhalb des Paares zufällig mischen
    const order = jsPsych.randomization.shuffle(comp.pair);

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        // Dynamische Anzeige: "Vergleich 1 von 5", "2 von 5", etc.
        stimulus: `<div style="padding: 50px;"><h3>Vergleich ${index + 1} von ${comparisons.length}</h3><p>Klicken Sie auf 'Start', um den <strong>ersten</strong> Ladebildschirm zu sehen.</p></div>`,
        choices: ['Start']
    });

    // Erstes Video
    timeline.push(fixation);
    timeline.push(createWaitingTrial(order[0], `comparison_${index+1}_video_1`));

    // Zwischenbildschirm
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `<div style="padding: 50px;"><h3>Erster Ladebildschirm beendet</h3><p>Klicken Sie auf 'Weiter', um den <strong>zweiten</strong> zu sehen.</p></div>`,
        choices: ['Weiter']
    });

    // Zweites Video
    timeline.push(fixation);
    timeline.push(createWaitingTrial(order[1], `comparison_${index+1}_video_2`));

    // Die "Forced Choice" Abfrage (ohne Gleich-Lang-Option)
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div style="text-align: center; padding: 50px;">
                <h2>Vergleich</h2>
                <p>Welcher der beiden Ladebildschirme hat sich <strong>länger</strong> angefühlt?</p>
            </div>
        `,
        choices: ['Der ERSTE Ladebildschirm', 'Der ZWEITE Ladebildschirm'],
        margin_vertical: '15px',
        data: {
            task: 'direct_comparison',
            comparison_id: comp.id,
            condition_1_shown: order[0],
            condition_2_shown: order[1]
        },
        on_finish: function(data) {
            // Speichern, welche Bedingung der User tatsächlich als "länger" empfand
            data.chosen_as_longer = (data.response === 0) ? order[0] : order[1];
        }
    });
});

// ==========================================
// TEIL 3: KLASSIFIZIERUNG
// ==========================================
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h2>Teil 3: Beobachtungsgabe</h2><p><br>Sie sehen nun mehrere Ladebildschirme hintereinander. Bewerten Sie nach jedem Bildschirm, ob er regelmäßig oder unregelmäßig schnell war.</p>",
    choices: ['Verstanden']
});

const classification_conditions = jsPsych.randomization.shuffle([
    'countdown_regular', 'countdown_regular',
    'countdown_irregular', 'countdown_irregular',
    'bar_regular', 'bar_regular',
    'bar_irregular', 'bar_irregular'
]);

classification_conditions.forEach(condition => {
    timeline.push(fixation);
    timeline.push(createWaitingTrial(condition, 'classification_wait'));

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `<div style="padding: 30px;"><h3>War dieser Verlauf normal oder manipuliert?</h3></div>`,
        choices: ['Normal (gleichmäßig)', 'Manipuliert (unregelmäßig)'],
        data: { task: 'classification', condition_shown: condition },
        on_finish: function(data) {
            const is_manipulated = condition.includes('irregular');
            data.correct_guess = (is_manipulated === (data.response === 1));
        }
    });
});

// ==========================================
// TEIL 4: ZEITREPRODUKTION (Mit Retry-Option)
// ==========================================
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: "<h2>Teil 4: Zeitwahrnehmung</h2><p>Sie sehen nun noch einmal Ladebildschirme. Prägen Sie sich ein, wie lange die Wartezeit gefühlt dauert.</p><p>Direkt danach müssen Sie die <strong>linke Maustaste genau so lange gedrückt halten</strong>, wie die Wartezeit gedauert hat.</p><p>Falls Sie abrutschen, können Sie den Versuch wiederholen.</p>",
    choices: ['Verstanden']
});

const reproduction_conditions = jsPsych.randomization.shuffle([
    'countdown_regular', 'countdown_regular',
    'countdown_irregular', 'countdown_irregular',
    'bar_regular', 'bar_regular',
    'bar_irregular', 'bar_irregular'
]);

reproduction_conditions.forEach(condition => {

    // Wir packen den Wartebildschirm, die Messung UND die Abfrage in eine Timeline-Variable
    const trial_timeline = [];

    trial_timeline.push(fixation);
    trial_timeline.push(createWaitingTrial(condition, 'reproduction_wait'));

    trial_timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
            <div style="padding: 50px; user-select: none;">
                <h2>Jetzt reproduzieren</h2>
                <p>Klicken und halten Sie die <strong>linke Maustaste</strong> gedrückt.</p>
                <p>Lassen Sie los, wenn Sie denken, dass die Zeit um ist.</p>
                <div id="repro-feedback" style="margin-top: 40px; font-size: 24px; color: #fcba03; height: 30px; font-weight: bold;"></div>
            </div>
        `,
        choices: "NO_KEYS",
        data: { task: 'time_reproduction_measurement', preceding_condition: condition },
        on_load: function() {
            let holdStart = 0;
            let isHolding = false;
            let handlerRemoved = false;
            const feedback = document.getElementById('repro-feedback');

            const downHandler = (e) => {
                if (e.button === 0 && !isHolding && !handlerRemoved) {
                    isHolding = true;
                    holdStart = performance.now();
                    feedback.innerText = "Messung läuft...";
                    feedback.style.color = "#ff4d4d";
                }
            };

            const upHandler = (e) => {
                if (e.button === 0 && isHolding && !handlerRemoved) {
                    const holdDuration = performance.now() - holdStart;
                    handlerRemoved = true;
                    isHolding = false;
                    feedback.innerText = "Gespeichert!";
                    feedback.style.color = "#2ed573";

                    document.removeEventListener('mousedown', downHandler);
                    document.removeEventListener('mouseup', upHandler);
                    document.removeEventListener('contextmenu', contextMenuHandler);

                    setTimeout(() => {
                        jsPsych.finishTrial({ reproduced_duration_ms: holdDuration });
                    }, 800);
                }
            };
            const contextMenuHandler = (event) => event.preventDefault();
            document.addEventListener('mousedown', downHandler);
            document.addEventListener('mouseup', upHandler);
            document.addEventListener('contextmenu', contextMenuHandler);
        }
    });

    // Die "Retry" Abfrage
    trial_timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            // Hole den Wert der letzen Messung, um ihn dem User kurz zu zeigen (optional, aber gutes Feedback)
            const last_trial_data = jsPsych.data.get().last(1).values()[0];
            const duration_sec = (last_trial_data.reproduced_duration_ms / 1000).toFixed(2);
            return `
                <div style="padding: 30px;">
                    <h3>Messung erfolgreich</h3>
                    <p>Falls Sie versehentlich zu früh losgelassen haben können Sie die Messung wiederholen</p>
                </div>
            `;
        },
        choices: ['Weiter zum Nächsten', 'Wiederholen'],
        data: { task: 'reproduction_retry_check' },
        on_finish: function(data) {
            // Wenn Antwort = 1 (Wiederholen), speichern wir das im Datensatz
            data.retry_requested = (data.response === 1);

            // WICHTIG: Wenn der User wiederholt, markieren wir die vorherigen Messungen dieses Loops als ungültig,
            // damit du sie später leichter rausfiltern kannst.
            if(data.retry_requested) {
                const data_to_ignore = jsPsych.data.get().last(3).values(); // Wait, Measure, Check
                data_to_ignore.forEach(d => d.ignore_in_analysis = true);
            }
        }
    });

    // Der Loop-Knoten für jsPsych
    const reproduction_loop = {
        timeline: trial_timeline,
        loop_function: function(data) {
            // Hole die Daten des Retry-Check-Bildschirms
            const lastData = data.last(1).values()[0];
            // Wenn der User auf "Wiederholen" geklickt hat (response === 1), läuft der Loop nochmal
            return lastData.retry_requested === true;
        }
    };

    timeline.push(reproduction_loop);
});

// Start des Experiments
jsPsych.run(timeline);