import { IsNumber, IsString } from "class-validator";

enum AuthProviderEnum {
    KUKAI='kukai',
    BEACON='beacon'
}

export class AuthProviderDto {
    @IsNumber()
    id: number;

    @IsString()
    name: AuthProviderEnum;
}
