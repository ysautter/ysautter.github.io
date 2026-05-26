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
            const trigger = window.innerHeight * 0.7;

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
};
