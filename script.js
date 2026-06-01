(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.body.classList.remove('is-loading');
    initBlobSphere();
    initCursor();
    initHeader();
    initActiveNav();
    initMobileMenu();
    initScrollReveal();
    initSplitTextReveal();
    initSmoothScroll();
    initMagnetic();
    initTextScramble();
    initParallax();
  }

  /* ========================================
     BLOB SPHERE
     ======================================== */
  function initBlobSphere() {
    var canvas = document.getElementById('dot-sphere');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var width, height;
    var DETAIL = 55;
    var dotColor = { r: 208, g: 208, b: 208 };
    var dotColorTarget = { r: 208, g: 208, b: 208 };
    var dotSize = window.innerWidth > 480 ? 1.5 : 1;
    var currentTheme = 'dark';

    var blobSize = 250;
    var blobDistance = 1000;
    var perspectiveDistortion = 1;
    var angle = 0.005;

    var waves = {
      amp1: 76.923, freq1: 0.879, pha1: 0,
      amp2: 60, freq2: 0.165, pha2: 0,
      amp3: 50, freq3: 0, pha3: 0
    };

    var shapes = [
      { amp1: 76.923, freq1: 0.879, pha1: 0, amp2: 60, freq2: 0.165, pha2: 0, amp3: 50, freq3: 0, pha3: 0 },
      { amp1: 0, freq1: 0, pha1: 0, amp2: 0, freq2: 0, pha2: 0, amp3: 35, freq3: 10, pha3: 0 },
      { amp1: 200, freq1: 7.692, pha1: 6.283, amp2: 200, freq2: 7.912, pha2: 6.283, amp3: 200, freq3: 10, pha3: 6.283 },
      { amp1: 34.066, freq1: 5.934, pha1: 0, amp2: 20.879, freq2: 6.154, pha2: 0, amp3: 50.549, freq3: 0, pha3: 0 }
    ];

    var currentShape = 0;
    var morphTarget = shapes[0];
    var morphSpeed = 0.025;

    var targetDistance = 1000;
    var targetPerspective = 1;
    var targetSize = 250;
    var targetDotSize = dotSize;

    var rotA = 5, rotB = 5;
    var cosA, sinA;
    var matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    var mouseX = 0, mouseY = 0;
    var mouseTargetX = 0, mouseTargetY = 0;
    var mouseDeltaX = 0, mouseDeltaY = 0;
    var mouseSpeed = 0;

    var motionPha1 = 0, motionPha2 = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      dotSize = window.innerWidth > 480 ? 1.5 : 1;
      targetDotSize = dotSize;
    }

    function project3D(x, y, z) {
      var d = blobDistance / perspectiveDistortion;
      var f = 1000 / perspectiveDistortion;
      var scale = f / (d + z);
      return { x: scale * x, y: scale * y, alpha: scale < 1 ? scale * scale : 1, scale: scale };
    }

    function render() {
      requestAnimationFrame(render);

      for (var key in morphTarget) {
        if (waves.hasOwnProperty(key)) waves[key] += (morphTarget[key] - waves[key]) * morphSpeed;
      }

      blobDistance += (targetDistance - blobDistance) * 0.03;
      perspectiveDistortion += (targetPerspective - perspectiveDistortion) * 0.03;
      blobSize += (targetSize - blobSize) * 0.05;
      dotSize += (targetDotSize - dotSize) * 0.05;

      var prevSmoothedX = mouseX;
      var prevSmoothedY = mouseY;
      mouseX += (mouseTargetX - mouseX) * 0.08;
      mouseY += (mouseTargetY - mouseY) * 0.08;

      mouseDeltaX = mouseX - prevSmoothedX;
      mouseDeltaY = mouseY - prevSmoothedY;
      mouseSpeed = Math.sqrt(mouseDeltaX * mouseDeltaX + mouseDeltaY * mouseDeltaY);

      motionPha1 += 1.3 * 0.016;
      motionPha2 += 0.8 * 0.016;

      var sensitivity = 0.8;
      rotA = mouseDeltaY * 100 * sensitivity + 0.5;
      rotB = mouseDeltaX * 100 * sensitivity + 0.5;

      var O = Math.sqrt(rotA * rotA + rotB * rotB);
      if (O < 0.001) O = 0.001;
      var n = rotA / O;
      var p = -rotB / O;

      var dynamicAngle = Math.min(mouseSpeed * 0.008, 0.06) + 0.002;
      sinA = Math.sin(dynamicAngle);
      cosA = Math.cos(dynamicAngle);

      var rot = [
        [n * n + p * p * cosA, n * p * (1 - cosA), p * sinA],
        [n * p * (1 - cosA), p * p + n * n * cosA, -n * sinA],
        [-p * sinA, n * sinA, (n * n + p * p) * cosA]
      ];

      var nm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (var i = 0; i < 3; i++)
        for (var j = 0; j < 3; j++)
          nm[i][j] = rot[i][0] * matrix[0][j] + rot[i][1] * matrix[1][j] + rot[i][2] * matrix[2][j];
      matrix = nm;

      dotColor.r += (dotColorTarget.r - dotColor.r) * 0.05;
      dotColor.g += (dotColorTarget.g - dotColor.g) * 0.05;
      dotColor.b += (dotColorTarget.b - dotColor.b) * 0.05;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgb(' + Math.round(dotColor.r) + ',' + Math.round(dotColor.g) + ',' + Math.round(dotColor.b) + ')';
      ctx.save();
      ctx.translate(width / 2, height / 2);

      var PI = Math.PI, halfPI = PI / 2;

      for (var lat = DETAIL; lat--;) {
        var theta = lat / DETAIL * PI - halfPI;
        var ringDots = Math.round(DETAIL * Math.cos(theta) * 2);
        if (ringDots < 1) ringDots = 1;

        for (var lon = ringDots; lon--;) {
          var phi = lon / ringDots * 2 * PI - PI;
          var r1 = blobSize + waves.amp1 * Math.sin(waves.freq1 * theta + waves.pha1 + motionPha1);
          var r2 = blobSize + waves.amp2 * Math.sin(waves.freq2 * phi + waves.pha2 + motionPha2);
          var r3 = blobSize + waves.amp3 * Math.sin(waves.freq3 * theta + waves.pha3);

          var x = r1 * Math.cos(theta) * Math.cos(phi);
          var y = r2 * Math.cos(theta) * Math.sin(phi);
          var z = r3 * Math.sin(theta);

          var rx = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z;
          var ry = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z;
          var rz = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z;

          var p3d = project3D(rx, ry, rz);
          var sz = dotSize * p3d.scale;

          if (sz > 0) {
            ctx.globalAlpha = p3d.alpha * 0.65;
            ctx.fillRect(p3d.x, p3d.y, sz, sz);
          }
        }
      }

      ctx.restore();
    }

    function setTheme(theme) {
      if (theme === currentTheme) return;
      currentTheme = theme;
      if (theme === 'light') {
        document.body.classList.add('theme-light');
        dotColorTarget = { r: 30, g: 30, b: 30 };
      } else {
        document.body.classList.remove('theme-light');
        dotColorTarget = { r: 208, g: 208, b: 208 };
      }
    }

    function morphTo(idx) {
      if (idx >= 0 && idx < shapes.length && idx !== currentShape) {
        currentShape = idx;
        morphTarget = shapes[idx];
      }
    }

    function onScroll() {
      var sections = document.querySelectorAll('.section');
      var vc = window.innerHeight / 2;
      for (var i = sections.length - 1; i >= 0; i--) {
        var rect = sections[i].getBoundingClientRect();
        if (rect.top < vc && rect.bottom > 0) {
          var id = sections[i].id;
          if (id === 'hero') { morphTo(0); targetDistance = 1000; targetPerspective = 1; targetSize = 250; targetDotSize = window.innerWidth > 480 ? 1.5 : 1; setTheme('dark'); }
          else if (id === 'about') { morphTo(1); targetDistance = 0; targetPerspective = 3; targetSize = 220; targetDotSize = window.innerWidth > 480 ? 1 : 0.8; setTheme('light'); }
          else if (id === 'work') { morphTo(2); targetDistance = 1000; targetPerspective = 1; targetSize = 250; targetDotSize = window.innerWidth > 480 ? 1.5 : 1; setTheme('dark'); }
          else if (id === 'expertise') { morphTo(3); targetDistance = 1000; targetPerspective = 1; targetSize = 220; targetDotSize = window.innerWidth > 480 ? 1.021 : 0.6; setTheme('light'); }
          else if (id === 'contact') { morphTo(0); targetDistance = 1000; targetPerspective = 1; targetSize = 200; targetDotSize = window.innerWidth > 480 ? 1 : 0.8; setTheme('dark'); }
          break;
        }
      }
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll);
    document.addEventListener('mousemove', function (e) {
      mouseTargetX = (e.clientX - window.innerWidth / 2);
      mouseTargetY = (e.clientY - window.innerHeight / 2);
    });

    resize();
    render();
  }

  /* ========================================
     CUSTOM CURSOR
     ======================================== */
  function initCursor() {
    if (window.innerWidth < 768) return;

    var dot = document.getElementById('cursor-dot');
    var circle = document.getElementById('cursor-circle');
    if (!dot || !circle) return;

    var mx = 0, my = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function animate() {
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      circle.style.left = cx + 'px';
      circle.style.top = cy + 'px';
      requestAnimationFrame(animate);
    }
    animate();

    var hoverables = document.querySelectorAll('a, button, .work-item');
    hoverables.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        circle.style.width = '60px';
        circle.style.height = '60px';
        circle.style.borderColor = 'rgba(255,255,255,0.8)';
      });
      el.addEventListener('mouseleave', function () {
        circle.style.width = '44px';
        circle.style.height = '44px';
        circle.style.borderColor = 'rgba(255,255,255,0.5)';
      });
    });

    document.body.style.cursor = 'none';
    hoverables.forEach(function (el) { el.style.cursor = 'none'; });
  }

  /* ========================================
     HEADER
     ======================================== */
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.pageYOffset > 60);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ========================================
     3. ACTIVE NAV INDICATOR on scroll
     ======================================== */
  function initActiveNav() {
    var navLinks = document.querySelectorAll('.nav-item');
    var sections = document.querySelectorAll('.section');
    if (!navLinks.length || !sections.length) return;

    function update() {
      var scrollPos = window.pageYOffset + window.innerHeight / 3;

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var bottom = top + section.offsetHeight;
        var id = section.id;

        navLinks.forEach(function (link) {
          var href = link.getAttribute('href');
          if (href === '#' + id) {
            if (scrollPos >= top && scrollPos < bottom) {
              link.classList.add('is-active');
            } else {
              link.classList.remove('is-active');
            }
          }
        });
      });
    }

    window.addEventListener('scroll', update);
    update();
  }

  /* ========================================
     MOBILE MENU
     ======================================== */
  function initMobileMenu() {
    var burger = document.getElementById('burger');
    var menu = document.getElementById('mobile-menu');
    var links = document.querySelectorAll('.mobile-menu-link');
    if (!burger || !menu) return;

    burger.addEventListener('click', function () {
      burger.classList.toggle('active');
      menu.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('active');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ========================================
     5. STAGGERED SCROLL REVEAL
     ======================================== */
  function initScrollReveal() {
    var elements = document.querySelectorAll('[data-reveal]');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;

          // If it's a work-item inside a list, stagger based on sibling index
          var parent = el.parentElement;
          if (parent && parent.classList.contains('work-list')) {
            var siblings = parent.querySelectorAll('.work-item');
            var idx = 0;
            for (var i = 0; i < siblings.length; i++) {
              if (siblings[i] === el) { idx = i; break; }
            }
            el.style.transitionDelay = (idx * 0.08) + 's';
          }

          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ========================================
     SPLIT TEXT REVEAL
     ======================================== */
  function initSplitTextReveal() {
    var elements = document.querySelectorAll('[data-reveal-lines]');

    elements.forEach(function (el) {
      var text = el.textContent.trim();
      var words = text.split(' ');

      el.style.visibility = 'hidden';
      el.style.position = 'relative';

      var measurer = document.createElement('div');
      measurer.style.cssText =
        'position:absolute;top:0;left:0;width:' + el.offsetWidth + 'px;' +
        'font:inherit;line-height:inherit;letter-spacing:inherit;visibility:hidden;white-space:normal;';
      document.body.appendChild(measurer);

      var lines = [];
      var currentLine = '';
      var lineHeight = 0;

      words.forEach(function (word) {
        var testLine = currentLine ? currentLine + ' ' + word : word;
        measurer.textContent = testLine;
        var testHeight = measurer.offsetHeight;
        if (lineHeight && testHeight > lineHeight) {
          lines.push(currentLine);
          currentLine = word;
          measurer.textContent = word;
        } else {
          currentLine = testLine;
        }
        lineHeight = measurer.offsetHeight;
      });

      if (currentLine) lines.push(currentLine);
      document.body.removeChild(measurer);
      if (lines.length === 0) lines = [text];

      el.textContent = '';
      el.style.visibility = '';

      lines.forEach(function (line, i) {
        var wrapper = document.createElement('span');
        wrapper.style.display = 'block';
        wrapper.style.overflow = 'hidden';
        var inner = document.createElement('span');
        inner.classList.add('line-inner');
        inner.textContent = line;
        inner.style.transitionDelay = (i * 0.12) + 's';
        wrapper.appendChild(inner);
        el.appendChild(wrapper);
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ========================================
     SMOOTH SCROLL (anchor links)
     ======================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ========================================
     4. MAGNETIC HOVER on CTA buttons
     ======================================== */
  function initMagnetic() {
    if (window.innerWidth < 768) return;

    var magnets = document.querySelectorAll('.nav-cta, .contact-cta, .scroll-cta');

    magnets.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x * 0.3) + 'px, ' + (y * 0.3) + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
        el.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        setTimeout(function () { el.style.transition = ''; }, 400);
      });
    });
  }

  /* ========================================
     6. TEXT SCRAMBLE on hero title hover
     ======================================== */
  function initTextScramble() {
    var heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    var isScrambling = false;

    heroTitle.addEventListener('mouseenter', function () {
      if (isScrambling) return;
      isScrambling = true;

      var words = heroTitle.querySelectorAll('.word');

      words.forEach(function (wordEl) {
        var original = wordEl.textContent;
        var len = original.length;
        var iterations = 0;

        var interval = setInterval(function () {
          wordEl.textContent = original.split('').map(function (char, idx) {
            if (idx < iterations) return original[idx];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');

          iterations += 1 / 2;

          if (iterations >= len) {
            wordEl.textContent = original;
            clearInterval(interval);
          }
        }, 30);
      });

      setTimeout(function () { isScrambling = false; }, 800);
    });
  }

  /* ========================================
     7. PARALLAX DEPTH on scroll
     Section labels and stats move at
     different speed than body
     ======================================== */
  function initParallax() {
    if (window.innerWidth < 768) return;

    var parallaxEls = document.querySelectorAll('.section-label, .about-stats, .stat-number');

    function update() {
      var scrollY = window.pageYOffset;

      parallaxEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var centerY = rect.top + rect.height / 2;
        var viewCenter = window.innerHeight / 2;
        var offset = (centerY - viewCenter) * 0.04;
        el.style.transform = 'translateY(' + offset + 'px)';
      });

      requestAnimationFrame(update);
    }

    update();
  }

})();
