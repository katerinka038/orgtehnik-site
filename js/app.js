/* ============================================================================
   ОРГТЕХНИК — поведение страницы
   ========================================================================== */
(function () {
  'use strict';

  var PHONE_DIGITS = '79109150648';

  /* ------------------------------------------------------------ 1. Шапка */
  var head = document.querySelector('.head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-stuck', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --------------------------------------------------- 2. Меню на телефоне */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  var mq = window.matchMedia('(max-width: 860px)');

  if (burger && nav) {
    var syncNav = function () {
      if (mq.matches) {
        nav.hidden = burger.getAttribute('aria-expanded') !== 'true';
      } else {
        nav.hidden = false;
        burger.setAttribute('aria-expanded', 'false');
      }
    };

    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      syncNav();
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && mq.matches) {
        burger.setAttribute('aria-expanded', 'false');
        syncNav();
      }
    });

    mq.addEventListener('change', syncNav);
    syncNav();
  }

  /* --------------------------- 3. Живые области на плашках в фотографии
     Надписи «Ремонт / Заправка / Обслуживание» нарисованы внутри снимка.
     Кадр обрезается по-разному в зависимости от окна, поэтому положение
     областей считаем каждый раз заново: где именно оказался нужный кусок
     фотографии на экране. Границы заданы долями от исходного кадра. */
  var SPOTS = {
    repair:  { u0: .103, v0: .263, u1: .181, v1: .380 },
    refill:  { u0: .205, v0: .263, u1: .270, v1: .391 },
    service: { u0: .290, v0: .263, u1: .389, v1: .391 }
  };

  /* Надписи, снятые с фотографии и набранные текстом. Координаты — левый
     верхний угол в долях исходного кадра 1536×1024. */
  var CAPS = {
    lead: { u: 183 / 1536, v: 141 / 1024 },
    note: { u: 181 / 1536, v: 512 / 1024 }
  };

  var heroImg = document.querySelector('.hero__media img');
  var hotspots = document.getElementById('hotspots');
  var caps = document.querySelectorAll('.hero-cap');
  var heroMedia = document.querySelector('.hero__media');

  /* object-position задан в CSS в процентах — берём оттуда, чтобы не
     рассинхронизироваться, если правится кадрирование. */
  function objectPosition(el) {
    var parts = getComputedStyle(el).objectPosition.split(' ');
    var toFraction = function (v, fallback) {
      var m = /^(-?[\d.]+)%$/.exec(v || '');
      return m ? parseFloat(m[1]) / 100 : fallback;
    };
    return { x: toFraction(parts[0], .5), y: toFraction(parts[1], .5) };
  }

  function placeHotspots() {
    if (!heroImg || !hotspots || !heroImg.naturalWidth) return;
    if (getComputedStyle(hotspots).display === 'none') return;

    var boxW = heroImg.clientWidth;
    var boxH = heroImg.clientHeight;
    if (!boxW || !boxH) return;

    // object-fit: cover — масштаб по большей из сторон
    var scale = Math.max(boxW / heroImg.naturalWidth, boxH / heroImg.naturalHeight);
    var drawnW = heroImg.naturalWidth * scale;
    var drawnH = heroImg.naturalHeight * scale;

    var pos = objectPosition(heroImg);
    var offsetX = (boxW - drawnW) * pos.x;
    var offsetY = (boxH - drawnH) * pos.y;

    Array.prototype.forEach.call(hotspots.children, function (el) {
      var s = SPOTS[el.dataset.spot];
      if (!s) return;
      el.style.left   = (offsetX + s.u0 * drawnW) + 'px';
      el.style.top    = (offsetY + s.v0 * drawnH) + 'px';
      el.style.width  = ((s.u1 - s.u0) * drawnW) + 'px';
      el.style.height = ((s.v1 - s.v0) * drawnH) + 'px';
    });

    /* Кегль надписей задан в пикселях исходного кадра; --hero-k переводит
       их в экранные, чтобы текст рос и уменьшался вместе с фотографией. */
    if (heroMedia) heroMedia.style.setProperty('--hero-k', drawnH / 1024);

    Array.prototype.forEach.call(caps, function (el) {
      var c = CAPS[el.dataset.cap];
      if (!c) return;
      el.style.left = (offsetX + c.u * drawnW) + 'px';
      el.style.top  = (offsetY + c.v * drawnH) + 'px';
    });
  }

  if (heroImg && hotspots) {
    if (heroImg.complete) placeHotspots();
    heroImg.addEventListener('load', placeHotspots);

    var placeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(placeTimer);
      placeTimer = setTimeout(placeHotspots, 80);
    });

    // шрифты и <picture> могут поменять раскладку уже после первого расчёта
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeHotspots);
  }

  /* ------------------------------------------------------------ 4. Заявка
     Отправлять некуда: сервера у статического сайта нет. Поэтому собираем
     текст заявки и открываем WhatsApp — человеку остаётся нажать «Отправить».
     Если появится PHP, сюда встаёт обычный fetch на почтовый обработчик. */
  var form = document.getElementById('order-form');
  var status = document.getElementById('form-status');

  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var task = form.task.value.trim();

      if (!name || phone.replace(/\D/g, '').length < 10) {
        status.textContent = 'Впишите имя и телефон — без них мы не сможем перезвонить.';
        status.classList.add('is-error');
        (name ? form.phone : form.name).focus();
        return;
      }
      if (!form.consent.checked) {
        status.textContent = 'Отметьте согласие на обработку данных.';
        status.classList.add('is-error');
        form.consent.focus();
        return;
      }

      var text = 'Заявка с сайта\n' +
        'Имя: ' + name + '\n' +
        'Телефон: ' + phone +
        (task ? '\nЗадача: ' + task : '');

      status.classList.remove('is-error');
      status.textContent = 'Открываем WhatsApp — останется нажать «Отправить».';
      window.open('https://wa.me/' + PHONE_DIGITS + '?text=' + encodeURIComponent(text),
                  '_blank', 'noopener');
    });
  }

  /* ------------------------------------------------------ 5. Год в подвале */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
