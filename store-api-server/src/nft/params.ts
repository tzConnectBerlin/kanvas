import { IsString, IsInt, IsNumber, IsOptional, IsArray } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class PaginationParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page: number = 1

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize: number = 10

  @IsString()
  @IsOptional()
  order: string = 'asc'

  @IsString()
  @IsOptional()
  orderBy: string = 'id'

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  firstRequestAt?: number
}

export class FilterParams extends PaginationParams {
  @IsArray()
  @Transform(({ value }) =>
    value
      ? parseStringArray(value, ',').map((v: string) => Number(v))
      : undefined,
  )
  @IsOptional()
  categories?: number[]

  @IsString()
  @IsOptional()
  address?: string

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priceAtLeast?: number

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priceAtMost?: number
}

function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v
  }
  return v.split(sep)
}
