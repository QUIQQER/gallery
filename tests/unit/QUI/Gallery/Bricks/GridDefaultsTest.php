<?php

declare(strict_types=1);

namespace QUITests\Gallery\Bricks;

use PHPUnit\Framework\TestCase;
use QUI\Gallery\Bricks\Grid;
use QUI\Gallery\Bricks\GridAdvanced;

class GridDefaultsTest extends TestCase
{
    public function testGridUsesThreeEntriesPerLineByDefault(): void
    {
        self::assertSame(3, (new Grid())->getAttribute('entriesPerLine'));
    }

    public function testAdvancedGridUsesThreeEntriesPerLineByDefault(): void
    {
        self::assertSame(3, (new GridAdvanced())->getAttribute('entriesPerLine'));
    }
}
