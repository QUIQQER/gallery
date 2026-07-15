<?php

declare(strict_types=1);

namespace QUITests\Gallery;

use PHPUnit\Framework\TestCase;
use QUI\Gallery\Bricks\Grid as GridBrick;
use QUI\Gallery\Controls\Component;
use QUI\Gallery\Controls\Grid;
use QUI\Gallery\Controls\GridAdvanced;
use QUI\Gallery\Controls\ImageSlider;
use QUI\Gallery\Controls\Logo\InfiniteCarousel;
use QUI\Gallery\Controls\Logo\Slider as LogoSlider;
use QUI\Gallery\Controls\Slider;
use QUI\Interfaces\Projects\Site;
use QUI\Projects\Media\Image;
use ReflectionMethod;

class ControlContractsTest extends TestCase
{
    public function testControlsUseProvidedSite(): void
    {
        $Site = $this->createMock(Site::class);
        $Controls = [
            new GridBrick(['Site' => $Site]),
            new Component(['Site' => $Site]),
            new Grid(['Site' => $Site]),
            new GridAdvanced(['Site' => $Site]),
            new Slider(['Site' => $Site])
        ];

        foreach ($Controls as $Control) {
            $getSite = new ReflectionMethod($Control, 'getSite');

            self::assertSame($Site, $getSite->invoke($Control));
        }
    }

    public function testSliderStoresExplicitImages(): void
    {
        $Image = $this->createMock(Image::class);
        $Slider = new class () extends Slider {
            /** @return array<int, Image> */
            public function getOwnImages(): array
            {
                return $this->ownImages;
            }
        };

        $Slider->addImage($Image);

        self::assertSame([$Image], $Slider->getOwnImages());
    }

    public function testSliderControlsExposeTheirTemplates(): void
    {
        $Controls = [
            new class () extends ImageSlider {
                public function getPublicTemplate(): string
                {
                    return $this->getTemplate();
                }
            },
            new class () extends LogoSlider {
                public function getPublicTemplate(): string
                {
                    return $this->getTemplate();
                }
            },
            new class () extends InfiniteCarousel {
                public function getPublicTemplate(): string
                {
                    return $this->getTemplate();
                }
            }
        ];

        self::assertStringEndsWith('/ImageSlider.html', $Controls[0]->getPublicTemplate());
        self::assertStringEndsWith('/Slider.html', $Controls[1]->getPublicTemplate());
        self::assertStringEndsWith('/InfiniteCarousel.html', $Controls[2]->getPublicTemplate());
    }
}
