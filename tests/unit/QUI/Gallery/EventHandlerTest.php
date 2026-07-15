<?php

declare(strict_types=1);

namespace QUITests\Gallery;

use PHPUnit\Framework\TestCase;
use QUI\Gallery\EventHandler;
use QUI\Template;

class EventHandlerTest extends TestCase
{
    public function testAddsGalleryZoomScriptToTemplateHeader(): void
    {
        $Template = $this->createMock(Template::class);
        $Template->expects(self::once())
            ->method('extendHeaderWithJavaScriptFile')
            ->with(URL_OPT_DIR . 'quiqqer/gallery/bin/zoom.js');

        EventHandler::onTemplateGetHeader($Template);
    }
}
