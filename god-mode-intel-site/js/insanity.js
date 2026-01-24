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
        maskMaxHP: 150,        // Base HP - modified by difficulty
        minDamage: 0,          // Miss
        maxDamage: 20,         // Critical hit
        storageKey: 'godmode_insanity',
        scoreKey: 'godmode_score',
        secretsKey: 'godmode_secrets',
        livesKey: 'godmode_lives',
        difficultyKey: 'godmode_difficulty',
        thresholds: { calm: 0, uneasy: 15, anxious: 30, panicked: 50, terrified: 70, madness: 90 }
    };

    // Difficulty settings - 1 (baby) to 5 (nightmare)
    const DIFFICULTY = {
        1: { name: "BABY MODE", hp: 50, insult: "For tiny babies who cry at horror movies", color: "#ffaaff" },
        2: { name: "WIMP", hp: 100, insult: "Still scared of the dark, huh?", color: "#aaffaa" },
        3: { name: "NORMAL", hp: 150, insult: "Average mortal. How boring.", color: "#ffff66" },
        4: { name: "BRUTAL", hp: 250, insult: "You might actually survive...", color: "#ffaa44" },
        5: { name: "NIGHTMARE", hp: 400, insult: "THE MASK APPROVES. PREPARE TO DIE.", color: "#ff4444" }
    };

    let currentDifficulty = parseInt(localStorage.getItem(CONFIG.difficultyKey)) || 3;

    let audioContext = null;
    let heartbeatInterval = null;
    let breathingInterval = null;
    let isAudioEnabled = true; // Sound ON by default

    let insanity = 0;
    let score = 0;
    let timeOnPage = 0;
    let secretsFound = 0;
    let totalSecrets = 13;
    let fightBackClicks = 0;  // Now tracks combo for punch/kick pattern
    let maskHP = DIFFICULTY[currentDifficulty].hp;  // Dr. West's HP based on difficulty
    let difficultySelected = false;  // Track if difficulty was chosen this fight
    let fightInProgress = false;  // Track if actively fighting Dr. West (don't auto-hide)
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

        // CENTERED Escape prompt with FIGHT BACK - Battle Dr. West!
        const escapePrompt = document.createElement('div');
        escapePrompt.id = 'escape-prompt';
        escapePrompt.innerHTML = `
            <div class="escape-backdrop"></div>
            <div class="escape-content" id="escape-dialog">
                <div class="difficulty-select" id="difficulty-select">
                    <div class="difficulty-title">CHOOSE YOUR FATE</div>
                    <div class="difficulty-options">
                        <button class="diff-btn" data-diff="1"><span class="diff-num">1</span><span class="diff-name">BABY MODE</span></button>
                        <button class="diff-btn" data-diff="2"><span class="diff-num">2</span><span class="diff-name">WIMP</span></button>
                        <button class="diff-btn" data-diff="3"><span class="diff-num">3</span><span class="diff-name">NORMAL</span></button>
                        <button class="diff-btn" data-diff="4"><span class="diff-num">4</span><span class="diff-name">BRUTAL</span></button>
                        <button class="diff-btn" data-diff="5"><span class="diff-num">5</span><span class="diff-name">NIGHTMARE</span></button>
                    </div>
                    <div class="difficulty-insult" id="difficulty-insult"></div>
                </div>
                <div class="fight-arena" id="fight-arena" style="display: none;">
                    <div class="mask-encouragement" id="mask-encouragement">
                        <img src="/images/sprites/TMSKA0.png" alt="Terror Mask" class="mask-helper">
                        <span class="mask-speech" id="mask-speech">DESTROY HIM!</span>
                    </div>
                    <div class="boss-container" id="boss-container">
                        <img src="/images/sprites/DWSTA0.png" alt="Dr. West" id="boss-sprite" class="boss-sprite">
                    </div>
                    <div class="boss-hp-container">
                        <span class="boss-hp-label">DR. WEST</span>
                        <div class="boss-hp-bar">
                            <div class="boss-hp-fill" id="mask-hp-fill"></div>
                        </div>
                        <span class="boss-hp-value" id="mask-hp-value">150/150</span>
                    </div>
                </div>
                <div class="damage-display" id="damage-display"></div>
                <div class="escape-buttons" id="escape-buttons" style="display: none;">
                    <button class="escape-btn escape-stay" id="btn-stay">FLEE</button>
                    <button class="escape-btn escape-fight" id="btn-fight">ATTACK!</button>
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

        // Punch/Kick overlay for Fight Back - frame-based animation
        const punchOverlay = document.createElement('div');
        punchOverlay.id = 'punch-overlay';
        punchOverlay.innerHTML = `
            <img src="/images/sprites/FISTA0.png" alt="Punch" class="punch-sprite" id="punch-sprite-active">
        `;
        document.documentElement.appendChild(punchOverlay);

        // Preload all punch/kick sprites
        const punchFrames = ['FISTA0', 'RFISD0', 'RFISG0', 'RFISI0'];
        const kickFrames = ['RBUTA0', 'RBUTB0', 'RBUTC0', 'RBUTD0', 'RBUTE0', 'RBUTF0'];
        [...punchFrames, ...kickFrames].forEach(frame => {
            const img = new Image();
            img.src = `/images/sprites/${frame}.png`;
        });

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

            /* Difficulty Selector */
            .difficulty-select {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                padding: 20px;
            }
            .difficulty-title {
                font-family: 'Nosifer', cursive;
                font-size: 1.2rem;
                color: #ff0000;
                text-shadow: 0 0 15px rgba(255, 0, 0, 0.8), 3px 3px 0 #000;
                animation: diffTitlePulse 1s ease-in-out infinite;
            }
            @keyframes diffTitlePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); text-shadow: 0 0 25px rgba(255, 0, 0, 1), 3px 3px 0 #000; }
            }
            .difficulty-options {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .diff-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 12px 15px;
                background: rgba(30, 5, 5, 0.9);
                border: 2px solid #440000;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 80px;
            }
            .diff-btn:hover {
                border-color: #ff0000;
                transform: scale(1.1);
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.6);
            }
            .diff-btn[data-diff="1"] { border-color: #ffaaff; }
            .diff-btn[data-diff="1"]:hover { box-shadow: 0 0 20px rgba(255, 170, 255, 0.6); }
            .diff-btn[data-diff="2"] { border-color: #aaffaa; }
            .diff-btn[data-diff="2"]:hover { box-shadow: 0 0 20px rgba(170, 255, 170, 0.6); }
            .diff-btn[data-diff="3"] { border-color: #ffff66; }
            .diff-btn[data-diff="3"]:hover { box-shadow: 0 0 20px rgba(255, 255, 102, 0.6); }
            .diff-btn[data-diff="4"] { border-color: #ffaa44; }
            .diff-btn[data-diff="4"]:hover { box-shadow: 0 0 20px rgba(255, 170, 68, 0.6); }
            .diff-btn[data-diff="5"] { border-color: #ff4444; }
            .diff-btn[data-diff="5"]:hover { box-shadow: 0 0 20px rgba(255, 68, 68, 0.6); }
            .diff-btn.selected {
                background: rgba(80, 0, 0, 0.9);
                transform: scale(1.15);
            }
            .diff-num {
                font-family: 'Nosifer', cursive;
                font-size: 1.5rem;
                color: inherit;
            }
            .diff-btn[data-diff="1"] .diff-num { color: #ffaaff; }
            .diff-btn[data-diff="2"] .diff-num { color: #aaffaa; }
            .diff-btn[data-diff="3"] .diff-num { color: #ffff66; }
            .diff-btn[data-diff="4"] .diff-num { color: #ffaa44; }
            .diff-btn[data-diff="5"] .diff-num { color: #ff4444; }
            .diff-name {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.4rem;
                color: #888;
                text-transform: uppercase;
            }
            .difficulty-insult {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.5rem;
                color: #cc0000;
                text-align: center;
                min-height: 2em;
                padding: 10px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #330000;
                max-width: 350px;
                animation: insultFlicker 3s ease-in-out infinite;
            }
            @keyframes insultFlicker {
                0%, 90%, 100% { opacity: 1; }
                92%, 96% { opacity: 0.3; }
            }

            /* Fight Arena Layout */
            .fight-arena {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                padding: 15px;
                background: radial-gradient(ellipse at center, rgba(50,0,0,0.8) 0%, rgba(20,0,0,0.95) 100%);
                border: 3px solid #440000;
                border-radius: 10px;
            }
            .mask-encouragement {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 5px 15px;
                background: rgba(0,0,0,0.6);
                border: 2px solid #cc0000;
                border-radius: 5px;
            }
            .mask-helper {
                width: 40px;
                height: auto;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 8px rgba(255,0,0,0.8));
                animation: maskBob 1s ease-in-out infinite;
            }
            @keyframes maskBob {
                0%, 100% { transform: translateY(0) rotate(-5deg); }
                50% { transform: translateY(-5px) rotate(5deg); }
            }
            .mask-speech {
                font-family: 'Nosifer', cursive;
                font-size: 0.8rem;
                color: #ff0000;
                text-shadow: 2px 2px 0 #000, 0 0 10px rgba(255,0,0,0.5);
                animation: speechPulse 2s ease-in-out infinite;
            }
            @keyframes speechPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            .boss-container {
                position: relative;
                padding: 20px;
            }
            .boss-sprite {
                width: auto;
                height: 150px;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 15px rgba(100,0,0,0.9));
                transition: filter 0.1s;
            }
            .boss-sprite.hit {
                animation: bossHit 0.2s ease-out !important;
            }
            .boss-sprite.critical-hit {
                animation: bossCritical 0.4s ease-out !important;
            }
            .boss-sprite.dead {
                animation: bossDeath 0.8s ease-out forwards !important;
            }
            @keyframes bossHit {
                0% { transform: translateX(0); filter: brightness(1); }
                25% { transform: translateX(-15px) rotate(-5deg); filter: brightness(2) sepia(1) hue-rotate(-30deg); }
                50% { transform: translateX(15px) rotate(5deg); filter: brightness(1.5); }
                100% { transform: translateX(0); filter: brightness(1); }
            }
            @keyframes bossCritical {
                0% { transform: scale(1) rotate(0); filter: brightness(1); }
                20% { transform: scale(0.8) rotate(-10deg); filter: brightness(3) sepia(1) saturate(3); }
                40% { transform: scale(1.1) rotate(10deg); filter: brightness(2) hue-rotate(-20deg); }
                60% { transform: scale(0.9) rotate(-5deg); filter: brightness(2.5); }
                100% { transform: scale(1) rotate(0); filter: brightness(1); }
            }
            @keyframes bossDeath {
                0% { transform: scale(1) rotate(0); opacity: 1; }
                30% { transform: scale(1.2) rotate(-15deg); filter: brightness(3) sepia(1); }
                60% { transform: scale(0.8) rotate(15deg) translateY(20px); filter: brightness(0.5); }
                100% { transform: scale(0.5) rotate(0) translateY(50px); opacity: 0; filter: brightness(0); }
            }

            /* Boss HP Bar */
            .boss-hp-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                min-width: 200px;
            }
            .boss-hp-label {
                font-family: 'Nosifer', cursive;
                font-size: 0.6rem;
                color: #ff4444;
                text-shadow: 2px 2px 0 #000;
                letter-spacing: 2px;
            }
            .boss-hp-bar {
                width: 100%;
                height: 20px;
                background: #1a0808;
                border: 3px solid #660000;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(100,0,0,0.5);
                overflow: hidden;
            }
            .boss-hp-fill {
                height: 100%;
                width: 100%;
                background: linear-gradient(180deg, #ff0000 0%, #aa0000 50%, #880000 100%);
                box-shadow: 0 0 10px #ff0000;
                transition: width 0.3s ease-out;
            }
            .boss-hp-fill.critical {
                background: linear-gradient(180deg, #ff4400 0%, #cc2200 50%, #aa0000 100%);
                animation: hpCritical 0.3s ease-in-out infinite;
            }
            @keyframes hpCritical {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .boss-hp-value {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.4rem;
                color: #ff6666;
                text-shadow: 1px 1px 0 #000;
            }

            /* Damage Display */
            .damage-display {
                min-height: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .damage-number {
                font-family: 'Nosifer', cursive;
                font-size: 1.5rem;
                font-weight: bold;
                animation: damagePopup 0.6s ease-out forwards;
                text-shadow: 2px 2px 0 #000, 0 0 10px currentColor;
            }
            .damage-number.hit {
                color: #ffcc00;
            }
            .damage-number.critical {
                color: #ff0000;
                font-size: 2rem;
                animation: criticalPopup 0.8s ease-out forwards;
            }
            .damage-number.miss {
                color: #666;
                font-size: 1rem;
            }
            @keyframes damagePopup {
                0% { transform: scale(0.5) translateY(20px); opacity: 0; }
                30% { transform: scale(1.3) translateY(-10px); opacity: 1; }
                100% { transform: scale(1) translateY(0); opacity: 0; }
            }
            @keyframes criticalPopup {
                0% { transform: scale(0.5) translateY(20px) rotate(-10deg); opacity: 0; }
                20% { transform: scale(1.8) translateY(-15px) rotate(5deg); opacity: 1; }
                40% { transform: scale(1.5) translateY(-10px) rotate(-3deg); opacity: 1; }
                100% { transform: scale(1.2) translateY(0) rotate(0deg); opacity: 0; }
            }

            /* Mask Hit Reactions */
            .escape-content.hit-reaction {
                animation: dialogHit 0.15s ease-out !important;
            }
            .escape-content.critical-reaction {
                animation: dialogCritical 0.3s ease-out !important;
            }
            @keyframes dialogHit {
                0% { transform: translateX(0); }
                25% { transform: translateX(-15px) rotate(-2deg); }
                50% { transform: translateX(15px) rotate(2deg); }
                75% { transform: translateX(-8px) rotate(-1deg); }
                100% { transform: translateX(0) rotate(0deg); }
            }
            @keyframes dialogCritical {
                0% { transform: translate(0, 0) rotate(0deg); filter: brightness(1); }
                15% { transform: translate(-20px, -10px) rotate(-5deg); filter: brightness(2); }
                30% { transform: translate(20px, 10px) rotate(5deg); filter: brightness(1.5); }
                45% { transform: translate(-15px, -5px) rotate(-3deg); filter: brightness(2); }
                60% { transform: translate(15px, 5px) rotate(3deg); filter: brightness(1); }
                80% { transform: translate(-5px, 0) rotate(-1deg); }
                100% { transform: translate(0, 0) rotate(0deg); filter: brightness(1); }
            }
            #mask-icon.hit {
                animation: maskHit 0.2s ease-out !important;
            }
            #mask-icon.critical {
                animation: maskCritical 0.4s ease-out !important;
            }
            @keyframes maskHit {
                0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 15px rgba(204, 0, 0, 0.9)); }
                50% { transform: scale(0.8) rotate(-10deg); filter: drop-shadow(0 0 30px rgba(255, 255, 0, 1)) brightness(1.5); }
            }
            @keyframes maskCritical {
                0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 15px rgba(204, 0, 0, 0.9)); }
                25% { transform: scale(0.6) rotate(-20deg); filter: drop-shadow(0 0 50px rgba(255, 0, 0, 1)) brightness(2); }
                50% { transform: scale(1.3) rotate(15deg); filter: drop-shadow(0 0 40px rgba(255, 255, 0, 1)) brightness(1.8); }
                75% { transform: scale(0.9) rotate(-5deg); filter: drop-shadow(0 0 25px rgba(255, 100, 0, 1)); }
                100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 15px rgba(204, 0, 0, 0.9)); }
            }

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
                position: absolute;
                width: auto;
                height: 45vh;
                max-height: 400px;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 20px rgba(0, 0, 0, 0.9));
                transform-origin: bottom center;
            }
            #punch-overlay {
                justify-content: center;
            }
            #punch-sprite-active {
                transition: none;
            }
            /* Position punches at bottom corners, AWAY from dialog */
            #punch-sprite-active.left-punch {
                left: -5vw;
                right: auto;
                bottom: -20vh;
            }
            #punch-sprite-active.right-punch {
                right: -5vw;
                left: auto;
                bottom: -20vh;
                transform: scaleX(-1);
            }
            #punch-sprite-active.left-kick {
                left: -10vw;
                right: auto;
                bottom: -15vh;
            }
            #punch-sprite-active.right-kick {
                right: -10vw;
                left: auto;
                bottom: -15vh;
                transform: scaleX(-1);
            }
            .punch-sprite.animate-punch {
                animation: punchSwing 0.25s ease-out forwards !important;
            }
            .punch-sprite.animate-kick {
                animation: kickSwing 0.35s ease-out forwards !important;
            }

            /* Punch swings from bottom corner UP and TOWARD center (toward the mask) */
            @keyframes punchSwing {
                0% { transform: translateY(30vh) translateX(0) scale(0.6); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                40% { transform: translateY(-15vh) translateX(20vw) scale(1.4); filter: drop-shadow(0 0 50px rgba(255,100,0,1)) brightness(1.4); }
                60% { transform: translateY(-20vh) translateX(30vw) scale(1.5); filter: drop-shadow(0 0 70px rgba(255,50,0,1)) brightness(1.6); }
                100% { transform: translateY(-10vh) translateX(25vw) scale(1.2); filter: drop-shadow(0 0 30px rgba(255,50,0,0.6)); }
            }
            /* Kick swings from bottom corner with leg extended toward mask */
            @keyframes kickSwing {
                0% { transform: translateY(35vh) translateX(0) rotate(-30deg) scale(0.5); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                30% { transform: translateY(-5vh) translateX(15vw) rotate(-10deg) scale(1.3); filter: drop-shadow(0 0 40px rgba(255,0,0,0.9)); }
                50% { transform: translateY(-25vh) translateX(30vw) rotate(15deg) scale(1.6); filter: drop-shadow(0 0 100px rgba(255,0,0,1)) brightness(1.6); }
                70% { transform: translateY(-20vh) translateX(25vw) rotate(10deg) scale(1.4); filter: drop-shadow(0 0 60px rgba(255,0,0,0.9)); }
                100% { transform: translateY(-5vh) translateX(20vw) rotate(0deg) scale(1.1); filter: drop-shadow(0 0 25px rgba(255,0,0,0.4)); }
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

            @keyframes screenShakeBat {
                0% { transform: translate(0, 0) rotate(0deg); }
                10% { transform: translate(-25px, 15px) rotate(-2deg); }
                20% { transform: translate(25px, -15px) rotate(2deg); }
                30% { transform: translate(-20px, 10px) rotate(-1.5deg); }
                40% { transform: translate(20px, -10px) rotate(1.5deg); }
                50% { transform: translate(-15px, 8px) rotate(-1deg); }
                60% { transform: translate(15px, -8px) rotate(1deg); }
                70% { transform: translate(-10px, 5px) rotate(-0.5deg); }
                80% { transform: translate(8px, -4px) rotate(0.5deg); }
                90% { transform: translate(-4px, 2px); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }

            /* Bat attack positioning and animation */
            #punch-sprite-active.left-bat {
                left: -15vw;
                right: auto;
                bottom: -10vh;
            }
            #punch-sprite-active.right-bat {
                right: -15vw;
                left: auto;
                bottom: -10vh;
                transform: scaleX(-1);
            }
            .punch-sprite.animate-bat {
                animation: batSwing 0.4s ease-out forwards !important;
            }
            @keyframes batSwing {
                0% { transform: translateY(40vh) translateX(0) rotate(-60deg) scale(0.4); filter: drop-shadow(0 0 10px rgba(0,0,0,0.8)); }
                20% { transform: translateY(10vh) translateX(10vw) rotate(-30deg) scale(1.2); filter: drop-shadow(0 0 30px rgba(255,200,0,0.8)); }
                40% { transform: translateY(-15vh) translateX(25vw) rotate(30deg) scale(1.8); filter: drop-shadow(0 0 80px rgba(255,255,0,1)) brightness(1.5); }
                60% { transform: translateY(-20vh) translateX(35vw) rotate(60deg) scale(2.0); filter: drop-shadow(0 0 100px rgba(255,255,0,1)) brightness(1.8); }
                80% { transform: translateY(-10vh) translateX(30vw) rotate(45deg) scale(1.6); filter: drop-shadow(0 0 60px rgba(255,200,0,0.9)); }
                100% { transform: translateY(0) translateX(25vw) rotate(30deg) scale(1.3); filter: drop-shadow(0 0 30px rgba(255,150,0,0.5)); }
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

        // Difficulty selector handlers
        const diffButtons = document.querySelectorAll('.diff-btn');
        const diffInsult = document.getElementById('difficulty-insult');

        diffButtons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                const diff = parseInt(this.dataset.diff);
                diffInsult.textContent = DIFFICULTY[diff].insult;
                diffInsult.style.color = DIFFICULTY[diff].color;
            });

            btn.addEventListener('click', function() {
                currentDifficulty = parseInt(this.dataset.diff);
                localStorage.setItem(CONFIG.difficultyKey, currentDifficulty);

                // Update maskHP based on difficulty
                maskHP = DIFFICULTY[currentDifficulty].hp;
                difficultySelected = true;
                fightInProgress = true;  // Fight has begun - don't auto-hide prompt

                // Visual feedback
                diffButtons.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');

                // Show fight arena after short delay
                setTimeout(() => {
                    document.getElementById('difficulty-select').style.display = 'none';
                    document.getElementById('fight-arena').style.display = 'flex';
                    document.getElementById('escape-buttons').style.display = 'flex';
                    updateMaskHP();

                    // Play mask approval or mockery
                    if (isAudioEnabled) {
                        if (currentDifficulty <= 2) {
                            playMaskTaunt(); // Mock them for easy mode
                        }
                    }
                }, 300);
            });
        });

        // Button handlers
        document.getElementById('btn-stay').addEventListener('click', function() {
            // SUBMIT - user gives in to the mask (resets insanity to read content)
            fightInProgress = false;  // Fight ended - fled
            insanity = 0;
            fightBackClicks = 0;
            maskHP = DIFFICULTY[currentDifficulty].hp;
            resetBloodPool();
            updateEffects();
            updateMaskHP();
            hideEscapePrompt();
            saveState();

            // Mask laughs at submission
            if (isAudioEnabled) playMaskTaunt();
        });

        document.getElementById('btn-fight').addEventListener('click', function() {
            fightBackClicks++;

            // Visual feedback on button
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 100);

            // Determine attack type: bat (8th), kick (4th), punch (default)
            const attackType = getAttackType(fightBackClicks);

            // Show punch/kick/bat animation
            triggerPunchAnimation(fightBackClicks, attackType);

            // Calculate damage based on attack type
            // Punch: 0-20, Kick: 5-25, Bat: 15-40 (always hits hard!)
            let baseDamage, maxDamage;
            if (attackType === 'bat') {
                baseDamage = 15;
                maxDamage = 40;
            } else if (attackType === 'kick') {
                baseDamage = 5;
                maxDamage = 25;
            } else {
                baseDamage = 0;
                maxDamage = 20;
            }
            const damage = baseDamage + Math.floor(Math.random() * (maxDamage - baseDamage + 1));
            const isCritical = (attackType === 'bat' && damage >= 30) || (attackType !== 'bat' && damage >= 15);
            const isMiss = damage === 0;

            // Apply damage to mask
            maskHP = Math.max(0, maskHP - damage);

            // Update HP display
            updateMaskHP();

            // Show damage number
            showDamageNumber(damage, isCritical, isMiss);

            // Dialog and mask hit reactions
            triggerHitReaction(isCritical, isMiss);

            // Play appropriate sound
            if (isAudioEnabled) {
                if (isMiss) {
                    playMissSound();
                    playMaskTaunt(); // Mask laughs at misses
                } else if (isCritical) {
                    playCriticalHitSound();
                } else {
                    playFightBack();
                }
            }

            // Reduce insanity slightly per hit (not miss)
            if (!isMiss) {
                insanity = Math.max(0, insanity - 3);
                updateEffects();
            }

            // Check if Dr. West is defeated
            if (maskHP <= 0) {
                // Victory! Show death animation then Jennifer vision
                fightInProgress = false;  // Fight ended - victory!
                showBossDeath();  // This triggers the full Jennifer vision sequence
                if (isAudioEnabled) playVictorySound();

                // Award score bonus now (the full reset happens in resetAndContinue)
                const diffBonus = 1000 + (currentDifficulty * 500);
                score += diffBonus;
                updateScoreDisplay();
                saveState();
            } else if (fightBackClicks % 5 === 0 && !isMiss) {
                // Mask encourages on every 5th hit
                const maskSpeech = document.getElementById('mask-speech');
                if (maskSpeech) {
                    maskSpeech.textContent = maskPhrases[Math.floor(Math.random() * maskPhrases.length)];
                }
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

    // Update Mask HP display
    function updateMaskHP() {
        const fill = document.getElementById('mask-hp-fill');
        const value = document.getElementById('mask-hp-value');
        const maxHP = DIFFICULTY[currentDifficulty].hp;
        const percent = (maskHP / maxHP) * 100;

        if (fill) {
            fill.style.width = percent + '%';
            // Add critical class when low
            if (percent <= 25) {
                fill.classList.add('critical');
            } else {
                fill.classList.remove('critical');
            }
        }
        if (value) {
            value.textContent = `${maskHP}/${maxHP}`;
        }
    }

    // Show damage number popup
    function showDamageNumber(damage, isCritical, isMiss) {
        const display = document.getElementById('damage-display');
        if (!display) return;

        // Clear previous
        display.innerHTML = '';

        const dmgEl = document.createElement('span');
        dmgEl.className = 'damage-number';

        if (isMiss) {
            dmgEl.classList.add('miss');
            dmgEl.textContent = 'MISS!';
        } else if (isCritical) {
            dmgEl.classList.add('critical');
            dmgEl.textContent = `CRITICAL! -${damage}`;
        } else {
            dmgEl.classList.add('hit');
            dmgEl.textContent = `-${damage}`;
        }

        display.appendChild(dmgEl);

        // Remove after animation
        setTimeout(() => dmgEl.remove(), 800);
    }

    // Dr. West sprite states
    const drWestSprites = {
        idle: ['DWSTA0', 'DWSTB0', 'DWSTC0', 'DWSTD0'],
        hurt: ['DWSTI0', 'DWSTJ0', 'DWSTK0'],
        attack: ['DWSTE0', 'DWSTF0', 'DWSTG0', 'DWSTH0'],
        death: 'DWSTL0'
    };

    // Mask encouragement phrases
    const maskPhrases = [
        "DESTROY HIM!", "TEAR HIM APART!", "MAKE HIM BLEED!", "KILL HIM!",
        "SHOW NO MERCY!", "CRUSH HIM!", "FINISH HIM!", "RIP HIM APART!",
        "YES! MORE!", "AGAIN!", "HARDER!", "HE'S WEAKENING!"
    ];

    // Trigger boss hit reaction - animate Dr. West
    function triggerHitReaction(isCritical, isMiss) {
        const bossSprite = document.getElementById('boss-sprite');
        const maskSpeech = document.getElementById('mask-speech');
        const bossContainer = document.getElementById('boss-container');

        if (isMiss) {
            // Dr. West taunts on miss - show attack pose
            if (bossSprite) {
                const attackFrame = drWestSprites.attack[Math.floor(Math.random() * drWestSprites.attack.length)];
                bossSprite.src = `/images/sprites/${attackFrame}.png`;
                setTimeout(() => {
                    bossSprite.src = '/images/sprites/DWSTA0.png';
                }, 400);
            }
            return;
        }

        // Hit! Show hurt sprite and animate
        if (bossSprite) {
            // Show hurt frame
            const hurtFrame = drWestSprites.hurt[Math.floor(Math.random() * drWestSprites.hurt.length)];
            bossSprite.src = `/images/sprites/${hurtFrame}.png`;

            // Apply hit animation
            bossSprite.classList.remove('hit', 'critical-hit');
            bossSprite.offsetHeight;
            bossSprite.classList.add(isCritical ? 'critical-hit' : 'hit');

            // Return to idle after animation
            const duration = isCritical ? 400 : 200;
            setTimeout(() => {
                bossSprite.classList.remove('hit', 'critical-hit');
                // Show idle if not dead
                if (maskHP > 0) {
                    const idleFrame = drWestSprites.idle[Math.floor(Math.random() * drWestSprites.idle.length)];
                    bossSprite.src = `/images/sprites/${idleFrame}.png`;
                }
            }, duration);
        }

        // Mask encouragement on hit
        if (maskSpeech && Math.random() > 0.5) {
            maskSpeech.textContent = maskPhrases[Math.floor(Math.random() * maskPhrases.length)];
        }

        // Screen shake on hit
        if (bossContainer) {
            bossContainer.style.animation = 'none';
            bossContainer.offsetHeight;
            bossContainer.style.animation = isCritical ? 'dialogCritical 0.3s ease-out' : 'dialogHit 0.15s ease-out';
        }
    }

    // Show Dr. West death animation followed by Jennifer vision
    function showBossDeath() {
        const bossSprite = document.getElementById('boss-sprite');
        const bossContainer = document.getElementById('boss-container');
        const maskSpeech = document.getElementById('mask-speech');
        const fightArena = document.getElementById('fight-arena');
        const escapeButtons = document.getElementById('escape-buttons');

        // Hide attack buttons during sequence
        if (escapeButtons) escapeButtons.style.display = 'none';

        if (bossSprite) {
            bossSprite.src = `/images/sprites/${drWestSprites.death}.png`;
            bossSprite.classList.add('dead');
        }

        if (maskSpeech) {
            maskSpeech.textContent = "HE'S FINISHED!";
            maskSpeech.style.fontSize = '1rem';
        }

        // 50/50 chance: good ending (Jennifer) or bad ending (Monster Jennifer)
        const isGoodEnding = Math.random() < 0.5;

        // Start Jennifer vision sequence after Dr. West death
        setTimeout(() => {
            showJenniferVision(bossContainer, fightArena, isGoodEnding);
        }, 1500);
    }

    // Jennifer vision sequence - ghost appears, then either reunion or nightmare
    function showJenniferVision(container, arena, isGoodEnding) {
        if (!container) return;

        // Hide mask encouragement
        const maskEncouragement = document.getElementById('mask-encouragement');
        if (maskEncouragement) maskEncouragement.style.opacity = '0';

        // Hide HP bar
        const hpContainer = document.querySelector('.boss-hp-container');
        if (hpContainer) hpContainer.style.opacity = '0';

        // Spirit Jennifer animation sequence
        const spiritFrames = ['SPIRA0', 'SPIRB0', 'SPIRC0', 'SPIRD0'];
        const normalJennFrames = ['JENNA0', 'JENNB0', 'JENNC0', 'JENND0'];
        const monsterJennFrames = ['MJENA0', 'MJENB0', 'MJENC0', 'MJEND0', 'MJENE0'];

        // Create vision overlay
        const visionOverlay = document.createElement('div');
        visionOverlay.id = 'jennifer-vision';
        visionOverlay.innerHTML = `
            <div class="vision-backdrop"></div>
            <div class="vision-content">
                <img src="/images/sprites/SPIRA0.png" alt="Jennifer" class="jennifer-sprite" id="jennifer-sprite">
                <div class="vision-text" id="vision-text"></div>
            </div>
        `;
        document.body.appendChild(visionOverlay);

        // Add vision CSS
        const visionStyle = document.createElement('style');
        visionStyle.id = 'vision-style';
        visionStyle.textContent = `
            #jennifer-vision {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                z-index: 99999999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .vision-backdrop {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: #000;
                animation: visionFadeIn 1s ease-out forwards;
            }
            @keyframes visionFadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            .vision-content {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2rem;
            }
            .jennifer-sprite {
                width: auto;
                height: 200px;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 30px rgba(100, 200, 255, 0.8));
                animation: jenniferFloat 2s ease-in-out infinite;
            }
            @keyframes jenniferFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }
            .jennifer-sprite.monster {
                filter: drop-shadow(0 0 30px rgba(255, 0, 0, 0.9));
                animation: monsterTwitch 0.1s step-end infinite;
            }
            @keyframes monsterTwitch {
                0%, 50% { transform: translateX(0) rotate(0deg); }
                25% { transform: translateX(-3px) rotate(-1deg); }
                75% { transform: translateX(3px) rotate(1deg); }
            }
            .vision-text {
                font-family: 'Nosifer', cursive;
                font-size: 1.2rem;
                color: #88ccff;
                text-shadow: 0 0 20px rgba(100, 200, 255, 0.8);
                text-align: center;
                opacity: 0;
                max-width: 80vw;
            }
            .vision-text.visible {
                animation: textFadeIn 2s ease-out forwards;
            }
            @keyframes textFadeIn {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .vision-text.nightmare {
                color: #ff4444;
                text-shadow: 0 0 20px rgba(255, 0, 0, 0.9);
            }
            .reunion-image {
                width: auto;
                height: 250px;
                image-rendering: pixelated;
                opacity: 0;
                transition: opacity 2s ease-in;
            }
            .reunion-image.visible {
                opacity: 1;
            }
            .continue-btn {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.6rem;
                padding: 1rem 2rem;
                background: transparent;
                border: 2px solid #666;
                color: #888;
                cursor: pointer;
                opacity: 0;
                transition: all 0.3s;
                margin-top: 1rem;
            }
            .continue-btn.visible {
                opacity: 1;
                animation: continuePulse 1.5s ease-in-out infinite;
            }
            @keyframes continuePulse {
                0%, 100% { border-color: #666; color: #888; }
                50% { border-color: #88ccff; color: #88ccff; }
            }
            .continue-btn.nightmare {
                animation: continueNightmare 0.5s ease-in-out infinite;
            }
            @keyframes continueNightmare {
                0%, 100% { border-color: #880000; color: #ff4444; }
                50% { border-color: #ff0000; color: #ff0000; }
            }
            .continue-btn:hover {
                background: rgba(100, 200, 255, 0.2);
                border-color: #88ccff;
                color: #fff;
            }
        `;
        document.head.appendChild(visionStyle);

        const jenniferSprite = document.getElementById('jennifer-sprite');
        const visionText = document.getElementById('vision-text');
        let frameIndex = 0;

        // Animate spirit appearing
        const spiritInterval = setInterval(() => {
            if (frameIndex < spiritFrames.length) {
                jenniferSprite.src = `/images/sprites/${spiritFrames[frameIndex]}.png`;
                frameIndex++;
            } else {
                clearInterval(spiritInterval);

                // After spirit animation, show normal Jennifer or monster
                setTimeout(() => {
                    if (isGoodEnding) {
                        showGoodEnding(jenniferSprite, visionText, normalJennFrames);
                    } else {
                        showBadEnding(jenniferSprite, visionText, monsterJennFrames);
                    }
                }, 1500);
            }
        }, 600);
    }

    // Good ending: Jennifer reunion
    function showGoodEnding(sprite, textEl, frames) {
        // Show normal Jennifer getting up
        let frameIndex = 0;
        const jennInterval = setInterval(() => {
            if (frameIndex < frames.length) {
                sprite.src = `/images/sprites/${frames[frameIndex]}.png`;
                sprite.style.filter = 'drop-shadow(0 0 20px rgba(255, 200, 100, 0.8))';
                frameIndex++;
            } else {
                clearInterval(jennInterval);

                // Show reunion image
                setTimeout(() => {
                    sprite.src = '/images/sprites/END2.png';
                    sprite.style.height = '300px';
                    sprite.style.filter = 'none';
                    sprite.style.animation = 'none';

                    textEl.textContent = 'Was it just a dream...?';
                    textEl.classList.add('visible');

                    // Add continue button
                    setTimeout(() => {
                        const content = document.querySelector('.vision-content');
                        const btn = document.createElement('button');
                        btn.className = 'continue-btn visible';
                        btn.textContent = 'CONTINUE YOUR SEARCH...';
                        btn.onclick = () => resetAndContinue();
                        content.appendChild(btn);
                    }, 2000);
                }, 1000);
            }
        }, 400);
    }

    // Bad ending: Monster Jennifer
    function showBadEnding(sprite, textEl, frames) {
        // Transform into monster
        let frameIndex = 0;
        sprite.classList.add('monster');

        // Screen flash red
        const flashDiv = document.createElement('div');
        flashDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 0, 0, 0.8);
            z-index: 999999999; pointer-events: none;
            animation: flashFade 0.5s ease-out forwards;
        `;
        document.body.appendChild(flashDiv);
        setTimeout(() => flashDiv.remove(), 500);

        const monsterInterval = setInterval(() => {
            if (frameIndex < frames.length) {
                sprite.src = `/images/sprites/${frames[frameIndex]}.png`;
                sprite.style.height = '250px';
                frameIndex++;
            } else {
                clearInterval(monsterInterval);

                textEl.textContent = 'JENNIFER...?';
                textEl.classList.add('visible', 'nightmare');

                setTimeout(() => {
                    textEl.textContent = 'THE NIGHTMARE NEVER ENDS';

                    // Add continue button
                    const content = document.querySelector('.vision-content');
                    const btn = document.createElement('button');
                    btn.className = 'continue-btn visible nightmare';
                    btn.textContent = 'WAKE UP...';
                    btn.onclick = () => resetAndContinue();
                    content.appendChild(btn);
                }, 2000);
            }
        }, 300);
    }

    // Reset everything and continue (back to beginning)
    function resetAndContinue() {
        // Remove vision overlay
        const vision = document.getElementById('jennifer-vision');
        const visionStyle = document.getElementById('vision-style');
        if (vision) vision.remove();
        if (visionStyle) visionStyle.remove();

        // Reset all game state
        insanity = 0;
        fightBackClicks = 0;
        fightInProgress = false;
        maskHP = DIFFICULTY[currentDifficulty].hp;

        // Reset UI elements
        const maskEncouragement = document.getElementById('mask-encouragement');
        if (maskEncouragement) maskEncouragement.style.opacity = '1';
        const hpContainer = document.querySelector('.boss-hp-container');
        if (hpContainer) hpContainer.style.opacity = '1';
        const bossSprite = document.getElementById('boss-sprite');
        if (bossSprite) {
            bossSprite.classList.remove('dead');
            bossSprite.src = '/images/sprites/DWSTA0.png';
        }

        resetBloodPool();
        updateEffects();
        updateMaskHP();
        hideEscapePrompt();
        hidePunchOverlay();
        saveState();

        // Scroll to top (back to beginning)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Sound: Miss (whoosh)
    function playMissSound() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Sound: Critical hit
    function playCriticalHitSound() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;

        // Heavy impact
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.3);

        // Crunch overlay
        const noise = audioContext.createOscillator();
        const noiseGain = audioContext.createGain();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(150, now);
        noise.frequency.linearRampToValueAtTime(80, now + 0.15);
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noise.start(now);
        noise.stop(now + 0.2);
    }

    // Sound: Dr. West taunt/laugh (when you miss)
    const drWestTaunts = [
        "HA HA HA!", "PATHETIC!", "IS THAT ALL?", "WEAK!",
        "YOU CAN'T STOP ME!", "I AM IMMORTAL!", "FOOLISH BOY!", "YOU'LL DIE HERE!",
        "SCIENCE PREVAILS!", "JOIN MY EXPERIMENTS!"
    ];
    function playMaskTaunt() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;

        // Evil scientist laugh sound (higher pitch)
        for (let i = 0; i < 4; i++) {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sawtooth';
            const baseFreq = 200 + Math.random() * 100;
            osc.frequency.setValueAtTime(baseFreq, now + i * 0.1);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + i * 0.1 + 0.08);
            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.12);
        }

        // Show Dr. West taunt text
        const display = document.getElementById('damage-display');
        if (display) {
            const tauntEl = document.createElement('span');
            tauntEl.className = 'damage-number';
            tauntEl.style.color = '#88ff88'; // Green for Dr. West
            tauntEl.style.fontSize = '0.9rem';
            tauntEl.textContent = drWestTaunts[Math.floor(Math.random() * drWestTaunts.length)];
            display.innerHTML = '';
            display.appendChild(tauntEl);
            setTimeout(() => tauntEl.remove(), 800);
        }
    }

    // Sound: Victory
    function playVictorySound() {
        if (!audioContext || !isAudioEnabled) return;
        const now = audioContext.currentTime;

        // Triumphant fanfare
        const notes = [261, 329, 392, 523]; // C E G C
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.4, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.35);
        });
    }

    // Determine attack type based on click number with randomness
    function getAttackType(clickNum) {
        const rand = Math.random();

        // Bat: ~10% chance after 5th hit, guaranteed on every 10th-12th hit range
        if (clickNum >= 5 && (rand < 0.10 || (clickNum >= 10 && clickNum % 10 <= 2 && rand < 0.5))) {
            return 'bat';
        }

        // Kick: ~25% chance after 2nd hit, higher chance every 3rd-4th hit
        if (clickNum >= 2 && (rand < 0.25 || (clickNum % 3 === 0 && rand < 0.6))) {
            return 'kick';
        }

        // Punch is default (most common)
        return 'punch';
    }

    // Punch/Kick/Bat animation for Fight Back - frame-by-frame with real sprites
    function triggerPunchAnimation(clickNum, attackType) {
        const overlay = document.getElementById('punch-overlay');
        const sprite = document.getElementById('punch-sprite-active');

        if (!overlay || !sprite) return;

        const isLeft = clickNum % 2 === 1;

        // Sprite frame sequences for each attack type
        const punchFrames = ['FISTA0', 'RFISD0', 'RFISG0', 'RFISI0', 'RFISG0', 'RFISD0', 'FISTA0'];
        const kickFrames = ['RBUTA0', 'RBUTB0', 'RBUTC0', 'RBUTD0', 'RBUTD0', 'RBUTE0', 'RBUTF0'];
        // Bat uses single sprite with CSS rotation animation
        const batFrames = ['SPBTA0', 'SPBTA0', 'SPBTA0', 'SPBTA0', 'SPBTA0'];

        let frames, frameDelay;
        if (attackType === 'bat') {
            frames = batFrames;
            frameDelay = 60;
        } else if (attackType === 'kick') {
            frames = kickFrames;
            frameDelay = 50;
        } else {
            frames = punchFrames;
            frameDelay = 40;
        }

        // Set the first frame IMMEDIATELY before showing overlay
        sprite.src = `/images/sprites/${frames[0]}.png`;

        // Show overlay
        overlay.classList.add('visible');

        // Position sprite - reset ALL position and animation classes first
        sprite.classList.remove('left-punch', 'right-punch', 'left-kick', 'right-kick', 'left-bat', 'right-bat', 'animate-punch', 'animate-kick', 'animate-bat');
        sprite.style.left = '';
        sprite.style.right = '';
        sprite.offsetHeight; // Force reflow

        if (attackType === 'bat') {
            sprite.classList.add(isLeft ? 'left-bat' : 'right-bat');
            sprite.classList.add('animate-bat');
            console.log('🏏 BAT SWING! Attack #' + clickNum);
        } else if (attackType === 'kick') {
            sprite.classList.add(isLeft ? 'left-kick' : 'right-kick');
            sprite.classList.add('animate-kick');
            console.log('🦵 KICK! Attack #' + clickNum);
        } else {
            sprite.classList.add(isLeft ? 'left-punch' : 'right-punch');
            sprite.classList.add('animate-punch');
            console.log('👊 PUNCH! Attack #' + clickNum);
        }

        // Mirror for right side
        if (!isLeft) {
            sprite.style.transform = 'scaleX(-1)';
        } else {
            sprite.style.transform = '';
        }

        // Animate through frames (bat uses CSS for rotation)
        let frameIndex = 0;
        const animateFrames = () => {
            if (frameIndex < frames.length) {
                sprite.src = `/images/sprites/${frames[frameIndex]}.png`;
                frameIndex++;
                setTimeout(animateFrames, frameDelay);
            }
        };
        animateFrames();

        // Add screen shake effect - bat is strongest
        let shakeIntensity = 'screenShake';
        if (attackType === 'bat') shakeIntensity = 'screenShakeBat';
        else if (attackType === 'kick') shakeIntensity = 'screenShakeHard';

        document.body.style.animation = 'none';
        document.body.offsetHeight;
        document.body.style.animation = `${shakeIntensity} 0.3s ease-out`;

        // Flash effect on screen - different colors for each attack
        let flashColor = 'rgba(255, 150, 0, 0.4)'; // punch orange
        if (attackType === 'kick') flashColor = 'rgba(255, 0, 0, 0.5)'; // kick red
        if (attackType === 'bat') flashColor = 'rgba(255, 255, 0, 0.6)'; // bat yellow

        const flashDiv = document.createElement('div');
        flashDiv.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: ${flashColor};
            z-index: 99999999; pointer-events: none;
            animation: flashFade 0.15s ease-out forwards;
        `;
        document.body.appendChild(flashDiv);
        setTimeout(() => flashDiv.remove(), 200);

        // Reset after animation
        const totalDuration = frames.length * frameDelay + 100;
        setTimeout(() => {
            sprite.classList.remove('animate-punch', 'animate-kick', 'animate-bat');
            sprite.src = '/images/sprites/FISTA0.png';
        }, totalDuration);
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
        const diffSelect = document.getElementById('difficulty-select');
        const fightArena = document.getElementById('fight-arena');
        const escapeButtons = document.getElementById('escape-buttons');

        // Show difficulty selector, hide fight arena
        if (diffSelect) diffSelect.style.display = 'flex';
        if (fightArena) fightArena.style.display = 'none';
        if (escapeButtons) escapeButtons.style.display = 'none';

        // Reset for new fight
        maskHP = DIFFICULTY[currentDifficulty].hp;
        fightBackClicks = 0;
        difficultySelected = false;
        updateMaskHP();

        // Clear difficulty button selection visual
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));

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
        fightInProgress = false;  // Reset fight state
        maskHP = DIFFICULTY[currentDifficulty].hp; // Reset for next time
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
        // BUT don't hide if fight is in progress (player chose to fight)
        if (insanity >= CONFIG.thresholds.terrified) {
            showEscapePrompt();
        } else if (!fightInProgress) {
            // Only hide if not actively fighting
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
