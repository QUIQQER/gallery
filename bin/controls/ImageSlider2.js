/**
 * Children listing
 *
 * @module package/quiqqer/gallery/bin/controls/Slider/ImageSlider2
 *
 * @author www.pcsg.de (Henning Leutz)
 * @author www.pcsg.de (Michael Danielczok)
 */
define('package/quiqqer/gallery/bin/controls/ImageSlider2', [

    'qui/QUI',
    'qui/controls/Control',
    'qui/utils/Functions'

], function (QUI, QUIControl, QUIFunctionUtils) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/gallery/bin/controls/ImageSlider2',

        Binds: [
            '$onImport',
            '$onScroll',
            'prev',
            'prev2',
            'next',
            'next2',
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
            this.SliderWrapper = null;

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
                this.getElm().classList.add('quiqqer-gallery-logoSlider-mobile');
            } else {
                this.$mobile = false;
                this.getElm().classList.remove('quiqqer-gallery-logoSlider-mobile');
            }

            this.$scrollLength = (size.x / 1.2).round();
            this.$scrollMax = this.$Inner.getScrollSize().x - size.x;
            this.$icons.setStyle('line-height', size.y);
            this.$onScroll();

            // new scroll length
            const entrySize = this.getElm().querySelector('.quiqqer-gallery-logoSlider-child').getSize().x;

            this.$scrollLength = entrySize * 5;
        },

        /**
         * event : on import
         */
        $onImport: function () {
            const Elm = this.getElm();
            this.SliderWrapper = Elm.querySelector('.quiqqer-gallery-logoSlider-wrapper');

            // const Elm  = this.getElm().getElement('.wrapper').getElement('.quiqqer-bricks-children-slider-container'),
            const size = this.SliderWrapper.getSize();


            this.$Next = document.createElement('div');
            this.$Next.className = 'quiqqer-gallery-logoSlider-next hide-on-mobile';
            this.$Next.innerHTML = '<span class="fa fa-angle-right"></span>';
            this.$Next.addEventListener('click', this.next2);
            this.SliderWrapper.appendChild(this.$Next);

            this.$Prev = document.createElement('div');
            this.$Prev.className = 'quiqqer-gallery-logoSlider-prev hide-on-mobile';
            this.$Prev.innerHTML = '<span class="fa fa-angle-left"></span>';
            this.$Prev.addEventListener('click', this.prev2);
            this.SliderWrapper.appendChild(this.$Prev);

            this.$Inner = Elm.querySelector(
                '.quiqqer-gallery-logoSlider-container-inner'
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

        prev2: function () {
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

        next2: function () {
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

            if (left === 0) {
                this.$Prev.classList.add('disabled');
            } else {
                this.$Prev.classList.remove('disabled');
            }

            if (left === this.$scrollMax || left > this.$scrollMax) {
                this.$Next.classList.add('disabled');
            } else {
                this.$Next.classList.remove('disabled');
            }
        }
    });
});
