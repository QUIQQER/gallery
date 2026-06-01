<?php

/**
 * This file contains QUI\Gallery\Controls\ImageSlider
 */

namespace QUI\Gallery\Controls;

use Exception;
use QUI;
use QUI\Projects\Media\Folder;

use function dirname;

/**
 * Class Slider
 */
class ImageSlider extends QUI\Control
{
    private QUI\Projects\Project $Project;

    /**
     * constructor
     *
     * @param array<string, mixed> $attributes
     */
    public function __construct(array $attributes = [])
    {
        // default options
        $this->setAttributes([
            'class' => 'quiqqer-gallery-imageSlider',
            'nodeName' => 'section',
            'site' => '',
            'order' => 'c_date DESC',
            'limit' => 10,
            'moreLink' => false,
            'Project' => false,
            'folderId' => false,
            'folderIds' => '', // ids comma separated
            'imageBehavior' => '', // '', 'center', 'fill'
            'data-qui' => 'package/quiqqer/gallery/bin/controls/ImageSlider',
            'sliderHeight' => 200,
        ]);

        $this->addCSSFile(
            dirname(__FILE__) . '/ImageSlider.css'
        );

        parent::__construct($attributes);

        $this->setAttribute('cacheable', 0);
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
        $this->Project = $this->getProject();
        $MoreLink = null;
        $limit = $this->getAttribute('limit');
        $shuffleImages = false;

        if (!is_numeric($limit)) {
            $limit = 10;
        }

        $limit = (int)$limit;

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
                $order = 'c_date DESC';
                break;
        }

        if ($order === 'random') {
            $this->setJavaScriptControlOption('randomorder', 1);
            $this->setJavaScriptControlOption('max', $limit);
            $shuffleImages = true;
        }

        $folderIds = $this->getAttribute('folderIds');

        if (is_string($folderIds)) {
            $folderIds = array_filter(explode(',', $folderIds));
        }

        if (!is_array($folderIds)) {
            $folderIds = [];
        }

        if (count($folderIds) > 0) {
            $images = $this->getImagesByFolderIds($folderIds, $order, $limit, $shuffleImages);
        } else {
            try {
                /* @var $Folder \QUI\Projects\Media\Folder */
                $Folder = QUI\Projects\Media\Utils::getMediaItemByUrl(
                    $this->getAttribute('folderId')
                );
            } catch (QUI\Exception $Exception) {
                QUI\System\Log::writeException($Exception);

                return '';
            }

            $query = [
                'limit' => $limit,
                'order' => $order,
            ];

            // get all images if order is "random"
            if ($shuffleImages) {
                unset($query['limit']);
            }

            $images = [];

            if (method_exists($Folder, 'getImages')) {
                $folderImages = $Folder->getImages($query);

                if (is_array($folderImages)) {
                    $images = $folderImages;
                }
            }

            if ($shuffleImages && $limit && count($images)) {
                shuffle($images);
                $images = array_slice($images, 0, $limit);
            }
        }

        if (!$this->getAttribute('sliderHeight')) {
            $this->setAttribute('sliderHeight', 200);
        }

        $this->setCustomVariable('sliderHeight', $this->getAttribute('sliderHeight') . 'px');

        if ($this->getAttribute('moreLink')) {
            try {
                $MoreLink = QUI\Projects\Site\Utils::getSiteByLink($this->getAttribute('moreLink'));
            } catch (QUI\Exception) {
            }
        }

        switch ($this->getAttribute('imageBehavior')) {
            case 'center':
                $imageBehavior = 'quiqqer-gallery-imageSlider--image-center';
                break;

            case 'fill':
                $imageBehavior = 'quiqqer-gallery-imageSlider--image-fill';
                break;

            default:
                $imageBehavior = '';
        }

        $Engine->assign([
            'this' => $this,
            'images' => $images,
            'MoreLink' => $MoreLink,
            'imageBehavior' => $imageBehavior,
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
        return dirname(__FILE__) . '/ImageSlider.html';
    }

    /**
     * Set custom css variable to the control as inline style
     * --_qui-gallery-imageSlider-$name: var(--qui-gallery-imageSlider-$name, $value);
     *
     * Example:
     *     --_qui-gallery-imageSlider-sliderHeight: var(--qui-gallery-imageSlider-sliderHeight, 200px);
     *
     * @param string $name
     * @param string $value
     *
     * @return void
     */
    private function setCustomVariable(string $name, string $value): void
    {
        if (!$name || !$value) {
            return;
        }

        $this->setStyle(
            '--_qui-gallery-imageSlider-' . $name,
            'var(--qui-gallery-imageSlider-' . $name . ', ' . $value . ')'
        );
    }

    /**
     * Get images from multiple folders (direct SQL query).
     *
     * @param array<int, int|string> $folderIds
     * @param string $order
     * @param int $limit
     * @param bool $shuffleImages - if true, get all images
     *
     * @return array<int, mixed>
     */
    private function getImagesByFolderIds(
        array $folderIds,
        string $order,
        int $limit,
        bool $shuffleImages = false
    ): array {
        $projectName = $this->Project->getAttribute('name');

        if (!is_string($projectName)) {
            return [];
        }

        $table = QUI::getDBTableName($projectName . '_media');
        $table_rel = QUI::getDBTableName($projectName . '_media_relations');

        $whereClause = [
            $table_rel . '.child = ' . $table . '.id',
            $table . '.deleted = 0 ',
            $table . '.type = \'image\'',
            'active = 1',
        ];

        $folderConditions = [];

        foreach ($folderIds as $folderId) {
            $folderConditions[] = $table_rel . '.parent = ' . (int)$folderId;
        }

        $whereClause[] = '(' . implode(' OR ', $folderConditions) . ')';
        $whereClauseString = implode(' AND ', $whereClause);

        $dbQuery = [
            'select' => 'id',
            'from' => [
                $table,
                $table_rel,
            ],
            'limit' => $limit,
            'where' => $whereClauseString,
        ];

        $dbQuery['order'] = $order;

        if ($shuffleImages) {
            unset($dbQuery['limit']);
            $dbQuery['order'] = 'c_date DESC';
        }

        // database
        try {
            $fetch = QUI::getDataBase()->fetch($dbQuery);
        } catch (QUI\Exception $Exception) {
            QUI\System\Log::writeException($Exception);

            return [];
        }

        if ($shuffleImages && $limit) {
            shuffle($fetch);
            $fetch = array_slice($fetch, 0, $limit);
        }

        $result = [];

        foreach ($fetch as $entry) {
            try {
                $Media = $this->Project->getMedia();
                $result[] = $Media->get((int)$entry['id']);
            } catch (QUI\Exception $Exception) {
                QUI\System\Log::addDebug($Exception->getMessage());
            }
        }

        return $result;
    }
}
