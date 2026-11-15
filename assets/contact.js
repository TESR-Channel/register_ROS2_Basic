/* TESR contact widget — floating "แชทกับพนักงาน" button that opens LINE / Messenger / phone / email.
   Same pattern as tesrshop.com. Used on the registration pages (assets/contact.js) and on tesracademy.com (Custom Code footer). */
(function () {
  'use strict';
  if (window.__tesrContact) return; window.__tesrContact = 1;
  if (window.self !== window.top) return;
  var ITEMS = [
    { k: 'line', label: 'www.tesrshop.com/line', href: 'https://www.tesrshop.com/line', bg: '#06C755', aria: 'แชทกับพนักงานทาง LINE',
      svg: '<path fill="#fff" d="M12 3C6.5 3 2 6.6 2 11c0 2.6 1.6 4.9 4 6.4-.2 1.1-.7 2.6-1.6 3.6 1.9-.2 3.9-1 5.3-2.1.8.1 1.5.2 2.3.2 5.5 0 10-3.6 10-8.1S17.5 3 12 3z"/><circle cx="8" cy="11" r="1.4" fill="#06C755"/><circle cx="12" cy="11" r="1.4" fill="#06C755"/><circle cx="16" cy="11" r="1.4" fill="#06C755"/>' },
    { k: 'fb', label: 'ThaiEmbedded', href: 'https://www.messenger.com/t/ThaiEmbedded/', bg: '#1877F2', aria: 'แชทกับพนักงานทาง Facebook Messenger',
      svg: '<path fill="#fff" d="M12 2.5C6.5 2.5 2.2 6.6 2.2 11.8c0 2.8 1.3 5.3 3.4 7v3.7l3.3-1.9c.9.3 2 .4 3.1.4 5.5 0 9.8-4.1 9.8-9.2S17.5 2.5 12 2.5z"/><path fill="#1877F2" d="M7 10.2h10v1.7H7zM7 13.2h7v1.7H7z"/>' },
    { k: 'tel', label: '082-983-7768', href: 'tel:0829837768', bg: '#3FA2F7', aria: 'โทร 082-983-7768',
      svg: '<path fill="#fff" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/>' },
    { k: 'mail', label: 'tesrshop@gmail.com', href: 'mailto:tesrshop@gmail.com', bg: '#F0883E', aria: 'อีเมล tesrshop@gmail.com',
      svg: '<path fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" d="M3.5 6h17v12h-17z"/><path fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" d="M3.5 6.5 12 13l8.5-6.5"/>' }
  ];
  var CSS =
    '.tcw{position:fixed;right:16px;bottom:16px;z-index:9990;font-family:"IBM Plex Sans Thai","Chakra Petch",system-ui,sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:12px}' +
    '.tcw *{box-sizing:border-box}' +
    '.tcw-list{display:flex;flex-direction:column;align-items:flex-end;gap:12px;margin:0;padding:0;list-style:none}' +
    '.tcw-item{display:flex;align-items:center;gap:12px;text-decoration:none!important;opacity:0;transform:translateY(12px) scale(.9);pointer-events:none;transition:opacity .2s ease,transform .25s cubic-bezier(.2,.8,.3,1.2)}' +
    '.tcw.open .tcw-item{opacity:1;transform:none;pointer-events:auto}' +
    '.tcw.open .tcw-item:nth-child(4){transition-delay:0s}.tcw.open .tcw-item:nth-child(3){transition-delay:.04s}.tcw.open .tcw-item:nth-child(2){transition-delay:.08s}.tcw.open .tcw-item:nth-child(1){transition-delay:.12s}' +
    '.tcw-label{background:#1c1c1e;color:#fff;font-size:15px;font-weight:500;line-height:1.2;padding:9px 14px;border-radius:12px;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.25)}' +
    '.tcw-ico{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;box-shadow:0 8px 20px rgba(0,0,0,.28);flex:0 0 auto}' +
    '.tcw-ico svg{width:28px;height:28px}' +
    '.tcw-item:hover .tcw-ico{filter:brightness(1.08)}' +
    '.tcw-main{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;cursor:pointer}' +
    '.tcw-main .tcw-ico{width:60px;height:60px;background:#111;position:relative;border:2px solid rgba(255,255,255,.85)}' +
    '.tcw-main .tcw-ico::before{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid #06C755;animation:tcwPulse 2.4s ease-out infinite}' +
    '.tcw.open .tcw-main .tcw-ico::before{display:none}' +
    '.tcw-main .i-open{display:block}.tcw-main .i-close{display:none}.tcw.open .tcw-main .i-open{display:none}.tcw.open .tcw-main .i-close{display:block}' +
    '.tcw-hint{background:#fff;color:#111;font-weight:700;font-size:14px;line-height:1.25;padding:8px 13px;border-radius:999px;box-shadow:0 8px 22px rgba(0,0,0,.3);white-space:nowrap}' +
    '.tcw-hint small{display:block;font-weight:500;font-size:11.5px;color:#06803a}' +
    '.tcw.open .tcw-hint{display:none}' +
    '.tcw-main:focus-visible,.tcw-item:focus-visible{outline:2px solid #C9A84C;outline-offset:4px;border-radius:999px}' +
    '@keyframes tcwPulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.4);opacity:0}}' +
    '@media (max-width:560px){.tcw{right:12px;bottom:12px}.tcw-hint{animation:tcwHide .5s ease 6s forwards}.tcw-label{font-size:14px}}' +
    '@keyframes tcwHide{to{opacity:0;visibility:hidden;transform:translateX(10px)}}' +
    '@media (prefers-reduced-motion:reduce){.tcw-main .tcw-ico::before{animation:none;opacity:0}.tcw-item{transition:none}}' +
    '@media print{.tcw{display:none}}';
  function build() {
    if (document.querySelector('.tcw')) return;
    if (document.body.classList.contains('editor_enable')) return;
    var st = document.createElement('style'); st.id = 'tcw-style'; st.textContent = CSS; document.head.appendChild(st);
    var w = document.createElement('div'); w.className = 'tcw'; w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'ติดต่อพนักงาน TESR');
    w.innerHTML = '<div class="tcw-list" id="tcwList">' + ITEMS.map(function (it) {
      return '<a class="tcw-item" href="' + it.href + '"' + (/^https?:/.test(it.href) ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + it.aria + '" tabindex="-1">' +
        '<span class="tcw-label">' + it.label + '</span><span class="tcw-ico" style="background:' + it.bg + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + it.svg + '</svg></span></a>';
    }).join('') + '</div>' +
      '<button type="button" class="tcw-main" aria-expanded="false" aria-controls="tcwList" aria-label="เปิดช่องทางติดต่อพนักงาน">' +
      '<span class="tcw-hint">แชทคุยกับพนักงาน<small>LINE โทร อีเมล</small></span>' +
      '<span class="tcw-ico"><svg class="i-open" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 3C6.5 3 2 6.6 2 11c0 2.6 1.6 4.9 4 6.4-.2 1.1-.7 2.6-1.6 3.6 1.9-.2 3.9-1 5.3-2.1.8.1 1.5.2 2.3.2 5.5 0 10-3.6 10-8.1S17.5 3 12 3z"/><circle cx="8" cy="11" r="1.4" fill="#111"/><circle cx="12" cy="11" r="1.4" fill="#111"/><circle cx="16" cy="11" r="1.4" fill="#111"/></svg>' +
      '<svg class="i-close" viewBox="0 0 24 24" aria-hidden="true"><path stroke="#fff" stroke-width="2.4" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg></span></button>';
    document.body.appendChild(w);
    var btn = w.querySelector('.tcw-main'), items = w.querySelectorAll('.tcw-item');
    function set(open) {
      w.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'ปิดช่องทางติดต่อ' : 'เปิดช่องทางติดต่อพนักงาน');
      items.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(!w.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    // hide inside the eLearning fullscreen lesson player (Odoo)
    var hideIf = function () { w.style.display = document.querySelector('.o_wslides_fs_main') ? 'none' : ''; };
    hideIf(); setInterval(hideIf, 1500);
  }
  if (document.readyState !== 'loading') build(); else document.addEventListener('DOMContentLoaded', build);
})();
