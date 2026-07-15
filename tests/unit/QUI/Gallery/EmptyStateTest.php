<?php

declare(strict_types=1);

namespace QUITests\Gallery;

use PHPUnit\Framework\TestCase;
use QUI\Exception;
use QUI\Gallery\Bricks\Grid as GridBrick;
use QUI\Gallery\Bricks\GridAdvanced as GridAdvancedBrick;
use QUI\Gallery\Controls\Component;
use QUI\Gallery\Controls\ImageSlider;
use QUI\Gallery\Controls\Logo\InfiniteCarousel;
use QUI\Gallery\Controls\Logo\Slider as LogoSlider;
use QUI\Projects\Media;
use QUI\Projects\Project;

class EmptyStateTest extends TestCase
{
    public function testBricksReturnEmptyBodyWithoutMediaFolder(): void
    {
        self::assertSame('', (new GridBrick())->getBody());
        self::assertSame('', (new GridAdvancedBrick())->getBody());
    }

    public function testComponentReturnsEmptyBodyForMissingFolder(): void
    {
        $Media = $this->createMock(Media::class);
        $Media->method('get')->willThrowException(new Exception('Missing test folder'));
        $Project = $this->createMock(Project::class);
        $Project->method('getMedia')->willReturn($Media);

        self::assertSame('', (new Component([
            'Project' => $Project,
            'folderId' => 999999
        ]))->getBody());
    }

    public function testImageSliderReturnsEmptyBodyWithoutMediaFolder(): void
    {
        $Project = $this->createMock(Project::class);

        self::assertSame('', (new ImageSlider(['Project' => $Project]))->getBody());
    }

    public function testLogoSlidersReturnEmptyBodyWithoutMediaFolder(): void
    {
        $Media = $this->createMock(Media::class);
        $Project = $this->createMock(Project::class);
        $Project->method('getMedia')->willReturn($Media);
        $Project->method('getName')->willReturn('gallery-phpunit');
        $Project->method('getLang')->willReturn('en');

        self::assertSame('', (new LogoSlider(['Project' => $Project]))->getBody());
        self::assertSame('', (new InfiniteCarousel(['Project' => $Project]))->getBody());
    }
}
