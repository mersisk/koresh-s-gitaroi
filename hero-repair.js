(() => {
  'use strict';

  const images = document.querySelectorAll('.intro-portrait img, .hero-portrait img');

  images.forEach((image) => {
    const container = image.closest('.intro-portrait, .hero-portrait');
    if (!container) return;

    const markReady = () => {
      container.classList.remove('is-error');
      container.classList.add('is-ready');
    };

    const markError = () => {
      container.classList.remove('is-ready');
      container.classList.add('is-error');
    };

    if (image.complete) {
      if (image.naturalWidth > 0) markReady();
      else markError();
      return;
    }

    image.addEventListener('load', markReady, { once: true });
    image.addEventListener('error', markError, { once: true });
  });
})();
