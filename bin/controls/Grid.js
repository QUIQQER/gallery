/**
 * Grid Gallery
 * Functionality for the PHP Grid Control
 */
define('package/quiqqer/gallery/bin/controls/Grid', [

    'qui/QUI',
    'qui/controls/Control',
    'package/quiqqer/gallery/bin/controls/Popup',

    'css!package/quiqqer/gallery/bin/controls/Grid.css'

], function (QUI, QUIControl, ImagePopup) {
    "use strict";

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/gallery/bin/controls/Grid',

        Binds: [
            '$onImport',
            '$imageClick'
        ],

        options: {
            'titleclickable': 0 // 1 = open image
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
            let images = Array.from(this.$Elm.querySelectorAll(
                '.quiqqer-gallery-grid-entry-image, .quiqqer-control-gallery-grid-image, .quiqqer-control-gallery-gridAdvanced-image'
            ));

            if (this.$Elm.get('data-qui-titleclickable') == "1") {
                this.setAttribute('titleclickable', this.$Elm.get('data-qui-titleclickable'));
            }

            if (this.getAttribute('titleclickable')) {
                const titles = Array.from(this.$Elm.querySelectorAll(
                    '.quiqqer-gallery-grid-entry-text a'
                ));

                images = images.concat(titles)
            }

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
                    title: Elm.querySelector('.title').innerHTML,
                    short: Elm.querySelector('.short').innerHTML
                };
            });
        },

        /**
         * event - image click
         *
         * @param {DOMEvent} event
         */
        $imageClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            let Target = event.target;

            if (Target.nodeName !== 'A') {
                Target = Target.closest('a');
            }

            this.$ImageWindow = new ImagePopup({
                images: this.$images
            });

            this.$ImageWindow.showImage(Target.getAttribute('href'));
        }
    });
});
