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
   * Fix for cart item remove buttons that use inline onclick handlers
   * This adds a global function that can be called from inline handlers
   */
  window.closeCartItem = function (element) {
    if (element) {
      // Find the closest cart item and hide it
      const cartItem = element.closest('cart-items') || element.closest('cart-drawer-items');
      if (cartItem) {
        // If the custom close method exists, use it
        if (typeof cartItem.close === 'function') {
          cartItem.close();
        } else {
          // Otherwise manually hide/remove the item
          const itemContainer = element.closest('cart-item') || element.closest('tr') || element.closest('li');
          if (itemContainer) {
            itemContainer.style.display = 'none';

            // Trigger cart update through normal mechanisms
            const updateLink = document.createElement('a');
            updateLink.href = window.routes.cart_change_url;
            updateLink.click();
          }
        }
      }
      return false; // Prevent default action
    }
  };

  /**
   * Initialize product recommendations in the correct accordion section
   */
  function initializeProductRecommendations() {
    // Skip if not on a product page
    if (!window.location.pathname.includes('/products/')) return;

    // Get the product ID
    let productId = null;
    const productInfo = document.querySelector('product-info');

    if (productInfo && productInfo.dataset.productId) {
      productId = productInfo.dataset.productId;
    } else {
      // Try other methods to find product ID
      const productMetaTag = document.querySelector('meta[property="og:product_id"]');
      if (productMetaTag) {
        productId = productMetaTag.getAttribute('content');
      }

      // If still not found, try data attributes on any product form
      if (!productId) {
        const productForm = document.querySelector('form[action*="/cart/add"]');
        if (productForm && productForm.dataset.productId) {
          productId = productForm.dataset.productId;
        }
      }
    }

    if (!productId) return;

    // Try to find the existing complementary products container by ID pattern
    let targetContainer = document.querySelector('[id^="Details-complementary-products-"]');
    let contentContainer = null;

    // If we didn't find it by ID, try to find by title text
    if (!targetContainer) {
      const allAccordions = document.querySelectorAll('.product__accordion details');
      for (const accordion of allAccordions) {
        const title = accordion.querySelector('.accordion__title');
        if (
          title &&
          title.textContent &&
          (title.textContent.trim().toLowerCase().includes('complementary') ||
            title.textContent.trim().toLowerCase().includes('complete your') ||
            title.textContent.trim().toLowerCase().includes('you might also like'))
        ) {
          targetContainer = accordion;
          break;
        }
      }
    }

    // If we found a container, get its content area
    if (targetContainer) {
      contentContainer = targetContainer.querySelector('.accordion__content');

      // Ensure the accordion is open
      targetContainer.setAttribute('open', 'true');
    }

    // If no content container found, exit
    if (!contentContainer) return;

    // Show loading indicator
    contentContainer.innerHTML = `
      <div class="loading-overlay">
        <div class="loading-overlay__spinner">
          <svg aria-hidden="true" focusable="false" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
          </svg>
        </div>
      </div>
    `;

    // Determine the section ID
    const sectionId = document.querySelector('[data-section-id]')?.dataset.sectionId || 'main-product';

    // Fetch recommendations
    const url = `/recommendations/products?product_id=${productId}&section_id=${sectionId}&limit=6&intent=complementary`;

    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = text;

        // Try different selectors to find product recommendations content
        let recommendationsContent = extractRecommendationsContent(tempContainer);

        if (recommendationsContent) {
          // Clear the container
          contentContainer.innerHTML = '';

          // Insert the recommendations
          contentContainer.appendChild(recommendationsContent);

          // Make sure accordion is open
          targetContainer.open = true;

          // Initialize any quick add buttons
          contentContainer.querySelectorAll('.quick-add__submit').forEach((button) => {
            if (!button.hasAttribute('data-listener-added')) {
              button.setAttribute('data-listener-added', 'true');
              button.addEventListener('click', (event) => {
                const form = button.closest('form');
                if (form) {
                  event.preventDefault();
                  form.submit();
                }
              });
            }
          });
        } else {
          contentContainer.innerHTML = '<p>No recommended products found</p>';
        }
      })
      .catch((error) => {
        contentContainer.innerHTML = '<p>Error loading recommendations</p>';
      });
  }

  /**
   * Helper function to extract recommendations content
   */
  function extractRecommendationsContent(tempContainer) {
    // Try different selectors to find product recommendations
    let recommendationsContent =
      tempContainer.querySelector('.complementary-products') ||
      tempContainer.querySelector('.product-recommendations') ||
      tempContainer.querySelector('.grid--uniform');

    if (!recommendationsContent) {
      // If we still can't find a container, extract any product grid
      recommendationsContent = tempContainer.querySelector('.grid.product-grid');
    }

    if (!recommendationsContent) {
      // Last resort: extract the inner content directly
      const productCards = tempContainer.querySelectorAll('.grid__item');
      if (productCards.length > 0) {
        const productGridContainer = document.createElement('div');
        productGridContainer.className = 'grid product-grid grid--2-col-tablet-down grid--4-col-desktop';

        productCards.forEach((card) => {
          productGridContainer.appendChild(card.cloneNode(true));
        });

        // Add a title above the grid
        const container = document.createElement('div');
        container.className = 'complementary-products';

        // Add the grid to the container
        container.appendChild(productGridContainer);
        recommendationsContent = container;
      }
    }

    return recommendationsContent;
  }

  /**
   * Initialize custom scripts on DOMContentLoaded
   */
  document.addEventListener('DOMContentLoaded', function () {
    // Initialize floating cart button
    initializeFloatingCart();

    // Initialize product recommendations
    initializeProductRecommendations();

    console.log('Rave Yoga custom JS initialized.');
  });

  /**
   * Shopify Theme Editor Support
   * - Listen for section load/select events if you need to re-initialize JS for dynamic sections.
   */
  document.addEventListener('shopify:section:load', function (event) {
    // Re-initialize floating cart after section loads
    initializeFloatingCart();

    // Re-initialize product recommendations
    initializeProductRecommendations();
  });

  // Additional initialization code can go here

  // Add more methods as needed for future features
})();
