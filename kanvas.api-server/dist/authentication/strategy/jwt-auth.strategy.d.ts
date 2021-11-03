import { ITokenPayload } from 'src/interfaces/token.interface';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: ITokenPayload): Promise<{
        id: number;
        name: string;
        address: string;
    }>;
}
export {};
