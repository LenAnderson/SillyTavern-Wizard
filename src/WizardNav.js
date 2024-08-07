import { Wizard } from './Wizard.js';
import { WizardPage } from './WizardPage.js';


/** @enum {string?} */
export const NAV_POSITION = {
    START: 'start',
    END: 'end',
};



export class WizardNav {
    static from(props) {
        if (!props) return null;
        return Object.assign(new this(), props);
    }




    /**@type {NAV_POSITION} */ position = NAV_POSITION.END;
    /**@type {boolean} */ prev = true;
    /**@type {boolean} */ next = true;
    /**@type {boolean} */ stop = true;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };


    toJSON() {
        return {
            position: this.position,
            prev: this.prev,
            next: this.next,
            stop: this.stop,
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
                root.classList.add('stwiz--nav');
                root.dataset.stwizPosition = this.position;
                if (this.prev) {
                    const prev = document.createElement('div'); {
                        prev.classList.add('stwiz--prev');
                        prev.classList.add('fa-solid');
                        const hasPrev = wizard.hasPrev(page);
                        if (!hasPrev) prev.classList.add('stwiz--disabled');
                        prev.classList.add(hasPrev ? 'fa-chevron-left' : 'fa-circle');
                        prev.title = 'Previous';
                        prev.addEventListener('click', ()=>wizard.prev());
                        root.append(prev);
                    }
                }
                if (this.next) {
                    const next = document.createElement('div'); {
                        next.classList.add('stwiz--next');
                        next.classList.add('fa-solid');
                        const hasNext = wizard.hasNext(page);
                        next.classList.add(hasNext ? 'fa-chevron-right' : 'fa-door-open');
                        next.title = hasNext ? 'Next' : 'Finish';
                        next.addEventListener('click', ()=>wizard.next());
                        root.append(next);
                    }
                }
                if (this.stop) {
                    const stop = document.createElement('div'); {
                        stop.classList.add('stwiz--stop');
                        stop.classList.add('fa-solid', 'fa-close');
                        stop.title = 'Close / Cancel';
                        stop.addEventListener('click', ()=>wizard.stop(''));
                        root.append(stop);
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
