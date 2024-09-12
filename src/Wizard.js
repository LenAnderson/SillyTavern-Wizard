/** @readonly */

import { SlashCommandClosure } from '../../../../slash-commands/SlashCommandClosure.js';
import { delay } from '../../../../utils.js';
import { waitForFrame } from './lib/wait.js';
import { WizardHero } from './WizardHero.js';
import { WizardNav } from './WizardNav.js';
import { WizardPage } from './WizardPage.js';
import { WizardTransition } from './WizardTransition.js';
import { WizardCrumbs } from './WizCrumbs.js';

/** @enum {string?} */
export const WIZARD_SIZE = {
    FULL: 'full',
    INSET: 'inset',
};


export class Wizard {
    // wizard's own
    /**@type {string} */ title;
    /**@type {WIZARD_SIZE} */ size = WIZARD_SIZE.INSET;
    /**@type {number} */ blur = 6;
    /**@type {string} */ backgroundColor;
    /**@type {string} */ backgroundImage;
    /**@type {string} */ firstPage;
    /**@type {string[]} */ classList = [];
    /**@type {boolean} */ isLinear = false;

    /**@type {SlashCommandClosure} */ before;
    /**@type {SlashCommandClosure} */ after;


    // page defaults
    /**@type {WizardHero} */ hero;
    /**@type {WizardNav} */ nav;
    /**@type {WizardTransition} */ transition = new WizardTransition();
    /**@type {WizardCrumbs} */ crumbs;


    // pages
    /**@type {WizardPage[]} */ pageList = [];
    /**@type {WizardPage[]} */ historyList = [];
    /**@type {WizardPage} */ currentPage;
    /**@type {WizardPage[]} */ futureList = [];


    // vars and pipe
    /**@type {string|SlashCommandClosure} */ pipe;
    /**@type {{[key:string]:string|SlashCommandClosure}} */ variables = {};


    // state
    /**@type {boolean} */ isActive = false;
    /**@type {Promise<string>} */ promise;
    /**@type {(result:string)=>void} */ resolve;
    /**@type {{[key:string]:((value:string)=>void)[]}} */ variableListeners = {};


    // DOM
    dom = {
        /**@type {HTMLDialogElement} */
        root: undefined,
        /**@type {HTMLElement} */
        bgImg: undefined,
        /**@type {HTMLElement} */
        page: undefined,
    };




    toString() {
        return `Wizard${JSON.stringify({
            title: this.title,
            size: this.size,
            blur: this.blur,
            backgroundColor: this.backgroundColor,
            backgroundImage: this.backgroundImage,
            classList: this.classList,
            firstPage: this.firstPage,
            before: this.before?.toString(),
            after: this.after?.toString(),
            // pageList
            pipe: this.pipe,
            variables: this.variables,
        }, null, 2)}`;
    }




    setVariable(key, value, index = null) {
        if (index !== null && index !== undefined) {
            let v = this.variables[key] ?? (/^\d+/.test(index) ? '[]' : '{}');
            try {
                v = JSON.parse(v);
                const numIndex = Number(index);
                if (Number.isNaN(numIndex)) {
                    v[index] = value;
                } else {
                    v[numIndex] = value;
                }
                v = JSON.stringify(v);
            } catch {
                v[index] = value;
            }
            this.variables[key] = v;
        } else {
            this.variables[key] = value;
        }
        this.variableListeners[key]?.forEach(it=>it(value));
        return value;
    }
    getVariable(key, index = null, fallback = null) {
        if (this.variables[key] !== undefined) {
            if (index !== null && index !== undefined) {
                let v = this.variables[key];
                try { v = JSON.parse(v); } catch { /* empty */ }
                const numIndex = Number(index);
                if (Number.isNaN(numIndex)) {
                    v = v[index];
                } else {
                    v = v[numIndex];
                }
                if (typeof v == 'object') return JSON.stringify(v);
                return v ?? '';
            } else {
                const value = this.variables[key];
                return ((value?.trim?.() === '' || isNaN(Number(value))) ? (value || '') : Number(value)).toString();
            }
        }
        if (fallback === null) {
            throw new Error(`No such variable: "${key}"`);
        } else {
            return fallback;
        }
    }
    onVariable(key, callback) {
        if (!this.variableListeners[key]) {
            this.variableListeners[key] = [];
        }
        this.variableListeners[key].push(callback);
    }




    async start() {
        this.isActive = true;
        this.promise = new Promise(resolve=>this.resolve = resolve);
        const dom = await this.render();
        if (this.before) {
            this.before.scope.setVariable('_STWIZ_', this);
            await this.before.execute();
        }
        await this.next();
        const result = await this.promise;
        this.isActive = false;
        dom.close();
        Object.keys(this.dom).forEach(key=>this.dom[key]?.remove());
        this.dom.root = null;
        if (this.after) {
            this.after.scope.setVariable('_STWIZ_', this);
            const afterResult = await this.after.execute();
            return afterResult?.pipe;
        }
        return result;
    }

    /**
     * @param {WizardPage} page
     * @returns {boolean}
     */
    hasNext(page) {
        return this.futureList.length > 0 || this.pageList.indexOf(page ?? this.currentPage) + 1 < this.pageList.length;
    }

    /**
     * @param {WizardPage} page
     * @returns {boolean}
     */
    hasPrev(page) {
        return this.historyList.length > 0;
    }

    async next() {
        if (!this.isActive) return;
        let page;
        if (this.futureList.length > 0) {
            page = this.futureList.shift();
        } else {
            if (this.currentPage?.after) {
                this.pipe = (await this.currentPage.after.execute())?.pipe ?? '';
                if (!this.isActive) return;
            }
            page = this.pageList[this.pageList.indexOf(this.currentPage) + 1];
        }
        if (page) {
            await this.showPage(page);
        } else {
            await this.stop();
        }
    }

    async prev() {
        if (!this.isActive) return;
        let page;
        if (this.historyList.length > 0) {
            page = this.historyList.pop();
            await this.showPage(page, true);
        }
    }

    async stop(result = null) {
        this.resolve(result ?? this.pipe ?? '');
    }

    async goto(id) {
        if (!this.isActive) return;
        if (this.isLinear) return toastr.warning('Cannot use /wiz-goto on a linear wizard');
        const page = this.pageList.find(it=>it.id == id);
        if (!page) throw new Error(`Wizard: No page with ID "${id}" found`);
        if (this.currentPage?.after) {
            this.pipe = (await this.currentPage.after.execute())?.pipe ?? '';
        }
        this.showPage(page);
    }

    async render() {
        if (!this.dom.root) {
            if (this.backgroundImage) {
                const bg = document.createElement('dialog'); {
                    this.dom.bgImg = bg;
                    bg.classList.add('stwiz--bg');
                    bg.style.backgroundImage = `url("${this.backgroundImage}")`;
                    document.body.append(bg);
                    bg.showModal();
                }
            }
            const root = document.createElement('dialog'); {
                this.dom.root = root;
                root.classList.add('stwiz--root');
                root.dataset.stwizSize = this.size;
                for (const c of this.classList) root.classList.add(c);
                if (this.backgroundColor) root.style.backgroundColor = this.backgroundColor;
                root.style.setProperty('--blur', this.blur.toString());
                root.addEventListener('keydown', (evt)=>{
                    if (evt.key == 'Escape') {
                        evt.stopPropagation();
                        this.stop();
                    }
                });
                document.body.append(root);
                root.showModal();
            }
        }
        return this.dom.root;
    }

    /**
     *
     * @param {WizardPage} page
     */
    async showPage(page, isBack = false) {
        if (!this.isActive) return;
        const o = this.dom.page;
        o?.classList?.add('stwiz--busy');
        if (this.currentPage) {
            this.currentPage.unrender();
            if (isBack) {
                this.futureList.unshift(this.currentPage);
            } else {
                this.historyList.push(this.currentPage);
            }
        }
        await page.contentClosure?.execute();
        if (page.before) {
            await page.before.execute();
        }
        const n = await page.render(this);
        n.classList.add('stwiz--busy');
        this.dom.root.dataset.stwizTransition = page.transition?.type ?? '';
        this.dom.root.style.setProperty('--transition', page.transition?.time?.toString() ?? '0');
        if (page.transition) {
            if (page.transition.isParallel) { //in-parallel
                n.classList.add(isBack ? 'stwiz--exit' : 'stwiz--enter');
                this.dom.root.append(n);
                await waitForFrame();
                n.classList.remove(isBack ? 'stwiz--exit' : 'stwiz--enter');
                o?.classList?.add(isBack ? 'stwiz--enter' : 'stwiz--exit');
                await delay(page.transition.time + 10);
                o?.remove();
                this.dom.page = n;
            } else { // in-series
                n.classList.add(isBack ? 'stwiz--exit' : 'stwiz--enter');
                this.dom.root.append(n);
                await waitForFrame();
                o?.classList?.add(isBack ? 'stwiz--enter' : 'stwiz--exit');
                await delay(page.transition.time / 2);
                n.classList.remove(isBack ? 'stwiz--exit' : 'stwiz--enter');
                await delay(page.transition.time / 2 + 10);
                o?.remove();
                this.dom.page = n;
            }
        } else {
            this.dom.root.append(n);
            o?.remove();
            this.dom.page = n;
        }
        this.currentPage = page;
        n.classList.remove('stwiz--busy');
        n.querySelector('[contenteditable], input, textarea, select')?.focus();
    }
}
