import { Injectable } from "@angular/core";
import { Adapter } from "./adapter";

export class Pharmacists {
  // Cambiar campos
  constructor(
    public andes_id: string,
    public first_name: string,
    public sex: string,
    public last_name: string,
    public dni: string,
    public nationality: string,
    public enrollment: string,
    public createdAt: Date
    ) {}
  public _id: number;

  public getEnrollmentAndFullname(): String {
    return `${this.enrollment} ${this.last_name} ${this.first_name}`
  };
}

@Injectable({
  providedIn: "root"
})
export class PharmacistsAdapter implements Adapter<Pharmacists> {
  adapt(item: any): Pharmacists {
    // Cambiar campos
    return new Pharmacists(
      item.id, 
      item.nombre, 
      item.sexo, 
      item.apellido,
      item.documento,
      item.nacionalidad,
      item.profesiones[0].matriculacion[0].matriculaNumero,
      new Date(item.created)
    );
  }
}