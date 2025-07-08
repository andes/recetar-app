import { trigger, sequence, state, animate, transition, style } from '@angular/animations';

export const rowsAnimation =
  trigger('rowsAnimation', [
    transition('void => *', [
      style({ height: '*', opacity: '0', transform: 'translateX(-550px)', 'box-shadow': 'none' }),
      sequence([
        animate(".35s ease", style({ height: '*', opacity: '.2', transform: 'translateX(0)', 'box-shadow': 'none'  })),
        animate(".35s ease", style({ height: '*', opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]);

// export const rowsBgAnimation =
//   trigger('rowsBgAnimation', [
//     state('success', style({  "background-color": '#bdeac9'  })),
//     state('normal, void', style({  "background-color": '#ffffff'  })),
//     transition('success <=> normal', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
//   ]);

export const detailExpand =
  trigger('detailExpand', [
    state('collapsed, void', style({height: '0px', minHeight: '0'})),
    state('expanded', style({height: '*'})),
    transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

export const arrowDirection =
  trigger('arrowDirection', [
    state('down', style({ transform: "rotate(0deg)" })),
    state('up, void', style({ transform: "rotate(180deg)" })),
    transition('down <=> up', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    transition('down <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

export const step =
  trigger('step', [
    state('left', style({ left: '0px' })),
    state('right', style({ left: '-100vw' })),
    transition('left <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  ]);

export const stepLink =
  trigger('stepLink', [
    state('left', style({ left: '0px' })),
    state('right', style({ left: '50%' })),
    transition('left <=> right', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  ]);

export const showCancelDispense =
  trigger('showcancel',[
    state('hide', style({bottom: '15%', opacity: '0'})),
    state('show' , style({ bottom: '50%', opacity: 1})),
    transition('show <=> hide', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);

export const hideTimer =
  trigger('hidetimer',[
    state('show', style({top: '50%', opacity: '1'})),
    state('hide' , style({ top: '15%', opacity: 0})),
    transition('hide <=> show', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]);
