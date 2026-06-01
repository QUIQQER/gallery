/**
 * Image Popup
 * Shows a image popup and the user can navigate through a list of images
 */
define('package/quiqqer/gallery/bin/controls/Popup', [

    'qui/QUI',
    'qui/controls/windows/Popup',
    'qui/utils/Math',
    URL_OPT_DIR + 'bin/quiqqer-asset/hammerjs/hammerjs/hammer.min.js',

    'text!package/quiqqer/gallery/bin/controls/Popup.html',
    'css!package/quiqqer/gallery/bin/controls/Popup.css'

], function (QUI, QUIWin, QUIMath, Hammer, template) {
    "use strict";

    return new Class({

        Extends: QUIWin,
        Type: 'package/quiqqer/gallery/bin/controls/Grid',

        Binds: [
            '$onOpen',
            '$onClose',
            '$keyup',
            '$onPopState',

            'showNextImage',
            'showPrevImage',
            '$__resize'
        ],

        options: {
            images: [],
            zIndex: 1000,
            current: false,
            buttons: false,
            touch: true
        },

        initialize: function (options) {
            this.parent(options);

            // defaults
            this.setAttributes({
                closeButton: false,
                maxHeight: 480,
                maxWidth: 640
            });

            this.$isOpen = false;
            this.__$current = this.getAttribute('current');
            this.$__mobile = (QUI.getWindowSize().x < 767);

            this.$Stats = null;
            this.$Image = null;

            this.$Prev = null;
            this.$Next = null;

            this.$ButtonCnr = null;
            this.$ButtonText = null;
            this.$ButtonPrev = null;
            this.$ButtonNext = null;

            this.parent(options);

            this.addEvents({
                onOpen: this.$onOpen,
                onClose: this.$onClose,
                onResize: this.$__resize
            });
        },

        /**
         * Resize event
         */
        $__resize: function () {
            if (!this.$ButtonCnr) {
                return;
            }

            if (!this.getElm()) {
                return;
            }

            const oldMobileStatus = this.$__mobile;
            this.$__mobile = (QUI.getWindowSize().x < 767);

            if (!this.$opened) {
                return;
            }

            const size = this.getElm().getSize();
            const textSize = this.$ButtonCnr.getSize();

            const height = size.y - textSize.y;

            if (this.$Next && this.$Prev) {
                this.$Next.setStyle('height', height);
                this.$Prev.setStyle('height', height);
            }

            if (oldMobileStatus === this.$__mobile) {
                return;
            }

            // redraw so we close and open new
            this.close().then(() => {
                this.open();
            });
        },

        /**
         * event : on open
         */
        $onOpen: function () {
            const Content = this.getContent();
            const Elm = this.getElm();
            const images = this.getAttribute('images');

            Elm.querySelectorAll('.qui-window-popup-buttons').forEach((Button) => Button.remove());

            this.$__mobile = (QUI.getWindowSize().x < 767);

            this.$ButtonCnr = document.createElement('div');
            this.$ButtonCnr.className = 'qui-gallery-popup-image-buttons';
            this.$ButtonCnr.innerHTML = template;
            this.getElm().appendChild(this.$ButtonCnr);

            this.$ButtonText = this.$ButtonCnr.querySelector(
                '.qui-gallery-popup-buttons-text'
            );

            this.$ButtonPrev = this.$ButtonCnr.querySelector(
                '.qui-gallery-popup-buttons-prev'
            );

            this.$ButtonNext = this.$ButtonCnr.querySelector(
                '.qui-gallery-popup-buttons-next'
            );

            this.$Stats = this.$ButtonCnr.querySelector(
                '.qui-gallery-popup-stats'
            );

            this.$Prev = document.createElement('div');
            this.$Prev.innerHTML = '<span class="fa fa-chevron-left"></span>';
            this.$Prev.className = 'qui-gallery-popup-imagePrev';
            this.$Prev.addEventListener('click', this.showPrevImage);
            Elm.appendChild(this.$Prev);

            this.$Next = document.createElement('div');
            this.$Next.innerHTML = '<span class="fa fa-chevron-right"></span>';
            this.$Next.className = 'qui-gallery-popup-imageNext';
            this.$Next.addEventListener('click', this.showNextImage);
            Elm.appendChild(this.$Next);


            if (Array.isArray(images) && images.length <= 1) {
                this.$Prev.setStyle('display', 'none');
                this.$Next.setStyle('display', 'none');
                this.$ButtonPrev.setStyle('display', 'none');
                this.$ButtonNext.setStyle('display', 'none');

                this.$ButtonText.setStyle('width', 'calc(100% - 100px)');
            }


            const Close = document.createElement('div');
            Close.className = 'fa fa-close qui-gallery-popup-close';
            Close.addEventListener('click', () => {
                this.close();
            });
            Elm.appendChild(Close);

            Content.setStyles({
                height: null,
                overflow: 'hidden',
                outline: 'none',
                padding: 0,
                textAlign: 'center'
            });

            if (!this.$__mobile) {
                Content.setStyles({
                    'align-items': 'center',
                    display: 'flex',
                    'justify-content': 'center'
                });
            }

            Elm.setStyles({
                boxShadow: '0 0 0 10px #fff, 0 10px 60px 10px rgba(8, 11, 19, 0.55)',
                outline: 'none'
            });

            this.Background.setAttribute('styles', {
                zIndex: this.getAttribute('zIndex')
            });

            this.Background.show();

            this.getElm().setStyles({
                zIndex: this.getAttribute('zIndex') + 1
            });

            // events
            this.$ButtonPrev.addEventListener('click', this.showPrevImage);

            this.$ButtonNext.addEventListener('click', this.showNextImage);

            this.$isOpen = true;


            // touch events
            if (this.getAttribute('touch')) {
                this.$Touch = new Hammer(this.$Content);

                this.$Touch.on('swipe', (ev) => {
                    if (ev.offsetDirection === 4) {
                        this.showPrevImage();
                        return;
                    }

                    if (ev.offsetDirection === 2) {
                        this.showNextImage();
                    }
                });
            }

            if (this.$__mobile) {
                this.$Content.setStyle('background', '#000');
                this.$Content.setStyle('padding', '60px 0');
                this.Loader.getElm().setStyle('background', '#000');

                this.getElm().appendChild(this.$ButtonText);

                this.$ButtonText.setStyles({
                    position: 'absolute',
                    top: 0,
                    width: 'calc(100% - 40px)'
                });

                this.$ButtonPrev.parentNode.insertBefore(this.$Stats, this.$ButtonPrev.nextSibling);

                this.$Stats.setStyles({
                    width: 'calc(100% - 200px)'
                });
            }

            // bind keys
            window.addEventListener('keyup', this.$keyup);
            window.addEventListener('popstate', this.$onPopState);

            if (!this.__$current) {
                this.showFirstImage();
            } else {
                this.showImage(this.__$current);
            }
        },

        /**
         * event : on close
         */
        $onClose: function () {
            this.$isOpen = false;
            this.__$current = false;

            if (this.$ButtonCnr) {
                this.$ButtonCnr.remove();
            }

            if (this.$Image) {
                this.$Image.remove();
            }

            if (this.$Stats) {
                this.$Stats.remove();
            }

            if (this.$Image) {
                this.$Image.remove();
            }

            if (this.$Prev) {
                this.$Prev.remove();
            }

            if (this.$Next) {
                this.$Next.remove();
            }

            if (this.$ButtonCnr) {
                this.$ButtonCnr.remove();
            }

            if (this.$ButtonText) {
                this.$ButtonText.remove();
            }

            if (this.$ButtonPrev) {
                this.$ButtonPrev.remove();
            }

            if (this.$ButtonNext) {
                this.$ButtonNext.remove();
            }

            window.removeEventListener('keyup', this.$keyup);
            window.removeEventListener('popstate', this.$onPopState);
        },

        /**
         * Show a specific image
         *
         * @param {String} src - Source of the image
         */
        showImage: function (src) {
            this.__$current = src;

            if (this.$isOpen === false) {
                this.open();
                return;
            }

            if (this.$Image) {
                moofx(this.$Image).animate({
                    opacity: 0
                }, {
                    duration: 200,
                    callback: () => {
                        this.$Image.remove();
                        this.$Image = null;
                        this.showImage(src);
                    }
                });

                return;
            }

            this.Loader.show();

            const imageData = this.$getImageData(src);

            const title = imageData.title;
            const short = imageData.short;
            const childIndex = imageData.index + 1;
            const childLength = this.getAttribute('images').length;

            const originalSource = src;

            if (src.indexOf('__') === -1) {
                const srcParts = src.split('.');
                const ending = srcParts.pop();
                const maxWidth = Math.round(QUI.getWindowSize().x);

                // prevent heavy image size loading
                src = srcParts.join('.') + '__' + maxWidth + '.' + ending;
            }

            require(['image!' + src], (Image) => {
                let pc;

                let height = Image.height;
                let width = Image.width;
                const docSize = QUI.getWindowSize();

                let docWidth = docSize.x - 100;
                let docHeight = docSize.y - 100;

                // mobile
                if (this.$__mobile) {
                    docWidth = docSize.x;
                    docHeight = docSize.y;
                }

                // set width ?
                if (width > docWidth) {
                    pc = QUIMath.percent(docWidth, width);

                    width = docWidth;
                    height = (height * (pc / 100)).round();
                }

                // set height ?
                if (height > docHeight) {
                    pc = QUIMath.percent(docHeight, height);

                    height = docHeight;
                    width = (width * (pc / 100)).round();
                }

                if (this.$__mobile) {
                    this.setAttribute('maxWidth', docWidth);
                    this.setAttribute('maxHeight', docHeight);
                } else {
                    // resize win
                    this.setAttribute('maxWidth', width);
                    this.setAttribute('maxHeight', height);

                    if (width < 400) {
                        this.setAttribute('maxWidth', 400);
                    }

                    if (height < 400) {
                        this.setAttribute('maxHeight', 400);
                    }
                }

                // button resize
                this.$ButtonText.innerHTML =
                    '<div class="qui-gallery-popup-image-preview-header">' +
                    title +
                    '</div>' +
                    '<div class="qui-gallery-popup-image-preview-text">' +
                    short +
                    '</div>';

                // get dimensions
                const Temp = this.$ButtonText.cloneNode(true);
                this.$ButtonText.parentNode.appendChild(Temp);

                Temp.setStyles({
                    height: 0,
                    visibility: 'hidden',
                    width: width
                });

                const dimensions = Temp.getScrollSize();
                let newHeight = dimensions.y + 10;

                Temp.remove();

                if (newHeight < 50) {
                    newHeight = 50;
                }


                if (this.$__mobile === false) {
                    moofx(this.$ButtonCnr).animate({
                        height: newHeight
                    });
                }

                this.$Stats.innerHTML = childIndex + ' von ' + childLength; // #locale

                this.resize(false, () => {
                    this.getContent().innerHTML = '';
                    this.getContent().setStyles({
                        height: '100%',
                        overflow: 'hidden'
                    });

                    const cs = this.getContent().getComputedSize();

                    this.$Image = document.createElement('img');
                    this.$Image.className = 'qui-gallery-popup-image-preview';
                    this.$Image.src = src;
                    this.$Image.setAttribute('data-src', originalSource);
                    this.$Image.style.opacity = 0;
                    this.getContent().appendChild(this.$Image);

                    if (this.$__mobile) {
                        let imageTop = (docHeight - height - cs['padding-top'] - cs['padding-bottom']) / 2;

                        if (imageTop < 0) {
                            imageTop = 0;
                        }

                        this.$Image.setStyles({
                            height: height,
                            position: 'relative',
                            top: imageTop,
                            width: width
                        });
                    }

                    moofx(this.$Image).animate({
                        opacity: 1
                    });

                    this.__$current = false;
                    this.Loader.hide();
                });
            });
        },

        /**
         * Shows the next image
         */
        showNextImage: function () {
            if (!this.$Image) {
                this.showFirstImage();
                return;
            }

            let currentSrc = this.$Image.get('data-src');
            const images = this.getAttribute('images');

            if (currentSrc.match(window.location.host)) {
                currentSrc = currentSrc.split(window.location.host)[1];
            }

            for (let i = 0, len = images.length; i < len; i++) {
                if (images[i].src === currentSrc) {
                    break;
                }
            }

            if (typeof images[i + 1] !== 'undefined') {
                this.showImage(images[i + 1].src);
                return;
            }

            this.showFirstImage();
        },

        /**
         * Shows the previous image
         */
        showPrevImage: function () {
            if (!this.$Image) {
                this.showLastImage();
                return;
            }

            let currentSrc = this.$Image.get('data-src');
            const images = this.getAttribute('images');

            if (currentSrc.match(window.location.host)) {
                currentSrc = currentSrc.split(window.location.host)[1];
            }

            for (let i = 0, len = images.length; i < len; i++) {
                if (images[i].src === currentSrc) {
                    break;
                }
            }

            if (i > 0) {
                this.showImage(images[i - 1].src);
                return;
            }

            this.showLastImage();
        },

        /**
         * Show the first image
         */
        showFirstImage: function () {
            const images = this.getAttribute('images');

            if (Array.isArray(images)) {
                this.showImage(images[0].src);
            }
        },

        /**
         * Show the last image
         */
        showLastImage: function () {
            const images = this.getAttribute('images');

            if (Array.isArray(images)) {
                this.showImage(images[images.length - 1].src);
            }
        },

        /**
         * return the image data entry
         *
         * @param {String} src - Source of the image
         * @return {Object}
         */
        $getImageData: function (src) {
            const images = this.getAttribute('images');

            if (src.match(window.location.host)) {
                src = src.split(window.location.host)[1];
            }

            for (let i = 0, len = images.length; i < len; i++) {
                if (images[i].src === src) {
                    images[i].index = i;
                    return images[i];
                }
            }

            return {
                src: src,
                title: '',
                short: '',
                index: 0
            };
        },

        /**
         * key events
         *
         * @param {DOMEvent} event
         */
        $keyup: function (event) {
            if (event.key === 'left') {
                this.showPrevImage();
                return;
            }

            if (event.key === 'right') {
                this.showNextImage();
            }

            if (event.key === 'esc') {
                this.close();
            }
        },

        /**
         * on popup state
         */
        $onPopState: function () {
            this.close();
        }
    });
});
