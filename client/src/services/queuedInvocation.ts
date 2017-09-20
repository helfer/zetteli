const queues: Map<string, Function[]> = new Map();

export default function queuedInvocation(func: Function, idFunc: Function) {
    return function(...args: any[]) {
        const queueId: string = idFunc(...args);
        return new Promise( (resolve, reject) => {
            const dequeue = () => {
                queues[queueId][0]()
                .then((res: any) => {
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