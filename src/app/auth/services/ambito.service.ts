import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: "root",
})
export class AmbitoService {
  private readonly STORAGE_KEY = 'ambito_seleccionado';
  private ambitoSeleccionado: "publico" | "privado" | null = null;
  private ambitoSeleccionado$: BehaviorSubject<"publico" | "privado" | null>;

  constructor() {
    // Cargar el ámbito desde localStorage al inicializar el servicio
    this.loadAmbitoFromStorage();
    this.ambitoSeleccionado$ = new BehaviorSubject<"publico" | "privado" | null>(this.ambitoSeleccionado);
  }

  private loadAmbitoFromStorage(): void {
    try {
      const storedAmbito = localStorage.getItem(this.STORAGE_KEY);
      if (storedAmbito && (storedAmbito === 'publico' || storedAmbito === 'privado')) {
        this.ambitoSeleccionado = storedAmbito as "publico" | "privado";
      }
    } catch (error) {
      console.warn('Error al cargar ámbito desde localStorage:', error);
    }
  }

  private saveAmbitoToStorage(ambito: "publico" | "privado" | null): void {
    try {
      if (ambito) {
        localStorage.setItem(this.STORAGE_KEY, ambito);
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Error al guardar ámbito en localStorage:', error);
    }
  }

  get getAmbitoSeleccionado(): Observable<"publico" | "privado" | null> {
    return this.ambitoSeleccionado$.asObservable();
  }

  setAmbito(ambito: "publico" | "privado"): void {
    this.ambitoSeleccionado = ambito;
    this.saveAmbitoToStorage(ambito);
    this.ambitoSeleccionado$.next(ambito);
  }

  getAmbito(): "publico" | "privado" | null {
    return this.ambitoSeleccionado;
  }

  clearAmbito(): void {
    this.ambitoSeleccionado = null;
    this.saveAmbitoToStorage(null);
    this.ambitoSeleccionado$.next(null);
  }
}