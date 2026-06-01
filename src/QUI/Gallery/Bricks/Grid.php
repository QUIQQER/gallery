<?php

/**
 * This file contains QUI\Gallery\Bricks\Grid
 */

namespace QUI\Gallery\Bricks;

use Exception;
use QUI;

/**
 * Class Grid
 *
 * Brick that displays images in a grid.
 *
 * @author  www.pcsg.de (Michael Danielczok)
 *
 * @package quiqqer/gallery
 */
class Grid extends QUI\Control
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
            'max' => 9,
            'start' => 0,
            'entriesPerLine ' => 3,
            'folder' => false,
            'scaleImage' => true,
            'addGap' => true,
            'border' => false,
            'showImageTitle' => true,
            'centerImage' => true,
            'class' => 'quiqqer-gallery-brick-grid',
            'order' => 'title ASC',
            'usePagination' => false,
            'titleClickable' => 0 // 1 = open image
        ]);

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

        try {
            $Folder = QUI\Projects\Media\Utils::getMediaItemByUrl($this->getAttribute('folderId'));
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::writeException($Exception);

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

        if (!$this->getAttribute('entriesPerLine')) {
            $this->setAttribute('entriesPerLine', 3);
        }

        $GridGallery = new QUI\Gallery\Controls\Grid([
            'max' => $this->getAttribute('max'),
            'start' => $this->getAttribute('start'),
            'entriesPerLine' => $this->getAttribute('entriesPerLine'),
            'scaleImage' => $this->getAttribute('scaleImage'),
            'addGap' => $this->getAttribute('addGap'),
            'border' => $this->getAttribute('border'),
            'showImageTitle' => $this->getAttribute('showImageTitle'),
            'centerImage' => $this->getAttribute('centerImage'),
            'folderId' => $Folder->getId(),
            'class' => 'quiqqer-gallery-grid',
            'order' => $order,
            'usePagination' => false,
            'titleClickable' => $this->getAttribute('titleClickable') ? 1 : 0,
            'template' => 'flexbox'
        ]);

        $Engine->assign([
            'this' => $this,
            'htmlGridGallery' => $GridGallery->create()
        ]);

        $this->addCSSFiles($GridGallery->getCSSFiles());

        return $Engine->fetch(dirname(__FILE__) . '/Grid.html');
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
