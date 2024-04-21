class Command {
    execute() {}
    undo() {}
}

class DrawShapeCommand extends Command {
    constructor(shape) {
        // `shape` arg is a ParametricObject object
        super();
        this.shape = shape;
    }
    execute(){
        this.shape.render();
        console.log(`Shape drawn: ${this.shape.type}`);
    }
    undo(){
        this.shape.erase();
        console.log(`Shape erased: ${this.shape.type}`)
    }
}

// Parametric object class:
class ParametricObject {
    constructor(type) {
        this.type = type;
        this.properties = {};
        this.relations = {};
    }
    render(){
        console.log(`Drawing ${this.type} at properties:`, this.properties);
    }
    erase(){
        console.log(`Erasing ${this.type}...`);
    }
    setProperty(name, value){
        this.properties[name] = value;
        this.evalRelations();
    }
    addRelation(relation){
        this.relations.push(relation);
    }
    evalRelations(){
        this.relations.forEach(relation => {relation.evaluate(this)});
    }
}

// Command History for Undo/Redo
class CommandHistory {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    executeCommand(command) {
        let status = command.execute();

        this.undoStack.push(command);
        this.redoStack = [];
    }

    undo() {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        }
    }
}

// Command Processor with a Global Command Map
class CommandProcessor {
    constructor(history) {
        this.history = history;
        this.commandMap = {
            'rectangle': () => new DrawShapeCommand(new ParametricObject('rectangle'))
        };
    }

    executeCommand(commandName) {
        if (commandName in this.commandMap) {
            const command = this.commandMap[commandName]();
            this.history.executeCommand(command);
        } else {
            throw new Error('Command not supported');
        }
    }
}

// Usage
const history = new CommandHistory();
const processor = new CommandProcessor(history);

// Simulating Commands
try {
    processor.executeCommand('rectangle');  // Outputs drawing logs and executes command
    history.undo();  // Should undo the rectangle drawing
    history.redo();  // Should redo the rectangle drawing
} catch (error) {
    console.log(error.message);
}