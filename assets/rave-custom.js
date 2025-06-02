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
   * Fixed version: Initialize product recommendations in the correct accordion section
   */
  function initializeProductRecommendations() {
    console.log('DEBUG: Starting product recommendations initialization');

    // First check if we're on a product page
    if (!window.location.pathname.includes('/products/')) {
      console.log('DEBUG: Not on a product page, exiting');
      return;
    }

    // Log DOM structure to help debugging
    console.log('DEBUG: Accordion elements present:', document.querySelectorAll('.product__accordion details').length);

    // Log all accordion titles to help identify the right one
    document.querySelectorAll('.product__accordion details .accordion__title').forEach((title) => {
      console.log('DEBUG: Found accordion title:', title.textContent.trim());
    });

    // Get the product ID
    let productId = null;
    const productInfo = document.querySelector('product-info');
    if (productInfo && productInfo.dataset.productId) {
      productId = productInfo.dataset.productId;
      console.log('DEBUG: Found product ID from product-info:', productId);
    } else {
      // Try other methods to find product ID
      const productMetaTag = document.querySelector('meta[property="og:product_id"]');
      if (productMetaTag) {
        productId = productMetaTag.getAttribute('content');
        console.log('DEBUG: Found product ID from meta tag:', productId);
      }

      // If still not found, try data attributes on any product form
      if (!productId) {
        const productForm = document.querySelector('form[action*="/cart/add"]');
        if (productForm && productForm.dataset.productId) {
          productId = productForm.dataset.productId;
          console.log('DEBUG: Found product ID from form:', productId);
        }
      }
    }

    if (!productId) {
      console.warn('Could not find product ID for recommendations');
      return;
    }

    // Find or create the Complementary Products accordion
    let targetContainer = null;
    let contentContainer = null;
    let isNewAccordion = false;

    // First try to find an existing Complementary Products accordion
    const allAccordions = document.querySelectorAll('.product__accordion details');
    for (const accordion of allAccordions) {
      const title = accordion.querySelector('.accordion__title');
      if (
        title &&
        title.textContent &&
        (title.textContent.trim().toLowerCase().includes('complementary') ||
          title.textContent.trim().toLowerCase().includes('complete your') ||
          title.textContent.trim().toLowerCase().includes('you might also like') ||
          title.textContent.trim().toLowerCase().includes('recommended'))
      ) {
        targetContainer = accordion;
        contentContainer = accordion.querySelector('.accordion__content');
        console.log('DEBUG: Found complementary products accordion by title:', title.textContent.trim());
        break;
      }
    }

    // If we didn't find one, create a new accordion for complementary products
    if (!targetContainer) {
      console.log('DEBUG: Creating new Complementary Products accordion');

      // Find the accordion container
      const accordionContainer = document.querySelector('.product__accordion');
      if (!accordionContainer) {
        console.warn('DEBUG: Could not find accordion container');
        return;
      }

      // Create new accordion
      targetContainer = document.createElement('details');
      targetContainer.setAttribute('id', 'Details-complementary-products-custom');
      targetContainer.setAttribute('open', 'true');

      // Create summary element with title
      const summary = document.createElement('summary');
      const summaryTitle = document.createElement('h2');
      summaryTitle.className = 'h4 accordion__title';
      summaryTitle.textContent = 'You might also like';

      const summaryTitleDiv = document.createElement('div');
      summaryTitleDiv.className = 'summary__title';

      // Add icon if we can find one to match style
      const existingIcon = document.querySelector('.product__accordion details .summary__title svg');
      if (existingIcon) {
        summaryTitleDiv.appendChild(existingIcon.cloneNode(true));
      }

      summaryTitleDiv.appendChild(summaryTitle);
      summary.appendChild(summaryTitleDiv);

      // Add caret icon
      const caretSVG = document.createElement('div');
      caretSVG.innerHTML = `<svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"></path>
      </svg>`;
      summary.appendChild(caretSVG.firstChild);

      // Create content container
      contentContainer = document.createElement('div');
      contentContainer.className = 'accordion__content rte';
      contentContainer.setAttribute('id', 'ProductAccordion-complementary-products-custom');

      // Assemble accordion
      targetContainer.appendChild(summary);
      targetContainer.appendChild(contentContainer);

      // Add to page
      accordionContainer.appendChild(targetContainer);
      isNewAccordion = true;

      console.log('DEBUG: Created new accordion for complementary products');
    }

    if (!contentContainer) {
      console.warn('DEBUG: No content container available');
      return;
    }

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
    console.log('DEBUG: Fetching recommendations from URL:', url);

    fetch(url)
      .then((response) => {
        console.log('DEBUG: Response status:', response.status);
        return response.text();
      })
      .then((text) => {
        console.log('DEBUG: Received response text length:', text.length);
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = text;

        // Log what we found in the response
        console.log(
          'DEBUG: Response contains complementary-products:',
          !!tempContainer.querySelector('.complementary-products')
        );
        console.log(
          'DEBUG: Response contains product-recommendations:',
          !!tempContainer.querySelector('.product-recommendations')
        );
        console.log('DEBUG: Response contains grid--uniform:', !!tempContainer.querySelector('.grid--uniform'));

        // Try different selectors to find product recommendations content
        let recommendationsContent = extractRecommendationsContent(tempContainer);

        if (recommendationsContent) {
          console.log('DEBUG: Found recommendations content');

          // Clear the container
          contentContainer.innerHTML = '';

          // Insert the recommendations
          contentContainer.appendChild(recommendationsContent);
          console.log('DEBUG: Inserted recommendations into container');

          // Make sure accordion is open
          targetContainer.open = true;
          console.log('DEBUG: Ensured accordion is open');

          // If it's a new accordion, we need to handle events properly
          if (isNewAccordion) {
            // Add click event to toggle accordion
            targetContainer.querySelector('summary').addEventListener('click', function (event) {
              event.preventDefault();
              targetContainer.toggleAttribute('open');
            });
          }

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
          console.warn('DEBUG: No recommendations content found in response');
          contentContainer.innerHTML = '<p>No recommended products found</p>';

          // If we created a new accordion but didn't find any products, remove it
          if (isNewAccordion) {
            targetContainer.remove();
          }
        }
      })
      .catch((error) => {
        console.error('DEBUG: Error loading recommendations:', error);
        contentContainer.innerHTML = '<p>Error loading recommendations</p>';

        // If we created a new accordion but encountered an error, remove it
        if (isNewAccordion) {
          targetContainer.remove();
        }
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

        console.log('DEBUG: Created custom grid for recommendations with', productCards.length, 'items');
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
