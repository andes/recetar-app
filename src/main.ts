import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';

import 'moment/locale/es';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

registerLocaleData(localeEsAr);

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch((err) => {
        throw err;
    });
