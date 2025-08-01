import { animate, sequence, state, style, transition, trigger } from '@angular/animations';

export const rowsAnimation =
  trigger('rowsAnimation', [
      transition('void => *', [
          style({ height: '*', opacity: '0', transform: 'translateX(-550px)', 'box-shadow': 'none' }),
          sequence([
              animate('.35s ease', style({ height: '*', opacity: '.2', transform: 'translateX(0)', 'box-shadow': 'none' })),
              animate('.35s ease', style({ height: '*', opacity: 1, transform: 'translateX(0)' }))
          ])
      ])
  ]);

export const detailExpand =
  trigger('detailExpand', [
      state('collapsed, void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

export const arrowDirection =
  trigger('arrowDirection', [
      state('down', style({ transform: 'rotate(0deg)' })),
      state('up, void', style({ transform: 'rotate(180deg)' })),
      transition('down <=> up', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('down <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

export const step =
  trigger('step', [
      state('left', style({ left: '0' })),
      state('center-left', style({ left: '0' })),
      state('center-right', style({ left: '0' })),
      state('right', style({ left: '0' })),
      transition('left <=> center-left', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('center-left <=> center-right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('center-right <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('left <=> center-right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('center-left <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('left <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  ]);

export const stepLink =
  trigger('stepLink', [
      state('left', style({ left: '0px' })),
      state('center-left', style({ left: '25%' })),
      state('center-right', style({ left: '50%' })),
      state('right', style({ left: '75%' })),
      transition('left <=> center-left', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('center-left <=> center-right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('center-right <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('left <=> center-right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('center-left <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('left <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  ]);

export const showCancelDispense =
  trigger('showcancel', [
      state('hide', style({ bottom: '15%', opacity: '0' })),
      state('show', style({ bottom: '50%', opacity: 1 })),
      transition('show <=> hide', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

export const hideTimer =
  trigger('hidetimer', [
      state('show', style({ top: '50%', opacity: '1' })),
      state('hide', style({ top: '15%', opacity: 0 })),
      transition('hide <=> show', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);
