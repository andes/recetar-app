import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: "root",
})
export class AmbitoService {
  private ambitoSeleccionado: "publico" | "privado" | null = null;
  private ambitoSeleccionado$: BehaviorSubject<"publico" | "privado" | null>;

  constructor() {
    this.ambitoSeleccionado$ = new BehaviorSubject<"publico" | "privado" | null>(this.ambitoSeleccionado);
  }

  get getAmbitoSeleccionado(): Observable<"publico" | "privado" | null> {
    return this.ambitoSeleccionado$.asObservable();
  }

  setAmbito(ambito: "publico" | "privado"): void {
    this.ambitoSeleccionado = ambito;
    this.ambitoSeleccionado$.next(ambito);
  }

  getAmbito(): "publico" | "privado" | null {
    return this.ambitoSeleccionado;
  }

  clearAmbito(): void {
    this.ambitoSeleccionado = null;
    this.ambitoSeleccionado$.next(null);
  }
}