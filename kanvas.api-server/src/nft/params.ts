import { IsString, IsInt, IsOptional, IsArray } from 'class-validator'
import { Type, Transform } from 'class-transformer'

const defaultPage = 1
const defaultPageSize = 10
const defaultOrder = 'asc'
const defaultOrderBy = 'id'

export class AllNftsParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page: number = defaultPage

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize: number = defaultPageSize

  @IsString()
  @IsOptional()
  order: string = defaultOrder

  @IsString()
  @IsOptional()
  orderBy: string = defaultOrderBy

  @IsInt()
  @IsOptional()
  firstRequestAt: number
}

export class FilterParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page: number = defaultPage

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize: number = defaultPageSize

  @IsString()
  @IsOptional()
  order: string = defaultOrder

  @IsString()
  @IsOptional()
  orderBy: string = defaultOrderBy

  @IsInt()
  @IsOptional()
  firstRequestAt: number

  @IsArray()
  @Transform(({ value }) => (value ? parseStringArray(value, ';') : undefined))
  @IsOptional()
  categories: string[] = []

  @IsString()
  @IsOptional()
  address: string
}

function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v
  }
  return v.split(sep)
}
