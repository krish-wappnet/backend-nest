import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { ProductsService } from './products.service';
import { ProductCategory } from './product.entity';

type AuthUser = {
  userId: string;
  role: UserRole;
};

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtGuard, RolesGuard, VendorApprovedGuard)
  @Roles(UserRole.USER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create product (vendor only)' })
  @ApiBody({
    type: CreateProductDto,
    description:
      'Create a new clothing product with attributes that will be used to generate variants (for example size and color).',
    examples: {
      TShirt: {
        summary: 'Basic t‑shirt with size and color',
        value: {
          name: 'Slim Fit Cotton T‑Shirt',
          description:
            '100% cotton slim fit t‑shirt available in black, white and navy.',
          category: ProductCategory.MENS,
          brand: 'H&M',
          basePrice: 1299,
          attributes: {
            color: ['black', 'white', 'navy'],
            size: ['S', 'M', 'L', 'XL'],
          },
          defaultStock: 150,
          warehouseLocation: 'RACK-A3-SHELF-02',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Created product with variants/inventory' })
  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: { user: AuthUser }) {
    return this.productsService.createProduct({ userId: req.user.userId, dto });
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
}
