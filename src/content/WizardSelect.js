import { WizardContent } from '../WizardContent.js';

export class WizardSelect extends WizardContent {
    /**@type {string} */ label;
    /**@type {string} */ var;
    /**@type {string} */ selected;
    /**@type {{label:string, value:string}[]} */ options = [];

    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLSelectElement} */
        select: undefined,
    };

    /**
     * @param {import('../Wizard.js').Wizard} wizard
     */
    async render(wizard) {
        if (!this.dom.root) {
            const root = document.createElement('div'); {
                this.dom.root = root;
                root.classList.add('stwiz--content');
                root.classList.add('stwiz--input');
                root.classList.add('stwiz--select');

                if (this.label) {
                    const label = document.createElement('label'); {
                        label.classList.add('stwiz--label');
                        label.textContent = this.label;
                        root.append(label);
                    }
                }

                const select = document.createElement('select'); {
                    this.dom.select = select;
                    select.classList.add('stwiz--select', 'text_pole');

                    this.options.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option.value;
                        opt.textContent = option.label;
                        if (option.value === this.selected) {
                            opt.selected = true;
                        }
                        select.append(opt);
                    });

                    let isUpdating = false;
                    const update = (prop = true) => {
                        if (prop && this.var !== undefined) {
                            isUpdating = true;
                            wizard.setVariable(this.var, select.value);
                            isUpdating = false;
                        }
                    };

                    select.addEventListener('change', () => update());

                    if (this.var !== undefined) {
                        wizard.onVariable(this.var, (value) => {
                            if (isUpdating) return;
                            select.value = value;
                            update(false);
                        });

                        // Set initial value
                        wizard.setVariable(this.var, select.value);
                    }

                    root.append(select);
                }
            }
        }
        return this.dom.root;
    }
}
