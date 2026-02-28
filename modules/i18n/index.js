/**
 * Backchain i18n Module
 * Auto-detects browser language, persists choice in localStorage.
 * Usage: import { t } from '../modules/i18n/index.js';
 *        t('staking.title')  →  "Stake & Earn"
 *        t('faucet.sent', { amount: '0.01' })  →  "Faucet: 0.01 tBNB sent!"
 */

import enDict from './en.js';
import ptDict from './pt.js';
import esDict from './es.js';
import ruDict from './ru.js';
import zhDict from './zh.js';
import koDict from './ko.js';

const STORAGE_KEY = 'backchain_lang';
const SUPPORTED = ['en', 'pt', 'es', 'ru', 'zh', 'ko'];
const DICTS = { en: enDict, pt: ptDict, es: esDict, ru: ruDict, zh: zhDict, ko: koDict };

let _lang = 'en';
let _dict = enDict;

function detectLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'en';
}

export function initI18n() {
    _lang = detectLanguage();
    _dict = DICTS[_lang] || enDict;
    document.documentElement.lang = _lang;
    document.documentElement.setAttribute('data-lang', _lang);
    translateStaticElements();
    window.setLang = setLang;
    window.getLang = getLang;
    window.t = t;
}

export function getLang() {
    return _lang;
}

export function setLang(lang) {
    if (!SUPPORTED.includes(lang) || lang === _lang) return;
    _lang = lang;
    _dict = DICTS[lang] || enDict;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    translateStaticElements();
    // Re-render current page
    const pageId = window._activePageId;
    if (pageId && window.navigateTo) {
        window.navigateTo(pageId, true);
    }
}

export function t(key, vars) {
    if (!_dict) return key;
    const parts = key.split('.');
    let val = _dict;
    for (const part of parts) {
        val = val?.[part];
        if (val === undefined) return key;
    }
    if (typeof val !== 'string') return key;
    if (!vars) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : `{${k}}`);
}

export function translateStaticElements() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translated = t(key);
        if (translated !== key) el.textContent = translated;
    });
    // Update language picker active states
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
        const isActive = btn.dataset.langBtn === _lang;
        btn.classList.toggle('ring-amber-500/60', isActive);
        btn.classList.toggle('opacity-100', isActive);
        btn.classList.toggle('opacity-40', !isActive);
    });
}
