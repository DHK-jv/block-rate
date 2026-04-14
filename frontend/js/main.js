/**
 * BlockRate — Common JavaScript
 * Handles: Navbar, Mobile Menu, Product Filters, Wallet Connect Button
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('BlockRate App Initialized');
    initNavbar();
    initProductFilters();
    await initWalletNavbar();
});

// ──────────────────────────────────────────────────────────
// NAVBAR
// ──────────────────────────────────────────────────────────
function initNavbar() {
    const nav = document.querySelector('nav');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('shadow-sm');
        } else {
            nav.classList.remove('shadow-sm');
        }
    });

    const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
    const mobileMenu = document.querySelector('#mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('d-none');
            mobileMenu.classList.toggle('d-block');
        });
    }
}

// ──────────────────────────────────────────────────────────
// PRODUCT FILTERS
// ──────────────────────────────────────────────────────────
function initProductFilters() {
    const filterBtns = document.querySelectorAll('[data-filter]');
    const productCards = document.querySelectorAll('.product-card');

    if (filterBtns.length === 0 || productCards.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            filterBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-surface-container-low', 'text-secondary');
            });
            btn.classList.add('bg-primary', 'text-white');
            btn.classList.remove('bg-surface-container-low', 'text-secondary');

            productCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.classList.remove('d-none');
                } else {
                    card.classList.add('d-none');
                }
            });
        });
    });
}

// ──────────────────────────────────────────────────────────
// WALLET CONNECT — NAVBAR
// ──────────────────────────────────────────────────────────
async function initWalletNavbar() {
    // Tìm khu vực action của navbar (trước mobile-menu-btn)
    const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
    if (!mobileMenuBtn) return;

    // Tạo nút wallet
    const walletBtn = document.createElement('button');
    walletBtn.id = 'navbar-wallet-btn';
    walletBtn.className = 'btn-wallet-nav d-none d-md-flex align-items-center gap-2';
    walletBtn.innerHTML = `
        <span class="wallet-dot" id="wallet-status-dot"></span>
        <span id="wallet-btn-label">Kết nối ví</span>
    `;
    mobileMenuBtn.parentNode.insertBefore(walletBtn, mobileMenuBtn);

    // Inject CSS inline (tránh sửa style.css)
    if (!document.getElementById('wallet-nav-style')) {
        const style = document.createElement('style');
        style.id = 'wallet-nav-style';
        style.textContent = `
            .btn-wallet-nav {
                background: transparent;
                border: 1.5px solid rgba(0,0,0,0.15);
                border-radius: 50px;
                padding: 6px 14px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                color: #333;
                font-family: inherit;
            }
            .btn-wallet-nav:hover {
                background: rgba(0,0,0,0.04);
                border-color: rgba(0,0,0,0.3);
            }
            .btn-wallet-nav.connected {
                border-color: #22c55e;
                color: #16a34a;
                background: rgba(34,197,94,0.08);
            }
            .wallet-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #9ca3af;
                display: inline-block;
                transition: background 0.3s;
            }
            .btn-wallet-nav.connected .wallet-dot {
                background: #22c55e;
                box-shadow: 0 0 0 2px rgba(34,197,94,0.3);
            }
        `;
        document.head.appendChild(style);
    }

    // Xử lý click
    walletBtn.addEventListener('click', async () => {
        if (!window.BlockRateWeb3) return;

        if (BlockRateWeb3.isConnected) {
            BlockRateWeb3.disconnectWallet();
            _updateWalletUI(null);
            window.dispatchEvent(new CustomEvent('walletDisconnected'));
        } else {
            try {
                const info = await BlockRateWeb3.connectWallet();
                _updateWalletUI(info);
                window.dispatchEvent(new CustomEvent('walletConnected', { detail: info }));
            } catch (err) {
                alert(err.message);
            }
        }
    });

    // Lắng nghe sự kiện thay đổi từ MetaMask
    window.addEventListener('walletChanged', (e) => _updateWalletUI(e.detail));
    window.addEventListener('walletDisconnected', () => _updateWalletUI(null));

    // Khôi phục kết nối nếu đã connect trước đó
    if (window.BlockRateWeb3 && window.ethereum) {
        try {
            const info = await BlockRateWeb3.restoreWallet();
            _updateWalletUI(info);
        } catch { /* ignore */ }
    }
}

function _updateWalletUI(info) {
    const walletBtn = document.getElementById('navbar-wallet-btn');
    const label = document.getElementById('wallet-btn-label');
    if (!walletBtn || !label) return;

    if (info && info.address) {
        walletBtn.classList.add('connected');
        label.textContent = info.shortAddress || BlockRateWeb3.formatAddress(info.address);
        walletBtn.title = info.address + '\nClick để ngắt kết nối';
    } else {
        walletBtn.classList.remove('connected');
        label.textContent = 'Kết nối ví';
        walletBtn.title = 'Kết nối ví MetaMask';
    }
}
