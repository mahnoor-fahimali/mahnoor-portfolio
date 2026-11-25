(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* toast */
  var toast = $('#toast'), tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2800); }

  /* dark mode (remembered) */
  var themeBtn = $('#theme');
  function setTheme(dark) { document.body.classList.toggle('dark', dark); themeBtn.textContent = dark ? '☀️' : '🌙'; try { localStorage.setItem('bm-theme', dark ? 'dark' : 'light'); } catch (e) {} }
  var saved = null; try { saved = localStorage.getItem('bm-theme'); } catch (e) {}
  setTheme(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  themeBtn.onclick = function () { setTheme(!document.body.classList.contains('dark')); };

  /* mobile menu */
  var burger = $('#burger'), nav = $('#nav');
  function menu(open) { nav.classList.toggle('open', open); burger.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); }
  burger.onclick = function () { menu(!nav.classList.contains('open')); };
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  /* header shadow + progress bar */
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    $('#progress').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    $('#hdr').classList.toggle('stuck', h.scrollTop > 10);
  }, { passive: true });

  /* feature tabs */
  var data = [
    ['Bookmark in one click', 'Organize your bookmarks however you like. Our simple drag-and-drop interface gives you complete control over how you manage your favourite sites.', 'img/illustration-features-tab-1-239a78af.png'],
    ['Intelligent search', 'Our powerful search feature will help you find saved sites in no time at all. No need to crawl through all of your bookmarks.', 'img/illustration-features-tab-2-7cbb0898.png'],
    ['Share your bookmarks', 'Easily share your bookmarks and collections with others. Create a shareable link that you can send at the click of a button.', 'img/illustration-features-tab-3-6a73db39.png']
  ];
  var tabs = $$('.tab'), pImg = $('#pImg'), pText = $('.panel-text');
  function show(i) {
    tabs.forEach(function (t, n) { t.classList.toggle('on', n === i); t.setAttribute('aria-selected', n === i); });
    pImg.classList.add('swap'); pText.classList.add('swap');
    setTimeout(function () {
      $('#pTitle').textContent = data[i][0]; $('#pText').textContent = data[i][1]; pImg.src = data[i][2];
      pImg.classList.remove('swap'); pText.classList.remove('swap');
    }, 280);
  }
  tabs.forEach(function (t, n) { t.onclick = function () { show(n); }; });
  $('#pTitle').textContent = data[0][0]; $('#pText').textContent = data[0][1];

  /* FAQ accordion */
  $$('.q button').forEach(function (b) {
    b.onclick = function () {
      var q = b.parentNode, open = !q.classList.contains('open');
      $$('.q').forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      q.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    };
  });

  /* extension buttons */
  $$('.add').forEach(function (b) {
    b.onclick = function () {
      var name = $('h3', b.parentNode).textContent.replace('Add to ', '');
      b.textContent = 'Installing…';
      setTimeout(function () { b.textContent = 'Added ✓'; say('Bookmark for ' + name + ' is ready!'); }, 900);
    };
  });

  /* email form validation */
  var form = $('#form'), email = $('#email');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    email.parentNode.classList.toggle('bad', !ok);
    if (ok) { say('Thanks! We’ll be in touch.'); form.reset(); }
  });
  email.addEventListener('input', function () { email.parentNode.classList.remove('bad'); });

  /* scroll reveals + counter */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in'); io.unobserve(en.target);
      var c = $('#count', en.target);
      if (c) { var to = +c.dataset.to, s = performance.now(); (function f(t) { var p = Math.min((t - s) / 1600, 1); c.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(f); })(s); }
    });
  }, { threshold: .15 });
  $$('.reveal').forEach(function (r) { io.observe(r); });

  /* hero tilt */
  var hero = $('.hero-art'), img = $('#heroImg');
  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.transform = 'perspective(800px) rotateY(' + x * 10 + 'deg) rotateX(' + (-y * 10) + 'deg)';
  });
  hero.addEventListener('mouseleave', function () { img.style.transform = ''; });
})();
