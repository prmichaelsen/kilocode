"use strict"
// npx vitest core/config/__tests__/CustomModesSettings.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const zod_1 = require("zod")
const types_1 = require("@roo-code/types")
describe("CustomModesSettings", () => {
	const validMode = {
		slug: "123e4567-e89b-12d3-a456-426614174000",
		name: "Test Mode",
		roleDefinition: "Test role definition",
		groups: ["read"],
	}
	describe("schema validation", () => {
		it("accepts valid settings", () => {
			const validSettings = {
				customModes: [validMode],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(validSettings)
			}).not.toThrow()
		})
		it("accepts empty custom modes array", () => {
			const validSettings = {
				customModes: [],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(validSettings)
			}).not.toThrow()
		})
		it("accepts multiple custom modes", () => {
			const validSettings = {
				customModes: [
					validMode,
					{
						...validMode,
						slug: "987fcdeb-51a2-43e7-89ab-cdef01234567",
						name: "Another Mode",
					},
				],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(validSettings)
			}).not.toThrow()
		})
		it("rejects missing customModes field", () => {
			const invalidSettings = {}
			expect(() => {
				types_1.customModesSettingsSchema.parse(invalidSettings)
			}).toThrow(zod_1.ZodError)
		})
		it("rejects invalid mode in array", () => {
			const invalidSettings = {
				customModes: [
					validMode,
					{
						...validMode,
						slug: "not@a@valid@slug", // Invalid slug
					},
				],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(invalidSettings)
			}).toThrow(zod_1.ZodError)
			expect(() => {
				types_1.customModesSettingsSchema.parse(invalidSettings)
			}).toThrow("Slug must contain only letters numbers and dashes")
		})
		it("rejects non-array customModes", () => {
			const invalidSettings = {
				customModes: "not an array",
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(invalidSettings)
			}).toThrow(zod_1.ZodError)
		})
		it("rejects null or undefined", () => {
			expect(() => {
				types_1.customModesSettingsSchema.parse(null)
			}).toThrow(zod_1.ZodError)
			expect(() => {
				types_1.customModesSettingsSchema.parse(undefined)
			}).toThrow(zod_1.ZodError)
		})
		it("rejects duplicate mode slugs", () => {
			const duplicateSettings = {
				customModes: [
					validMode,
					{ ...validMode }, // Same slug
				],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(duplicateSettings)
			}).toThrow("Duplicate mode slugs are not allowed")
		})
		it("rejects invalid group configurations in modes", () => {
			const invalidSettings = {
				customModes: [
					{
						...validMode,
						groups: ["invalid_group"],
					},
				],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(invalidSettings)
			}).toThrow(zod_1.ZodError)
		})
		it("handles multiple groups", () => {
			const validSettings = {
				customModes: [
					{
						...validMode,
						groups: ["read", "edit", "browser"],
					},
				],
			}
			expect(() => {
				types_1.customModesSettingsSchema.parse(validSettings)
			}).not.toThrow()
		})
	})
	describe("type inference", () => {
		it("inferred type includes all required fields", () => {
			const settings = {
				customModes: [validMode],
			}
			// TypeScript compilation will fail if the type is incorrect
			expect(settings.customModes[0].slug).toBeDefined()
			expect(settings.customModes[0].name).toBeDefined()
			expect(settings.customModes[0].roleDefinition).toBeDefined()
			expect(settings.customModes[0].groups).toBeDefined()
		})
		it("inferred type allows optional fields", () => {
			const settings = {
				customModes: [
					{
						...validMode,
						customInstructions: "Optional instructions",
					},
				],
			}
			// TypeScript compilation will fail if the type is incorrect
			expect(settings.customModes[0].customInstructions).toBeDefined()
		})
	})
})
//# sourceMappingURL=CustomModesSettings.spec.js.map
