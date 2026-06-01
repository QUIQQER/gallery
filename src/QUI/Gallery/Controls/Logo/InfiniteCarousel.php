<?php

/**
 * This file contains \QUI\Gallery\Controls\Logo\InfiniteCarousel
 */

namespace QUI\Gallery\Controls\Logo;

use Exception;
use QUI;
use QUI\Projects\Media\Folder;

use function array_slice;
use function count;
use function dirname;

/**
 * Class Slider
 * @package QUI\Gallery\Controls\Logo\Slider
 */
class InfiniteCarousel extends QUI\Control
{
    /**
     * constructor
     *
     * @param array<string, mixed> $attributes
     */
    public function __construct(array $attributes = [])
    {
        // default options
        $this->setAttributes([
            'class' => 'quiqqer-gallery-logoInfiniteCarousel',
            'nodeName' => 'section',
            'site' => '',
            'order' => false,
            'max' => false,
            'folderId' => false,
            'imgHeight' => 50, // pixels
            'animationDuration' => 40, // seconds
            'stopAnimationOnHover' => false,
            'direction' => 'toLeft',
            'carouselBlockSpacing' => 'none', // none, small, normal, large
            'fadeInOut' => false,
            'fadeInOutColor' => '#fff'
        ]);

        $this->addCSSFile(
            dirname(__FILE__) . '/InfiniteCarousel.css'
        );

        parent::__construct($attributes);
    }

    /**
     * (non-PHPdoc)
     *
     * @throws Exception
     * @see \QUI\Control::create()
     */
    public function getBody(): string
    {
        $Engine = QUI::getTemplateManager()->getEngine();
        $Project = $this->getProject();
        $Media = $Project->getMedia();
        $folderId = $this->getAttribute('folderId');
        $Folder = false;
        $imgHeight = 50;
        $animationDuration = 40;
        $animationStateOnHover = 'running';
        $fadeInOut = '';
        $fadeInOutColor = '#fff';
        $Site = $this->getAttribute('Site') ? $this->getAttribute('Site') : null;

        /* @var $Folder Folder */
        if (str_contains($folderId, 'image.php')) {
            try {
                $Folder = QUI\Projects\Media\Utils::getMediaItemByUrl($folderId);
            } catch (QUI\Exception) {
            }
        } elseif ($folderId) {
            try {
                $Folder = $Media->get((int)$folderId);
            } catch (QUI\Exception) {
            }
        }

        if (!$Folder) {
            QUI\System\Log::addNotice(
                '\QUI\Gallery\Controls\Logo\InfiniteCarousel - No folder with images selected. 
                packages/quiqqer/gallery/src/QUI/Gallery/Controls/Logo/InfiniteCarousel.php',
                [
                    'brickId' => $this->getAttribute('data-brickid'),
                    'project' => $this->getProject()->getName(),
                    'lang' => $this->getProject()->getLang(),
                    'site' => $Site?->getId()
                ]
            );

            return '';
        }

        switch ($this->getAttribute('order')) {
            case 'title DESC':
            case 'title ASC':
            case 'name DESC':
            case 'name ASC':
            case 'c_date DESC':
            case 'c_date ASC':
            case 'e_date DESC':
            case 'e_date ASC':
            case 'priority DESC':
            case 'priority ASC':
                $order = $this->getAttribute('order');
                break;

            default:
                $order = 'name DESC';
                break;
        }

        $images = [];

        if ($Folder instanceof Folder) {
            $folderImages = $Folder->getImages([
                'order' => $order
            ]);

            if (is_array($folderImages)) {
                $images = $folderImages;
            }
        }


        if ($this->getAttribute('max') && count($images) > $this->getAttribute('max')) {
            $images = array_slice($images, 0, $this->getAttribute('max'));
        }

        if (empty($images)) {
            QUI\System\Log::addNotice(
                '\QUI\Gallery\Controls\Logo\InfiniteCarousel - No images founded. 
                packages/quiqqer/gallery/src/QUI/Gallery/Controls/Logo/InfiniteCarousel.php',
                [
                    'brickId' => $this->getAttribute('data-brickid'),
                    'project' => $this->getProject()->getName(),
                    'lang' => $this->getProject()->getLang(),
                    'site' => $Site?->getId()
                 ]
            );

            return '';
        }

        if (
            $this->getAttribute('imgHeight') &&
            intval($this->getAttribute('imgHeight')) >= 10 &&
            intval($this->getAttribute('imgHeight')) <= 500
        ) {
            $imgHeight = intval($this->getAttribute('imgHeight'));
        }

        if (
            $this->getAttribute('animationDuration') &&
            floatval($this->getAttribute('animationDuration')) >= 10 &&
            floatval($this->getAttribute('animationDuration')) <= 200
        ) {
            $animationDuration = floatval($this->getAttribute('animationDuration')) . 's';
        }

        if ($this->getAttribute('stopAnimationOnHover')) {
            $animationStateOnHover = 'paused';
        }

        if ($this->getAttribute('fadeInOut')) {
            $fadeInOut = 'quiqqer-gallery-logoInfiniteCarousel__wrapper--fadeInOut';
        }

        if ($this->getAttribute('fadeInOutColor')) {
            $fadeInOutColor = $this->getAttribute('fadeInOutColor');
        }

        $direction = match ($this->getAttribute('direction')) {
            'toLeft', 'toRight' => $this->getAttribute('direction'),
            default => 'toLeft'
        };

        $this->addCSSClass($direction);

        switch ($this->getAttribute('carouselBlockSpacing')) {
            case 'small':
                $carouselBlockSpacing = '0.5rem';
                break;

            case 'normal':
                $carouselBlockSpacing = '1.5rem';
                break;

            case 'large':
                $carouselBlockSpacing = '3rem';
                break;

            case 'none':
            default:
                $carouselBlockSpacing = '0px';
                break;
        }

        // set custom css variables
        $this->setCustomVariable('imageHeight', $imgHeight  . 'px');
        $this->setCustomVariable('animationDuration', $animationDuration);
        $this->setCustomVariable('animationStateOnHover', $animationStateOnHover);
        $this->setCustomVariable('fadeInOutColor', $fadeInOutColor);
        $this->setCustomVariable('carouselBlockSpacing', $carouselBlockSpacing);

        $Engine->assign([
            'this' => $this,
            'images' => $images,
            'imgHeight' => $imgHeight,
            'fadeInOut' => $fadeInOut,
            'id' => QUI\Utils\Uuid::get()
        ]);

        return $Engine->fetch($this->getTemplate());
    }

    /**
     * Return the control template
     *
     * @return string
     */
    protected function getTemplate(): string
    {
        return dirname(__FILE__) . '/InfiniteCarousel.html';
    }

    /**
     * Set custom css variable to the control as inline style
     * --_qui-gallery-logoInfiniteCarousel--$name: var(--qui-gallery-logoInfiniteCarousel--$name, $value);
     *
     * Example:
     *     --_qui-gallery-logoInfiniteCarousel--imgHeight: var(qui-gallery-logoInfiniteCarousel--imgHeight, 50px);
     *
     * @param string $name
     * @param string|int $value
     *
     * @return void
     */
    private function setCustomVariable(string $name, string|int $value): void
    {
        if (!$name || !$value) {
            return;
        }

        $this->setStyle(
            '--_qui-gallery-logoInfiniteCarousel--' . $name,
            'var(--qui-gallery-logoInfiniteCarousel--' . $name . ', ' . $value . ')'
        );
    }
}
