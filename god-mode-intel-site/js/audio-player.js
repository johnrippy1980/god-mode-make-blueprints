// GOD MODE INTEL Compact Audio Player
// Floating corner widget - doesn't block HUD or content

(function() {
    const STORAGE_KEY = 'godmode_audio_state';
    const AUDIO_SRC = '/audio/title-theme.mp3';

    function getStoredState() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) {}
        return { playing: false, currentTime: 0, volume: 0.5, muted: false };
    }

    function saveState(audio, isPlaying) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                playing: isPlaying,
                currentTime: audio.currentTime,
                volume: audio.volume,
                muted: audio.muted
            }));
        } catch (e) {}
    }

    function createPlayer() {
        const state = getStoredState();

        const audio = new Audio(AUDIO_SRC);
        audio.loop = true;
        audio.volume = state.volume;
        audio.muted = state.muted;
        audio.preload = 'auto';

        // Create compact corner player
        const player = document.createElement('div');
        player.id = 'godmode-audio-player';
        player.innerHTML = `
            <div class="player-compact">
                <img src="/images/sprites/TMSKA0.png" alt="" class="player-mask">
                <button class="player-play-btn" title="Play/Pause">
                    <span class="play-icon">▶</span>
                    <span class="pause-icon" style="display:none;">❚❚</span>
                </button>
                <div class="player-info">
                    <span class="player-title">THEME</span>
                    <input type="range" class="player-volume" min="0" max="100" value="${state.volume * 100}">
                </div>
                <button class="player-mute-btn" title="Mute">
                    <span class="unmuted">🔊</span>
                    <span class="muted" style="display:none;">🔇</span>
                </button>
            </div>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            #godmode-audio-player {
                position: fixed;
                top: 60px;
                right: 120px;
                z-index: 9996;
                pointer-events: auto;
            }

            .player-compact {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(26, 15, 5, 0.95);
                border: 2px solid #3d2817;
                padding: 6px 10px;
                box-shadow: 0 0 15px rgba(139, 0, 0, 0.4);
            }

            .player-mask {
                width: 24px;
                height: 24px;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 5px rgba(139, 0, 0, 0.8));
                animation: maskGlow 2s ease-in-out infinite;
            }

            @keyframes maskGlow {
                0%, 100% { filter: drop-shadow(0 0 5px rgba(139, 0, 0, 0.8)); }
                50% { filter: drop-shadow(0 0 12px rgba(204, 0, 0, 1)); }
            }

            .player-play-btn, .player-mute-btn {
                background: transparent;
                border: 1px solid #660000;
                color: #cc0000;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                padding: 0;
            }

            .player-play-btn:hover, .player-mute-btn:hover {
                background: rgba(102, 0, 0, 0.3);
                border-color: #cc0000;
                box-shadow: 0 0 8px rgba(204, 0, 0, 0.5);
            }

            .player-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .player-title {
                font-family: 'Press Start 2P', monospace;
                font-size: 0.35rem;
                color: #4a9c5a;
                text-shadow: 1px 1px 0 #000;
            }

            .player-volume {
                width: 60px;
                height: 4px;
                -webkit-appearance: none;
                background: #1a0505;
                border: 1px solid #3d2817;
                cursor: pointer;
            }

            .player-volume::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 10px;
                height: 10px;
                background: #cc0000;
                border-radius: 50%;
                cursor: pointer;
            }

            .player-volume::-moz-range-thumb {
                width: 10px;
                height: 10px;
                background: #cc0000;
                border-radius: 50%;
                cursor: pointer;
                border: none;
            }

            /* Playing state - mask pulses faster */
            #godmode-audio-player.playing .player-mask {
                animation: maskGlowFast 0.8s ease-in-out infinite;
            }

            @keyframes maskGlowFast {
                0%, 100% { filter: drop-shadow(0 0 8px rgba(204, 0, 0, 0.9)); transform: scale(1); }
                50% { filter: drop-shadow(0 0 15px rgba(255, 0, 0, 1)); transform: scale(1.1); }
            }

            @media (max-width: 768px) {
                #godmode-audio-player {
                    top: 50px;
                    right: 10px;
                }
                .player-info { display: none; }
                .player-compact { padding: 4px 6px; gap: 5px; }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(player);

        const playBtn = player.querySelector('.player-play-btn');
        const playIcon = player.querySelector('.play-icon');
        const pauseIcon = player.querySelector('.pause-icon');
        const muteBtn = player.querySelector('.player-mute-btn');
        const unmutedIcon = player.querySelector('.unmuted');
        const mutedIcon = player.querySelector('.muted');
        const volumeSlider = player.querySelector('.player-volume');

        let isPlaying = false;

        function updateUI() {
            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'inline';
                player.classList.add('playing');
            } else {
                playIcon.style.display = 'inline';
                pauseIcon.style.display = 'none';
                player.classList.remove('playing');
            }

            if (audio.muted) {
                unmutedIcon.style.display = 'none';
                mutedIcon.style.display = 'inline';
            } else {
                unmutedIcon.style.display = 'inline';
                mutedIcon.style.display = 'none';
            }
        }

        playBtn.addEventListener('click', function() {
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
            } else {
                audio.play().catch(e => console.log('Audio play failed:', e));
                isPlaying = true;
            }
            saveState(audio, isPlaying);
            updateUI();
        });

        muteBtn.addEventListener('click', function() {
            audio.muted = !audio.muted;
            saveState(audio, isPlaying);
            updateUI();
        });

        volumeSlider.addEventListener('input', function() {
            audio.volume = this.value / 100;
            saveState(audio, isPlaying);
        });

        window.addEventListener('beforeunload', function() {
            saveState(audio, isPlaying);
        });

        audio.addEventListener('canplaythrough', function() {
            if (state.playing && state.currentTime > 0) {
                audio.currentTime = state.currentTime;
                audio.play().then(() => {
                    isPlaying = true;
                    updateUI();
                }).catch(e => {
                    console.log('Auto-play blocked');
                });
            }
        }, { once: true });

        updateUI();

        setInterval(() => {
            if (isPlaying) saveState(audio, isPlaying);
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPlayer);
    } else {
        createPlayer();
    }
})();
