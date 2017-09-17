export type ID = string | number;

// TODO(helfer): Change return types to always be promises

export interface Connector<T>{
    get(id: ID): PromiseLike<T | undefined> | T | undefined;
    // getMany(id: string[] | number[]): T[];
    // TODO(helfer): Is getAll a good idea?
    getAll(): PromiseLike<T[]> | T[];

    create(obj: T): PromiseLike<ID | undefined> | ID | undefined;
    // createMany(objs: T[]): ID[];
    
    update(obj: T): PromiseLike<boolean> | boolean;
    // updateMany(objs: T[]): boolean;

    delete(id: ID): PromiseLike<boolean> | boolean;
    // deleteMany(ids: ID[]): boolean;
}