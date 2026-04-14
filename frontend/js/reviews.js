document.addEventListener('DOMContentLoaded', () => {
    const reviewFeed = document.getElementById('review-feed');
    const reviewCards = Array.from(document.querySelectorAll('.review-card'));
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loadMoreBtn = document.getElementById('load-more-reviews');
    
    let currentFilter = 'all';
    let visibleCount = 3;

    function applyFiltersAndSort() {
        console.log('Applying filter:', currentFilter, 'Visible count:', visibleCount);
        
        let filtered = [...reviewCards];

        // 1. Filtering Logic
        if (currentFilter === 'verified') {
            filtered = filtered.filter(card => card.dataset.verified === 'true');
        }

        // 2. Sorting Logic (Always available, but only different if 'newest' is active)
        if (currentFilter === 'newest') {
            filtered.sort((a, b) => {
                const dateA = new Date(a.dataset.timestamp);
                const dateB = new Date(b.dataset.timestamp);
                return dateB - dateA; // Newest first
            });
        }

        // 3. Reset all displays first
        reviewCards.forEach(card => {
            card.classList.add('d-none');
            card.style.order = '';
        });

        // 4. Show filtered/sorted results up to visibleCount
        filtered.forEach((card, index) => {
            if (index < visibleCount) {
                card.classList.remove('d-none');
            }
            card.style.order = index; // Ensure correct visual order in vstack
        });

        // 5. Toggle Load More button
        if (visibleCount >= filtered.length) {
            loadMoreBtn.classList.add('d-none');
        } else {
            loadMoreBtn.classList.remove('d-none');
        }
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI state
            filterButtons.forEach(b => {
                b.classList.remove('btn-primary', 'active');
                b.classList.add('btn-outline-secondary');
            });
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-primary', 'active');

            currentFilter = btn.dataset.filter;
            visibleCount = 3; // Reset paging when switching filters
            applyFiltersAndSort();
        });
    });

    loadMoreBtn.addEventListener('click', () => {
        visibleCount += 3;
        applyFiltersAndSort();
    });

    // Initial render
    applyFiltersAndSort();
});
