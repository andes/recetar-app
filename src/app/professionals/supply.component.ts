import { Component, OnInit } from '@angular/core';
import { step, stepLink} from '@animations/animations.template';
import { Observable, BehaviorSubject } from 'rxjs';
import { FormGroup, FormGroupDirective, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { SuppliesService } from '@services/supplies.service';
import { MatDialog } from '@angular/material/dialog';
import { SupplyDialogComponent } from './components/supply-dialog/supply-dialog.component';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-productos',
    templateUrl: './supply.component.html',
    styleUrls: ['./supply.component.sass'],
    animations: [
        step,
        stepLink
    ],
    standalone: false
})
export class SupplyComponent implements OnInit {
  constructor(
    private fBuilder: FormBuilder,
    public dialog: MatDialog,
    private authService: AuthService,
    private supplyService: SuppliesService,
    private router: Router) {
    
  }

  private mySupplies: BehaviorSubject<any[]>;
  private suppliesArray: any[] = [];
  
  readonly spinnerColor: ThemePalette = 'primary';
  readonly spinnerDiameter: number = 30;
  
  supply;
  isSubmit;
  isFormShown;
  isEdit;
  supplyForm: FormGroup;

  ngOnInit(): void {
    if (!this.authService.isAdminRole()) {
      this.router.navigate(['/profesionales/recetas/nueva']);
    }
    this.initSupplyForm();
  }

  onSubmitSupplyForm(supplyNgForm: FormGroupDirective): void {
    if(this.supplyForm.valid){
      const newSupply = this.supplyForm.value.supply;
      this.isSubmit = true;
      
      const subscription = !this.isEdit ? this.supplyService.newSupply(newSupply) : this.supplyService.editSupply(newSupply);

      subscription.subscribe(
        success => {
          if(success) {
            this.isSubmit = false;
            this.isEdit = false;
            this.openDialog(this.isEdit ? "updated" : "created");
            this.clearForm(supplyNgForm);
          }
        });
    }
  }

  openDialog(aDialogType: string, aPrescription?: any, aText?: string): void {
    const dialogRef = this.dialog.open(SupplyDialogComponent, {
      width: '400px',
      data: {dialogType: aDialogType, prescription: aPrescription, text: aText }
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

  showForm() {
    this.isFormShown = true;
  }

  showList() {
    this.isFormShown = false;
  }

  initSupplyForm(){
    this.supplyForm = this.fBuilder.group({
      supply: this.fBuilder.group({
        _id: [''],
        name: ['', [
          Validators.required,
        ]],
        activePrinciple: ['', [
          Validators.required
        ]],
        pharmaceutical_form: ['', [
          Validators.required
        ]],
        power: ['', [
          Validators.required
        ]],
        unity: ['', [
          Validators.required
        ]],
        firstPresentation: ['', [
          Validators.required
        ]],
        secondPresentation: ['']
      })
    });
  }

  editSupply(e) {
    this.supplyForm.reset({
      supply: e
    });
    this.isEdit = true;
    this.isFormShown = true;
  }

  cleanSupplies(): void{
    this.suppliesArray = [];
    this.mySupplies.next(this.suppliesArray);
  }

   // reset the form as intial values
  clearForm(supplyNgForm: FormGroupDirective){
    supplyNgForm.resetForm();
    this.supplyForm.reset({
      name: '',
      activePrinciple: '',
      pharmaceutical_form: '',
      power: '',
      unity: '',
      firstPresentation: '',
      secondPresentation: ''
    });
    this.isEdit = false;
  }

  get supplies(): Observable<any[]> {
    return this.mySupplies.asObservable();
  }

  get name(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('name');
  }

  get activePrinciple(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('activePrinciple');
  }

  get pharmaceutical_form(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('pharmaceutical_form');
  }
  
  get power(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('power');
  }
  
  get unity(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('unity');
  }
  
  get firstPresentation(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('firstPresentation');
  }
  
  get secondPresentation(): AbstractControl {
    const supply = this.supplyForm.get('supply');
    return supply.get('secondPresentation');
  }
}
