import { Directive, forwardRef, OnInit} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgxTurnstileComponent } from './ngx-turnstile.component';

@Directive({
  selector: 'ngx-turnstile[formControl], ngx-turnstile[formControlName], ngx-turnstile[ngModel]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxTurnstileValueAccessorDirective),
      multi: true,
    },
  ],
})
export class NgxTurnstileValueAccessorDirective implements ControlValueAccessor, OnInit {
  private onChange!: (value: string) => void;
  private onTouched!: () => void;
  private resolved: boolean = false;

  constructor(private turnstileComp: NgxTurnstileComponent) {}

  ngOnInit(): void {
    this.turnstileComp.resolved.subscribe((token: string) =>{
      this.resolved = !!token;

      if (this.onChange) {
        this.onChange(token);
      }

      if (this.onTouched) {
        this.onTouched();
      }
    });
  }

  writeValue(value: any): void {
    if (this.resolved) {
      this.resolved = false;
      this.turnstileComp.reset();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}