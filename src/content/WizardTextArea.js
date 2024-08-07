import { WizardContent } from '../WizardContent.js';

export class WizardTextArea extends WizardContent {
    /**@type {string} */ label;
    /**@type {string} */ placeholder;
    /**@type {string} */ value;
    /**@type {string} */ varName;

    /**@type {string} */ currentValue;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLElement} */
        input: undefined,
    };




    async render(wizard) {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--content');
                root.classList.add('stwiz--input');
                root.classList.add('stwiz--textarea');
                let label;
                if (this.label) {
                    label = document.createElement('label'); {
                        label.classList.add('stwiz--label');
                        label.addEventListener('click', ()=>input.focus());
                        const text = document.createElement('div'); {
                            text.classList.add('stwiz--text');
                            text.textContent = this.label;
                            label.append(text);
                        }
                        root.append(label);
                    }
                }
                const input = document.createElement('div'); {
                    this.dom.input = input;
                    input.classList.add('stwiz--input');
                    input.classList.add('text_pole');
                    input.contentEditable = 'plaintext-only';
                    if (this.placeholder) input.style.setProperty('--placeholder', `"${this.placeholder.replace(/"/g, '\\"')}"`);
                    input.textContent = this.currentValue ?? this.value;
                    input.addEventListener('click', (evt)=>evt.stopPropagation());
                    input.addEventListener('input', ()=>{
                        this.currentValue = input.textContent;
                        if (this.varName) {
                            wizard.variables[this.varName] = input.textContent;
                        }
                    });
                    (label ?? root).append(input);
                }
            }
        }
        return this.dom.root;
    }
}
