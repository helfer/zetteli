import {
    ExecutionResult,
} from 'graphql';

const queues: Map<string, Function[]> = new Map();

export default function queuedInvocation<T>(func: Function, idFunc: Function) {
    return function(...args: T[]) {
        const queueId: string = idFunc(...args);
        return new Promise( (resolve, reject) => {
            const dequeue = () => {
                queues[queueId][0]()
                .then((res: ExecutionResult) => {
                    queues[queueId].shift();
                    if (queues[queueId].length > 0) {
                        setTimeout(dequeue, 0);
                    }
                    resolve(res);
                })
                .catch((err: Error) => {
                    queues[queueId].shift();
                    if (queues[queueId].length > 0) {
                        setTimeout(dequeue, 0);
                    }
                    reject(err);
                });
            };
            if (!queues[queueId]) {
                // Initialization
                queues[queueId] = [];
            }
            queues[queueId].push(() => func(...args));
            if (queues[queueId].length === 1) {
                // Must schedule first dequeue
                dequeue();
            }
        });
    };
}