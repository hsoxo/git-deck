import { describe, it, expect, beforeEach } from 'vitest';
import { RPCValidator } from './RPCValidator';

describe('RPCValidator', () => {
    let validator: RPCValidator;

    beforeEach(() => {
        validator = new RPCValidator();
    });

    describe('register and hasSchema', () => {
        it('should register schema', () => {
            validator.register('test', { params: [] });
            expect(validator.hasSchema('test')).toBe(true);
        });

        it('should return false for unregistered method', () => {
            expect(validator.hasSchema('unknown')).toBe(false);
        });
    });

    describe('validate - basic types', () => {
        it('should validate string parameter', () => {
            validator.register('test', {
                params: [{ type: 'string', required: true }],
            });

            expect(() => validator.validate('test', ['hello'])).not.toThrow();
            expect(() => validator.validate('test', [123])).toThrow('expected string, got number');
        });

        it('should validate number parameter', () => {
            validator.register('test', {
                params: [{ type: 'number', required: true }],
            });

            expect(() => validator.validate('test', [42])).not.toThrow();
            expect(() => validator.validate('test', ['42'])).toThrow('expected number, got string');
        });

        it('should validate boolean parameter', () => {
            validator.register('test', {
                params: [{ type: 'boolean', required: true }],
            });

            expect(() => validator.validate('test', [true])).not.toThrow();
            expect(() => validator.validate('test', [1])).toThrow('expected boolean, got number');
        });

        it('should validate array parameter', () => {
            validator.register('test', {
                params: [{ type: 'array', required: true }],
            });

            expect(() => validator.validate('test', [[1, 2, 3]])).not.toThrow();
            expect(() => validator.validate('test', ['not array'])).toThrow(
                'expected array, got string'
            );
        });

        it('should validate object parameter', () => {
            validator.register('test', {
                params: [{ type: 'object', required: true }],
            });

            expect(() => validator.validate('test', [{ key: 'value' }])).not.toThrow();
            expect(() => validator.validate('test', ['not object'])).toThrow(
                'expected object, got string'
            );
        });
    });

    describe('validate - required/optional', () => {
        it('should require parameters by default', () => {
            validator.register('test', {
                params: [{ type: 'string' }],
            });

            expect(() => validator.validate('test', [])).toThrow('expected at least 1');
        });

        it('should allow optional parameters', () => {
            validator.register('test', {
                params: [
                    { type: 'string', required: true },
                    { type: 'number', required: false },
                ],
            });

            expect(() => validator.validate('test', ['hello'])).not.toThrow();
            expect(() => validator.validate('test', ['hello', 42])).not.toThrow();
        });

        it('should allow null/undefined for optional parameters', () => {
            validator.register('test', {
                params: [{ type: 'string', required: false }],
            });

            expect(() => validator.validate('test', [null])).not.toThrow();
            expect(() => validator.validate('test', [undefined])).not.toThrow();
        });
    });

    describe('validate - string constraints', () => {
        it('should validate minLength', () => {
            validator.register('test', {
                params: [{ type: 'string', minLength: 3 }],
            });

            expect(() => validator.validate('test', ['abc'])).not.toThrow();
            expect(() => validator.validate('test', ['ab'])).toThrow('string too short');
        });

        it('should validate maxLength', () => {
            validator.register('test', {
                params: [{ type: 'string', maxLength: 5 }],
            });

            expect(() => validator.validate('test', ['hello'])).not.toThrow();
            expect(() => validator.validate('test', ['toolong'])).toThrow('string too long');
        });

        it('should validate pattern', () => {
            validator.register('test', {
                params: [{ type: 'string', pattern: /^[a-z]+$/ }],
            });

            expect(() => validator.validate('test', ['abc'])).not.toThrow();
            expect(() => validator.validate('test', ['ABC'])).toThrow('does not match pattern');
        });
    });

    describe('validate - number constraints', () => {
        it('should validate min', () => {
            validator.register('test', {
                params: [{ type: 'number', min: 0 }],
            });

            expect(() => validator.validate('test', [0])).not.toThrow();
            expect(() => validator.validate('test', [-1])).toThrow('number too small');
        });

        it('should validate max', () => {
            validator.register('test', {
                params: [{ type: 'number', max: 100 }],
            });

            expect(() => validator.validate('test', [100])).not.toThrow();
            expect(() => validator.validate('test', [101])).toThrow('number too large');
        });
    });

    describe('validate - array items', () => {
        it('should validate array items', () => {
            validator.register('test', {
                params: [
                    {
                        type: 'array',
                        items: { type: 'string' },
                    },
                ],
            });

            expect(() => validator.validate('test', [['a', 'b', 'c']])).not.toThrow();
            expect(() => validator.validate('test', [['a', 1, 'c']])).toThrow(
                'expected string, got number'
            );
        });
    });

    describe('validate - object properties', () => {
        it('should validate object properties', () => {
            validator.register('test', {
                params: [
                    {
                        type: 'object',
                        properties: {
                            name: { type: 'string', required: true },
                            age: { type: 'number', required: false },
                        },
                    },
                ],
            });

            expect(() => validator.validate('test', [{ name: 'John' }])).not.toThrow();
            expect(() => validator.validate('test', [{ name: 'John', age: 30 }])).not.toThrow();
            expect(() => validator.validate('test', [{ age: 30 }])).toThrow('name is required');
        });
    });

    describe('validate - no schema', () => {
        it('should skip validation if no schema registered', () => {
            expect(() => validator.validate('unknown', ['any', 'params'])).not.toThrow();
        });
    });

    describe('getSchema', () => {
        it('should return registered schema', () => {
            const schema = { params: [{ type: 'string' as const }] };
            validator.register('test', schema);
            expect(validator.getSchema('test')).toEqual(schema);
        });

        it('should return undefined for unregistered method', () => {
            expect(validator.getSchema('unknown')).toBeUndefined();
        });
    });
});
