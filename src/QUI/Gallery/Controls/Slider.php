<?php

/**
 * This file contains QUI\Gallery\Controls\Slider
 */

namespace QUI\Gallery\Controls;

use Exception;
use QUI;
use QUI\Projects\Media\Folder;

use function dirname;

/**
 * Class Slider
 *
 * @package quiqqer/gallery
 */
class Slider extends QUI\Control
{
    /**
     * list of images
     *
     * @var QUI\Projects\Media\Image[]
     */
    protected array $ownImages = [];

    /**
     * constructor
     *
     * @param array<string, mixed> $attributes
     */
    public function __construct(array $attributes = [])
    {
        // default options
        $this->setAttributes([
            'Project' => false,
            'folderId' => false,
            'class' => 'quiqqer-gallery-slider',
            'data-qui' => 'package/quiqqer/gallery/bin/controls/Slider',
            'order' => false,
            'placeholderimage' => false,
            'placeholdercolor' => false
        ]);

        parent::__construct($attributes);

        $this->addCSSFile(
            OPT_DIR . 'quiqqer/gallery/bin/controls/Slider.css'
        );
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
        $images = [];

        $this->setAttribute(
            'data-qui-options-placeholdercolor',
            $this->getAttribute('placeholdercolor')
        );

        if ($this->getAttribute('placeholderimage')) {
            $this->setAttribute(
                'data-qui-options-placeholderimage',
                $this->getAttribute('placeholderimage')
            );
        } else {
            $Placeholder = $Media->getPlaceholderImage();

            if ($Placeholder) {
                $this->setAttribute(
                    'data-qui-options-placeholderimage',
                    $Placeholder->getSizeCacheUrl()
                );
            }
        }

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

        if ($Folder === false && empty($this->ownImages)) {
            $Placeholder = $Project->getMedia()->getPlaceholderImage();

            if ($Placeholder) {
                $this->ownImages[] = $Placeholder;
            }
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
                if ($Folder) {
                    $order = $Folder->getAttribute('order');
                }

                if (empty($order)) {
                    $order = 'name DESC';
                }

                break;
        }

        if ($Folder && method_exists($Folder, 'getImages')) {
            $images = $Folder->getImages([
                'order' => $order
            ]);
        } elseif (!empty($this->ownImages)) {
            $images = $this->ownImages;
        }


        $Engine->assign([
            'Rewrite' => QUI::getRewrite(),
            'this' => $this,
            'Folder' => $Folder,
            'images' => $images,
            'Site' => $this->getSite()
        ]);

        return $Engine->fetch(dirname(__FILE__) . '/Slider.html');
    }

    /**
     * Add an own image, no folder id needed
     *
     * @param QUI\Projects\Media\Image $Image
     */
    public function addImage(QUI\Projects\Media\Image $Image): void
    {
        $this->ownImages[] = $Image;
    }

    /**
     * @return QUI\Interfaces\Projects\Site
     * @throws QUI\Exception
     */
    protected function getSite(): QUI\Interfaces\Projects\Site
    {
        $Site = $this->getAttribute('Site');

        if ($Site instanceof QUI\Interfaces\Projects\Site) {
            return $Site;
        }

        $Site = QUI::getRewrite()->getSite();

        if (!$Site instanceof QUI\Interfaces\Projects\Site) {
            throw new QUI\Exception('No active site available.');
        }

        $this->setAttribute('Site', $Site);

        return $Site;
    }
}
