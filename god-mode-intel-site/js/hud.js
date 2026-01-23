// GOD MODE INTEL - Splatterhouse HUD System
// Classic game-style HUD with secrets tracking
(function() {
    'use strict';

    // Determine base path
    const isSubdir = window.location.pathname.includes('/blood-scrolls');
    const basePath = isSubdir ? '../' : '/';

    // Total secrets in the game
    const TOTAL_SECRETS = 7;

    // HUD HTML template with Splatterhouse sprites
    const hudHTML = `
    <div class="godmode-hud" id="godmodeHud">
        <div class="hud-section hud-tools">
            <div class="hud-stat">
                <div class="hud-value hud-tools-value" id="hudTools">48</div>
                <div class="hud-label">TOOLS</div>
            </div>
        </div>
        <div class="hud-section hud-standalone">
            <div class="hud-stat">
                <div class="hud-value hud-standalone-value" id="hudStandalone">7</div>
                <div class="hud-label">STANDALONE</div>
            </div>
        </div>
        <div class="hud-face-container" id="hudFaceContainer">
            <img src="${basePath}images/sprites/STFGOD0.png" class="hud-face" id="hudFace" alt="Terror Mask">
        </div>
        <div class="hud-section hud-kills">
            <div class="hud-stat">
                <div class="hud-value hud-kills-value" id="hudKills">0</div>
                <div class="hud-label">KILLS</div>
            </div>
        </div>
        <div class="hud-section hud-secrets">
            <div class="hud-stat">
                <div class="hud-value hud-secrets-value" id="hudSecrets">0/7</div>
                <div class="hud-label">SECRETS</div>
            </div>
        </div>
    </div>
    `;

    // HUD CSS
    const hudCSS = `
    <style id="godmode-hud-styles">
        /* ===== SPLATTERHOUSE HUD (Blood-Red Metal Style) ===== */
        .godmode-hud {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 80px;
            background:
                repeating-linear-gradient(
                    90deg,
                    #2a1010 0px, #2a1010 2px,
                    #3a1515 2px, #3a1515 4px,
                    #1a0808 4px, #1a0808 6px,
                    #251010 6px, #251010 8px
                ),
                linear-gradient(180deg, #3a1515 0%, #1a0808 50%, #0a0505 100%);
            border-top: 4px solid #5a2020;
            border-bottom: 4px solid #0a0505;
            box-shadow:
                inset 0 2px 0 #6a2525,
                inset 0 -2px 0 #0a0505,
                0 -4px 8px rgba(139, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1001;
            font-family: 'Press Start 2P', cursive;
            padding: 0;
            gap: 0;
        }

        .hud-section {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background:
                linear-gradient(180deg, #2a1010 0%, #150808 100%);
            border-left: 3px solid #4a1818;
            border-right: 3px solid #0a0505;
            border-top: 2px solid #5a2020;
            border-bottom: 2px solid #050202;
            padding: 0 1.5rem;
            position: relative;
        }

        .hud-section::before {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            right: 4px;
            bottom: 4px;
            background: linear-gradient(180deg, #1a0808 0%, #0a0505 100%);
            border: 2px solid #050202;
            border-radius: 2px;
            z-index: -1;
        }

        .hud-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 0 0.5rem;
        }

        .hud-value {
            font-size: 1.8rem;
            text-shadow: 2px 2px 0 #000, -1px -1px 0 #000;
            letter-spacing: 2px;
        }

        .hud-label {
            font-size: 0.5rem;
            color: #666;
            text-shadow: 1px 1px 0 #000;
            text-transform: uppercase;
        }

        .hud-face-container {
            width: 70px;
            height: 70px;
            background: linear-gradient(180deg, #2a1010 0%, #0a0505 100%);
            border: 3px solid #4a1818;
            border-bottom-color: #050202;
            border-right-color: #050202;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .hud-face-container:hover {
            border-color: #cc0000;
            box-shadow: 0 0 15px rgba(204, 0, 0, 0.5);
        }

        .hud-face {
            width: 60px;
            height: 60px;
            image-rendering: pixelated;
            transition: transform 0.1s;
        }

        .hud-face-container:hover .hud-face {
            transform: scale(1.1);
        }

        /* HUD Colors */
        .hud-tools-value { color: #cc0000; }
        .hud-standalone-value { color: #00ff66; }
        .hud-kills-value { color: #ffcc00; }
        .hud-secrets-value { color: #ff6600; }

        /* Secrets found animation */
        .hud-secrets-value.found {
            animation: secretFlash 0.5s ease-in-out;
        }

        @keyframes secretFlash {
            0%, 100% { color: #ff6600; transform: scale(1); }
            50% { color: #00ff66; transform: scale(1.2); }
        }

        /* Face states based on secrets */
        .hud-face.state-hurt {
            filter: hue-rotate(180deg);
        }

        .hud-face.state-god {
            filter: drop-shadow(0 0 10px #00ff66);
            animation: godPulse 1s ease-in-out infinite;
        }

        @keyframes godPulse {
            0%, 100% { filter: drop-shadow(0 0 10px #00ff66); }
            50% { filter: drop-shadow(0 0 20px #00ff66); }
        }

        /* Kill counter increment animation */
        .hud-kills-value.increment {
            animation: killIncrement 0.2s ease-out;
        }

        @keyframes killIncrement {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); color: #ff0000; }
            100% { transform: scale(1); }
        }

        /* Padding for HUD */
        body { padding-bottom: 90px; }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .godmode-hud {
                height: 60px;
            }
            .hud-value {
                font-size: 1rem;
            }
            .hud-label {
                font-size: 0.35rem;
            }
            .hud-section {
                padding: 0 0.5rem;
            }
            .hud-face-container {
                width: 50px;
                height: 50px;
                margin: 0 0.5rem;
            }
            .hud-face {
                width: 45px;
                height: 45px;
            }
        }

        @media (max-width: 480px) {
            .hud-tools, .hud-standalone {
                display: none;
            }
        }
    </style>
    `;

    // Face sprites for different states
    const faceSprites = {
        normal: `${basePath}images/sprites/STFST00.png`,
        hurt1: `${basePath}images/sprites/STFOUCH0.png`,
        hurt2: `${basePath}images/sprites/STFOUCH1.png`,
        god: `${basePath}images/sprites/STFGOD0.png`,
        evil: `${basePath}images/sprites/STFEVL0.png`,
        kill: `${basePath}images/sprites/STFKILL0.png`,
        dead: `${basePath}images/sprites/STFDEAD0.png`
    };

    // Inject HUD
    function injectHUD() {
        // Add CSS
        if (!document.getElementById('godmode-hud-styles')) {
            document.head.insertAdjacentHTML('beforeend', hudCSS);
        }

        // Add HUD
        if (!document.querySelector('.godmode-hud')) {
            document.body.insertAdjacentHTML('beforeend', hudHTML);
        }

        // Initialize
        initHUD();
    }

    // Initialize HUD interactivity
    function initHUD() {
        // Load saved state
        let kills = parseInt(localStorage.getItem('godmode_kills') || '0');
        let secretsFound = getFoundSecretsCount();

        // Update displays
        updateKills(kills);
        updateSecrets(secretsFound);
        updateFace(secretsFound);

        // Click anywhere to increment kills
        document.addEventListener('click', function(e) {
            // Don't count navigation or button clicks
            if (e.target.closest('a') || e.target.closest('button') || e.target.closest('nav') || e.target.closest('.faq-item')) return;

            kills += Math.floor(Math.random() * 10) + 1;
            localStorage.setItem('godmode_kills', kills.toString());
            updateKills(kills);

            // Change face on kill
            changeFaceTemporarily('kill', 300);
        });

        // Listen for secret discovery
        window.addEventListener('secretFound', function(e) {
            secretsFound = getFoundSecretsCount();
            updateSecrets(secretsFound);
            updateFace(secretsFound);

            // Flash the secrets display
            const secretsEl = document.getElementById('hudSecrets');
            if (secretsEl) {
                secretsEl.classList.add('found');
                setTimeout(() => secretsEl.classList.remove('found'), 500);
            }
        });

        // Face click easter egg
        const faceContainer = document.getElementById('hudFaceContainer');
        if (faceContainer) {
            let faceClicks = 0;
            faceContainer.addEventListener('click', function() {
                faceClicks++;
                playGoreSound();

                if (faceClicks >= 6) {
                    // Trigger skull secret
                    if (!localStorage.getItem('secret_skull')) {
                        window.dispatchEvent(new CustomEvent('triggerSecret', { detail: 'skull' }));
                    }
                    faceClicks = 0;
                }

                changeFaceTemporarily('evil', 500);
            });
        }
    }

    // Update kills display
    function updateKills(kills) {
        const killsEl = document.getElementById('hudKills');
        if (killsEl) {
            killsEl.textContent = kills.toLocaleString();
            killsEl.classList.add('increment');
            setTimeout(() => killsEl.classList.remove('increment'), 200);
        }
    }

    // Update secrets display
    function updateSecrets(found) {
        const secretsEl = document.getElementById('hudSecrets');
        if (secretsEl) {
            secretsEl.textContent = `${found}/${TOTAL_SECRETS}`;
        }
    }

    // Update face based on secrets found
    function updateFace(secretsFound) {
        const face = document.getElementById('hudFace');
        if (!face) return;

        face.classList.remove('state-hurt', 'state-god');

        if (secretsFound >= TOTAL_SECRETS) {
            face.src = faceSprites.god;
            face.classList.add('state-god');
        } else if (secretsFound >= 5) {
            face.src = faceSprites.evil;
        } else if (secretsFound >= 3) {
            face.src = faceSprites.kill;
        } else {
            face.src = faceSprites.normal;
        }
    }

    // Temporarily change face
    function changeFaceTemporarily(state, duration) {
        const face = document.getElementById('hudFace');
        if (!face) return;

        const currentSrc = face.src;
        face.src = faceSprites[state] || faceSprites.normal;

        setTimeout(() => {
            // Restore based on secrets count
            updateFace(getFoundSecretsCount());
        }, duration);
    }

    // Get count of found secrets
    function getFoundSecretsCount() {
        const secrets = ['konami', 'godmode', 'intel', 'gore', 'apify', 'make', 'skull'];
        let count = 0;
        secrets.forEach(s => {
            if (localStorage.getItem('secret_' + s) === 'true') {
                count++;
            }
        });
        return count;
    }

    // Play gore sound
    function playGoreSound() {
        const sounds = [
            `${basePath}audio/gore/DSXDTH2A.ogg`,
            `${basePath}audio/gore/DSXDTH2F.ogg`,
            `${basePath}audio/gore/LQDRIP1.ogg`,
            `${basePath}audio/gore/LQDRIP2.ogg`,
            `${basePath}audio/gore/LQDRIP3.ogg`
        ];
        const sound = new Audio(sounds[Math.floor(Math.random() * sounds.length)]);
        sound.volume = 0.3;
        sound.play().catch(() => {});
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHUD);
    } else {
        injectHUD();
    }

    // Export for other scripts
    window.GodModeHUD = {
        updateKills,
        updateSecrets,
        getFoundSecretsCount,
        TOTAL_SECRETS
    };
})();
