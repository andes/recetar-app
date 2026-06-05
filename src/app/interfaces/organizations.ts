export interface Country {
    _id: string;
    nombre: string;
    id: string;
}

export interface Province {
    _id: string;
    nombre: string;
    id: string;
}

export interface Locality {
    _id: string;
    nombre: string;
    id: string;
}

export interface Location {
    _id: string;
    pais: Country;
    provincia: Province;
    localidad: Locality;
    id: string;
}

export interface Address {
    geoReferencia: number[];
    activo: boolean;
    _id: string;
    ultimaActualizacion: string;
    ubicacion: Location;
    ranking: number;
    codigoPostal: string;
    valor: string;
    id: string;
}

export interface Telecom {
    _id: string;
    activo: boolean;
    ultimaActualizacion: string;
    ranking: number;
    valor: string;
    tipo: string;
}

export interface Code {
    _id: string;
    remediar: string;
    cuie: string;
    sisa: string;
    id: string;
}

export interface EstablishmentType {
    _id: string;
    nombre: string;
    id: string;
}

export interface Organization {
    activo: boolean;
    turnosMobile: boolean;
    _id: string;
    nombre: string;
    contacto: unknown[];
    direccion: Address;
    telecom: Telecom[];
    codigo: Code;
    tipoEstablecimiento: EstablishmentType;
    nivelComplejidad: number;
    edificio: unknown[];
    mapaSectores: unknown[];
    unidadesOrganizativas: unknown[];
    ofertaPrestacional: unknown[];
    trasladosEspeciales: unknown[];
    id: string;
}

export interface SubOrganization {
    _id?: string;
    nombre: string;
    direccion: string;
    provincia?: string;
}
