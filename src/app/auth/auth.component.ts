import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.sass'],
    standalone: true,
    imports: [RouterModule]
})
export class AuthComponent implements OnInit {

    constructor() { }

    ngOnInit(): void {
    }

}
