<?php

declare(strict_types=1);

namespace QUITests\Gallery\Controls;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use Doctrine\DBAL\Schema\Schema;
use PHPUnit\Framework\TestCase;
use QUI;
use QUI\Gallery\Controls\ImageSlider;
use QUI\Interfaces\Projects\Media\File;
use QUI\Projects\Media;
use QUI\Projects\Project;
use ReflectionProperty;

class ImageSliderDatabaseTest extends TestCase
{
    private const PROJECT_NAME = 'gallery_phpunit';

    private Connection $originalConnection;

    protected function setUp(): void
    {
        parent::setUp();

        $this->originalConnection = QUI::getDataBaseConnection();
        $Connection = DriverManager::getConnection([
            'driver' => 'pdo_sqlite',
            'memory' => true
        ]);
        $Schema = new Schema();
        $MediaTable = $Schema->createTable(QUI::getDBTableName(self::PROJECT_NAME . '_media'));
        $MediaTable->addColumn('id', 'integer');
        $MediaTable->addColumn('deleted', 'integer');
        $MediaTable->addColumn('type', 'string');
        $MediaTable->addColumn('active', 'integer');
        $MediaTable->addColumn('title', 'string');
        $MediaTable->addColumn('name', 'string');
        $MediaTable->addColumn('c_date', 'string');
        $MediaTable->addColumn('e_date', 'string');
        $MediaTable->addColumn('priority', 'integer');
        $MediaTable->setPrimaryKey(['id']);

        $RelationsTable = $Schema->createTable(QUI::getDBTableName(self::PROJECT_NAME . '_media_relations'));
        $RelationsTable->addColumn('parent', 'integer');
        $RelationsTable->addColumn('child', 'integer');

        foreach ($Schema->toSql($Connection->getDatabasePlatform()) as $statement) {
            $Connection->executeStatement($statement);
        }

        $this->insertMedia($Connection, 1, 0, 'image', 1, 'Beta', 'b.jpg', '2024-01-01', 2);
        $this->insertMedia($Connection, 2, 0, 'image', 1, 'Alpha', 'a.jpg', '2024-02-01', 1);
        $this->insertMedia($Connection, 3, 1, 'image', 1, 'Deleted', 'c.jpg', '2024-03-01', 3);
        $this->insertMedia($Connection, 4, 0, 'file', 1, 'File', 'd.pdf', '2024-04-01', 4);
        $this->insertMedia($Connection, 5, 0, 'image', 0, 'Inactive', 'e.jpg', '2024-05-01', 5);
        $this->insertMedia($Connection, 6, 0, 'image', 1, 'Other folder', 'f.jpg', '2024-06-01', 6);

        foreach ([[10, 1], [20, 2], [10, 3], [10, 4], [10, 5], [30, 6]] as [$parent, $child]) {
            $Connection->insert(QUI::getDBTableName(self::PROJECT_NAME . '_media_relations'), [
                'parent' => $parent,
                'child' => $child
            ]);
        }

        $this->setConnection($Connection);
    }

    protected function tearDown(): void
    {
        $this->setConnection($this->originalConnection);

        parent::tearDown();
    }

    public function testLoadsImagesFromSelectedFoldersUsingOrderAndLimit(): void
    {
        $Image1 = $this->createMock(File::class);
        $Image2 = $this->createMock(File::class);
        $Slider = $this->createSlider([1 => $Image1, 2 => $Image2]);

        self::assertSame([$Image2], $Slider->getImages([10, 20], 'name ASC', 1));
        self::assertSame([$Image1], $Slider->getImages([10], 'name ASC', 10));
        self::assertSame([], $Slider->getImages([40], 'name ASC', 10));
        self::assertSame([], $Slider->getImages([], 'name ASC', 10));
    }

    public function testInvalidOrderFallsBackToCreationDateDescending(): void
    {
        $Image1 = $this->createMock(File::class);
        $Image2 = $this->createMock(File::class);
        $Slider = $this->createSlider([1 => $Image1, 2 => $Image2]);

        self::assertSame(
            [$Image2, $Image1],
            $Slider->getImages([10, 20], 'name ASC; DROP TABLE media', 10)
        );
    }

    /**
     * @param array<int, File> $images
     * @return ImageSlider&object{getImages: callable(array<int, int|string>, string, int, bool=): array<int, mixed>}
     */
    private function createSlider(array $images): ImageSlider
    {
        $Media = $this->createMock(Media::class);
        $Media->method('get')->willReturnCallback(
            static fn(int $id): File => $images[$id]
        );

        $Project = $this->createMock(Project::class);
        $Project->method('getAttribute')->with('name')->willReturn(self::PROJECT_NAME);
        $Project->method('getMedia')->willReturn($Media);

        $Slider = new class () extends ImageSlider {
            /**
             * @param array<int, int|string> $folderIds
             * @return array<int, mixed>
             */
            public function getImages(
                array $folderIds,
                string $order,
                int $limit,
                bool $shuffleImages = false
            ): array {
                return $this->getImagesByFolderIds($folderIds, $order, $limit, $shuffleImages);
            }
        };

        $ProjectProperty = new ReflectionProperty(ImageSlider::class, 'Project');
        $ProjectProperty->setValue($Slider, $Project);

        return $Slider;
    }

    private function insertMedia(
        Connection $Connection,
        int $id,
        int $deleted,
        string $type,
        int $active,
        string $title,
        string $name,
        string $creationDate,
        int $priority
    ): void {
        $Connection->insert(QUI::getDBTableName(self::PROJECT_NAME . '_media'), [
            'id' => $id,
            'deleted' => $deleted,
            'type' => $type,
            'active' => $active,
            'title' => $title,
            'name' => $name,
            'c_date' => $creationDate,
            'e_date' => $creationDate,
            'priority' => $priority
        ]);
    }

    private function setConnection(Connection $Connection): void
    {
        $QueryBuilder = new ReflectionProperty(QUI::class, 'QueryBuilder');
        $QueryBuilder->setValue(null, $Connection);
    }
}
