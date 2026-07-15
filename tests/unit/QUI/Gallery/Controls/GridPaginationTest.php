<?php

declare(strict_types=1);

namespace QUITests\Gallery\Controls;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use QUI\Gallery\Controls\Grid;
use QUI\Gallery\Controls\GridAdvanced;
use QUI\Interfaces\Projects\Site;
use QUI\Projects\Media;
use QUI\Projects\Media\Folder;
use QUI\Projects\Project;

class GridPaginationTest extends TestCase
{
    /**
     * @return iterable<string, array{class-string<Grid|GridAdvanced>}>
     */
    public static function gridClasses(): iterable
    {
        yield 'grid' => [Grid::class];
        yield 'advanced grid' => [GridAdvanced::class];
    }

    /**
     * @param class-string<Grid|GridAdvanced> $gridClass
     */
    #[DataProvider('gridClasses')]
    public function testPaginationHandlesZeroPageSize(string $gridClass): void
    {
        $Folder = $this->createMock(Folder::class);
        $Folder->method('getImages')->willReturnCallback(
            static fn(array $options): array|int => isset($options['count']) ? 0 : []
        );

        $Media = $this->createMock(Media::class);
        $Media->method('get')->willReturn($Folder);

        $Project = $this->createMock(Project::class);
        $Project->method('getMedia')->willReturn($Media);

        $Site = $this->createMock(Site::class);
        $Grid = new $gridClass([
            'Project' => $Project,
            'Site' => $Site,
            'folderId' => 1,
            'max' => 0,
            'usePagination' => true
        ]);

        self::assertIsString($Grid->getBody());
    }
}
