import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private readonly STORAGE_KEY = 'dark_mode';
    private isDarkMode: boolean;
    private _isDarkMode$: BehaviorSubject<boolean>;

    private readonly LIGHT_THEME = 'indigo-pink.css';
    private readonly DARK_THEME = 'purple-green.css';

    constructor(@Inject(DOCUMENT) private document: Document) {
        this.isDarkMode = this.loadFromStorage();
        this._isDarkMode$ = new BehaviorSubject<boolean>(this.isDarkMode);
        this.applyTheme(this.isDarkMode);
    }

    private loadFromStorage(): boolean {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored === 'true';
        } catch {
            return false;
        }
    }

    private saveToStorage(dark: boolean): void {
        try {
            if (dark) {
                localStorage.setItem(this.STORAGE_KEY, 'true');
            } else {
                localStorage.removeItem(this.STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Error saving theme preference:', error);
        }
    }

    private applyTheme(dark: boolean): void {
        const body = this.document.body;
        if (dark) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        this.switchMaterialTheme(dark);
    }

    private switchMaterialTheme(dark: boolean): void {
        const head = this.document.head;
        const themeFile = dark ? this.DARK_THEME : this.LIGHT_THEME;
        const existing = head.querySelector<HTMLLinkElement>('#material-theme');
        if (existing) {
            existing.href = themeFile;
        } else {
            const link = this.document.createElement('link');
            link.id = 'material-theme';
            link.rel = 'stylesheet';
            link.href = themeFile;
            head.appendChild(link);
        }
    }

    get isDarkMode$(): Observable<boolean> {
        return this._isDarkMode$.asObservable();
    }

    isDark(): boolean {
        return this.isDarkMode;
    }

    toggle(): void {
        this.isDarkMode = !this.isDarkMode;
        this.saveToStorage(this.isDarkMode);
        this._isDarkMode$.next(this.isDarkMode);
        this.applyTheme(this.isDarkMode);
    }
}
