const boxstore = require('boxstore');

class Container {
    static addParameter(name, value) {
        const parameters = boxstore.get('parameters');

        parameters[name] = value;
    }

    static addParameters(params) {
        const parameters = boxstore.get('parameters');

        for (const key in params) {
            parameters[key] = params[key];
        }
    }

    static parameter(name, def = null) {
        return boxstore.get(`parameters.${name}`, def);
    }

    static parameters(key = '') {
        return boxstore.get(`parameters${key ? '.' + key : ''}`);
    }

    static search(name) {
        return boxstore.search(name);
    }

    static set(name, service) {
        boxstore.add(name, service);
    }

    static get(name, def = null) {
        return boxstore.get(name, def);
    }

    static has(name) {
        return !!Container.get(name);
    }
}

boxstore.set({
    parameters: {},
}, { immutable: true });

module.exports = Container;
