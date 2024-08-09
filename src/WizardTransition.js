

/** @enum {string?} */
export const TRANSITION_TYPE = {
    FADE: 'fade',
    SLIDE_HORIZONTAL: 'slide-horizontal',
    SLIDE_VERTICAL: 'slide-vertical',
    FLIP_HORIZONTAL: 'flip-horizontal',
    FLIP_VERTICAL: 'flip-vertical',
};


export class WizardTransition {
    static from(props) {
        if (!props) return null;
        return Object.assign(new this(), props);
    }




    /**@type {TRANSITION_TYPE} */ type = TRANSITION_TYPE.FADE;
    /**@type {number} */ time = 400;

    get isParallel() {
        switch (this.type) {
            case TRANSITION_TYPE.FLIP_HORIZONTAL:
            case TRANSITION_TYPE.FLIP_VERTICAL: {
                return false;
            }
            default: {
                return true;
            }
        }
    }




    toJSON() {
        return {
            type: this.type,
            time: this.time,
        };
    }
}
