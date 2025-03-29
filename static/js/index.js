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
    // INJECT CSS
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid #fff}";
    document.body.appendChild(css);


    const toggle = document.getElementById('darkModeToggle');
    const cvLeft = document.getElementById('cv-left');
    const cvHeader = document.getElementById('cv-header');
    const cvContact = document.getElementById('cv-contact');
    const cvSkillsH2 = document.querySelectorAll('#cv-skills h2');
    const cv = document.getElementById('cv');

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            cvLeft.style.backgroundColor = "#3E5879";
            cvHeader.style.backgroundColor = "#2c3039";
            cvContact.style.backgroundColor = "#2c3039";
            cvSkillsH2.forEach(element => {
                element.style.color = "#84b3dc";
            })
            cv.style.backgroundColor = "#283d4b"
            cv.style.color = "white"
        } else {
            cvLeft.style.backgroundColor = "#b9cdda";
            cvHeader.style.backgroundColor = "#373c47";
            cvContact.style.backgroundColor = "#373c47";
            cvSkillsH2.forEach(element => {
                element.style.color = "#41516C";
            })
            cv.style.backgroundColor = "white";
            cv.style.color = "black"
        }
    });
};
