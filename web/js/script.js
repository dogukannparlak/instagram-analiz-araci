class InstagramAnalyzer {
    constructor() {
        this.followers = [];
        this.following = [];
        this.notFollowingBack = [];
        this.mutualFollowers = [];
        this.connections = {
            blocked: [],
            close_friends: [],
            removed_suggestions: [],
            pending_requests: [],
            recent_requests: [],
            recently_unfollowed: [],
            hide_story: [],
        };
        this.crossAnalysis = {
            blockedInFollowers: [],
            blockedInFollowing: [],
            closeFriendsNotFollowing: [],
            stillFollowingAfterUnfollow: [],
        };
        this.connectionLabels = {
            followers: 'Takipçiler',
            following: 'Takip Edilenler',
            blocked: 'Engellenenler',
            close_friends: 'Yakın Arkadaşlar',
            removed_suggestions: 'Kaldırılan Öneriler',
            pending_requests: 'Bekleyen İstekler',
            recent_requests: 'Yakın İstekler',
            recently_unfollowed: 'Takibi Bıraktıkların',
            hide_story: 'Hikayeyi Gizle',
        };
        this.tabLists = {
            followers: 'followersList',
            following: 'followingList',
            notFollowing: 'notFollowingList',
            mutual: 'mutualList',
            blocked: 'blockedList',
            close_friends: 'closeFriendsList',
            pending_requests: 'pendingRequestsList',
            blockedInFollowers: 'blockedInFollowersList',
            blockedInFollowing: 'blockedInFollowingList',
            closeFriendsNotFollowing: 'closeFriendsNotFollowingList',
            stillFollowingAfterUnfollow: 'stillFollowingAfterUnfollowList',
            removed_suggestions: 'removedSuggestionsList',
        };
        this.featureLabels = {
            followers: 'Takipçiler',
            following: 'Takip Edilenler',
            notFollowing: 'Geri Takip Etmeyenler',
            mutual: 'Karşılıklı Takip',
            blocked: 'Engellenenler',
            close_friends: 'Yakın Arkadaşlar',
            pending_requests: 'Bekleyen İstekler',
            removed_suggestions: 'Kaldırılan Öneriler',
            blockedInFollowers: 'Engellenen Takipçi',
            blockedInFollowing: 'Engellenen Takip',
            closeFriendsNotFollowing: 'Yakın Arkadaş (Geri Yok)',
            stillFollowingAfterUnfollow: 'Bıraktığın Halde Takip',
        };
        this.hiddenFeatures = this.loadHiddenFeatures();
        this.statsPage = 0;
        this.tabsScrollOffset = 0;
        this.followerSet = new Set();
        this.followingSet = new Set();
        this.resizeTimer = null;
        this.featuresPanelIgnoreOutsideClick = false;
        this.dataAccuracyNoticeTabs = new Set(['followers', 'following', 'notFollowing']);

        this.initializeTheme();
        this.mountFeaturesPanelOverlay();
        this.initializeEventListeners();
        this.renderFeaturesPanel();
    }

    mountFeaturesPanelOverlay() {
        const overlay = document.getElementById('featuresPanelOverlay');
        if (overlay && overlay.parentElement !== document.documentElement) {
            document.documentElement.appendChild(overlay);
        }
    }

    loadHiddenFeatures() {
        try {
            const saved = JSON.parse(localStorage.getItem('instagramHiddenFeatures') || '[]');
            return new Set(Array.isArray(saved) ? saved : []);
        } catch {
            return new Set();
        }
    }

    saveHiddenFeatures() {
        localStorage.setItem(
            'instagramHiddenFeatures',
            JSON.stringify([...this.hiddenFeatures])
        );
    }

    isFeatureEnabled(featureId) {
        return !this.hiddenFeatures.has(featureId);
    }

    getStatsPageSize() {
        if (window.innerWidth >= 768) {
            return 4;
        }
        return 2;
    }

    getVisibleStatCards() {
        return [...document.querySelectorAll('#statsTrack .stat-card')].filter((card) => (
            card.dataset.available === 'true' && this.isFeatureEnabled(card.dataset.feature)
        ));
    }

    getVisibleTabButtons() {
        return [...document.querySelectorAll('#tabsTrack .tab-btn')].filter((button) => (
            button.dataset.available === 'true' && this.isFeatureEnabled(button.dataset.feature)
        ));
    }

    getActiveTabIndex(visibleTabs = this.getVisibleTabButtons()) {
        const activeTab = document.querySelector('#tabsTrack .tab-btn.active');
        const activeIndex = visibleTabs.indexOf(activeTab);
        return activeIndex === -1 ? 0 : activeIndex;
    }

    ensureActiveTabInView(viewport, track) {
        const activeTab = document.querySelector('#tabsTrack .tab-btn.active:not(.is-hidden)');
        if (!activeTab || !viewport || !track) {
            return;
        }

        const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
        const padding = 12;
        const tabLeft = activeTab.offsetLeft;
        const tabRight = tabLeft + activeTab.offsetWidth;

        if (tabLeft < this.tabsScrollOffset + padding) {
            this.tabsScrollOffset = Math.max(0, tabLeft - padding);
        } else if (tabRight > this.tabsScrollOffset + viewport.clientWidth - padding) {
            this.tabsScrollOffset = Math.min(maxOffset, tabRight - viewport.clientWidth + padding);
        }

        this.tabsScrollOffset = Math.min(Math.max(this.tabsScrollOffset, 0), maxOffset);
    }

    switchTabByOffset(delta) {
        const visibleTabs = this.getVisibleTabButtons();
        if (visibleTabs.length === 0) {
            return;
        }

        const nextIndex = this.getActiveTabIndex(visibleTabs) + delta;
        if (nextIndex < 0 || nextIndex >= visibleTabs.length) {
            return;
        }

        this.switchTab(visibleTabs[nextIndex].dataset.tab);
    }

    renderFeaturesPanel() {
        const panel = document.getElementById('featuresPanel');
        if (!panel) {
            return;
        }

        const items = Object.entries(this.featureLabels)
            .filter(([id]) => {
                const stat = document.querySelector(`.stat-card[data-feature="${id}"]`);
                const tab = document.querySelector(`.tab-btn[data-feature="${id}"]`);
                return (stat && stat.dataset.available === 'true')
                    || (tab && tab.dataset.available === 'true');
            })
            .map(([id, label]) => {
                const checked = this.isFeatureEnabled(id);

                return `
                    <label>
                        <input type="checkbox" data-feature-toggle="${id}" ${checked ? 'checked' : ''}>
                        <span>${label}</span>
                    </label>
                `;
            }).join('');

        panel.innerHTML = `
            <div class="features-panel-header">
                <h4>Gösterilecek Listeler</h4>
                <p class="features-panel-note">Verisi olmayan listeler burada görünmez.</p>
            </div>
            <div class="features-panel-list">
                ${items || '<p class="features-panel-empty">Gösterilecek liste bulunamadı.</p>'}
            </div>
        `;

        panel.querySelectorAll('[data-feature-toggle]').forEach((input) => {
            input.addEventListener('change', (event) => {
                const featureId = event.target.dataset.featureToggle;
                if (event.target.checked) {
                    this.hiddenFeatures.delete(featureId);
                } else {
                    this.hiddenFeatures.add(featureId);
                }
                this.saveHiddenFeatures();
                this.refreshCarousels();
                this.ensureActiveTabVisible();
            });
        });
    }

    isFeaturesPanelOpen() {
        const overlay = document.getElementById('featuresPanelOverlay');
        return overlay ? !overlay.hidden : false;
    }

    setFeaturesPanelOpen(isOpen) {
        const overlay = document.getElementById('featuresPanelOverlay');
        const button = document.getElementById('toggleFeaturesBtn');
        if (!overlay) {
            return;
        }

        overlay.hidden = !isOpen;
        overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (button) {
            button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        document.body.classList.toggle('features-panel-open', isOpen);
    }

    toggleFeaturesPanel() {
        const overlay = document.getElementById('featuresPanelOverlay');
        if (!overlay) {
            return;
        }

        if (this.isFeaturesPanelOpen()) {
            this.closeFeaturesPanel();
            return;
        }

        this.featuresPanelIgnoreOutsideClick = true;
        this.renderFeaturesPanel();
        this.setFeaturesPanelOpen(true);
        requestAnimationFrame(() => {
            this.featuresPanelIgnoreOutsideClick = false;
        });
    }

    closeFeaturesPanel() {
        if (!this.isFeaturesPanelOpen()) {
            return;
        }
        this.setFeaturesPanelOpen(false);
    }

    refreshStatsCarousel() {
        const track = document.getElementById('statsTrack');
        const viewport = document.querySelector('.stats-carousel-viewport');
        const leftBtn = document.querySelector('.stats-arrow-left');
        const rightBtn = document.querySelector('.stats-arrow-right');
        const dotsContainer = document.getElementById('statsDots');

        if (!track || !viewport) {
            return;
        }

        document.querySelectorAll('#statsTrack .stat-card').forEach((card) => {
            const visible = card.dataset.available === 'true' && this.isFeatureEnabled(card.dataset.feature);
            card.classList.toggle('is-hidden', !visible);
            card.classList.toggle('feature-hidden', !this.isFeatureEnabled(card.dataset.feature));
        });

        const visibleCards = this.getVisibleStatCards();
        const perPage = this.getStatsPageSize();
        const viewportWidth = viewport.clientWidth;

        if (viewportWidth <= 0 || visibleCards.length === 0) {
            return;
        }

        const gap = parseFloat(getComputedStyle(track).gap) || 24;
        const cardWidth = Math.floor((viewportWidth - gap * (perPage - 1)) / perPage);
        const totalPages = Math.max(1, Math.ceil(visibleCards.length / perPage));
        const hasOverflow = visibleCards.length > perPage;

        if (this.statsPage >= totalPages) {
            this.statsPage = totalPages - 1;
        }
        if (this.statsPage < 0) {
            this.statsPage = 0;
        }

        visibleCards.forEach((card) => {
            card.style.width = `${cardWidth}px`;
            card.style.flex = '0 0 auto';
        });

        track.classList.toggle('is-scrollable', hasOverflow);
        viewport.classList.toggle('has-overflow', hasOverflow);

        if (!hasOverflow) {
            track.style.transform = 'translateX(0)';
            this.statsPage = 0;
        } else {
            track.style.transform = `translateX(-${this.statsPage * viewportWidth}px)`;
        }

        if (leftBtn) {
            leftBtn.disabled = !hasOverflow || this.statsPage <= 0;
        }
        if (rightBtn) {
            rightBtn.disabled = !hasOverflow || this.statsPage >= totalPages - 1;
        }

        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            if (hasOverflow && totalPages > 1) {
                for (let page = 0; page < totalPages; page += 1) {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = `carousel-dot${page === this.statsPage ? ' active' : ''}`;
                    dot.setAttribute('aria-label', `İstatistik sayfası ${page + 1}`);
                    dot.addEventListener('click', () => {
                        this.statsPage = page;
                        this.refreshStatsCarousel();
                    });
                    dotsContainer.appendChild(dot);
                }
            }
        }
    }

    refreshTabsCarousel() {
        const track = document.getElementById('tabsTrack');
        const viewport = document.querySelector('.tabs-viewport');
        const leftBtn = document.querySelector('.tabs-arrow-left');
        const rightBtn = document.querySelector('.tabs-arrow-right');
        const dotsContainer = document.getElementById('tabsDots');

        if (!track || !viewport) {
            return;
        }

        document.querySelectorAll('#tabsTrack .tab-btn').forEach((button) => {
            const visible = button.dataset.available === 'true' && this.isFeatureEnabled(button.dataset.feature);
            button.classList.toggle('is-hidden', !visible);
            button.classList.toggle('feature-hidden', !this.isFeatureEnabled(button.dataset.feature));
        });

        const visibleTabs = this.getVisibleTabButtons();
        const viewportWidth = viewport.clientWidth;
        const activeIndex = this.getActiveTabIndex(visibleTabs);

        if (viewportWidth <= 0 || visibleTabs.length === 0) {
            return;
        }

        const contentWidth = track.scrollWidth;
        const hasOverflow = contentWidth > viewportWidth + 1;
        const maxOffset = Math.max(0, contentWidth - viewportWidth);

        track.classList.toggle('is-scrollable', hasOverflow);
        viewport.classList.toggle('has-overflow', hasOverflow);

        this.ensureActiveTabInView(viewport, track);

        if (!hasOverflow) {
            track.style.transform = 'translateX(0)';
            this.tabsScrollOffset = 0;
        } else {
            track.style.transform = `translateX(-${this.tabsScrollOffset}px)`;
        }

        if (leftBtn) {
            leftBtn.disabled = activeIndex <= 0;
        }
        if (rightBtn) {
            rightBtn.disabled = activeIndex >= visibleTabs.length - 1;
        }

        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            if (visibleTabs.length > 1) {
                visibleTabs.forEach((tab, index) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = `carousel-dot${index === activeIndex ? ' active' : ''}`;
                    dot.setAttribute('aria-label', `${tab.textContent.trim()} sekmesi`);
                    dot.addEventListener('click', () => {
                        this.switchTab(tab.dataset.tab);
                        this.refreshTabsCarousel();
                    });
                    dotsContainer.appendChild(dot);
                });
            }
        }
    }

    refreshCarousels() {
        this.refreshStatsCarousel();
        this.refreshTabsCarousel();

        const panel = document.getElementById('featuresPanel');
        if (panel && this.isFeaturesPanelOpen()) {
            this.renderFeaturesPanel();
        }
    }

    ensureActiveTabVisible() {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab && (activeTab.classList.contains('is-hidden') || activeTab.dataset.available !== 'true')) {
            const firstVisible = this.getVisibleTabButtons()[0];
            if (firstVisible) {
                this.switchTab(firstVisible.dataset.tab);
            }
        }
    }

    initializeCarousels() {
        const statsLeft = document.querySelector('.stats-arrow-left');
        const statsRight = document.querySelector('.stats-arrow-right');
        const tabsLeft = document.querySelector('.tabs-arrow-left');
        const tabsRight = document.querySelector('.tabs-arrow-right');
        const featuresBtn = document.getElementById('toggleFeaturesBtn');

        if (statsLeft) {
            statsLeft.addEventListener('click', () => {
                this.statsPage -= 1;
                this.refreshStatsCarousel();
            });
        }

        if (statsRight) {
            statsRight.addEventListener('click', () => {
                this.statsPage += 1;
                this.refreshStatsCarousel();
            });
        }

        if (tabsLeft) {
            tabsLeft.addEventListener('click', () => {
                this.switchTabByOffset(-1);
            });
        }

        if (tabsRight) {
            tabsRight.addEventListener('click', () => {
                this.switchTabByOffset(1);
            });
        }

        if (featuresBtn) {
            featuresBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.toggleFeaturesPanel();
            });
        }

        const featuresBackdrop = document.getElementById('featuresPanelBackdrop');
        if (featuresBackdrop) {
            featuresBackdrop.addEventListener('click', () => {
                this.closeFeaturesPanel();
            });
        }

        const featuresPanel = document.getElementById('featuresPanel');
        if (featuresPanel) {
            featuresPanel.addEventListener('click', (event) => {
                event.stopPropagation();
            });
            featuresPanel.addEventListener('wheel', (event) => {
                event.stopPropagation();
            }, { passive: true });
        }

        document.addEventListener('click', (event) => {
            if (this.featuresPanelIgnoreOutsideClick || !this.isFeaturesPanelOpen()) {
                return;
            }

            const panel = document.getElementById('featuresPanel');
            const button = document.getElementById('toggleFeaturesBtn');
            const backdrop = document.getElementById('featuresPanelBackdrop');
            if (!panel || !button) {
                return;
            }

            if (
                !panel.contains(event.target)
                && !button.contains(event.target)
                && !backdrop?.contains(event.target)
            ) {
                this.closeFeaturesPanel();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.isFeaturesPanelOpen()) {
                    event.preventDefault();
                    this.closeFeaturesPanel();
                    return;
                }
                const modal = document.getElementById('infoModal');
                if (modal && modal.style.display === 'flex') {
                    this.closeModal();
                    return;
                }
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                }
                return;
            }

            const resultsSection = document.getElementById('resultsSection');
            if (!resultsSection || resultsSection.style.display === 'none') {
                return;
            }

            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
                return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.switchTabByOffset(-1);
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.switchTabByOffset(1);
            }
        });

        window.addEventListener('resize', () => {
            if (document.getElementById('resultsSection')?.style.display === 'none') {
                return;
            }

            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.refreshCarousels();
            }, 150);
        });
    }

    initializeTheme() {
        // Check for saved theme preference or default to dark mode
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
        
        // Modal açıksa onun da temasını güncelle
        const modal = document.getElementById('infoModal');
        if (modal && modal.style.display === 'flex') {
            modal.setAttribute('data-theme', newTheme);
        }
        
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeButtons = document.querySelectorAll('.theme-toggle');
        themeButtons.forEach(button => {
            const sunIcon = button.querySelector('.sun-icon');
            const moonIcon = button.querySelector('.moon-icon');
            
            if (theme === 'dark') {
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            } else {
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
            }
        });
    }

    initializeEventListeners() {
        // Theme toggle listeners for all theme buttons
        document.querySelectorAll('.theme-toggle').forEach(button => {
            button.addEventListener('click', () => {
                this.toggleTheme();
            });
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenuToggle.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                document.body.classList.toggle('mobile-menu-open');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    mobileMenuToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.classList.remove('mobile-menu-open');
                }
            });

            // Close mobile menu when clicking on a link
            const mobileMenuLinks = mobileMenu.querySelectorAll('a');
            mobileMenuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.classList.remove('mobile-menu-open');
                });
            });
        }

        // Info modal listeners
        document.getElementById('infoBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Mobile info button listener
        document.getElementById('mobileInfoBtn').addEventListener('click', () => {
            this.openModal();
            // Close mobile menu when info is opened
            this.closeMobileMenu();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('infoModal').addEventListener('click', (e) => {
            if (e.target.id === 'infoModal') {
                this.closeModal();
            }
        });

        // File input listeners
        document.getElementById('followersFile').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'followers');
        });

        document.getElementById('followingFile').addEventListener('change', (e) => {
            this.handleFileUpload(e, 'following');
        });

        const folderInput = document.getElementById('folderFile');
        if (folderInput) {
            folderInput.addEventListener('change', (e) => {
                this.handleFolderUpload(e);
            });
        }

        // Button listeners
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeData();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });

        // Tab listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Drag and drop functionality
        this.initializeDragAndDrop();

        // Scroll to top functionality
        this.initializeScrollToTop();

        // Back button functionality
        this.initializeBackButton();
        this.initializeCarousels();
    }

    initializeScrollToTop() {
        const scrollToTopBtn = document.getElementById('scrollToTop');
        
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        });
    }

    initializeBackButton() {
        const backBtn = document.getElementById('backBtn');
        
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });

        // Show/hide back button based on page state
        this.updateBackButtonVisibility();
        
        // Listen for navigation changes
        window.addEventListener('popstate', () => {
            this.updateBackButtonVisibility();
        });
    }

    updateBackButtonVisibility() {
        const backBtn = document.getElementById('backBtn');
        const resultsSection = document.getElementById('resultsSection');
        
        // Show back button if results are visible or if there's history
        if (resultsSection && resultsSection.style.display !== 'none' && 
            getComputedStyle(resultsSection).display !== 'none') {
            backBtn.style.display = 'inline-flex';
        } else if (window.history.length > 1) {
            backBtn.style.display = 'inline-flex';
        } else {
            backBtn.style.display = 'none';
        }
    }

    initializeDragAndDrop() {
        const uploadCards = document.querySelectorAll('.upload-card[data-upload-type]');

        uploadCards.forEach((card) => {
            const type = card.dataset.uploadType;

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');

                const files = e.dataTransfer.files;
                if (files.length === 0) {
                    return;
                }

                if (type === 'folder') {
                    this.processUploadedFiles(Array.from(files));
                    return;
                }

                const fileInput = document.getElementById(`${type}File`);
                fileInput.files = files;
                this.handleFileUpload({ target: fileInput }, type);
            });
        });
    }

    isHtmlFile(file) {
        return file.name.toLowerCase().endsWith('.html') || file.type === 'text/html';
    }

    normalizeUsername(raw) {
        if (!raw) {
            return null;
        }

        const username = raw.trim().replace(/^@+/, '');
        const reserved = new Set([
            'p', 'reel', 'reels', 'stories', 'explore', 'accounts',
            'about', 'legal', 'direct', 'nametag', '_u',
        ]);

        if (!username || reserved.has(username.toLowerCase())) {
            return null;
        }

        if (!/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
            return null;
        }

        return username;
    }

    usernameFromHref(href) {
        const match = href.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i);
        if (!match) {
            return null;
        }
        return this.normalizeUsername(match[1]);
    }

    buildUsernameSet(usernames) {
        const set = new Set();
        usernames.forEach((name) => {
            const normalized = this.normalizeUsername(name);
            if (normalized) {
                set.add(normalized.toLowerCase());
            }
        });
        return set;
    }

    isUsernameInList(username, list) {
        const normalized = this.normalizeUsername(username);
        if (!normalized) {
            return false;
        }

        const key = normalized.toLowerCase();
        if (list === this.followers && this.followerSet.size > 0) {
            return this.followerSet.has(key);
        }
        if (list === this.following && this.followingSet.size > 0) {
            return this.followingSet.has(key);
        }

        return this.buildUsernameSet(list).has(key);
    }

    resetConnectionData() {
        this.followers = [];
        this.following = [];
        this.connections = {
            blocked: [],
            close_friends: [],
            removed_suggestions: [],
            pending_requests: [],
            recent_requests: [],
            recently_unfollowed: [],
            hide_story: [],
        };
    }

    detectConnectionType(filename, doc) {
        const basename = filename.toLowerCase();

        if (basename.startsWith('followers') && basename.endsWith('.html')) {
            return 'followers';
        }

        const filenameMap = {
            'following.html': 'following',
            'blocked_profiles.html': 'blocked',
            'close_friends.html': 'close_friends',
            'removed_suggestions.html': 'removed_suggestions',
            'pending_follow_requests.html': 'pending_requests',
            'recent_follow_requests.html': 'recent_requests',
            'recently_unfollowed_profiles.html': 'recently_unfollowed',
            'hide_story_from.html': 'hide_story',
        };

        if (filenameMap[basename]) {
            return filenameMap[basename];
        }

        const title = doc.querySelector('title')?.textContent?.trim().toLowerCase() || '';
        const titleMap = [
            ['takipçiler', 'followers'],
            ['followers', 'followers'],
            ['takip edilenler', 'following'],
            ['following', 'following'],
            ['engellenen profiller', 'blocked'],
            ['blocked profiles', 'blocked'],
            ['yakın arkadaşlar', 'close_friends'],
            ['close friends', 'close_friends'],
            ['kaldırılan öneriler', 'removed_suggestions'],
            ['removed suggestions', 'removed_suggestions'],
            ['bekleyen takip istekleri', 'pending_requests'],
            ['pending follow requests', 'pending_requests'],
            ['yakınlardaki takip istekleri', 'recent_requests'],
            ['recent follow requests', 'recent_requests'],
            ['yakınlarda takibi bıraktığın', 'recently_unfollowed'],
            ['recently unfollowed profiles', 'recently_unfollowed'],
            ['hikayeyi gizle', 'hide_story'],
            ['hide story from', 'hide_story'],
        ];

        for (const [needle, connectionType] of titleMap) {
            if (title.includes(needle)) {
                return connectionType;
            }
        }

        return 'unknown';
    }

    dedupeUsernames(usernames) {
        const seen = new Set();
        const result = [];

        usernames.forEach((username) => {
            const normalized = this.normalizeUsername(username);
            if (!normalized) {
                return;
            }

            const key = normalized.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                result.push(normalized);
            }
        });

        return result;
    }

    extractFromLinks(doc) {
        const usernames = [];

        doc.querySelectorAll('a[href*="instagram.com"]').forEach((link) => {
            const hrefUsername = this.usernameFromHref(link.href);
            const textUsername = this.normalizeUsername(link.textContent.trim());

            if (hrefUsername) {
                usernames.push(hrefUsername);
            } else if (textUsername) {
                usernames.push(textUsername);
            }
        });

        return usernames;
    }

    extractFromH2(doc) {
        const usernames = [];

        doc.querySelectorAll('h2').forEach((heading) => {
            if (!Array.from(heading.classList).some((cls) => cls.includes('_a6-i'))) {
                return;
            }

            const username = this.normalizeUsername(heading.textContent.trim());
            if (username) {
                usernames.push(username);
            }
        });

        return usernames;
    }

    extractFromTables(doc) {
        const usernames = [];
        const labels = new Set(['Kullanıcı adı', 'Username']);

        doc.querySelectorAll('tr').forEach((row) => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) {
                return;
            }

            const label = cells[0].textContent.trim();
            if (!labels.has(label)) {
                return;
            }

            const username = this.normalizeUsername(cells[1].textContent.trim());
            if (username) {
                usernames.push(username);
            }
        });

        return usernames;
    }

    parseHTMLContent(htmlContent, filename = '') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const collected = [
            ...this.extractFromLinks(doc),
            ...this.extractFromH2(doc),
            ...this.extractFromTables(doc),
        ];

        return {
            usernames: this.dedupeUsernames(collected),
            connectionType: this.detectConnectionType(filename, doc),
        };
    }

    mergeUsernames(existing, incoming) {
        return this.dedupeUsernames([...existing, ...incoming]);
    }

    assignConnectionData(connectionType, usernames, mode = 'replace') {
        if (connectionType === 'followers') {
            this.followers = mode === 'merge'
                ? this.mergeUsernames(this.followers, usernames)
                : usernames;
            return;
        }

        if (connectionType === 'following') {
            this.following = mode === 'merge'
                ? this.mergeUsernames(this.following, usernames)
                : usernames;
            return;
        }

        if (Object.prototype.hasOwnProperty.call(this.connections, connectionType)) {
            this.connections[connectionType] = mode === 'merge'
                ? this.mergeUsernames(this.connections[connectionType], usernames)
                : usernames;
        }
    }

    updateFileStatus(elementId, message, statusClass) {
        const statusElement = document.getElementById(elementId);
        if (!statusElement) {
            return;
        }

        statusElement.textContent = message;
        statusElement.className = `file-status ${statusClass}`;
    }

    async handleFileUpload(event, type) {
        const file = event.target.files[0];
        const statusElement = document.getElementById(`${type}Status`);

        if (!file) {
            if (statusElement) {
                statusElement.textContent = '';
                statusElement.className = 'file-status';
            }
            this.checkAnalyzeButton();
            return;
        }

        if (!this.isHtmlFile(file)) {
            this.updateFileStatus(`${type}Status`, '❌ Lütfen HTML dosyası seçin', 'error');
            this.checkAnalyzeButton();
            return;
        }

        try {
            const content = await this.readFileAsText(file);
            const { usernames, connectionType } = this.parseHTMLContent(content, file.name);

            if (usernames.length === 0) {
                this.updateFileStatus(`${type}Status`, '⚠️ Dosyada kullanıcı adı bulunamadı', 'error');
            } else {
                const resolvedType = connectionType === 'followers' || connectionType === 'following'
                    ? connectionType
                    : type;
                this.assignConnectionData(resolvedType, usernames);
                this.updateFileStatus(
                    `${type}Status`,
                    `✅ ${usernames.length} kullanıcı bulundu`,
                    'success'
                );
            }
        } catch (error) {
            this.updateFileStatus(`${type}Status`, '❌ Dosya okuma hatası', 'error');
            console.error('File reading error:', error);
        }

        this.checkAnalyzeButton();
    }

    async handleFolderUpload(event) {
        const files = Array.from(event.target.files || []);
        await this.processUploadedFiles(files);
    }

    async processUploadedFiles(files, resetExisting = true) {
        const htmlFiles = files.filter((file) => this.isHtmlFile(file));

        if (htmlFiles.length === 0) {
            this.updateFileStatus('folderStatus', '❌ HTML dosyası bulunamadı', 'error');
            this.checkAnalyzeButton();
            return;
        }

        if (resetExisting) {
            this.resetConnectionData();
        }

        const summary = {};
        let processedCount = 0;
        const mergeTypes = new Set(['followers', 'following']);

        for (const file of htmlFiles) {
            try {
                const content = await this.readFileAsText(file);
                const { usernames, connectionType } = this.parseHTMLContent(content, file.name);

                if (usernames.length === 0 || connectionType === 'unknown') {
                    continue;
                }

                const mergeMode = mergeTypes.has(connectionType) ? 'merge' : 'replace';
                this.assignConnectionData(connectionType, usernames, mergeMode);
                summary[connectionType] = (summary[connectionType] || 0) + usernames.length;
                processedCount += 1;
            } catch (error) {
                console.error('Folder file reading error:', error);
            }
        }

        if (processedCount === 0) {
            this.updateFileStatus('folderStatus', '⚠️ Kullanılabilir veri bulunamadı', 'error');
        } else {
            const parts = Object.entries(summary).map(([type, count]) => {
                const label = this.connectionLabels[type] || type;
                return `${label}: ${count}`;
            });
            this.updateFileStatus(
                'folderStatus',
                `✅ ${processedCount} dosya yüklendi (${parts.join(', ')})`,
                'success'
            );
        }

        this.checkAnalyzeButton();
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'utf-8');
        });
    }

    checkAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const hasFollowers = this.followers.length > 0;
        const hasFollowing = this.following.length > 0;
        
        analyzeBtn.disabled = !(hasFollowers && hasFollowing);
    }

    async analyzeData() {
        this.showLoading(true);
        
        // Simulate processing time for better UX
        await this.sleep(1000);
        
        try {
            this.calculateAnalytics();
            this.updateStatistics();
            this.displayResults();

            document.getElementById('resultsSection').style.display = 'block';
            this.updateBackButtonVisibility();

            requestAnimationFrame(() => {
                this.refreshCarousels();
                this.ensureActiveTabVisible();
            });

            document.getElementById('resultsSection').scrollIntoView({
                behavior: 'smooth'
            });
            
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            this.showLoading(false);
        }
    }

    calculateAnalytics() {
        this.followerSet = new Set(
            this.followers
                .map((name) => this.normalizeUsername(name))
                .filter(Boolean)
                .map((name) => name.toLowerCase())
        );
        this.followingSet = new Set(
            this.following
                .map((name) => this.normalizeUsername(name))
                .filter(Boolean)
                .map((name) => name.toLowerCase())
        );

        const followerSet = this.followerSet;

        this.mutualFollowers = this.intersection(this.following, this.followers);
        this.notFollowingBack = this.difference(this.following, this.followers).filter(
            (username) => !followerSet.has(username.toLowerCase())
        );

        this.crossAnalysis.blockedInFollowers = this.intersection(
            this.connections.blocked,
            this.followers
        );
        this.crossAnalysis.blockedInFollowing = this.intersection(
            this.connections.blocked,
            this.following
        );
        this.crossAnalysis.closeFriendsNotFollowing = this.difference(
            this.intersection(this.connections.close_friends, this.following),
            this.followers
        );
        this.crossAnalysis.stillFollowingAfterUnfollow = this.intersection(
            this.connections.recently_unfollowed,
            this.following
        );
    }

    intersection(listA, listB) {
        const setB = this.buildUsernameSet(listB);
        const result = [];
        const seen = new Set();

        listA.forEach((name) => {
            const normalized = this.normalizeUsername(name);
            if (!normalized) {
                return;
            }

            const key = normalized.toLowerCase();
            if (setB.has(key) && !seen.has(key)) {
                seen.add(key);
                result.push(normalized);
            }
        });

        return result;
    }

    difference(listA, listB) {
        const setB = this.buildUsernameSet(listB);
        const result = [];
        const seen = new Set();

        listA.forEach((name) => {
            const normalized = this.normalizeUsername(name);
            if (!normalized) {
                return;
            }

            const key = normalized.toLowerCase();
            if (!setB.has(key) && !seen.has(key)) {
                seen.add(key);
                result.push(normalized);
            }
        });

        return result;
    }

    setStatValue(elementId, value, available = true) {
        const element = document.getElementById(elementId);
        const card = element?.closest('.stat-card');

        if (element) {
            element.textContent = value;
        }

        if (card) {
            card.dataset.available = available ? 'true' : 'false';
        }
    }

    setTabVisibility(tabName, visible) {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.dataset.available = visible ? 'true' : 'false';
        }
    }

    updateStatistics() {
        this.setStatValue('followersCount', this.followers.length, this.followers.length > 0);
        this.setStatValue('followingCount', this.following.length, this.following.length > 0);
        this.setStatValue('notFollowingCount', this.notFollowingBack.length, this.followers.length > 0 && this.following.length > 0);
        this.setStatValue('mutualCount', this.mutualFollowers.length, this.followers.length > 0 && this.following.length > 0);

        this.setStatValue('blockedCount', this.connections.blocked.length, this.connections.blocked.length > 0);
        this.setStatValue('closeFriendsCount', this.connections.close_friends.length, this.connections.close_friends.length > 0);
        this.setStatValue('pendingRequestsCount', this.connections.pending_requests.length, this.connections.pending_requests.length > 0);
        this.setStatValue(
            'closeFriendsNotFollowingCount',
            this.crossAnalysis.closeFriendsNotFollowing.length,
            this.crossAnalysis.closeFriendsNotFollowing.length > 0
        );
        this.setStatValue(
            'stillFollowingAfterUnfollowCount',
            this.crossAnalysis.stillFollowingAfterUnfollow.length,
            this.crossAnalysis.stillFollowingAfterUnfollow.length > 0
        );
    }

    displayResults() {
        this.displayUserList('followersList', this.followers, 'Takipçileriniz', 'followers');
        this.displayUserList('followingList', this.following, 'Takip ettikleriniz', 'following');
        this.displayUserList('notFollowingList', this.notFollowingBack, 'Sizi takip etmeyenler', 'notFollowing');
        this.displayUserList('mutualList', this.mutualFollowers, 'Karşılıklı takip', 'mutual');
        this.displayUserList('blockedList', this.connections.blocked, 'Engellenen profiller', 'blocked');
        this.displayUserList('closeFriendsList', this.connections.close_friends, 'Yakın arkadaşlar', 'close_friends');
        this.displayUserList('pendingRequestsList', this.connections.pending_requests, 'Bekleyen istekler', 'pending_requests');
        this.displayUserList('removedSuggestionsList', this.connections.removed_suggestions, 'Kaldırılan öneriler', 'removed_suggestions');
        this.displayUserList(
            'blockedInFollowersList',
            this.crossAnalysis.blockedInFollowers,
            'Engellenen takipçiler',
            'blockedInFollowers'
        );
        this.displayUserList(
            'blockedInFollowingList',
            this.crossAnalysis.blockedInFollowing,
            'Engellenen takip edilenler',
            'blockedInFollowing'
        );
        this.displayUserList(
            'closeFriendsNotFollowingList',
            this.crossAnalysis.closeFriendsNotFollowing,
            'Yakın arkadaş - sizi takip etmeyenler',
            'closeFriendsNotFollowing'
        );
        this.displayUserList(
            'stillFollowingAfterUnfollowList',
            this.crossAnalysis.stillFollowingAfterUnfollow,
            'Bıraktığın halde takip ettiklerin',
            'stillFollowingAfterUnfollow'
        );

        this.setTabVisibility('followers', this.followers.length > 0);
        this.setTabVisibility('following', this.following.length > 0);
        this.setTabVisibility('notFollowing', this.notFollowingBack.length > 0);
        this.setTabVisibility('mutual', this.mutualFollowers.length > 0);
        this.setTabVisibility('blocked', this.connections.blocked.length > 0);
        this.setTabVisibility('close_friends', this.connections.close_friends.length > 0);
        this.setTabVisibility('pending_requests', this.connections.pending_requests.length > 0);
        this.setTabVisibility('removed_suggestions', this.connections.removed_suggestions.length > 0);
        this.setTabVisibility('blockedInFollowers', this.crossAnalysis.blockedInFollowers.length > 0);
        this.setTabVisibility('blockedInFollowing', this.crossAnalysis.blockedInFollowing.length > 0);
        this.setTabVisibility('closeFriendsNotFollowing', this.crossAnalysis.closeFriendsNotFollowing.length > 0);
        this.setTabVisibility('stillFollowingAfterUnfollow', this.crossAnalysis.stillFollowingAfterUnfollow.length > 0);

        this.statsPage = 0;
        this.tabsScrollOffset = 0;

        const activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab || activeTab.classList.contains('is-hidden')) {
            const firstVisible = this.getVisibleTabButtons()[0];
            if (firstVisible) {
                this.switchTab(firstVisible.dataset.tab);
                return;
            }
        }

        this.updateDataAccuracyNotice(activeTab?.dataset.tab);
    }

    displayUserList(containerId, users, emptyMessage, listType) {
        const container = document.getElementById(containerId);
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <p>${emptyMessage} listesi boş</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(username => this.createUserItem(username, listType)).join('');
    }

    createUserItem(username, listType) {
        const firstLetter = username.charAt(0).toUpperCase();
        const instagramUrl = `https://instagram.com/${username}`;
        
        // Determine user status
        const status = this.getUserStatus(username, listType);
        
        return `
            <div class="user-item" data-username="${username.toLowerCase()}">
                <div class="user-avatar">${firstLetter}</div>
                <div class="user-info">
                    <div class="user-name">${username}</div>
                    <div class="user-handle">@${username}</div>
                </div>
                <div class="user-status">
                    ${status.badge}
                </div>
                <a href="${instagramUrl}" target="_blank" class="user-link">
                    <i class="fab fa-instagram"></i> Profil
                </a>
            </div>
        `;
    }

    getUserStatus(username, listType) {
        const isFollower = this.isUsernameInList(username, this.followers);
        const isFollowing = this.isUsernameInList(username, this.following);
        
        if (listType === 'mutual') {
            return {
                badge: '<span class="status-badge status-mutual"><i class="fas fa-heart"></i> Karşılıklı Takip</span>'
            };
        }
        
        if (listType === 'notFollowing') {
            if (isFollower) {
                return {
                    badge: '<span class="status-badge status-mutual"><i class="fas fa-heart"></i> Karşılıklı Takip</span>'
                };
            }

            return {
                badge: '<span class="status-badge status-not-following"><i class="fas fa-user-times"></i> Sizi Takip Etmiyor</span>'
            };
        }
        
        if (listType === 'followers') {
            if (isFollowing) {
                return {
                    badge: '<span class="status-badge status-mutual"><i class="fas fa-heart"></i> Karşılıklı Takip</span>'
                };
            } else {
                return {
                    badge: '<span class="status-badge status-not-follower"><i class="fas fa-user-plus"></i> Sen Takip Etmiyorsun</span>'
                };
            }
        }
        
        if (listType === 'following') {
            if (isFollower) {
                return {
                    badge: '<span class="status-badge status-mutual"><i class="fas fa-heart"></i> Karşılıklı Takip</span>'
                };
            } else {
                return {
                    badge: '<span class="status-badge status-not-following"><i class="fas fa-user-times"></i> Sizi Takip Etmiyor</span>'
                };
            }
        }
        
        return { badge: '' };
    }

    switchTab(tabName) {
        const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (!targetButton || targetButton.classList.contains('is-hidden')) {
            return;
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        targetButton.classList.add('active');

        // Update tab content
        document.querySelectorAll('.user-list').forEach(list => {
            list.classList.remove('active');
        });

        const targetList = this.tabLists[tabName];
        if (targetList) {
            document.getElementById(targetList).classList.add('active');
        }
        
        // Clear search when switching tabs
        document.getElementById('searchInput').value = '';
        this.filterUsers('');
        this.updateDataAccuracyNotice(tabName);
        this.refreshTabsCarousel();
    }

    updateDataAccuracyNotice(tabName) {
        const notice = document.getElementById('listAccuracyNotice');
        if (!notice) {
            return;
        }

        notice.hidden = !this.dataAccuracyNoticeTabs.has(tabName);
    }

    filterUsers(searchTerm) {
        const activeList = document.querySelector('.user-list.active');
        if (!activeList) return;

        const userItems = activeList.querySelectorAll('.user-item');
        const searchLower = searchTerm.toLowerCase();

        userItems.forEach(item => {
            const username = item.dataset.username;
            const isVisible = username.includes(searchLower);
            item.style.display = isVisible ? 'flex' : 'none';
        });

        // Show/hide empty state for search
        const visibleItems = activeList.querySelectorAll('.user-item[style="display: flex"], .user-item:not([style*="display: none"])');
        const emptyState = activeList.querySelector('.empty-state');
        
        if (visibleItems.length === 0 && searchTerm && !emptyState) {
            const searchEmptyState = document.createElement('div');
            searchEmptyState.className = 'empty-state search-empty';
            searchEmptyState.innerHTML = `
                <i class="fas fa-search"></i>
                <p>"${searchTerm}" için sonuç bulunamadı</p>
            `;
            activeList.appendChild(searchEmptyState);
        } else if (visibleItems.length > 0) {
            const searchEmpty = activeList.querySelector('.search-empty');
            if (searchEmpty) {
                searchEmpty.remove();
            }
        }
    }

    clearAll() {
        this.followers = [];
        this.following = [];
        this.notFollowingBack = [];
        this.mutualFollowers = [];
        this.followerSet = new Set();
        this.followingSet = new Set();
        this.resetConnectionData();
        this.crossAnalysis = {
            blockedInFollowers: [],
            blockedInFollowing: [],
            closeFriendsNotFollowing: [],
            stillFollowingAfterUnfollow: [],
        };

        document.getElementById('followersFile').value = '';
        document.getElementById('followingFile').value = '';
        const folderInput = document.getElementById('folderFile');
        if (folderInput) {
            folderInput.value = '';
        }

        this.updateFileStatus('followersStatus', '', '');
        this.updateFileStatus('followingStatus', '', '');
        this.updateFileStatus('folderStatus', '', '');

        // Hide results
        document.getElementById('resultsSection').style.display = 'none';
        this.closeFeaturesPanel();
        const notice = document.getElementById('listAccuracyNotice');
        if (notice) {
            notice.hidden = true;
        }

        // Update back button visibility
        this.updateBackButtonVisibility();

        // Disable analyze button
        document.getElementById('analyzeBtn').disabled = true;

        // Clear search
        document.getElementById('searchInput').value = '';

        // Reset to first visible tab
        const firstVisibleTab = this.getVisibleTabButtons()[0];
        if (firstVisibleTab) {
            this.switchTab(firstVisibleTab.dataset.tab);
        }

        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    openModal() {
        const modal = document.getElementById('infoModal');
        modal.style.display = 'flex';
        
        // Modal'a mevcut tema attribute'unu ekle
        const currentTheme = document.documentElement.getAttribute('data-theme');
        modal.setAttribute('data-theme', currentTheme);
        
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('infoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    closeMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.classList.remove('mobile-menu-open');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.instagramAnalyzer = new InstagramAnalyzer();
});

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput && !searchInput.disabled) {
                searchInput.focus();
            }
        }
        
        // Ctrl/Cmd + D to toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            const analyzer = window.instagramAnalyzer;
            if (analyzer) {
                analyzer.toggleTheme();
            }
        }
        
    });
});

// Tab buttons ripple effect
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            button.querySelectorAll('.ripple').forEach((existing) => existing.remove());
            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Wizard carousel keyboard navigation and animation
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const steps = document.querySelectorAll('.wizard-step');
    const leftBtn = document.querySelector('.wizard-arrow-left');
    const rightBtn = document.querySelector('.wizard-arrow-right');
    let current = 0;
    function showStep(idx, direction = 0) {
      steps.forEach((step, i) => {
        if (i === idx) {
          step.style.display = 'flex';
          step.classList.remove('fade-in-left', 'fade-in-right');
          if (direction < 0) step.classList.add('fade-in-left');
          if (direction > 0) step.classList.add('fade-in-right');
        } else {
          step.style.display = 'none';
          step.classList.remove('fade-in-left', 'fade-in-right');
        }
      });
      leftBtn.disabled = (idx === 0);
      rightBtn.disabled = (idx === steps.length - 1);
    }
    leftBtn.addEventListener('click', () => {
      if (current > 0) { current--; showStep(current, -1); }
    });
    rightBtn.addEventListener('click', () => {
      if (current < steps.length - 1) { current++; showStep(current, 1); }
    });
    document.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (document.getElementById('resultsSection')?.style.display !== 'none') return;
      if (e.key === 'ArrowLeft') {
        if (current > 0) { current--; showStep(current, -1); }
      }
      if (e.key === 'ArrowRight') {
        if (current < steps.length - 1) { current++; showStep(current, 1); }
      }
    });
    showStep(current);
  });
})();