<?php

/**
 * This file contains QUI\Gallery\Controls\Grid
 */

namespace QUI\Gallery\Controls;

use Exception;
use QUI;
use QUI\Projects\Media\Folder;

/**
 * Class Grid
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
            'entriesPerLine' => 3,
            'scaleImage' => true,
            'addGap' => true,
            'border' => false,
            'showImageTitle' => true,
            'centerImage' => true,
            'Project' => false,
            'folderId' => false,
            'class' => 'quiqqer-control-gallery-grid',
            'order' => 'title ASC',
            'usePagination' => true,
            'paginationPosition' => 'bottom',
            'titleClickable' => 0, // 1 = open image
            'template' => 'unsemantic'
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
        $Project = $this->getProject();
        $Media = $Project->getMedia();
        $Pagination = null;

        /* @var $Folder Folder */
        $Folder = $Media->get($this->getAttribute('folderId'));

        $start = $this->getAttribute('start');
        $max = $this->getAttribute('max');

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

        if (!is_numeric($start) || (int)$start < 0) {
            $start = 0;
        }

        if (!is_numeric($max) || (int)$max < 1) {
            $max = 9;
        }

        $images = [];

        if (method_exists($Folder, 'getImages')) {
            $images = $Folder->getImages([
                'limit' => $start . ',' . $max,
                'order' => $order
            ]);
        }

        // completeList is used to navigate in popup per JavaScript (next / prev image)
        $completeList = $images;

        if ($this->getAttribute('usePagination')) {
            $completeList = [];
            $count = [];

            // with pagination enabled completeList includes all images from a folder
            if (method_exists($Folder, 'getImages')) {
                $completeList = $Folder->getImages([
                    'order' => $order
                ]);

                $count = $Folder->getImages([
                    'count' => true
                ]);
            }

            $sheets = ceil($count / $max);

            $Pagination = new QUI\Controls\Navigating\Pagination([
                'limit' => false
            ]);

            $Pagination->loadFromRequest();
            $Pagination->setAttribute('Site', $this->getSite());
            $Pagination->setAttribute('sheets', $sheets);
        }

        $scaleImage = '';
        if ($this->getAttribute('scaleImage')) {
            $scaleImage = 'quiqqer-control-gallery-grid__scaleImage';
        }

        $gap = '';
        if ($this->getAttribute('addGap')) {
            $gap = 'quiqqer-control-gallery-grid__gap';
        }

        $border = '';
        if ($this->getAttribute('border')) {
            $border = 'quiqqer-control-gallery-grid__border';
        }

        $centerImage = '';
        if ($this->getAttribute('centerImage')) {
            $centerImage = 'quiqqer-control-gallery-grid__centerImage';
        }

        $Engine->assign([
            'Rewrite' => QUI::getRewrite(),
            'this' => $this,
            'perLine' => $this->getAttribute('entriesPerLine'),
            'images' => $images,
            'Site' => $this->getSite(),
            'completeList' => $completeList,
            'Pagination' => $Pagination,
            'paginationPos' => $this->getAttribute('paginationPosition'),
            'titleClickable' => $this->getAttribute('titleClickable') ? 1 : 0,
            'scaleImage' => $scaleImage,
            'gap' => $gap,
            'border' => $border,
            'centerImage' => $centerImage
        ]);

        switch ($this->getAttribute('template')) {
            case 'flexbox':
                // new template based on css property flex box
                $css = dirname(__FILE__) . '/Grid.Flexbox.css';
                $template = dirname(__FILE__) . '/Grid.Flexbox.html';
                break;

            case 'unesmantic':
            default:
                // old template based on unsemantic classes
                $css = dirname(__FILE__) . '/Grid.Unsemantic.css';
                $template = dirname(__FILE__) . '/Grid.Unsemantic.html';
                break;
        }

        $this->addCSSFile($css);

        return $Engine->fetch($template);
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
