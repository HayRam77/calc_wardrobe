const Store = {
    state: {
        projects: [],
        cabinets: [],
        currentProject: null,
        currentCabinet: null,
    },
    listeners: [],
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.listeners.forEach(fn => fn(this.state));
    },
    subscribe(fn) {
        this.listeners.push(fn);
    },
    getState() {
        return this.state;
    }
};
window.Store = Store;
