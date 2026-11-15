/* TESR Academy — group registration: add several attendees, live total, one Google Sheet row per attendee.
   The Apps Script backend is unchanged: each attendee is sent as its own POST (same fields as before),
   every row gets the payment slip link, and the receipt-address column carries a group note with the total. */
(function () {
  'use strict';
  var C = window.TESR_COURSE || { price: 6420, promo: 5350 };
  var MAX = 20;
  var form = document.getElementById('regForm');
  var list = document.getElementById('attList');
  var addBtn = document.getElementById('attAdd');
  if (!form || !list || !addBtn) return;
  var SCRIPT_URL = form.getAttribute('data-script');
  var statusEl = document.getElementById('status');
  var submitBtn = document.getElementById('submitBtn');
  var fileInput = document.getElementById('payment_proof');
  var fileNameDisplay = document.getElementById('fileNameDisplay');
  var baht = function (n) { return Number(n).toLocaleString('en-US'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };

  function card(i) {
    var main = i === 0;
    var el = document.createElement('fieldset');
    el.className = 'att';
    el.innerHTML =
      '<legend><span class="att-no"></span>' + (main ? ' <small>(ผู้ติดต่อหลัก)</small>' : '') + '</legend>' +
      (main ? '' : '<button type="button" class="att-del" aria-label="ลบผู้เข้าอบรมท่านนี้">ลบ</button>') +
      '<label>ชื่อ-นามสกุล ภาษาไทย <span class="req">*</span></label><input type="text" data-k="name_th" required autocomplete="' + (main ? 'name' : 'off') + '">' +
      '<label>ชื่อ-นามสกุล ภาษาอังกฤษ <span class="req">*</span></label><input type="text" data-k="name_en" required autocomplete="off">' +
      '<label>เบอร์โทรติดต่อ ' + (main ? '<span class="req">*</span>' : '<small class="opt">(ไม่บังคับ ถ้าเว้นว่างใช้ของผู้ติดต่อหลัก)</small>') + '</label><input type="tel" data-k="phone"' + (main ? ' required autocomplete="tel"' : ' autocomplete="off"') + '>' +
      '<label>Email Address ' + (main ? '<span class="req">*</span>' : '<small class="opt">(ไม่บังคับ ถ้าเว้นว่างใช้ของผู้ติดต่อหลัก)</small>') + '</label><input type="email" data-k="email"' + (main ? ' required autocomplete="email"' : ' autocomplete="off"') + '>';
    var del = el.querySelector('.att-del');
    if (del) del.addEventListener('click', function () { el.remove(); refresh(); addBtn.focus(); });
    return el;
  }
  function cards() { return Array.prototype.slice.call(list.querySelectorAll('fieldset.att')); }
  function refresh() {
    var cs = cards(), n = cs.length;
    cs.forEach(function (c, i) { c.querySelector('.att-no').textContent = 'ผู้เข้าอบรมท่านที่ ' + (i + 1); });
    addBtn.hidden = n >= MAX;
    var t = document.getElementById('payTotal');
    if (t) t.innerHTML =
      '<div class="pt-head">ยอดที่ต้องชำระ <b>' + n + ' ท่าน</b></div>' +
      '<div class="pt-row"><span>ช่วงโปรโมชั่น ' + n + ' × ' + baht(C.promo) + '</span><b>' + baht(n * C.promo) + ' บาท</b></div>' +
      '<div class="pt-row muted"><span>หลังหมดโปรโมชั่น ' + n + ' × ' + baht(C.price) + '</span><b>' + baht(n * C.price) + ' บาท</b></div>' +
      '<div class="pt-note">ราคารวม VAT แล้ว โอนครั้งเดียวรวมทุกท่าน แล้วแนบสลิปด้านล่าง</div>';
    var lbl = document.getElementById('slipLabel');
    if (lbl) lbl.innerHTML = 'แนบหลักฐานการโอนเงิน' + (n > 1 ? ' (ยอดรวม ' + n + ' ท่าน)' : '') + ' <span class="req">*</span>';
    submitBtn.textContent = n > 1 ? 'ส่งแบบฟอร์มลงทะเบียน ' + n + ' ท่าน' : 'ส่งแบบฟอร์มลงทะเบียน';
  }
  function reset() { list.innerHTML = ''; list.appendChild(card(0)); refresh(); }
  addBtn.addEventListener('click', function () {
    if (cards().length >= MAX) return;
    var c = card(cards().length); list.appendChild(c); refresh();
    c.querySelector('input').focus();
  });
  reset();
  window.TESR_ATTENDEES = function () { return cards().map(function (c) { return c.querySelector('[data-k=name_th]').value.trim(); }).filter(Boolean); };

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) { var r = new FileReader(); r.onload = function () { resolve(String(r.result).split(',')[1]); }; r.onerror = reject; r.readAsDataURL(file); });
  }
  function say(msg, cls) { statusEl.className = cls || ''; statusEl.textContent = msg; }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var people = cards().map(function (c) {
      var o = {}; c.querySelectorAll('[data-k]').forEach(function (i) { o[i.getAttribute('data-k')] = i.value.trim(); }); return o;
    });
    var n = people.length, lead = people[0];
    var file = fileInput.files[0];
    submitBtn.disabled = true; addBtn.disabled = true;
    try {
      if (!file) throw new Error('กรุณาแนบหลักฐานการโอนเงิน');
      if (file.size > 10 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 10 MB');
      say('กำลังเตรียมไฟล์...');
      var b64 = await fileToBase64(file);
      var shared = {
        receipt_address: form.elements.receipt_address.value.trim(),
        expectation: form.elements.expectation.value.trim(),
        networking_intro: form.elements.networking_intro.value.trim()
      };
      var note = n > 1 ? '[ลงทะเบียนกลุ่ม ' + n + ' ท่าน: ' + people.map(function (p) { return p.name_th; }).join(', ') +
        ' | ผู้ติดต่อหลัก ' + lead.name_th + ' ' + lead.phone + ' | ยอดโปรโมชั่น ' + baht(n * C.promo) + ' บาท / ปกติ ' + baht(n * C.price) + ' บาท]\n' : '';
      for (var i = 0; i < n; i++) {
        var p = people[i];
        say('กำลังส่งข้อมูล' + (n > 1 ? ' ท่านที่ ' + (i + 1) + '/' + n : '') + ' กรุณารอสักครู่...');
        var payload = {
          name_th: p.name_th, name_en: p.name_en,
          phone: p.phone || lead.phone, email: p.email || lead.email,
          receipt_address: note + shared.receipt_address,
          expectation: i === 0 ? shared.expectation : '',
          networking_intro: i === 0 ? shared.networking_intro : '',
          fileName: file.name, fileMimeType: file.type, fileBase64: b64
        };
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
      }
      say('✓ ลงทะเบียนสำเร็จ ' + n + ' ท่าน ขอบคุณที่สมัครเข้าร่วมอบรม', 'ok');
      var intro = document.querySelector('#successModal .intro');
      if (intro) {
        var g = intro.querySelector('.grp'); if (!g) { g = document.createElement('div'); g.className = 'grp'; intro.prepend(g); }
        g.innerHTML = n > 1 ? '<b>ลงทะเบียนเรียบร้อย ' + n + ' ท่าน:</b> ' + people.map(function (p) { return esc(p.name_th); }).join(', ') + '<br>ทุกท่านทำขั้นตอนเข้าเรียน Online ด้านล่างได้เลย<br><br>' : '';
      }
      document.getElementById('successModal').classList.add('show');
      form.reset(); reset();
      fileNameDisplay.textContent = 'ยังไม่ได้เลือกไฟล์';
    } catch (err) {
      say('✗ เกิดข้อผิดพลาด: ' + err.message + (i > 0 ? ' (ส่งสำเร็จแล้ว ' + i + ' ท่าน กรุณาแจ้งทีมงานทาง LINE)' : ''), 'err');
    } finally {
      submitBtn.disabled = false; addBtn.disabled = false;
    }
  });
})();
