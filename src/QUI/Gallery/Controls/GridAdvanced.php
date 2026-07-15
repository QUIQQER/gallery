<?php

/**
 * This file contains QUI\Gallery\Controls\GridAdvanced
 */

namespace QUI\Gallery\Controls;

use Exception;
use QUI;
use QUI\Projects\Media\Folder;

/**
 * Class Grid
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
            'class' => 'quiqqer-control-gallery-gridAdvanced',
            'max' => 12,
            'start' => 0,
            'entriesPerLine' => 3,
            'addGap' => true,
            'showImageTitle' => false,
            'Project' => false,
            'folderId' => false,
            'order' => 'title ASC',
            'scaleImageOnHover' => true,
            'darkenImageOnHover' => false,
            'iconOnHover' => false,
            'usePagination' => false,
            'titleClickable' => 0, // 1 = open image
            'template' => '1', // template number (1 - 10) or name (2perRow to 6perRow)
            'aspectRatio' => 'none',
            'variableColumnCount' => false,
            'minWidth' => 200,
            'maxWidth' => 500
        ]);

        $this->setJavaScriptControl('package/quiqqer/gallery/bin/controls/GridAdvanced');

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
        $titleClickable = $this->getAttribute('titleClickable') ? 1 : 0;

        $this->setJavaScriptControlOption('titleclickable', $titleClickable);


        /* @var $Folder Folder */
        $Folder = $Media->get($this->getAttribute('folderId'));

        $start = $this->getAttribute('start');
        $max = $this->getAttribute('max');

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

        if (!is_numeric($start) || (int)$start < 0) {
            $start = 0;
        }

        if (!is_numeric($max) || (int)$max < 1) {
            $max = 12;
        }

        $getImagesParams = [
            'limit' => $start . ',' . $max,
            'order' => $order
        ];

        $shuffleImages = false;

        if ($order === 'random') {
            $this->setJavaScriptControlOption('randomorder', 1);
            $this->setJavaScriptControlOption('max', $max);
            unset($getImagesParams['limit']);
            $shuffleImages = true;
        }

        $images = [];

        if (method_exists($Folder, 'getImages')) {
            $images = $Folder->getImages($getImagesParams);
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

        $gap = '';
        if ($this->getAttribute('addGap')) {
            $gap = 'quiqqer-control-gallery-gridAdvanced__gap';
        }

        $scaleImageOnHover = '';
        if ($this->getAttribute('scaleImageOnHover')) {
            $scaleImageOnHover = 'quiqqer-control-gallery-gridAdvanced__scaleImageOnHover';
        }

        $darkenImageOnHover = '';
        if ($this->getAttribute('darkenImageOnHover')) {
            $darkenImageOnHover = 'quiqqer-control-gallery-gridAdvanced__darkenImageOnHover';
        }

        $iconOnHover = '';
        if ($this->getAttribute('iconOnHover')) {
            $iconOnHover = 'quiqqer-control-gallery-gridAdvanced__iconOnHover';
        }

        // for commont templates like "3 images per row"
        $commonTemplate = false;
        $variableColumnCount = '';

        /* template */
        switch ($this->getAttribute('template')) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '10':
                $template = $this->getAttribute('template');
                $templateCSS = 'galleryGridTemplate--' . $this->getAttribute('template');
                break;

            case '2perRow':
            case '3perRow':
            case '4perRow':
            case '5perRow':
            case '6perRow':
                $template = $this->getAttribute('template');
                $templateCSS = 'galleryGridTemplate--' . $this->getAttribute('template');

                $commonTemplate = true;
                break;

            default:
                $template = 1;
                $templateCSS = 'galleryGridTemplate--1';
        }

        $aspectRatio = false;

        if ($commonTemplate) {
            $colNumber = intval(substr($template, 0, 1));

            if ($colNumber < 2 || $colNumber > 6) {
                $colNumber = 3;
            }

            $this->setCustomVariable('colNumber', $colNumber);

            $aspectRatio = $this->getAttribute('aspectRatio');

            if (is_string($aspectRatio) && $aspectRatio !== 'none') {
                $this->setCustomVariable('aspectRatio', $aspectRatio);
            }

            if ($this->getAttribute('variableColumnCount')) {
                $variableColumnCount = 'galleryGridTemplate--autoColumn';

                $minWidth = intval($this->getAttribute('minWidth'));

                if (intval($this->getAttribute('minWidth')) > 10) {
                    $minWidth = intval($this->getAttribute('minWidth'));
                }

                $maxWidth = intval($this->getAttribute('maxWidth'));

                if ($maxWidth < 10 || $maxWidth < $minWidth) {
                    $minWidth = false;
                }

                $this->setCustomVariable('minWidth', $minWidth . 'px');
                $this->setCustomVariable('maxWidth', $maxWidth . 'px');
            }
        }

        $Engine->assign([
            'Rewrite' => QUI::getRewrite(),
            'this' => $this,
            'perLine' => $this->getAttribute('entriesPerLine'),
            'images' => $images,
            'Site' => $this->getSite(),
            'completeList' => $completeList,
            'Pagination' => $Pagination,
            'titleClickable' => $titleClickable,
            'gap' => $gap,
            'template' => $template,
            'templateCSS' => $templateCSS,
            'scaleImageOnHover' => $scaleImageOnHover,
            'darkenImageOnHover' => $darkenImageOnHover,
            'iconOnHover' => $iconOnHover,
            'shuffleImages' => $shuffleImages,
            'max' => $max,
            'aspectRatio' => $aspectRatio,
            'variableColumnCount' => $variableColumnCount
        ]);


        $this->addCSSFile(dirname(__FILE__) . '/GridAdvanced.css');

        return $Engine->fetch(dirname(__FILE__) . '/GridAdvanced.html');
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

    /**
     * Set custom css variable to the control as inline style
     * --_qui-gridAdvanced-$name: var(--qui-gridAdvanced-$name, $value);
     *
     * @param string $name
     * @param string|int $value
     * @return void
     */
    private function setCustomVariable(string $name, string|int $value): void
    {
        if (!$name || !$value) {
            return;
        }

        $this->setStyle(
            '--_qui-gridAdvanced-' . $name,
            'var(--qui-gridAdvanced-' . $name . ', ' . $value . ')'
        );
    }
}
