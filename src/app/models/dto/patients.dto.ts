export interface PatientPayload {
    dni: string;
    firstName: string;
    lastName: string;
    sex: string;
    fechaNac?: string;
    nombreAutopercibido?: string;
    genero?: string;
    cuil?: string;
}

export function toPatientPayload(data: {
    dni?: string;
    firstName?: string;
    lastName?: string;
    sex?: string;
    fechaNac?: Date | string | null;
    nombreAutopercibido?: string;
    genero?: string;
    cuil?: string;
}): PatientPayload {
    const payload: PatientPayload = {
        dni: data.dni || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        sex: data.sex || '',
    };
    if (data.fechaNac) {
        payload.fechaNac = data.fechaNac instanceof Date
            ? data.fechaNac.toISOString()
            : String(data.fechaNac);
    }
    if (data.nombreAutopercibido) { payload.nombreAutopercibido = data.nombreAutopercibido; }
    if (data.genero) { payload.genero = data.genero; }
    if (data.cuil) { payload.cuil = data.cuil; }
    return payload;
}
