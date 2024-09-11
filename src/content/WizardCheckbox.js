import { isTrueBoolean } from '../../../../../utils.js';
import { Wizard } from '../Wizard.js';
import { WizardContent } from '../WizardContent.js';

export class WizardCheckbox extends WizardContent {
    /**@type {string} */ label;
    /**@type {string} */ group;
    /**@type {string} */ var;
    /**@type {string} */ icon;
    /**@type {string} */ image;
    /**@type {string} */ value;
    /**@type {boolean} */ checked = false;
    /**@type {boolean} */ isSmall = false;


    // DOM
    dom = {
        /**@type {HTMLElement} */
        root: undefined,
        /**@type {HTMLInputElement} */
        input: undefined,
    };




    /**
     * @param {Wizard} wizard
     */
    async render(wizard) {
        if (!this.dom.root) {
            const root = document.createElement('label'); {
                this.dom.root = root;
                root.classList.add('stwiz--content');
                root.classList.add('stwiz--input');
                root.classList.add('stwiz--checkbox');
                if (!this.isSmall) root.classList.add('stwiz--large');
                const inp = document.createElement('input'); {
                    this.dom.input = inp;
                    inp.classList.add('stwiz--checkbox');
                    inp.type = 'checkbox';
                    inp.checked = this.checked;
                    let isUpdating = false;
                    const update = (prop = true)=>{
                        this.checked = inp.checked;
                        if (prop && this.var !== undefined) {
                            isUpdating = true;
                            wizard.setVariable(this.var, JSON.stringify(this.checked));
                            isUpdating = false;
                        }
                        if (this.group !== undefined) {
                            let group = [];
                            try { group = JSON.parse(wizard.getVariable(this.group)); } catch { /* not JSON */ }
                            const val = this.value ?? this.label;
                            if (this.checked) {
                                if (!group.includes(val)) group.push(val);
                            } else if (group.includes(val)) {
                                group.splice(group.indexOf(val), 1);
                            }
                            wizard.setVariable(this.group, JSON.stringify(group));
                        }
                    };
                    inp.addEventListener('click', ()=>update());
                    if (this.var !== undefined) {
                        wizard.onVariable(this.var, (value)=>{
                            if (isUpdating) return;
                            inp.checked = isTrueBoolean(value);
                            update(false);
                        });
                    }
                    root.append(inp);
                }
                if (this.icon) {
                    root.classList.add('menu_button_icon');
                    const i = document.createElement('i'); {
                        i.classList.add('stwiz--icon');
                        i.classList.add('fa-solid', 'fa-fw');
                        i.classList.add(this.icon);
                        root.append(i);
                    }
                }
                const lbl = document.createElement('span'); {
                    lbl.classList.add('stwiz--label');
                    if (this.image) {
                        const img = document.createElement('img'); {
                            img.classList.add('stwiz--img');
                            const prom = new Promise(resolve=>{
                                if (img.complete) return resolve();
                                img.addEventListener('load', resolve, { once:true });
                                img.addEventListener('error', resolve, { once:true });
                            });
                            img.src = this.image;
                            await prom;
                            lbl.append(img);
                        }
                    }
                    lbl.append(this.label);
                    root.append(lbl);
                }
            }
        }
        return this.dom.root;
    }
}
