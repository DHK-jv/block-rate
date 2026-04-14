/**
 * BlockRate — Product Details Page (product-details.js)
 * Tích hợp MetaMask: Seller panel, Buy panel, Review gate
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy productId từ URL param (?id=BR-8829-TECH)
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id') || 'BR-8829-TECH'; // fallback cho demo

    // Đợi wallet restore xong trước khi init các panel
    await _waitForWeb3();
    await initSellerPanel(productId);
    await initBuyPanel(productId);
    await initReviewPanel(productId);

    // Re-init khi ví thay đổi
    window.addEventListener('walletConnected', async () => {
        await initSellerPanel(productId);
        await initBuyPanel(productId);
        await initReviewPanel(productId);
    });
    window.addEventListener('walletDisconnected', async () => {
        await initSellerPanel(productId);
        await initBuyPanel(productId);
        await initReviewPanel(productId);
    });
});

// Đợi BlockRateWeb3 và ethers sẵn sàng (CDN load async)
function _waitForWeb3(timeout = 5000) {
    return new Promise((resolve) => {
        if (window.BlockRateWeb3 && window.ethers) return resolve();
        const interval = setInterval(() => {
            if (window.BlockRateWeb3 && window.ethers) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
        setTimeout(() => { clearInterval(interval); resolve(); }, timeout);
    });
}

// ──────────────────────────────────────────────────────────
// HELPER: Toast notification
// ──────────────────────────────────────────────────────────
function _showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 90px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px; max-width: 360px;
        `;
        document.body.appendChild(container);
    }

    const colors = {
        success: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', icon: 'check_circle' },
        error:   { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', icon: 'error' },
        info:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', icon: 'info' },
        loading: { bg: '#fafafa', border: '#6b7280', text: '#374151', icon: 'hourglass_top' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${c.bg}; border: 1.5px solid ${c.border}; border-radius: 12px;
        padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1); animation: slideIn 0.3s ease;
        font-family: inherit; font-size: 0.85rem;
    `;
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="color:${c.border};font-size:20px;flex-shrink:0">${c.icon}</span>
        <span style="color:${c.text};line-height:1.4">${message}</span>
    `;

    if (!document.getElementById('toast-anim-style')) {
        const s = document.createElement('style');
        s.id = 'toast-anim-style';
        s.textContent = `@keyframes slideIn {from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`;
        document.head.appendChild(s);
    }

    container.appendChild(toast);
    if (type !== 'loading') {
        setTimeout(() => toast.remove(), 5000);
    }
    return toast; // trả về để caller có thể remove (loading toast)
}

// ──────────────────────────────────────────────────────────
// SELLER PANEL — Đăng sản phẩm lên blockchain
// ──────────────────────────────────────────────────────────
async function initSellerPanel(productId) {
    const panel = document.getElementById('seller-panel');
    if (!panel) return;

    const web3 = window.BlockRateWeb3;
    if (!web3 || !web3.isConnected) {
        panel.innerHTML = `
            <p class="text-secondary fs-7 mb-0 d-flex align-items-center gap-2">
                <span class="material-symbols-outlined fs-6 text-secondary opacity-50">store</span>
                Kết nối ví để đăng sản phẩm lên blockchain.
            </p>`;
        return;
    }

    // Kiểm tra sản phẩm đã được list chưa
    const product = await web3.getProduct(productId);

    if (product && product.exists) {
        const sellerMe = await web3.isSeller(productId, web3.address);
        panel.innerHTML = `
            <div class="d-flex align-items-center gap-2 text-success fw-semibold fs-7">
                <span class="material-symbols-outlined fs-6" style="font-variation-settings:'FILL' 1">check_circle</span>
                Sản phẩm đã trên blockchain
            </div>
            <div class="mt-2 d-flex gap-3 flex-wrap fs-8 text-secondary">
                <span>💰 ${product.priceEth} ETH</span>
                <span>📦 Còn ${product.stock} sản phẩm</span>
                <span>🛒 Đã bán ${product.totalSold}</span>
            </div>
            ${sellerMe ? `<div class="mt-3">
                <label class="form-label fw-semibold fs-8 text-secondary mb-1">Cập nhật tồn kho</label>
                <div class="d-flex gap-2">
                    <input type="number" id="update-stock-input" class="form-control form-control-sm rounded-3" value="${product.stock}" min="0" style="max-width:120px">
                    <button id="update-stock-btn" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold">Cập nhật</button>
                </div>
            </div>` : ''}
        `;

        if (sellerMe) {
            document.getElementById('update-stock-btn')?.addEventListener('click', async () => {
                const newStock = parseInt(document.getElementById('update-stock-input').value);
                if (isNaN(newStock) || newStock < 0) return;
                const loading = _showToast('Đang gửi giao dịch...', 'loading');
                try {
                    const { txHash } = await web3.updateStock?.(productId, newStock) || {};
                    loading.remove();
                    _showToast(`Đã cập nhật tồn kho thành ${newStock}! Tx: ${txHash?.slice(0,10)}...`, 'success');
                    setTimeout(() => initSellerPanel(productId), 3000);
                } catch (err) {
                    loading.remove();
                    _showToast(err.message, 'error');
                }
            });
        }
        return;
    }

    // Form đăng sản phẩm
    panel.innerHTML = `
        <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <span class="material-symbols-outlined fs-6 text-primary">storefront</span>
            Đăng sản phẩm lên Blockchain
        </h6>
        <div class="d-flex flex-column gap-3">
            <div>
                <label class="form-label fw-semibold fs-8 text-secondary mb-1">Giá bán (ETH)</label>
                <div class="input-group input-group-sm">
                    <input type="number" id="list-price" class="form-control rounded-start-3" placeholder="vd: 0.05" step="0.001" min="0.0001">
                    <span class="input-group-text rounded-end-3 fw-bold text-primary">ETH</span>
                </div>
            </div>
            <div>
                <label class="form-label fw-semibold fs-8 text-secondary mb-1">Số lượng</label>
                <input type="number" id="list-stock" class="form-control form-control-sm rounded-3" placeholder="vd: 50" min="1" value="10">
            </div>
            <button id="list-product-btn" class="btn btn-dark btn-sm rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2">
                <span class="material-symbols-outlined fs-7">link</span>
                Đăng lên Blockchain
            </button>
        </div>
    `;

    document.getElementById('list-product-btn').addEventListener('click', async () => {
        const price = document.getElementById('list-price').value;
        const stock = parseInt(document.getElementById('list-stock').value);

        if (!price || parseFloat(price) <= 0) {
            _showToast('Vui lòng nhập giá hợp lệ (ETH > 0)', 'error'); return;
        }
        if (!stock || stock < 1) {
            _showToast('Vui lòng nhập số lượng hợp lệ (≥ 1)', 'error'); return;
        }

        const btn = document.getElementById('list-product-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined fs-7 spin-anim">autorenew</span> Đang xử lý...`;

        const loading = _showToast('Đang chờ xác nhận MetaMask...', 'loading');
        try {
            const { txHash } = await web3.listProduct(productId, price, stock);
            loading.remove();
            _showToast(
                `✅ Đã đăng sản phẩm!<br><small class="font-monospace">Tx: ${txHash.slice(0,20)}...</small>`,
                'success'
            );
            setTimeout(() => initSellerPanel(productId), 3000);
        } catch (err) {
            loading.remove();
            _showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = `<span class="material-symbols-outlined fs-7">link</span> Đăng lên Blockchain`;
        }
    });
}

// ──────────────────────────────────────────────────────────
// BUY PANEL — Mua sản phẩm bằng ETH
// ──────────────────────────────────────────────────────────
async function initBuyPanel(productId) {
    const buyBtn = document.getElementById('buy-with-metamask');
    const buySection = document.getElementById('buy-section');
    if (!buyBtn) return;

    const web3 = window.BlockRateWeb3;
    const product = await (web3 ? web3.getProduct(productId) : null);

    // Nếu sản phẩm chưa trên chain
    if (!product || !product.exists) {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Chưa có trên Blockchain';
        return;
    }

    // Cập nhật giá
    if (buySection) {
        buySection.innerHTML = `
            <div class="d-flex align-items-center gap-2 mb-3 fs-7 text-secondary">
                <span class="material-symbols-outlined fs-7" style="font-variation-settings:'FILL' 1;color:#22c55e">verified_user</span>
                Giá trên chain: <strong class="text-dark">${product.priceEth} ETH</strong>
                <span class="opacity-50">(còn ${product.stock} sản phẩm)</span>
            </div>
        `;
    }

    // Đã mua rồi
    if (web3 && web3.isConnected) {
        const already = await web3.canReview(productId, web3.address);
        if (already) {
            buyBtn.disabled = true;
            buyBtn.className = buyBtn.className.replace('btn-primary', 'btn-success');
            buyBtn.innerHTML = `✅ Đã mua sản phẩm này`;
            return;
        }
    }

    // Hết hàng
    if (product.stock === 0) {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Hết hàng';
        return;
    }

    buyBtn.disabled = false;
    buyBtn.addEventListener('click', async () => {
        if (!web3 || !web3.isConnected) {
            _showToast('Vui lòng kết nối ví MetaMask trước.', 'info'); return;
        }

        buyBtn.disabled = true;
        buyBtn.innerHTML = `<span class="material-symbols-outlined fs-6 spin-anim">autorenew</span> Đang xử lý...`;

        const loading = _showToast('Đang chờ xác nhận MetaMask...', 'loading');
        try {
            const { txHash } = await web3.buyProduct(productId, product.priceEth);
            loading.remove();
            _showToast(
                `🎉 Mua thành công!<br><small class="font-monospace">Tx: ${txHash.slice(0,20)}...</small>`,
                'success'
            );
            // Unlock review form
            setTimeout(() => {
                initBuyPanel(productId);
                initReviewPanel(productId);
            }, 2000);
        } catch (err) {
            loading.remove();
            _showToast(err.message, 'error');
            buyBtn.disabled = false;
            buyBtn.innerHTML = `Mua với MetaMask <span class="material-symbols-outlined fs-6">account_balance_wallet</span>`;
        }
    });
}

// ──────────────────────────────────────────────────────────
// REVIEW PANEL — Chỉ người đã mua mới được đánh giá
// ──────────────────────────────────────────────────────────
async function initReviewPanel(productId) {
    const reviewForm = document.getElementById('review-form-wrapper');
    const reviewGate = document.getElementById('review-gate');
    const reviewResult = document.getElementById('review-result');
    if (!reviewForm || !reviewGate) return;

    const web3 = window.BlockRateWeb3;

    // Chưa kết nối ví
    if (!web3 || !web3.isConnected) {
        reviewGate.classList.remove('d-none');
        reviewForm.classList.add('d-none');
        document.getElementById('review-gate-msg').textContent =
            'Kết nối ví MetaMask để xác nhận quyền đánh giá.';
        return;
    }

    const allowed = await web3.canReview(productId, web3.address);

    if (!allowed) {
        reviewGate.classList.remove('d-none');
        reviewForm.classList.add('d-none');
        document.getElementById('review-gate-msg').textContent =
            'Chỉ người đã mua sản phẩm này mới được phép đánh giá.';
        return;
    }

    // Đã mua → hiện form
    reviewGate.classList.add('d-none');
    reviewForm.classList.remove('d-none');

    // Star rating logic
    const stars = document.querySelectorAll('.star-btn');
    let selectedRating = 0;
    stars.forEach((star, i) => {
        star.addEventListener('mouseenter', () => _highlightStars(stars, i + 1));
        star.addEventListener('mouseleave', () => _highlightStars(stars, selectedRating));
        star.addEventListener('click', () => {
            selectedRating = i + 1;
            _highlightStars(stars, selectedRating);
        });
    });

    // Submit review → gọi backend API
    const submitBtn = document.getElementById('submit-review-btn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const content = document.getElementById('review-content')?.value?.trim();

        if (!selectedRating) {
            _showToast('Vui lòng chọn số sao đánh giá.', 'error'); return;
        }
        if (!content || content.length < 10) {
            _showToast('Nhận xét cần ít nhất 10 ký tự.', 'error'); return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined fs-7 spin-anim">autorenew</span> Đang gửi...`;

        const loading = _showToast('Đang ghi nhận đánh giá lên blockchain...', 'loading');

        try {
            // Gọi backend API (backend sẽ ký và gọi ReviewRegistry.submitReview)
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    walletAddress: web3.address,
                    rating: selectedRating,
                    content,
                    // Signature để backend verify người dùng thực sự là owner ví
                    signature: await _signReviewMessage(productId, content, web3.address),
                }),
            });

            const data = await response.json();
            loading.remove();

            if (!response.ok) throw new Error(data.message || 'Lỗi server');

            // Hiện kết quả với tx hash
            if (reviewResult) {
                const txUrl = web3.getEtherscanUrl(data.txHash, web3.chainId);
                reviewResult.innerHTML = `
                    <div class="p-4 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-20">
                        <div class="d-flex align-items-center gap-2 fw-bold text-success mb-2">
                            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">verified</span>
                            Đánh giá đã được ghi lên Blockchain!
                        </div>
                        <div class="font-monospace fs-8 text-secondary">
                            Tx: <a href="${txUrl}" target="_blank" class="text-primary">${data.txHash}</a>
                        </div>
                    </div>
                `;
                reviewResult.classList.remove('d-none');
            }

            reviewForm.classList.add('d-none');
            _showToast('Đánh giá đã được xác thực blockchain! 🎉', 'success');

        } catch (err) {
            loading.remove();
            _showToast(err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Gửi đánh giá';
        }
    });
}

// Ký message để backend verify ví
async function _signReviewMessage(productId, content, address) {
    try {
        if (!window.ethereum) return null;
        const message = `BlockRate Review\nProduct: ${productId}\nAddress: ${address}\nContent: ${content}`;
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, address],
        });
        return signature;
    } catch {
        return null;
    }
}

function _highlightStars(stars, count) {
    stars.forEach((s, i) => {
        if (i < count) {
            s.style.fontVariationSettings = "'FILL' 1";
            s.style.color = '#f59e0b';
        } else {
            s.style.fontVariationSettings = "'FILL' 0";
            s.style.color = '#d1d5db';
        }
    });
}

// CSS animation dùng chung
if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = `
        .spin-anim { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
}
