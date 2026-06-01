<?php

/**
 * This file contains \QUI\Gallery\Controls\Logo\Slider
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
 */
class Slider extends QUI\Control
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
            'class' => 'quiqqer-gallery-logoSlider',
            'nodeName' => 'section',
            'site' => '',
            'order' => false,
            'max' => false,
            'moreLink' => false,
            'Project' => false,
            'folderId' => false,
            'data-qui' => 'package/quiqqer/gallery/bin/controls/ImageSlider2',
            'desktopHeight' => 200,
            'mobileHeight' => 100
        ]);

        $this->addCSSFile(
            dirname(__FILE__) . '/Slider.css'
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
        $desktopHeight = '200px';
        $mobileHeight = '100px';

        /* @var $Folder Folder */
        if (str_contains($folderId, 'image.php')) {
            try {
                $Folder = QUI\Projects\Media\Utils::getMediaItemByUrl(
                    $folderId
                );
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
                '\QUI\Gallery\Controls\Logo\Slider - No folder with images selected. 
packages/quiqqer/gallery/src/QUI/Gallery/Controls/Logo/Slider.php:84'
            );

            return '';
        }

        $MoreLink = null;

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

        if ($this->getAttribute('desktopHeight')) {
            $desktopHeight = $this->getAttribute('desktopHeight') . 'px';
        }

        if ($this->getAttribute('mobileHeight')) {
            $mobileHeight = $this->getAttribute('mobileHeight') . 'px';
        }

        $this->setStyles([
            '--qui--logoSlider-desktopHeight' => $desktopHeight,
            '--qui--logoSlider-mobileHeight' => $mobileHeight,
            '--qui--logoSlider-height' => $desktopHeight
        ]);

        if ($this->getAttribute('moreLink')) {
            try {
                $MoreLink = QUI\Projects\Site\Utils::getSiteByLink($this->getAttribute('moreLink'));
            } catch (QUI\Exception) {
            }
        }

        $Engine->assign([
            'this' => $this,
            'images' => $images,
            'MoreLink' => $MoreLink
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
        return dirname(__FILE__) . '/Slider.html';
    }
}
