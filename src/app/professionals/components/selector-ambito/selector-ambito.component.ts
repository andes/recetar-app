import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AmbitoService } from "@auth/services/ambito.service";


@Component({
    selector: 'app-selector-ambito',
    templateUrl: './selector-ambito.component.html',
    styleUrls: ['./selector-ambito.component.sass']
})
export class SelectorAmbitoComponent implements OnInit {
    ambito: 'publico' | 'privado';

    constructor(
        private ambitoService: AmbitoService,
        private router: Router,
    ) { }
    
    ngOnInit(): void {
        this.ambitoService.clearAmbito();
    }

    seleccionarAmbito(ambito: 'publico' | 'privado') {
        this.ambito = ambito;
        console.log('Ambito seleccionado:', this.ambito);
        this.ambitoService.setAmbito(ambito);
        this.router.navigate(['/profesionales/recetas/nueva']);
    }
}