import { logger } from '../utils/Logger';

export interface ParamSchema {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    items?: ParamSchema;
    properties?: Record<string, ParamSchema>;
}

export interface MethodSchema {
    params: ParamSchema[];
}

export class RPCValidator {
    private schemas = new Map<string, MethodSchema>();

    register(method: string, schema: MethodSchema): void {
        this.schemas.set(method, schema);
        logger.debug(`Registered RPC schema: ${method}`);
    }

    validate(method: string, params: any[]): void {
        const schema = this.schemas.get(method);
        if (!schema) {
            return; // No schema = no validation
        }

        if (params.length < schema.params.filter((p) => p.required !== false).length) {
            throw new Error(
                `Invalid parameters for ${method}: expected at least ${schema.params.filter((p) => p.required !== false).length}, got ${params.length}`
            );
        }

        for (let i = 0; i < schema.params.length; i++) {
            const paramSchema = schema.params[i];
            const value = params[i];

            if (value === undefined || value === null) {
                if (paramSchema.required !== false) {
                    throw new Error(`Parameter ${i} is required for ${method}`);
                }
                continue;
            }

            this.validateValue(value, paramSchema, `Parameter ${i}`);
        }
    }

    private validateValue(value: any, schema: ParamSchema, path: string): void {
        // Type check
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== schema.type) {
            throw new Error(`${path}: expected ${schema.type}, got ${actualType}`);
        }

        // String validation
        if (schema.type === 'string') {
            if (schema.minLength !== undefined && value.length < schema.minLength) {
                throw new Error(`${path}: string too short (min: ${schema.minLength})`);
            }
            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                throw new Error(`${path}: string too long (max: ${schema.maxLength})`);
            }
            if (schema.pattern && !schema.pattern.test(value)) {
                throw new Error(`${path}: string does not match pattern`);
            }
        }

        // Number validation
        if (schema.type === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                throw new Error(`${path}: number too small (min: ${schema.min})`);
            }
            if (schema.max !== undefined && value > schema.max) {
                throw new Error(`${path}: number too large (max: ${schema.max})`);
            }
        }

        // Array validation
        if (schema.type === 'array' && schema.items) {
            for (let i = 0; i < value.length; i++) {
                this.validateValue(value[i], schema.items, `${path}[${i}]`);
            }
        }

        // Object validation
        if (schema.type === 'object' && schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (value[key] !== undefined) {
                    this.validateValue(value[key], propSchema, `${path}.${key}`);
                } else if (propSchema.required !== false) {
                    throw new Error(`${path}.${key} is required`);
                }
            }
        }
    }

    hasSchema(method: string): boolean {
        return this.schemas.has(method);
    }

    getSchema(method: string): MethodSchema | undefined {
        return this.schemas.get(method);
    }
}
