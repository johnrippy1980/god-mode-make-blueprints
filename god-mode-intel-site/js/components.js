// GOD MODE INTEL - Modular Site Components
// Header, Footer, and Announcement Banner
// NO EMOJIS - Using Splatterhouse sprites
(function() {
    'use strict';

    // Determine base path
    const isSubdir = window.location.pathname.includes('/blood-scrolls');
    const basePath = isSubdir ? '../' : '/';

    // ===== ANNOUNCEMENT BANNER =====
    const announcementHTML = `
        <div class="announcement-banner" id="announcementBanner">
            <div class="announcement-content">
                <img src="${basePath}images/sprites/STFGOD0.png" alt="" class="announcement-sprite">
                <span class="announcement-text">
                    <strong>GOD MODE INTEL IS LIVE!</strong> 48 B2B intelligence tools unleashed.
                    <a href="${basePath}blood-scrolls/launch-announcement">Read the blood-soaked launch post</a>
                </span>
                <button class="announcement-close" onclick="closeAnnouncement()" aria-label="Close announcement">X</button>
            </div>
        </div>
    `;

    // ===== HEADER HTML =====
    const headerHTML = `
        <header id="siteHeader">
            <div class="header-content">
                <a href="${basePath}" class="logo">
                    <img src="${basePath}images/sprites/TMSKA0.png" alt="" class="logo-sprite">
                    <span class="logo-text">GOD MODE INTEL</span>
                </a>
                <nav class="main-nav" id="mainNav">
                    <a href="${basePath}" data-page="home">HOME</a>
                    <a href="${basePath}arsenal" data-page="arsenal">ARSENAL</a>
                    <a href="${basePath}slaughterhouse" data-page="slaughterhouse">SLAUGHTERHOUSE</a>
                    <a href="${basePath}weapons" data-page="weapons">WEAPONS</a>
                    <a href="${basePath}blood-scrolls" data-page="blood-scrolls">BLOOD SCROLLS</a>
                    <a href="${basePath}faq" data-page="faq">FAQ</a>
                    <a href="${basePath}executive" data-page="executive">EXECUTIVE</a>
                    <a href="https://god-mode-intel-mcp.vercel.app" target="_blank" class="nav-cta">LIVE API</a>
                </nav>
                <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    `;

    // ===== FOOTER HTML =====
    const footerHTML = `
        <footer id="siteFooter">
            <div class="footer-container">
                <div class="footer-grid">
                    <!-- Brand Column -->
                    <div class="footer-brand">
                        <div class="footer-logo">
                            <img src="${basePath}images/sprites/TMSKA0.png" alt="" class="footer-sprite">
                            <span class="logo-text">GOD MODE INTEL</span>
                        </div>
                        <p class="footer-tagline">48 Tools. 7 Standalone. Zero Mercy.</p>
                        <p class="footer-description">Enterprise B2B intelligence at scale. The Terror Mask of sales automation.</p>
                    </div>

                    <!-- Navigation Column -->
                    <div class="footer-nav-col">
                        <h4>INTELLIGENCE</h4>
                        <ul>
                            <li><a href="${basePath}arsenal">Tool Arsenal</a></li>
                            <li><a href="${basePath}slaughterhouse">Enemies Crushed</a></li>
                            <li><a href="${basePath}weapons">Weapons System</a></li>
                            <li><a href="${basePath}blood-scrolls">Blood Scrolls</a></li>
                            <li><a href="${basePath}faq">FAQ</a></li>
                        </ul>
                    </div>

                    <!-- Resources Column -->
                    <div class="footer-nav-col">
                        <h4>RESOURCES</h4>
                        <ul>
                            <li><a href="${basePath}arsenal">Full Documentation</a></li>
                            <li><a href="${basePath}weapons">All 48 Weapons</a></li>
                            <li><a href="https://apify.com/alizarin_refrigerator-owner/god-mode-intel-mcp" target="_blank">Apify Actor</a></li>
                            <li><a href="${basePath}executive">Make.com Challenge</a></li>
                            <li><a href="${basePath}llms.txt">LLMs.txt</a></li>
                        </ul>
                    </div>

                    <!-- Other Sites Column -->
                    <div class="footer-nav-col">
                        <h4>RIPPY'S ARSENAL</h4>
                        <ul>
                            <li><a href="https://actor-arsenal-site.vercel.app" target="_blank">Actor Arsenal (DOOM)</a></li>
                            <li><a href="https://zapier-quake-site.vercel.app" target="_blank">Zapier Quake</a></li>
                            <li><a href="https://duke-semrush-site.vercel.app" target="_blank">Duke SEMrush</a></li>
                            <li><a href="https://splatterhouse-3d-site.vercel.app" target="_blank">Splatterhouse 3D</a></li>
                            <li><a href="https://johnrippy.link" target="_blank">John Rippy</a></li>
                        </ul>
                    </div>

                    <!-- Connect Column -->
                    <div class="footer-nav-col">
                        <h4>CONNECT</h4>
                        <ul>
                            <li><a href="https://linkedin.com/in/johnrippy" target="_blank">LinkedIn</a></li>
                            <li><a href="https://github.com/jrippy" target="_blank">GitHub</a></li>
                            <li><a href="https://apify.com/alizarin_refrigerator-owner" target="_blank">Apify Profile</a></li>
                            <li><a href="mailto:john@johnrippy.link">Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div class="footer-bottom">
                    <div class="footer-credits">
                        <p>Built by <a href="https://johnrippy.link" target="_blank">John Rippy</a> - <span class="zappy-badge">ZAPPY 2025 AUTOMATION HERO OF THE YEAR</span></p>
                        <p class="footer-copy">2026 GOD MODE INTEL. All competitors shall be annihilated.</p>
                    </div>
                    <div class="footer-badges">
                        <a href="https://community.make.com/t/community-challenge-managing-and-scaling-workflows-with-make-and-mcp/101210" target="_blank" class="footer-badge make-badge">Make.com MCP Challenge 2026</a>
                    </div>
                </div>
            </div>
        </footer>
    `;

    // ===== COMPONENT STYLES =====
    const componentStyles = `
        /* ===== FONT IMPORTS ===== */
        @import url('https://fonts.googleapis.com/css2?family=Nosifer&family=Butcherman&family=Eater&family=Metal+Mania&family=Press+Start+2P&display=swap');

        /* ===== ANNOUNCEMENT BANNER ===== */
        .announcement-banner {
            background: linear-gradient(90deg, #8B0000 0%, #cc0000 50%, #8B0000 100%);
            padding: 0.75rem 1rem;
            text-align: center;
            position: relative;
            z-index: 1001;
            animation: bannerPulse 3s ease-in-out infinite;
        }

        @keyframes bannerPulse {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .announcement-banner.hidden {
            display: none;
        }

        .announcement-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .announcement-sprite {
            width: 24px;
            height: 24px;
            image-rendering: pixelated;
            animation: spriteBounce 1s ease-in-out infinite;
        }

        @keyframes spriteBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }

        .announcement-text {
            font-family: 'Press Start 2P', cursive;
            font-size: 0.5rem;
            color: white;
        }

        .announcement-text a {
            color: #00ff66;
            text-decoration: none;
        }

        .announcement-text a:hover {
            text-decoration: underline;
        }

        .announcement-close {
            background: none;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.6rem;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            opacity: 0.7;
            transition: opacity 0.3s;
        }

        .announcement-close:hover {
            opacity: 1;
            border-color: white;
        }

        /* ===== HEADER ===== */
        #siteHeader {
            background: linear-gradient(180deg, rgba(139, 0, 0, 0.4) 0%, rgba(10, 5, 5, 0.95) 100%);
            padding: 1rem 2rem;
            border-bottom: 2px solid #8B0000;
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
        }

        .logo-sprite {
            width: 40px;
            height: 40px;
            image-rendering: pixelated;
            animation: spritePulse 2s ease-in-out infinite;
        }

        @keyframes spritePulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(204, 0, 0, 0.5)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(204, 0, 0, 0.8)); }
        }

        .logo-text {
            font-family: 'Nosifer', cursive;
            font-size: 1.4rem;
            color: #cc0000;
            text-shadow: 2px 2px 0 #000, 0 0 10px rgba(204, 0, 0, 0.5);
            letter-spacing: 2px;
        }

        .main-nav {
            display: flex;
            gap: 1.5rem;
            align-items: center;
        }

        .main-nav a {
            font-family: 'Press Start 2P', cursive;
            font-size: 0.5rem;
            color: #e8e0d0;
            text-decoration: none;
            transition: all 0.3s;
            padding: 0.5rem 0.75rem;
            border: 1px solid transparent;
        }

        .main-nav a:hover,
        .main-nav a.active {
            color: #00ff66;
            border-color: #00ff66;
            text-shadow: 0 0 10px rgba(0, 255, 102, 0.5);
        }

        .main-nav .nav-cta {
            background: linear-gradient(180deg, #3a1010 0%, #1a0505 100%);
            border: 2px solid #cc0000;
            color: #cc0000;
        }

        .main-nav .nav-cta:hover {
            background: linear-gradient(180deg, #4a1515 0%, #2a0a0a 100%);
            color: #ff0000;
            box-shadow: 0 0 15px rgba(204, 0, 0, 0.5);
        }

        .mobile-menu-btn {
            display: none;
            flex-direction: column;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
        }

        .mobile-menu-btn span {
            display: block;
            width: 25px;
            height: 3px;
            background: #cc0000;
            transition: all 0.3s;
        }

        /* ===== FOOTER ===== */
        #siteFooter {
            background: linear-gradient(180deg, #0a0505 0%, #1a0a0a 50%, #0a0505 100%);
            border-top: 2px solid #8B0000;
            padding: 4rem 2rem 2rem;
            margin-top: 4rem;
        }

        .footer-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .footer-grid {
            display: grid;
            grid-template-columns: 2fr repeat(4, 1fr);
            gap: 3rem;
            margin-bottom: 3rem;
        }

        .footer-brand .footer-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .footer-sprite {
            width: 32px;
            height: 32px;
            image-rendering: pixelated;
        }

        .footer-brand .logo-text {
            font-family: 'Nosifer', cursive;
            font-size: 1.1rem;
            color: #cc0000;
            letter-spacing: 2px;
        }

        .footer-tagline {
            font-family: 'Press Start 2P', cursive;
            font-size: 0.5rem;
            color: #00ff66;
            margin-bottom: 0.75rem;
        }

        .footer-description {
            font-size: 0.9rem;
            color: #888;
            line-height: 1.6;
        }

        .footer-nav-col h4 {
            font-family: 'Press Start 2P', cursive;
            font-size: 0.5rem;
            color: #cc0000;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #331111;
        }

        .footer-nav-col ul {
            list-style: none;
        }

        .footer-nav-col li {
            margin-bottom: 0.5rem;
        }

        .footer-nav-col a {
            color: #888;
            text-decoration: none;
            font-size: 0.85rem;
            transition: color 0.3s;
        }

        .footer-nav-col a:hover {
            color: #00ff66;
        }

        .footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 2rem;
            border-top: 1px solid #331111;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .footer-credits {
            text-align: left;
        }

        .footer-credits p {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.25rem;
        }

        .footer-credits a {
            color: #cc0000;
            text-decoration: none;
        }

        .footer-credits a:hover {
            color: #00ff66;
        }

        .zappy-badge {
            font-family: 'Press Start 2P', cursive;
            font-size: 0.4rem;
            color: #ffd700;
            background: rgba(255, 215, 0, 0.1);
            padding: 0.25rem 0.5rem;
            border: 1px solid #ffd700;
        }

        .footer-copy {
            font-size: 0.75rem;
            color: #444;
        }

        .footer-badges {
            display: flex;
            gap: 1rem;
        }

        .footer-badge {
            font-family: 'Press Start 2P', cursive;
            font-size: 0.4rem;
            padding: 0.5rem 1rem;
            text-decoration: none;
            transition: all 0.3s;
        }

        .make-badge {
            background: rgba(99, 102, 241, 0.2);
            border: 1px solid #6366f1;
            color: #6366f1;
        }

        .make-badge:hover {
            background: rgba(99, 102, 241, 0.3);
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 1024px) {
            .footer-grid {
                grid-template-columns: repeat(3, 1fr);
            }
            .footer-brand {
                grid-column: 1 / -1;
            }
        }

        @media (max-width: 768px) {
            .main-nav {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: #0a0505;
                flex-direction: column;
                padding: 1rem;
                border-bottom: 2px solid #8B0000;
            }

            .main-nav.active {
                display: flex;
            }

            .mobile-menu-btn {
                display: flex;
            }

            .footer-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .footer-bottom {
                flex-direction: column;
                text-align: center;
            }

            .footer-credits {
                text-align: center;
            }

            .announcement-text {
                font-size: 0.4rem;
            }
        }

        @media (max-width: 480px) {
            .footer-grid {
                grid-template-columns: 1fr;
            }

            .header-content {
                padding: 0 1rem;
            }

            .logo-text {
                font-size: 1rem;
            }
        }
    `;

    // ===== INJECT COMPONENTS =====
    function injectComponents() {
        // Add styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = componentStyles;
        document.head.appendChild(styleSheet);

        // Check if announcement was closed
        const announcementClosed = localStorage.getItem('godmode_announcement_closed');

        // Inject announcement banner (if not closed)
        if (!announcementClosed) {
            document.body.insertAdjacentHTML('afterbegin', announcementHTML);
        }

        // Find header placeholder and inject
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.outerHTML = headerHTML;
        } else {
            // Insert at beginning of body (after announcement if present)
            const announcement = document.getElementById('announcementBanner');
            if (announcement) {
                announcement.insertAdjacentHTML('afterend', headerHTML);
            } else {
                document.body.insertAdjacentHTML('afterbegin', headerHTML);
            }
        }

        // Find footer placeholder and inject
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = footerHTML;
        } else {
            // Append to body
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }

        // Set active nav link
        setActiveNavLink();

        // Setup mobile menu
        setupMobileMenu();
    }

    // ===== SET ACTIVE NAV LINK =====
    function setActiveNavLink() {
        const path = window.location.pathname;
        const navLinks = document.querySelectorAll('.main-nav a[data-page]');

        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (path === '/' && page === 'home') {
                link.classList.add('active');
            } else if (path.includes(page) && page !== 'home') {
                link.classList.add('active');
            }
        });
    }

    // ===== MOBILE MENU =====
    function setupMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const nav = document.getElementById('mainNav');

        if (btn && nav) {
            btn.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
    }

    // ===== CLOSE ANNOUNCEMENT =====
    window.closeAnnouncement = function() {
        const banner = document.getElementById('announcementBanner');
        if (banner) {
            banner.classList.add('hidden');
            localStorage.setItem('godmode_announcement_closed', 'true');
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectComponents);
    } else {
        injectComponents();
    }
})();
