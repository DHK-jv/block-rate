function showToast(message, type) {
  var color = type === 'error' ? '#dc3545' : '#198754'
  var icon = type === 'error' ? 'error' : 'check_circle'

  var container = document.createElement('div')
  container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999'
  container.innerHTML =
    '<div style="background:' + color + ';color:white;padding:12px 20px;border-radius:12px;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500">' +
    '<span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:\'FILL\' 1">' + icon + '</span>' +
    '<span>' + message + '</span>' +
    '</div>'

  document.body.appendChild(container)
  setTimeout(function() { container.remove() }, 3000)
}