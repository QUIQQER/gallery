<?php

/**
 * This file contains QUI\Gallery\Controls\Component
 */

namespace QUI\Gallery\Controls;

use QUI;
use QUI\Exception;
use QUI\Projects\Media\Folder;
use QUI\Projects\Media\Utils;

use function dirname;

/**
 * Class Component
 *
 * @package quiqqer/gallery
 */
class Component extends QUI\Control
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
            'Project' => false,
            'folderId' => false,
            'qui-class' => 'package/quiqqer/gallery/bin/controls/Component',
            'order' => 'title ASC'
        ]);

        parent::__construct($attributes);

        // css files
        $this->addCSSFile(dirname(__FILE__) . '/Component.css');
    }

    /**
     * (non-PHPdoc)
     *
     * @see \QUI\Control::create()
     */
    public function getBody(): string
    {
        $Engine = QUI::getTemplateManager()->getEngine();
        $Project = $this->getProject();
        $Media = $Project->getMedia();
        $Folder = null;

        try {
            $folderId = $this->getAttribute('folderId');

            if (Utils::isMediaUrl($folderId)) {
                $Folder = Utils::getMediaItemByUrl($folderId);
            } else {
                $Folder = $Media->get($this->getAttribute('folderId'));
            }

            if (!Utils::isFolder($Folder)) {
                return '';
            }
        } catch (QUI\Exception) {
        }

        if (!$Folder) {
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

        if (method_exists($Folder, 'getImages')) {
            $images = $Folder->getImages([
                'order' => $order
            ]);
        }

        $Engine->assign([
            'Rewrite' => QUI::getRewrite(),
            'this' => $this,
            'Folder' => $Folder,
            'Site' => $this->getSite(),
            'images' => $images
        ]);

        // css files
        $dir = dirname(__FILE__);

        switch ($this->getAttribute('effect')) {
            case 'forwardPulse':
                $this->addCSSFile($dir . '/Component.fx.forwardPulse.css');
                $this->setAttribute('data-effect', 'forwardPulse');
                break;

            case 'coverflow':
                $this->addCSSFile($dir . '/Component.fx.coverflow.css');
                $this->setAttribute('data-effect', 'coverflow');
                break;

            case 'photoBrowse':
                $this->addCSSFile($dir . '/Component.fx.photoBrowse.css');
                $this->setAttribute('data-effect', 'photoBrowse');
                break;

            case 'ferrisWheel':
                $this->addCSSFile($dir . '/Component.fx.ferrisWheel.css');
                $this->setAttribute('data-effect', 'ferrisWheel');
                break;

            case 'snake':
                $this->addCSSFile($dir . '/Component.fx.snake.css');
                $this->setAttribute('data-effect', 'snake');
                break;

            case 'slideBehind':
                $this->addCSSFile($dir . '/Component.fx.slideBehind.css');
                $this->setAttribute('data-effect', 'slideBehind');
                break;
        }

        return $Engine->fetch(dirname(__FILE__) . '/Component.html');
    }

    /**
     * @return QUI\Interfaces\Projects\Site
     * @throws Exception
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
