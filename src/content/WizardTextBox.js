import { WizardContent } from '../WizardContent.js';

export class WizardTextBox extends WizardContent {
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
                root.classList.add('stwiz--textbox');
                let label;
                if (this.label) {
                    label = document.createElement('label'); {
                        label.classList.add('stwiz--label');
                        const text = document.createElement('div'); {
                            text.classList.add('stwiz--text');
                            text.textContent = this.label;
                            label.append(text);
                        }
                        root.append(label);
                    }
                }
                const input = document.createElement('input'); {
                    this.dom.input = input;
                    input.classList.add('stwiz--input');
                    input.classList.add('text_pole');
                    if (this.placeholder) input.placeholder = this.placeholder;
                    input.value = this.currentValue ?? this.value;
                    input.addEventListener('click', (evt)=>evt.stopPropagation());
                    let isUpdating = false;
                    input.addEventListener('input', ()=>{
                        this.currentValue = input.value;
                        if (this.varName) {
                            isUpdating = true;
                            wizard.setVariable(this.varName, input.value);
                            isUpdating = false;
                        }
                    });
                    if (this.varName) {
                        wizard.onVariable(this.varName, (value)=>{
                            if (isUpdating) return;
                            input.value = value;
                            this.currentValue = value;
                        });
                    }
                    (label ?? root).append(input);
                }
            }
        }
        return this.dom.root;
    }
}
