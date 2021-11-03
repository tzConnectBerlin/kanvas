import { IsNumber, IsString } from "class-validator";

export class UserDto {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsString()
    address: string;

    @IsString()
    signedPayload: string;
}
