/**
 * INSANITY SYSTEM v6
 * The longer you stay, the more insane you become...
 * Navigate away to regain sanity - or FIGHT BACK!
 *
 * Features: Classic Splatterhouse HUD, Secrets Tracker, Blood Drips, Fight Back!
 */

(function() {
    'use strict';

    const CONFIG = {
        maxInsanity: 100,
        timeIncrement: 2,  // FASTER: was 0.5, now 2 per second
        timeInterval: 1000,
        navigationDecrease: 15,
        fightBackDecrease: 8,
        fightBackClicksNeeded: 12,
        storageKey: 'godmode_insanity',
        scoreKey: 'godmode_score',
        secretsKey: 'godmode_secrets',
        livesKey: 'godmode_lives',
        thresholds: { calm: 0, uneasy: 15, anxious: 30, panicked: 50, terrified: 70, madness: 90 }
    };

    let audioContext = null;
    let heartbeatInterval = null;
    let breathingInterval = null;
    let isAudioEnabled = true; // Sound ON by default

    let insanity = 0;
    let score = 0;
    let timeOnPage = 0;
    let secretsFound = 0;
    let totalSecrets = 13;
    let fightBackClicks = 0;
    let lives = 4;  // Start with 4 lives
    let isDead = false;

    function loadState() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                insanity = Math.max(0, (data.level || 0) - CONFIG.navigationDecrease);
            }
            score = parseInt(localStorage.getItem(CONFIG.scoreKey), 10) || 0;
            secretsFound = parseInt(localStorage.getItem(CONFIG.secretsKey), 10) || 0;
            lives = parseInt(localStorage.getItem(CONFIG.livesKey), 10);
            if (isNaN(lives) || lives < 0) lives = 4;
        } catch (e) {
            insanity = 0; score = 0; secretsFound = 0; lives = 4;
        }
    }

    function saveState() {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify({ level: insanity, timestamp: Date.now() }));
            localStorage.setItem(CONFIG.scoreKey, score.toString());
            localStorage.setItem(CONFIG.secretsKey, secretsFound.toString());
            localStorage.setItem(CONFIG.livesKey, lives.toString());
        } catch (e) {}
    }

    function createUI() {
        const splatterHUD = document.createElement('div');
        splatterHUD.id = 'splatter-hud';
        splatterHUD.innerHTML = `
            <div class="hud-frame">
                <div class="hud-section hud-left">
                    <div class="hud-score-area">
                        <span class="hud-label">SCORE</span>
                        <span class="hud-score-value" id="hud-score">0</span>
                    </div>
                    <div class="hud-life-area">
                        <span class="hud-label">LIFE</span>
                        <div class="life-hearts" id="life-hearts">
                            <img src="/images/sprites/HARTA0.png" class="heart-icon active" data-index="0">
                            <img src="/images/sprites/HARTA0.png" class="heart-icon active" data-index="1">
                            <img src="/images/sprites/HARTA0.png" class="heart-icon active" data-index="2">
                            <img src="/images/sprites/HARTA0.png" class="heart-icon active" data-index="3">
                        </div>
                    </div>
                </div>
                <div class="hud-section hud-center">
                    <div class="hud-insanity-area">
                        <span class="hud-label">INSANITY</span>
                        <div class="insanity-bar">
                            <div class="insanity-fill" id="insanity-fill"></div>
                        </div>
                        <span class="insanity-value" id="insanity-value">0%</span>
                    </div>
                </div>
                <div class="hud-section hud-right">
                    <div class="hud-secrets-area">
                        <span class="hud-label">SECRETS</span>
                        <span class="hud-secrets-value" id="hud-secrets">0/${totalSecrets}</span>
                    </div>
                    <div class="hud-masks">
                        <img src="/images/sprites/TMSKA0.png" alt="" class="mask-life" id="mask1">
                        <img src="/images/sprites/TMSKA0.png" alt="" class="mask-life" id="mask2">
                        <img src="/images/sprites/TMSKA0.png" alt="" class="mask-life" id="mask3">
                    </div>
                    <div class="hud-item-area">
                        <span class="hud-label">ITEM</span>
                        <div class="item-box">
                            <img src="/images/sprites/TMSKA0.png" alt="" class="current-item">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(splatterHUD);

        // Blood drips container
        const bloodDrips = document.createElement('div');
        bloodDrips.id = 'blood-drips-container';
        document.body.appendChild(bloodDrips);

        // Blood pool that accumulates at the bottom
        const bloodPool = document.createElement('div');
        bloodPool.id = 'blood-pool';
        document.body.appendChild(bloodPool);

        // Overlays
        const vignette = document.createElement('div');
        vignette.id = 'insanity-vignette';
        document.body.appendChild(vignette);

        const veins = document.createElement('div');
        veins.id = 'insanity-veins';
        veins.innerHTML = `<div class="vein vein-top"></div><div class="vein vein-bottom"></div><div class="vein vein-left"></div><div class="vein vein-right"></div>`;
        document.body.appendChild(veins);

        const whispers = document.createElement('div');
        whispers.id = 'insanity-whispers';
        document.body.appendChild(whispers);

        // CENTERED Escape prompt with FIGHT BACK - appended to html element for true fixed positioning
        const escapePrompt = document.createElement('div');
        escapePrompt.id = 'escape-prompt';
        escapePrompt.innerHTML = `
            <div class="escape-backdrop"></div>
            <div class="escape-content">
                <div class="escape-icon">
                    <img src="/images/sprites/TMSKA0.png" alt="Terror Mask">
                </div>
                <div class="escape-text">
                    <span class="escape-title">THE MASK IS CONSUMING YOU</span>
                    <span class="escape-subtitle">Click FIGHT BACK to resist! (<span id="fight-clicks">0</span>/12)</span>
                    <div class="fight-progress">
                        <div class="fight-progress-fill" id="fight-progress-fill"></div>
                    </div>
                </div>
                <div class="escape-buttons">
                    <button class="escape-btn escape-stay" id="btn-stay">STAY</button>
                    <button class="escape-btn escape-fight" id="btn-fight">FIGHT BACK</button>
                </div>
            </div>
        `;
        // Append to documentElement (html) to avoid any transform issues on body
        document.documentElement.appendChild(escapePrompt);

        const bloodSplatter = document.createElement('div');
        bloodSplatter.id = 'blood-splatter-overlay';
        document.body.appendChild(bloodSplatter);

        // Death screen (when insanity hits 100%)
        const deathScreen = document.createElement('div');
        deathScreen.id = 'death-screen';
        deathScreen.innerHTML = `
            <div class="death-backdrop"></div>
            <div class="death-content">
                <img src="/images/sprites/END1.png" alt="YOU DIED" class="death-image">
                <div class="death-text">
                    <span class="death-title">YOU DIED</span>
                    <span class="death-subtitle">The mask has claimed another victim</span>
                    <span class="death-lives">LIVES REMAINING: <span id="death-lives-count">3</span></span>
                </div>
                <button class="death-btn" id="btn-try-again">TRY AGAIN</button>
            </div>
        `;
        document.documentElement.appendChild(deathScreen);

        // Game Over screen (when no lives left)
        const gameOverScreen = document.createElement('div');
        gameOverScreen.id = 'game-over-screen';
        gameOverScreen.innerHTML = `
            <div class="game-over-backdrop"></div>
            <div class="game-over-content">
                <img src="/images/sprites/RICKD0.png" alt="Rick Dying" class="rick-dying" id="rick-dying-sprite">
                <img src="/images/sprites/END3.png" alt="GAME OVER" class="game-over-image" id="game-over-mask">
                <div class="game-over-text">
                    <span class="game-over-title">GAME OVER</span>
                    <span class="game-over-subtitle">THE MASK HAS CONSUMED YOUR SOUL</span>
                </div>
                <button class="game-over-btn" id="btn-continue">CONTINUE?</button>
            </div>
        `;
        document.documentElement.appendChild(gameOverScreen);

        // Punch/Kick overlay for Fight Back
        const punchOverlay = document.createElement('div');
        punchOverlay.id = 'punch-overlay';
        punchOverlay.innerHTML = `
            <img src="/images/sprites/RHANA0.png" alt="Punch" class="punch-sprite" id="punch-sprite-left">
            <img src="/images/sprites/RHANB0.png" alt="Kick" class="punch-sprite" id="punch-sprite-right">
        `;
        document.documentElement.appendChild(punchOverlay);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #splatter-hud {
                position: fixed; top: 0; left: 0; right: 0; z-index: 9995; pointer-events: none;
            }
            .hud-frame {
                background: linear-gradient(180deg, #2a1a0a 0%, #1a0f05 50%, #0f0805 100%);
                border-bottom: 3px solid #3d2817;
                box-shadow: 0 3px 0 #0a0503, inset 0 1px 0 rgba(100, 70, 40, 0.4);
                padding: 6px 15px;
                display: flex; justify-content: space-between; align-items: center;
                font-family: 'Press Start 2P', monospace; min-height: 50px;
            }
            .hud-section { display: flex; align-items: center; gap: 20px; }
            .hud-left { justify-content: flex-start; }
            .hud-center { justify-content: center; flex: 1; }
            .hud-right { justify-content: flex-end; }
            .hud-label {
                font-size: 0.55rem; color: #4a9c5a;
                text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 8px rgba(74, 156, 90, 0.5);
                letter-spacing: 1px; margin-right: 6px;
            }
            .hud-score-area, .hud-life-area, .hud-item-area, .hud-insanity-area, .hud-secrets-area { display: flex; align-items: center; }
            .hud-score-value { font-size: 0.7rem; color: #fff; text-shadow: 2px 2px 0 #000; min-width: 60px; }
            .hud-secrets-value { font-size: 0.5rem; color: #ffcc00; text-shadow: 1px 1px 0 #000, 0 0 8px rgba(255, 204, 0, 0.5); }
            .life-hearts { display: flex; gap: 3px; align-items: center; }
            .heart-icon { width: 18px; height: 18px; image-rendering: pixelated; filter: drop-shadow(1px 1px 0 #000); transition: all 0.3s; }
            .heart-icon.active { filter: drop-shadow(0 0 6px #ff0000) drop-shadow(1px 1px 0 #000); }
            .heart-icon.lost { filter: grayscale(1) brightness(0.3) drop-shadow(1px 1px 0 #000); }
            .hud-insanity-area { gap: 8px; }
            .insanity-bar { width: 150px; height: 12px; background: #0a0503; border: 2px solid #3d2817; box-shadow: inset 0 2px 4px rgba(0,0,0,0.8); overflow: hidden; }
            .insanity-fill { height: 100%; width: 0%; background: linear-gradient(180deg, #00ff44 0%, #00aa33 100%); box-shadow: 0 0 8px #00ff44; transition: width 0.3s, background 0.3s; }
            .insanity-fill.warning { background: linear-gradient(180deg, #ffcc00 0%, #aa8800 100%); box-shadow: 0 0 8px #ffcc00; }
            .insanity-fill.danger { background: linear-gradient(180deg, #ff3333 0%, #aa0000 100%); box-shadow: 0 0 8px #ff0000; animation: dangerPulse 0.4s ease-in-out infinite; }
            @keyframes dangerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
            .insanity-value { font-size: 0.5rem; color: #4a9c5a; text-shadow: 1px 1px 0 #000; min-width: 30px; }
            .hud-masks { display: flex; gap: 5px; }
            .mask-life { width: 22px; height: 22px; image-rendering: pixelated; filter: drop-shadow(1px 1px 0 #000); transition: all 0.3s; }
            .mask-life.lost { filter: grayscale(1) brightness(0.2) drop-shadow(1px 1px 0 #000); }
            .item-box { width: 28px; height: 28px; background: #0a0503; border: 2px solid #3d2817; display: flex; align-items: center; justify-content: center; }
            .current-item { width: 20px; height: 20px; image-rendering: pixelated; }

            /* Blood Drips - Full page height */
            #blood-drips-container { position: fixed; top: 50px; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9994; overflow: hidden; }
            .blood-drip-element { position: absolute; top: 0; background: linear-gradient(180deg, #8b0000 0%, #cc0000 20%, #aa0000 40%, #880000 60%, #660000 80%, rgba(102, 0, 0, 0.3) 95%, transparent 100%); border-radius: 50% 50% 50% 50% / 10% 10% 90% 90%; }
            .blood-splash { position: absolute; bottom: 0; background: radial-gradient(ellipse at center bottom, #cc0000 0%, #880000 40%, transparent 70%); border-radius: 50%; transform: scaleY(0.3); opacity: 0; animation: splashAppear 0.3s ease-out forwards; }
            @keyframes splashAppear { 0% { transform: scaleY(0.3) scale(0); opacity: 0; } 50% { transform: scaleY(0.3) scale(1.2); opacity: 0.8; } 100% { transform: scaleY(0.3) scale(1); opacity: 0.6; } }

            /* Blood Pool - Accumulates at bottom */
            #blood-pool {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 0;
                background: linear-gradient(180deg,
                    rgba(139, 0, 0, 0.9) 0%,
                    rgba(100, 0, 0, 0.95) 30%,
                    rgba(80, 0, 0, 1) 100%);
                z-index: 9993;
                pointer-events: none;
                transition: height 0.5s ease-out;
                box-shadow: 0 -5px 20px rgba(139, 0, 0, 0.8), inset 0 5px 30px rgba(0, 0, 0, 0.5);
            }
            #blood-pool::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 10px;
                background: linear-gradient(180deg, rgba(204, 0, 0, 0.8) 0%, transparent 100%);
                animation: poolWave 2s ease-in-out infinite;
            }
            @keyframes poolWave {
                0%, 100% { transform: scaleY(1); }
                50% { transform: scaleY(1.5); }
            }

            /* Wobble animations */
            body.insanity-active .tool-category, body.insanity-active .scenario-card, body.insanity-active .standalone-tool, body.insanity-active .stat, body.insanity-active .code-block { filter: blur(var(--element-blur, 0px)); }
            body.insanity-active .tool-category:nth-child(1) { animation: wobble1 3s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(2) { animation: wobble2 2.5s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(3) { animation: wobble3 3.5s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(4) { animation: wobble4 2.8s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(5) { animation: wobble5 3.2s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(6) { animation: wobble6 2.6s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(7) { animation: wobble1 3.3s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(8) { animation: wobble2 2.7s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(9) { animation: wobble3 3.1s ease-in-out infinite; }
            body.insanity-active .tool-category:nth-child(10) { animation: wobble4 2.9s ease-in-out infinite; }
            body.insanity-active .scenario-card:nth-child(1) { animation: wobble5 2.4s ease-in-out infinite; }
            body.insanity-active .scenario-card:nth-child(2) { animation: wobble3 3.1s ease-in-out infinite; }
            body.insanity-active .scenario-card:nth-child(3) { animation: wobble1 2.7s ease-in-out infinite; }
            body.insanity-active .scenario-card:nth-child(4) { animation: wobble6 3.4s ease-in-out infinite; }
            body.insanity-active .standalone-tool:nth-child(odd) { animation: wobble2 2.3s ease-in-out infinite; }
            body.insanity-active .standalone-tool:nth-child(even) { animation: wobble4 2.9s ease-in-out infinite; }
            body.insanity-active .stat:nth-child(1) { animation: wobble3 2.1s ease-in-out infinite; }
            body.insanity-active .stat:nth-child(2) { animation: wobble6 2.8s ease-in-out infinite; }
            body.insanity-active .stat:nth-child(3) { animation: wobble1 2.4s ease-in-out infinite; }
            body.insanity-active .stat:nth-child(4) { animation: wobble5 3.0s ease-in-out infinite; }
            @keyframes wobble1 { 0%, 100% { transform: translate(0, 0) rotate(0deg) skew(0deg); } 15% { transform: translate(var(--w-x1), var(--w-y1)) rotate(var(--w-r1)) skew(var(--w-s1)); } 35% { transform: translate(calc(var(--w-x1) * -0.7), calc(var(--w-y1) * 0.5)) rotate(calc(var(--w-r1) * -0.5)) skew(calc(var(--w-s1) * -0.3)); } 55% { transform: translate(calc(var(--w-x1) * 0.4), calc(var(--w-y1) * -0.8)) rotate(calc(var(--w-r1) * 0.3)) skew(calc(var(--w-s1) * 0.6)); } 75% { transform: translate(calc(var(--w-x1) * -0.3), calc(var(--w-y1) * 0.3)) rotate(calc(var(--w-r1) * -0.2)) skew(0deg); } }
            @keyframes wobble2 { 0%, 100% { transform: translate(0, 0) rotate(0deg) skew(0deg); } 20% { transform: translate(calc(var(--w-x1) * -0.8), calc(var(--w-y1) * 0.6)) rotate(calc(var(--w-r1) * -0.7)) skew(calc(var(--w-s1) * 0.4)); } 40% { transform: translate(calc(var(--w-x1) * 0.5), calc(var(--w-y1) * -0.4)) rotate(calc(var(--w-r1) * 0.5)) skew(calc(var(--w-s1) * -0.5)); } 60% { transform: translate(calc(var(--w-x1) * -0.3), calc(var(--w-y1) * 0.9)) rotate(calc(var(--w-r1) * -0.3)) skew(calc(var(--w-s1) * 0.2)); } 80% { transform: translate(calc(var(--w-x1) * 0.6), calc(var(--w-y1) * -0.2)) rotate(calc(var(--w-r1) * 0.2)) skew(0deg); } }
            @keyframes wobble3 { 0%, 100% { transform: translate(0, 0) rotate(0deg) skew(0deg); } 12% { transform: translate(calc(var(--w-x1) * 0.9), calc(var(--w-y1) * -0.5)) rotate(calc(var(--w-r1) * 0.8)) skew(calc(var(--w-s1) * -0.6)); } 28% { transform: translate(calc(var(--w-x1) * -0.6), calc(var(--w-y1) * 0.7)) rotate(calc(var(--w-r1) * -0.4)) skew(calc(var(--w-s1) * 0.3)); } 48% { transform: translate(calc(var(--w-x1) * 0.3), calc(var(--w-y1) * 0.4)) rotate(calc(var(--w-r1) * 0.6)) skew(calc(var(--w-s1) * -0.4)); } 68% { transform: translate(calc(var(--w-x1) * -0.8), calc(var(--w-y1) * -0.3)) rotate(calc(var(--w-r1) * -0.5)) skew(calc(var(--w-s1) * 0.5)); } 88% { transform: translate(calc(var(--w-x1) * 0.2), calc(var(--w-y1) * 0.2)) rotate(calc(var(--w-r1) * 0.1)) skew(0deg); } }
            @keyframes wobble4 { 0%, 100% { transform: translate(0, 0) rotate(0deg) skew(0deg); } 18% { transform: translate(calc(var(--w-x1) * -0.5), calc(var(--w-y1) * 0.8)) rotate(calc(var(--w-r1) * -0.6)) skew(calc(var(--w-s1) * 0.7)); } 38% { transform: translate(calc(var(--w-x1) * 0.7), calc(var(--w-y1) * -0.6)) rotate(calc(var(--w-r1) * 0.4)) skew(calc(var(--w-s1) * -0.2)); } 58% { transform: translate(calc(var(--w-x1) * -0.4), calc(var(--w-y1) * 0.3)) rotate(calc(var(--w-r1) * -0.8)) skew(calc(var(--w-s1) * 0.4)); } 78% { transform: translate(calc(var(--w-x1) * 0.8), calc(var(--w-y1) * -0.5)) rotate(calc(var(--w-r1) * 0.3)) skew(0deg); } }
            @keyframes wobble5 { 0%, 100% { transform: translate(0, 0) rotate(0deg) skew(0deg); } 22% { transform: translate(calc(var(--w-x1) * 0.6), calc(var(--w-y1) * 0.9)) rotate(calc(var(--w-r1) * 0.9)) skew(calc(var(--w-s1) * -0.8)); } 42% { transform: translate(calc(var(--w-x1) * -0.9), calc(var(--w-y1) * -0.3)) rotate(calc(var(--w-r1) * -0.6)) skew(calc(var(--w-s1) * 0.5)); } 62% { transform: translate(calc(var(--w-x1) * 0.4), calc(var(--w-y1) * 0.6)) rotate(calc(var(--w-r1) * 0.2)) skew(calc(var(--w-s1) * -0.3)); } 82% { transform: translate(calc(var(--w-x1) * -0.2), calc(var(--w-y1) * -0.7)) rotate(calc(var(--w-r1) * -0.4)) skew(0deg); } }
            @keyframes wobble6 { 0%, 100% { transform: translate(0, 0) rotate(0deg) skew(0deg); } 16% { transform: translate(calc(var(--w-x1) * -0.7), calc(var(--w-y1) * -0.4)) rotate(calc(var(--w-r1) * -0.5)) skew(calc(var(--w-s1) * 0.9)); } 33% { transform: translate(calc(var(--w-x1) * 0.8), calc(var(--w-y1) * 0.5)) rotate(calc(var(--w-r1) * 0.7)) skew(calc(var(--w-s1) * -0.6)); } 50% { transform: translate(calc(var(--w-x1) * -0.5), calc(var(--w-y1) * -0.8)) rotate(calc(var(--w-r1) * -0.3)) skew(calc(var(--w-s1) * 0.4)); } 66% { transform: translate(calc(var(--w-x1) * 0.3), calc(var(--w-y1) * 0.7)) rotate(calc(var(--w-r1) * 0.6)) skew(calc(var(--w-s1) * -0.2)); } 83% { transform: translate(calc(var(--w-x1) * -0.4), calc(var(--w-y1) * -0.2)) rotate(calc(var(--w-r1) * -0.1)) skew(0deg); } }

            body.insanity-extreme { animation: screenDistort 0.08s ease-in-out infinite; }
            @keyframes screenDistort { 0%, 100% { filter: none; } 25% { filter: hue-rotate(8deg) saturate(1.3); } 50% { filter: hue-rotate(-8deg) saturate(0.8); } 75% { filter: hue-rotate(5deg) saturate(1.2); } }
            body.insanity-high { animation: colorShift 1.5s ease-in-out infinite; }
            @keyframes colorShift { 0%, 100% { filter: saturate(1) brightness(1); } 50% { filter: saturate(1.4) brightness(0.85) sepia(0.15); } }

            #insanity-vignette { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9985; background: radial-gradient(ellipse at center, transparent 0%, transparent var(--vignette-inner, 70%), rgba(20, 0, 0, var(--vignette-opacity, 0)) var(--vignette-outer, 100%)); transition: all 0.5s ease; }
            #insanity-veins { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9986; }
            .vein { position: absolute; background: linear-gradient(var(--vein-direction, to right), rgba(139, 0, 0, var(--vein-opacity, 0)) 0%, rgba(80, 0, 0, calc(var(--vein-opacity, 0) * 0.5)) 50%, transparent 100%); filter: blur(var(--vein-blur, 0px)); animation: veinPulse var(--heartbeat-speed, 2s) ease-in-out infinite; }
            .vein-top { top: 0; left: 0; right: 0; height: var(--vein-size, 0px); --vein-direction: to bottom; }
            .vein-bottom { bottom: 0; left: 0; right: 0; height: var(--vein-size, 0px); --vein-direction: to top; animation-delay: 0.5s; }
            .vein-left { top: 0; left: 0; bottom: 0; width: var(--vein-size, 0px); --vein-direction: to right; animation-delay: 0.25s; }
            .vein-right { top: 0; right: 0; bottom: 0; width: var(--vein-size, 0px); --vein-direction: to left; animation-delay: 0.75s; }
            @keyframes veinPulse { 0%, 100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.02); } }

            #blood-splatter-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9983; opacity: 0; transition: opacity 0.5s; background: radial-gradient(ellipse at 10% 10%, rgba(139, 0, 0, 0.3) 0%, transparent 40%), radial-gradient(ellipse at 90% 20%, rgba(139, 0, 0, 0.25) 0%, transparent 35%), radial-gradient(ellipse at 20% 80%, rgba(139, 0, 0, 0.35) 0%, transparent 45%), radial-gradient(ellipse at 80% 90%, rgba(139, 0, 0, 0.3) 0%, transparent 40%); }
            #blood-splatter-overlay.visible { opacity: var(--splatter-opacity, 0); }

            /* CENTERED Escape Prompt - Full screen overlay, always in viewport center */
            #escape-prompt {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 999999 !important;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.5s ease, visibility 0.5s ease;
                pointer-events: none;
            }
            #escape-prompt.visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
            #escape-prompt .escape-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
            }
            .escape-content {
                position: relative;
                z-index: 1;
                background: rgba(20, 5, 5, 0.98); border: 3px solid #cc0000;
                box-shadow: 0 0 40px rgba(204, 0, 0, 0.6), inset 0 0 30px rgba(139, 0, 0, 0.4);
                padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1.5rem;
                animation: escapeShake 0.2s ease-in-out infinite;
                max-width: 90vw;
            }
            @keyframes escapeShake { 0%, 100% { transform: translateX(0) rotate(0deg); } 25% { transform: translateX(-5px) rotate(-0.5deg); } 75% { transform: translateX(5px) rotate(0.5deg); } }
            .escape-icon img { width: 56px; height: 56px; image-rendering: pixelated; animation: escapeMaskPulse 0.3s ease-in-out infinite; }
            @keyframes escapeMaskPulse { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(204, 0, 0, 0.9)); } 50% { transform: scale(1.2); filter: drop-shadow(0 0 30px rgba(255, 0, 0, 1)); } }
            .escape-text { display: flex; flex-direction: column; gap: 0.5rem; }
            .escape-title { font-family: 'Nosifer', cursive; font-size: 1.1rem; color: #ff0000; text-shadow: 0 0 15px rgba(255, 0, 0, 0.9); animation: escapeFlicker 0.06s step-end infinite; }
            @keyframes escapeFlicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            .escape-subtitle { font-family: 'Press Start 2P', monospace; font-size: 0.45rem; color: #aaa; }
            .fight-progress { width: 150px; height: 10px; background: #1a0808; border: 2px solid #660000; margin-top: 0.5rem; overflow: hidden; }
            .fight-progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #00ff44 0%, #00cc33 100%); box-shadow: 0 0 10px #00ff44; transition: width 0.2s ease; }
            .escape-buttons { display: flex; flex-direction: column; gap: 0.5rem; }
            .escape-btn { font-family: 'Press Start 2P', monospace; font-size: 0.5rem; padding: 0.6rem 1rem; cursor: pointer; transition: all 0.2s; border: 2px solid; }
            .escape-stay { background: transparent; border-color: #666; color: #666; }
            .escape-stay:hover { border-color: #999; color: #999; }
            .escape-fight { background: #660000; border-color: #cc0000; color: #fff; animation: fightPulse 0.5s ease-in-out infinite; }
            .escape-fight:hover { background: #880000; border-color: #ff0000; transform: scale(1.05); }
            @keyframes fightPulse { 0%, 100% { box-shadow: 0 0 10px rgba(204, 0, 0, 0.5); } 50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); } }

            #insanity-whispers { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9984; overflow: hidden; }
            .whisper { position: absolute; font-family: 'Nosifer', cursive; color: rgba(139, 0, 0, 0.7); font-size: 1.5rem; text-shadow: 0 0 20px rgba(139, 0, 0, 0.6); animation: whisperFloat 4s ease-out forwards; white-space: nowrap; }
            @keyframes whisperFloat { 0% { opacity: 0; transform: scale(0.5) rotate(-5deg); filter: blur(5px); } 20% { opacity: 0.9; transform: scale(1) rotate(0deg); filter: blur(0px); } 80% { opacity: 0.6; transform: scale(1.1) translateY(-20px) rotate(3deg); } 100% { opacity: 0; transform: scale(1.2) translateY(-40px) rotate(5deg); filter: blur(3px); } }

            #sound-toggle { position: fixed; top: 60px; right: 15px; z-index: 9996; background: rgba(26, 15, 5, 0.95); border: 2px solid #3d2817; padding: 5px 8px; cursor: pointer; pointer-events: auto; font-family: 'Press Start 2P', monospace; font-size: 0.35rem; color: #4a9c5a; text-shadow: 1px 1px 0 #000; transition: all 0.3s; }
            #sound-toggle:hover { background: rgba(40, 25, 10, 0.95); color: #6acc7a; }
            #sound-toggle.enabled { color: #cc0000; text-shadow: 0 0 5px #ff0000, 1px 1px 0 #000; }

            body { padding-top: 60px !important; padding-bottom: 80px !important; }
            header { top: 50px !important; }

            @media (max-width: 768px) {
                .hud-frame { padding: 4px 10px; min-height: 40px; }
                .hud-label { font-size: 0.4rem; }
                .hud-score-value { font-size: 0.5rem; }
                .hud-secrets-value { font-size: 0.4rem; }
                .heart-icon { width: 14px; height: 14px; }
                .mask-life { width: 16px; height: 16px; }
                .insanity-bar { width: 80px; height: 10px; }
                .item-box { width: 22px; height: 22px; }
                body { padding-top: 50px !important; padding-bottom: 80px !important; }
                header { top: 40px !important; }
                #sound-toggle { top: 50px; font-size: 0.3rem; }
                .escape-content { padding: 1rem; flex-wrap: wrap; }
                .escape-title { font-size: 0.7rem; }
            }
            @media (max-width: 480px) {
                .hud-masks { display: none; }
                .hud-item-area { display: none; }
                .insanity-bar { width: 60px; }
                .escape-icon { display: none; }
            }

            /* Death Screen Styles */
            #death-screen {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 9999999 !important;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.8s ease, visibility 0.8s ease;
                pointer-events: none;
            }
            #death-screen.visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
            #death-screen .death-backdrop {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.95);
            }
            .death-content {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1.5rem;
                padding: 2rem;
                animation: deathPulse 2s ease-in-out infinite;
            }
            @keyframes deathPulse {
                0%, 100% { filter: drop-shadow(0 0 30px rgba(139, 0, 0, 0.8)); }
                50% { filter: drop-shadow(0 0 60px rgba(255, 0, 0, 1)); }
            }
            .death-image {
                max-width: 80vw;
                max-height: 50vh;
                image-rendering: pixelated;
                animation: deathImageGlow 1.5s ease-in-out infinite alternate;
            }
            @keyframes deathImageGlow {
                0% { filter: brightness(0.8) drop-shadow(0 0 20px #660000); }
                100% { filter: brightness(1.1) drop-shadow(0 0 40px #cc0000); }
            }
            .death-text {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.8rem;
            }
            .death-title {
                font-family: 'Nosifer', cursive;
                font-size: 3rem;
                color: #ff0000;
                text-shadow: 0 0 20px #ff0000, 0 0 40px #880000, 3px 3px 0 #000;
                animation: deathFlicker 0.1s step-end infinite;
            }
            @keyframes deathFlicker {
                0%, 90% { opacity: 1; }
                92% { opacity: 0.3; }
                94% { opacity: 1; }
                96% { opacity: 0.5; }
                98% { opacity: 1; }
            }
            .death-subtitle {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.6rem;
                color: #888;
                text-shadow: 1px 1px 0 #000;
            }
            .death-lives {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.7rem;
                color: #ffcc00;
                text-shadow: 0 0 10px rgba(255, 204, 0, 0.8), 1px 1px 0 #000;
                margin-top: 0.5rem;
            }
            .death-btn {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.7rem;
                padding: 1rem 2rem;
                background: #660000;
                border: 3px solid #cc0000;
                color: #fff;
                cursor: pointer;
                margin-top: 1rem;
                transition: all 0.2s;
                animation: btnPulse 1s ease-in-out infinite;
            }
            .death-btn:hover {
                background: #880000;
                border-color: #ff0000;
                transform: scale(1.1);
                box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
            }
            @keyframes btnPulse {
                0%, 100% { box-shadow: 0 0 15px rgba(204, 0, 0, 0.5); }
                50% { box-shadow: 0 0 25px rgba(255, 0, 0, 0.8); }
            }

            /* Game Over Screen Styles */
            #game-over-screen {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 99999999 !important;
                opacity: 0;
                visibility: hidden;
                transition: opacity 1s ease, visibility 1s ease;
                pointer-events: none;
            }
            #game-over-screen.visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
            #game-over-screen .game-over-backdrop {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: #000;
            }
            .game-over-content {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 2rem;
            }
            .rick-dying {
                width: 120px;
                height: auto;
                image-rendering: pixelated;
                position: absolute;
                opacity: 1;
                transition: opacity 2s ease-out, transform 2s ease-out;
            }
            .rick-dying.fade-out {
                opacity: 0;
                transform: scale(0.5) translateY(50px);
            }
            .game-over-image {
                width: 200px;
                height: auto;
                image-rendering: pixelated;
                opacity: 0;
                transform: scale(0.3);
                transition: opacity 1.5s ease-in, transform 1.5s ease-out;
            }
            .game-over-image.visible {
                opacity: 1;
                transform: scale(1);
                animation: maskThrob 0.5s ease-in-out infinite;
            }
            @keyframes maskThrob {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 30px #ff0000); }
                50% { transform: scale(1.1); filter: drop-shadow(0 0 50px #ff0000) brightness(1.3); }
            }
            .game-over-text {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.8rem;
                opacity: 0;
                transition: opacity 1s ease-in;
            }
            .game-over-text.visible {
                opacity: 1;
            }
            .game-over-title {
                font-family: 'Nosifer', cursive;
                font-size: 4rem;
                color: #ff0000;
                text-shadow: 0 0 30px #ff0000, 0 0 60px #880000, 4px 4px 0 #000;
                animation: gameOverFlash 0.15s step-end infinite;
            }
            @keyframes gameOverFlash {
                0%, 85% { opacity: 1; color: #ff0000; }
                87% { opacity: 0.2; color: #ff6666; }
                90% { opacity: 1; color: #cc0000; }
                93% { opacity: 0.4; }
                96% { opacity: 1; color: #ff0000; }
            }
            .game-over-subtitle {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.5rem;
                color: #666;
                text-shadow: 1px 1px 0 #000;
                text-transform: uppercase;
            }
            .game-over-btn {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.6rem;
                padding: 0.8rem 1.5rem;
                background: transparent;
                border: 2px solid #444;
                color: #666;
                cursor: pointer;
                margin-top: 2rem;
                transition: all 0.3s;
                opacity: 0;
            }
            .game-over-btn.visible {
                opacity: 1;
                animation: continueFlash 1.5s ease-in-out infinite;
            }
            @keyframes continueFlash {
                0%, 100% { border-color: #444; color: #666; }
                50% { border-color: #888; color: #aaa; }
            }
            .game-over-btn:hover {
                border-color: #cc0000;
                color: #ff0000;
                background: rgba(139, 0, 0, 0.3);
            }

            @media (max-width: 768px) {
                .death-title { font-size: 2rem; }
                .death-image { max-width: 90vw; max-height: 40vh; }
                .game-over-title { font-size: 2.5rem; }
                .game-over-image { width: 150px; }
            }

            /* Punch/Kick Overlay */
            #punch-overlay {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: 60vh;
                pointer-events: none;
                z-index: 9999999 !important;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding: 0 5vw;
                opacity: 0;
                visibility: hidden;
            }
            #punch-overlay.visible {
                opacity: 1;
                visibility: visible;
            }
            .punch-sprite {
                width: auto;
                height: 50vh;
                max-height: 500px;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.8));
            }
            #punch-sprite-left {
                transform-origin: bottom center;
            }
            #punch-sprite-right {
                transform-origin: bottom center;
                transform: scaleX(-1);
            }
            .punch-sprite.punching-left {
                animation: punchLeft 0.2s ease-out forwards !important;
            }
            .punch-sprite.punching-right {
                animation: punchRight 0.2s ease-out forwards !important;
            }
            .punch-sprite.kicking-left {
                animation: kickLeft 0.25s ease-out forwards !important;
            }
            .punch-sprite.kicking-right {
                animation: kickRight 0.25s ease-out forwards !important;
            }

            @keyframes punchLeft {
                0% { transform: translateX(0) translateY(0) rotate(0deg) scale(1); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                40% { transform: translateX(30vw) translateY(-20vh) rotate(-30deg) scale(1.4); filter: drop-shadow(0 0 50px rgba(255,100,0,1)) brightness(1.5); }
                100% { transform: translateX(15vw) translateY(-10vh) rotate(-15deg) scale(1.2); filter: drop-shadow(0 0 30px rgba(255,50,0,0.8)); }
            }
            @keyframes punchRight {
                0% { transform: scaleX(-1) translateX(0) translateY(0) rotate(0deg) scale(1); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                40% { transform: scaleX(-1) translateX(30vw) translateY(-20vh) rotate(30deg) scale(1.4); filter: drop-shadow(0 0 50px rgba(255,100,0,1)) brightness(1.5); }
                100% { transform: scaleX(-1) translateX(15vw) translateY(-10vh) rotate(15deg) scale(1.2); filter: drop-shadow(0 0 30px rgba(255,50,0,0.8)); }
            }
            @keyframes kickLeft {
                0% { transform: translateX(0) translateY(0) rotate(0deg) scale(1); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                30% { transform: translateX(40vw) translateY(-35vh) rotate(-45deg) scale(1.6); filter: drop-shadow(0 0 80px rgba(255,0,0,1)) brightness(1.8); }
                100% { transform: translateX(20vw) translateY(-15vh) rotate(-20deg) scale(1.3); filter: drop-shadow(0 0 40px rgba(255,0,0,0.8)); }
            }
            @keyframes kickRight {
                0% { transform: scaleX(-1) translateX(0) translateY(0) rotate(0deg) scale(1); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                30% { transform: scaleX(-1) translateX(40vw) translateY(-35vh) rotate(45deg) scale(1.6); filter: drop-shadow(0 0 80px rgba(255,0,0,1)) brightness(1.8); }
                100% { transform: scaleX(-1) translateX(20vw) translateY(-15vh) rotate(20deg) scale(1.3); filter: drop-shadow(0 0 40px rgba(255,0,0,0.8)); }
            }

            @keyframes punchImpact {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }

            @keyframes screenShake {
                0% { transform: translate(0, 0); }
                20% { transform: translate(-8px, 4px); }
                40% { transform: translate(8px, -4px); }
                60% { transform: translate(-6px, 2px); }
                80% { transform: translate(4px, -2px); }
                100% { transform: translate(0, 0); }
            }

            @keyframes screenShakeHard {
                0% { transform: translate(0, 0) rotate(0deg); }
                15% { transform: translate(-15px, 8px) rotate(-1deg); }
                30% { transform: translate(15px, -8px) rotate(1deg); }
                45% { transform: translate(-12px, 5px) rotate(-0.5deg); }
                60% { transform: translate(10px, -5px) rotate(0.5deg); }
                75% { transform: translate(-5px, 3px); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }

            @keyframes flashFade {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Sound toggle - ON by default
        const soundToggle = document.createElement('button');
        soundToggle.id = 'sound-toggle';
        soundToggle.textContent = '♪ SOUND: ON';
        soundToggle.classList.add('enabled');
        soundToggle.addEventListener('click', toggleSound);
        document.body.appendChild(soundToggle);

        // Initialize audio context on first user interaction
        document.addEventListener('click', function initAudioOnce() {
            initAudio();
            if (isAudioEnabled && audioContext) {
                startHeartbeat();
                startBreathing();
            }
            document.removeEventListener('click', initAudioOnce);
        }, { once: true });

        // Button handlers
        document.getElementById('btn-stay').addEventListener('click', function() {
            // STAY resets insanity so users can read content
            insanity = 0;
            fightBackClicks = 0;
            resetBloodPool();
            updateEffects();
            updateFightProgress();
            hideEscapePrompt();
            saveState();
        });

        document.getElementById('btn-fight').addEventListener('click', function() {
            fightBackClicks++;
            updateFightProgress();

            // Visual feedback on button
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 100);

            // Show punch/kick animation
            triggerPunchAnimation(fightBackClicks);

            // Reduce insanity per click
            insanity = Math.max(0, insanity - CONFIG.fightBackDecrease);
            updateEffects();

            // Play fight sound if audio enabled
            if (isAudioEnabled) playFightBack();

            // If 5 clicks, fully reset
            if (fightBackClicks >= CONFIG.fightBackClicksNeeded) {
                insanity = 0;
                fightBackClicks = 0;
                score += 1000;
                resetBloodPool();
                updateScoreDisplay();
                updateFightProgress();
                hideEscapePrompt();
                hidePunchOverlay();
            }
        });

        // TRY AGAIN button handler
        document.getElementById('btn-try-again').addEventListener('click', function() {
            hideDeathScreen();
            insanity = 0;
            isDead = false;
            fightBackClicks = 0;
            resetBloodPool();
            updateEffects();
            updateLivesDisplay();
            saveState();
        });

        // CONTINUE button handler (after game over)
        document.getElementById('btn-continue').addEventListener('click', function() {
            hideGameOverScreen();
            // Reset everything for a fresh start
            lives = 4;
            insanity = 0;
            score = 0;
            isDead = false;
            fightBackClicks = 0;
            resetBloodPool();
            updateEffects();
            updateLivesDisplay();
            updateScoreDisplay();
            saveState();
        });

        startBloodDrips();
        updateScoreDisplay();
        updateSecretsDisplay();
    }

    function updateFightProgress() {
        const fill = document.getElementById('fight-progress-fill');
        const clicks = document.getElementById('fight-clicks');
        if (fill) fill.style.width = (fightBackClicks / CONFIG.fightBackClicksNeeded * 100) + '%';
        if (clicks) clicks.textContent = fightBackClicks;
    }

    function playFightBack() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;
        // Power-up punch sound - BOOSTED
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
        gain.gain.setValueAtTime(0.6, now); // BOOSTED 3x
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        // Add impact thud
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain2.gain.setValueAtTime(0.5, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start(now);
        osc2.stop(now + 0.15);
    }

    // Punch/Kick animation for Fight Back
    function triggerPunchAnimation(clickNum) {
        const overlay = document.getElementById('punch-overlay');
        const leftSprite = document.getElementById('punch-sprite-left');
        const rightSprite = document.getElementById('punch-sprite-right');

        if (!overlay || !leftSprite || !rightSprite) return;

        // Show overlay
        overlay.classList.add('visible');

        // Alternate between left and right punches, with kicks on every 4th hit
        const isKick = clickNum % 4 === 0;
        const isLeft = clickNum % 2 === 1;

        // Clear ALL animation classes first
        leftSprite.classList.remove('punching-left', 'punching-right', 'kicking-left', 'kicking-right');
        rightSprite.classList.remove('punching-left', 'punching-right', 'kicking-left', 'kicking-right');

        // Force reflow to reset animation
        leftSprite.offsetHeight;
        rightSprite.offsetHeight;

        // Apply attack animation to the correct hand
        if (isLeft) {
            leftSprite.classList.add(isKick ? 'kicking-left' : 'punching-left');
        } else {
            rightSprite.classList.add(isKick ? 'kicking-right' : 'punching-right');
        }

        // Add screen shake effect - stronger for kicks
        const shakeIntensity = isKick ? 'screenShakeHard' : 'screenShake';
        document.body.style.animation = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.animation = `${shakeIntensity} 0.15s ease-out`;

        // Flash effect on screen
        const flashDiv = document.createElement('div');
        flashDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: ${isKick ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 150, 0, 0.4)'};
            z-index: 99999999; pointer-events: none;
            animation: flashFade 0.15s ease-out forwards;
        `;
        document.body.appendChild(flashDiv);
        setTimeout(() => flashDiv.remove(), 200);

        // Reset animation classes after animation completes
        const duration = isKick ? 250 : 200;
        setTimeout(() => {
            leftSprite.classList.remove('punching-left', 'kicking-left');
            rightSprite.classList.remove('punching-right', 'kicking-right');
        }, duration);
    }

    function hidePunchOverlay() {
        const overlay = document.getElementById('punch-overlay');
        if (overlay) overlay.classList.remove('visible');
    }

    let bloodPoolLevel = 0; // Track blood pool height
    const MAX_BLOOD_POOL = 150; // Maximum pool height in pixels

    function startBloodDrips() {
        setInterval(() => {
            if (Math.random() < 0.5) createBloodDrip(); // Increased frequency
        }, 600);
    }

    function createBloodDrip() {
        const container = document.getElementById('blood-drips-container');
        if (!container) return;

        const drip = document.createElement('div');
        drip.className = 'blood-drip-element';
        const leftPos = Math.random() * 100;
        const width = 3 + Math.random() * 6;
        const duration = 2500 + Math.random() * 2500;
        // Go all the way to the bottom of the viewport (minus blood pool height)
        const pageHeight = window.innerHeight - 50 - bloodPoolLevel;

        drip.style.cssText = `left: ${leftPos}%; width: ${width}px; height: 0;`;
        container.appendChild(drip);

        let startTime = null;
        const maxHeight = pageHeight;

        function animateDrip(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;

            if (progress < 1) {
                const currentHeight = maxHeight * progress;
                const topOffset = Math.max(0, currentHeight - 120);
                drip.style.height = Math.min(currentHeight, 180) + 'px';
                drip.style.top = topOffset + 'px';
                drip.style.opacity = 1 - (progress * 0.2);
                requestAnimationFrame(animateDrip);
            } else {
                // Drip hit bottom - splash and add to pool
                createBloodSplash(leftPos, width * 4);
                playBloodSplash(); // Always play splash sound
                addToBloodPool(width);
                drip.remove();
            }
        }
        requestAnimationFrame(animateDrip);
    }

    function addToBloodPool(amount) {
        const pool = document.getElementById('blood-pool');
        if (!pool) return;

        // Each drip adds a tiny bit to the pool
        bloodPoolLevel = Math.min(bloodPoolLevel + (amount * 0.3), MAX_BLOOD_POOL);
        pool.style.height = bloodPoolLevel + 'px';
    }

    function resetBloodPool() {
        bloodPoolLevel = 0;
        const pool = document.getElementById('blood-pool');
        if (pool) pool.style.height = '0px';
    }

    function createBloodSplash(leftPos, size) {
        const container = document.getElementById('blood-drips-container');
        if (!container) return;
        const splash = document.createElement('div');
        splash.className = 'blood-splash';
        splash.style.cssText = `left: calc(${leftPos}% - ${size/2}px); width: ${size}px; height: ${size * 0.6}px;`;
        container.appendChild(splash);
        setTimeout(() => {
            splash.style.transition = 'opacity 1s';
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 1000);
        }, 2000);
    }

    function playBloodSplash() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;
        const volume = 0.5 + Math.random() * 0.3; // BOOSTED 3x
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Wet splat noise - BOOSTED
        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800 + Math.random() * 400;
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noise.start(now);
        noise.stop(now + 0.3);
    }

    function updateScoreDisplay() {
        const scoreEl = document.getElementById('hud-score');
        if (scoreEl) scoreEl.textContent = score;
    }

    function updateSecretsDisplay() {
        const secretsEl = document.getElementById('hud-secrets');
        if (secretsEl) secretsEl.textContent = `${secretsFound}/${totalSecrets}`;
    }

    function showEscapePrompt() {
        const prompt = document.getElementById('escape-prompt');
        const punchOverlay = document.getElementById('punch-overlay');
        if (prompt) {
            prompt.classList.add('visible');
        }
        if (punchOverlay) {
            punchOverlay.classList.add('visible');
        }
    }

    function hideEscapePrompt() {
        const prompt = document.getElementById('escape-prompt');
        hidePunchOverlay();
        if (prompt) prompt.classList.remove('visible');
        fightBackClicks = 0;
        updateFightProgress();
    }

    function updateEffects() {
        const fill = document.getElementById('insanity-fill');
        const valueEl = document.getElementById('insanity-value');
        const splatter = document.getElementById('blood-splatter-overlay');

        if (!fill || !valueEl) return;

        const level = insanity / CONFIG.maxInsanity;

        fill.style.width = insanity + '%';
        valueEl.textContent = Math.floor(insanity) + '%';

        fill.classList.remove('warning', 'danger');
        if (insanity >= CONFIG.thresholds.terrified) fill.classList.add('danger');
        else if (insanity >= CONFIG.thresholds.panicked) fill.classList.add('warning');

        // Lives are managed by death system, not insanity level
        // updateLivesDisplay() is called separately when lives change

        const masks = document.querySelectorAll('.mask-life');
        const masksRemaining = Math.max(0, 3 - Math.floor(insanity / 33));
        masks.forEach((mask, i) => mask.classList.toggle('lost', i >= masksRemaining));

        document.body.classList.remove('insanity-active', 'insanity-high', 'insanity-extreme');
        if (insanity >= CONFIG.thresholds.uneasy) document.body.classList.add('insanity-active');
        if (insanity >= CONFIG.thresholds.panicked) document.body.classList.add('insanity-high');
        if (insanity >= CONFIG.thresholds.madness) document.body.classList.add('insanity-extreme');

        // Sticky escape prompt at terrified level
        if (insanity >= CONFIG.thresholds.terrified) {
            showEscapePrompt();
        } else {
            hideEscapePrompt();
        }

        if (splatter) {
            if (insanity >= CONFIG.thresholds.panicked) {
                splatter.classList.add('visible');
                document.documentElement.style.setProperty('--splatter-opacity', Math.min((level - 0.5) * 1.5, 0.8));
            } else splatter.classList.remove('visible');
        }

        const wobbleX = level * 8, wobbleY = level * 6, wobbleR = level * 3, wobbleS = level * 2;
        document.documentElement.style.setProperty('--w-x1', wobbleX + 'px');
        document.documentElement.style.setProperty('--w-y1', wobbleY + 'px');
        document.documentElement.style.setProperty('--w-r1', wobbleR + 'deg');
        document.documentElement.style.setProperty('--w-s1', wobbleS + 'deg');
        document.documentElement.style.setProperty('--element-blur', Math.min(level * 3, 2.5) + 'px');

        document.documentElement.style.setProperty('--vignette-opacity', Math.min(level * 1.2, 0.9));
        document.documentElement.style.setProperty('--vignette-inner', Math.max(60 - level * 60, 10) + '%');
        document.documentElement.style.setProperty('--vignette-outer', Math.max(100 - level * 40, 50) + '%');

        document.documentElement.style.setProperty('--vein-size', Math.min(level * 200, 180) + 'px');
        document.documentElement.style.setProperty('--vein-opacity', Math.min(level * 1.0, 0.8));
        document.documentElement.style.setProperty('--vein-blur', Math.min(level * 15, 12) + 'px');
        document.documentElement.style.setProperty('--heartbeat-speed', Math.max(2 - level * 1.7, 0.3) + 's');

        if (insanity >= CONFIG.thresholds.anxious && Math.random() < 0.03 + level * 0.05) showWhisper();

        saveState();
    }

    function showWhisper() {
        const whispers = ['THE MASK SEES ALL', 'STAY FOREVER', 'NO ESCAPE', 'JOIN US', 'FEED THE DARKNESS', 'YOU BELONG HERE', 'IT HUNGERS', 'CLOSER...', 'BEHIND YOU', 'DONT LEAVE', 'WE ARE ONE', 'EMBRACE IT', 'YOUR SOUL', 'ENDLESS NIGHT', 'FEAR ME', 'GIVE IN'];
        const container = document.getElementById('insanity-whispers');
        if (!container) return;
        const whisper = document.createElement('div');
        whisper.className = 'whisper';
        whisper.textContent = whispers[Math.floor(Math.random() * whispers.length)];
        whisper.style.left = (Math.random() * 70 + 15) + '%';
        whisper.style.top = (Math.random() * 60 + 20) + '%';
        whisper.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;
        whisper.style.fontSize = (1.2 + Math.random() * 2) + 'rem';
        container.appendChild(whisper);
        setTimeout(() => whisper.remove(), 4000);
    }

    function initAudio() {
        if (audioContext) return;
        try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }

    function toggleSound() {
        const btn = document.getElementById('sound-toggle');
        if (!isAudioEnabled) {
            initAudio();
            if (audioContext) {
                isAudioEnabled = true;
                btn.textContent = '♪ SOUND: ON';
                btn.classList.add('enabled');
                startHeartbeat();
                startBreathing();
            }
        } else {
            isAudioEnabled = false;
            btn.textContent = '♪ SOUND: OFF';
            btn.classList.remove('enabled');
            stopHeartbeat();
            stopBreathing();
        }
    }

    function playHeartbeat() {
        if (!audioContext || !isAudioEnabled) return;
        const level = insanity / CONFIG.maxInsanity;
        const volume = Math.min(0.4 + level * 0.4, 0.7);
        const now = audioContext.currentTime;

        // Create a more realistic heartbeat with proper "lub-dub" sound
        // Uses layered frequencies and a lowpass filter for that deep chest thump

        // LUB (first beat - louder, deeper)
        const lub1 = audioContext.createOscillator();
        const lub2 = audioContext.createOscillator();
        const lubGain = audioContext.createGain();
        const lubFilter = audioContext.createBiquadFilter();

        lubFilter.type = 'lowpass';
        lubFilter.frequency.value = 80;
        lubFilter.Q.value = 8;

        lub1.type = 'sine';
        lub1.frequency.setValueAtTime(55, now);
        lub1.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        lub2.type = 'sine';
        lub2.frequency.setValueAtTime(40, now);
        lub2.frequency.exponentialRampToValueAtTime(20, now + 0.1);

        lubGain.gain.setValueAtTime(0, now);
        lubGain.gain.linearRampToValueAtTime(volume, now + 0.015);
        lubGain.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.06);
        lubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        lub1.connect(lubFilter);
        lub2.connect(lubFilter);
        lubFilter.connect(lubGain);
        lubGain.connect(audioContext.destination);

        lub1.start(now);
        lub2.start(now);
        lub1.stop(now + 0.15);
        lub2.stop(now + 0.15);

        // DUB (second beat - softer, quicker)
        const dub1 = audioContext.createOscillator();
        const dub2 = audioContext.createOscillator();
        const dubGain = audioContext.createGain();
        const dubFilter = audioContext.createBiquadFilter();

        dubFilter.type = 'lowpass';
        dubFilter.frequency.value = 70;
        dubFilter.Q.value = 6;

        dub1.type = 'sine';
        dub1.frequency.setValueAtTime(45, now + 0.18);
        dub1.frequency.exponentialRampToValueAtTime(25, now + 0.24);

        dub2.type = 'sine';
        dub2.frequency.setValueAtTime(35, now + 0.18);
        dub2.frequency.exponentialRampToValueAtTime(18, now + 0.26);

        dubGain.gain.setValueAtTime(0, now + 0.18);
        dubGain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.195);
        dubGain.gain.exponentialRampToValueAtTime(volume * 0.2, now + 0.23);
        dubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        dub1.connect(dubFilter);
        dub2.connect(dubFilter);
        dubFilter.connect(dubGain);
        dubGain.connect(audioContext.destination);

        dub1.start(now + 0.18);
        dub2.start(now + 0.18);
        dub1.stop(now + 0.32);
        dub2.stop(now + 0.32);
    }

    function playBreathing() {
        if (!audioContext || !isAudioEnabled) return;
        const level = insanity / CONFIG.maxInsanity;
        const volume = Math.min(0.15 + level * 0.25, 0.35);
        const now = audioContext.currentTime;

        // Realistic breath: filtered noise with specific frequency shaping
        // Inhale is higher pitch, exhale is lower - creates that "hhhh-ahhh" sound

        // INHALE (sharper, higher)
        const inhaleLength = 0.8 + (1 - level) * 0.6;
        const inhaleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * inhaleLength, audioContext.sampleRate);
        const inhaleData = inhaleBuffer.getChannelData(0);

        // Shape noise to sound like air through nose/mouth
        for (let i = 0; i < inhaleBuffer.length; i++) {
            const t = i / inhaleBuffer.length;
            // Envelope: quick attack, sustain, quick release
            const env = Math.sin(t * Math.PI) * (1 - t * 0.3);
            // Pink-ish noise (lower frequencies emphasized)
            const noise = (Math.random() * 2 - 1) * 0.3 + (Math.random() * 2 - 1) * 0.2;
            inhaleData[i] = noise * env;
        }

        const inhaleSource = audioContext.createBufferSource();
        inhaleSource.buffer = inhaleBuffer;

        const inhaleFilter = audioContext.createBiquadFilter();
        inhaleFilter.type = 'bandpass';
        inhaleFilter.frequency.value = 800 + level * 400; // Higher when panicked
        inhaleFilter.Q.value = 0.8;

        const inhaleFilter2 = audioContext.createBiquadFilter();
        inhaleFilter2.type = 'highpass';
        inhaleFilter2.frequency.value = 200;

        const inhaleGain = audioContext.createGain();
        inhaleGain.gain.setValueAtTime(0, now);
        inhaleGain.gain.linearRampToValueAtTime(volume, now + 0.1);
        inhaleGain.gain.setValueAtTime(volume, now + inhaleLength * 0.7);
        inhaleGain.gain.linearRampToValueAtTime(0, now + inhaleLength);

        inhaleSource.connect(inhaleFilter);
        inhaleFilter.connect(inhaleFilter2);
        inhaleFilter2.connect(inhaleGain);
        inhaleGain.connect(audioContext.destination);
        inhaleSource.start(now);
        inhaleSource.stop(now + inhaleLength);

        // EXHALE (deeper, longer)
        const exhaleStart = now + inhaleLength + 0.15;
        const exhaleLength = 1.0 + (1 - level) * 0.8;
        const exhaleBuffer = audioContext.createBuffer(1, audioContext.sampleRate * exhaleLength, audioContext.sampleRate);
        const exhaleData = exhaleBuffer.getChannelData(0);

        for (let i = 0; i < exhaleBuffer.length; i++) {
            const t = i / exhaleBuffer.length;
            // Slower attack, longer decay
            const env = Math.pow(Math.sin(t * Math.PI), 0.7) * (1 - t * 0.4);
            const noise = (Math.random() * 2 - 1) * 0.25 + (Math.random() * 2 - 1) * 0.15;
            exhaleData[i] = noise * env;
        }

        const exhaleSource = audioContext.createBufferSource();
        exhaleSource.buffer = exhaleBuffer;

        const exhaleFilter = audioContext.createBiquadFilter();
        exhaleFilter.type = 'bandpass';
        exhaleFilter.frequency.value = 400 + level * 200; // Lower than inhale
        exhaleFilter.Q.value = 0.6;

        const exhaleFilter2 = audioContext.createBiquadFilter();
        exhaleFilter2.type = 'lowpass';
        exhaleFilter2.frequency.value = 1200;

        const exhaleGain = audioContext.createGain();
        exhaleGain.gain.setValueAtTime(0, exhaleStart);
        exhaleGain.gain.linearRampToValueAtTime(volume * 0.8, exhaleStart + 0.15);
        exhaleGain.gain.setValueAtTime(volume * 0.7, exhaleStart + exhaleLength * 0.6);
        exhaleGain.gain.linearRampToValueAtTime(0, exhaleStart + exhaleLength);

        exhaleSource.connect(exhaleFilter);
        exhaleFilter.connect(exhaleFilter2);
        exhaleFilter2.connect(exhaleGain);
        exhaleGain.connect(audioContext.destination);
        exhaleSource.start(exhaleStart);
        exhaleSource.stop(exhaleStart + exhaleLength);
    }

    function startHeartbeat() {
        if (heartbeatInterval) return;
        const updateInterval = () => {
            const level = insanity / CONFIG.maxInsanity;
            const interval = Math.max(1400 - level * 1100, 250);
            clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => { playHeartbeat(); updateInterval(); }, interval);
        };
        playHeartbeat();
        updateInterval();
    }

    function stopHeartbeat() { if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; } }

    function startBreathing() {
        if (breathingInterval) return;
        const updateInterval = () => {
            const level = insanity / CONFIG.maxInsanity;
            // Full breath cycle takes about 2-3 seconds, so interval should be longer
            const interval = Math.max(4000 - level * 2500, 1500);
            clearInterval(breathingInterval);
            breathingInterval = setInterval(() => { playBreathing(); updateInterval(); }, interval);
        };
        playBreathing();
        updateInterval();
    }

    function stopBreathing() { if (breathingInterval) { clearInterval(breathingInterval); breathingInterval = null; } }

    // Evil laughter for game over
    function playEvilLaughter() {
        if (!audioContext) return;
        const now = audioContext.currentTime;

        // Multiple "HA" sounds layered for evil laughter
        const laughs = [
            { delay: 0, freq: 200, duration: 0.25 },
            { delay: 0.3, freq: 180, duration: 0.3 },
            { delay: 0.65, freq: 160, duration: 0.35 },
            { delay: 1.05, freq: 140, duration: 0.4 },
            { delay: 1.5, freq: 120, duration: 0.5 },
            { delay: 2.1, freq: 100, duration: 0.6 },
            { delay: 2.8, freq: 80, duration: 0.8 }
        ];

        laughs.forEach(laugh => {
            const startTime = now + laugh.delay;

            // Main voice oscillator
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();

            filter.type = 'lowpass';
            filter.frequency.value = 1500;
            filter.Q.value = 2;

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(laugh.freq, startTime);
            osc1.frequency.exponentialRampToValueAtTime(laugh.freq * 0.7, startTime + laugh.duration * 0.8);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(laugh.freq * 1.5, startTime);
            osc2.frequency.exponentialRampToValueAtTime(laugh.freq * 0.9, startTime + laugh.duration);

            // "HA" envelope - quick attack, sustain, decay
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.5, startTime + 0.03);
            gain.gain.setValueAtTime(0.45, startTime + laugh.duration * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + laugh.duration);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(audioContext.destination);

            osc1.start(startTime);
            osc2.start(startTime);
            osc1.stop(startTime + laugh.duration);
            osc2.stop(startTime + laugh.duration);

            // Add some distortion/growl
            const noise = audioContext.createBufferSource();
            const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * laugh.duration, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                noiseData[i] = (Math.random() * 2 - 1) * 0.1;
            }
            noise.buffer = noiseBuffer;
            const noiseGain = audioContext.createGain();
            const noiseFilter = audioContext.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = laugh.freq * 2;
            noiseFilter.Q.value = 1;
            noiseGain.gain.setValueAtTime(0, startTime);
            noiseGain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + laugh.duration);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            noise.start(startTime);
            noise.stop(startTime + laugh.duration);
        });
    }

    // Death sound effect
    function playDeathSound() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;

        // Dramatic death sting
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 1.5);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(150, now);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 2);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2);
        osc2.stop(now + 2);
    }

    // Trigger death when insanity hits 100%
    function triggerDeath() {
        if (isDead) return;
        isDead = true;

        // Stop heartbeat and breathing during death
        stopHeartbeat();
        stopBreathing();

        // Hide escape prompt if visible
        hideEscapePrompt();

        // Decrement lives
        lives = Math.max(0, lives - 1);
        saveState();

        // Play death sound
        playDeathSound();

        // Check if game over
        if (lives <= 0) {
            // No lives left - game over!
            setTimeout(() => triggerGameOver(), 500);
            return;
        }

        // Show death screen with remaining lives
        const livesCount = document.getElementById('death-lives-count');
        if (livesCount) livesCount.textContent = lives;

        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.add('visible');
    }

    function hideDeathScreen() {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.remove('visible');

        // Restart audio effects
        if (isAudioEnabled && audioContext) {
            startHeartbeat();
            startBreathing();
        }
    }

    // Trigger game over with Rick death animation
    function triggerGameOver() {
        const gameOverScreen = document.getElementById('game-over-screen');
        const rickSprite = document.getElementById('rick-dying-sprite');
        const maskSprite = document.getElementById('game-over-mask');
        const gameOverText = document.querySelector('.game-over-text');
        const continueBtn = document.getElementById('btn-continue');

        if (!gameOverScreen) return;

        // Hide death screen first if visible
        hideDeathScreen();

        // Show game over screen
        gameOverScreen.classList.add('visible');

        // Phase 1: Rick dying visible (0-2s)
        if (rickSprite) {
            rickSprite.style.opacity = '1';
            rickSprite.classList.remove('fade-out');
        }
        if (maskSprite) {
            maskSprite.classList.remove('visible');
            maskSprite.style.opacity = '0';
        }
        if (gameOverText) gameOverText.classList.remove('visible');
        if (continueBtn) continueBtn.classList.remove('visible');

        // Phase 2: Rick fades, mask appears (2-4s)
        setTimeout(() => {
            if (rickSprite) rickSprite.classList.add('fade-out');

            setTimeout(() => {
                if (maskSprite) maskSprite.classList.add('visible');

                // Play evil laughter when mask appears
                playEvilLaughter();
            }, 800);
        }, 2000);

        // Phase 3: Text appears (4s)
        setTimeout(() => {
            if (gameOverText) gameOverText.classList.add('visible');
        }, 4000);

        // Phase 4: Continue button appears (5.5s)
        setTimeout(() => {
            if (continueBtn) continueBtn.classList.add('visible');
        }, 5500);
    }

    function hideGameOverScreen() {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) gameOverScreen.classList.remove('visible');

        // Reset animation states
        const rickSprite = document.getElementById('rick-dying-sprite');
        const maskSprite = document.getElementById('game-over-mask');
        const gameOverText = document.querySelector('.game-over-text');
        const continueBtn = document.getElementById('btn-continue');

        if (rickSprite) rickSprite.classList.remove('fade-out');
        if (maskSprite) maskSprite.classList.remove('visible');
        if (gameOverText) gameOverText.classList.remove('visible');
        if (continueBtn) continueBtn.classList.remove('visible');

        // Restart audio effects
        if (isAudioEnabled && audioContext) {
            startHeartbeat();
            startBreathing();
        }
    }

    // Update lives display in HUD
    function updateLivesDisplay() {
        const hearts = document.querySelectorAll('#life-hearts .heart-icon');
        hearts.forEach((heart, i) => {
            const isActive = i < lives;
            heart.classList.toggle('active', isActive);
            heart.classList.toggle('lost', !isActive);
            heart.src = isActive ? '/images/sprites/HARTA0.png' : '/images/sprites/HARTB0.png';
        });
    }

    function startInsanityTimer() {
        setInterval(() => {
            if (document.visibilityState === 'visible' && !isDead) {
                timeOnPage++;
                insanity = Math.min(insanity + CONFIG.timeIncrement, CONFIG.maxInsanity);
                if (timeOnPage % 5 === 0) { score += 100; updateScoreDisplay(); }
                updateEffects();

                // Check for death at 100% insanity
                if (insanity >= CONFIG.maxInsanity) {
                    triggerDeath();
                }
            }
        }, CONFIG.timeInterval);
    }

    // Global functions
    window.resetInsanity = function() { insanity = 0; fightBackClicks = 0; resetBloodPool(); updateEffects(); saveState(); console.log('%c Sanity restored ', 'background: #00cc44; color: #000;'); };
    window.maxInsanity = function() { insanity = CONFIG.maxInsanity; updateEffects(); saveState(); console.log('%c THE MASK CONSUMES YOU ', 'background: #cc0000; color: #fff;'); };
    window.setInsanity = function(level) { insanity = Math.max(0, Math.min(level, CONFIG.maxInsanity)); updateEffects(); saveState(); };
    window.addScore = function(pts) { score += pts; updateScoreDisplay(); saveState(); };
    window.foundSecret = function() {
        if (secretsFound < totalSecrets) {
            secretsFound++;
            score += 1000;
            updateSecretsDisplay();
            updateScoreDisplay();
            saveState();
            console.log('%c SECRET FOUND! ' + secretsFound + '/' + totalSecrets, 'background: #ffcc00; color: #000;');

            // All secrets found - redirect to ending!
            if (secretsFound >= totalSecrets) {
                console.log('%c ALL SECRETS FOUND! ', 'background: #00ff00; color: #000; font-size: 20px;');
                setTimeout(() => {
                    window.location.href = '/secrets-complete.html';
                }, 1500);
            }
        }
    };

    function init() {
        loadState();
        createUI();

        // Start with insanity at 0 for fresh page loads - give user time to settle in
        insanity = 0;
        isDead = false;
        updateEffects();
        updateLivesDisplay();

        // 12 second grace period before insanity begins
        const GRACE_PERIOD = 12000;
        console.log('%c SPLATTERHOUSE: GOD MODE INTEL ', 'background: #1a0f05; color: #4a9c5a; font-size: 14px;');
        console.log('%c The mask awakens in 12 seconds... ', 'color: #666; font-style: italic;');
        console.log('%c Commands: resetInsanity(), maxInsanity(), setInsanity(n), foundSecret() ', 'color: #666;');
        console.log('%c Lives: ' + lives, 'color: #ffcc00;');

        setTimeout(() => {
            console.log('%c THE MASK HUNGERS... Insanity begins ', 'background: #330000; color: #ff0000;');
            startInsanityTimer();
        }, GRACE_PERIOD);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
