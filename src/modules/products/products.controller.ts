import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../guards/roles.decorator';
import { UserRole } from '../users/user.entity';
import { VendorApprovedGuard } from '../../guards/vendor-approved.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { SearchVariantsQueryDto } from './dto/search-variants-query.dto';
import { ProductsService } from './products.service';
import { ProductCategory } from './product.entity';
import { PaginationQueryDto } from 'src/common/pagination/pagination-query.dto';

type AuthUser = {
  userId: string;
  role: UserRole;
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get lowest price product (USER)' })
  @ApiOkResponse({ description: 'Lowest priced active product' })
  @Get('lowest-price')
  getLowestPriceProduct(@Query() query: PaginationQueryDto) {
    return this.productsService.getLowestPriceProducts({
      page: query.page || 1,
      limit: query.limit || 1,
    });
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Search product variants (USER)' })
  @ApiOkResponse({ description: 'Matching product variants (paginated)' })
  @Get('variants/search')
  searchVariants(@Query() query: SearchVariantsQueryDto) {
    return this.productsService.searchVariants({
      q: query.q,
      page: query.page,
      limit: query.limit,
    });
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get liked products (USER)' })
  @ApiOkResponse({ description: 'Liked products' })
  @Get('liked')
  getLikedProducts(@Req() req: { user: AuthUser }) {
    return this.productsService.getLikedProducts(req.user.userId);
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create product (vendor only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: Object.values(ProductCategory) },
        brand: { type: 'string' },
        basePrice: { type: 'number' },
        status: { type: 'integer', enum: [1, 2, 3] },
        attributes: {
          type: 'string',
          description:
            'JSON string of attributes map (same shape as JSON request body).',
          example: JSON.stringify({
            color: ['black', 'white', 'navy'],
            size: ['S', 'M', 'L', 'XL'],
          }),
        },
        defaultStock: { type: 'integer' },
        warehouseLocation: { type: 'string' },
        variantImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['name', 'basePrice', 'attributes'],
    },
  })
  @ApiOkResponse({ description: 'Created product with variants/inventory' })
  @Post()
  @UseInterceptors(FilesInterceptor('variantImages'))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    variantImages:
      | Array<{
          originalname: string;
          mimetype: string;
          buffer: Buffer;
          size: number;
        }>
      | undefined,
    @Req() req: { user: AuthUser },
  ) {
    return this.productsService.createProduct({
      userId: req.user.userId,
      dto,
      variantImages,
    });
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get vendor products (vendor only)' })
  @ApiOkResponse({ description: 'List of products for logged in vendor' })
  @Get()
  list(@Req() req: { user: AuthUser }) {
    return this.productsService.listVendorProducts(req.user.userId);
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get single product (vendor only)' })
  @ApiOkResponse({ description: 'Product with variants/inventory/attributes' })
  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.productsService.getVendorProductById({
      userId: req.user.userId,
      productId: id,
    });
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product (vendor only)' })
  @ApiBody({
    type: UpdateProductDto,
    description: 'Partial update of clothing product fields.',
    examples: {
      UpdatePriceAndName: {
        summary: 'Update name and price of an existing t‑shirt',
        value: {
          name: 'Slim Fit Cotton T‑Shirt (New Season)',
          description:
            'Updated description with new seasonal colors and improved fabric.',
          basePrice: 1399,
        },
      },
    },
  })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: { user: AuthUser },
  ) {
    await this.productsService.updateVendorProduct({
      userId: req.user.userId,
      productId: id,
      dto,
    });
    return { message: 'Updated' };
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product status (vendor only)' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @Req() req: { user: AuthUser },
  ) {
    await this.productsService.updateVendorProductStatus({
      userId: req.user.userId,
      productId: id,
      status: dto.status,
    });
    return { message: 'Status updated' };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Like product' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Patch(':productId/like')
  async likeProduct(
    @Param('productId') productId: string,
    @Req() req: { user: AuthUser },
  ) {
    await this.productsService.likeProduct({
      userId: req.user.userId,
      productId,
    });
    return { message: 'Liked' };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Unlike product' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Delete(':productId/unlike')
  async unlikeProduct(
    @Param('productId') productId: string,
    @Req() req: { user: AuthUser },
  ) {
    await this.productsService.unlikeProduct({
      userId: req.user.userId,
      productId,
    });
    return { message: 'Unliked' };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle product featured status' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Patch(':productId/featured')
  async setFeatured(@Param('productId') productId: string) {
    await this.productsService.setFeatured(productId, true);
    return { message: 'Featured status updated' };
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete product (vendor only)' })
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    await this.productsService.deleteVendorProduct({
      userId: req.user.userId,
      productId: id,
    });
    return { message: 'Deleted' };
  }

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload product variant image (vendor only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    schema: { properties: { imageUrl: { type: 'string' } } },
  })
  @Post(':productId/variants/:variantId/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadVariantImage(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @UploadedFile()
    file:
      | { originalname: string; mimetype: string; buffer: Buffer; size: number }
      | undefined,
    @Req() req: { user: AuthUser },
  ) {
    return this.productsService.uploadVariantImage({
      userId: req.user.userId,
      productId,
      variantId,
      file,
    });
  }
}
