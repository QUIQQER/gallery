/**
 * Loads zoom functionality on first image interaction.
 */
(function () {
    "use strict";

    const zoomModule = "package/quiqqer/gallery/bin/utils/ZoomImages";
    let zoomPromise = null;
    let parsed = false;

    const getZoomElement = (target) => {
        if (!target || !target.closest) {
            return null;
        }

        return target.closest('[data-zoom="1"]');
    };

    const loadZoom = () => {
        if (zoomPromise) {
            return zoomPromise;
        }

        zoomPromise = new Promise((resolve) => {
            if (typeof require === "undefined") {
                return;
            }

            const modules = [zoomModule];

            if (typeof loadMootools !== "undefined") {
                modules.push("MooTools");
            }

            require(modules, (ZoomImages) => {
                resolve(ZoomImages);
            });
        });

        return zoomPromise;
    };

    const parseZoomImages = (ZoomImages) => {
        if (parsed || !ZoomImages || !document.body) {
            return;
        }

        parsed = true;
        ZoomImages.parseElement(document.body);
    };

    const markZoomImages = () => {
        document.querySelectorAll('[data-zoom="1"]').forEach((image) => {
            image.style.cursor = "pointer";
        });
    };

    const loadAndParse = () => {
        return loadZoom().then((ZoomImages) => {
            parseZoomImages(ZoomImages);
            return ZoomImages;
        });
    };

    const onClick = (event) => {
        const image = getZoomElement(event.target);

        if (!image) {
            return;
        }

        if (parsed) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        loadAndParse().then((ZoomImages) => {
            document.removeEventListener("click", onClick, true);

            if (ZoomImages) {
                ZoomImages.imageClick(image);
            }
        });
    };

    const init = () => {
        markZoomImages();
        document.addEventListener("click", onClick, true);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, {once: true});
        return;
    }

    init();
}());
