import { SlashCommandClosure } from '../../../../../slash-commands/SlashCommandClosure.js';
import { SlashCommandScope } from '../../../../../slash-commands/SlashCommandScope.js';
import { WizardContent } from '../WizardContent.js';

export class WizardButton extends WizardContent {
    /**@type {string} */ label;
    /**@type {string} */ icon;
    /**@type {string} */ image;
    /**@type {boolean} */ isSmall;
    /**@type {SlashCommandClosure} */ callback;


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
                root.classList.add('stwiz--button');
                root.classList.add('menu_button');
                if (!this.isSmall) root.classList.add('stwiz--large');
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
                root.addEventListener('click', async(evt)=>{
                    if (!this.callback) return;
                    await this.callback.execute();
                });
            }
        }
        return this.dom.root;
    }
}
