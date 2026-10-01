import moment from 'moment';

export interface RegisterProfessionalPayload {
    username: string;
    roleType: 'professional';
    cuil: string;
    enrollment: string;
    profesion: { profesion: string; codigoProfesion: string };
    fechaEgreso: string;
    fechaMatVencimiento: string;
    email: string;
    password: string;
    captcha: string;
}

export interface RegisterProfessionalInput {
    dni: string;
    cuil: string;
    enrollment: string;
    profesion: { profesion: string; codigoProfesion: string | number } | null;
    fechaEgreso: string;
    fechaMatVencimiento: string;
    email: string;
    password: string;
    captcha: string;
}

export function toRegisterProfessionalPayload(input: RegisterProfessionalInput): RegisterProfessionalPayload {
    return {
        username: input.dni,
        roleType: 'professional',
        cuil: input.cuil.replace(/\D/g, ''),
        enrollment: input.enrollment,
        profesion: input.profesion
            ? { profesion: input.profesion.profesion, codigoProfesion: String(input.profesion.codigoProfesion) }
            : { profesion: '', codigoProfesion: '' },
        fechaEgreso: moment(input.fechaEgreso).format('DD-MM-YYYY'),
        fechaMatVencimiento: moment(input.fechaMatVencimiento).format('DD-MM-YYYY'),
        email: input.email,
        password: input.password,
        captcha: input.captcha,
    };
}

export interface RegisterPharmacistPayload {
    username: string;
    roleType: 'pharmacist';
    cuil: string;
    disposicionHabilitacion: string;
    enrollment: string;
    vencimientoHabilitacion: string;
    email: string;
    password: string;
    businessName: string;
    captcha: string;
}

export interface RegisterPharmacistInput {
    cuil: string;
    disposicionHabilitacion: string;
    enrollment: string;
    vencimientoHabilitacion: string;
    email: string;
    password: string;
    captcha: string;
}

export function toRegisterPharmacistPayload(input: RegisterPharmacistInput): RegisterPharmacistPayload {
    const cuil = input.cuil.replace(/\D/g, '');
    return {
        username: cuil,
        roleType: 'pharmacist',
        cuil,
        disposicionHabilitacion: input.disposicionHabilitacion,
        enrollment: input.enrollment,
        vencimientoHabilitacion: moment(input.vencimientoHabilitacion).format('YYYY-MM-DD'),
        email: input.email,
        password: input.password,
        businessName: '',
        captcha: input.captcha,
    };
}
