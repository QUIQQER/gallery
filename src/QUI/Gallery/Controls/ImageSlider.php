<?php

/**
 * This file contains QUI\Gallery\Controls\ImageSlider
 */

namespace QUI\Gallery\Controls;

use Doctrine\DBAL\ArrayParameterType;
use Doctrine\DBAL\Exception as DBALException;
use Exception;
use QUI;
use QUI\Projects\Media\Folder;

use function array_map;
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
    protected function getImagesByFolderIds(
        array $folderIds,
        string $order,
        int $limit,
        bool $shuffleImages = false
    ): array {
        if ($folderIds === []) {
            return [];
        }

        $projectName = $this->Project->getAttribute('name');

        if (!is_string($projectName)) {
            return [];
        }

        $allowedOrders = [
            'title DESC' => ['title', 'DESC'],
            'title ASC' => ['title', 'ASC'],
            'name DESC' => ['name', 'DESC'],
            'name ASC' => ['name', 'ASC'],
            'c_date DESC' => ['c_date', 'DESC'],
            'c_date ASC' => ['c_date', 'ASC'],
            'e_date DESC' => ['e_date', 'DESC'],
            'e_date ASC' => ['e_date', 'ASC'],
            'priority DESC' => ['priority', 'DESC'],
            'priority ASC' => ['priority', 'ASC']
        ];
        [$orderField, $orderDirection] = $allowedOrders[$order] ?? $allowedOrders['c_date DESC'];

        if ($shuffleImages) {
            [$orderField, $orderDirection] = $allowedOrders['c_date DESC'];
        }

        $Connection = QUI::getDataBaseConnection();
        $Platform = $Connection->getDatabasePlatform();
        $mediaTable = $Platform->quoteSingleIdentifier(QUI::getDBTableName($projectName . '_media'));
        $relationsTable = $Platform->quoteSingleIdentifier(
            QUI::getDBTableName($projectName . '_media_relations')
        );

        $mediaId = 'media.' . $Platform->quoteSingleIdentifier('id');
        $mediaDeleted = 'media.' . $Platform->quoteSingleIdentifier('deleted');
        $mediaType = 'media.' . $Platform->quoteSingleIdentifier('type');
        $mediaActive = 'media.' . $Platform->quoteSingleIdentifier('active');
        $mediaOrder = 'media.' . $Platform->quoteSingleIdentifier($orderField);
        $relationChild = 'relations.' . $Platform->quoteSingleIdentifier('child');
        $relationParent = 'relations.' . $Platform->quoteSingleIdentifier('parent');

        $QueryBuilder = $Connection->createQueryBuilder();
        $QueryBuilder
            ->select($mediaId)
            ->from($mediaTable, 'media')
            ->innerJoin(
                'media',
                $relationsTable,
                'relations',
                $relationChild . ' = ' . $mediaId
            )
            ->where($mediaDeleted . ' = :deleted')
            ->andWhere($mediaType . ' = :type')
            ->andWhere($mediaActive . ' = :active')
            ->andWhere($QueryBuilder->expr()->in($relationParent, ':folderIds'))
            ->setParameter('deleted', 0)
            ->setParameter('type', 'image')
            ->setParameter('active', 1)
            ->setParameter('folderIds', array_map('intval', $folderIds), ArrayParameterType::INTEGER)
            ->orderBy($mediaOrder, $orderDirection);

        if (!$shuffleImages) {
            $QueryBuilder->setMaxResults($limit);
        }

        try {
            $imageIds = $QueryBuilder->executeQuery()->fetchFirstColumn();
        } catch (DBALException $Exception) {
            QUI\System\Log::writeException($Exception);

            return [];
        }

        if ($shuffleImages && $limit) {
            shuffle($imageIds);
            $imageIds = array_slice($imageIds, 0, $limit);
        }

        $result = [];

        foreach ($imageIds as $imageId) {
            try {
                $Media = $this->Project->getMedia();
                $result[] = $Media->get((int)$imageId);
            } catch (QUI\Exception $Exception) {
                QUI\System\Log::addDebug($Exception->getMessage());
            }
        }

        return $result;
    }
}
