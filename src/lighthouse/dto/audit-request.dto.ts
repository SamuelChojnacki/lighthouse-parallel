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

  @ApiPropertyOptional({
    description: 'Locale for the Lighthouse report (e.g., en, fr, es, de, ja, etc.)',
    example: 'fr',
  })
  @IsOptional()
  @IsString()
  locale?: string;
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

  @ApiPropertyOptional({
    description: 'Webhook URL to receive results when each job completes',
    example: 'http://localhost:1337/api/webhooks/lighthouse-results',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;

  @ApiPropertyOptional({
    description: 'Bearer token for webhook authentication',
    example: 'dev-webhook-token-change-in-production',
  })
  @IsOptional()
  @IsString()
  webhookToken?: string;

  @ApiPropertyOptional({
    description: 'Locale for the Lighthouse report (e.g., en, fr, es, de, ja, etc.)',
    example: 'fr',
  })
  @IsOptional()
  @IsString()
  locale?: string;
}