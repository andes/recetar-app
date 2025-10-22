export interface Pais {
    _id: string;
    nombre: string;
    id: string;
}

export interface Provincia {
    _id: string;
    nombre: string;
    id: string;
}

export interface Localidad {
    _id: string;
    nombre: string;
    id: string;
}

export interface Ubicacion {
    _id: string;
    pais: Pais;
    provincia: Provincia;
    localidad: Localidad;
    id: string;
}

export interface Direccion {
    geoReferencia: number[];
    activo: boolean;
    _id: string;
    ultimaActualizacion: string;
    ubicacion: Ubicacion;
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

export interface Codigo {
    _id: string;
    remediar: string;
    cuie: string;
    sisa: string;
    id: string;
}

export interface TipoEstablecimiento {
    _id: string;
    nombre: string;
    id: string;
}

export interface Organizacion {
    activo: boolean;
    turnosMobile: boolean;
    _id: string;
    nombre: string;
    contacto: any[];
    direccion: Direccion;
    telecom: Telecom[];
    codigo: Codigo;
    tipoEstablecimiento: TipoEstablecimiento;
    nivelComplejidad: number;
    edificio: any[];
    mapaSectores: any[];
    unidadesOrganizativas: any[];
    ofertaPrestacional: any[];
    trasladosEspeciales: any[];
    id: string;
}
