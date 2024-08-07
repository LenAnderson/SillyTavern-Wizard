/** @readonly */

import { SlashCommandClosure } from '../../../../slash-commands/SlashCommandClosure.js';
import { delay } from '../../../../utils.js';
import { waitForFrame } from './lib/wait.js';
import { WizardHero } from './WizardHero.js';
import { WizardNav } from './WizardNav.js';
import { WizardPage } from './WizardPage.js';
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
        return value;
    }
    getVariable(key, index = null) {
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
        throw new Error(`No such variable: "${key}"`);
    }




    async start() {
        this.isActive = true;
        const dom = await this.render();
        if (this.before) {
            this.before.scope.setVariable('_STWIZ_', this);
            await this.before.execute();
        }
        await this.next();
        this.promise = new Promise(resolve=>this.resolve = resolve);
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
        if (!this.isActive) return;
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
                    if (evt.key == 'Escape') this.stop();
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
        if (page.before) {
            await page.before.execute();
        }
        const n = await page.render(this);
        n.classList.add('stwiz--busy');
        //TODO check if animation is set
        //TODO adjust timing based on anim type
        if (true) { //in-parallel
            n.classList.add(isBack ? 'stwiz--exit' : 'stwiz--enter');
            this.dom.root.append(n);
            await waitForFrame();
            n.classList.remove(isBack ? 'stwiz--exit' : 'stwiz--enter');
            o?.classList?.add(isBack ? 'stwiz--enter' : 'stwiz--exit');
            await delay(410);
            o?.remove();
            this.dom.page = n;
        } else if (true) { // in-series
            n.classList.add(isBack ? 'stwiz--exit' : 'stwiz--enter');
            this.dom.root.append(n);
            await waitForFrame();
            o?.classList?.add(isBack ? 'stwiz--enter' : 'stwiz--exit');
            await delay(200);
            n.classList.remove(isBack ? 'stwiz--exit' : 'stwiz--enter');
            await delay(210);
            o?.remove();
            this.dom.page = n;
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
