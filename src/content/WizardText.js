import { messageFormattingWithLanding } from '../lib/messageFormatting.js';
import { WizardContent } from '../WizardContent.js';

export class WizardText extends WizardContent {
    /**@type {string} */ text;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };




    async render(wizard) {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--content');
                root.classList.add('stwiz--text');
                root.classList.add('mes_text');
                root.innerHTML = messageFormattingWithLanding(this.substituteParams(this.text, wizard));
            }
        }
        return this.dom.root;
    }
}
