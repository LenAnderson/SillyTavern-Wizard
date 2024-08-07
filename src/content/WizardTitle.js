import { WizardContent } from '../WizardContent.js';

export class WizardTitle extends WizardContent {
    /**@type {string} */ text;
    /**@type {number} */ level;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };




    async render() {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--content');
                root.classList.add('stwiz--title');
                root.dataset.stwizLevel = (this.level ?? 1).toString();
                root.textContent = this.text;
            }
        }
        return this.dom.root;
    }
}
