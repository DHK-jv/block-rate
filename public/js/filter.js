document.addEventListener('DOMContentLoaded', function () {
    var filterBtns = document.querySelectorAll('.filter-btn')
    var productGrid = document.getElementById('productGrid')

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {

            filterBtns.forEach(function (b) {
                b.classList.remove('bg-primary')
                b.classList.remove('text-white')
                b.classList.add('bg-surface-container-low')
                b.classList.add('text-secondary')
            })
            btn.classList.add('bg-primary')
            btn.classList.add('text-white')
            btn.classList.remove('bg-surface-container-low')
            btn.classList.remove('text-secondary')

            var category = btn.dataset.category
            console.log('category clicked:', category) // ← kiểm tra

            productGrid.innerHTML = '<div class="text-center py-5 w-100">Đang tải...</div>'

            var url = '/?category=' + category
            console.log('fetch url:', url) // ← kiểm tra

            fetch(url, {
                headers: { 'Accept': 'application/json' }
            })
                .then(function (res) {
                    console.log('response status:', res.status) // ← kiểm tra
                    return res.json()
                })
                .then(function (data) {
                    console.log('data:', data) // ← kiểm tra
                    if (!data.success || !data.products.length) {
                        productGrid.innerHTML = '<p class="text-secondary text-center py-5 w-100">Không có sản phẩm nào</p>'
                        return
                    }
                    var html = ''
                    data.products.forEach(function (p) {
                        var safePrice = p.price.toLocaleString('vi-VN') + 'đ'
                        var safeOldPrice = p.oldPrice ? p.oldPrice.toLocaleString('vi-VN') + 'đ' : ''
                        var badgeHtml = p.badge ? '<span class="product-badge badge-' + p.badge + '">' + p.badge.toUpperCase() + '</span>' : ''
                        var brandHtml = p.brand ? '<span class="badge bg-light text-muted fw-bold fs-9 px-2">' + p.brand + '</span>' : ''
                        
                        var stars = ""
                        var rating = Math.round(p.rating || 0)
                        for(var i=1; i<=5; i++){
                            stars += i <= rating ? '<span class="star-filled">★</span>' : '<span class="star-empty">★</span>'
                        }

                        html += '<div class="col product-card" data-category="' + p.category + '">'
                        html += '  <div class="product-card-inner">'
                        html += '    <div class="product-card__img-container">'
                        html += '      <div class="ratio ratio-1x1">'
                        html += '        <img class="w-100 h-100 object-fit-cover" src="' + p.image + '" alt="' + p.name + '" loading="lazy" onerror="this.src=\'https://placehold.co/400x400/f1f5f9/94a3b8?text=No+Image\'">'
                        html += '      </div>'
                        html +=        badgeHtml
                        html += '    </div>'
                        html += '    <div class="card-body">'
                        html += '      <div class="d-flex align-items-center gap-1 mb-2">'
                        html += '        <span class="badge bg-light text-muted fw-bold fs-9 text-uppercase px-2">' + p.category + '</span>'
                        html +=          brandHtml
                        html += '      </div>'
                        html += '      <h3 class="product-card-title">' + p.name + '</h3>'
                        html += '      <div class="product-card-meta">'
                        html += '        <div class="d-flex align-items-center gap-1">'
                        html +=           stars
                        html += '          <span class="text-muted fs-9 ms-1">(' + (p.reviews || 0) + ' Reviews)</span>'
                        html += '        </div>'
                        html += '      </div>'
                        html += '      <div class="card-footer-custom">'
                        html += '        <div class="d-flex justify-content-between align-items-center">'
                        html += '          <div class="price-block">'
                        html += '            <div class="product-price">' + safePrice + '</div>'
                        if(safeOldPrice) html += '            <div class="product-old-price">' + safeOldPrice + '</div>'
                        html += '          </div>'
                        html += '          <a class="btn-detail" href="/product/' + p._id + '" title="Xem chi tiết">'
                        html += '            <span class="material-symbols-outlined" style="font-size:20px">chevron_right</span>'
                        html += '          </a>'
                        html += '        </div>'
                        html += '      </div>'
                        html += '    </div>'
                        html += '  </div>'
                        html += '</div>'
                    })
                    productGrid.innerHTML = html
                })
                .catch(function (err) {
                    console.log('fetch error:', err) // ← kiểm tra
                    productGrid.innerHTML = '<p class="text-danger text-center py-5 w-100">Lỗi tải sản phẩm</p>'
                })
        })
    })
})