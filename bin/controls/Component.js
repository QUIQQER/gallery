/**
 * Component gallery
 */
define('package/quiqqer/gallery/bin/controls/Component', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/utils/Math'

], function (QUI, QUIControl, QUILoader, QUIMath) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/gallery/bin/controls/Component',

        Binds: [
            'next',
            'prev',
            'resize',
            '$onImport',
            '$keyup'
        ],

        initialize: function (options) {
            this.parent(options);

            this.$effect = '';
            this.$__resized = false;
            this.$__animate = false;

            this.$List = null;
            this.$Display = false;
            this.$FXDisplay = false;
            this.Loader = new QUILoader();

            this.$parentsOverflowAuto = new Elements();
            this.$parentsOverflowHidden = new Elements();


            this.addEvents({
                onImport: this.$onImport
            });

            window.addEventListener('resize', this.resize);
            window.addEventListener('keyup', this.$keyup);
        },

        /**
         * Resize the control
         */
        resize: function () {
            if (this.$__resized) {
                clearTimeout(this.$__resized);
            }

            // clear resize flags
            this.$__resized = setTimeout(() => {
                this.getElm().querySelectorAll('img').forEach((Image) => {
                    Image.removeAttribute('data-resized');
                });

                let Current = this.getElm().querySelector(
                    '.quiqqer-gallery-component-list-current'
                );

                if (Current) {
                    this.animateIn(Current);
                }

            }, 200);
        },

        /**
         * event on inject
         */
        $onImport: function () {
            const Elm = this.getElm();
            const Prev = Elm.querySelector('.quiqqer-gallery-component-prev');
            const Next = Elm.querySelector('.quiqqer-gallery-component-next');

            this.$List = Elm.querySelector('ul');
            this.$effect = Elm.get('data-effect');

            this.Loader.inject(Elm);
            this.Loader.show();

            Elm.setStyle('overflow', 'hidden');

            Prev.addEventListener('click', this.prev);
            Next.addEventListener('click', this.next);

            // text display
            this.$Display = document.createElement('div');
            this.$Display.className = 'quiqqer-gallery-component-textdisplay';
            this.$Display.style.opacity = 0;
            this.$List.appendChild(this.$Display);

            this.$FXDisplay = moofx(this.$Display);


            const parents = [];
            let Parent = this.getElm().parentElement;

            while (Parent) {
                parents.push(Parent);
                Parent = Parent.parentElement;
            }

            for (let i = 0, len = parents.length; i < len; i++) {
                if (parents[i].nodeName === 'BODY') {
                    break;
                }

                if (parents[i].getStyle('overflow-x') === 'auto') {
                    this.$parentsOverflowAuto.push(parents[i]);
                }

                if (parents[i].getStyle('overflow-x') === 'hidden') {
                    this.$parentsOverflowHidden.push(parents[i]);
                }
            }

            this.showFirst();

            setTimeout(() => {
                this.Loader.hide();
                Elm.setStyle('overflow', null);
            }, 500);
        },

        /**
         * show the first image
         */
        showFirst: function () {
            let Current = this.getElm().querySelector(
                '.quiqqer-gallery-component-list-current'
            );

            if (Current) {
                this.animateOut(Current);
            }

            this.animateIn(this.$List.firstElementChild);
        },

        /**
         * show the next image
         */
        next: function () {
            if (this.$__animate) {
                return;
            }

            this.$__animate = true;

            this.$parentsOverflowAuto.setStyle('overflowX', 'visible');
            this.$parentsOverflowHidden.setStyle('overflowX', 'visible');
            document.body.classList.add('__quiqqer-gallery-component--body');


            let Current = this.getElm().querySelector(
                '.quiqqer-gallery-component-list-current'
            );

            if (!Current) {
                Current = this.$List.querySelector('li');
            }

            let Next = Current.nextElementSibling;

            while (Next && Next.nodeName !== 'LI') {
                Next = Next.nextElementSibling;
            }

            if (!Next) {
                Next = this.$List.querySelector('li');
            }

            if (Current) {
                this.animateOut(Current, 'left');
            }

            this.animateIn(Next, 'right');

            setTimeout(() => {
                this.$__animate = false;
                this.$parentsOverflowAuto.setStyle('overflowX', 'auto');
                this.$parentsOverflowHidden.setStyle('overflowX', 'hidden');
                document.body.classList.remove('__quiqqer-gallery-component--body');

            }, 500);
        },

        /**
         * show the prev image
         */
        prev: function () {
            if (this.$__animate) {
                return;
            }

            this.$__animate = true;

            this.$parentsOverflowAuto.setStyle('overflowX', 'visible');
            this.$parentsOverflowHidden.setStyle('overflowX', 'visible');
            document.body.classList.add('__quiqqer-gallery-component--body');

            let Current = this.getElm().querySelector(
                '.quiqqer-gallery-component-list-current'
            );

            if (!Current) {
                Current = this.$List.querySelector('li:last-child');
            }


            let Prev = Current.previousElementSibling;

            while (Prev && Prev.nodeName !== 'LI') {
                Prev = Prev.previousElementSibling;
            }

            if (!Prev) {
                Prev = this.$List.querySelector('li:last-child');
            }


            if (Current) {
                this.animateOut(Current, 'right');
            }

            this.animateIn(Prev, 'left');

            setTimeout(() => {
                this.$__animate = false;
                this.$parentsOverflowAuto.setStyle('overflowX', 'auto');
                this.$parentsOverflowHidden.setStyle('overflowX', 'hidden');
                document.body.classList.remove('__quiqqer-gallery-component--body');
            }, 500);
        },

        /**
         * Out Animate for an element
         * @param {HTMLElement} Elm
         * @param {String} [direction] - left|right
         */
        animateOut: function (Elm, direction) {
            const fx = this.$effect;

            direction = direction || 'left';

            Elm.classList.remove('quiqqer-gallery-component-list-current');
            Elm.classList.remove(fx + '-in-left');
            Elm.classList.remove(fx + '-in-right');

            switch (direction) {
                case 'left':
                    Elm.classList.add(fx + '-out-left');
                    break;

                case 'right':
                    Elm.classList.add(fx + '-out-right');
                    break;
            }


            this.hideTextDisplay();

            setTimeout(() => {
                Elm.classList.remove(fx + '-out-left');
                Elm.classList.remove(fx + '-out-right');
            }, 500);
        },

        /**
         * In animation for an element
         * @param {HTMLElement} Elm
         * @param {String} [direction] - left|right
         */
        animateIn: function (Elm, direction) {
            let pc;
            const Image = Elm.querySelector('img');
            let text = Image.get('alt');
            const fx = this.$effect;

            direction = direction || 'right';

            if (!Image.get('data-resized')) {
                const listSize = this.$List.getSize();
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

                let left = 0;
                let top = 0;

                if (width < listSize.x) {
                    left = ((listSize.x - width) / 2).round();
                }

                if (height < listSize.y) {
                    top = ((listSize.y - height) / 2).round();
                }

                // set image proportions
                Image.setStyles({
                    height: height,
                    maxHeight: height,
                    width: width,
                    maxWidth: width,
                    left: left,
                    top: top
                });

                Image.set('data-resized', 1);
            }


            // slide in
            switch (direction) {
                case 'left':
                    Elm.classList.add(fx + '-in-left');
                    break;

                case 'right':
                    Elm.classList.add(fx + '-in-right');
                    break;
            }

            if (!text || text === '') {
                text = Image.get('title');
            }

            this.showTextDisplay(text);

            setTimeout(() => {
                Elm.classList.add('quiqqer-gallery-component-list-current');
                Elm.classList.remove(fx + '-in-left');
                Elm.classList.remove(fx + '-in-right');

            }, 500);
        },

        /**
         * Show the text display
         *
         * @param {String} text
         */
        showTextDisplay: function (text) {
            this.$Display.innerHTML = text;

            this.$FXDisplay.animate({
                opacity: 1
            });
        },

        /**
         * hide the text display
         */
        hideTextDisplay: function () {
            this.$FXDisplay.animate({
                opacity: 0
            }, {
                callback: () => {
                    this.$Display.innerHTML = '';
                }
            });
        },

        /**
         * Return the real image size via the image url
         *
         * @param {HTMLElement} Image
         * @returns {Object} - { x, y }
         */
        $getRealImageSize: function (Image) {
            let src = Image.get('src');

            const Picture = Image.closest('picture');

            if (Picture) {
                let Source = null;
                const sources = Picture.querySelectorAll('source');

                if (sources.length > 1) {
                    Source = sources[sources.length - 2]; // vorletztes element
                } else if (sources.length) {
                    Source = sources[0];
                }

                if (Source) {
                    src = Source.get('srcset');
                }
            }

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
         * key events
         *
         * @param {DOMEvent} event
         */
        $keyup: function (event) {
            if (event.key === 'left' || event.key === 'ArrowLeft') {
                this.prev();
                return;
            }

            if (event.key === 'right' || event.key === 'ArrowRight') {
                this.next();
            }
        }
    });
});
