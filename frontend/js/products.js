let currentFilter = 'all';
let currentSort = 'newest';
let searchQuery = '';
let visibleCount = 8;
const BATCH_SIZE = 8;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Products Page Loaded');
    renderProducts();
    initFilters();
    initSorting();
    initSearch();
    initLoadMore();
});

function renderProducts() {
    const productGrid = document.querySelector('#product-grid');
    if (!productGrid) return;

    // 1. Filter
    let filteredProducts = products.filter(p => {
        const matchesFilter = currentFilter === 'all' || p.category === currentFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery) || 
                              p.categoryName.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    // 2. Sort
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'newest':
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });

    // 3. Clear and Render
    productGrid.innerHTML = '';
    
    const displayList = filteredProducts.slice(0, visibleCount);
    
    displayList.forEach(p => {
        productGrid.appendChild(createProductCard(p));
    });

    // 4. Update Load More button
    const loadMoreBtn = document.querySelector('.btn-load-more');
    if (loadMoreBtn) {
        if (visibleCount >= filteredProducts.length) {
            loadMoreBtn.classList.add('d-none');
        } else {
            loadMoreBtn.classList.remove('d-none');
        }
    }
}

function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col product-card';
    col.dataset.category = product.category;
    col.dataset.price = product.price;
    col.dataset.rating = product.rating;
    col.dataset.date = product.date;

    const formattedPrice = new Intl.NumberFormat('vi-VN').format(product.price) + 'đ';
    
    // Generate stars
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        const fill = i <= Math.floor(product.rating) ? 1 : 0;
        const colorClass = i <= Math.floor(product.rating) ? 'text-warning' : 'text-secondary text-opacity-25';
        starsHtml += `<span class="material-symbols-outlined ${colorClass} fs-8" style="font-variation-settings: 'FILL' ${fill};">star</span>`;
    }

    col.innerHTML = `
        <div class="card h-100 border-0 bg-surface-container-low rounded-4 overflow-hidden shadow-sm hover-scale transition-all">
            <div class="ratio ratio-1x1 position-relative overflow-hidden">
                <img src="${product.image}" class="object-fit-cover w-100 h-100" alt="${product.name}">
            </div>
            <div class="card-body p-4">
                <p class="fs-9 fw-bold text-primary mb-2 text-uppercase tracking-widest">${product.categoryName}</p>
                <h3 class="h6 fw-bold font-headline text-dark mb-2 text-truncate">${product.name}</h3>
                <div class="d-flex align-items-center gap-1 mb-3">
                    ${starsHtml}
                    <span class="fs-8 text-secondary opacity-50 fw-medium ms-1">(${product.reviews})</span>
                </div>
                <div class="d-flex align-items-center justify-content-between">
                    <span class="h6 fw-black text-dark mb-0">${formattedPrice}</span>
                    <a href="product-details.html" class="text-primary fw-bold fs-8 text-decoration-none hover-underline">Chi tiết</a>
                </div>
            </div>
        </div>
    `;
    return col;
}

function initFilters() {
    const filterBtns = document.querySelectorAll('#filter-buttons button');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.getAttribute('data-filter');
            visibleCount = BATCH_SIZE; // Reset count
            
            filterBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-surface-container-low', 'text-secondary');
            });
            btn.classList.add('bg-primary', 'text-white');
            btn.classList.remove('bg-surface-container-low', 'text-secondary');
            
            renderProducts();
        });
    });
}

function initSorting() {
    const sortSelect = document.querySelector('#sort-select');
    if (!sortSelect) return;
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderProducts();
    });
}

function initSearch() {
    const searchInput = document.querySelector('#search-input');
    const searchBtn = document.querySelector('#search-btn');
    if (!searchInput || !searchBtn) return;

    const performSearch = () => {
        searchQuery = searchInput.value.toLowerCase().trim();
        visibleCount = BATCH_SIZE;
        renderProducts();
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

function initLoadMore() {
    const loadMoreBtn = document.querySelector('.btn-load-more');
    if (!loadMoreBtn) return;
    loadMoreBtn.addEventListener('click', () => {
        visibleCount += BATCH_SIZE;
        renderProducts();
    });
}
