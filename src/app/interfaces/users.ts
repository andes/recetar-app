import { Injectable } from '@angular/core';
import { Adapter, asRecord } from './adapter';
import { SubOrganizacion } from './organizaciones';
export class User {
    _id: string;
    enrollment: string;
    responsibleDTEnrollment?: string;
    authorizationDisposition?: string;
    authorizationExpiration?: Date;
    businessName: string;
    email: string;
    cuil: string;
    username?: string;
    roles?: Array<{ _id: string; role: string }>;
    isActive?: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    profesionGrado?: Array<{
        profesion: string;
        codigoProfesion: string;
        numeroMatricula: string;
    }>;
    organizaciones?: SubOrganizacion[];
}

@Injectable({
    providedIn: 'root'
})
export class UserAdapter implements Adapter<User> {
    adapt(item: unknown): User {
        const data = asRecord(item);

        return {
            _id: data['_id'] as string,
            enrollment: data['enrollment'] as string,
            responsibleDTEnrollment: data['responsibleDTEnrollment'] as string,
            authorizationDisposition: data['authorizationDisposition'] as string,
            authorizationExpiration: data['authorizationExpiration'] ? new Date(data['authorizationExpiration'] as string | number | Date) : undefined,
            businessName: data['businessName'] as string,
            email: data['email'] as string,
            cuil: data['cuil'] as string,
            username: data['username'] as string,
            roles: data['roles'] as User['roles'],
            isActive: data['isActive'] as boolean,
            lastLogin: data['lastLogin'] ? new Date(data['lastLogin'] as string | number | Date) : undefined,
            createdAt: data['createdAt'] ? new Date(data['createdAt'] as string | number | Date) : undefined,
            updatedAt: data['updatedAt'] ? new Date(data['updatedAt'] as string | number | Date) : undefined,
            profesionGrado: data['profesionGrado'] as User['profesionGrado'],
            organizaciones: data['organizaciones'] as SubOrganizacion[]
        } as User;
    }
}
