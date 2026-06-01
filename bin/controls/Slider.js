/**
 * Component gallery
 *
 * @event onLoaded [self]
 * @event animateOutBegin [self, Element]
 * @event animateOutEnd [self, Element]
 * @event animateInBegin [self, Element]
 * @event animateinEnd [self, Element]
 * @event onImageClick [self, ImageData]
 * @event onImageShow [self, ImageData]
 */
define('package/quiqqer/gallery/bin/controls/Slider', [
    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/loader/Progress',
    'qui/utils/Math',
    'qui/utils/Functions',
    'Locale',
    'package/quiqqer/gallery/bin/controls/Popup',
    URL_OPT_DIR + 'bin/quiqqer-asset/hammerjs/hammerjs/hammer.min.js',

    'text!package/quiqqer/gallery/bin/controls/Slider.html',
    'css!package/quiqqer/gallery/bin/controls/Slider.css'
], function (QUI, QUIControl, QUILoader, QUIProgress, QUIMath, QUIFunctionUtils, QUILocale, GalleryPopup, Hammer, template) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/gallery/bin/controls/Slider',

        Binds: [
            'next',
            'prev',
            'toggleAutoplay',
            'toggleRandomize',
            '$onImport',
            '$keyup',
            '$onWinResize',
            '$previewLeft',
            '$previewRight',
            '$showPreviewImage',
            '$calcSizes',
            'zoom',
            'isLoaded'
        ],

        options: {
            'controls': true,   // display controls
            'period': 5000,   // play period
            'shadow': false,  // display a shadow
            'show-controls-always': true,   // display the controls at mouseleave, dont hide it
            'show-title-always': true,   // display the titles at mouseleave, dont hide it
            'show-title': true,   // show titles of the images
            'zoom': true,   // enable zoom function via click
            'keyevents': true,
            'imagefit': false,  // if images are center, the effect is a smooth effect, no slide effect
            'placeholderimage': false,
            'placeholdercolor': false,
            'touch': true,   // touch events?

            'previews': true,   // show preview images
            'preview-outside': false,  // preview to the outside?
            'preview-background-color': 'rgba(0, 0, 0, 0.8)',
            'preview-color': '#fff'
        },

        initialize: function (options) {
            this.parent(options);

            this.$__animate = false;

            this.Loader = new QUILoader();

            this.$Progress = new QUIProgress();
            this.$Container = null;
            this.$Next = null;
            this.$Prev = null;
            this.$Title = null;
            this.$List = null;

            this.$Previews = null;
            this.$PreviewsContainer = null;
            this.$PreviewsSlider = null;
            this.$PreviewsFX = null;

            this.$images = [];
            this.$current = 0;
            this.$loaded = false;

            // sizes
            this.$pcSize = {};
            this.$mainSize = {};
            this.$oldResize = {};

            this.$autoplayInterval = false;

            // events
            // const __winResize = QUIFunctionUtils.debounce(this.$onWinResize);

            this.addEvents({
                onImport: this.$onImport,
                onDestroy: () => {
                    window.removeEventListener('keyup', this.$keyup);
                    QUI.removeEvent('resize', this.$onWinResize);
                }
            });

            window.addEventListener('keyup', this.$keyup);
            QUI.addEvent('resize', this.$onWinResize);
        },

        /**
         * event on inject
         */
        $onImport: function () {
            let i, len, Entry;

            const Template = this.$Elm.querySelector('template');

            const TemplateContent = document.createElement('div');
            TemplateContent.innerHTML = Template.innerHTML;

            // read images
            this.$List = document.createElement('div');
            this.$List.style.display = 'none';
            this.$Elm.appendChild(this.$List);

            this.$List.appendChild(TemplateContent);

            const entries = this.$List.getElementsByClassName('entry');

            for (i = 0, len = entries.length; i < len; i++) {
                Entry = entries[i];

                if (Entry.get('data-src') === '') {
                    continue;
                }

                this.$images.push({
                    src: Entry.get('data-src'),
                    image: Entry.get('data-src'),
                    preview: Entry.get('data-preview'),
                    title: Entry.querySelector('.title').innerHTML,
                    text: Entry.querySelector('.text').innerHTML,
                    short: Entry.querySelector('.text').innerHTML
                });
            }

            this.create();
            this.showFirst().then(() => {
                this.Loader.hide();
                this.fireEvent('loaded', [this]);
                this.$loaded = true;
            }).catch(() => {
                this.Loader.hide();
            });
        },

        /**
         * Create the DOMNode Element
         *
         * @return {HTMLElement}
         */
        create: function () {
            if (!this.$Elm) {
                this.$Elm = document.createElement('div');
                this.$Elm.className = 'quiqqer-gallery-slider';

            } else {
                this.$Elm.classList.add('quiqqer-gallery-slider');
            }

            const Header = this.$Elm.querySelector('.control-header');
            const Content = this.$Elm.querySelector('.control-content');

            this.$Elm.innerHTML = '';

            if (Header) {
                this.$Elm.appendChild(Header);
            }

            if (Content) {
                this.$Elm.appendChild(Content);
            }

            const Container = document.createElement('div');
            Container.className = 'quiqqer-gallery-slider-control';
            Container.innerHTML = template;
            Container.style.position = 'relative';
            Container.style.width = '100%';
            this.$Elm.appendChild(Container);

            this.Loader.inject(Container);
            this.$Progress.inject(Container);

            this.$Container = this.$Elm.querySelector('.quiqqer-gallery-slider-content');
            this.$Next = this.$Elm.querySelector('.quiqqer-gallery-slider-next');
            this.$Prev = this.$Elm.querySelector('.quiqqer-gallery-slider-prev');
            this.$Title = this.$Elm.querySelector('.quiqqer-gallery-slider-title');
            this.$Controls = this.$Elm.querySelector('.quiqqer-gallery-slider-controls');
            this.$Previews = this.$Elm.querySelector('.quiqqer-gallery-slider-previews');

            this.$Previews.setStyles({
                background: this.getAttribute('preview-background-color'),
                color: this.getAttribute('preview-color')
            });

            if (this.getAttribute('preview-outside')) {
                Container.appendChild(this.$Previews);
                this.$Elm.classList.add('quiqqer-gallery-slider-previewOutside');
            }

            this.$Play = this.$Elm.querySelector('.fa-play');
            this.$Random = this.$Elm.querySelector('.fa-random');
            this.$Zoom = this.$Elm.querySelector('.fa-search');

            this.$Controls.setStyle('display', 'none');

            if (this.getAttribute('controls') && this.$images.length) {
                this.$Controls.setStyle('display', null);
            }

            if (this.getAttribute('styles')) {
                this.$Elm.setStyles(this.getAttribute('styles'));
            }

            if (!this.getAttribute('show-title')) {
                this.$Title.setStyle('display', 'none');
            }

            if (this.getAttribute('touch') && this.$images.length > 1) {
                this.$Touch = new Hammer(this.$Container);

                this.$Touch.on('swipe', (ev) => {
                    if (ev.offsetDirection === 4) {
                        this.prev();
                        return;
                    }

                    if (ev.offsetDirection === 2) {
                        this.next();
                    }
                });
            }

            this.$Play.addEventListener('click', this.toggleAutoplay);
            this.$Random.addEventListener('click', this.toggleRandomize);
            this.$Zoom.addEventListener('click', this.zoom);

            if (this.getAttribute('zoom') === false) {
                this.$Zoom.setStyle('display', 'none');
            }

            this.$Next.addEventListener('click', () => {
                this.stopAutoplay();
                this.next();
            });

            this.$Prev.addEventListener('click', () => {
                this.stopAutoplay();
                this.prev();
            });

            if (this.$images.length === 1) {
                this.$Play.setStyle('display', 'none');
                this.$Random.setStyle('display', 'none');
            }

            if (this.$images.length <= 1) {
                this.$Next.setStyle('display', 'none');
                this.$Prev.setStyle('display', 'none');

                if (!this.$images.length) {
                    const icon = '<span class="fa fa-file-image-o"></span>';
                    const text = '<p style="font-size: 20px">' + QUILocale.get('quiqqer/gallery', "quiqqer.gallery.slider.noImages") + '</p>';
                    let image = icon + text;

                    if (this.getAttribute('placeholderimage')) {
                        image = '';
                    }

                    const Placeholder = document.createElement('div');
                    Placeholder.className = 'quiqqer-gallery-slider-placeholder';
                    Placeholder.innerHTML = image;
                    Placeholder.setStyles({
                        color: '#fff',
                        background: '#000',
                        fontSize: 40,
                        height: '100%',
                        paddingTop: '20%',
                        opacity: 0.6,
                        position: 'absolute',
                        textAlign: 'center',
                        top: 0,
                        width: '100%'
                    });
                    Container.appendChild(Placeholder);


                    if (this.getAttribute('placeholdercolor')) {
                        Placeholder.setStyle(
                            'backgroundColor',
                            this.getAttribute('placeholdercolor')
                        );
                    }

                    if (this.getAttribute('placeholderimage')) {
                        Placeholder.setStyles({
                            backgroundImage: 'url("' + this.getAttribute('placeholderimage') + '")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center'
                        });
                    }
                }
            }

            if (this.getAttribute('shadow')) {
                this.$Elm.setStyle('boxShadow', '0 0 2px 2px #888');
            }

            if (this.getAttribute('show-controls-always')) {
                this.$Next.setStyle('opacity', 1);
                this.$Prev.setStyle('opacity', 1);
                this.$Controls.setStyle('opacity', 1);
            }

            if (this.getAttribute('show-title-always')) {
                this.$Title.setStyle('opacity', 1);
            }

            if (this.getAttribute('imagefit')) {
                this.$Container.classList.add(
                    'quiqqer-gallery-slider-content-imagefit'
                );
            }

            if (!this.getAttribute('preview') || this.$images.length <= 1) {
                this.$Previews.setStyle('display', 'none');
            } else {
                this.$createPreviews();
            }

            this.Loader.show();

            return this.$Elm;
        },

        /**
         * resize slider
         */
        resize: function () {
            this.$onWinResize();
            this.parent();
        },

        /**
         * calc internal sizes
         */
        $calcSizes: function () {
            if (!this.$Container) {
                return;
            }

            this.$mainSize = this.$Container.getSize();

            if (this.$PreviewsContainer) {
                this.$pcSize = this.$PreviewsContainer.getSize();
            }
        },

        /**
         * Add an image
         *
         * @param {String} imageSrc
         * @param {String} title
         * @param {String} text
         */
        addImage: function (imageSrc, title, text) {
            this.$images.push({
                src: imageSrc,
                image: imageSrc,
                title: title,
                text: text,
                short: text
            });
        },

        /**
         * show the first image
         *
         * @return {Promise}
         */
        showFirst: function () {
            this.$current = -1;
            return this.next();
        },

        /**
         * show the next image
         *
         * @return {Promise}
         */
        next: function () {
            return new Promise((resolve) => {
                if (this.$__animate) {
                    resolve();
                    return;
                }

                if (!this.$images.length) {
                    this.Loader.hide();
                    resolve();
                    return;
                }

                this.$__animate = true;


                let next = this.$current + 1;

                if (typeof this.$images[next] === 'undefined') {
                    next = 0;
                }

                const data = this.$images[next];

                this.Loader.show();

                this.loadImage(data.image).then((Image) => {
                    this.Loader.hide();

                    const OldImage = this.$Container.querySelectorAll(
                        '.quiqqer-gallery-slider-image'
                    );
                    const NewImage = this.$createNewImage(Image);


                    NewImage.setAttribute('data-no', this.$current);

                    this.animateOut(OldImage, 'left', () => {
                        OldImage.forEach((Image) => Image.remove());
                    });

                    return this.animateIn(NewImage, 'right');

                }).then(() => {
                    this.setText(data.title, data.text);

                    this.$current = next;
                    this.$__animate = false;

                    this.$showPreviewImage();
                    this.Loader.hide();

                    this.fireEvent('imageShow', [this, this.$images[this.$current]]);

                    resolve();
                });

            });
        },

        /**
         * show the prev image
         */
        prev: function () {
            return new Promise((resolve) => {
                if (this.$__animate) {
                    resolve();
                    return;
                }

                if (this.$images.length <= 1) {
                    resolve();
                    return;
                }

                this.$__animate = true;


                let next = this.$current - 1;

                if (next < 0) {
                    next = this.$images.length - 1;
                }

                const data = this.$images[next];

                this.Loader.show();

                this.loadImage(data.image).then((Image) => {
                    this.Loader.hide();

                    const OldImage = this.$Container.querySelectorAll(
                        '.quiqqer-gallery-slider-image'
                    );
                    const NewImage = this.$createNewImage(Image);


                    NewImage.setAttribute('data-no', this.$current);

                    this.animateOut(OldImage, 'right', () => {
                        OldImage.forEach((Image) => Image.remove());
                    });

                    return this.animateIn(NewImage, 'left');

                }).then(() => {
                    this.setText(data.title, data.text);

                    this.$current = next;
                    this.$__animate = false;

                    this.$showPreviewImage();
                    this.Loader.hide();

                    this.fireEvent('imageShow', [this, this.$images[this.$current]]);

                    resolve();
                });
            });
        },

        /**
         * Load the image
         *
         * @param {String} src - Image source
         * @param {Function} [callback] - optional
         *
         * @return {Promise}
         */
        loadImage: function (src, callback) {
            return new Promise(function (resolve, reject) {
                require(['image!' + src], function (Image) {
                    resolve(Image);

                    if (typeof callback === 'function') {
                        callback(Image);
                    }
                }, reject);
            });
        },

        /**
         * Out animation for an element
         *
         * @param {HTMLElement} Elm
         * @param {String} [direction]  - left|right
         * @param {Function} [callback] - callback function
         *
         * @return {Promise}
         */
        animateOut: function (Elm, direction, callback) {
            return new Promise((resolve) => {
                if (!Elm || ((Array.isArray(Elm) || (typeof Elements !== 'undefined' && Elm instanceof Elements)) && !Elm.length)) {
                    if (typeof callback === 'function') {
                        callback();
                    }

                    resolve();
                    return;
                }

                this.fireEvent('animateOutBegin', [this, Elm]);

                let left = '-100%';

                if (typeof direction !== 'undefined' && direction === 'right') {
                    left = '100%';
                }

                moofx(Elm).animate({
                    left: left
                }, {
                    callback: () => {
                        if (typeof callback === 'function') {
                            callback();
                        }

                        resolve();

                        this.fireEvent('animateOutEnd', [this, Elm]);
                    }
                });
            });
        },

        /**
         * In animation for an element
         *
         * @param {HTMLElement} Elm
         * @param {String} [direction]  - left|right
         * @param {Function} [callback] - callback function
         *
         * @return {Promise}
         */
        animateIn: function (Elm, direction, callback) {
            return new Promise((resolve) => {
                if (!Elm || ((Array.isArray(Elm) || (typeof Elements !== 'undefined' && Elm instanceof Elements)) && !Elm.length)) {
                    if (typeof callback === 'function') {
                        callback();
                    }

                    resolve();
                    return;
                }

                this.fireEvent('animateInBegin', [this, Elm]);

                if (!("x" in this.$mainSize)) {
                    this.$calcSizes();
                }

                const elmSize = Elm.getSize();
                const size = this.$mainSize;

                let top = ((size.y - elmSize.y) / 2).round();

                if (top < 0) {
                    top = 0;
                }

                let leftStart = '-100%';

                if (typeof direction !== 'undefined' && direction === 'right') {
                    leftStart = '100%';
                }

                Elm.setStyles({
                    left: leftStart,
                    top: top
                });


                // center
                let left = ((size.x - elmSize.x) / 2).round();

                if (left < 0) {
                    left = 0;
                }

                moofx(Elm).animate({
                    left: left
                }, {
                    callback: () => {
                        if (typeof callback === 'function') {
                            callback();
                        }

                        resolve();

                        this.fireEvent('animateInEnd', [this, Elm]);
                    }
                });
            });
        },

        /**
         * Set the text fot the image
         *
         * @param {String} title
         * @param {String} text
         */
        setText: function (title, text) {
            title = title || '';
            text = text || '';

            this.$Title.innerHTML =
                '<div class="quiqqer-gallery-slider-title-header">' + title + '</div>' +
                '<div class="quiqqer-gallery-slider-title-text">' + text + '</div>';

            const Temp = this.$Title.cloneNode(true);
            this.$Title.parentNode.appendChild(Temp);

            Temp.setStyles({
                height: 0,
                visibility: 'hidden'
            });


            const dimensions = Temp.getScrollSize();

            Temp.remove();

            moofx(this.$Title).animate({
                height: dimensions.y + 10
            });
        },

        /**
         * Return the real image size via the image url
         *
         * @param {HTMLElement} Image
         * @returns {Object} - { x, y }
         */
        $getRealImageSize: function (Image) {
            const src = Image.get('src');

            if (!src.match('__')) {
                return Image.getSize();
            }

            let srcParts = src.split('__');

            srcParts = srcParts[1].split('.');
            srcParts = srcParts[0];

            const sizes = srcParts.split('x');

            sizes[0] = parseInt(sizes[0]);
            sizes[1] = parseInt(sizes[1]);

            return {
                x: sizes[0],
                y: sizes[1]
            };
        },

        /**
         * Create a new image DOMNode
         *
         * @param {HTMLImageElement} Image
         * @returns {HTMLImageElement} New image DOM-Node
         */
        $createNewImage: function (Image) {
            let pc;

            const listSize = this.$Container.getSize();
            const imageSize = this.$getRealImageSize(Image);
            let height = imageSize.y;
            let width = imageSize.x;

            // set width
            pc = QUIMath.percent(listSize.x, width);

            width = listSize.x;
            height = (height * (pc / 100)).round();

            // set height?
            if (height > listSize.y) {
                pc = QUIMath.percent(listSize.y, height);

                height = listSize.y;
                width = (width * (pc / 100)).round();
            }

            const NewImage = document.createElement('img');
            NewImage.src = Image.src;
            NewImage.className = 'quiqqer-gallery-slider-image';
            NewImage.setStyles({
                left: '110%',
                height: height,
                maxHeight: height,
                width: width,
                maxWidth: width
            });
            NewImage.addEventListener('click', this.zoom);
            this.$Container.appendChild(NewImage);

            return NewImage;
        },

        /**
         * key events
         *
         * @param {DOMEvent} event
         */
        $keyup: function (event) {
            if (this.getAttribute('keyevents') === false) {
                return;
            }

            if (this.$images.length <= 1) {
                return;
            }

            if (event.key === 'left') {
                this.prev();
                return;
            }

            if (event.key === 'right') {
                this.next();
            }
        },

        /**
         * event : on window resize
         */
        $onWinResize: function () {
            this.$calcSizes();

            const Img = this.getElm().querySelector('img');

            if (!Img) {
                return;
            }

            // center
            const elmSize = Img.getSize();
            const size = this.$Container.getSize();

            let left = ((size.x - elmSize.x) / 2).round();

            if (left < 0) {
                left = 0;
            }

            let top = ((size.y - elmSize.y) / 2).round();

            if (top < 0) {
                top = 0;
            }


            moofx(Img).animate({
                left: left,
                top: top
            });
        },

        /**
         * Start the autoplay
         */
        autoplay: function () {
            if (this.$images.length <= 1) {
                return;
            }

            this.$Play.classList.add('control-background-active');

            if (this.$autoplayInterval) {
                clearInterval(this.$autoplayInterval);
            }

            this.$Progress.increment(this.getAttribute('period'));

            this.$autoplayInterval = (function () {
                this.$Progress.increment(this.getAttribute('period'));

                if (this.$randomize) {
                    this.$current = Number.random(0, this.$images.length - 1);
                }

                this.next();

            }).periodical(this.getAttribute('period'), this);
        },

        /**
         * Stop the autoplay
         */
        stopAutoplay: function () {
            this.$Progress.reset();
            this.$Play.classList.remove('control-background-active');
            this.stopRandomize();

            if (this.$autoplayInterval) {
                clearInterval(this.$autoplayInterval);
            }
        },

        /**
         * Toggle the autoplay on / off
         */
        toggleAutoplay: function () {
            if (this.$Play.classList.contains('control-background-active')) {
                this.stopAutoplay();
                return;
            }

            this.autoplay();
        },

        /**
         * Set randomize -> on
         */
        randomize: function () {
            this.$randomize = true;
            this.$Random.classList.add('control-background-active');
            this.autoplay();
        },

        /**
         * Set randomize -> on
         */
        stopRandomize: function () {
            this.$randomize = false;
            this.$Random.classList.remove('control-background-active');
        },

        /**
         * Toggle the randomize on / off
         */
        toggleRandomize: function () {
            if (this.$randomize) {
                this.stopRandomize();
                return;
            }

            this.randomize();
        },

        /**
         * Create the preview
         */
        $createPreviews: function () {
            if (!this.$Previews) {
                return;
            }

            if (this.$images.length <= 1) {
                if (this.$Previews) {
                    this.$Previews.setStyle('display', 'none');
                }
                return;
            }

            this.$Previews.setStyle('bottom', -100);
            this.$Previews.setStyle('zIndex', 10);

            this.$Previews.innerHTML =
                '<div class="quiqqer-gallery-slider-previews-prev">' +
                '<span class="fa fa-chevron-left"></span>' +
                '</div>' +
                '<div class="quiqqer-gallery-slider-previews-container">' +
                '<div class="quiqqer-gallery-slider-previews-containerInner"></div>' +
                '</div>' +
                '<div class="quiqqer-gallery-slider-previews-next">' +
                '<span class="fa fa-chevron-right"></span>' +
                '</div>';


            let i, len;

            const imageList = [];

            this.$PreviewsContainer = this.$Previews.querySelector(
                '.quiqqer-gallery-slider-previews-container'
            );

            this.$PreviewsSlider = this.$Previews.querySelector(
                '.quiqqer-gallery-slider-previews-containerInner'
            );

            this.$PreviewsFX = moofx(this.$PreviewsSlider);

            this.$Previews.querySelector(
                '.quiqqer-gallery-slider-previews-prev'
            ).addEventListener('click', this.$previewLeft);

            this.$Previews.querySelector(
                '.quiqqer-gallery-slider-previews-next'
            ).addEventListener('click', this.$previewRight);

            this.$pcSize = this.$PreviewsContainer.getSize();


            // image click action
            const imageClick = (event) => {
                let Target = event.target;

                if (!Target.classList.contains('quiqqer-gallery-slider-previews-entry')) {
                    Target = Target.closest('.quiqqer-gallery-slider-previews-entry');
                }

                const imageIndex = parseInt(Target.getAttribute('data-image'), 10);

                this.$current = imageIndex - 1;
                this.next();

                this.fireEvent('imageClick', [this, this.$images[imageIndex]]);
            };


            // get image paths
            for (i = 0, len = this.$images.length; i < len; i++) {
                imageList.push('image!' + this.$images[i].preview);
            }


            // load images
            require(imageList, (...loadedImages) => {
                let size, imgSize;
                let Container = null;
                let width = 0;

                for (i = 0, len = loadedImages.length; i < len; i++) {
                    Container = document.createElement('div');
                    Container.className = 'quiqqer-gallery-slider-previews-entry';
                    Container.innerHTML = '<img src="' + loadedImages[i].src + '" />';
                    Container.setAttribute('data-image', i);
                    Container.addEventListener('click', imageClick);
                    this.$PreviewsSlider.appendChild(Container);

                    //console.log(Container.getComputedSize());
                    size = Container.getComputedSize();
                    imgSize = Container.querySelector('img').getComputedSize();

                    if (!size.totalWidth) {
                        size.totalWidth = loadedImages[i].width;
                    }

                    width = width +
                        size.totalWidth +
                        imgSize['padding-left'] +
                        imgSize['padding-right'];

                    width = width + Container.getStyle('marginLeft').toInt();
                    width = width + Container.getStyle('marginRight').toInt();
                }

                this.$PreviewsSlider.setStyle('width', width);

                moofx(this.$Previews).animate({
                    bottom: 0
                }, {
                    duration: 250
                });
            });
        },

        /**
         * Scrolls to the preview image
         */
        $showPreviewImage: function () {
            if (!this.$Previews) {
                return;
            }

            if (!this.$PreviewsSlider) {
                return;
            }


            this.$PreviewsSlider.querySelectorAll(
                '.quiqqer-gallery-slider-previews-entry'
            ).forEach((Entry) => {
                Entry.classList.remove('quiqqer-gallery-slider-active-preview');
            });

            const Img = this.$PreviewsSlider.querySelector(
                '[data-image="' + this.$current + '"]'
            );

            if (!Img) {
                return;
            }

            Img.classList.add('quiqqer-gallery-slider-active-preview');

            const imagePosX = Img.getPosition(Img.parentElement).x;
            const imageSizeX = Img.getSize().x;
            const leftPoint = this.$PreviewsSlider.getStyle('left').toInt() * -1;
            const rightPoint = leftPoint + this.$pcSize.x;
            const maxRight = this.$PreviewsSlider.getSize().x - this.$pcSize.x;

            if (leftPoint <= imagePosX &&
                rightPoint >= (imagePosX + imageSizeX)) {
                return;
            }

            let left = imagePosX * -1;

            if (imagePosX + imageSizeX > maxRight) {
                left = maxRight * -1;
            }

            this.$PreviewsFX.animate({
                left: left
            }, {
                duration: 700
            });
        },

        /**
         * preview scroll to the left
         */
        $previewLeft: function () {
            let left = this.$PreviewsSlider.getStyle('left').toInt();

            left = left + 300;

            if (!left) {
                left = 300;
            }

            if (left > 0) {
                left = 0;
            }

            this.$PreviewsFX.animate({
                left: left
            }, {
                duration: 700
            });
        },

        /**
         * preview scroll to the right
         */
        $previewRight: function () {
            let left = this.$PreviewsSlider.getStyle('left').toInt();
            const Last = this.$PreviewsSlider.querySelector(
                '.quiqqer-gallery-slider-previews-entry:last-child'
            );
            const lastPos = Last.getPosition(this.$PreviewsSlider);
            const lastSize = Last.getSize();

            left = left - 300;

            if (!left) {
                left = -300;
            }

            if ((lastPos.x + lastSize.x) <= (left * -1) + this.$pcSize.x) {
                left = (lastPos.x + lastSize.x - this.$pcSize.x) * -1;
            }

            this.$PreviewsFX.animate({
                left: left
            }, {
                duration: 700
            });
        },

        /**
         * Select an image by image file name.
         *
         * @param {String} imgFilename - Full file name including ext; may contain size part (e.g. "__64x128")
         * @return {void}
         */
        selectImageByFilename: function (imgFilename) {
            const imgRegExpRemoveSize = new RegExp('__\\d+x\\d+', 'ig');
            const imgRegExpParseFilename = new RegExp('\\/([^\\/]*)\\.\\w+$', 'igm');

            for (const [imageIndex, ImageData] of Object.entries(this.$images)) {
                const sliderImgFilename = ImageData.src.replace(imgRegExpRemoveSize, '');
                const filenameMatches = [...sliderImgFilename.matchAll(imgRegExpParseFilename)];

                if (!filenameMatches.length || typeof filenameMatches[0][1] === 'undefined') {
                    continue;
                }

                const targetImgFilename = filenameMatches[0][1];

                if (imgFilename.indexOf(targetImgFilename) !== -1) {
                    this.$current = imageIndex - 1;
                    this.next();

                    break;
                }
            }
        },

        /**
         * @return {Boolean}
         */
        isLoaded: function () {
            return this.$loaded;
        },

        /**
         * Zoom
         */

        /**
         * execute zoom
         */
        zoom: function () {
            if (!this.getAttribute('zoom')) {
                return;
            }

            const CurrentImage = this.getElm().querySelector(
                '.quiqqer-gallery-slider-image'
            );

            this.setAttribute('keyevents', false);

            new GalleryPopup({
                images: this.$images,
                current: CurrentImage.getAttribute('src'),
                events: {
                    onClose: () => {
                        this.setAttribute('keyevents', true);
                    }
                }
            }).open();
        }
    });
});
