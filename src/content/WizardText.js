import { messageFormattingWithLanding } from '../lib/messageFormatting.js';
import { Wizard } from '../Wizard.js';
import { WizardContent } from '../WizardContent.js';

export class WizardText extends WizardContent {
    /**@type {string} */ text;
    /**@type {string} */ varName;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
    };




    /**
     *
     * @param {Wizard} wizard
     * @returns
     */
    async render(wizard) {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--content');
                root.classList.add('stwiz--text');
                root.classList.add('mes_text');
                let text = this.text;
                if (this.varName !== undefined) {
                    text = wizard.getVariable(this.varName, null, this.text);
                    wizard.onVariable(this.varName, ()=>{
                        root.innerHTML = messageFormattingWithLanding(this.substituteParams(wizard.getVariable(this.varName), wizard));
                    });
                }
                root.innerHTML = messageFormattingWithLanding(this.substituteParams(text, wizard));
            }
        }
        return this.dom.root;
    }
}
