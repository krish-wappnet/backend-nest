import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './attribute.entity';
import { AttributeValue } from './attribute-value.entity';
import { AttributesRepository } from './attributes.repository';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute, AttributeValue])],
  controllers: [AttributesController],
  providers: [AttributesRepository, AttributesService],
  exports: [AttributesRepository, AttributesService],
})
export class AttributesModule {}
