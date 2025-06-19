import { Component, OnInit, OnDestroy, Input, Injectable, EventEmitter, Output } from '@angular/core';
import { timer, Subscription } from 'rxjs';
import * as moment from 'moment';
import {showCancelDispense, hideTimer} from '@animations/animations.template';
import { AuthService } from '@auth/services/auth.service';
import { Prescriptions } from '@interfaces/prescriptions';
import AndesPrescriptions from '@interfaces/andesPrescriptions';

@Injectable()
export class CounterDownService {
  getCounter(tick) {
    return timer(0, tick);
  }
}
@Component({
  selector: 'app-prescription-undo',
  templateUrl: './prescription-undo.component.html',
  styleUrls: ['./prescription-undo.component.sass'],
  animations:[
    showCancelDispense,
    hideTimer
  ],
  providers: [CounterDownService]
})
export class PrescriptionUndoComponent implements OnInit, OnDestroy {

  @Output() cancelDispenseEvent = new EventEmitter();
  @Input() dispensedAt: Date;
  @Input() prescription: Prescriptions | AndesPrescriptions;
  @Input() lapseTime: number;
  subscriptions: Subscription = new Subscription();
  tick: number = 1000;
  maxCounter: number = 7200;
  progress: number = 100;
  typeTime: string;
  counter: number;
  showtimes: boolean = true;
  isAdmin: boolean = false;

  constructor(private counterDownService: CounterDownService, private authService: AuthService) {}

  ngOnInit() {
    this.counter = this.getTimeeDiffInSeconds();

    this.subscriptions.add(this.counterDownService
      .getCounter(this.tick)
      .subscribe(() => {
        this.progress = parseFloat((this.counter * 100 / this.maxCounter).toFixed(2));
        this.counter--;
        if(this.counter > 3600) this.typeTime = 'h';
        if(this.counter < 3600) this.typeTime = 'm';
        if(this.counter < 60) this.typeTime = 's';
      }));
    
      this.isAdmin = this.authService.isAdminRole();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe(); // on complete timer, destroy this component and it subscriptions
  }

  cancelDispense(prescription: Prescriptions | AndesPrescriptions) {
    this.cancelDispenseEvent.emit(prescription);
  }

  getTimeeDiffInSeconds():number{
    const dispensedAt = moment(this.dispensedAt);
    dispensedAt.add(this.lapseTime, 'hours');
    // dispensedAt.add(10, 'seconds');
    const now = moment();
    const diff = dispensedAt.diff((now), 'seconds');
    return diff;
  }
}
