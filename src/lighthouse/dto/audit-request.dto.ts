import { IsUrl, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditRequestDto {
  @ApiProperty({
    description: 'The URL to audit with Lighthouse',
    example: 'https://example.com',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    description: 'Lighthouse categories to audit (performance, accessibility, best-practices, seo, pwa)',
    example: ['performance', 'accessibility'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class BatchAuditDto {
  @ApiProperty({
    description: 'Array of URLs to audit in parallel',
    example: ['https://example.com', 'https://google.com', 'https://github.com'],
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];

  @ApiPropertyOptional({
    description: 'Lighthouse categories to audit for all URLs (performance, accessibility, best-practices, seo, pwa)',
    example: ['performance', 'accessibility'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}