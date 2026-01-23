// GOD MODE INTEL - Secrets and Easter Eggs
// NO EMOJIS - Pure Splatterhouse experience
(function() {
    'use strict';

    // Determine base path
    const isSubdir = window.location.pathname.includes('/blood-scrolls');
    const basePath = isSubdir ? '../' : '/';

    // ===== KONAMI CODE =====
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let konamiIndex = 0;

    // ===== TEXT CODES =====
    const codes = {
        godmode: { code: 'GODMODE', activated: false },
        intel: { code: 'INTEL', activated: false },
        gore: { code: 'GORE', activated: false },
        apify: { code: 'APIFY', activated: false },
        make: { code: 'MAKE', activated: false }
    };
    let textBuffer = '';

    // ===== SECRET CLICK COUNTER =====
    let skullClickCount = 0;

    // Check if secrets were previously found
    function isSecretFound(name) {
        return localStorage.getItem('secret_' + name) === 'true';
    }

    // Mark secret as found
    function markSecretFound(name) {
        localStorage.setItem('secret_' + name, 'true');
        // Dispatch event for HUD
        window.dispatchEvent(new CustomEvent('secretFound', { detail: name }));
    }

    // Create secret overlay
    function createSecretOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'secretOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(139, 0, 0, 0.95);
            z-index: 99999;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Press Start 2P', monospace;
            text-align: center;
        `;
        overlay.innerHTML = `
            <div style="animation: secretPulse 0.5s ease-in-out infinite alternate;">
                <img src="${basePath}images/sprites/STFGOD0.png" alt="" style="width: 80px; height: 80px; image-rendering: pixelated; margin-bottom: 1rem;">
                <h1 id="secretTitle" style="font-size: 2rem; color: #00ff66; text-shadow: 0 0 20px #00ff66; margin-bottom: 1rem;">SECRET FOUND!</h1>
                <p id="secretMessage" style="font-size: 0.8rem; margin-bottom: 2rem;">You discovered a hidden secret!</p>
                <div id="secretContent" style="max-width: 600px;"></div>
                <p style="font-size: 0.5rem; margin-top: 2rem; color: #888;">Click anywhere to close</p>
            </div>
        `;
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes secretPulse {
                from { transform: scale(1); }
                to { transform: scale(1.02); }
            }
            @keyframes bloodDrip {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100vh); }
            }
            .blood-drop {
                position: fixed;
                top: 0;
                width: 10px;
                height: 30px;
                background: linear-gradient(to bottom, #cc0000, #8B0000);
                border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                animation: bloodDrip 2s linear forwards;
                z-index: 99998;
            }
            .gore-mode .blood-splatter {
                opacity: 0.8 !important;
            }
            .gore-mode::after {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(ellipse at center, transparent 50%, rgba(139, 0, 0, 0.3) 100%);
                pointer-events: none;
                z-index: 9996;
            }
            .tool-rain {
                position: fixed;
                top: -50px;
                animation: toolFall 3s linear forwards;
                z-index: 99998;
            }
            @keyframes toolFall {
                0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        overlay.addEventListener('click', () => {
            overlay.style.display = 'none';
        });

        return overlay;
    }

    // Show secret message
    function showSecret(title, message, content = '') {
        let overlay = document.getElementById('secretOverlay');
        if (!overlay) {
            overlay = createSecretOverlay();
        }
        document.getElementById('secretTitle').textContent = title;
        document.getElementById('secretMessage').textContent = message;
        document.getElementById('secretContent').innerHTML = content;
        overlay.style.display = 'flex';

        // Play secret sound
        playSecretSound();

        // Create blood rain effect
        createBloodRain();
    }

    // Play secret sound
    function playSecretSound() {
        const sounds = [
            `${basePath}audio/gore/DSXDTH2A.ogg`,
            `${basePath}audio/gore/DSXDTH2F.ogg`,
            `${basePath}audio/gore/LQDRIP1.ogg`
        ];
        const sound = new Audio(sounds[Math.floor(Math.random() * sounds.length)]);
        sound.volume = 0.5;
        sound.play().catch(() => {});
    }

    // Create blood rain effect
    function createBloodRain() {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const drop = document.createElement('div');
                drop.className = 'blood-drop';
                drop.style.left = Math.random() * 100 + 'vw';
                drop.style.animationDuration = (1 + Math.random() * 2) + 's';
                document.body.appendChild(drop);
                setTimeout(() => drop.remove(), 3000);
            }, i * 100);
        }
    }

    // Create sprite rain effect (replaces tool rain)
    function createSpriteRain() {
        const sprites = [
            'TMSKA0.png', 'STFGOD0.png', 'STFKILL0.png', 'STFEVL0.png',
            'HARTA0.png', 'CELLA0.png', 'BLODE0.png'
        ];
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const sprite = document.createElement('img');
                sprite.className = 'tool-rain';
                sprite.src = `${basePath}images/sprites/${sprites[Math.floor(Math.random() * sprites.length)]}`;
                sprite.style.cssText = `
                    left: ${Math.random() * 100}vw;
                    width: 32px;
                    height: 32px;
                    image-rendering: pixelated;
                    animation-duration: ${2 + Math.random() * 2}s;
                `;
                document.body.appendChild(sprite);
                setTimeout(() => sprite.remove(), 4000);
            }, i * 100);
        }
    }

    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        // Konami Code
        if (e.code === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length && !isSecretFound('konami')) {
                markSecretFound('konami');
                showSecret(
                    'GOD MODE ACTIVATED!',
                    'The Konami Code has unlocked unlimited intelligence power!',
                    `<img src="${basePath}images/sprites/STFGOD0.png" style="width: 64px; height: 64px; image-rendering: pixelated; margin: 1rem;">
                    <p style="font-size: 0.6rem; color: #00ff66;">48 TOOLS UNLOCKED - ENTERPRISE SCALE ACHIEVED</p>`
                );
            }
        } else {
            konamiIndex = 0;
        }

        // Text-based codes
        const key = e.key.toUpperCase();
        if (/^[A-Z]$/.test(key)) {
            textBuffer += key;
            if (textBuffer.length > 10) {
                textBuffer = textBuffer.slice(-10);
            }

            // Check GODMODE
            if (textBuffer.endsWith(codes.godmode.code) && !isSecretFound('godmode')) {
                markSecretFound('godmode');
                showSecret(
                    'GOD MODE INTEL ACTIVATED!',
                    '"ONE MCP SERVER TO RULE THEM ALL..."',
                    `<p style="font-size: 0.7rem; color: #cc0000; margin: 1rem;">48 Tools. 7 Standalone. Zero Friction.</p>
                    <p style="font-size: 0.5rem; color: #00ff66;">You have entered the realm of unlimited B2B intelligence.</p>
                    <img src="${basePath}images/sprites/TMSKA0.png" style="width: 48px; height: 48px; image-rendering: pixelated; margin-top: 1rem;">`
                );
            }

            // Check INTEL
            if (textBuffer.endsWith(codes.intel.code) && !isSecretFound('intel')) {
                markSecretFound('intel');
                createSpriteRain();
                showSecret(
                    'INTELLIGENCE UNLOCKED!',
                    'Full tool arsenal revealed...',
                    `<div style="text-align: left; font-size: 0.45rem; line-height: 1.8; columns: 2; column-gap: 2rem;">
                        <p>- 5 Lead Discovery Tools</p>
                        <p>- 3 Lead Enrichment Tools</p>
                        <p>- 3 LinkedIn Intel Tools</p>
                        <p>- 6 Company Research Tools</p>
                        <p>- 4 Review Intelligence Tools</p>
                        <p>- 5 Competitive Intel Tools</p>
                        <p>- 4 Local Business Tools</p>
                        <p>- 3 Social Listening Tools</p>
                        <p>- 5 AI-Powered Actions</p>
                        <p>- 3 Full Pipelines</p>
                        <p style="color: #00ff66;">- 7 STANDALONE (No API Key!)</p>
                    </div>`
                );
            }

            // Check GORE
            if (textBuffer.endsWith(codes.gore.code) && !isSecretFound('gore')) {
                markSecretFound('gore');
                document.body.classList.add('gore-mode');
                showSecret(
                    'GORE MODE ENABLED!',
                    'Maximum carnage activated.',
                    `<p style="color: #ff0000;">Blood effects increased. Your competition won't stand a chance...</p>
                    <img src="${basePath}images/sprites/BLODE0.png" style="width: 48px; height: 48px; image-rendering: pixelated; margin-top: 1rem;">`
                );
            }

            // Check APIFY
            if (textBuffer.endsWith(codes.apify.code) && !isSecretFound('apify')) {
                markSecretFound('apify');
                showSecret(
                    'APIFY ARSENAL REVEALED!',
                    '280+ Actors at your command...',
                    `<p style="font-size: 0.6rem; color: #00ff66;">The full Actor Arsenal powers GOD MODE INTEL.</p>
                    <p style="font-size: 0.5rem; margin-top: 1rem;">Real-time scraping. Unlimited scale. Zero maintenance.</p>
                    <a href="https://actor-arsenal-site.vercel.app" target="_blank" style="color: #4488ff; font-size: 0.5rem; display: block; margin-top: 1rem;">Visit Actor Arsenal</a>`
                );
            }

            // Check MAKE
            if (textBuffer.endsWith(codes.make.code) && !isSecretFound('make')) {
                markSecretFound('make');
                showSecret(
                    'MAKE.COM INTEGRATION!',
                    'Automate EVERYTHING...',
                    `<p style="font-size: 0.6rem; color: #cc0000;">Connect GOD MODE INTEL to your Make.com scenarios.</p>
                    <p style="font-size: 0.5rem; margin-top: 1rem;">HTTP Module - SSE/MCP Module - Webhook Callbacks</p>
                    <pre style="background: #000; padding: 1rem; margin-top: 1rem; font-size: 0.35rem; text-align: left; border: 1px solid #8B0000; overflow-x: auto;">
POST /execute
{
  "tool": "find_prospects",
  "input": {
    "query": "coffee shops",
    "location": "Seattle, WA"
  }
}</pre>`
                );
            }
        }
    });

    // Skull/face click secret
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('hud-face') ||
            target.closest('.hud-face-container') ||
            target.closest('.logo-sprite') ||
            target.classList.contains('logo-sprite')) {
            skullClickCount++;
            if (skullClickCount >= 6 && !isSecretFound('skull')) {
                markSecretFound('skull');
                showSecret(
                    'TERROR MASK BEARER!',
                    'You have shown dedication to GOD MODE INTEL.',
                    `<p style="font-size: 0.5rem; margin: 1rem 0;">The mask recognizes your persistence. True sales warriors know that intelligence is power.</p>
                    <p style="color: #00ff66; font-size: 0.7rem;">Achievement: Persistent Intelligence Agent</p>
                    <img src="${basePath}images/sprites/TMSKB0.png" style="width: 64px; height: 64px; image-rendering: pixelated; margin-top: 1rem;">`
                );
                skullClickCount = 0;
            }
        }
    });

    // Listen for external secret triggers
    window.addEventListener('triggerSecret', (e) => {
        const secretName = e.detail;
        if (!isSecretFound(secretName)) {
            if (secretName === 'skull') {
                markSecretFound('skull');
                showSecret(
                    'TERROR MASK BEARER!',
                    'You have shown dedication to GOD MODE INTEL.',
                    `<p style="font-size: 0.5rem; margin: 1rem 0;">The mask recognizes your persistence.</p>
                    <p style="color: #00ff66; font-size: 0.7rem;">Achievement: Persistent Intelligence Agent</p>`
                );
            }
        }
    });

    // Console easter eggs
    console.log('%c GOD MODE INTEL ', 'background: #8B0000; color: #00ff66; font-size: 24px; font-weight: bold; padding: 10px;');
    console.log('%c "48 Tools. 7 Standalone. One Endpoint." ', 'color: #cc0000; font-style: italic; font-size: 14px;');
    console.log('%c Built by John Rippy - Zappy 2025 Automation Hero ', 'color: #4488ff; font-size: 12px;');
    console.log('%c ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ', 'color: #333;');
    console.log('%c Secrets to discover: 7 ', 'color: #888;');
    console.log('%c Hints: Konami Code, GODMODE, INTEL, GORE, APIFY, MAKE, Click mask 6x ', 'color: #555;');
    console.log('%c ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ', 'color: #333;');

})();
