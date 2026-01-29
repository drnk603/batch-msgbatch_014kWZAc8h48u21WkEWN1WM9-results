(function() {
  'use strict';

  if (typeof window.__app !== 'undefined') {
    return;
  }

  const app = window.__app = {};

  const debounce = (func, wait) => {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  };

  function initBurgerMenu() {
    if (app.burgerInit) return;
    app.burgerInit = true;

    const nav = document.querySelector('.navbar-collapse, .c-nav');
    const toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
    const navLinks = document.querySelectorAll('.nav-link, .c-nav__link, .c-nav__item');

    if (!nav || !toggle) return;

    let isOpen = false;
    let focusableElements = [];

    const updateFocusableElements = () => {
      focusableElements = Array.from(nav.querySelectorAll('a[href], button:not([disabled])'));
    };

    const openMenu = () => {
      isOpen = true;
      nav.classList.add('show', 'is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (focusableElements[0]) {
        setTimeout(() => focusableElements[0].focus(), 100);
      }
    };

    const closeMenu = () => {
      isOpen = false;
      nav.classList.remove('show', 'is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    };

    const trapFocus = (e) => {
      if (!isOpen || e.key !== 'Tab') return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
      trapFocus(e);
    });

    document.addEventListener('click', (e) => {
      if (isOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (isOpen) closeMenu();
      });
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }, 150));
  }

  function initSmoothScroll() {
    if (app.smoothScrollInit) return;
    app.smoothScrollInit = true;

    const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '#!') return;

      if (!isHomePage && href.startsWith('#')) {
        link.setAttribute('href', `/${href}`);
      }

      link.addEventListener('click', function(e) {
        const targetHref = this.getAttribute('href');
        const hashIndex = targetHref.indexOf('#');

        if (hashIndex === -1) return;

        const hash = targetHref.substring(hashIndex);
        if (hash === '#' || hash === '#!') return;

        const isCurrentPage = hashIndex === 0 || targetHref.substring(0, hashIndex).match(/^\/?(?:index\.html)?$/);

        if (isCurrentPage) {
          e.preventDefault();
          const targetId = hash.substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            const header = document.querySelector('.l-header');
            const headerHeight = header ? header.offsetHeight : 80;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });

            history.pushState(null, '', hash);
          }
        }
      });
    });
  }

  function initScrollSpy() {
    if (app.scrollSpyInit) return;
    app.scrollSpyInit = true;

    const sections = document.querySelectorAll('section[id], div[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"], .c-nav__link[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const updateActiveLink = throttle(() => {
      const scrollPos = window.pageYOffset + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'page');
            }
          });
        }
      });
    }, 100);

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();
  }

  function initActiveMenu() {
    if (app.activeMenuInit) return;
    app.activeMenuInit = true;

    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .c-nav__link');

    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      if (!linkPath || linkPath.startsWith('#')) return;

      link.classList.remove('active');
      link.removeAttribute('aria-current');

      if (linkPath === currentPath || 
          (currentPath === '/' && linkPath === '/index.html') || 
          (currentPath === '/index.html' && linkPath === '/')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initImages() {
    if (app.imagesInit) return;
    app.imagesInit = true;

    const images = document.querySelectorAll('img');
    const placeholderSVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%236c757d"%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E';

    images.forEach(img => {
      if (!img.hasAttribute('loading') && !img.classList.contains('c-logo__img') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      img.addEventListener('error', function() {
        if (this.src !== placeholderSVG) {
          this.src = placeholderSVG;
          this.style.objectFit = 'contain';
          if (this.closest('.c-logo') || this.classList.contains('c-logo__img')) {
            this.style.maxHeight = '40px';
          }
        }
      });
    });
  }

  function initFormValidation() {
    if (app.formsInit) return;
    app.formsInit = true;

    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const patterns = {
      name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
      email: /^[^s@]+@[^s@]+\.[^s@]+$/,
      phone: /^[ds+\-()]{7,20}$/,
      message: /^.{10,1000}$/
    };

    const validateField = (field) => {
      const value = field.value.trim();
      const fieldType = field.type;
      const fieldId = field.id;
      let isValid = true;
      let errorMsg = '';

      if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMsg = 'Dieses Feld ist erforderlich.';
      } else if (value) {
        if (fieldId === 'firstName' || fieldId === 'lastName') {
          if (!patterns.name.test(value)) {
            isValid = false;
            errorMsg = 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen).';
          }
        } else if (fieldType === 'email') {
          if (!patterns.email.test(value)) {
            isValid = false;
            errorMsg = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
          }
        } else if (fieldType === 'tel') {
          if (!patterns.phone.test(value)) {
            isValid = false;
            errorMsg = 'Bitte geben Sie eine gültige Telefonnummer ein.';
          }
        } else if (fieldId === 'message') {
          if (!patterns.message.test(value)) {
            isValid = false;
            errorMsg = 'Die Nachricht muss zwischen 10 und 1000 Zeichen lang sein.';
          }
        }
      }

      const feedback = field.parentElement.querySelector('.invalid-feedback, .c-form__error');
      if (feedback) {
        feedback.textContent = errorMsg;
        feedback.classList.toggle('d-block', !isValid);
        feedback.classList.toggle('is-visible', !isValid);
      }

      field.classList.toggle('is-invalid', !isValid);
      field.setAttribute('aria-invalid', !isValid);

      return isValid;
    };

    const fields = contactForm.querySelectorAll('input[required], textarea[required], select[required]');
    fields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', debounce(() => {
        if (field.classList.contains('is-invalid')) {
          validateField(field);
        }
      }, 300));
    });

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();

      let isFormValid = true;
      fields.forEach(field => {
        if (!validateField(field)) {
          isFormValid = false;
        }
      });

      const privacyConsent = document.getElementById('privacyConsent');
      if (privacyConsent && !privacyConsent.checked) {
        isFormValid = false;
        app.notify('Bitte stimmen Sie der Datenschutzerklärung zu.', 'danger');
      }

      if (!isFormValid) {
        contactForm.classList.add('was-validated');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
      }

      const formData = new FormData(contactForm);
      const jsonData = {};
      formData.forEach((value, key) => {
        jsonData[key] = escapeHtml(value);
      });

      setTimeout(() => {
        window.location.href = '/thank_you.html';
      }, 1000);
    });
  }

  app.notify = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.style.cssText = 'min-width:250px;margin-bottom:10px;';
    toast.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 5000);
  };

  function initScrollToTop() {
    if (app.scrollToTopInit) return;
    app.scrollToTopInit = true;

    const scrollBtn = document.querySelector('[data-scroll-top], .c-scroll-top');
    if (!scrollBtn) return;

    const toggleVisibility = throttle(() => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('is-visible');
      } else {
        scrollBtn.classList.remove('is-visible');
      }
    }, 100);

    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility();
  }

  function initPortfolioFilter() {
    if (app.portfolioInit) return;
    app.portfolioInit = true;

    const filterButtons = document.querySelectorAll('[data-filter]');
    const portfolioItems = document.querySelectorAll('[data-category]');

    if (filterButtons.length === 0 || portfolioItems.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');

        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        portfolioItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            item.classList.remove('u-hide');
            item.style.display = '';
          } else {
            item.classList.add('u-hide');
            item.style.display = 'none';
          }
        });
      });
    });
  }

  function initModals() {
    if (app.modalsInit) return;
    app.modalsInit = true;

    const modalTriggers = document.querySelectorAll('[data-modal], [data-project], [data-bs-toggle="modal"]');
    const modals = document.querySelectorAll('.c-modal, .modal');

    const openModal = (modal) => {
      modal.classList.add('is-open', 'show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('u-no-scroll');
    };

    const closeModal = (modal) => {
      modal.classList.remove('is-open', 'show');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('u-no-scroll');
    };

    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const modalId = this.getAttribute('data-modal') || this.getAttribute('data-bs-target') || '#projectModal';
        const modal = document.querySelector(modalId);
        if (modal) openModal(modal);
      });
    });

    modals.forEach(modal => {
      const closeButtons = modal.querySelectorAll('[data-modal-close], [data-bs-dismiss="modal"], .c-modal__close');
      const overlay = modal.querySelector('.c-modal__overlay, .modal-backdrop');

      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal(modal));
      });

      if (overlay) {
        overlay.addEventListener('click', () => closeModal(modal));
      }

      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal(modal);
      });
    });
  }

  function initCountUp() {
    if (app.countUpInit) return;
    app.countUpInit = true;

    const statNumbers = document.querySelectorAll('.c-stat__number[data-count]');
    if (statNumbers.length === 0) return;

    const animateCount = (element) => {
      const target = parseInt(element.getAttribute('data-count'));
      const duration = 2000;
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          element.textContent = target;
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(current);
        }
      }, 16);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.hasAttribute('data-counted')) {
          entry.target.setAttribute('data-counted', 'true');
          animateCount(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
  }

  app.init = () => {
    if (app.initialized) return;
    app.initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenu();
    initImages();
    initFormValidation();
    initScrollToTop();
    initPortfolioFilter();
    initModals();
    initCountUp();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();