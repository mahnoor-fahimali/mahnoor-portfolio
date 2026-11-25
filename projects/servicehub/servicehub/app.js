/* =========================================================
   SERVICEHUB - app.js
   One JavaScript file for every page. Each page gets only
   the code it needs (see the "BOOT" section at the bottom).
   Data is kept in the browser (localStorage) as a front-end
   demo, so there is no real server or real login.
   ========================================================= */

(function () {
    'use strict';

    /* ---------- tiny helpers ---------- */

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    const store = {
        get(key, fallback) {
            try {
                const v = localStorage.getItem('sh_' + key);
                return v ? JSON.parse(v) : fallback;
            } catch (e) { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem('sh_' + key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
        },
        del(key) {
            try { localStorage.removeItem('sh_' + key); } catch (e) { /* storage blocked */ }
        }
    };

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

    const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const phoneOk = (v) => /^03\d{2}-?\d{7}$/.test(v);

    const nameFromEmail = (email) =>
        email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    function fmtDate(iso) {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function fmtTime(t) {
        const [h, m] = t.split(':').map(Number);
        return String((h % 12) || 12).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM');
    }

    function todayISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /* service categories: [name used in the booking form, keywords to look for] */
    const CATEGORIES = [
        ['Plumbing', ['plumb']],
        ['Home Cleaning', ['clean']],
        ['Electrical', ['electric']],
        ['Beauty & Salon', ['beauty', 'salon']],
        ['AC Repair', ['ac repair', 'air condition']],
        ['Painting', ['paint']]
    ];

    function findCategory(text) {
        const t = clean(text).toLowerCase();
        if (!t) return null;
        return CATEGORIES.find((c) => {
            const name = c[0].toLowerCase();
            return name.includes(t) || t.includes(name) || c[1].some((k) => t.includes(k));
        }) || null;
    }

    /* ---------- toast messages ---------- */

    function toast(message, type) {
        let wrap = $('.sh-toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'sh-toast-wrap';
            wrap.setAttribute('aria-live', 'polite');
            document.body.appendChild(wrap);
        }
        const t = document.createElement('div');
        t.className = 'sh-toast sh-' + (type || 'success');
        t.textContent = message;
        wrap.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 3200);
    }

    /* ---------- form validation helpers ---------- */

    function clearErr(el) {
        el.classList.remove('is-invalid');
        const host = el.closest('.input-wrap') || el;
        const next = host.nextElementSibling;
        if (next && next.classList.contains('invalid-feedback')) next.remove();
    }

    function setErr(el, message) {
        clearErr(el);
        el.classList.add('is-invalid');
        const msg = document.createElement('div');
        msg.className = 'invalid-feedback';
        msg.textContent = message;
        (el.closest('.input-wrap') || el).after(msg);
        el.addEventListener('input', () => clearErr(el), { once: true });
        el.addEventListener('change', () => clearErr(el), { once: true });
    }

    function formatPhone(el) {
        el.addEventListener('input', () => {
            const digits = el.value.replace(/\D/g, '').slice(0, 11);
            el.value = digits.length > 4 ? digits.slice(0, 4) + '-' + digits.slice(4) : digits;
        });
    }

    function addPasswordToggle(input) {
        const wrap = document.createElement('div');
        wrap.className = 'input-wrap position-relative';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
        input.classList.add('has-toggle');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pw-toggle';
        btn.setAttribute('aria-label', 'Show password');
        btn.textContent = '👁';
        btn.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.textContent = show ? '🙈' : '👁';
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
        wrap.appendChild(btn);
    }

    function busyButton(btn, text) {
        btn.disabled = true;
        btn.dataset.label = btn.textContent;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>' + text;
    }

    /* =========================================================
       ALL PAGES
       ========================================================= */

    function initCommon() {
        /* highlight the link of the page you are on */
        $$('.nav-link').forEach((a) => {
            const target = (a.getAttribute('href') || '').split('?')[0].toLowerCase();
            if (target === page) a.classList.add('active-link');
        });

        /* our own friendly error messages replace the browser's default pop-ups */
        $$('form').forEach((f) => { if (!f.closest('.hero-card')) f.noValidate = true; });

        /* logout clears the saved user */
        $$('.nav-link').forEach((a) => {
            if (/logout/i.test(a.textContent)) a.addEventListener('click', () => store.del('user'));
        });

        /* close the mobile menu after choosing a link */
        const menu = $('#navbarMenu');
        const toggler = $('.navbar-toggler');
        if (menu && toggler) {
            $$('.nav-link, .navbar-nav .btn', menu).forEach((a) => {
                a.addEventListener('click', () => {
                    if (menu.classList.contains('show')) toggler.click();
                });
            });
        }

        /* shadow on the navbar once you scroll */
        const nav = $('.navbar');
        const onScroll = () => {
            if (nav) nav.classList.toggle('nav-scrolled', window.scrollY > 10);
            const top = $('.back-to-top');
            if (top) top.classList.toggle('show', window.scrollY > 500);
        };

        /* back to top button */
        const top = document.createElement('button');
        top.type = 'button';
        top.className = 'back-to-top';
        top.setAttribute('aria-label', 'Back to top');
        top.textContent = '↑';
        top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(top);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        /* gentle fade-in for cards */
        if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((en) => {
                    if (en.isIntersecting) {
                        en.target.classList.add('in');
                        io.unobserve(en.target);
                    }
                });
            }, { threshold: 0.08 });
            $$('.service-card, .provider-card, .dashboard-card, .step-card, .info-item').forEach((el) => {
                el.classList.add('reveal');
                io.observe(el);
            });
        }

        /* remember which provider card was opened */
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href="provider-details.html"]');
            const card = link && link.closest('.provider-card');
            if (card) store.set('selectedProvider', extractProvider(card));
        });
    }

    /* read the details of one provider card */
    function extractProvider(card) {
        const text = clean(card.textContent);
        const small = $$('p.small', card).find((p) => p.textContent.includes('📍'));
        const tagline = $('p.text-muted', card);
        const rating = $('.rating + strong', card);
        const reviews = text.match(/\((\d+)\s*reviews\)/i);
        const exp = text.match(/(\d+)\s*(?:years|yrs)/i);
        const stars = $('.rating', card);
        return {
            name: clean($('h5', card).textContent),
            tagline: tagline ? clean(tagline.textContent) : '',
            location: small ? clean(small.textContent.replace('📍', '')) : '',
            experience: exp ? exp[1] : '',
            rating: rating ? clean(rating.textContent) : '',
            stars: stars ? clean(stars.textContent) : '★★★★★',
            reviews: reviews ? reviews[1] : '',
            price: $('.price', card) ? clean($('.price', card).textContent.replace(/^from\s*/i, '')) : '',
            avatar: $('.provider-avatar', card) ? clean($('.provider-avatar', card).textContent) : '👨‍🔧',
            verified: !!$('.badge', card)
        };
    }

    /* =========================================================
       HOME PAGE (index.html)
       ========================================================= */

    function initHome() {
        const form = $('.hero-card form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const service = $('select', form).value;
                const place = clean($('input[type="text"]', form).value);
                if (!service || !place) return;
                location.href = 'providers.html?service=' + encodeURIComponent(service) +
                    '&location=' + encodeURIComponent(place);
            });
        }

        /* service tiles open the providers page already filtered */
        $$('.service-card').forEach((card) => {
            const link = card.closest('a');
            const h6 = $('h6', card);
            if (link && h6) link.href = 'providers.html?service=' + encodeURIComponent(clean(h6.textContent));
        });
    }

    /* =========================================================
       PROVIDERS PAGE (providers.html)
       ========================================================= */

    function initProviders() {
        const box = $('.search-box');
        if (!box) return;
        const input = $('input[type="search"]', box);
        const select = $('select', box);
        const button = $('button', box);
        const note = $('p.small', box);
        const cols = $$('.provider-card').map((c) => c.closest('[class*="col-"]'));
        if (!cols.length) return;
        const grid = cols[0].parentElement;
        const params = new URLSearchParams(location.search);
        const place = clean(params.get('location') || '');

        const empty = document.createElement('div');
        empty.className = 'empty-state text-center';
        empty.hidden = true;
        empty.innerHTML = '<div class="empty-icon">🔍</div><h5 class="fw-bold">No providers found</h5>' +
            '<p class="text-muted">Try a different name or choose another category.</p>' +
            '<button type="button" class="btn btn-outline-primary">Clear filters</button>';
        grid.after(empty);

        /* choose the category from the link, e.g. providers.html?service=Plumbing */
        const wanted = findCategory(params.get('service'));
        if (wanted) {
            const opt = $$('option', select).find((o) => findCategory(o.textContent) === wanted);
            if (opt) select.value = opt.value;
        }

        /* providers near the typed location are shown first */
        if (place) {
            const tokens = place.toLowerCase().split(/[,\s]+/).filter((t) => t.length > 2);
            cols.slice().sort((a, b) => {
                const score = (el) => tokens.some((t) => el.textContent.toLowerCase().includes(t)) ? 1 : 0;
                return score(b) - score(a);
            }).forEach((c) => grid.appendChild(c));
        }

        function apply() {
            const q = clean(input.value).toLowerCase();
            const cat = findCategory(select.selectedIndex > 0 ? select.value : '');
            let shown = 0;
            cols.forEach((col) => {
                const text = clean(col.textContent).toLowerCase();
                const name = clean($('h5', col).textContent).toLowerCase();
                const matchQ = !q || name.includes(q);
                const matchCat = !cat || cat[1].some((k) => text.includes(k));
                const visible = matchQ && matchCat;
                col.hidden = !visible;
                if (visible) shown++;
            });
            empty.hidden = shown !== 0;
            if (note) {
                note.textContent = 'Showing ' + shown + ' of ' + cols.length + ' providers' +
                    (place ? ' · closest to ' + place + ' first' : '') + '.';
            }
        }

        input.addEventListener('input', apply);
        select.addEventListener('change', apply);
        button.addEventListener('click', (e) => { e.preventDefault(); apply(); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
        $('button', empty).addEventListener('click', () => {
            input.value = '';
            select.selectedIndex = 0;
            apply();
        });
        apply();
    }

    /* =========================================================
       PROVIDER PROFILE (provider-details.html)
       ========================================================= */

    function initProviderDetails() {
        const p = store.get('selectedProvider', null);
        if (!p) return;
        const box = $('.profile-box');
        if (!box) return;

        document.title = p.name + ' | ServiceHub';
        $('h2', box).textContent = p.name;
        const sub = $('p.fs-5', box);
        if (sub) sub.textContent = p.tagline;
        const av = $('.profile-avatar-large', box);
        if (av) av.textContent = p.avatar;

        const badge = $('.badge', box);
        if (badge && !p.verified) badge.style.display = 'none';

        const stars = $('.rating', box);
        if (stars && p.stars) stars.textContent = p.stars;
        const score = $('.rating + strong', box);
        if (score && p.rating) score.textContent = p.rating;
        const count = score && score.nextElementSibling;
        if (count) count.textContent = p.reviews ? '· ' + p.reviews + ' reviews' : '· Rated by customers';

        const desc = $$('p.text-muted', box).find((el) => !el.classList.contains('fs-5'));
        if (desc) {
            desc.textContent = p.name + ' offers reliable ' + p.tagline.toLowerCase() + ' for homes and small businesses' +
                (p.location ? ' around ' + p.location : '') + '. Clear communication, fair pricing and tidy, professional work.';
        }

        const values = $$('.info-item strong', box);
        const cat = findCategory(p.tagline);
        if (values[0]) values[0].textContent = cat ? cat[0] : p.tagline;
        if (values[1] && p.location) values[1].textContent = p.location;
        if (values[2] && p.experience) values[2].textContent = p.experience + ' Years';
        if (values[3] && p.price) values[3].textContent = p.price;

        /* the sample reviews belong to Ahmed Plumbing only */
        if (!/ahmed/i.test(p.name)) {
            const reviews = $('.mt-5 .row');
            if (reviews) {
                reviews.innerHTML = '<div class="col-12"><div class="empty-state text-center">' +
                    '<div class="empty-icon">⭐</div><p class="text-muted mb-0">Reviews appear here after customers complete a booking.</p></div></div>';
            }
        }
    }

    /* =========================================================
       BOOKING PAGE (booking.html)
       ========================================================= */

    function initBooking() {
        const form = $('form');
        if (!form) return;
        const bookings = store.get('bookings', []);
        const provider = store.get('selectedProvider', null);
        const user = store.get('user', null);

        const service = $('select', form);
        const date = $('input[type="date"]', form);
        const time = $('input[type="time"]', form);
        const [placeField, nameField] = $$('input[type="text"]', form);
        const desc = $('textarea', form);
        const phone = $('input[type="tel"]', form);

        /* a new, unique booking number */
        const id = 'BK-2026-' + String(101 + bookings.length).padStart(3, '0');
        const badge = $('.badge', form.closest('.form-box'));
        if (badge) badge.textContent = 'Booking ID: ' + id;

        date.min = todayISO();
        formatPhone(phone);
        if (user) {
            if (user.name) nameField.value = user.name;
            if (user.phone) phone.value = user.phone;
        }

        /* the provider chosen on the profile page */
        if (provider) {
            const cat = findCategory(provider.tagline);
            if (cat) {
                const opt = $$('option', service).find((o) => clean(o.textContent) === cat[0]);
                if (opt) service.value = opt.value || clean(opt.textContent);
            }
            const info = document.createElement('div');
            info.className = 'alert alert-success d-flex justify-content-between align-items-center flex-wrap gap-2';
            info.innerHTML = '<span>Booking with <strong>' + esc(provider.name) + '</strong></span>' +
                '<a href="providers.html" class="small">Choose someone else</a>';
            form.before(info);
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let ok = true;
            const fail = (el, msg) => { if (ok) el.focus(); setErr(el, msg); ok = false; };

            if (!service.value) fail(service, 'Please choose a service.');
            if (!date.value) fail(date, 'Please pick a date.');
            else if (date.value < todayISO()) fail(date, 'The date cannot be in the past.');
            if (!time.value) fail(time, 'Please pick a time.');
            else if (date.value === todayISO()) {
                const now = new Date();
                const [h, m] = time.value.split(':').map(Number);
                if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) fail(time, 'Please choose a time later today.');
            }
            if (clean(placeField.value).length < 5) fail(placeField, 'Please enter the full address.');
            if (clean(desc.value).length < 10) fail(desc, 'Please describe the job in a few words (10+ characters).');
            if (clean(nameField.value).length < 2) fail(nameField, 'Please enter your name.');
            if (!phoneOk(phone.value)) fail(phone, 'Use a Pakistani mobile number like 0300-1234567.');
            if (!ok) return;

            bookings.unshift({
                id: id,
                service: service.value || clean(service.selectedOptions[0].textContent),
                provider: provider ? provider.name : 'Any available provider',
                date: date.value,
                time: time.value,
                location: clean(placeField.value),
                description: clean(desc.value),
                name: clean(nameField.value),
                phone: phone.value,
                status: 'Pending'
            });
            store.set('bookings', bookings);
            store.del('selectedProvider');
            busyButton($('button[type="submit"]', form), 'Sending request…');
            toast('Booking request sent! 🎉');
            setTimeout(() => { location.href = 'customer-dashboard.html'; }, 1200);
        });
    }

    /* =========================================================
       CUSTOMER DASHBOARD (customer-dashboard.html)
       ========================================================= */

    const STATUS_CLASS = {
        'Pending': 'status-pending',
        'In Progress': 'status-progress',
        'Completed': 'status-completed',
        'Rejected': 'status-rejected',
        'Cancelled': 'status-rejected'
    };

    function setStatus(card, label) {
        const s = $('.status', card);
        s.className = 'status ' + (STATUS_CLASS[label] || 'status-accepted');
        s.textContent = label;
    }

    function initCustomerDashboard() {
        const row = $('.row.g-4:not(.mb-5)');
        if (!row) return;
        const user = store.get('user', null);
        const saved = store.get('bookings', []);
        const cancelled = store.get('cancelled', []);
        const reviewed = (store.get('reviews', []) || []).map((r) => r.bookingId);

        if (user && user.name) {
            const hello = $('.page-header p');
            if (hello) hello.textContent = 'Welcome back, ' + user.name + ' 👋';
        }

        /* bookings made on the booking page appear first */
        saved.slice().reverse().forEach((b) => {
            const col = document.createElement('div');
            col.className = 'col-lg-6';
            col.innerHTML =
                '<div class="dashboard-card p-4" data-id="' + esc(b.id) + '" data-saved="1">' +
                '<div class="d-flex justify-content-between align-items-start gap-3"><div>' +
                '<small class="text-muted">Booking ID</small><h5 class="fw-bold">' + esc(b.id) + '</h5></div>' +
                '<span class="status status-pending">Pending</span></div><hr>' +
                '<h5 class="fw-bold">' + esc(b.service) + '</h5>' +
                '<p class="text-muted mb-2">Provider: ' + esc(b.provider) + '</p>' +
                '<p class="mb-1">📅 ' + esc(fmtDate(b.date)) + '</p>' +
                '<p class="mb-1">🕐 ' + esc(fmtTime(b.time)) + '</p>' +
                '<p>📍 ' + esc(b.location) + '</p></div>';
            row.prepend(col);
            const card = $('.dashboard-card', col);
            if (b.status && b.status !== 'Pending') setStatus(card, b.status);
        });

        const cards = () => $$('.dashboard-card', row);

        /* give every pending booking a cancel button */
        cards().forEach((card) => {
            const idText = clean($('h5.fw-bold', card).textContent);
            card.dataset.id = card.dataset.id || idText;
            if (cancelled.includes(card.dataset.id)) setStatus(card, 'Cancelled');
        });

        function addCancelButtons() {
            cards().forEach((card) => {
                const isPending = clean($('.status', card).textContent) === 'Pending';
                const has = $('[data-cancel]', card);
                if (isPending && !has) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'btn btn-soft-pink btn-sm mt-3';
                    b.dataset.cancel = '1';
                    b.textContent = 'Cancel request';
                    card.appendChild(b);
                } else if (!isPending && has) {
                    has.remove();
                }
            });
        }

        /* people who already reviewed see a badge instead of the button */
        cards().forEach((card) => {
            const link = $('a[href="review.html"]', card);
            if (link && reviewed.includes(card.dataset.id)) {
                link.outerHTML = '<span class="status status-completed">✓ Review submitted</span>';
            }
        });

        /* stat boxes always match the real cards */
        function updateStats() {
            const counts = { 'Total Bookings': 0, 'Pending': 0, 'In Progress': 0, 'Completed': 0 };
            cards().forEach((c) => {
                const col = c.closest('[class*="col-"]');
                if (col.hidden) { /* hidden by a filter still counts */ }
                counts['Total Bookings']++;
                const s = clean($('.status', c).textContent);
                if (counts[s] !== undefined) counts[s]++;
            });
            $$('.row.g-4.mb-5 .dashboard-card').forEach((c) => {
                const label = clean($('small', c).textContent);
                if (counts[label] !== undefined) $('.dashboard-number', c).textContent = counts[label];
            });
        }

        /* filter buttons */
        const chips = document.createElement('div');
        chips.className = 'filter-chips';
        ['All', 'Pending', 'In Progress', 'Completed', 'Rejected'].forEach((name, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip-btn' + (i === 0 ? ' active' : '');
            b.textContent = name;
            chips.appendChild(b);
        });
        row.before(chips);

        let current = 'All';
        function applyFilter() {
            cards().forEach((c) => {
                const s = clean($('.status', c).textContent);
                const match = current === 'All' || s === current || (current === 'Rejected' && s === 'Cancelled');
                c.closest('[class*="col-"]').hidden = !match;
            });
        }
        chips.addEventListener('click', (e) => {
            const b = e.target.closest('.chip-btn');
            if (!b) return;
            $$('.chip-btn', chips).forEach((x) => x.classList.remove('active'));
            b.classList.add('active');
            current = b.textContent;
            applyFilter();
        });

        row.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-cancel]');
            if (!btn) return;
            const card = btn.closest('.dashboard-card');
            if (!window.confirm('Cancel booking ' + card.dataset.id + '?')) return;
            setStatus(card, 'Cancelled');
            if (card.dataset.saved) {
                const list = store.get('bookings', []);
                const item = list.find((b) => b.id === card.dataset.id);
                if (item) item.status = 'Cancelled';
                store.set('bookings', list);
            } else {
                cancelled.push(card.dataset.id);
                store.set('cancelled', cancelled);
            }
            addCancelButtons();
            updateStats();
            applyFilter();
            toast('Booking cancelled.', 'info');
        });

        addCancelButtons();
        updateStats();
    }

    /* =========================================================
       PROVIDER DASHBOARD (provider-dashboard.html)
       ========================================================= */

    function initProviderDashboard() {
        const stats = {};
        $$('.row.g-4.mb-5 .dashboard-card').forEach((c) => {
            stats[clean($('small', c).textContent)] = $('.dashboard-number', c);
        });
        const user = store.get('user', null);
        if (user && user.name) {
            const hello = $('.page-header p');
            if (hello) hello.textContent = 'Welcome back, ' + user.name + ' 👋';
        }

        function adjust(label, delta) {
            const el = stats[label];
            if (!el) return;
            el.textContent = Math.max(0, (parseInt(el.textContent, 10) || 0) + delta);
            el.classList.remove('pop');
            void el.offsetWidth;
            el.classList.add('pop');
        }

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.dashboard-card a.btn');
            if (!btn) return;
            const card = btn.closest('.dashboard-card');
            const status = $('.status', card);
            if (!status) return;
            e.preventDefault();
            const action = clean(btn.textContent.replace(/[✓✕]/g, '')).toLowerCase();
            const id = clean($('h5.fw-bold', card).textContent);

            if (action === 'accept') {
                btn.parentElement.outerHTML = '<a href="#" class="btn btn-primary">Start Work</a>';
                setStatus(card, 'Accepted');
                adjust('New Requests', -1);
                adjust('Accepted', 1);
                toast('Request ' + id + ' accepted ✓');
            } else if (action === 'reject') {
                if (!window.confirm('Reject this request?')) return;
                btn.parentElement.outerHTML = '<p class="text-muted small mb-0">You declined this request.</p>';
                setStatus(card, 'Rejected');
                adjust('New Requests', -1);
                toast('Request declined.', 'info');
            } else if (action === 'start work') {
                btn.textContent = '✓ Mark Completed';
                setStatus(card, 'In Progress');
                adjust('Accepted', -1);
                adjust('In Progress', 1);
                toast('Work started.');
            } else if (action === 'mark completed') {
                btn.outerHTML = '<div class="alert alert-success mb-0">Service successfully completed.</div>';
                setStatus(card, 'Completed');
                adjust('In Progress', -1);
                adjust('Completed', 1);
                toast('Great job! Marked as completed 🎉');
            }
        });
    }

    /* =========================================================
       LOGIN (login.html)
       ========================================================= */

    function initLogin() {
        const form = $('form');
        const email = $('input[type="email"]', form);
        const pass = $('input[type="password"]', form);
        const remember = $('input[type="checkbox"]', form);
        addPasswordToggle(pass);

        const savedEmail = store.get('rememberEmail', '');
        if (savedEmail) {
            email.value = savedEmail;
            remember.checked = true;
        }

        const forgot = $('a[href="#"]', form);
        if (forgot) {
            forgot.addEventListener('click', (e) => {
                e.preventDefault();
                toast('Password reset is not available in this demo.', 'info');
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const mail = clean(email.value).toLowerCase();
            let ok = true;
            if (!emailOk(mail)) { setErr(email, 'Enter a valid email address.'); email.focus(); ok = false; }
            if (pass.value.length < 6) {
                setErr(pass, 'Password must be at least 6 characters.');
                if (ok) pass.focus();
                ok = false;
            }
            if (!ok) return;

            if (remember.checked) store.set('rememberEmail', mail); else store.del('rememberEmail');
            const known = store.get('user', null);
            const user = known && known.email === mail ? known : { name: nameFromEmail(mail), email: mail, type: 'Customer' };
            store.set('user', user);
            busyButton($('button[type="submit"]', form), 'Logging in…');
            setTimeout(() => {
                location.href = user.type === 'Service Provider' ? 'provider-dashboard.html' : 'customer-dashboard.html';
            }, 700);
        });
    }

    /* =========================================================
       REGISTER (register.html)
       ========================================================= */

    function initRegister() {
        const form = $('form');
        const nameField = $('input[type="text"]', form);
        const email = $('input[type="email"]', form);
        const phone = $('input[type="tel"]', form);
        const type = $('select', form);
        const [pass, confirm] = $$('input[type="password"]', form);
        const terms = $('input[type="checkbox"]', form);
        formatPhone(phone);
        addPasswordToggle(pass);
        addPasswordToggle(confirm);

        /* password strength meter */
        const meter = document.createElement('div');
        meter.className = 'pw-meter-box';
        meter.innerHTML = '<div class="pw-meter"><span></span></div><small class="pw-label text-muted"></small>';
        pass.closest('.input-wrap').after(meter);
        const bar = $('.pw-meter span', meter);
        const label = $('.pw-label', meter);
        pass.addEventListener('input', () => {
            const v = pass.value;
            let score = 0;
            if (v.length >= 6) score++;
            if (v.length >= 10) score++;
            if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
            if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
            const names = ['', 'Weak', 'Okay', 'Good', 'Strong'];
            const colors = ['#e6e6e6', '#e9a7b5', '#f0c36b', '#9cc5a6', '#52735d'];
            bar.style.width = (v ? score * 25 : 0) + '%';
            bar.style.background = colors[v ? score : 0];
            label.textContent = v ? 'Password strength: ' + (names[score] || 'Weak') : '';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let ok = true;
            const fail = (el, msg) => { if (ok) el.focus(); setErr(el, msg); ok = false; };

            if (clean(nameField.value).length < 3) fail(nameField, 'Please enter your full name.');
            if (!emailOk(clean(email.value))) fail(email, 'Enter a valid email address.');
            if (!phoneOk(phone.value)) fail(phone, 'Use a Pakistani mobile number like 0300-1234567.');
            if (!type.value) fail(type, 'Please choose an account type.');
            if (pass.value.length < 6) fail(pass, 'Password must be at least 6 characters.');
            if (confirm.value !== pass.value) fail(confirm, 'Passwords do not match.');
            if (!terms.checked) { toast('Please accept the terms to continue.', 'error'); ok = false; }
            if (!ok) return;

            /* the password is deliberately NOT saved anywhere */
            const user = {
                name: clean(nameField.value),
                email: clean(email.value).toLowerCase(),
                phone: phone.value,
                type: clean(type.value) || clean(type.selectedOptions[0].textContent)
            };
            store.set('user', user);
            busyButton($('button[type="submit"]', form), 'Creating account…');
            toast('Welcome to ServiceHub, ' + user.name.split(' ')[0] + '! 🌷');
            setTimeout(() => {
                location.href = user.type === 'Service Provider' ? 'provider-dashboard.html' : 'customer-dashboard.html';
            }, 1000);
        });
    }

    /* =========================================================
       REVIEW (review.html)
       ========================================================= */

    function initReview() {
        const form = $('form');
        const select = $('select', form);
        const starBox = $('.star-choice', form);
        const text = $('textarea', form);
        const bookingId = 'BK-2026-003';
        const provider = clean($('.review-box h3').textContent);
        let value = 0;

        /* clickable stars */
        starBox.textContent = '';
        starBox.classList.add('star-input');
        const stars = [1, 2, 3, 4, 5].map((n) => {
            const s = document.createElement('span');
            s.className = 'star';
            s.textContent = '★';
            s.tabIndex = 0;
            s.setAttribute('role', 'button');
            s.setAttribute('aria-label', n + ' star' + (n > 1 ? 's' : ''));
            starBox.appendChild(s);
            return s;
        });
        const paint = (n) => stars.forEach((s, i) => s.classList.toggle('on', i < n));
        const choose = (n) => {
            value = n;
            select.selectedIndex = 6 - n;
            clearErr(select);
            paint(n);
        };
        stars.forEach((s, i) => {
            s.addEventListener('click', () => choose(i + 1));
            s.addEventListener('mouseenter', () => paint(i + 1));
            s.addEventListener('mouseleave', () => paint(value));
            s.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i + 1); }
            });
        });
        select.addEventListener('change', () => {
            value = parseInt(select.value, 10) || 0;
            paint(value);
        });

        /* character counter */
        text.maxLength = 500;
        const counter = document.createElement('div');
        counter.className = 'form-text text-end';
        counter.textContent = '0 / 500';
        text.after(counter);
        text.addEventListener('input', () => { counter.textContent = text.value.length + ' / 500'; });

        const reviews = store.get('reviews', []);
        if (reviews.some((r) => r.bookingId === bookingId)) {
            const note = $('.review-note', form);
            if (note) note.textContent = '✓ You have already reviewed this booking. Thank you!';
            $$('select, textarea, button', form).forEach((el) => { el.disabled = true; });
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let ok = true;
            if (!value) { setErr(select, 'Please choose a rating.'); ok = false; }
            if (clean(text.value).length < 10) {
                setErr(text, 'Please write at least 10 characters.');
                ok = false;
            }
            if (!ok) return;
            reviews.push({ bookingId: bookingId, provider: provider, rating: value, text: clean(text.value) });
            store.set('reviews', reviews);
            busyButton($('button[type="submit"]', form), 'Submitting…');
            toast('Thank you for your review! ⭐');
            setTimeout(() => { location.href = 'customer-dashboard.html'; }, 1100);
        });
    }

    /* =========================================================
       BOOT
       ========================================================= */

    document.addEventListener('DOMContentLoaded', () => {
        initCommon();
        const pages = {
            'index.html': initHome,
            'providers.html': initProviders,
            'provider-details.html': initProviderDetails,
            'booking.html': initBooking,
            'customer-dashboard.html': initCustomerDashboard,
            'provider-dashboard.html': initProviderDashboard,
            'login.html': initLogin,
            'register.html': initRegister,
            'review.html': initReview
        };
        if (pages[page]) pages[page]();
    });
})();
