import { Injectable } from "@angular/core";
import * as JsBarcode from 'jsbarcode';


@Injectable({
  providedIn: "root"
})

export class BarcodeService {
  constructor() {}

  /**
   * Genera un código de barras CODE128 y lo muestra en un elemento HTML
   * @param element El elemento HTML donde se mostrará el código de barras
   * @param value El valor a codificar
   */
  generateBarcode(element: HTMLCanvasElement | HTMLImageElement | SVGElement, value: string): void {
    JsBarcode(element, value, {
      format: "CODE128",
      lineColor: "#000",
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 16
    });
  }

  /**
   * Genera un código de barras CODE128 y lo devuelve como imagen base64
   * @param value El valor a codificar
   * @returns Promise con la imagen en base64
   */
  generateBarcodeBase64(value: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Crear un canvas en memoria
      const canvas = document.createElement('canvas');
      
      try {
        JsBarcode(canvas, value, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 80,
          displayValue: true,
        });

        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    });
  }
}