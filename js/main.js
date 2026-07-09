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

    let index = 0, pv = perView(), timer, startX = 0, deltaX = 0, dragging = false;
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
        track.style.transform = offsetPx
            ? `translateX(calc(-${index * (100 / pv)}% + ${(offsetPx / viewport.offsetWidth) * 100}%))`
            : `translateX(-${index * (100 / pv)}%)`;
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
    const stopAuto = () => { if (timer) { clearInterval(timer); timer = null; } };
    const startAuto = () => { stopAuto(); timer = setInterval(() => { index = index >= maxIndex() ? 0 : index + 1; update(); }, autoMs); };
    const restartAuto = () => startAuto();

    prevBtns.forEach((btn) => btn.addEventListener('click', () => { go(-1); restartAuto(); }));
    nextBtns.forEach((btn) => btn.addEventListener('click', () => { go(1); restartAuto(); }));
    ['mouseenter', 'focusin'].forEach((e) => root.addEventListener(e, stopAuto));
    ['mouseleave', 'focusout'].forEach((e) => root.addEventListener(e, startAuto));

    const onDown = (x) => { dragging = true; startX = x; deltaX = 0; viewport.classList.add('is-dragging'); stopAuto(); };
    const onMove = (x) => { if (dragging) { deltaX = x - startX; setTransform(deltaX); } };
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
    root.querySelectorAll('img').forEach((img) => { if (!img.complete) img.addEventListener('load', syncHeight); });

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
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
})();

(function () {
    const nums = document.querySelectorAll('.count-num');
    if (!nums.length) return;

    const animate = (el) => {
        const target = parseFloat(el.dataset.countTo) || 0;
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        if (el._countRAF) cancelAnimationFrame(el._countRAF);
        const tick = (now) => {
            const progress = Math.min((now - start) / 2000, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
            if (progress < 1) el._countRAF = requestAnimationFrame(tick);
        };
        el._countRAF = requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
        nums.forEach(animate);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) animate(entry.target); });
    }, { threshold: 0.4 });
    nums.forEach((el) => observer.observe(el));
})();

(function () {
    const services = [
        { title: '2D Animation', text: '2D animation brings matchless brand character into any brand. As a 2D animation agency, we focus on building the exact 2D aesthetic that would make your brand stand out.', img: 'img/services/2D-animation.webp' },
        { title: '3D Animation', text: 'A cutting-edge 3D brand image means immeasurable depth and sophistication to your brand identity. With our tailored 3D animation services, you can create your own brand presence anywhere in the world and stand out.', img: 'img/services/3D.webp' },
        { title: 'Product Animation', text: 'Taking the scope of your product above and beyond with advanced 3D product animation services. If you’re looking for a know-it-all product animation company, look no further than Big Leap.', img: 'img/services/product.webp' },
        { title: 'Character Design', text: 'Bring your characters to life with expert character designing and rigging. We turn concepts into reality, animating characters to move. ', img: 'img/services/Character-design.webp' },
        { title: 'Product Explainer Videos', text: 'Maybe your product/service needs to be explained to your target audience. As a product explanation video company, we follow a comprehensive approach across understanding your product/service to shooting and editing an explainer video that covers everything from brand tone to visibility.', img: 'img/services/product-animation.webp' }
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
        perView: () => window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1,
        autoMs: 4500
    });
})();

(function () {
    const grid = document.getElementById('indGrid');
    if (!grid) return;

    const industries = [
        { label: 'Architecture', img: 'img/industry/Architecture.webp' },
        { label: 'Automotive', img: 'img/industry/Automotive.webp' },
        { label: 'Fashion', img: 'img/industry/Fashion.webp' },
        { label: 'Film & TV', img: 'img/industry/Film-and-TV.webp' },
        { label: 'Games', img: 'img/industry/Games.webp' },
        { label: 'Retail', img: 'img/industry/Retail.webp' }
    ];

    grid.innerHTML = industries.map((it) => `
        <div class="ind-item w-[calc(50%-0.75rem)] sm:w-[calc(30%-1.334rem)] md:w-[calc(22%-1.334rem)] lg:w-[calc(15%-1.5rem)]">
            <a href="#contact" class="ind-card group flex flex-col items-center text-center">
                <div class="ind-thumb aspect-square w-full ring-1 ring-white/10">
                    <img src="${it.img}" alt="${it.label}" loading="lazy" class="h-full w-full object-cover" />
                </div>
                <h3 class="ind-label mt-4 text-sm font-bold text-white sm:text-base">${it.label}</h3>
            </a>
        </div>
    `).join('');

    const items = [...grid.querySelectorAll('.ind-item')];
    const reveal = () => items.forEach((el, i) => {
        el.style.transitionDelay = (i * 0.09) + 's';
        el.classList.add('in-view');
    });

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            if (entries.some((e) => e.isIntersecting)) { reveal(); obs.disconnect(); }
        }, { threshold: 0.15 });
        io.observe(grid);
    } else {
        reveal();
    }
})();

(function () {
    document.querySelectorAll('#offers, #attractive').forEach((section) => {
        const items = [...section.querySelectorAll('.offer-reveal')];
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

(function () {
    const items = [
        { name: 'Mr. Horst Flaig', role: 'CEO of Flaig Magnetsysteme', img: './img/testimonials/flaig.webp', rating: 5, text: "We had the pleasure of working with BigLeap for our animated explanatory video at Flaig Magnetsysteme, and we couldn't be happier with the results! From start to finish, their team was professional, creative, and attentive to our needs. The final video perfectly captures our message in an engaging and clear way, helping us communicate more effectively with our audience. We highly recommend BigLeap to anyone looking for top-quality animation and excellent service. Thank you, BigLeap, for your fantastic work." },
        { name: 'Mr. Prithviraj', role: 'Rackovan - Director', img: './img/testimonials/prithviraj.webp', rating: 5, text: "It's been 3 years with them and they never disappointed us. Their proactive approach, exceptional team skills, and attention to detail continuously exceeded our expectations. And also helped us to accelerate business growth." },
        { name: 'Mr. Katariya', role: 'Director - Hytek Marketing', img: './img/testimonials/katariya.webp', rating: 5, text: "We are really impressed with their SEO work. They helped to bring a tremendous change in Google's ranking and also helped to increase conversion." },
        { name: 'Mr. Basanth Raghavan', role: 'Managing Director - YES Machinery', img: './img/testimonials/basanth-raghavan.webp', rating: 5, text: "We have a great business relationship with BigLeap. A dynamic animation studio driven by creative minds that bring your ideas and vision to life. Absolutely impressed by their animation services, they've done a fantastic job in redesigning our website." }
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
        videoWrap.innerHTML = `
            <div class="yt-modal-loading" aria-hidden="true">
                <span class="yt-modal-spinner"></span>
            </div>
            <iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0${startParam}" title="${title.replace(/"/g, '&quot;')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
        videoWrap.querySelector('iframe')?.addEventListener('load', () => {
            videoWrap.querySelector('.yt-modal-loading')?.remove();
        }, { once: true });
        modal.querySelector('.yt-modal-close')?.focus();
    };

    document.querySelectorAll('[data-yt-open]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-yt-id');
            if (!id) return;
            open(id, btn.querySelector('.youtube-card-title')?.textContent?.trim() || 'Video', parseInt(btn.getAttribute('data-yt-start') || '0', 10));
        });
    });
    modal.querySelectorAll('[data-yt-close]').forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
    });
})();

(function () {
    const grid = document.querySelector('.faq-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.faq-card')];
    if (!cards.length) return;
    const setOpen = (card) => cards.forEach((c) => c.classList.toggle('is-open', c === card));
    setOpen(cards[0]);
    cards.forEach((card) => {
        card.addEventListener('mouseenter', () => setOpen(card));
        card.addEventListener('focusin', () => setOpen(card));
        card.addEventListener('click', () => setOpen(card));
    });
})();

(function () {
    const modal = document.getElementById('quoteModal');
    const form = document.getElementById('quoteForm');
    const success = document.getElementById('quoteSuccess');
    if (!modal || !form || !success) return;

    const open = () => {
        form.hidden = false;
        success.hidden = true;
        form.reset();
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => form.querySelector('input, select, textarea')?.focus());
    };
    const close = () => {
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    document.querySelectorAll('a[href="#quote"]').forEach((link) => {
        link.addEventListener('click', (e) => { e.preventDefault(); open(); });
    });
    modal.querySelectorAll('[data-quote-close]').forEach((el) => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
    });
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const btn = form.querySelector('.quote-submit');
        btn.classList.add('is-loading');
        btn.disabled = true;
        setTimeout(() => {
            btn.classList.remove('is-loading');
            btn.disabled = false;
            form.hidden = true;
            success.hidden = false;
        }, 900);
    });
})();

(function () {
    const year = document.getElementById('footerYear');
    if (year) year.textContent = new Date().getFullYear();
})();

(function () {
    const cursor = document.getElementById('customCursor');
    if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const offsetX = 4;
    const offsetY = 4;
    const ease = 0.22;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let visible = false;

    const show = () => {
        if (visible) return;
        visible = true;
        cursor.classList.add('is-visible');
    };

    const hide = () => {
        if (!visible) return;
        visible = false;
        cursor.classList.remove('is-visible');
    };

    const onMove = (e) => {
        targetX = e.clientX + offsetX;
        targetY = e.clientY + offsetY;
        show();
    };

    const render = () => {
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        requestAnimationFrame(render);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);

    requestAnimationFrame(render);
})();

(function () {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const showAfter = 400;
    let wasVisible = false;

    const update = () => {
        const visible = window.scrollY > showAfter;
        if (visible !== wasVisible) {
            btn.classList.toggle('is-visible', visible);
            btn.setAttribute('aria-hidden', visible ? 'false' : 'true');
            wasVisible = visible;
        }
    };

    btn.addEventListener('click', () => {
        btn.classList.add('is-launching');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => btn.classList.remove('is-launching'), 700);
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
})();
