export class Patient {
    constructor(
        public lastName: string,
        public firstName: string,
        public sex: string,
        public status?: string,
        public dni?: string,
        public createdAt?: Date,
        public _id?: string,
        public fechaNac?: Date,
        public nombreAutopercibido?: string,
        public obraSocial?: {
            _id?: string;
            nombre?: string;
            codigoPuco?: string;
            numeroAfiliado?: string;
        },
        public idMPI?: string,
    ) { }
}
