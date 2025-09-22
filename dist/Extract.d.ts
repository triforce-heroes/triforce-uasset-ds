interface Entry {
    id: number;
    idSub: number;
    attribute: Buffer;
    message: string;
}
export declare function extract(data: Buffer): Map<string, Entry>;
export {};
