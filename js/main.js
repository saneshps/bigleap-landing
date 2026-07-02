  // Shared responsive slider (swipe, autoplay, dots, arrows)
  function initSlider({ rootId, trackId, dotsId, viewportSel, slidesHtml, perView, autoMs = 4500, autoHeight = false }) {
    const root = document.getElementById(rootId);
    const track = document.getElementById(trackId);
    const dotsWrap = document.getElementById(dotsId);
    if (!root || !track || !dotsWrap) return;

    const prevBtns = [...root.querySelectorAll('[data-slider-prev]')];
    const nextBtns = [...root.querySelectorAll('[data-slider-next]')];
    const viewport = root.querySelector(viewportSel);
    track.innerHTML = slidesHtml;
    const slides = [...track.children];

    if (autoHeight) track.classList.add('slider-track--auto-height');

    let index = 0, pv = perView();
    const maxIndex = () => Math.max(0, slides.length - pv);
    const slideW = () => viewport.clientWidth / pv;
    const syncHeight = () => {
        if (!autoHeight || !slides[index]) return;
        const inner = slides[index].querySelector('.tn-slide-inner');
        const h = (inner || slides[index]).offsetHeight;
        if (h > 0) viewport.style.height = h + 'px';
    };
    const setTransform = (offsetPx = 0) => {
        if (autoHeight) {
            track.style.transform = `translateX(${-(index * slideW()) + offsetPx}px)`;
            return;
        }
        if (offsetPx) {
            track.style.transform = `translateX(calc(-${index * (100 / pv)}% + ${(offsetPx / viewport.offsetWidth) * 100}%))`;
        } else {
            track.style.transform = `translateX(-${index * (100 / pv)}%)`;
        }
    };
    const update = () => {
        setTransform(0);
        [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === index));
        prevBtns.forEach((b) => { b.disabled = index === 0; });
        nextBtns.forEach((b) => { b.disabled = index >= maxIndex(); });
        if (autoHeight) requestAnimationFrame(() => requestAnimationFrame(syncHeight));
    };
    const layout = () => {
        pv = perView();
        const w = slideW();
        slides.forEach((s) => { s.style.width = autoHeight ? w + 'px' : (100 / pv) + '%'; });
        index = Math.min(index, maxIndex());
        update();
    };
    const buildDots = () => {
        dotsWrap.innerHTML = '';
        for (let i = 0; i <= maxIndex(); i++) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'slider-dot';
            b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            b.addEventListener('click', () => { index = i; update(); restartAuto(); });
            dotsWrap.appendChild(b);
        }
    };
    const go = (dir) => { index = Math.min(Math.max(index + dir, 0), maxIndex()); update(); };

    let timer;
    const stopAuto = () => { if (timer) { clearInterval(timer); timer = null; } };
    const startAuto = () => { stopAuto(); timer = setInterval(() => { index = index >= maxIndex() ? 0 : index + 1; update(); }, autoMs); };
    const restartAuto = () => startAuto();

    prevBtns.forEach((btn) => btn.addEventListener('click', () => { go(-1); restartAuto(); }));
    nextBtns.forEach((btn) => btn.addEventListener('click', () => { go(1); restartAuto(); }));
    ['mouseenter', 'focusin'].forEach((e) => root.addEventListener(e, stopAuto));
    ['mouseleave', 'focusout'].forEach((e) => root.addEventListener(e, startAuto));

    let startX = 0, deltaX = 0, dragging = false;
    const onDown = (x) => { dragging = true; startX = x; deltaX = 0; viewport.classList.add('is-dragging'); stopAuto(); };
    const onMove = (x) => {
        if (!dragging) return;
        deltaX = x - startX;
        setTransform(deltaX);
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove('is-dragging');
        const th = (autoHeight ? slideW() : viewport.offsetWidth / pv) / 4;
        if (deltaX > th) go(-1);
        else if (deltaX < -th) go(1);
        else update();
        startAuto();
    };

    viewport.addEventListener('mousedown', (e) => onDown(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onUp);
    viewport.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchend', onUp);
    track.addEventListener('click', (e) => { if (Math.abs(deltaX) > 5) e.preventDefault(); }, true);
    window.addEventListener('resize', () => { buildDots(); layout(); syncHeight(); });

    root.querySelectorAll('img').forEach((img) => {
        if (img.complete) return;
        img.addEventListener('load', syncHeight);
    });

    if (autoHeight && 'ResizeObserver' in window) {
        const ro = new ResizeObserver(() => syncHeight());
        slides.forEach((s) => {
            const inner = s.querySelector('.tn-slide-inner');
            if (inner) ro.observe(inner);
        });
    }

    buildDots();
    layout();
    if (autoHeight) requestAnimationFrame(() => requestAnimationFrame(syncHeight));
    startAuto();
}

(function () {
    const header = document.getElementById('siteHeader');
    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
})();

// Animated count-up numbers (runs when the section scrolls into view)
(function () {
    const nums = document.querySelectorAll('.count-num');
    if (!nums.length) return;

    const formatNumber = (n) => n.toLocaleString('en-US');

    const animate = (el) => {
        const target = parseFloat(el.dataset.countTo) || 0;
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();

        // cancel any in-flight animation before starting a new one
        if (el._countRAF) cancelAnimationFrame(el._countRAF);

        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // easeOutCubic for a smooth finish
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            el.textContent = formatNumber(value) + suffix;
            if (progress < 1) el._countRAF = requestAnimationFrame(tick);
        };
        el._countRAF = requestAnimationFrame(tick);
    };

    const reset = (el) => {
        if (el._countRAF) cancelAnimationFrame(el._countRAF);
        el.textContent = '0' + (el.dataset.suffix || '');
    };

    if (!('IntersectionObserver' in window)) {
        nums.forEach(animate);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animate(entry.target);
            } else {
                reset(entry.target);
            }
        });
    }, { threshold: 0.4 });

    nums.forEach((el) => observer.observe(el));
})();

// ---- Services slider ----
(function () {
    const services = [
        { title: '2D Animation', text: 'Thinking of incorporating 2D animation into your marketing strategy? We are the trusted 2D animation company in Dubai.', img: 'img/services/2D-animation.webp' },
        { title: '3D Animation', text: 'Ready to unfold your story in motion? Elevate your brand with realistic and immersive 3D animation that will bring your vision to life.', img: 'img/services/3D.webp' },
        { title: 'Product Animation', text: 'Want to showcase your product in a way that will capture your audience? We help you create compelling product animations.', img: 'img/services/product.webp' },
        { title: 'Character Design', text: 'Bring your characters to life with expert character designing and rigging. We turn concepts into reality, animating characters to motion.', img: 'img/services/Character-design.webp' },
        { title: '2D Animation', text: 'Thinking of incorporating 2D animation into your marketing strategy? We are the trusted 2D animation company in Dubai.', img: 'img/services/2D-animation.webp' },
        { title: '3D Animation', text: 'Ready to unfold your story in motion? Elevate your brand with realistic and immersive 3D animation that will bring your vision to life.', img: 'img/services/3D.webp' },
        { title: 'Product Animation', text: 'Want to showcase your product in a way that will capture your audience? We help you create compelling product animations.', img: 'img/services/product.webp' }
    ];

    initSlider({
        rootId: 'serviceSlider',
        trackId: 'serviceTrack',
        dotsId: 'serviceDots',
        viewportSel: '.service-viewport',
        slidesHtml: services.map((s) => `
        <div class="slide shrink-0 px-2 sm:px-3" role="group">
            <article class="service-card group relative h-full overflow-hidden rounded-3xl p-3 shadow-xl ring-1 ring-white/5 transition-transform duration-300 hover:-translate-y-1.5">
                <div class="relative overflow-hidden rounded-2xl">
                    <img src="${s.img}" alt="${s.title}" loading="lazy" class="card-img aspect-[4/3] w-full object-cover" />
                </div>
                <div class="px-2 pb-3 pt-4 text-center">
                    <h3 class="text-lg font-bold text-white sm:text-xl">${s.title}</h3>
                    <p class="mt-2 text-sm leading-relaxed text-white/70">${s.text}</p>
                </div>
            </article>
        </div>`).join(''),
        perView: () => {
            const w = window.innerWidth;
            if (w >= 1280) return 4;
            if (w >= 1024) return 3;
            if (w >= 640) return 2;
            return 1;
        },
        autoMs: 4500
    });
})();

// ---- Industries row (squircle thumbnails + scroll reveal) ----
(function () {
    const grid = document.getElementById('indGrid');
    if (!grid) return;

    // Industries — swap images/labels freely.
    const industries = [
        { label: 'Architecture', img: 'img/industry/Architecture.webp' },
        { label: 'Automotive', img: 'img/industry/Automotive.webp' },
        { label: 'Fashion', img: 'img/industry/Fashion.webp' },
        { label: 'Film & TV', img: 'img/industry/Film-and-TV.webp' },
        { label: 'Games', img: 'img/industry/Games.webp' },
        { label: 'Retail', img: 'img/industry/Retail.webp' }
    ];

    grid.innerHTML = industries.map((it) => `
        <div class="ind-item w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1.334rem)] lg:w-[calc(25%-1.5rem)]">
            <a href="#contact" class="ind-card group flex flex-col items-center text-center">
                <div class="ind-thumb aspect-square w-full ring-1 ring-white/10">
                    <img src="${it.img}" alt="${it.label}" loading="lazy" class="h-full w-full object-cover" />
                </div>
                <h3 class="ind-label mt-4 text-sm font-bold text-white sm:text-base">${it.label}</h3>
            </a>
        </div>
    `).join('');

    const items = Array.from(grid.querySelectorAll('.ind-item'));
    const reveal = () => {
        items.forEach((el, i) => {
            el.style.transitionDelay = (i * 0.09) + 's';
            el.classList.add('in-view');
        });
    };

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            if (entries.some((e) => e.isIntersecting)) { reveal(); obs.disconnect(); }
        }, { threshold: 0.15 });
        io.observe(grid);
    } else {
        reveal();
    }
})();

/* ---- Offers & Attractive section scroll reveal ---- */
(function () {
    document.querySelectorAll('#offers, #attractive').forEach((section) => {
        const items = Array.from(section.querySelectorAll('.offer-reveal'));
        if (!items.length) return;

        const reveal = () => items.forEach((el, i) => {
            el.style.transitionDelay = (i * 0.15) + 's';
            el.classList.add('in-view');
        });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                if (entries.some((e) => e.isIntersecting)) { reveal(); obs.disconnect(); }
            }, { threshold: 0.2 });
            items.forEach((el) => io.observe(el));
        } else {
            reveal();
        }
    });
})();



// ---- Testimonials new slider (speech bubble) ----
(function () {
    const items = [
        { name: 'Mr. Horst Flaig', role: 'CEO of Flaig Magnetsysteme', img: './img/testimonials/flaig.webp', rating: 5, text: "We had the pleasure of working with BigLeap for our animated explanatory video at Flaig Magnetsysteme, and we couldn't be happier with the results! From start to finish, their team was professional, creative, and attentive to our needs. The final video perfectly captures our message in an engaging and clear way, helping us communicate more effectively with our audience. We highly recommend BigLeap to anyone looking for top-quality animation and excellent service. Thank you, BigLeap, for your fantastic work." },
        { name: 'Mr. Prithviraj', role: 'Rackovan - Director', img: './img/testimonials/prithviraj.webp', rating: 5, text: "It's been 3 years with them and they never disappointed us. Their proactive approach, exceptional team skills, and attention to detail continuously exceeded our expectations. And also helped us to accelerate business growth." },
        { name: 'Mr. Katariya', role: 'Director - Hytek Marketing', img: './img/testimonials/katariya.webp', rating: 5, text: "We are really impressed with their SEO work. They helped to bring a tremendous change in Google's ranking and also helped to increase conversion." },
        { name: 'Mr. Basanth Raghavan', role: 'Managing Director - YES Machinery', img: './img/testimonials/basanth-raghavan.webp', rating: 5, text: "We have a great business relationship with BigLeap. A dynamic animation studio driven by creative minds that bring your ideas and vision to life. Absolutely impressed by their animation services, they've done a fantastic job in redesigning our website." },
    ];
    const stars = (n) => Array.from({ length: 5 }, (_, i) =>
        `<svg viewBox="0 0 20 20" fill="currentColor" class="${i < n ? 'on' : 'off'}"><path d="M10 1.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L10 15.9l-5.25 2.76 1-5.86L1.5 7.66l5.9-.86L10 1.5z"/></svg>`
    ).join('');

    initSlider({
        rootId: 'tnSlider',
        trackId: 'tnTrack',
        dotsId: 'tnDots',
        viewportSel: '.tn-viewport',
        slidesHtml: items.map((t) => `
        <div class="slide shrink-0" role="group">
            <div class="tn-slide-inner">
                <article class="tn-bubble">
                    <span class="tn-quote-icon" aria-hidden="true">&ldquo;</span>
                    <div class="tn-stars">${stars(t.rating)}</div>
                    <p class="tn-quote-text">${t.text}</p>
                </article>
                <div class="tn-author">
                    <span class="tn-avatar-wrap">
                        <img src="${t.img}" alt="${t.name}" loading="lazy" class="tn-avatar" />
                    </span>
                    <span class="tn-meta">
                        <span class="tn-name">${t.name}</span>
                        <span class="tn-role">${t.role}</span>
                    </span>
                </div>
            </div>
        </div>`).join(''),
        perView: () => 1,
        autoMs: 5500,
        autoHeight: true
    });
})();

// ---- YouTube portfolio modal ----
(function () {
    const modal = document.getElementById('ytModal');
    const videoWrap = modal?.querySelector('.yt-modal-video');
    if (!modal || !videoWrap) return;

    const close = () => {
        videoWrap.innerHTML = '';
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const open = (id, title, start = 0) => {
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const startParam = start > 0 ? `&start=${start}` : '';
        const safeTitle = title.replace(/"/g, '&quot;');
        videoWrap.innerHTML = `
            <div class="yt-modal-loading" aria-hidden="true">
                <span class="yt-modal-spinner"></span>
            </div>
            <iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0${startParam}" title="${safeTitle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

        videoWrap.querySelector('iframe')?.addEventListener('load', () => {
            videoWrap.querySelector('.yt-modal-loading')?.remove();
        }, { once: true });

        modal.querySelector('.yt-modal-close')?.focus();
    };

    document.querySelectorAll('[data-yt-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-yt-id');
            const start = parseInt(btn.getAttribute('data-yt-start') || '0', 10);
            const title = btn.querySelector('.youtube-card-title')?.textContent?.trim() || 'Video';
            if (id) open(id, title, start);
        });
    });

    modal.querySelectorAll('[data-yt-close]').forEach((el) => {
        el.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
    });
})();

// ---- FAQ accordion (always one card open) ----
(function () {
    const grid = document.querySelector('.faq-grid');
    if (!grid) return;

    const cards = [...grid.querySelectorAll('.faq-card')];
    if (!cards.length) return;

    const setOpen = (card) => {
        cards.forEach((c) => c.classList.toggle('is-open', c === card));
    };

    setOpen(cards[0]);

    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => setOpen(card));
        card.addEventListener('focusin', () => setOpen(card));
        card.addEventListener('click', () => setOpen(card));
    });
})();