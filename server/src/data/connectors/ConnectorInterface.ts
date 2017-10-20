export type ID = string | number;

// TODO(helfer): Change return types to always be promises

// TODO(helfer): update this so it isn't just zetteli specific.
export interface Connector<T>{
    get(id: ID): PromiseLike<T | undefined> | T | undefined;
    // getMany(id: string[] | number[]): T[];
    // TODO(helfer): Is getAll a good idea?
    getAll(sid: string): PromiseLike<T[]> | T[];

    create(sid: string, obj: T): PromiseLike<ID | undefined> | ID | undefined;
    // createMany(objs: T[]): ID[];
    
    update(obj: T): PromiseLike<boolean> | boolean;
    // updateMany(objs: T[]): boolean;

    delete(id: ID): PromiseLike<boolean> | boolean;
    // deleteMany(ids: ID[]): boolean;
}