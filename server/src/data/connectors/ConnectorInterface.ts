export type ID = string | number;

export interface Connector<T>{
    get(id: ID): T | undefined;
    // getMany(id: string[] | number[]): T[];
    // TODO(helfer): Is getAll a good idea?
    getAll(): T[];

    create(obj: T): ID | undefined;
    // createMany(objs: T[]): ID[];
    
    update(obj: T): boolean;
    // updateMany(objs: T[]): boolean;

    delete(id: ID): boolean;
    // deleteMany(ids: ID[]): boolean;
}