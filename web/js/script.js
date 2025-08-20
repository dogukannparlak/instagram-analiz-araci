class InstagramAnalyzer {
    constructor() {
        this.followers = [];
        this.following = [];
        this.notFollowingBack = [];
        this.mutualFollowers = [];
        
        this.initializeTheme();
        this.initializeEventListeners();
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
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Drag and drop functionality
        this.initializeDragAndDrop();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Scroll to top functionality
        this.initializeScrollToTop();

        // Back button functionality
        this.initializeBackButton();
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
            if (window.pageYOffset > 300) {
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
        const uploadCards = document.querySelectorAll('.upload-card');
        
        uploadCards.forEach((card, index) => {
            const fileTypes = ['followers', 'following'];
            const type = fileTypes[index];
            
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
                if (files.length > 0) {
                    const fileInput = document.getElementById(`${type}File`);
                    fileInput.files = files;
                    this.handleFileUpload({target: fileInput}, type);
                }
            });
        });
    }

    async handleFileUpload(event, type) {
        const file = event.target.files[0];
        const statusElement = document.getElementById(`${type}Status`);
        
        if (!file) {
            statusElement.textContent = '';
            statusElement.className = 'file-status';
            this.checkAnalyzeButton();
            return;
        }

        if (file.type !== 'text/html') {
            statusElement.textContent = '❌ Lütfen HTML dosyası seçin';
            statusElement.className = 'file-status error';
            this.checkAnalyzeButton();
            return;
        }

        try {
            const content = await this.readFileAsText(file);
            const usernames = this.parseHTMLContent(content);
            
            if (usernames.length === 0) {
                statusElement.textContent = '⚠️ Dosyada kullanıcı adı bulunamadı';
                statusElement.className = 'file-status error';
            } else {
                this[type] = usernames;
                statusElement.textContent = `✅ ${usernames.length} kullanıcı bulundu`;
                statusElement.className = 'file-status success';
            }
        } catch (error) {
            statusElement.textContent = '❌ Dosya okuma hatası';
            statusElement.className = 'file-status error';
            console.error('File reading error:', error);
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

    parseHTMLContent(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const links = doc.querySelectorAll('a[href*="instagram.com"]');
        
        const usernames = [];
        links.forEach(link => {
            const username = link.textContent.trim();
            if (username && !usernames.includes(username)) {
                usernames.push(username);
            }
        });
        
        return usernames;
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
            // Calculate analytics
            this.calculateAnalytics();
            
            // Update statistics
            this.updateStatistics();
            
            // Display results
            this.displayResults();
            
            // Show results section
            document.getElementById('resultsSection').style.display = 'block';
            
            // Update back button visibility
            this.updateBackButtonVisibility();
            
            // Smooth scroll to results
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
        // Find users who don't follow back
        this.notFollowingBack = this.following.filter(user => 
            !this.followers.includes(user)
        );
        
        // Find mutual followers
        this.mutualFollowers = this.following.filter(user => 
            this.followers.includes(user)
        );
    }

    updateStatistics() {
        document.getElementById('followersCount').textContent = this.followers.length;
        document.getElementById('followingCount').textContent = this.following.length;
        document.getElementById('notFollowingCount').textContent = this.notFollowingBack.length;
        document.getElementById('mutualCount').textContent = this.mutualFollowers.length;
    }

    displayResults() {
        this.displayUserList('followersList', this.followers, 'Takipçileriniz', 'followers');
        this.displayUserList('followingList', this.following, 'Takip ettikleriniz', 'following');
        this.displayUserList('notFollowingList', this.notFollowingBack, 'Sizi takip etmeyenler', 'notFollowing');
        this.displayUserList('mutualList', this.mutualFollowers, 'Karşılıklı takip', 'mutual');
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
        const isFollower = this.followers.includes(username);
        const isFollowing = this.following.includes(username);
        
        if (listType === 'mutual') {
            return {
                badge: '<span class="status-badge status-mutual"><i class="fas fa-heart"></i> Karşılıklı Takip</span>'
            };
        }
        
        if (listType === 'notFollowing') {
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
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.user-list').forEach(list => {
            list.classList.remove('active');
        });

        const targetList = {
            'followers': 'followersList',
            'following': 'followingList',
            'notFollowing': 'notFollowingList',
            'mutual': 'mutualList'
        };

        document.getElementById(targetList[tabName]).classList.add('active');
        
        // Clear search when switching tabs
        document.getElementById('searchInput').value = '';
        this.filterUsers('');
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
        // Reset data
        this.followers = [];
        this.following = [];
        this.notFollowingBack = [];
        this.mutualFollowers = [];

        // Clear file inputs
        document.getElementById('followersFile').value = '';
        document.getElementById('followingFile').value = '';

        // Clear status messages
        document.getElementById('followersStatus').textContent = '';
        document.getElementById('followersStatus').className = 'file-status';
        document.getElementById('followingStatus').textContent = '';
        document.getElementById('followingStatus').className = 'file-status';

        // Hide results
        document.getElementById('resultsSection').style.display = 'none';

        // Update back button visibility
        this.updateBackButtonVisibility();

        // Disable analyze button
        document.getElementById('analyzeBtn').disabled = true;

        // Clear search
        document.getElementById('searchInput').value = '';

        // Reset to first tab
        this.switchTab('followers');

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
        
        // Escape to clear search
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    });
});

// Tabs mouse tracking effect
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelector('.tabs');
    
    if (tabs) {
        tabs.addEventListener('mousemove', function(e) {
            const rect = tabs.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            tabs.style.setProperty('--mouse-x', x + '%');
            tabs.style.setProperty('--mouse-y', y + '%');
        });
        
        // Arrow navigation functionality
        const tabButtons = tabs.querySelectorAll('.tab-btn');
        const leftArrow = tabs.querySelector('.swipe-indicator.left');
        const rightArrow = tabs.querySelector('.swipe-indicator.right');
        
        // Mobile touch scrolling for tabs
        let isScrolling = false;
        
        function getCurrentTabIndex() {
            let currentIndex = 0;
            tabButtons.forEach((tab, index) => {
                if (tab.classList.contains('active')) {
                    currentIndex = index;
                }
            });
            return currentIndex;
        }
        
        if (leftArrow) {
            leftArrow.addEventListener('click', () => {
                const currentIndex = getCurrentTabIndex();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabButtons.length - 1;
                const prevTab = tabButtons[prevIndex];
                if (prevTab) {
                    const tabName = prevTab.getAttribute('data-tab');
                    window.instagramAnalyzer.switchTab(tabName);
                }
            });
        }
        
        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                const currentIndex = getCurrentTabIndex();
                const nextIndex = currentIndex < tabButtons.length - 1 ? currentIndex + 1 : 0;
                const nextTab = tabButtons[nextIndex];
                if (nextTab) {
                    const tabName = nextTab.getAttribute('data-tab');
                    window.instagramAnalyzer.switchTab(tabName);
                }
            });
        }
    }
    
    // Tab buttons ripple effect
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            // Remove existing ripples
            const existingRipples = button.querySelectorAll('.ripple');
            existingRipples.forEach(r => r.remove());
            
            button.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

function initTabsHoverEffect() {
    const tabsContainer = document.querySelector('.tabs');
    const hoverBackground = document.querySelector('.hover_background');

    if (!tabsContainer || !hoverBackground) return;

    const tabButtons = tabsContainer.querySelectorAll('.tab-btn');
    var selected_element = null

    tabButtons.forEach(tabButton => {
        tabButton.addEventListener('mouseenter', () => {
            const rect = tabButton.getBoundingClientRect();
            const containerRect = tabsContainer.getBoundingClientRect();

            // Tab butonunun tabs container'ına göre relatif konumu
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;

            if(tabButton != selected_element){
                selected_element = tabButton;
                tabButton.dispatchEvent(new Event("click"))
            }

            hoverBackground.style.left = `${x}px`;
            hoverBackground.style.top = `${y}px`;
            hoverBackground.style.width = `${rect.width}px`;
            hoverBackground.style.height = `${rect.height}px`;
            hoverBackground.style.opacity = '1';


        });
    });

    tabsContainer.addEventListener('mouseleave', () => {
        // hoverBackground.style.opacity = '0';
    });
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', initTabsHoverEffect);

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
// Wizard carousel animation CSS
const wizardAnimStyle = document.createElement('style');
wizardAnimStyle.innerHTML = `
.wizard-step.fade-in-right {
  animation: wizardFadeInRight 0.35s cubic-bezier(0.4,0,0.2,1);
}
.wizard-step.fade-in-left {
  animation: wizardFadeInLeft 0.35s cubic-bezier(0.4,0,0.2,1);
}
@keyframes wizardFadeInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes wizardFadeInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}
`;
document.head.appendChild(wizardAnimStyle);