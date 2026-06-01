/**
 * Grid Gallery
 * Functionality for the PHP Grid Control
 *
 * @module package/quiqqer/gallery/bin/controls/GridAdvanced
 * @author www.pcsg.de (Henning Leutz)
 * @author www.pcsg.de (Michael Danielczok)
 */
define('package/quiqqer/gallery/bin/controls/GridAdvanced', [

    'qui/QUI',
    'qui/controls/Control',
    'package/quiqqer/gallery/bin/controls/Popup',

    'css!package/quiqqer/gallery/bin/controls/Grid.css'

], function (QUI, QUIControl, ImagePopup) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/gallery/bin/controls/GridAdvanced',

        Binds: [
            '$onImport',
            '$imageClick'
        ],

        options: {
            'titleclickable': 0, // 1 = open image
            'randomorder': 0, // 1 = shuffle images and load asynchron
            'max': 12 // max number of images, it works with random order
        },

        initialize: function (options) {
            this.parent(options);

            this.$ImageWindow = false;
            this.$CompleteList = false;

            this.$__resized = false;
            this.$images = [];

            this.addEvents({
                onImport: this.$onImport
            });
        },

        /**
         * event on inject
         */
        $onImport: function () {
            const Elm = this.getElm();

            const images = Array.from(this.$Elm.querySelectorAll(
                '.quiqqer-gallery-grid-entry-image, .quiqqer-control-gallery-grid-image, .quiqqer-control-gallery-gridAdvanced-image'
            ));


            /*if (this.getAttribute('titleclickable')) {
                const titles = Array.from(this.$Elm.querySelectorAll(
                    '.quiqqer-gallery-gridAdvanced-entry-text a'
                );

                images = images.concat(titles)
            }*/

            for (let i = 0, len = images.length; i < len; i++) {
                images[i].addEventListener('click', this.$imageClick);
            }

            // get the complete list
            const completeList = this.$Elm.querySelector(
                '.quiqqer-gallery-grid-list-complete'
            );

            this.$CompleteList = document.createElement('div');
            this.$CompleteList.innerHTML = completeList.innerHTML.replace('<template>', '').replace('</template>', '');
            this.$CompleteList.style.display = 'none';
            this.$Elm.appendChild(this.$CompleteList);

            this.$images = Array.from(this.$CompleteList.querySelectorAll(
                '.quiqqer-gallery-grid-list-complete-entry'
            )).map(function (Elm) {
                return {
                    src: Elm.get('data-src'),
                    thumbSrc: Elm.get('data-thumb-src'),
                    title: Elm.querySelector('.title').innerHTML,
                    short: Elm.querySelector('.short').innerHTML
                };
            });

            if (this.getAttribute('randomorder')) {
                this.$handleRandomImages();
            }
        },

        /**
         * Create links and images, load images asynchron
         * For order "random" we need to get all images and then to trim the array
         * to get the desired number of images.
         */
        $handleRandomImages: function () {
            const Elm = this.getElm();

            this.$shuffle(this.$images);

            this.$images = this.$images.slice(0, this.getAttribute('max'));
            const imageContainers = Elm.querySelectorAll('.quiqqer-control-gallery-gridAdvanced-entry');

            imageContainers.forEach((Container, index) => {
                if (typeof this.$images[index] === 'undefined') {
                    return;
                }

                const Link = document.createElement('a');
                Link.classList.add('quiqqer-control-gallery-gridAdvanced-image');
                Link.setAttribute('target', '_blank');
                Link.setAttribute('href', this.$images[index].src);
                Link.addEventListener('click', this.$imageClick);

                Container.appendChild(Link);

                const Img = document.createElement('img');
                Img.classList.add('quiqqer-control-gallery-gridAdvanced-image-img');
                Img.setAttribute('height', 1200);
                Img.setAttribute('width', 1200);
                Img.setAttribute('loading', 'lazy');
                Img.setAttribute('title', this.$images[index].title);
                Img.setAttribute('src', this.$images[index].thumbSrc);

                Img.addEventListener('load', () => {
                    Container.classList.add('hide');

                    // for now delay is hardcoded, it corresponds to css transition value of
                    // .skeletonLoadingEffect:after (500ms)
                    setTimeout(() => {
                        Container.classList.remove('skeletonLoadingEffect');
                        Container.classList.remove('hide');
                    }, 500);
                });

                Link.appendChild(Img);
            });
        },

        /**
         * event - image click
         *
         * @param {DOMEvent} event
         */
        $imageClick: function (event) {
            event.preventDefault();

            let Target = event.target;

            if (Target.nodeName !== 'A') {
                Target = Target.closest('a');
            }

            this.$ImageWindow = new ImagePopup({
                images: this.$images
            });

            this.$ImageWindow.showImage(Target.getAttribute('href'));
        },

        /**
         * Shuffle an array
         *
         * @param {Array} a
         * @return {Array}
         */
        $shuffle: function (a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }

            return a;
        },
    });
});
