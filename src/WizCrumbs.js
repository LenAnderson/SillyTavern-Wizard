import { Wizard } from './Wizard.js';
import { WizardPage } from './WizardPage.js';


/** @enum {string?} */
export const CRUMBS__POSITION = {
    START: 'start',
    END: 'end',
};



export class WizardCrumbs {
    static from(props) {
        if (!props) return null;
        return Object.assign(new this(), props);
    }




    /**@type {CRUMBS__POSITION} */ position = CRUMBS__POSITION.END;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };


    toJSON() {
        return {
            position: this.position,
        };
    }




    /**
     *
     * @param {Wizard} wizard
     * @param {WizardPage} page
     * @returns
     */
    async render(wizard, page) {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--crumbs');
                root.dataset.stwizPosition = this.position;
                let i = 0;
                for (const p of wizard.pageList) {
                    i++;
                    const crumb = document.createElement('div'); {
                        crumb.classList.add('stwiz--crumb');
                        if (p == page) crumb.classList.add('stwiz--current');
                        crumb.textContent = i.toString();
                        root.append(crumb);
                    }
                }
            }
        }
        return this.dom.root;
    }

    unrender() {
        Object.keys(this.dom).forEach(it=>this.dom[it] = null);
    }
}
