// TODO let's be simple - there is no need to bring classes into this, when it could just be a simple Object
export class UserEntity {
    id: number;
    name: string;
    address: string;
    signedPayload: string;
    roles: string[];
}
