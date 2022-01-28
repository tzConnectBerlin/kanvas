import {
    IsString,
    IsInt,
    IsNumber,
    IsOptional,
    IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { parseStringArray, parseNumberParam } from 'src/utils'

export class UserPaginationParams {
    pageOffset = 0;
    pageSize = 10;

    orderBy = 'id';
    orderDirection: 'asc' | 'desc' = 'asc';
}

export class UserFilters {
    @IsArray()
    @Transform(({ value }) => parseStringArray(value)?.map((v: string) => parseNumberParam(v)))
    @IsOptional()
    userIds?: number[];

    @IsArray()
    @Transform(({value}) => parseStringArray(value))
    @IsOptional()
    userName?: string[];

    @IsArray()
    @Transform(({value}) => parseStringArray(value))
    @IsOptional()
    address?: string[];

    @IsArray()
    @Transform(({ value }) => parseStringArray(value)?.map((v: string) => parseNumberParam(v)))
    @IsOptional()
    roleIds?: number[];
}

export class UserFilterParams extends UserPaginationParams {
    filters: UserFilters = <UserFilters>{};
}