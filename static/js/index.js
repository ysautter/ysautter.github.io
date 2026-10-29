var TxtType = function(el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = '';
    this.tick();
    this.isDeleting = false;
};

TxtType.prototype.tick = function() {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
        this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
        this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

    var that = this;
    var delta = 100 - Math.random() * 50;

    if (this.isDeleting) { delta /= 2; }

    if (!this.isDeleting && this.txt === fullTxt) {
        delta = this.period;
        this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
        this.isDeleting = false;
        this.loopNum++;
        delta = 500;
    }

    setTimeout(function() {
        that.tick();
    }, delta);
};

window.onload = function() {
    var elements = document.getElementsByClassName('typewrite');
    for (var i=0; i<elements.length; i++) {
        var toRotate = elements[i].getAttribute('data-type');
        var period = elements[i].getAttribute('data-period');
        if (toRotate) {
            new TxtType(elements[i], JSON.parse(toRotate), period);
        }
    }

    const toggle = document.getElementById('darkModeToggle');
    const cv = document.getElementById('cv');

    toggle.addEventListener('change', () => {
        cv.classList.toggle('cv-light', !toggle.checked);
    });

    // Scroll progress bar (top of page)
    const progressBar = document.getElementById('scroll-progress');

    // Timeline progress
    const timelineEl = document.getElementById('timeline-list');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineItems = document.querySelectorAll('.timeline-item');

    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressBar.style.width = (scrollTop / scrollHeight) * 100 + '%';

        // Timeline progress fill & active items
        if (timelineEl && timelineProgress) {
            const rect = timelineEl.getBoundingClientRect();
            const trigger = window.innerHeight * 0.5; // progress follows the vertical center of the viewport

            if (rect.top < trigger) {
                const traveled = trigger - rect.top;
                const pct = Math.min(Math.max(traveled / rect.height, 0), 1) * 100;
                timelineProgress.style.height = pct + '%';

                const progressPx = (pct / 100) * rect.height;
                timelineItems.forEach(item => {
                    const itemTop = item.offsetTop;
                    if (progressPx >= itemTop) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            } else {
                timelineProgress.style.height = '0%';
                timelineItems.forEach(item => item.classList.remove('active'));
            }
        }
    });

    // Scroll reveal animations (generic)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
        revealObserver.observe(el);
    });

    // Timeline item reveal (slide in from sides)
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.timeline-item').forEach(el => {
        timelineObserver.observe(el);
    });

    initChips();
    initLightbox();
};

// Chip lists with data-max show only the first N chips plus a "+M" toggle.
// Without JS every chip is visible.
function initChips() {
    document.querySelectorAll('.chips[data-max]').forEach(list => {
        const max = parseInt(list.dataset.max, 10);
        const items = Array.from(list.children);
        if (items.length <= max + 1) return; // "+1" would be silly
        items.slice(max).forEach(li => li.classList.add('chip-more'));
        const toggle = document.createElement('li');
        toggle.className = 'chip-toggle';
        const btn = document.createElement('button');
        btn.type = 'button';
        const more = '+' + (items.length - max);
        btn.textContent = more;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Show ' + (items.length - max) + ' more');
        btn.addEventListener('click', () => {
            const open = list.classList.toggle('expanded');
            btn.textContent = open ? 'less' : more;
            btn.setAttribute('aria-expanded', String(open));
        });
        toggle.appendChild(btn);
        list.appendChild(toggle);
    });
}

// Photo lightbox. Without JS the gallery links simply open the full-size image.
function initLightbox() {
    const dialog = document.getElementById('lightbox');
    const photos = Array.from(document.querySelectorAll('.photo'));
    if (!dialog || !photos.length || typeof dialog.showModal !== 'function') return;

    const img = dialog.querySelector('img');
    const caption = dialog.querySelector('figcaption');
    let index = 0;

    const full = i => photos[i].querySelector('a').href;
    const preload = i => { new Image().src = full((i + photos.length) % photos.length); };

    function show(i) {
        index = (i + photos.length) % photos.length;
        const fig = photos[index];
        img.classList.add('loading');
        img.onload = () => img.classList.remove('loading');
        img.src = full(index);
        img.alt = fig.querySelector('img').alt;
        caption.innerHTML = fig.querySelector('figcaption').innerHTML;
        preload(index + 1);
        preload(index - 1);
    }

    photos.forEach((fig, i) => {
        fig.querySelector('a').addEventListener('click', e => {
            e.preventDefault();
            dialog.classList.remove('single');
            show(i);
            dialog.showModal();
        });
    });

    // Project screenshots: same dialog, single image without prev/next.
    document.querySelectorAll('a[data-zoom]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const thumb = link.querySelector('img');
            dialog.classList.add('single');
            img.src = link.href;
            img.alt = thumb.alt;
            caption.textContent = thumb.alt;
            dialog.showModal();
        });
    });
    const single = () => dialog.classList.contains('single');

    dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
    dialog.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
    // Click on the dark background (not on the image or a button) closes.
    dialog.addEventListener('click', e => {
        if (e.target === dialog || e.target.tagName === 'FIGURE') dialog.close();
    });
    dialog.addEventListener('keydown', e => {
        if (single()) return;
        if (e.key === 'ArrowRight') show(index + 1);
        if (e.key === 'ArrowLeft') show(index - 1);
    });
    dialog.addEventListener('close', () => { img.removeAttribute('src'); });

    // Swipe on touch devices
    let touchX = null;
    dialog.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', e => {
        if (touchX === null || single()) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
        touchX = null;
    });
}
