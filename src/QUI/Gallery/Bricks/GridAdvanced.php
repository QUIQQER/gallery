<?php

/**
 * This file contains QUI\Gallery\Bricks\GridAdvanced
 */

namespace QUI\Gallery\Bricks;

use Exception;
use QUI;

/**
 * Class Grid
 *
 * Brick that displays images in a grid.
 */
class GridAdvanced extends QUI\Control
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
            'class' => 'quiqqer-gallery-brick-gridAdvanced',
            'max' => 12,
            'start' => 0,
            'entriesPerLine' => 3,
            'folder' => false,
            'scaleImage' => true,
            'addGap' => true,
            'showImageTitle' => false,
            'order' => 'name ASC',
            'usePagination' => false,
            'titleClickable' => 0, // 1 = open image
            'centerImage' => true,
            'aspectRatio' => 'none',
            'variableColumnCount' => false,
            'minWidth' => 200,
            'maxWidth' => 500
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
            case 'random':
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
                $order = 'name ASC';
                break;
        }

        $GridAdvancedGallery = new QUI\Gallery\Controls\GridAdvanced([
            'max' => $this->getAttribute('max'),
            'start' => $this->getAttribute('start'),
            'entriesPerLine' => $this->getAttribute('entriesPerLine'),
            'scaleImage' => $this->getAttribute('scaleImage'),
            'addGap' => $this->getAttribute('addGap'),
            'showImageTitle' => $this->getAttribute('showImageTitle'),
            'centerImage' => $this->getAttribute('centerImage'),
            'folderId' => $Folder->getId(),
            'class' => 'quiqqer-gallery-grid',
            'order' => $order,
            'scaleImageOnHover' => $this->getAttribute('scaleImageOnHover'),
            'darkenImageOnHover' => $this->getAttribute('darkenImageOnHover'),
            'iconOnHover' => $this->getAttribute('iconOnHover'),
            'usePagination' => false,
            'titleClickable' => $this->getAttribute('titleClickable'),
            'template' => $this->getAttribute('template'),
            'aspectRatio' => $this->getAttribute('aspectRatio'),
            'variableColumnCount' => $this->getAttribute('variableColumnCount'),
            'minWidth' => $this->getAttribute('minWidth'),
            'maxWidth' => $this->getAttribute('maxWidth')
        ]);

        $Engine->assign([
            'this' => $this,
            'htmlGridAdvancedGallery' => $GridAdvancedGallery->create()
        ]);

        $this->addCSSFiles($GridAdvancedGallery->getCSSFiles());

        return $Engine->fetch(dirname(__FILE__) . '/GridAdvanced.html');
    }
}
