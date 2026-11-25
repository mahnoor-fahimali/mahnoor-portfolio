/* =========================================================
   CRÈME BAKERY - script.js (all pages)
   Features: mobile menu, sticky header, scroll-spy, reveal
   animations, menu filter + search, shopping cart with
   checkout (saved in localStorage), form validation,
   "open now" status, toasts and back-to-top.
   NOTE: this is a front-end demo. No payment or server.
   ========================================================= */

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const store = {
    get(k, d) { try { const v = localStorage.getItem('creme_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('creme_' + k, JSON.stringify(v)); } catch (e) { /* blocked */ } }
  };
  const money = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneOk = (v) => /^(03\d{2}-?\d{7}|\+92-?3\d{2}-?\d{7})$/.test(v.trim());

  /* ---------- toast ---------- */
  function toast(msg) {
    let wrap = $('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
  }

  /* ---------- field errors ---------- */
  function setError(input, msg) {
    const f = input.closest('.field');
    if (!f) return;
    f.classList.add('error');
    const e = $('.err', f);
    if (e) e.textContent = msg;
    const clear = () => f.classList.remove('error');
    input.addEventListener('input', clear, { once: true });
    input.addEventListener('change', clear, { once: true });
  }
  const clearErrors = (form) => $$('.field.error', form).forEach((f) => f.classList.remove('error'));

  /* =========================================================
     HEADER, MENU, SCROLL
     ========================================================= */
  function initHeader() {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const body = document.body;

    const onScroll = () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 40);
      const top = $('.to-top');
      if (top) top.classList.toggle('show', window.scrollY > 600);
      spy();
    };

    /* mobile menu */
    const closeNav = () => {
      body.classList.remove('nav-open');
      if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
    };
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
    }
    $$('.nav a').forEach((a) => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeNav(); });

    /* highlight the current page / section */
    const links = $$('.nav a');
    const sections = $$('main section[id]');
    function spy() {
      let current = '';
      if (page === 'index.html' || page === '') {
        sections.forEach((s) => { if (s.getBoundingClientRect().top <= 140) current = s.id; });
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 40) current = 'contact';
      }
      links.forEach((a) => {
        const href = a.getAttribute('href');
        const hash = href.includes('#') ? href.split('#')[1] : '';
        let on = false;
        if (page === 'menu.html') on = a.dataset.page === 'menu.html';
        else if (hash) on = hash === (current === 'best-sellers' || current === 'reviews' || current === 'newsletter' ? '' : current);
        else on = a.dataset.page === 'index.html' && !['about', 'custom', 'contact'].includes(current);
        a.classList.toggle('active', on);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* back to top */
    const top = document.createElement('button');
    top.type = 'button';
    top.className = 'to-top';
    top.setAttribute('aria-label', 'Back to top');
    top.textContent = '↑';
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(top);
    onScroll();
  }

  function initReveal() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$('.card, .feature, .section-title, .t-card, .reveal, .extras').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
      io.observe(el);
    });
  }

  /* =========================================================
     OPEN / CLOSED STATUS (Pakistan time)
     ========================================================= */
  function initOpenStatus() {
    const els = $$('[data-open]');
    if (!els.length) return;
    const hours = { 0: [9, 22], 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [9, 22] };
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const fmt = (h) => (h % 12 || 12) + ':00 ' + (h >= 12 ? 'PM' : 'AM');
    let text, open = false;
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', weekday: 'short', hour: 'numeric', hour12: false, minute: 'numeric' }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      const d = days[get('weekday')];
      const mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
      const [o, c] = hours[d];
      if (mins >= o * 60 && mins < c * 60) { open = true; text = 'Open now · until ' + fmt(c); }
      else if (mins < o * 60) text = 'Closed · opens today at ' + fmt(o);
      else text = 'Closed · opens tomorrow at ' + fmt(hours[(d + 1) % 7][0]);
    } catch (e) { text = 'Mon–Fri 8AM–8PM · Sat–Sun 9AM–10PM'; }
    els.forEach((el) => { el.classList.toggle('is-open', open); $('span', el).textContent = text; });
  }

  /* =========================================================
     MENU: FILTER + SEARCH
     ========================================================= */
  function initMenu() {
    const grid = $('#menu-grid');
    if (!grid) return;
    const cards = $$('.card', grid);
    const buttons = $$('.filter-btn');
    const search = $('#menu-search');
    const empty = $('#menu-empty');
    const count = $('#menu-count');
    let cat = 'all';

    function apply() {
      const q = search.value.trim().toLowerCase();
      let n = 0;
      cards.forEach((c) => {
        const ok = (cat === 'all' || c.dataset.cat === cat) &&
          (!q || (c.dataset.name + ' ' + c.textContent).toLowerCase().includes(q));
        c.hidden = !ok;
        if (ok) { n++; c.classList.add('in'); }
      });
      empty.hidden = n !== 0;
      count.textContent = 'Showing ' + n + ' of ' + cards.length + ' items';
    }
    buttons.forEach((b) => b.addEventListener('click', () => {
      buttons.forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      cat = b.dataset.filter;
      apply();
    }));
    search.addEventListener('input', apply);

    /* open a category from the link, e.g. menu.html#cakes */
    const wanted = location.hash.replace('#', '');
    const btn = buttons.find((b) => b.dataset.filter === wanted);
    if (btn) btn.click(); else apply();
  }

  /* =========================================================
     CART
     ========================================================= */
  function initCart() {
    let cart = store.get('cart', []);
    let view = 'cart';

    /* build the drawer once */
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Shopping cart');
    drawer.innerHTML =
      '<div class="drawer-head"><h3 id="drawer-title">Your Cart</h3><button class="icon-btn" type="button" aria-label="Close cart">✕</button></div>' +
      '<div class="drawer-body"></div><div class="drawer-foot"></div>';
    document.body.append(overlay, drawer);
    const body = $('.drawer-body', drawer);
    const foot = $('.drawer-foot', drawer);
    const title = $('#drawer-title', drawer);
    const cartBtn = $('.cart-btn');

    const count = () => cart.reduce((s, i) => s + i.qty, 0);
    const total = () => cart.reduce((s, i) => s + i.qty * i.price, 0);
    const save = () => store.set('cart', cart);

    function badge() {
      const n = count();
      const b = $('.cart-count');
      if (b) { b.textContent = n; b.dataset.n = n; }
    }

    function render() {
      badge();
      if (view === 'checkout') return renderCheckout();
      if (view === 'done') return;
      title.textContent = 'Your Cart';
      if (!cart.length) {
        body.innerHTML = '<div class="cart-empty"><div class="big">🧁</div><h4>Your cart is empty</h4><p>Add something sweet from our menu.</p></div>';
        foot.innerHTML = '<a class="btn btn-primary" href="menu.html">Browse the Menu</a>';
        return;
      }
      body.innerHTML = cart.map((i) =>
        '<div class="cart-item" data-id="' + esc(i.id) + '">' +
        '<img src="' + esc(i.img) + '" alt="" width="70" height="70">' +
        '<div><h4>' + esc(i.name) + '</h4><small>' + money(i.price) + '</small>' +
        '<div class="qty"><button type="button" data-act="dec" aria-label="Decrease quantity">−</button><span>' + i.qty + '</span><button type="button" data-act="inc" aria-label="Increase quantity">+</button></div></div>' +
        '<div style="text-align:right"><strong>' + money(i.qty * i.price) + '</strong><br><button class="remove" type="button" data-act="rm">Remove</button></div></div>'
      ).join('');
      foot.innerHTML =
        '<div class="sum"><span>Subtotal</span><span>' + money(total()) + '</span></div>' +
        '<p class="note">Delivery is confirmed when we call you about your order.</p>' +
        '<button class="btn btn-primary" type="button" data-act="checkout">Checkout</button>';
    }

    function renderCheckout() {
      title.textContent = 'Checkout';
      body.innerHTML =
        '<form class="form" id="checkout-form" novalidate style="margin-top:14px">' +
        '<div class="field"><label for="k-name">Full name</label><input id="k-name" type="text" autocomplete="name"><span class="err"></span></div>' +
        '<div class="field"><label for="k-phone">Phone</label><input id="k-phone" type="tel" autocomplete="tel" placeholder="03XX-XXXXXXX"><span class="err"></span></div>' +
        '<div class="field"><label for="k-addr">Delivery address</label><textarea id="k-addr" style="min-height:90px"></textarea><span class="err"></span></div>' +
        '<div class="field"><label for="k-note">Notes (optional)</label><input id="k-note" type="text" placeholder="Gift message, allergies…"></div></form>';
      foot.innerHTML =
        '<div class="sum"><span>Total</span><span>' + money(total()) + '</span></div>' +
        '<p class="note">Demo checkout: no payment is taken.</p>' +
        '<button class="btn btn-primary" type="button" data-act="place">Place Order</button>' +
        '<button class="btn btn-outline" type="button" data-act="back" style="margin-top:10px">Back to cart</button>';
      const saved = store.get('customer', {});
      $('#k-name').value = saved.name || '';
      $('#k-phone').value = saved.phone || '';
      $('#k-addr').value = saved.address || '';
    }

    function placeOrder() {
      const form = $('#checkout-form');
      clearErrors(form);
      const name = $('#k-name'), phone = $('#k-phone'), addr = $('#k-addr');
      let ok = true;
      const fail = (el, m) => { if (ok) el.focus(); setError(el, m); ok = false; };
      if (name.value.trim().length < 2) fail(name, 'Please enter your name.');
      if (!phoneOk(phone.value)) fail(phone, 'Use a mobile number like 0300-1234567.');
      if (addr.value.trim().length < 8) fail(addr, 'Please enter your full address.');
      if (!ok) return;
      store.set('customer', { name: name.value.trim(), phone: phone.value.trim(), address: addr.value.trim() });
      const id = 'CR-' + String(Math.floor(1000 + Math.random() * 9000));
      const sum = money(total());
      cart = [];
      save();
      view = 'done';
      badge();
      title.textContent = 'Order Placed';
      body.innerHTML = '<div class="success-box" style="margin-top:20px"><div style="font-size:3rem">🎉</div><h3>Thank you, ' + esc(name.value.trim().split(' ')[0]) + '!</h3>' +
        '<p>Your order <strong>' + id + '</strong> (' + sum + ') is received. We will call you shortly to confirm.</p></div>';
      foot.innerHTML = '<button class="btn btn-primary" type="button" data-act="close">Continue Browsing</button>';
    }

    function open() {
      if (view === 'done') view = 'cart';
      render();
      document.body.classList.add('cart-open');
      document.body.classList.remove('nav-open');
      setTimeout(() => $('.icon-btn', drawer).focus(), 50);
    }
    function close() {
      document.body.classList.remove('cart-open');
      if (view !== 'cart') { view = 'cart'; render(); }
      if (cartBtn) cartBtn.focus();
    }

    function add(card) {
      const id = card.dataset.id;
      const found = cart.find((i) => i.id === id);
      if (found) found.qty++;
      else cart.push({ id, name: card.dataset.name, price: Number(card.dataset.price), img: card.dataset.img, qty: 1 });
      save(); badge();
      toast(card.dataset.name + ' added to cart');
      if (cartBtn) { cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump'); }
    }

    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-btn');
      if (addBtn) { add(addBtn.closest('.card')); return; }
      if (e.target.closest('.cart-btn')) { open(); return; }
      if (e.target === overlay || e.target.closest('.drawer-head .icon-btn')) { close(); return; }

      const act = e.target.closest('[data-act]');
      if (!act || !drawer.contains(act)) return;
      const row = act.closest('.cart-item');
      const item = row && cart.find((i) => i.id === row.dataset.id);
      switch (act.dataset.act) {
        case 'inc': item.qty++; break;
        case 'dec': item.qty = Math.max(1, item.qty - 1); break;
        case 'rm': cart = cart.filter((i) => i !== item); break;
        case 'checkout': view = 'checkout'; break;
        case 'back': view = 'cart'; break;
        case 'place': placeOrder(); return;
        case 'close': close(); return;
      }
      save();
      render();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('cart-open')) close(); });
    render();
  }

  /* =========================================================
     FORMS (home page)
     ========================================================= */
  function initForms() {
    /* custom cake request */
    const form = $('#custom-form');
    if (form) {
      const date = $('#c-date');
      const t = new Date(); t.setDate(t.getDate() + 1);
      date.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
      const saved = store.get('customer', null);
      if (saved) { $('#c-name').value = saved.name || ''; $('#c-phone').value = saved.phone || ''; }

      $('#c-phone').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d+-]/g, '').slice(0, 15);
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(form);
        const name = $('#c-name'), phone = $('#c-phone'), type = $('#c-type'), msg = $('#c-msg');
        let ok = true;
        const fail = (el, m) => { if (ok) el.focus(); setError(el, m); ok = false; };
        if (name.value.trim().length < 2) fail(name, 'Please enter your name.');
        if (!phoneOk(phone.value)) fail(phone, 'Use a mobile number like 0300-1234567.');
        if (!type.value) fail(type, 'Please choose an occasion.');
        if (!date.value) fail(date, 'Please pick a date.');
        else if (date.value < date.min) fail(date, 'Please choose a future date.');
        if (msg.value.trim().length < 10) fail(msg, 'Tell us a little more (10+ characters).');
        if (!ok) return;
        const first = esc(name.value.trim().split(' ')[0]);
        form.outerHTML = '<div class="success-box" role="status"><div style="font-size:2.6rem">🎂</div><h3>Thank you, ' + first + '!</h3>' +
          '<p>We received your request and will call you soon to plan your cake.</p></div>';
      });
    }

    /* newsletter */
    const news = $('#news-form');
    if (news) {
      const input = $('#n-email');
      const msg = $('#news-msg');
      news.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = input.value.trim();
        if (!emailOk(v)) {
          msg.textContent = 'Please enter a valid email address.';
          msg.style.color = '#b5525f';
          input.focus();
          return;
        }
        const list = store.get('subscribers', []);
        if (!list.includes(v.toLowerCase())) list.push(v.toLowerCase());
        store.set('subscribers', list);
        msg.textContent = 'Thank you! You are on the list 🎉';
        msg.style.color = '#4a3e34';
        input.value = '';
      });
    }
  }

  /* =========================================================
     BOOT
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    initHeader();
    initOpenStatus();
    initMenu();
    initCart();
    initForms();
    initReveal();
  });
})();
