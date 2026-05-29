/**
 * Search images to zoom.
 */
define('package/quiqqer/gallery/bin/utils/ZoomImages', function () {
    "use strict";

    const imageList = {};
    let galleryCounter = 0;

    const createGalleryId = () => {
        galleryCounter += 1;
        return `quiqqer-gallery-${Date.now()}-${galleryCounter}`;
    };

    const getAttribute = (element, attribute) => {
        if (!element) {
            return null;
        }

        if (typeof element.getAttribute === "function") {
            return element.getAttribute(attribute);
        }

        if (typeof element.get === "function") {
            return element.get(attribute);
        }

        return null;
    };

    const setAttribute = (element, attribute, value) => {
        if (typeof element.setAttribute === "function") {
            element.setAttribute(attribute, value);
            return;
        }

        if (typeof element.set === "function") {
            element.set(attribute, value);
        }
    };

    const getImageSource = (image) => {
        return getAttribute(image, "data-src") || getAttribute(image, "src") || "";
    };

    const getZoomImages = (parent) => {
        if (!parent) {
            return [];
        }

        if (typeof parent.querySelectorAll === "function") {
            return Array.from(parent.querySelectorAll('[data-zoom="1"]'));
        }

        if (typeof parent.getElements === "function") {
            return Array.from(parent.getElements('[data-zoom="1"]'));
        }

        return [];
    };

    const stopEvent = (event) => {
        if (typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        if (typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }

        if (typeof event.stop === "function") {
            event.stop();
        }
    };

    const api = {
        /**
         * Parse the parent element and search images to zoom.
         *
         * @param {HTMLElement} parent
         */
        parseElement(parent) {
            const images = getZoomImages(parent).filter((image) => {
                return !getAttribute(image, "data-gallery-id");
            });

            if (!images.length) {
                return;
            }

            const galleryId = createGalleryId();
            const imageData = images.map((image) => {
                image.style.cursor = "pointer";
                setAttribute(image, "data-gallery-id", galleryId);

                image.addEventListener("click", (event) => {
                    stopEvent(event);
                    api.imageClick(image);
                });

                return {
                    src: getImageSource(image),
                    title: getAttribute(image, "title") || "",
                    short: ""
                };
            });

            imageList[galleryId] = imageData;
        },

        /**
         * Execute an image click and open the zoom popup.
         *
         * @param {HTMLElement} image
         */
        imageClick(image) {
            const galleryId = getAttribute(image, "data-gallery-id");

            if (!galleryId || typeof imageList[galleryId] === "undefined") {
                return;
            }

            require([
                'package/quiqqer/gallery/bin/controls/Popup'
            ], function (ImagePopup) {
                new ImagePopup({
                    images: imageList[galleryId],
                    current: getImageSource(image)
                }).open();
            });
        }
    };

    return api;
});
