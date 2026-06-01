/**
 * Children listing
 *
 * @module package/quiqqer/gallery/bin/controls/Slider/ImageSlider
 *
 * @author www.pcsg.de (Henning Leutz)
 * @author www.pcsg.de (Michael Danielczok)
 */
define('package/quiqqer/gallery/bin/controls/ImageSlider', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/utils/Functions'

], function (QUI, QUIControl, QUIFunctionUtils) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/gallery/bin/controls/ImageSlider',

        Binds: [
            '$onImport',
            '$onScroll',
            'prev',
            'next',
            'resize'
        ],

        initialize: function (options) {
            this.parent(options);

            this.$SlideFX = null;
            this.$Prev = null;
            this.$Next = null;
            this.$Inner = null;

            this.$scrollLength = null;
            this.$scrollMax = 0;
            this.$mobile = true;
            this.$icons = null;

            this.addEvents({
                onImport: this.$onImport
            });

            QUI.addEvent('resize', this.resize);
        },

        /**
         * resize the control and recalc all slide vars
         */
        resize: function () {
            const size = this.getElm().getSize();
            const winSize = QUI.getWindowSize();

            // display the buttons? if mobile, dont display it
            if (winSize.x < size.x + 100) {
                this.$mobile = true;
                this.getElm().classList.add('quiqqer-gallery-imageSlider-mobile');
            } else {
                this.$mobile = false;
                this.getElm().classList.remove('quiqqer-gallery-imageSlider-mobile');
            }

            this.$scrollLength = (size.x / 1.2).round();
            this.$scrollMax = this.$Inner.getScrollSize().x - size.x;
            // this.$icons.setStyle('line-height', size.y);
            this.$onScroll();
        },

        /**
         * event : on import
         */
        $onImport: function () {
            const Elm = this.getElm(),
                SliderElm = Elm.querySelector('.quiqqer-gallery-imageSlider-container'),
                size = SliderElm.getSize();

            this.$Next = document.createElement('div');
            this.$Next.className = 'quiqqer-gallery-imageSlider-next hide-on-mobile';
            this.$Next.innerHTML = '<span class="fa fa-angle-right"></span>';
            this.$Next.style.display = 'none';
            this.$Next.style.lineHeight = size.y + 'px';
            this.$Next.addEventListener('click', this.next);
            SliderElm.appendChild(this.$Next);

            this.$Prev = document.createElement('div');
            this.$Prev.className = 'quiqqer-gallery-imageSlider-prev hide-on-mobile';
            this.$Prev.innerHTML = '<span class="fa fa-angle-left"></span>';
            this.$Prev.style.lineHeight = size.y + 'px';
            this.$Prev.addEventListener('click', this.prev);
            SliderElm.appendChild(this.$Prev);

            this.$Inner = Elm.querySelector(
                '.quiqqer-gallery-imageSlider-container-inner'
            );

            this.$SlideFX = new Fx.Scroll(this.$Inner);
            this.$icons = Array.from(Elm.querySelectorAll('article a .quiqqer-icon'));

            const scrollSpy = QUIFunctionUtils.debounce(this.$onScroll, 200);

            this.$Inner.addEventListener('scroll', scrollSpy);

            this.$NextFX = moofx(this.$Next);
            this.$PrevFX = moofx(this.$Prev);

            // calc scrolling vars
            setTimeout(() => {
                this.resize();
            }, 200);

            if (!this.$icons || !this.$icons.length) {
                return;
            }

            moofx(this.$icons).animate({
                opacity: 1
            }, {
                duration: 200
            });
        },

        /**
         * Show previous articles
         *
         * @return {Promise}
         */
        prev: function () {
            return new Promise((resolve) => {
                let left = this.$Inner.getScroll().x - this.$scrollLength;

                if (left < 0) {
                    left = 0;
                }

                this.$SlideFX.start(left, 0).chain(resolve);

            });
        },

        /**
         * Show next articles
         *
         * @return {Promise}
         */
        next: function () {
            return new Promise((resolve) => {
                const left = this.$Inner.getScroll().x + this.$scrollLength;

                this.$SlideFX.start(left, 0).chain(resolve);

            });
        },

        /**
         * Show the next button
         * @returns {Promise}
         */
        showNextButton: function () {
            return new Promise((resolve) => {
                this.$Next.setStyle('display', null);

                this.$Next.classList.add('show-next');
                resolve();

            });
        },

        /**
         * Show the previous button
         * @returns {Promise}
         */
        showPrevButton: function () {
            return new Promise((resolve) => {
                this.$Prev.classList.add('show-prev');
                resolve();
            });
        },

        /**
         * Hide the next button
         * @returns {Promise}
         */
        hideNextButton: function () {
            return new Promise((resolve) => {
                this.$Next.classList.remove('show-next');
                resolve();
            });
        },

        /**
         * Hide the prev button
         * @returns {Promise}
         */
        hidePrevButton: function () {
            return new Promise((resolve) => {
                this.$Prev.classList.remove('show-prev');
                resolve();
            });
        },

        /**
         * event : on scroll
         * look for the prev and next button
         */
        $onScroll: function () {
            const left = this.$Inner.getScroll().x;

            const scrollSize = this.$Inner.getScrollSize().x;
            const domSize = this.$Inner.getSize().x;

            if (scrollSize <= domSize) {
                this.hidePrevButton();
                this.hideNextButton();
                return;
            }

            if (left === 0) {
                this.hidePrevButton();
            } else {
                this.showPrevButton();
            }

            if (left === this.$scrollMax) {
                this.hideNextButton();
            } else {
                this.showNextButton();
            }
        }
    });
});
