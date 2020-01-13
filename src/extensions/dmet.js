import cuid from 'cuid';
import uid from 'uid';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';

function generateId() {
    return uid(8) + cuid();
}

class dmetList {
    constructor(array = [], id) {
        this.#id = id;
        this.from(array);
    }

    _id = undefined;
    __isUpdate = false;
    #id = '';
    #key = generateId();
    #object = {};
    #array = [];
    #info = {};

    get value() {
        return this.#array;
    }

    get array() {
        return this.#array;
    }

    get isDmet() {
        return true;
    }

    get id() {
        return this.#id;
    }

    get key() {
        return this.#key;
    }

    get variableType() {
        return 'list';
    }

    set #data(array) {
        this.#array = array.map((data) => {
            const key = generateId();
            const item = {
                key,
                data,
            };
            this.#object[key] = item;
            return item;
        });
    }

    from(data) {
        let array = [];
        if (Array.isArray(data)) {
            this.#data = data;
        } else if (data.isDmet || isPlainObject(data)) {
            const { list = [], array, value, _id, id = this.#id, ...info } = data;
            if (Array.isArray(array)) {
                this.#array = array;
                this.#array.map((value) => {
                    const { key } = value;
                    this.#object[key] = value;
                });
            } else if (Array.isArray(list) && isPlainObject(value)) {
                this.#array = list.map((key) => {
                    const data = {
                        key,
                        data: value[key],
                    };
                    this.#object[key] = data;
                    return data;
                });
            } else {
                throw 'data is wrong.';
            }
            this._id = _id;
            this.#id = id;
            this.#info = info;
        } else if ('toJSON' in data) {
            const plainObject = data.toJSON();
            const { array = [], _id, id = this.#id, ...info } = plainObject;
            this.#array = array;
            this._id = _id;
            this.#id = id;
            this.#info = info;
            this.#array.map((value) => {
                const { key } = value;
                this.#object[key] = value;
            });
        } else {
            throw 'data is wrong.';
        }
    }

    get(key) {
        if (typeof key === 'number') {
            return this.#array[key];
        } else if (typeof key === 'string') {
            return this.#object[key];
        }
    }

    getIndex(key) {
        if (typeof key === 'number') {
            return key;
        } else if (typeof key === 'string') {
            const oldData = this.#object[key];
            return this.#array.indexOf(oldData);
        } else {
            return 0;
        }
    }

    #skipOperation = ['append', 'insert'];

    getOperation({ type, key, index, data, newKey } = {}) {
        if (this.#skipOperation.indexOf(type) === -1 && typeof index === 'number') {
            const data = this.get(index);
            key = data.key;
        }
        let attach = {};
        switch (type) {
            case 'append':
                attach = {
                    data,
                };
                break;
            case 'insert':
                attach = {
                    index,
                    data,
                };
                break;
            case 'delete':
                attach = {};
                break;
            case 'replace':
                attach = {
                    data,
                    newKey,
                };
                break;
        }

        return {
            _id: this._id || undefined,
            id: this.#id,
            variableType: 'list',
            key,
            type,
            ...attach,
        };
    }

    exec(operation) {
        const { type } = operation;
        this.__isUpdate = true;
        switch (type) {
            case 'append':
                return this.#append(operation);
            case 'insert':
                return this.#insert(operation);
            case 'delete':
                return this.#delete(operation);
            case 'replace':
                return this.#replace(operation);
        }
    }

    toJSON() {
        return {
            _id: this._id || undefined,
            id: this.#id,
            key: this.#key,
            array: this.#array,
            isDmet: true,
            variableType: 'list',
        };
    }

    #append({ key, data } = {}) {
        if (!key) {
            key = generateId();
        }
        const newData = {
            key,
            data,
        };
        this.#object[key] = newData;
        this.#array.push(newData);
        return this.getOperation({ type: 'append', key, index: -1, data });
    }

    #insert({ key, index, data } = {}) {
        if (!key) {
            key = generateId();
        }
        const newData = {
            key,
            data,
        };
        this.#object[key] = newData;
        this.#array.splice(index, 0, newData);
        return this.getOperation({ type: 'insert', key, index, data });
    }

    #delete({ key, index }) {
        if (!key) {
            key = index;
        }
        const oldData = this.get(key);
        if (!oldData) {
            throw 'not found data';
        }
        const oldIndex = this.getIndex(key);
        delete this.#object[oldData.key];
        this.#array.splice(oldIndex, 1);
        return this.getOperation({ type: 'delete', key });
    }

    #replace({ key, data, newKey = generateId() }) {
        const item = this.get(key);
        if (!item) {
            throw 'not found data';
        }
        delete this.#object[item.key];
        item.key = newKey;
        item.data = data;
        this.#object[newKey] = item;
        return this.getOperation({ type: 'replace', key, data, newKey });
    }
}

class dmetVariable {
    constructor(variable = '', id) {
        this.#id = id;
        this.from(variable);
    }

    _id = undefined;
    #id = '';
    #key = generateId();
    #info = {};
    #value = '';

    get value() {
        return this.#value;
    }

    get id() {
        return this.#id;
    }

    get key() {
        return this.#key;
    }

    get variableType() {
        return 'variable';
    }

    toJSON() {
        return {
            ...this.#info,
            _id: this._id || undefined,
            id: this.#id,
            key: this.#key,
            value: this.value,
            isDmet: true,
            variableType: 'variable',
        };
    }

    from(data) {
        if (typeof data === 'string') {
            this.#value = data;
        } else if (data.isDmet || isPlainObject(data)) {
            const { value = '', _id, id = this.#id, ...info } = data;
            this.#value = value;
            this._id = _id;
            this.#id = id;
            this.#info = info;
        } else if ('toJSON' in data) {
            const plainObject = data.toJSON();
            const { value = '', _id, id = this.#id, ...info } = plainObject;
            this.#value = value;
            this._id = _id;
            this.#id = id;
            this.#info = info;
        } else {
            throw 'data is wrong.';
        }
    }

    get() {
        return this.#value;
    }

    #set(operation) {
        const { value } = operation;
        this.#value = value;
        return operation;
    }

    getOperation({ type, value } = {}) {
        switch (type) {
            case 'set':
                return {
                    _id: this._id,
                    id: this.#id,
                    variableType: 'variable',
                    type,
                    value,
                };
        }
    }

    exec(operation) {
        const { type } = operation;
        switch (type) {
            case 'set':
                return this.#set(operation);
        }
    }
}

class dmet {
    constructor(variables, options) {
        this.from(variables, options);
    }

    #original = { list: {}, variable: {} };
    #id = generateId();
    #list = {};
    #variable = {};

    get list() {
        return this.#list;
    }

    get variable() {
        return this.#variable;
    }

    get id() {
        return this.#id;
    }

    get isDmet() {
        return true;
    }

    get original() {
        return this.#original;
    }

    #objectToJSON(object) {
        for (let key in object) {
            object[key] = object[key].toJSON();
        }
        return object;
    }

    toJSON() {
        return {
            id: this.#id,
            list: this.list,
            variable: this.variable,
            isDmet: true,
        };
    }

    from(variables = []) {
        if (Array.isArray(variables)) {
            variables.forEach((variable) => {
                const { variableType } = variable;
                if (variableType === 'variable') {
                    const result = new dmetVariable(variable);
                    this.#variable[result.id] = result;
                } else if (variableType === 'list') {
                    const result = new dmetList(variable);
                    this.#list[result.id] = result;
                }
            });
        } else if (isPlainObject(variables) && variables.isDmet) {
            this.#list = mapValues(variables.list, (list) => {
                return new dmetList(list);
            });
            this.#variable = mapValues(variables.variable, (variable) => {
                return new dmetVariable(variable);
            });
            this.#id = variables.id;
        }
    }

    get({ variableType, id }) {
        switch (variableType) {
            case 'variable':
                return this.#variable[id];
            case 'list':
                return this.#list[id];
            case 'default':
                return undefined;
        }
    }

    create(object) {
        const { id, variableType } = object;
        if (!id) {
            throw 'not found ID';
        }
        if (variableType === 'variable') {
            this.#variable[id] = new dmetVariable(object);
        } else if (variableType === 'list') {
            this.#list[id] = new dmetList(object);
        }
    }

    #subscriber = new Map();

    subscribe(key, callback) {
        this.#subscriber.set(key, callback);
    }

    unsubscribe(key) {
        this.#subscriber.delete(key, callback);
    }

    notify(...args) {
        for (const observer of this.#subscriber.values()) {
            observer(...args);
        }
    }

    exec(operation) {
        try {
            const { id, variableType } = operation;
            if (variableType === 'variable') {
                return this.#variable[id].exec(operation);
            } else if (variableType === 'list') {
                return this.#list[id].exec(operation);
            }
        } finally {
            this.notify();
        }
    }
}

export { dmetList, dmetVariable, dmet };
