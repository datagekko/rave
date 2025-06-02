// RAVE YOGA CUSTOM JAVASCRIPT
// Custom JS for Rave Yoga Shopify Theme - Sprint 1

(function () {
  'use strict';

  /**
   * Debounce function to limit the rate at which a function can fire.
   * @param {function} func Function to debounce.
   * @param {number} wait Timeout in milliseconds.
   * @returns {function} Debounced function.
   */
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  /**
   * Example: Add a class to the body when the page is scrolled.
   */
  // function handleScroll() {
  //   if (window.scrollY > 50) {
  //     document.body.classList.add('scrolled');
  //   } else {
  //     document.body.classList.remove('scrolled');
  //   }
  // }
  // window.addEventListener('scroll', debounce(handleScroll, 100));

  /**
   * Initialize floating cart button functionality
   */
  function initializeFloatingCart() {
    const floatingCartButton = document.querySelector('.rave-floating-cart');

    if (floatingCartButton) {
      // Remove any existing event listeners to prevent duplicates
      const newButton = floatingCartButton.cloneNode(true);
      floatingCartButton.parentNode.replaceChild(newButton, floatingCartButton);

      // Add click event to open cart drawer using direct DOM manipulation
      newButton.addEventListener('click', function (event) {
        event.preventDefault();

        // Get the cart drawer element directly
        const cartDrawerElement = document.getElementById('CartDrawer');
        const cartDrawerWrapper = document.querySelector('cart-drawer');

        if (cartDrawerElement && cartDrawerWrapper) {
          // Manually toggle classes to show the cart drawer
          document.body.classList.add('overflow-hidden');
          cartDrawerWrapper.classList.add('animate', 'active');

          // Store the current button as active element for accessibility
          cartDrawerWrapper.activeElement = newButton;

          console.log('Cart drawer opened via direct DOM manipulation');

          // Make sure overlay and close buttons close the drawer
          const overlay = document.getElementById('CartDrawer-Overlay');
          const closeButtons = cartDrawerWrapper.querySelectorAll('.drawer__close');

          if (overlay) {
            // Remove existing event listeners and add a new one
            const newOverlay = overlay.cloneNode(true);
            overlay.parentNode.replaceChild(newOverlay, overlay);

            newOverlay.addEventListener('click', function () {
              closeCartDrawer(cartDrawerWrapper);
            });
          }

          closeButtons.forEach((button) => {
            // Remove existing event listeners and add a new one
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener('click', function () {
              closeCartDrawer(cartDrawerWrapper);
            });
          });

          // Add escape key handler
          document.addEventListener('keyup', function cartDrawerKeyupHandler(evt) {
            if (evt.code === 'Escape') {
              closeCartDrawer(cartDrawerWrapper);
              document.removeEventListener('keyup', cartDrawerKeyupHandler);
            }
          });
        } else {
          console.warn('Cart drawer elements not found');
        }
      });
    } else {
      console.warn('Floating cart button not found');
    }
  }

  /**
   * Close cart drawer using direct DOM manipulation
   */
  function closeCartDrawer(cartDrawerWrapper) {
    if (cartDrawerWrapper) {
      cartDrawerWrapper.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
      console.log('Cart drawer closed via direct DOM manipulation');

      // Return focus to the saved active element if available
      if (cartDrawerWrapper.activeElement) {
        cartDrawerWrapper.activeElement.focus();
      }
    }
  }

  /**
   * Initialize custom scripts on DOMContentLoaded
   */
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize floating cart button
    initializeFloatingCart();

    console.log('Rave Yoga custom JS initialized.');
  });

  /**
   * Shopify Theme Editor Support
   * - Listen for section load/select events if you need to re-initialize JS for dynamic sections.
   */
  document.addEventListener('shopify:section:load', function (event) {
    // Re-initialize floating cart after section loads
    initializeFloatingCart();
  });

  // Additional initialization code can go here

  // Add more methods as needed for future features
})();
