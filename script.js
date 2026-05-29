(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initBlobSphere();
    initHeader();
    initMobileMenu();
    initScrollReveal();
    initSplitTextReveal();
    initSmoothScroll();
  }

  /* ========================================
     BLOB SPHERE - Wave-deformed dot sphere
     Inspired by ILAB's BlobAnimation.
     3 sine waves deform a sphere, morphing
     between shapes as user scrolls.
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

    // Blob state
    var blobSize = 250;
    var blobDistance = 1000;
    var perspectiveDistortion = 1;
    var rotationSpeed = 0.005;
    var angle = rotationSpeed;

    // Wave parameters (current, interpolated)
    var waves = {
      amp1: 76.923, freq1: 0.879, pha1: 0,
      amp2: 60,     freq2: 0.165, pha2: 0,
      amp3: 50,     freq3: 0,     pha3: 0
    };

    // Morph shapes - matching ILAB's 4 shapes
    var shapes = [
      { amp1: 76.923, freq1: 0.879, pha1: 0, amp2: 60, freq2: 0.165, pha2: 0, amp3: 50, freq3: 0, pha3: 0 },
      { amp1: 0, freq1: 0, pha1: 0, amp2: 0, freq2: 0, pha2: 0, amp3: 35, freq3: 10, pha3: 0 },
      { amp1: 200, freq1: 7.692, pha1: 6.283, amp2: 200, freq2: 7.912, pha2: 6.283, amp3: 200, freq3: 10, pha3: 6.283 },
      { amp1: 34.066, freq1: 5.934, pha1: 0, amp2: 20.879, freq2: 6.154, pha2: 0, amp3: 50.549, freq3: 0, pha3: 0 }
    ];

    // Section thresholds - which shape at which scroll position
    // We detect which section is in viewport and morph accordingly
    var currentShape = 0;

    // Morph targets and interpolation
    var morphTarget = shapes[0];
    var morphSpeed = 0.025;

    // Distance / perspective animation targets
    var targetDistance = 1000;
    var targetPerspective = 1;
    var targetSize = 250;
    var targetDotSize = dotSize;

    // Rotation matrix
    var rotA = 5, rotB = 5;
    var cosA, sinA;
    var matrix = [[1,0,0],[0,1,0],[0,0,1]];

    // Mouse interaction
    var mouseX = 0, mouseY = 0;
    var mouseTargetX = 0, mouseTargetY = 0;
    var mouseInfluence = 0;

    // Wave motion phase accumulators
    var motionPha1 = 0, motionPha2 = 0;
    var MOTION_SPEED_1 = 1.3;
    var MOTION_SPEED_2 = 0.8;

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
      return {
        x: scale * x,
        y: scale * y,
        alpha: scale < 1 ? scale * scale : 1,
        scale: scale
      };
    }

    function render() {
      requestAnimationFrame(render);

      // Interpolate waves toward morph target
      for (var key in morphTarget) {
        if (waves.hasOwnProperty(key)) {
          waves[key] += (morphTarget[key] - waves[key]) * morphSpeed;
        }
      }

      // Interpolate distance, perspective, size
      blobDistance += (targetDistance - blobDistance) * 0.03;
      perspectiveDistortion += (targetPerspective - perspectiveDistortion) * 0.03;
      blobSize += (targetSize - blobSize) * 0.05;
      dotSize += (targetDotSize - dotSize) * 0.05;

      // Mouse smoothing
      mouseX += (mouseTargetX - mouseX) * 0.05;
      mouseY += (mouseTargetY - mouseY) * 0.05;

      // Wave motion - continuously animate phase
      motionPha1 += MOTION_SPEED_1 * 0.016;
      motionPha2 += MOTION_SPEED_2 * 0.016;

      // Rotation
      var O = Math.sqrt(rotA * rotA + rotB * rotB);
      var n = rotA / O || 0.0001;
      var p = -rotB / O || 0.0001;

      sinA = Math.sin(angle);
      cosA = Math.cos(angle);

      var rot = [
        [n*n + p*p*cosA,   n*p*(1-cosA),   p*sinA],
        [n*p*(1-cosA),     p*p + n*n*cosA, -n*sinA],
        [-p*sinA,          n*sinA,         (n*n + p*p)*cosA]
      ];

      // Multiply with accumulated matrix
      var newMatrix = [[0,0,0],[0,0,0],[0,0,0]];
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
          newMatrix[i][j] = rot[i][0]*matrix[0][j] + rot[i][1]*matrix[1][j] + rot[i][2]*matrix[2][j];
        }
      }
      matrix = newMatrix;

      // Add mouse influence to rotation
      var mouseRotY = mouseX * 0.0003;
      var mouseRotX = mouseY * 0.0003;
      rotA = 5 + mouseY * 2;
      rotB = 5 + mouseX * 2;

      // Interpolate dot color
      dotColor.r += (dotColorTarget.r - dotColor.r) * 0.05;
      dotColor.g += (dotColorTarget.g - dotColor.g) * 0.05;
      dotColor.b += (dotColorTarget.b - dotColor.b) * 0.05;

      // Clear and draw
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgb(' + Math.round(dotColor.r) + ',' + Math.round(dotColor.g) + ',' + Math.round(dotColor.b) + ')';
      ctx.save();
      ctx.translate(width / 2, height / 2);

      var PI = Math.PI;
      var halfPI = PI / 2;

      for (var lat = DETAIL; lat--; ) {
        var theta = lat / DETAIL * PI - halfPI;
        var ringDots = Math.round(DETAIL * Math.cos(theta) * 2);
        if (ringDots < 1) ringDots = 1;

        for (var lon = ringDots; lon--; ) {
          var phi = lon / ringDots * 2 * PI - PI;

          // Compute radius with wave deformations
          var r1 = blobSize + waves.amp1 * Math.sin(waves.freq1 * theta + waves.pha1 + motionPha1);
          var r2 = blobSize + waves.amp2 * Math.sin(waves.freq2 * phi + waves.pha2 + motionPha2);
          var r3 = blobSize + waves.amp3 * Math.sin(waves.freq3 * theta + waves.pha3);

          // Combine: use different radii for different axes
          var x = r1 * Math.cos(theta) * Math.cos(phi);
          var y = r2 * Math.cos(theta) * Math.sin(phi);
          var z = r3 * Math.sin(theta);

          // Apply rotation matrix
          var rx = matrix[0][0]*x + matrix[0][1]*y + matrix[0][2]*z;
          var ry = matrix[1][0]*x + matrix[1][1]*y + matrix[1][2]*z;
          var rz = matrix[2][0]*x + matrix[2][1]*y + matrix[2][2]*z;

          // Project
          var p3d = project3D(rx, ry, rz);
          var size = dotSize * p3d.scale;

          if (size > 0) {
            ctx.globalAlpha = p3d.alpha * 0.65;
            ctx.fillRect(p3d.x, p3d.y, size, size);
          }
        }
      }

      ctx.restore();
    }

    // Switch between light and dark theme
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

    // Morph to a shape
    function morphTo(shapeIndex) {
      if (shapeIndex >= 0 && shapeIndex < shapes.length && shapeIndex !== currentShape) {
        currentShape = shapeIndex;
        morphTarget = shapes[shapeIndex];
      }
    }

    // Section-based scroll detection
    function onScroll() {
      var sections = document.querySelectorAll('.section');
      var viewportCenter = window.innerHeight / 2;

      for (var i = sections.length - 1; i >= 0; i--) {
        var rect = sections[i].getBoundingClientRect();
        if (rect.top < viewportCenter && rect.bottom > 0) {
          var sectionId = sections[i].id;

          if (sectionId === 'hero') {
            morphTo(0);
            targetDistance = 1000;
            targetPerspective = 1;
            targetSize = 250;
            targetDotSize = window.innerWidth > 480 ? 1.5 : 1;
            setTheme('dark');
          } else if (sectionId === 'about') {
            morphTo(1);
            targetDistance = 0;
            targetPerspective = 3;
            targetSize = 220;
            targetDotSize = window.innerWidth > 480 ? 1 : 0.8;
            setTheme('light');
          } else if (sectionId === 'work') {
            morphTo(2);
            targetDistance = 1000;
            targetPerspective = 1;
            targetSize = 250;
            targetDotSize = window.innerWidth > 480 ? 1.5 : 1;
            setTheme('dark');
          } else if (sectionId === 'expertise') {
            morphTo(3);
            targetDistance = 1000;
            targetPerspective = 1;
            targetSize = 220;
            targetDotSize = window.innerWidth > 480 ? 1.021 : 0.6;
            setTheme('light');
          } else if (sectionId === 'contact') {
            morphTo(0);
            targetDistance = 1000;
            targetPerspective = 1;
            targetSize = 200;
            targetDotSize = window.innerWidth > 480 ? 1 : 0.8;
            setTheme('dark');
          }
          break;
        }
      }
    }

    // Events
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll);

    document.addEventListener('mousemove', function(e) {
      mouseTargetX = (e.clientX - window.innerWidth / 2);
      mouseTargetY = (e.clientY - window.innerHeight / 2);
    });

    resize();
    render();
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
     SCROLL REVEAL
     ======================================== */
  function initScrollReveal() {
    var elements = document.querySelectorAll('[data-reveal]');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
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
    }, {
      threshold: 0.2,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ========================================
     SMOOTH SCROLL
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

})();
