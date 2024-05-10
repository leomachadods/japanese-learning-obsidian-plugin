export default class Word {
    private _term: string
    private _reading: string
    private _definition: string

    constructor(term: string, meaning: string, definition: string) {
        this._term = term;
        this._reading = meaning
        this._definition = definition;
    }

    get term(): string {
        return this._term;
    }
    get reading(): string {
        return this._reading;
    }
    get definition(): string {
        return this._definition;
    }
}